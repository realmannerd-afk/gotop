-- Enums
CREATE TYPE listing_status AS ENUM ('pending', 'active', 'suspended', 'rejected');
CREATE TYPE bid_status AS ENUM ('pending', 'paid', 'failed');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listings
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    url TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    category_id UUID REFERENCES categories(id),
    status listing_status DEFAULT 'pending',
    current_bid INTEGER DEFAULT 0,
    bid_placed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bids
CREATE TABLE bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id) NOT NULL,
    amount INTEGER NOT NULL,
    previous_amount INTEGER DEFAULT 0,
    amount_paid INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status bid_status DEFAULT 'pending'
);

-- Listing Access
CREATE TABLE listing_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id) NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id) NOT NULL,
    bid_id UUID REFERENCES bids(id),
    amount INTEGER NOT NULL,
    status payment_status DEFAULT 'pending',
    provider TEXT NOT NULL,
    provider_payment_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Impressions
CREATE TABLE impressions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id) NOT NULL,
    session_id TEXT,
    placement TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clicks
CREATE TABLE clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id) NOT NULL,
    session_id TEXT,
    placement TEXT,
    referrer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;

-- Policies
-- Categories: Public can read active categories
CREATE POLICY "Public can read active categories" ON categories
    FOR SELECT USING (is_active = true);

-- Listings: Public can read active listings
CREATE POLICY "Public can read active listings" ON listings
    FOR SELECT USING (status = 'active');

-- Impressions: Public can insert
CREATE POLICY "Public can insert impressions" ON impressions
    FOR INSERT WITH CHECK (true);

-- Clicks: Public can insert
CREATE POLICY "Public can insert clicks" ON clicks
    FOR INSERT WITH CHECK (true);

-- Bids, Listing Access, Payments are strictly internal / server-side for now, so no public access.
-- Using Service Role Key in the backend will bypass RLS for these.

-- Functions & Triggers
-- Update updated_at on listings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_listings_updated_at
    BEFORE UPDATE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
