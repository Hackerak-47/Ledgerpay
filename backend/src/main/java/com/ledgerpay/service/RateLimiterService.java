package com.ledgerpay.service;

import com.ledgerpay.exception.RateLimitExceededException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class RateLimiterService {

    @Value("${rate-limit.requests-per-minute:60}")
    private int requestsPerMinute;

    private final ConcurrentHashMap<String, Deque<Long>> requestTimestamps = new ConcurrentHashMap<>();

    public boolean isAllowed(String clientId) {
        long now = System.currentTimeMillis();
        long windowStart = now - 60_000L;

        Deque<Long> timestamps = requestTimestamps.computeIfAbsent(clientId, k -> new ArrayDeque<>());

        synchronized (timestamps) {
            while (!timestamps.isEmpty() && timestamps.peekFirst() < windowStart) {
                timestamps.pollFirst();
            }

            if (timestamps.size() >= requestsPerMinute) {
                log.warn("Rate limit exceeded for client: {}", clientId);
                return false;
            }

            timestamps.addLast(now);
            return true;
        }
    }

    public void enforce(String clientId) {
        if (!isAllowed(clientId)) {
            throw new RateLimitExceededException(
                    "Rate limit exceeded: maximum " + requestsPerMinute + " requests per minute allowed.");
        }
    }
}
