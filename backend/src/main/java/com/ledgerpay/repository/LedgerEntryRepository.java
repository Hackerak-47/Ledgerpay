package com.ledgerpay.repository;

import com.ledgerpay.entity.LedgerEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, Long> {

    @Query("SELECT le FROM LedgerEntry le WHERE le.wallet.id = :walletId ORDER BY le.createdAt DESC")
    Page<LedgerEntry> findByWalletId(@Param("walletId") Long walletId, Pageable pageable);

    @Query("SELECT le FROM LedgerEntry le WHERE le.wallet.id = :walletId " +
           "AND (:transferId IS NULL OR le.transfer.id = :transferId) ORDER BY le.createdAt DESC")
    Page<LedgerEntry> findByWalletIdAndTransferId(@Param("walletId") Long walletId,
                                                  @Param("transferId") Long transferId,
                                                  Pageable pageable);

    @Query("SELECT le FROM LedgerEntry le WHERE le.transfer.id = :transferId")
    List<LedgerEntry> findByTransferId(@Param("transferId") Long transferId);

    @Query("SELECT COALESCE(SUM(le.amount), 0) FROM LedgerEntry le WHERE le.wallet.id = :walletId " +
           "AND le.entryType = 'DEBIT'")
    BigDecimal sumDebitsByWalletId(@Param("walletId") Long walletId);

    @Query("SELECT COALESCE(SUM(le.amount), 0) FROM LedgerEntry le WHERE le.wallet.id = :walletId " +
           "AND le.entryType = 'CREDIT'")
    BigDecimal sumCreditsByWalletId(@Param("walletId") Long walletId);

    @Query("SELECT COUNT(le) FROM LedgerEntry le WHERE le.wallet.id = :walletId")
    long countByWalletId(@Param("walletId") Long walletId);

    Optional<LedgerEntry> findByIdAndWalletId(Long id, Long walletId);
}
