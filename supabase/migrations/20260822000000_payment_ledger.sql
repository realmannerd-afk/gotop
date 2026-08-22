ALTER TABLE payments ALTER COLUMN listing_id DROP NOT NULL;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_listing_id_fkey;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_bid_id_fkey;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS expected_amount INTEGER;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE payments ADD CONSTRAINT payments_provider_payment_id_key UNIQUE (provider_payment_id);
