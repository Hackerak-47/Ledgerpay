package com.ledgerpay.repository;

import com.ledgerpay.entity.Transfer;
import com.ledgerpay.entity.Transfer.TransferStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransferRepository extends JpaRepository<Transfer, Long> {

    Optional<Transfer> findByReference(String reference);

    @Query("SELECT t FROM Transfer t WHERE t.senderWallet.id = :walletId AND t.idempotencyKey = :key")
    Optional<Transfer> findBySenderWalletIdAndIdempotencyKey(@Param("walletId") Long walletId,
                                                              @Param("key") String key);

    @Query("SELECT t FROM Transfer t WHERE t.senderWallet.id = :walletId OR t.recipientWallet.id = :walletId " +
           "ORDER BY t.createdAt DESC")
    Page<Transfer> findAllByWalletId(@Param("walletId") Long walletId, Pageable pageable);

    @Query("SELECT t FROM Transfer t WHERE (t.senderWallet.id = :walletId OR t.recipientWallet.id = :walletId) " +
           "AND (:status IS NULL OR t.status = :status) ORDER BY t.createdAt DESC")
    Page<Transfer> findAllByWalletIdAndStatus(@Param("walletId") Long walletId,
                                              @Param("status") TransferStatus status,
                                              Pageable pageable);

    @Query("SELECT COUNT(t) FROM Transfer t WHERE t.senderWallet.id = :walletId " +
           "AND t.createdAt >= :since")
    long countBySenderWalletIdAndCreatedAtAfter(@Param("walletId") Long walletId,
                                                @Param("since") OffsetDateTime since);

    @Query("SELECT COUNT(t) FROM Transfer t WHERE t.senderWallet.id = :walletId " +
           "AND t.status = 'FAILED' AND t.createdAt >= :since")
    long countFailedBySenderWalletIdAndCreatedAtAfter(@Param("walletId") Long walletId,
                                                      @Param("since") OffsetDateTime since);

    @Query("SELECT t FROM Transfer t WHERE (t.senderWallet.id = :walletId OR t.recipientWallet.id = :walletId) " +
           "AND (:search IS NULL OR :search = '' OR LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:status IS NULL OR t.status = :status) " +
           "ORDER BY t.createdAt DESC")
    Page<Transfer> findByWalletIdWithFilters(@Param("walletId") Long walletId,
                                             @Param("search") String search,
                                             @Param("status") TransferStatus status,
                                             Pageable pageable);
}
