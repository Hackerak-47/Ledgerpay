package com.ledgerpay.service;

import com.ledgerpay.dto.request.LoginRequest;
import com.ledgerpay.dto.request.RegisterRequest;
import com.ledgerpay.dto.response.AuthResponse;
import com.ledgerpay.entity.User;
import com.ledgerpay.entity.Wallet;
import com.ledgerpay.exception.TransferValidationException;
import com.ledgerpay.repository.UserRepository;
import com.ledgerpay.repository.WalletRepository;
import com.ledgerpay.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().trim().toLowerCase(), request.getPassword())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String token = jwtTokenProvider.generateToken(userDetails);

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found after authentication"));

        Wallet wallet = walletRepository.findByUserId(user.getId()).orElse(null);

        log.info("User {} logged in successfully", user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(3600000L)
                .email(user.getEmail())
                .name(user.getName())
                .walletId(wallet != null ? wallet.getId() : null)
                .build();
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new TransferValidationException("An account with email " + normalizedEmail + " already exists.");
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .createdAt(OffsetDateTime.now())
                .build();
        user = userRepository.save(user);

        BigDecimal startingBalance = request.getInitialDeposit() != null && request.getInitialDeposit().compareTo(BigDecimal.ZERO) > 0
                ? request.getInitialDeposit()
                : new BigDecimal("50000.0000");

        Wallet wallet = Wallet.builder()
                .user(user)
                .currency("INR")
                .balance(startingBalance)
                .status(Wallet.WalletStatus.ACTIVE)
                .createdAt(OffsetDateTime.now())
                .build();
        wallet = walletRepository.save(wallet);

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPasswordHash(),
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );

        String token = jwtTokenProvider.generateToken(userDetails);

        log.info("Registered new user {} with wallet id {} and starting balance ₹{}",
                user.getEmail(), wallet.getId(), startingBalance);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(3600000L)
                .email(user.getEmail())
                .name(user.getName())
                .walletId(wallet.getId())
                .build();
    }
}
