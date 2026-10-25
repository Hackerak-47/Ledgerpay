package com.ledgerpay.controller;

import com.ledgerpay.dto.request.TransferRequest;
import com.ledgerpay.dto.response.PagedResponse;
import com.ledgerpay.dto.response.TransferResponse;
import com.ledgerpay.entity.Transfer;
import com.ledgerpay.service.RateLimiterService;
import com.ledgerpay.service.TransferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transfers")
@RequiredArgsConstructor
@Slf4j
public class TransferController {

    private final TransferService transferService;
    private final RateLimiterService rateLimiterService;

    @PostMapping
    public ResponseEntity<TransferResponse> createTransfer(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody TransferRequest request) {

        rateLimiterService.enforce(userDetails.getUsername());

        TransferResponse response = transferService.createTransfer(
                userDetails.getUsername(), request, idempotencyKey);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<PagedResponse<TransferResponse>> getTransfers(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<Transfer> transferPage = transferService.getTransfers(userDetails.getUsername(), page, size);
        List<TransferResponse> responses = transferPage.getContent().stream()
                .map(transferService::mapToTransferResponse)
                .toList();

        PagedResponse<TransferResponse> pagedResponse = PagedResponse.<TransferResponse>builder()
                .content(responses)
                .page(page)
                .size(size)
                .totalElements(transferPage.getTotalElements())
                .totalPages(transferPage.getTotalPages())
                .first(transferPage.isFirst())
                .last(transferPage.isLast())
                .build();

        return ResponseEntity.ok(pagedResponse);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransferResponse> getTransferById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {

        Transfer transfer = transferService.getTransferById(userDetails.getUsername(), id);
        return ResponseEntity.ok(transferService.mapToTransferResponse(transfer));
    }
}
