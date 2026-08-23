DROP TABLE IF EXISTS spaces;

CREATE TABLE spaces (
    id INTEGER PRIMARY KEY CHECK (id >= 1 AND id <= 1000000),
    message TEXT NOT NULL CHECK (char_length(message) <= 80),
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    anonymous_session_id TEXT NOT NULL
);

CREATE INDEX idx_spaces_claimed_at ON spaces (claimed_at DESC);
