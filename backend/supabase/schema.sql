-- Coffer — run this in Supabase SQL Editor to set up the schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Accounts ───────────────────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE account_type AS ENUM ('BROKERAGE','RETIREMENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS accounts (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    type        account_type NOT NULL,
    institution VARCHAR(255),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Assets ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE asset_class_type AS ENUM ('EQUITY','ETF');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS assets (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol      VARCHAR(20) UNIQUE NOT NULL,
    name        VARCHAR(255) NOT NULL,
    asset_class asset_class_type NOT NULL,
    sector      VARCHAR(100),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

-- ── Transactions ───────────────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM (
        'BUY','SELL','DIVIDEND','SPLIT','DEPOSIT','WITHDRAWAL'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS transactions (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    asset_id   UUID REFERENCES assets(id),
    type       transaction_type NOT NULL,
    trade_date DATE NOT NULL,
    quantity   NUMERIC(20,8) NOT NULL,
    price      NUMERIC(20,4) NOT NULL DEFAULT 0,
    fees       NUMERIC(20,4) NOT NULL DEFAULT 0,
    notes      TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_tx_account_date ON transactions(account_id, trade_date);

-- ── Prices ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prices (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id   UUID NOT NULL REFERENCES assets(id),
    date       DATE NOT NULL,
    close      NUMERIC(20,4) NOT NULL,
    source     VARCHAR(50) NOT NULL DEFAULT 'yfinance',
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(asset_id, date)
);
CREATE INDEX IF NOT EXISTS ix_prices_date ON prices(date);
