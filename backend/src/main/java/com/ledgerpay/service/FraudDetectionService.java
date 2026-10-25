package com.ledgerpay.service;

import com.ledgerpay.repository.TransferRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class FraudDetectionService {

    private final TransferRepository transferRepository;

    @Value("${fraud.max-transfers-per-minute:5}")
    private int maxTransfersPerMinute;

    @Value("${fraud.large-transfer-threshold:10000}")
    private BigDecimal largeTransferThreshold;

    public record FraudCheckResult(String ruleCode, String reason, boolean triggered) {}

    public List<FraudCheckResult> checkAll(Long senderWalletId, BigDecimal amount) {
        List<FraudCheckResult> results = new ArrayList<>();

        results.add(checkRateLimit(senderWalletId));
        results.add(checkLargeTransfer(amount));
        results.add(checkRepeatedFailures(senderWalletId));

        return results;
    }

    public FraudCheckResult checkRateLimit(Long senderWalletId) {
        OffsetDateTime oneMinuteAgo = OffsetDateTime.now().minusSeconds(60);
        long count = transferRepository.countBySenderWalletIdAndCreatedAtAfter(senderWalletId, oneMinuteAgo);

        if (count >= maxTransfersPerMinute) {
            String reason = String.format(
                    "Sender wallet %d made %d transfers in the last 60 seconds (limit: %d).",
                    senderWalletId, count, maxTransfersPerMinute);
            log.warn("[FRAUD] RATE_LIMIT_EXCEEDED: {}", reason);
            return new FraudCheckResult("RATE_LIMIT_EXCEEDED", reason, true);
        }
        return new FraudCheckResult("RATE_LIMIT_EXCEEDED", "Rate limit not exceeded.", false);
    }

    public FraudCheckResult checkLargeTransfer(BigDecimal amount) {
        if (amount.compareTo(largeTransferThreshold) > 0) {
            String reason = String.format(
                    "Transfer amount %s exceeds large-transfer threshold of %s.",
                    amount.toPlainString(), largeTransferThreshold.toPlainString());
            log.warn("[FRAUD] LARGE_TRANSFER: {}", reason);
            return new FraudCheckResult("LARGE_TRANSFER", reason, true);
        }
        return new FraudCheckResult("LARGE_TRANSFER", "Amount within threshold.", false);
    }

    public FraudCheckResult checkRepeatedFailures(Long senderWalletId) {
        OffsetDateTime oneHourAgo = OffsetDateTime.now().minusHours(1);
        long failedCount = transferRepository.countFailedBySenderWalletIdAndCreatedAtAfter(senderWalletId, oneHourAgo);

        if (failedCount > 3) {
            String reason = String.format(
                    "Sender wallet %d has %d failed transfers in the last hour (threshold: 3).",
                    senderWalletId, failedCount);
            log.warn("[FRAUD] REPEATED_FAILURES: {}", reason);
            return new FraudCheckResult("REPEATED_FAILURES", reason, true);
        }
        return new FraudCheckResult("REPEATED_FAILURES", "No repeated failures detected.", false);
    }

    public boolean hasTriggered(List<FraudCheckResult> results) {
        return results.stream().anyMatch(FraudCheckResult::triggered);
    }

    public List<FraudCheckResult> getTriggered(List<FraudCheckResult> results) {
        return results.stream().filter(FraudCheckResult::triggered).toList();
    }
}
