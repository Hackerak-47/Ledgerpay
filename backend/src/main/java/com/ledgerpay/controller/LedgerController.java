package com.ledgerpay.controller;

import com.ledgerpay.dto.response.LedgerEntryResponse;
import com.ledgerpay.dto.response.LedgerSummaryResponse;
import com.ledgerpay.dto.response.PagedResponse;
import com.ledgerpay.service.LedgerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ledger")
@RequiredArgsConstructor
@Slf4j
public class LedgerController {

    private final LedgerService ledgerService;

    @GetMapping("/entries")
    public ResponseEntity<PagedResponse<LedgerEntryResponse>> getLedgerEntries(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Long transferId) {

        PagedResponse<LedgerEntryResponse> response = ledgerService.getLedgerEntries(
                userDetails.getUsername(), page, size, transferId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/entries/{id}")
    public ResponseEntity<LedgerEntryResponse> getLedgerEntryById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {

        LedgerEntryResponse response = ledgerService.getLedgerEntryById(userDetails.getUsername(), id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/summary")
    public ResponseEntity<LedgerSummaryResponse> getLedgerSummary(
            @AuthenticationPrincipal UserDetails userDetails) {

        LedgerSummaryResponse response = ledgerService.getLedgerSummary(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
