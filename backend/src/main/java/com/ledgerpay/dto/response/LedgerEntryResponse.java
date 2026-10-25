package com.ledgerpay.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LedgerEntryResponse {
    private Long id;
    private String transferReference;
    private String walletOwnerName;
    private String entryType;
    private BigDecimal amount;
    private String currency;
    private OffsetDateTime createdAt;
}
