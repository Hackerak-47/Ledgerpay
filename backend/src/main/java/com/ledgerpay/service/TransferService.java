package com.ledgerpay.service;

import com.ledgerpay.dto.request.TransferRequest;
import com.ledgerpay.dto.response.LedgerEntryResponse;
import com.ledgerpay.dto.response.TransferResponse;
import com.ledgerpay.entity.FraudFlag;
import com.ledgerpay.entity.LedgerEntry;
import com.ledgerpay.entity.LedgerEntry.EntryType;
import com.ledgerpay.entity.Transfer;
import com.ledgerpay.entity.Transfer.TransferStatus;
import com.ledgerpay.entity.Wallet;
import com.ledgerpay.exception.IdempotencyConflictException;
import com.ledgerpay.exception.InsufficientFundsException;
import com.ledgerpay.exception.ResourceNotFoundException;
import com.ledgerpay.exception.TransferValidationException;
import com.ledgerpay.repository.FraudFlagRepository;
import com.ledgerpay.repository.LedgerEntryRepository;
import com.ledgerpay.repository.TransferRepository;
import com.ledgerpay.repository.WalletRepository;
import com.ledgerpay.service.FraudDetectionService.FraudCheckResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransferService {

    private final WalletRepository walletRepository;
    private final TransferRepository transferRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final FraudFlagRepository fraudFlagRepository;
    private final FraudDetectionService fraudDetectionService;

    @Transactional
    public TransferResponse createTransfer(String senderEmail,
                                           TransferRequest request,
                                           String idempotencyKey) {

        Wallet senderWalletRef = walletRepository.findByUserEmail(senderEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Sender wallet not found."));

        if (StringUtils.hasText(idempotencyKey)) {
            Optional<Transfer> existing = transferRepository
                    .findBySenderWalletIdAndIdempotencyKey(senderWalletRef.getId(), idempotencyKey);

            if (existing.isPresent()) {
                Transfer t = existing.get();
                if (t.getAmount().compareTo(request.getAmount()) == 0) {
                    log.info("Idempotency hit for key {}: returning existing transfer {}", idempotencyKey, t.getReference());
                    return mapToTransferResponse(t);
                }
                throw new IdempotencyConflictException(
                        "Idempotency key '" + idempotencyKey + "' was already used for a transfer of "
                        + t.getAmount() + " " + t.getCurrency() + ". Cannot reuse with a different amount.");
            }
        }

        Wallet recipientWalletRef = walletRepository.findByUserEmail(request.getRecipientEmail())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No wallet found for recipient: " + request.getRecipientEmail()));

        if (senderWalletRef.getId().equals(recipientWalletRef.getId())) {
            throw new TransferValidationException("Cannot transfer to your own wallet.");
        }

        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new TransferValidationException("Transfer amount must be greater than zero.");
        }

        Long lowId  = Math.min(senderWalletRef.getId(), recipientWalletRef.getId());
        Long highId = Math.max(senderWalletRef.getId(), recipientWalletRef.getId());

        Wallet lowWallet  = walletRepository.findByIdWithLock(lowId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found: " + lowId));
        Wallet highWallet = walletRepository.findByIdWithLock(highId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found: " + highId));

        Wallet senderWallet    = senderWalletRef.getId().equals(lowId) ? lowWallet : highWallet;
        Wallet recipientWallet = senderWalletRef.getId().equals(lowId) ? highWallet : lowWallet;

        if (senderWallet.getStatus() != Wallet.WalletStatus.ACTIVE) {
            throw new TransferValidationException("Sender wallet is not active.");
        }

        if (senderWallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new InsufficientFundsException(
                    "Insufficient funds. Available: " + senderWallet.getBalance()
                    + ", Requested: " + request.getAmount());
        }

        List<FraudCheckResult> fraudResults = fraudDetectionService.checkAll(
                senderWallet.getId(), request.getAmount());
        boolean isFlagged = fraudDetectionService.hasTriggered(fraudResults);

        String reference = UUID.randomUUID().toString();
        Transfer transfer = Transfer.builder()
                .reference(reference)
                .senderWallet(senderWallet)
                .recipientWallet(recipientWallet)
                .amount(request.getAmount())
                .currency(senderWallet.getCurrency())
                .description(request.getDescription())
                .status(isFlagged ? TransferStatus.FLAGGED : TransferStatus.PENDING)
                .idempotencyKey(StringUtils.hasText(idempotencyKey) ? idempotencyKey : null)
                .build();

        transfer = transferRepository.save(transfer);

        if (isFlagged) {
            List<FraudCheckResult> triggered = fraudDetectionService.getTriggered(fraudResults);
            for (FraudCheckResult result : triggered) {
                FraudFlag flag = FraudFlag.builder()
                        .transfer(transfer)
                        .ruleCode(result.ruleCode())
                        .reason(result.reason())
                        .build();
                fraudFlagRepository.save(flag);
            }
            log.warn("[FRAUD] Transfer {} flagged for: {}", reference,
                    triggered.stream().map(FraudCheckResult::ruleCode).toList());
        }

        senderWallet.setBalance(senderWallet.getBalance().subtract(request.getAmount()));
        recipientWallet.setBalance(recipientWallet.getBalance().add(request.getAmount()));
        walletRepository.save(senderWallet);
        walletRepository.save(recipientWallet);

        LedgerEntry debitEntry = LedgerEntry.builder()
                .transfer(transfer)
                .wallet(senderWallet)
                .entryType(EntryType.DEBIT)
                .amount(request.getAmount())
                .build();

        LedgerEntry creditEntry = LedgerEntry.builder()
                .transfer(transfer)
                .wallet(recipientWallet)
                .entryType(EntryType.CREDIT)
                .amount(request.getAmount())
                .build();

        ledgerEntryRepository.save(debitEntry);
        ledgerEntryRepository.save(creditEntry);

        if (debitEntry.getAmount().compareTo(creditEntry.getAmount()) != 0) {
            throw new IllegalStateException(
                    "Ledger imbalance detected: debit=" + debitEntry.getAmount()
                    + " credit=" + creditEntry.getAmount() + ". Transaction rolled back.");
        }

        if (!isFlagged) {
            transfer.setStatus(TransferStatus.COMPLETED);
        } else {
            transfer.setStatus(TransferStatus.FLAGGED);
        }
        transfer = transferRepository.save(transfer);

        log.info("Transfer {} completed: {} {} from wallet {} to wallet {}",
                reference, request.getAmount(), senderWallet.getCurrency(),
                senderWallet.getId(), recipientWallet.getId());

        return mapToTransferResponse(transfer);
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<Transfer> getTransfers(String email, int page, int size) {
        Wallet wallet = walletRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for user: " + email));
        return transferRepository.findAllByWalletId(wallet.getId(), PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public Transfer getTransferById(String email, Long transferId) {
        Wallet wallet = walletRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for user: " + email));

        Transfer transfer = transferRepository.findById(transferId)
                .orElseThrow(() -> new ResourceNotFoundException("Transfer not found: " + transferId));

        boolean isSender    = transfer.getSenderWallet().getId().equals(wallet.getId());
        boolean isRecipient = transfer.getRecipientWallet().getId().equals(wallet.getId());
        if (!isSender && !isRecipient) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You do not have permission to view this transfer.");
        }

        return transfer;
    }

    public TransferResponse mapToTransferResponse(Transfer transfer) {
        List<LedgerEntryResponse> ledgerResponses = transfer.getLedgerEntries().stream()
                .map(this::mapToLedgerEntryResponse)
                .toList();

        List<TransferResponse.FraudFlagResponse> flagResponses = transfer.getFraudFlags().stream()
                .map(f -> TransferResponse.FraudFlagResponse.builder()
                        .id(f.getId())
                        .ruleCode(f.getRuleCode())
                        .reason(f.getReason())
                        .createdAt(f.getCreatedAt())
                        .build())
                .toList();

        return TransferResponse.builder()
                .id(transfer.getId())
                .reference(transfer.getReference())
                .senderEmail(transfer.getSenderWallet().getUser().getEmail())
                .recipientEmail(transfer.getRecipientWallet().getUser().getEmail())
                .amount(transfer.getAmount())
                .currency(transfer.getCurrency())
                .description(transfer.getDescription())
                .status(transfer.getStatus().name())
                .fraudFlags(flagResponses)
                .ledgerEntries(ledgerResponses)
                .createdAt(transfer.getCreatedAt())
                .build();
    }

    private LedgerEntryResponse mapToLedgerEntryResponse(LedgerEntry entry) {
        return LedgerEntryResponse.builder()
                .id(entry.getId())
                .transferReference(entry.getTransfer().getReference())
                .walletOwnerName(entry.getWallet().getUser().getName())
                .entryType(entry.getEntryType().name())
                .amount(entry.getAmount())
                .currency(entry.getWallet().getCurrency())
                .createdAt(entry.getCreatedAt())
                .build();
    }
}
