-- Duplicate submission race condition fix
-- Enforce uniqueness on the normalized URL, but only for active/pending listings
CREATE UNIQUE INDEX unique_active_pending_url ON listings (url) WHERE status IN ('active', 'pending');

-- Leaderboard index for sorting
CREATE INDEX idx_leaderboard ON listings (status, current_bid DESC, bid_placed_at ASC);

-- Analytics index for clicks and impressions
CREATE INDEX idx_clicks_analytics ON clicks (listing_id, created_at);
CREATE INDEX idx_impressions_analytics ON impressions (listing_id, created_at);
