package com.ledgerpay.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferResponse {
    private Long id;
    private String reference;
    private String senderEmail;
    private String recipientEmail;
    private BigDecimal amount;
    private String currency;
    private String description;
    private String status;
    private List<FraudFlagResponse> fraudFlags;
    private List<LedgerEntryResponse> ledgerEntries;
    private OffsetDateTime createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FraudFlagResponse {
        private Long id;
        private String ruleCode;
        private String reason;
        private OffsetDateTime createdAt;
    }
}
