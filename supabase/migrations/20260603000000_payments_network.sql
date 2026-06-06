-- Optional: record settlement network per payment (base | polygon)
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS network text DEFAULT 'base';

COMMENT ON COLUMN payments.network IS 'Settlement network: base (default) or polygon';
