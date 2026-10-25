CREATE TABLE transfers (
    id BIGSERIAL PRIMARY KEY,
    reference VARCHAR(36) UNIQUE NOT NULL,
    sender_wallet_id BIGINT NOT NULL REFERENCES wallets(id),
    recipient_wallet_id BIGINT NOT NULL REFERENCES wallets(id),
    amount NUMERIC(19,4) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    idempotency_key VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT transfers_amount_positive CHECK (amount > 0),
    CONSTRAINT transfers_status_valid CHECK (status IN ('PENDING','COMPLETED','FAILED','FLAGGED')),
    CONSTRAINT transfers_different_wallets CHECK (sender_wallet_id != recipient_wallet_id)
);

CREATE UNIQUE INDEX idx_transfers_reference ON transfers(reference);
CREATE UNIQUE INDEX idx_transfers_idempotency ON transfers(sender_wallet_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_transfers_sender ON transfers(sender_wallet_id, created_at DESC);
CREATE INDEX idx_transfers_recipient ON transfers(recipient_wallet_id, created_at DESC);

CREATE TABLE ledger_entries (
    id BIGSERIAL PRIMARY KEY,
    transfer_id BIGINT NOT NULL REFERENCES transfers(id),
    wallet_id BIGINT NOT NULL REFERENCES wallets(id),
    entry_type VARCHAR(6) NOT NULL,
    amount NUMERIC(19,4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ledger_entry_type_valid CHECK (entry_type IN ('DEBIT','CREDIT')),
    CONSTRAINT ledger_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_ledger_transfer ON ledger_entries(transfer_id);
CREATE INDEX idx_ledger_wallet ON ledger_entries(wallet_id, created_at DESC);
