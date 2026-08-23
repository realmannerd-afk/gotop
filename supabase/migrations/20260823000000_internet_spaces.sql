CREATE TABLE spaces (
    id INTEGER PRIMARY KEY CHECK (id >= 1 AND id <= 1000000),
    name TEXT NOT NULL CHECK (char_length(name) <= 80),
    url TEXT NOT NULL,
    logo_url TEXT,
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    anonymous_session_id TEXT NOT NULL
);

-- Essential indexes for performance
CREATE INDEX idx_spaces_claimed_at ON spaces (claimed_at DESC);
