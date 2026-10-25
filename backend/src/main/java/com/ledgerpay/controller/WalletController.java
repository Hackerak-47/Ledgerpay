package com.ledgerpay.controller;

import com.ledgerpay.dto.response.PagedResponse;
import com.ledgerpay.dto.response.TransactionResponse;
import com.ledgerpay.dto.response.WalletResponse;
import com.ledgerpay.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
@Slf4j
public class WalletController {

    private final WalletService walletService;

    @GetMapping
    public ResponseEntity<WalletResponse> getWallet(@AuthenticationPrincipal UserDetails userDetails) {
        WalletResponse response = walletService.getWallet(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/transactions")
    public ResponseEntity<PagedResponse<TransactionResponse>> getTransactions(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String direction,
            @RequestParam(required = false) String status) {

        PagedResponse<TransactionResponse> response = walletService.getTransactions(
                userDetails.getUsername(), page, size, search, direction, status);
        return ResponseEntity.ok(response);
    }
}
