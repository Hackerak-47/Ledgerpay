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
public class TransactionResponse {
    private Long id;
    private String reference;
    private String counterpartyName;
    private String counterpartyEmail;
    private String direction; // INCOMING or OUTGOING
    private BigDecimal amount;
    private String currency;
    private String status;
    private OffsetDateTime createdAt;
    private String description;
}
