-- ═══════════════════════════════════════════════════════════
-- Utang Tracker - Supabase Schema
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Customers ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  phone       TEXT,
  address     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Transactions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('utang', 'bayad')),
  amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  notes       TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Transaction Items ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transaction_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id  UUID REFERENCES transactions(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,
  quantity        INTEGER NOT NULL DEFAULT 1,
  unit_price      NUMERIC(12, 2) NOT NULL,
  total_price     NUMERIC(12, 2) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_items_tx_id ON transaction_items(transaction_id);

-- ─── RLS Policies ─────────────────────────────────────────────
-- For MVP: allow all (add auth later)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for MVP" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for MVP" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for MVP" ON transaction_items FOR ALL USING (true) WITH CHECK (true);

-- ─── Computed balance view ────────────────────────────────────
CREATE OR REPLACE VIEW customer_balances AS
SELECT
  c.id,
  c.name,
  c.phone,
  c.address,
  COALESCE(SUM(
    CASE WHEN t.type = 'utang' THEN t.amount
         WHEN t.type = 'bayad' THEN -t.amount
         ELSE 0 END
  ), 0) AS balance
FROM customers c
LEFT JOIN transactions t ON t.customer_id = c.id
GROUP BY c.id, c.name, c.phone, c.address;
