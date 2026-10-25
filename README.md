# LedgerPay — Secure Payment & Wallet Management System

> **A portfolio-grade fintech wallet management platform and double-entry payment ledger engine built with Java 17 / Spring Boot 3, PostgreSQL, Flyway, React, and TypeScript.**

[![Java 17](https://img.shields.io/badge/Java-17%20%2F%2021-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-17%20Passed-218568)](f:/Aastha/Ledgerpay/backend)

---

## 1. Executive Summary & Product Vision

**LedgerPay** is an enterprise-grade payment and wallet management platform inspired by the core settlement infrastructure of global card networks and financial institutions (such as Visa Direct and Stripe Ledger).

Traditional fintech tutorials and amateur projects update wallet balances with arbitrary SQL updates (`UPDATE wallets SET balance = balance - 100`). In real-world payment infrastructure, balance updates are **cached aggregates derived from an immutable double-entry ledger**. Every fund movement must be atomic, idempotent, auditable, and mathematically balanced across debit and credit entries.

### Key Capabilities

- **Atomic Inter-Wallet Settlements**: Transfers execute inside an isolated `@Transactional` database boundary with pessimistic row locking.
- **Strict Double-Entry Bookkeeping**: Every completed transfer generates exactly one `DEBIT` entry and one `CREDIT` entry. An assertion verifies $\sum \text{Debits} \equiv \sum \text{Credits}$ before committing.
- **Deterministic Concurrency & Deadlock Prevention**: Row locks are acquired in ascending ID order (`min(id), max(id)`), completely eliminating database deadlock cycles between bidirectional concurrent transfers.
- **Database-Level Idempotency**: Client-supplied `Idempotency-Key` headers are uniquely constrained at the database layer per sender wallet, ensuring repeated calls return identical results without double-spending.
- **Rule-Based Fraud Detection**: Real-time evaluation of velocity spikes (>5 transfers/min), large value transfers (>$10,000 threshold), and repeated failures.
- **Sliding-Window Rate Limiting**: In-memory rate limiting (60 req/min) returning HTTP 429 upon quota exhaustion.
- **Enterprise Design Direction**: A restrained corporate aesthetic using a disciplined palette (Navy `#172B4D`, Slate `#344563`, Cool Gray `#F4F6F8`, Muted Green `#218568`, Amber `#B7791F`, Crimson `#C2414B`), compact high-density data tables, and zero decorative fluff.

---

## 2. Architecture Overview

### High-Level System Architecture

```mermaid
flowchart TD
    Client["Client Browser<br/>(React 18 + Vite + TypeScript)"]
    API["Spring Boot 3.3 REST API<br/>(Port 8080)"]
    AuthFilter["JwtAuthenticationFilter<br/>(Stateless Bearer Tokens)"]
    RateLimiter["RateLimiterService<br/>(Sliding Window Token Bucket)"]
    TransferSvc["TransferService<br/>(@Transactional Core Engine)"]
    FraudSvc["FraudDetectionService<br/>(Velocity & Threshold Rules)"]
    PessimisticLock["Pessimistic Row Lock<br/>(SELECT ... FOR UPDATE in Ascending ID)"]
    Postgres[("PostgreSQL 16 Database<br/>(Flyway Migrations V1-V4)")]

    Client -->|Bearer JWT + Idempotency-Key| API
    API --> AuthFilter
    AuthFilter --> RateLimiter
    RateLimiter --> TransferSvc
    TransferSvc --> FraudSvc
    TransferSvc --> PessimisticLock
    PessimisticLock --> Postgres
```

### End-to-End Transfer Settlement Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Alice as Sender (Alice)
    participant API as TransferController
    participant Svc as TransferService
    participant Fraud as FraudDetectionService
    participant DB as PostgreSQL 16
    actor Bob as Recipient (Bob)

    Alice->>API: POST /api/transfers [Idempotency-Key: UUID, Amount: $200.00]
    API->>Svc: createTransfer("alice@ledgerpay.demo", req, key)
    Svc->>DB: Check existing (sender_wallet_id, idempotency_key)
    alt Idempotency Hit (Same Key & Same Amount)
        DB-->>Svc: Found existing Transfer record
        Svc-->>API: Return existing transfer (No money moved)
        API-->>Alice: 200 OK (Cached Receipt)
    else Idempotency Conflict (Same Key & Different Amount)
        Svc-->>API: Throw IdempotencyConflictException
        API-->>Alice: 409 Conflict Error
    else New Transfer Request
        Svc->>Fraud: checkAll(senderWalletId, amount)
        Fraud-->>Svc: FraudCheckResults (Flags if >5 tx/min or >$10k)
        Note over Svc,DB: Acquire locks in Ascending ID Order to avoid deadlocks
        Svc->>DB: SELECT * FROM wallets WHERE id = min(1, 2) FOR UPDATE
        Svc->>DB: SELECT * FROM wallets WHERE id = max(1, 2) FOR UPDATE
        Svc->>Svc: Verify balance >= requested amount ($1000.00 >= $200.00)
        Svc->>DB: Deduct $200.00 from Alice (Balance: $800.00)
        Svc->>DB: Add $200.00 to Bob (Balance: $700.00)
        Svc->>DB: INSERT INTO ledger_entries (wallet_id=1, DEBIT, $200.00)
        Svc->>DB: INSERT INTO ledger_entries (wallet_id=2, CREDIT, $200.00)
        Svc->>Svc: Assert: debitAmount == creditAmount
        Svc->>DB: INSERT INTO transfers (status='COMPLETED' or 'FLAGGED')
        DB-->>Svc: Commit Transaction
        Svc-->>API: TransferResponse (UUID Ref, Balances, Entries)
        API-->>Alice: 201 Created
    end
```

---

## 3. Core Financial Engineering Decisions

### 3.1. Why Double-Entry Bookkeeping?

In standard single-entry ledgers, an account balance is simply a number in a database column. If a software bug, concurrent collision, or hardware failure occurs during an update, money can literally vanish or be created out of thin air with no audit trail.

LedgerPay strictly enforces **Double-Entry Bookkeeping**:
1. Every economic transaction involves two or more accounts.
2. For every transfer, the total amount debited must equal the total amount credited:
   $$\sum \text{Debits} = \sum \text{Credits}$$
3. The table `ledger_entries` is **immutable**: rows are append-only. No `UPDATE` or `DELETE` statements are ever executed against the ledger.
4. An explicit code assertion in [`TransferService.java`](f:/Aastha/Ledgerpay/backend/src/main/java/com/ledgerpay/service/TransferService.java#L190-L196) verifies that the debit amount equals the credit amount before allowing the transaction to commit.

### 3.2. Concurrency Control & Deadlock Prevention

Consider a scenario where:
- Thread 1 processes Alice transferring \$50 to Bob (needs write locks on Wallet 1 and Wallet 2).
- Simultaneously, Thread 2 processes Bob transferring \$30 to Alice (needs write locks on Wallet 2 and Wallet 1).

If Thread 1 locks Wallet 1 first, while Thread 2 locks Wallet 2 first, a classic **deadlock** occurs in the database engine.

**LedgerPay's Solution:**
LedgerPay implements **Deterministic Ascending Row-Lock Acquisition**:

```java
Long lowId  = Math.min(senderWalletRef.getId(), recipientWalletRef.getId());
Long highId = Math.max(senderWalletRef.getId(), recipientWalletRef.getId());

// Always lock the lower ID first, regardless of transfer direction
Wallet lowWallet  = walletRepository.findByIdWithLock(lowId);
Wallet highWallet = walletRepository.findByIdWithLock(highId);
```

Because all transactions lock resources in identical numerical order, cyclic lock-wait graphs cannot form. Concurrency is safe and race conditions attempting to overspend the same wallet balance are fully serialized.

### 3.3. Database-Enforced Idempotency

Network timeouts and client retry loops frequently duplicate requests. LedgerPay requires clients to submit an `Idempotency-Key` header (typically a client-generated UUID v4) with every transfer.

1. **Database Constraint**: A unique partial index enforces uniqueness:
   ```sql
   CREATE UNIQUE INDEX idx_transfers_idempotency 
   ON transfers(sender_wallet_id, idempotency_key) 
   WHERE idempotency_key IS NOT NULL;
   ```
2. **Replay Protection**: If the same key is submitted with the **same transfer parameters**, LedgerPay immediately returns the original completed transfer receipt without re-executing money movement.
3. **Conflict Detection**: If the same key is reused with **different parameters** (e.g. attempting to send \$500 instead of \$200), LedgerPay rejects the request with HTTP `409 Conflict`.

### 3.4. Numeric Precision

All monetary calculations use PostgreSQL `NUMERIC(19, 4)` and Java `java.math.BigDecimal`. Floating-point types (`float`, `double`, and JavaScript binary floating point) are strictly banned from financial logic to eliminate IEEE-754 precision drift.

---

## 4. Database Schema & Migration Strategy

Database migrations are managed using **Flyway**:

```
backend/src/main/resources/db/migration/
├── V1__create_users_wallets.sql     # Users and Wallets with CHECK constraints
├── V2__create_transfers_ledger.sql  # Transfers, Idempotency Index, Ledger Entries
├── V3__create_fraud_flags.sql       # Fraud Flag records
└── V4__seed_demo_data.sql           # 5 Demo accounts & 15 balanced transfers
```

### Relational Schema Diagram

```mermaid
erDiagram
    users ||--o| wallets : owns
    wallets ||--o{ transfers : "sender / recipient"
    transfers ||--|{ ledger_entries : generates
    transfers ||--o{ fraud_flags : flags

    users {
        bigserial id PK
        varchar name
        varchar email UK
        varchar password_hash
        timestamptz created_at
    }

    wallets {
        bigserial id PK
        bigint user_id FK, UK
        varchar currency
        numeric balance "CHECK (balance >= 0)"
        varchar status
        timestamptz created_at
    }

    transfers {
        bigserial id PK
        varchar reference UK
        bigint sender_wallet_id FK
        bigint recipient_wallet_id FK
        numeric amount "CHECK (amount > 0)"
        varchar currency
        text description
        varchar status
        varchar idempotency_key
        timestamptz created_at
    }

    ledger_entries {
        bigserial id PK
        bigint transfer_id FK
        bigint wallet_id FK
        varchar entry_type "DEBIT | CREDIT"
        numeric amount "CHECK (amount > 0)"
        timestamptz created_at
    }

    fraud_flags {
        bigserial id PK
        bigint transfer_id FK
        varchar rule_code
        text reason
        timestamptz created_at
    }
```

---

## 5. REST API Documentation

### Base URL: `http://localhost:8080/api`

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/auth/login` | `POST` | Public | Authenticates user; returns JWT token & user info |
| `/auth/me` | `GET` | User | Validates token and returns current session details |
| `/wallet` | `GET` | User | Retrieves current user's wallet balance and status |
| `/wallet/transactions` | `GET` | User | Searchable, paginated transaction history |
| `/transfers` | `POST` | User | Executes an atomic money transfer (Supports `Idempotency-Key`) |
| `/transfers` | `GET` | User | Paginated list of transfers involving the current user |
| `/transfers/{id}` | `GET` | User | Single transfer details with associated ledger entries |
| `/ledger/entries` | `GET` | User | Paginated immutable ledger entries for user's wallet |
| `/ledger/entries/{id}` | `GET` | User | Inspect a specific ledger entry |
| `/ledger/summary` | `GET` | User | Aggregate debit/credit totals and entry counts |

### Sample Request: Execute Transfer

```http
POST /api/transfers HTTP/1.1
Host: localhost:8080
Authorization: Bearer <JWT_TOKEN>
Idempotency-Key: 9f12d5e2-45e6-42d4-a82f-2c7c5d31cb01
Content-Type: application/json

{
  "recipientEmail": "bob@ledgerpay.demo",
  "amount": 250.00,
  "description": "Consulting retainer payment"
}
```

### Sample Response (201 Created)

```json
{
  "id": 16,
  "reference": "6f2e82f1-2856-4c48-b4b1-8408f65eb56e",
  "senderEmail": "alice@ledgerpay.demo",
  "recipientEmail": "bob@ledgerpay.demo",
  "amount": 250.0000,
  "currency": "USD",
  "description": "Consulting retainer payment",
  "status": "COMPLETED",
  "fraudFlags": [],
  "ledgerEntries": [
    {
      "id": 31,
      "transferReference": "6f2e82f1-2856-4c48-b4b1-8408f65eb56e",
      "walletOwnerName": "Alice Chen",
      "entryType": "DEBIT",
      "amount": 250.0000,
      "currency": "USD",
      "createdAt": "2026-10-24T10:48:40.118+05:30"
    },
    {
      "id": 32,
      "transferReference": "6f2e82f1-2856-4c48-b4b1-8408f65eb56e",
      "walletOwnerName": "Bob Martinez",
      "entryType": "CREDIT",
      "amount": 250.0000,
      "currency": "USD",
      "createdAt": "2026-10-24T10:48:40.118+05:30"
    }
  ],
  "createdAt": "2026-10-24T10:48:40.115+05:30"
}
```

---

## 6. Demo Accounts (Local Sandbox)

The database migration seeds 5 demo accounts with pre-calculated, balanced transfer histories. The default password for all demo accounts is **`demo1234`**.

| Name | Email | Initial Balance | Role |
|---|---|---|---|
| **Alice Chen** | `alice@ledgerpay.demo` | \$12,500.00 | Primary Demo Account |
| **Bob Martinez** | `bob@ledgerpay.demo` | \$3,200.00 | Counterparty Account |
| **Carol Singh** | `carol@ledgerpay.demo` | \$8,750.00 | Enterprise Merchant |
| **David Kim** | `david@ledgerpay.demo` | \$500.00 | Low-Balance Account (Overdraft testing) |
| **Eve Thompson** | `eve@ledgerpay.demo` | \$15,000.00 | High-Volume Account |

---

## 7. Automated Testing Suite

The backend includes a comprehensive automated test suite verifying financial edge cases, idempotency guarantees, concurrency edge cases, and fraud detection.

### Test Execution Summary (17 Tests Passed)

```text
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.ledgerpay.controller.AuthControllerTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0 (AuthControllerTest)
[INFO] Running com.ledgerpay.service.FraudDetectionServiceTest
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0 (FraudDetectionServiceTest)
[INFO] Running com.ledgerpay.service.TransferServiceTest
[INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0 (TransferServiceTest)
[INFO] 
[INFO] Results:
[INFO] Tests run: 17, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

### Critical Scenarios Verified

- [x] **`successfulTransfer_updatesBothBalances_createsLedgerEntries`**: Validates that both balances update and exactly two ledger records (`DEBIT` and `CREDIT`) are generated with equal values.
- [x] **`insufficientFunds_throwsException_noBalanceChange`**: Asserts that an overdraft attempt throws `InsufficientFundsException` and aborts before ledger generation.
- [x] **`sameWallet_throwsTransferValidationException`**: Prevents users from transferring funds to their own wallet.
- [x] **`nonExistentRecipient_throwsResourceNotFoundException`**: Verifies handling of invalid counterparty accounts.
- [x] **`negativeAmount_throwsValidationException`**: Rejects negative or zero amount transfers.
- [x] **`duplicateIdempotencyKey_returnsSameResult`**: Ensures re-submitting an identical transfer returns the original result without moving money a second time.
- [x] **`differentRequestSameKey_throwsIdempotencyConflictException`**: Rejects reuse of an idempotency key with conflicting transfer parameters.
- [x] **`fraudRuleTriggered_setsTransferFlaggedStatus`**: Flags transfers exceeding velocity or threshold limits while preserving ledger records.
- [x] **`rateLimit_triggers_afterFiveTransfersInOneMinute`**: Verifies velocity fraud checks.
- [x] **`largeTransfer_triggers_aboveThreshold`**: Flags transfers greater than \$10,000.

To execute tests locally:
```bash
cd backend
mvn test
```

---

## 8. Local Setup Instructions (Windows)

### Prerequisites

- **Java Development Kit (JDK 17 or 21)**
- **Apache Maven 3.8+**
- **Node.js (v18+) & npm**
- **Docker Desktop** (or a local PostgreSQL 15+ installation)

---

### Step 1: Start PostgreSQL

From the project root:
```powershell
docker compose up -d
```

Verify PostgreSQL is running on port `5432`:
```powershell
docker ps
```

---

### Step 2: Configure Environment Variables

Copy `.env.example` to `.env`:
```powershell
cp .env.example .env
```

Default credentials:
```properties
DB_URL=jdbc:postgresql://localhost:5432/ledgerpay
DB_USERNAME=ledgerpay
DB_PASSWORD=ledgerpay_secret
JWT_SECRET=your-256-bit-secret-key-for-ledgerpay-dev-only-change-in-prod
```

---

### Step 3: Run the Spring Boot Backend

```powershell
cd f:\Aastha\Ledgerpay\backend
mvn spring-boot:run
```

*Flyway will automatically apply migrations `V1` through `V4`, initializing all tables and demo accounts.*

Backend health check:
```powershell
curl http://localhost:8080/actuator/health
# {"status":"UP"}
```

---

### Step 4: Run the React Frontend

Open a second terminal window:
```powershell
cd f:\Aastha\Ledgerpay\frontend
npm run dev
```

Navigate to `http://localhost:5173` in your browser. Click **"Alice Chen"** on the sign-in screen to instantly log into the demo sandbox!

---

## 9. Known Limitations & Production Roadmap

1. **Distributed Locks**: In a horizontally autoscaled microservices architecture spanning multiple database clusters or regions, row-level database locking can be augmented with a distributed locking protocol (e.g. Redlock or Two-Phase Commit).
2. **Multi-Currency FX Ledger**: The current implementation standardizes on USD. A production multi-currency system requires an FX exchange-rate service with unrealized gain/loss ledger balancing accounts.
3. **Outbox Pattern & Event Streaming**: For asynchronous notification downstream (e.g., fraud analyst webhooks or mobile push notifications), a Transactional Outbox table publishing events to Kafka would decouple write paths from asynchronous event consumers.
4. **Hardware Security Modules (HSM)**: In payment card production environments (PCI-DSS compliance), symmetric keys and token signatures are protected by FIPS 140-2 Level 3 HSM appliances.
