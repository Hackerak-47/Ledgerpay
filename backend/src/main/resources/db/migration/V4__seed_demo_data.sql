-- Demo users: password is "demo1234" hashed with BCrypt
-- BCrypt hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh5q

INSERT INTO users (id, name, email, password_hash, created_at) VALUES
(1, 'Aarav Sharma',     'aarav@ledgerpay.in',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh5q', NOW() - INTERVAL '60 days'),
(2, 'Priya Patel',      'priya@ledgerpay.in',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh5q', NOW() - INTERVAL '58 days'),
(3, 'Rohan Verma',      'rohan@ledgerpay.in',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh5q', NOW() - INTERVAL '55 days'),
(4, 'Neha Gupta',       'neha@ledgerpay.in',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh5q', NOW() - INTERVAL '50 days'),
(5, 'Vikram Malhotra',  'vikram@ledgerpay.in',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh5q', NOW() - INTERVAL '45 days');

SELECT setval('users_id_seq', 5);

-- Wallets: Balances in Indian Rupees (INR)
INSERT INTO wallets (id, user_id, currency, balance, status, created_at) VALUES
(1, 1, 'INR', 75000.0000,  'ACTIVE', NOW() - INTERVAL '60 days'),
(2, 2, 'INR', 45000.0000,  'ACTIVE', NOW() - INTERVAL '58 days'),
(3, 3, 'INR', 60000.0000,  'ACTIVE', NOW() - INTERVAL '55 days'),
(4, 4, 'INR', 15000.0000,  'ACTIVE', NOW() - INTERVAL '50 days'),
(5, 5, 'INR', 120000.0000, 'ACTIVE', NOW() - INTERVAL '45 days');

SELECT setval('wallets_id_seq', 5);

-- Transfers (15 completed transfers in INR)
INSERT INTO transfers (id, reference, sender_wallet_id, recipient_wallet_id, amount, currency, description, status, idempotency_key, created_at) VALUES
(1,  'a1b2c3d4-0001-0001-0001-000000000001', 1, 2, 5000.0000,  'INR', 'Flat rent contribution',             'COMPLETED', NULL, NOW() - INTERVAL '29 days'),
(2,  'a1b2c3d4-0002-0002-0002-000000000002', 1, 3, 8500.0000,  'INR', 'Freelance web design milestone',     'COMPLETED', NULL, NOW() - INTERVAL '27 days'),
(3,  'a1b2c3d4-0003-0003-0003-000000000003', 2, 3, 1200.0000,  'INR', 'Chai and team snacks split',         'COMPLETED', NULL, NOW() - INTERVAL '25 days'),
(4,  'a1b2c3d4-0004-0004-0004-000000000004', 3, 4, 2500.0000,  'INR', 'Swiggy dinner reimbursement',        'COMPLETED', NULL, NOW() - INTERVAL '23 days'),
(5,  'a1b2c3d4-0005-0005-0005-000000000005', 5, 1, 15000.0000, 'INR', 'Consulting retainer payment',        'COMPLETED', NULL, NOW() - INTERVAL '21 days'),
(6,  'a1b2c3d4-0006-0006-0006-000000000006', 1, 3, 3200.0000,  'INR', 'WiFi and utility bill split',        'COMPLETED', NULL, NOW() - INTERVAL '19 days'),
(7,  'a1b2c3d4-0007-0007-0007-000000000007', 2, 5, 4000.0000,  'INR', 'Concert tickets booking',            'COMPLETED', NULL, NOW() - INTERVAL '17 days'),
(8,  'a1b2c3d4-0008-0008-0008-000000000008', 3, 2, 2200.0000,  'INR', 'Groceries share',                    'COMPLETED', NULL, NOW() - INTERVAL '15 days'),
(9,  'a1b2c3d4-0009-0009-0009-000000000009', 4, 1, 1500.0000,  'INR', 'Book purchase refund',               'COMPLETED', NULL, NOW() - INTERVAL '13 days'),
(10, 'a1b2c3d4-0010-0010-0010-000000000010', 5, 3, 6000.0000,  'INR', 'Software subscription share',        'COMPLETED', NULL, NOW() - INTERVAL '11 days'),
(11, 'a1b2c3d4-0011-0011-0011-000000000011', 1, 2, 3500.0000,  'INR', 'Diwali gift transfer',               'COMPLETED', NULL, NOW() - INTERVAL '9 days'),
(12, 'a1b2c3d4-0012-0012-0012-000000000012', 3, 5, 7500.0000,  'INR', 'Weekend road-trip advance',          'COMPLETED', NULL, NOW() - INTERVAL '7 days'),
(13, 'a1b2c3d4-0013-0013-0013-000000000013', 2, 4, 1800.0000,  'INR', 'Movie and dinner split',             'COMPLETED', NULL, NOW() - INTERVAL '5 days'),
(14, 'a1b2c3d4-0014-0014-0014-000000000014', 5, 1, 4500.0000,  'INR', 'Gym membership share',               'COMPLETED', NULL, NOW() - INTERVAL '3 days'),
(15, 'a1b2c3d4-0015-0015-0015-000000000015', 1, 5, 8000.0000,  'INR', 'Gadget purchase settlement',         'COMPLETED', NULL, NOW() - INTERVAL '1 day');

SELECT setval('transfers_id_seq', 15);

-- Ledger entries: exactly two per transfer (DEBIT sender, CREDIT recipient)
INSERT INTO ledger_entries (transfer_id, wallet_id, entry_type, amount, created_at) VALUES
(1,  1, 'DEBIT',  5000.0000,  NOW() - INTERVAL '29 days'),
(1,  2, 'CREDIT', 5000.0000,  NOW() - INTERVAL '29 days'),
(2,  1, 'DEBIT',  8500.0000,  NOW() - INTERVAL '27 days'),
(2,  3, 'CREDIT', 8500.0000,  NOW() - INTERVAL '27 days'),
(3,  2, 'DEBIT',  1200.0000,  NOW() - INTERVAL '25 days'),
(3,  3, 'CREDIT', 1200.0000,  NOW() - INTERVAL '25 days'),
(4,  3, 'DEBIT',  2500.0000,  NOW() - INTERVAL '23 days'),
(4,  4, 'CREDIT', 2500.0000,  NOW() - INTERVAL '23 days'),
(5,  5, 'DEBIT',  15000.0000, NOW() - INTERVAL '21 days'),
(5,  1, 'CREDIT', 15000.0000, NOW() - INTERVAL '21 days'),
(6,  1, 'DEBIT',  3200.0000,  NOW() - INTERVAL '19 days'),
(6,  3, 'CREDIT', 3200.0000,  NOW() - INTERVAL '19 days'),
(7,  2, 'DEBIT',  4000.0000,  NOW() - INTERVAL '17 days'),
(7,  5, 'CREDIT', 4000.0000,  NOW() - INTERVAL '17 days'),
(8,  3, 'DEBIT',  2200.0000,  NOW() - INTERVAL '15 days'),
(8,  2, 'CREDIT', 2200.0000,  NOW() - INTERVAL '15 days'),
(9,  4, 'DEBIT',  1500.0000,  NOW() - INTERVAL '13 days'),
(9,  1, 'CREDIT', 1500.0000,  NOW() - INTERVAL '13 days'),
(10, 5, 'DEBIT',  6000.0000,  NOW() - INTERVAL '11 days'),
(10, 3, 'CREDIT', 6000.0000,  NOW() - INTERVAL '11 days'),
(11, 1, 'DEBIT',  3500.0000,  NOW() - INTERVAL '9 days'),
(11, 2, 'CREDIT', 3500.0000,  NOW() - INTERVAL '9 days'),
(12, 3, 'DEBIT',  7500.0000,  NOW() - INTERVAL '7 days'),
(12, 5, 'CREDIT', 7500.0000,  NOW() - INTERVAL '7 days'),
(13, 2, 'DEBIT',  1800.0000,  NOW() - INTERVAL '5 days'),
(13, 4, 'CREDIT', 1800.0000,  NOW() - INTERVAL '5 days'),
(14, 5, 'DEBIT',  4500.0000,  NOW() - INTERVAL '3 days'),
(14, 1, 'CREDIT', 4500.0000,  NOW() - INTERVAL '3 days'),
(15, 1, 'DEBIT',  8000.0000,  NOW() - INTERVAL '1 day'),
(15, 5, 'CREDIT', 8000.0000,  NOW() - INTERVAL '1 day');
