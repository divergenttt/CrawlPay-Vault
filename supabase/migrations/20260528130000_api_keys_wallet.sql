-- Link API keys to owner's embedded wallet (Base USDC balance + on-chain settlement)
ALTER TABLE api_keys
  ADD COLUMN IF NOT EXISTS owner_wallet_address text,
  ADD COLUMN IF NOT EXISTS privy_wallet_id text;

CREATE INDEX IF NOT EXISTS api_keys_owner_wallet_idx
  ON api_keys (owner_wallet_address)
  WHERE owner_wallet_address IS NOT NULL;
