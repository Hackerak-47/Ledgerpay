package com.ledgerpay.service;

import com.ledgerpay.repository.TransferRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FraudDetectionServiceTest {

    @Mock
    private TransferRepository transferRepository;

    @InjectMocks
    private FraudDetectionService fraudDetectionService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(fraudDetectionService, "maxTransfersPerMinute", 5);
        ReflectionTestUtils.setField(fraudDetectionService, "largeTransferThreshold", new BigDecimal("10000.00"));
    }

    @Test
    @DisplayName("Rate limit triggers when transfer count reaches or exceeds 5 in 1 minute")
    void rateLimit_triggers_afterFiveTransfersInOneMinute() {
        when(transferRepository.countBySenderWalletIdAndCreatedAtAfter(eq(1L), any(OffsetDateTime.class)))
                .thenReturn(5L);

        FraudDetectionService.FraudCheckResult result = fraudDetectionService.checkRateLimit(1L);

        assertTrue(result.triggered());
        assertEquals("RATE_LIMIT_EXCEEDED", result.ruleCode());
        assertTrue(result.reason().contains("limit: 5"));
    }

    @Test
    @DisplayName("Rate limit does not trigger when transfer count is below threshold")
    void rateLimit_passes_whenUnderThreshold() {
        when(transferRepository.countBySenderWalletIdAndCreatedAtAfter(eq(1L), any(OffsetDateTime.class)))
                .thenReturn(2L);

        FraudDetectionService.FraudCheckResult result = fraudDetectionService.checkRateLimit(1L);

        assertFalse(result.triggered());
    }

    @Test
    @DisplayName("Large transfer rule triggers when amount exceeds $10,000 threshold")
    void largeTransfer_triggers_aboveThreshold() {
        BigDecimal amount = new BigDecimal("10000.01");

        FraudDetectionService.FraudCheckResult result = fraudDetectionService.checkLargeTransfer(amount);

        assertTrue(result.triggered());
        assertEquals("LARGE_TRANSFER", result.ruleCode());
    }

    @Test
    @DisplayName("Large transfer rule passes when amount is at or below threshold")
    void largeTransfer_passes_whenAtOrBelowThreshold() {
        BigDecimal amount = new BigDecimal("10000.00");

        FraudDetectionService.FraudCheckResult result = fraudDetectionService.checkLargeTransfer(amount);

        assertFalse(result.triggered());
    }

    @Test
    @DisplayName("Repeated failures rule triggers when failed count > 3")
    void repeatedFailures_triggers_whenMoreThanThreeFailed() {
        when(transferRepository.countFailedBySenderWalletIdAndCreatedAtAfter(eq(1L), any(OffsetDateTime.class)))
                .thenReturn(4L);

        FraudDetectionService.FraudCheckResult result = fraudDetectionService.checkRepeatedFailures(1L);

        assertTrue(result.triggered());
        assertEquals("REPEATED_FAILURES", result.ruleCode());
    }

    @Test
    @DisplayName("checkAll returns all triggered rules properly")
    void checkAll_detectsMultipleTriggers() {
        when(transferRepository.countBySenderWalletIdAndCreatedAtAfter(eq(1L), any(OffsetDateTime.class)))
                .thenReturn(6L);
        when(transferRepository.countFailedBySenderWalletIdAndCreatedAtAfter(eq(1L), any(OffsetDateTime.class)))
                .thenReturn(0L);

        List<FraudDetectionService.FraudCheckResult> results = fraudDetectionService.checkAll(1L, new BigDecimal("15000.00"));

        assertTrue(fraudDetectionService.hasTriggered(results));
        List<FraudDetectionService.FraudCheckResult> triggered = fraudDetectionService.getTriggered(results);
        assertEquals(2, triggered.size());
    }
}
