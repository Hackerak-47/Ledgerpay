package com.ledgerpay.service;

import com.ledgerpay.dto.response.LedgerEntryResponse;
import com.ledgerpay.dto.response.LedgerSummaryResponse;
import com.ledgerpay.dto.response.PagedResponse;
import com.ledgerpay.entity.LedgerEntry;
import com.ledgerpay.entity.Wallet;
import com.ledgerpay.exception.ResourceNotFoundException;
import com.ledgerpay.repository.LedgerEntryRepository;
import com.ledgerpay.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class LedgerService {

    private final LedgerEntryRepository ledgerEntryRepository;
    private final WalletRepository walletRepository;

    @Transactional(readOnly = true)
    public PagedResponse<LedgerEntryResponse> getLedgerEntries(String email, int page, int size, Long transferId) {
        Wallet wallet = walletRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for user: " + email));

        Page<LedgerEntry> entryPage;
        if (transferId != null) {
            entryPage = ledgerEntryRepository.findByWalletIdAndTransferId(
                    wallet.getId(), transferId, PageRequest.of(page, size));
        } else {
            entryPage = ledgerEntryRepository.findByWalletId(
                    wallet.getId(), PageRequest.of(page, size));
        }

        Page<LedgerEntryResponse> responsePage = entryPage.map(this::mapToResponse);

        return PagedResponse.<LedgerEntryResponse>builder()
                .content(responsePage.getContent())
                .page(page)
                .size(size)
                .totalElements(responsePage.getTotalElements())
                .totalPages(responsePage.getTotalPages())
                .first(responsePage.isFirst())
                .last(responsePage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public LedgerEntryResponse getLedgerEntryById(String email, Long entryId) {
        Wallet wallet = walletRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for user: " + email));

        LedgerEntry entry = ledgerEntryRepository.findByIdAndWalletId(entryId, wallet.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Ledger entry " + entryId + " not found for your wallet."));

        return mapToResponse(entry);
    }

    @Transactional(readOnly = true)
    public LedgerSummaryResponse getLedgerSummary(String email) {
        Wallet wallet = walletRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for user: " + email));

        BigDecimal totalDebits  = ledgerEntryRepository.sumDebitsByWalletId(wallet.getId());
        BigDecimal totalCredits = ledgerEntryRepository.sumCreditsByWalletId(wallet.getId());
        long entryCount         = ledgerEntryRepository.countByWalletId(wallet.getId());

        return LedgerSummaryResponse.builder()
                .totalDebits(totalDebits != null ? totalDebits : BigDecimal.ZERO)
                .totalCredits(totalCredits != null ? totalCredits : BigDecimal.ZERO)
                .entryCount(entryCount)
                .currency(wallet.getCurrency())
                .build();
    }

    private LedgerEntryResponse mapToResponse(LedgerEntry entry) {
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
