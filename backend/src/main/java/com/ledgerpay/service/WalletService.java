package com.ledgerpay.service;

import com.ledgerpay.dto.response.TransactionResponse;
import com.ledgerpay.dto.response.WalletResponse;
import com.ledgerpay.dto.response.PagedResponse;
import com.ledgerpay.entity.Transfer;
import com.ledgerpay.entity.Transfer.TransferStatus;
import com.ledgerpay.entity.Wallet;
import com.ledgerpay.exception.ResourceNotFoundException;
import com.ledgerpay.repository.TransferRepository;
import com.ledgerpay.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletService {

    private final WalletRepository walletRepository;
    private final TransferRepository transferRepository;

    @Transactional(readOnly = true)
    public WalletResponse getWallet(String email) {
        Wallet wallet = walletRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for user: " + email));

        return mapToWalletResponse(wallet);
    }

    @Transactional(readOnly = true)
    public PagedResponse<TransactionResponse> getTransactions(String email, int page, int size,
                                                               String search, String direction,
                                                               String statusStr) {
        Wallet wallet = walletRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for user: " + email));

        Pageable pageable = PageRequest.of(page, size);
        TransferStatus status = parseStatus(statusStr);

        Page<Transfer> transferPage;
        if (StringUtils.hasText(search) || status != null) {
            transferPage = transferRepository.findByWalletIdWithFilters(
                    wallet.getId(), search, status, pageable);
        } else {
            transferPage = transferRepository.findAllByWalletId(wallet.getId(), pageable);
        }

        Page<TransactionResponse> responsePage = transferPage.map(t ->
                mapToTransactionResponse(t, wallet.getId(), direction));

        if (StringUtils.hasText(direction)) {
            String dir = direction.toUpperCase();
            if ("INCOMING".equals(dir) || "OUTGOING".equals(dir)) {
                java.util.List<TransactionResponse> filtered = responsePage.getContent().stream()
                        .filter(tr -> tr.getDirection().equals(dir))
                        .toList();
                return PagedResponse.<TransactionResponse>builder()
                        .content(filtered)
                        .page(page)
                        .size(size)
                        .totalElements(responsePage.getTotalElements())
                        .totalPages(responsePage.getTotalPages())
                        .first(responsePage.isFirst())
                        .last(responsePage.isLast())
                        .build();
            }
        }

        return PagedResponse.<TransactionResponse>builder()
                .content(responsePage.getContent())
                .page(page)
                .size(size)
                .totalElements(responsePage.getTotalElements())
                .totalPages(responsePage.getTotalPages())
                .first(responsePage.isFirst())
                .last(responsePage.isLast())
                .build();
    }

    private TransactionResponse mapToTransactionResponse(Transfer transfer, Long currentWalletId,
                                                          String directionFilter) {
        boolean isOutgoing = transfer.getSenderWallet().getId().equals(currentWalletId);
        String direction = isOutgoing ? "OUTGOING" : "INCOMING";

        String counterpartyName;
        String counterpartyEmail;
        if (isOutgoing) {
            counterpartyName = transfer.getRecipientWallet().getUser().getName();
            counterpartyEmail = transfer.getRecipientWallet().getUser().getEmail();
        } else {
            counterpartyName = transfer.getSenderWallet().getUser().getName();
            counterpartyEmail = transfer.getSenderWallet().getUser().getEmail();
        }

        return TransactionResponse.builder()
                .id(transfer.getId())
                .reference(transfer.getReference())
                .counterpartyName(counterpartyName)
                .counterpartyEmail(counterpartyEmail)
                .direction(direction)
                .amount(transfer.getAmount())
                .currency(transfer.getCurrency())
                .status(transfer.getStatus().name())
                .createdAt(transfer.getCreatedAt())
                .description(transfer.getDescription())
                .build();
    }

    public WalletResponse mapToWalletResponse(Wallet wallet) {
        return WalletResponse.builder()
                .id(wallet.getId())
                .currency(wallet.getCurrency())
                .balance(wallet.getBalance())
                .status(wallet.getStatus().name())
                .ownerName(wallet.getUser().getName())
                .ownerEmail(wallet.getUser().getEmail())
                .build();
    }

    private TransferStatus parseStatus(String status) {
        if (!StringUtils.hasText(status)) return null;
        try {
            return TransferStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
