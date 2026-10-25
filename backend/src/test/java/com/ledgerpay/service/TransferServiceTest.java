package com.ledgerpay.service;

import com.ledgerpay.dto.request.TransferRequest;
import com.ledgerpay.dto.response.TransferResponse;
import com.ledgerpay.entity.LedgerEntry;
import com.ledgerpay.entity.Transfer;
import com.ledgerpay.entity.User;
import com.ledgerpay.entity.Wallet;
import com.ledgerpay.exception.IdempotencyConflictException;
import com.ledgerpay.exception.InsufficientFundsException;
import com.ledgerpay.exception.ResourceNotFoundException;
import com.ledgerpay.exception.TransferValidationException;
import com.ledgerpay.repository.FraudFlagRepository;
import com.ledgerpay.repository.LedgerEntryRepository;
import com.ledgerpay.repository.TransferRepository;
import com.ledgerpay.repository.WalletRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransferServiceTest {

    @Mock
    private WalletRepository walletRepository;

    @Mock
    private TransferRepository transferRepository;

    @Mock
    private LedgerEntryRepository ledgerEntryRepository;

    @Mock
    private FraudFlagRepository fraudFlagRepository;

    @Mock
    private FraudDetectionService fraudDetectionService;

    @InjectMocks
    private TransferService transferService;

    private User senderUser;
    private User recipientUser;
    private Wallet senderWallet;
    private Wallet recipientWallet;

    @BeforeEach
    void setUp() {
        senderUser = User.builder()
                .id(1L)
                .name("Aarav Sharma")
                .email("aarav@ledgerpay.in")
                .build();

        recipientUser = User.builder()
                .id(2L)
                .name("Priya Patel")
                .email("priya@ledgerpay.in")
                .build();

        senderWallet = Wallet.builder()
                .id(1L)
                .user(senderUser)
                .currency("INR")
                .balance(new BigDecimal("1000.0000"))
                .status(Wallet.WalletStatus.ACTIVE)
                .sentTransfers(new ArrayList<>())
                .receivedTransfers(new ArrayList<>())
                .build();

        recipientWallet = Wallet.builder()
                .id(2L)
                .user(recipientUser)
                .currency("INR")
                .balance(new BigDecimal("500.0000"))
                .status(Wallet.WalletStatus.ACTIVE)
                .sentTransfers(new ArrayList<>())
                .receivedTransfers(new ArrayList<>())
                .build();
    }

    @Test
    @DisplayName("Successful transfer updates both balances and creates double-entry ledger records")
    void successfulTransfer_updatesBothBalances_createsLedgerEntries() {
        TransferRequest request = new TransferRequest();
        request.setRecipientEmail("priya@ledgerpay.in");
        request.setAmount(new BigDecimal("200.0000"));
        request.setDescription("Dinner payment");

        when(walletRepository.findByUserEmail("aarav@ledgerpay.in")).thenReturn(Optional.of(senderWallet));
        when(walletRepository.findByUserEmail("priya@ledgerpay.in")).thenReturn(Optional.of(recipientWallet));
        when(walletRepository.findByIdWithLock(1L)).thenReturn(Optional.of(senderWallet));
        when(walletRepository.findByIdWithLock(2L)).thenReturn(Optional.of(recipientWallet));

        when(fraudDetectionService.checkAll(eq(1L), any(BigDecimal.class))).thenReturn(List.of());
        when(fraudDetectionService.hasTriggered(any())).thenReturn(false);

        when(transferRepository.save(any(Transfer.class))).thenAnswer(invocation -> {
            Transfer t = invocation.getArgument(0);
            t.setId(101L);
            return t;
        });

        TransferResponse response = transferService.createTransfer("aarav@ledgerpay.in", request, null);

        assertNotNull(response);
        assertEquals(Transfer.TransferStatus.COMPLETED.name(), response.getStatus());
        assertEquals(new BigDecimal("200.0000"), response.getAmount());

        assertEquals(new BigDecimal("800.0000"), senderWallet.getBalance());
        assertEquals(new BigDecimal("700.0000"), recipientWallet.getBalance());

        ArgumentCaptor<LedgerEntry> ledgerCaptor = ArgumentCaptor.forClass(LedgerEntry.class);
        verify(ledgerEntryRepository, times(2)).save(ledgerCaptor.capture());

        List<LedgerEntry> entries = ledgerCaptor.getAllValues();
        assertEquals(2, entries.size());

        LedgerEntry debit = entries.stream().filter(e -> e.getEntryType() == LedgerEntry.EntryType.DEBIT).findFirst().orElseThrow();
        LedgerEntry credit = entries.stream().filter(e -> e.getEntryType() == LedgerEntry.EntryType.CREDIT).findFirst().orElseThrow();

        assertEquals(new BigDecimal("200.0000"), debit.getAmount());
        assertEquals(new BigDecimal("200.0000"), credit.getAmount());
        assertEquals(senderWallet.getId(), debit.getWallet().getId());
        assertEquals(recipientWallet.getId(), credit.getWallet().getId());
    }

    @Test
    @DisplayName("Insufficient funds throws InsufficientFundsException and does not change balances")
    void insufficientFunds_throwsException_noBalanceChange() {
        TransferRequest request = new TransferRequest();
        request.setRecipientEmail("priya@ledgerpay.in");
        request.setAmount(new BigDecimal("1500.0000"));

        when(walletRepository.findByUserEmail("aarav@ledgerpay.in")).thenReturn(Optional.of(senderWallet));
        when(walletRepository.findByUserEmail("priya@ledgerpay.in")).thenReturn(Optional.of(recipientWallet));
        when(walletRepository.findByIdWithLock(1L)).thenReturn(Optional.of(senderWallet));
        when(walletRepository.findByIdWithLock(2L)).thenReturn(Optional.of(recipientWallet));

        assertThrows(InsufficientFundsException.class, () ->
                transferService.createTransfer("aarav@ledgerpay.in", request, null));

        assertEquals(new BigDecimal("1000.0000"), senderWallet.getBalance());
        assertEquals(new BigDecimal("500.0000"), recipientWallet.getBalance());
        verify(ledgerEntryRepository, never()).save(any());
    }

    @Test
    @DisplayName("Transfer to same wallet throws TransferValidationException")
    void sameWallet_throwsTransferValidationException() {
        TransferRequest request = new TransferRequest();
        request.setRecipientEmail("aarav@ledgerpay.in");
        request.setAmount(new BigDecimal("50.0000"));

        when(walletRepository.findByUserEmail("aarav@ledgerpay.in")).thenReturn(Optional.of(senderWallet));

        assertThrows(TransferValidationException.class, () ->
                transferService.createTransfer("aarav@ledgerpay.in", request, null));
    }

    @Test
    @DisplayName("Transfer to nonexistent recipient throws ResourceNotFoundException")
    void nonExistentRecipient_throwsResourceNotFoundException() {
        TransferRequest request = new TransferRequest();
        request.setRecipientEmail("unknown@ledgerpay.demo");
        request.setAmount(new BigDecimal("50.0000"));

        when(walletRepository.findByUserEmail("aarav@ledgerpay.in")).thenReturn(Optional.of(senderWallet));
        when(walletRepository.findByUserEmail("unknown@ledgerpay.demo")).thenReturn(Optional.ofNullable(null));

        assertThrows(ResourceNotFoundException.class, () ->
                transferService.createTransfer("aarav@ledgerpay.in", request, null));
    }

    @Test
    @DisplayName("Negative or zero amount throws TransferValidationException")
    void negativeAmount_throwsValidationException() {
        TransferRequest request = new TransferRequest();
        request.setRecipientEmail("priya@ledgerpay.in");
        request.setAmount(new BigDecimal("-10.0000"));

        when(walletRepository.findByUserEmail("aarav@ledgerpay.in")).thenReturn(Optional.of(senderWallet));
        when(walletRepository.findByUserEmail("priya@ledgerpay.in")).thenReturn(Optional.of(recipientWallet));

        assertThrows(TransferValidationException.class, () ->
                transferService.createTransfer("aarav@ledgerpay.in", request, null));
    }

    @Test
    @DisplayName("Duplicate idempotency key with same request returns original result without re-processing")
    void duplicateIdempotencyKey_returnsSameResult() {
        String key = "idem-key-12345";
        TransferRequest request = new TransferRequest();
        request.setRecipientEmail("priya@ledgerpay.in");
        request.setAmount(new BigDecimal("100.0000"));

        Transfer existingTransfer = Transfer.builder()
                .id(42L)
                .reference("ref-42")
                .senderWallet(senderWallet)
                .recipientWallet(recipientWallet)
                .amount(new BigDecimal("100.0000"))
                .currency("USD")
                .status(Transfer.TransferStatus.COMPLETED)
                .idempotencyKey(key)
                .ledgerEntries(new ArrayList<>())
                .fraudFlags(new ArrayList<>())
                .build();

        when(walletRepository.findByUserEmail("aarav@ledgerpay.in")).thenReturn(Optional.of(senderWallet));
        when(transferRepository.findBySenderWalletIdAndIdempotencyKey(1L, key))
                .thenReturn(Optional.of(existingTransfer));

        TransferResponse response = transferService.createTransfer("aarav@ledgerpay.in", request, key);

        assertNotNull(response);
        assertEquals("ref-42", response.getReference());
        verify(walletRepository, never()).findByIdWithLock(any());
        verify(ledgerEntryRepository, never()).save(any());
    }

    @Test
    @DisplayName("Same idempotency key with different amount throws IdempotencyConflictException")
    void differentRequestSameKey_throwsIdempotencyConflictException() {
        String key = "idem-key-conflict";
        TransferRequest request = new TransferRequest();
        request.setRecipientEmail("priya@ledgerpay.in");
        request.setAmount(new BigDecimal("200.0000"));

        Transfer existingTransfer = Transfer.builder()
                .id(42L)
                .senderWallet(senderWallet)
                .amount(new BigDecimal("100.0000"))
                .currency("USD")
                .idempotencyKey(key)
                .build();

        when(walletRepository.findByUserEmail("aarav@ledgerpay.in")).thenReturn(Optional.of(senderWallet));
        when(transferRepository.findBySenderWalletIdAndIdempotencyKey(1L, key))
                .thenReturn(Optional.of(existingTransfer));

        assertThrows(IdempotencyConflictException.class, () ->
                transferService.createTransfer("aarav@ledgerpay.in", request, key));
    }

    @Test
    @DisplayName("Fraud rule trigger sets transfer status to FLAGGED")
    void fraudRuleTriggered_setsTransferFlaggedStatus() {
        TransferRequest request = new TransferRequest();
        request.setRecipientEmail("priya@ledgerpay.in");
        request.setAmount(new BigDecimal("12000.0000"));
        senderWallet.setBalance(new BigDecimal("20000.0000"));

        when(walletRepository.findByUserEmail("aarav@ledgerpay.in")).thenReturn(Optional.of(senderWallet));
        when(walletRepository.findByUserEmail("priya@ledgerpay.in")).thenReturn(Optional.of(recipientWallet));
        when(walletRepository.findByIdWithLock(1L)).thenReturn(Optional.of(senderWallet));
        when(walletRepository.findByIdWithLock(2L)).thenReturn(Optional.of(recipientWallet));

        FraudDetectionService.FraudCheckResult fraudResult =
                new FraudDetectionService.FraudCheckResult("LARGE_TRANSFER", "Over limit", true);

        when(fraudDetectionService.checkAll(eq(1L), any(BigDecimal.class))).thenReturn(List.of(fraudResult));
        when(fraudDetectionService.hasTriggered(any())).thenReturn(true);
        when(fraudDetectionService.getTriggered(any())).thenReturn(List.of(fraudResult));

        when(transferRepository.save(any(Transfer.class))).thenAnswer(invocation -> {
            Transfer t = invocation.getArgument(0);
            t.setId(102L);
            return t;
        });

        TransferResponse response = transferService.createTransfer("aarav@ledgerpay.in", request, null);

        assertNotNull(response);
        assertEquals(Transfer.TransferStatus.FLAGGED.name(), response.getStatus());
        verify(fraudFlagRepository, times(1)).save(any());
        verify(ledgerEntryRepository, times(2)).save(any());
    }
}
