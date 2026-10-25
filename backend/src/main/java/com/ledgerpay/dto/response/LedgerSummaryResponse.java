package com.ledgerpay.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LedgerSummaryResponse {
    private BigDecimal totalDebits;
    private BigDecimal totalCredits;
    private long entryCount;
    private String currency;
}
