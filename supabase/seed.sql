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
    ('00000000-0000-0000-0000-000000000013', 'Other', 'other'),
    ('00000000-0000-0000-0000-000000000014', 'Socials', 'socials'),
    ('00000000-0000-0000-0000-000000000015', 'Creators', 'creators'),
    ('00000000-0000-0000-0000-000000000016', 'Portfolios', 'portfolios'),
    ('00000000-0000-0000-0000-000000000017', 'Newsletters', 'newsletters'),
    ('00000000-0000-0000-0000-000000000018', 'Communities', 'communities')
ON CONFLICT (slug) DO NOTHING;

