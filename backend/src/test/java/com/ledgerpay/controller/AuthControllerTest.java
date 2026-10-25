package com.ledgerpay.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ledgerpay.dto.request.LoginRequest;
import com.ledgerpay.dto.request.RegisterRequest;
import com.ledgerpay.dto.response.AuthResponse;
import com.ledgerpay.security.JwtTokenProvider;
import com.ledgerpay.service.AuthService;
import com.ledgerpay.service.RateLimiterService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private RateLimiterService rateLimiterService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserDetailsService userDetailsService;

    @Test
    @DisplayName("POST /api/auth/login returns 200 and AuthResponse on valid credentials")
    void login_returnsAuthResponse_onValidCredentials() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("aarav@ledgerpay.in");
        request.setPassword("demo1234");

        AuthResponse response = AuthResponse.builder()
                .token("jwt.mock.token")
                .tokenType("Bearer")
                .expiresIn(3600000L)
                .email("aarav@ledgerpay.in")
                .name("Aarav Sharma")
                .walletId(1L)
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt.mock.token"))
                .andExpect(jsonPath("$.email").value("aarav@ledgerpay.in"))
                .andExpect(jsonPath("$.name").value("Aarav Sharma"));
    }

    @Test
    @DisplayName("POST /api/auth/register returns 201 and creates new user with wallet")
    void register_returnsCreated_onValidRequest() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setName("Kavita Iyer");
        request.setEmail("kavita@custom.in");
        request.setPassword("securePass123");

        AuthResponse response = AuthResponse.builder()
                .token("jwt.new.token")
                .tokenType("Bearer")
                .expiresIn(3600000L)
                .email("kavita@custom.in")
                .name("Kavita Iyer")
                .walletId(6L)
                .build();

        when(authService.register(any(RegisterRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("jwt.new.token"))
                .andExpect(jsonPath("$.email").value("kavita@custom.in"))
                .andExpect(jsonPath("$.name").value("Kavita Iyer"));
    }

    @Test
    @DisplayName("POST /api/auth/login returns 400 when email is invalid")
    void login_returnsBadRequest_onInvalidEmail() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("not-an-email");
        request.setPassword("demo1234");

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "aarav@ledgerpay.in")
    @DisplayName("GET /api/auth/me returns current user details")
    void getCurrentUser_returnsUserDetails() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("aarav@ledgerpay.in"));
    }
}
