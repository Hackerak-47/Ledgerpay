package com.ledgerpay.config;

import com.ledgerpay.entity.LedgerEntry;
import com.ledgerpay.entity.Transfer;
import com.ledgerpay.entity.User;
import com.ledgerpay.entity.Wallet;
import com.ledgerpay.repository.LedgerEntryRepository;
import com.ledgerpay.repository.TransferRepository;
import com.ledgerpay.repository.UserRepository;
import com.ledgerpay.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Component
@Profile("local")
@RequiredArgsConstructor
@Slf4j
public class LocalDataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final TransferRepository transferRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }

        log.info("Seeding LedgerPay demo database with Indian accounts and INR currency...");

        String passwordHash = passwordEncoder.encode("demo1234");

        User aarav = createUser("Aarav Sharma", "aarav@ledgerpay.in", passwordHash);
        User priya = createUser("Priya Patel", "priya@ledgerpay.in", passwordHash);
        User rohan = createUser("Rohan Verma", "rohan@ledgerpay.in", passwordHash);
        User neha = createUser("Neha Gupta", "neha@ledgerpay.in", passwordHash);
        User vikram = createUser("Vikram Malhotra", "vikram@ledgerpay.in", passwordHash);

        Wallet wAarav = createWallet(aarav, new BigDecimal("75000.0000"));
        Wallet wPriya = createWallet(priya, new BigDecimal("45000.0000"));
        Wallet wRohan = createWallet(rohan, new BigDecimal("60000.0000"));
        Wallet wNeha = createWallet(neha, new BigDecimal("15000.0000"));
        Wallet wVikram = createWallet(vikram, new BigDecimal("120000.0000"));

        seedTransfer(wAarav, wPriya, new BigDecimal("5000.0000"), "Flat rent contribution", 29);
        seedTransfer(wAarav, wRohan, new BigDecimal("8500.0000"), "Freelance web design milestone", 27);
        seedTransfer(wPriya, wRohan, new BigDecimal("1200.0000"), "Chai and team snacks split", 25);
        seedTransfer(wRohan, wNeha, new BigDecimal("2500.0000"), "Swiggy dinner reimbursement", 23);
        seedTransfer(wVikram, wAarav, new BigDecimal("15000.0000"), "Consulting retainer payment", 21);
        seedTransfer(wAarav, wRohan, new BigDecimal("3200.0000"), "WiFi and utility bill split", 19);
        seedTransfer(wPriya, wVikram, new BigDecimal("4000.0000"), "Concert tickets booking", 17);
        seedTransfer(wRohan, wPriya, new BigDecimal("2200.0000"), "Groceries share", 15);
        seedTransfer(wNeha, wAarav, new BigDecimal("1500.0000"), "Book purchase refund", 13);
        seedTransfer(wVikram, wRohan, new BigDecimal("6000.0000"), "Software subscription share", 11);
        seedTransfer(wAarav, wPriya, new BigDecimal("3500.0000"), "Diwali gift transfer", 9);
        seedTransfer(wRohan, wVikram, new BigDecimal("7500.0000"), "Weekend road-trip advance", 7);
        seedTransfer(wPriya, wNeha, new BigDecimal("1800.0000"), "Movie and dinner split", 5);
        seedTransfer(wVikram, wAarav, new BigDecimal("4500.0000"), "Gym membership share", 3);
        seedTransfer(wAarav, wVikram, new BigDecimal("8000.0000"), "Gadget purchase settlement", 1);

        log.info("LedgerPay demo data loaded: 5 Indian accounts, 15 transfers, 30 ledger entries in INR.");
    }

    private User createUser(String name, String email, String passwordHash) {
        User user = User.builder()
                .name(name)
                .email(email)
                .passwordHash(passwordHash)
                .createdAt(OffsetDateTime.now().minusDays(60))
                .build();
        return userRepository.save(user);
    }

    private Wallet createWallet(User user, BigDecimal balance) {
        Wallet wallet = Wallet.builder()
                .user(user)
                .currency("INR")
                .balance(balance)
                .status(Wallet.WalletStatus.ACTIVE)
                .createdAt(OffsetDateTime.now().minusDays(60))
                .build();
        return walletRepository.save(wallet);
    }

    private void seedTransfer(Wallet sender, Wallet recipient, BigDecimal amount, String desc, int daysAgo) {
        OffsetDateTime timestamp = OffsetDateTime.now().minusDays(daysAgo);

        Transfer transfer = Transfer.builder()
                .reference(UUID.randomUUID().toString())
                .senderWallet(sender)
                .recipientWallet(recipient)
                .amount(amount)
                .currency("INR")
                .description(desc)
                .status(Transfer.TransferStatus.COMPLETED)
                .createdAt(timestamp)
                .build();
        transfer = transferRepository.save(transfer);

        LedgerEntry debit = LedgerEntry.builder()
                .transfer(transfer)
                .wallet(sender)
                .entryType(LedgerEntry.EntryType.DEBIT)
                .amount(amount)
                .createdAt(timestamp)
                .build();

        LedgerEntry credit = LedgerEntry.builder()
                .transfer(transfer)
                .wallet(recipient)
                .entryType(LedgerEntry.EntryType.CREDIT)
                .amount(amount)
                .createdAt(timestamp)
                .build();

        ledgerEntryRepository.save(debit);
        ledgerEntryRepository.save(credit);
    }
}
