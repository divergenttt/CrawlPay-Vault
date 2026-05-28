-- Daily spend tracking per API key (for per_req / daily limits)
CREATE TABLE IF NOT EXISTS api_key_usage (
  api_key_id uuid NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  usage_day date NOT NULL DEFAULT (CURRENT_DATE),
  spent_usdc numeric NOT NULL DEFAULT 0,
  request_count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (api_key_id, usage_day)
);

CREATE INDEX IF NOT EXISTS api_key_usage_day_idx ON api_key_usage (usage_day);
