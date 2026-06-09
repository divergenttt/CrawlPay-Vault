-- Run in Supabase SQL Editor if dashboard APIs fail with missing user_settings.
-- Project: Supabase Dashboard → SQL → New query → paste → Run

-- 20260603000000_payments_network.sql
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS network text DEFAULT 'base';

COMMENT ON COLUMN payments.network IS 'Settlement network: base (default) or polygon';

-- 20260603100000_user_settings.sql
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  privy_user_id text NOT NULL,
  user_wallet text NOT NULL,
  domain text,
  domain_status text CHECK (domain_status IS NULL OR domain_status IN ('active', 'pending')),
  price_per_visit numeric NOT NULL DEFAULT 0.001,
  per_url_pricing jsonb NOT NULL DEFAULT '[]'::jsonb,
  bot_whitelist jsonb NOT NULL DEFAULT '{}'::jsonb,
  network text NOT NULL DEFAULT 'base'
    CHECK (network IN ('base', 'polygon', 'both')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_settings_global_idx
  ON user_settings (privy_user_id)
  WHERE domain IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS user_settings_domain_idx
  ON user_settings (privy_user_id, domain)
  WHERE domain IS NOT NULL;

CREATE INDEX IF NOT EXISTS user_settings_wallet_idx
  ON user_settings (user_wallet);
