-- API keys (per Privy user)
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  privy_user_id text NOT NULL,
  name text NOT NULL,
  token_prefix text NOT NULL,
  token_hash text NOT NULL,
  per_req_usdc numeric NOT NULL DEFAULT 0.01,
  daily_usdc numeric NOT NULL DEFAULT 0.50,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS api_keys_privy_user_id_idx
  ON api_keys (privy_user_id);

CREATE UNIQUE INDEX IF NOT EXISTS api_keys_token_hash_idx
  ON api_keys (token_hash);

-- CDR vault uuid → owner (on-chain uuid is numeric)
CREATE TABLE IF NOT EXISTS vault_ownership (
  vault_uuid bigint PRIMARY KEY,
  privy_user_id text NOT NULL,
  cid text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vault_ownership_privy_user_id_idx
  ON vault_ownership (privy_user_id);

-- Simple rate-limit buckets (IP + route)
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  bucket_key text NOT NULL,
  window_start timestamptz NOT NULL,
  hit_count integer NOT NULL DEFAULT 1,
  PRIMARY KEY (bucket_key, window_start)
);
