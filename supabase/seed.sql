-- Insert Categories
INSERT INTO categories (id, name, slug) VALUES
    ('00000000-0000-0000-0000-000000000001', 'AI', 'ai'),
    ('00000000-0000-0000-0000-000000000002', 'SaaS', 'saas'),
    ('00000000-0000-0000-0000-000000000003', 'Apps', 'apps'),
    ('00000000-0000-0000-0000-000000000004', 'Developer Tools', 'developer-tools'),
    ('00000000-0000-0000-0000-000000000005', 'Games', 'games'),
    ('00000000-0000-0000-0000-000000000006', 'Browser Extensions', 'browser-extensions'),
    ('00000000-0000-0000-0000-000000000007', 'Productivity', 'productivity'),
    ('00000000-0000-0000-0000-000000000008', 'Marketing', 'marketing'),
    ('00000000-0000-0000-0000-000000000009', 'Finance', 'finance'),
    ('00000000-0000-0000-0000-000000000010', 'Education', 'education'),
    ('00000000-0000-0000-0000-000000000011', 'Security', 'security'),
    ('00000000-0000-0000-0000-000000000012', 'Design', 'design'),
    ('00000000-0000-0000-0000-000000000013', 'Other', 'other')
ON CONFLICT (slug) DO NOTHING;

-- Insert Listings
INSERT INTO listings (name, slug, url, description, logo_url, category_id, status, current_bid, bid_placed_at, created_at) VALUES
    ('Lumina AI', 'lumina-ai', 'https://example.com', 'AI-powered writing assistant that matches your personal voice and style.', 'L', '00000000-0000-0000-0000-000000000001', 'active', 550, '2026-08-18T10:00:00Z', '2026-08-15T12:00:00Z'),
    ('Nexus Analytics', 'nexus-analytics', 'https://example.com', 'Real-time user analytics without the privacy compromises.', 'N', '00000000-0000-0000-0000-000000000002', 'active', 420, '2026-08-19T08:30:00Z', '2026-08-10T09:00:00Z'),
    ('CodeWeaver', 'code-weaver', 'https://example.com', 'Visual logic builder for complex backend architectures.', 'C', '00000000-0000-0000-0000-000000000004', 'active', 550, '2026-08-20T09:00:00Z', '2026-08-18T14:00:00Z'),
    ('FocusFlow', 'focus-flow', 'https://example.com', 'Productivity timer that actually blocks distracting apps at the OS level.', 'F', '00000000-0000-0000-0000-000000000007', 'active', 300, '2026-08-21T07:15:00Z', '2026-08-21T07:00:00Z'),
    ('MarketMind', 'market-mind', 'https://example.com', 'Social listening tool for indie hackers.', 'M', '00000000-0000-0000-0000-000000000008', 'active', 280, '2026-08-19T11:20:00Z', '2026-08-12T16:00:00Z'),
    ('PixelPerfect', 'pixel-perfect', 'https://example.com', 'Browser extension to check design alignment against Figma files.', 'P', '00000000-0000-0000-0000-000000000006', 'active', 250, '2026-08-17T14:45:00Z', '2026-08-14T08:00:00Z'),
    ('VaultSync', 'vault-sync', 'https://example.com', 'End-to-end encrypted backup solution for creative professionals.', 'V', '00000000-0000-0000-0000-000000000011', 'active', 200, '2026-08-18T09:10:00Z', '2026-08-05T10:00:00Z'),
    ('DesignDash', 'design-dash', 'https://example.com', 'Curated inspiration dashboard that replaces your new tab.', 'D', '00000000-0000-0000-0000-000000000012', 'active', 180, '2026-08-21T01:00:00Z', '2026-08-20T12:00:00Z'),
    ('FinTrack', 'fin-track', 'https://example.com', 'Personal finance app that doesn''t require bank connections.', 'F', '00000000-0000-0000-0000-000000000009', 'active', 150, '2026-08-15T08:00:00Z', '2026-08-10T14:00:00Z'),
    ('Polyglot AI', 'polyglot-ai', 'https://example.com', 'Learn languages by talking to AI personas with dynamic storylines.', 'P', '00000000-0000-0000-0000-000000000010', 'active', 145, '2026-08-20T18:00:00Z', '2026-08-19T09:00:00Z'),
    ('Indie Games Hub', 'indie-games-hub', 'https://example.com', 'Discover indie games before they hit the mainstream stores.', 'I', '00000000-0000-0000-0000-000000000005', 'active', 120, '2026-08-16T12:00:00Z', '2026-08-11T11:00:00Z'),
    ('Habit Hero', 'habit-hero', 'https://example.com', 'Gamify your daily habits with RPG elements.', 'H', '00000000-0000-0000-0000-000000000003', 'active', 100, '2026-08-19T10:00:00Z', '2026-08-18T08:00:00Z'),
    ('API Monitor Pro', 'api-monitor', 'https://example.com', 'Simple and reliable uptime monitoring for APIs.', 'A', '00000000-0000-0000-0000-000000000004', 'active', 95, '2026-08-20T14:00:00Z', '2026-08-17T09:00:00Z'),
    ('Copy Genius', 'copy-genius', 'https://example.com', 'Generate high-converting landing page copy in seconds.', 'C', '00000000-0000-0000-0000-000000000008', 'active', 80, '2026-08-21T05:00:00Z', '2026-08-21T04:00:00Z'),
    ('Task Tree', 'task-tree', 'https://example.com', 'Hierarchical task manager for complex projects.', 'T', '00000000-0000-0000-0000-000000000007', 'active', 75, '2026-08-14T09:00:00Z', '2026-08-12T10:00:00Z'),
    ('MailShield', 'mail-shield', 'https://example.com', 'Disposable email addresses to protect your inbox from spam.', 'M', '00000000-0000-0000-0000-000000000011', 'active', 70, '2026-08-18T16:00:00Z', '2026-08-16T11:00:00Z'),
    ('Font Finder', 'font-finder', 'https://example.com', 'Identify fonts on any website with a single click.', 'F', '00000000-0000-0000-0000-000000000006', 'active', 65, '2026-08-20T11:00:00Z', '2026-08-19T14:00:00Z'),
    ('CryptoTaxes', 'crypto-taxes', 'https://example.com', 'Simplify your crypto tax reporting automatically.', 'C', '00000000-0000-0000-0000-000000000009', 'active', 60, '2026-08-15T15:00:00Z', '2026-08-10T12:00:00Z'),
    ('StudyBuddy', 'study-buddy', 'https://example.com', 'Find study partners from around the world for any subject.', 'S', '00000000-0000-0000-0000-000000000010', 'active', 55, '2026-08-21T08:00:00Z', '2026-08-21T07:30:00Z'),
    ('Minimal Portfolio', 'minimal-portfolio', 'https://example.com', 'Build a beautiful portfolio website in minutes. No code required.', 'M', '00000000-0000-0000-0000-000000000012', 'active', 50, '2026-08-19T13:00:00Z', '2026-08-18T16:00:00Z')
ON CONFLICT (slug) DO NOTHING;
