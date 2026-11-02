UPDATE users
SET password_hash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE id IN (1, 2, 3, 4, 5);

-- OR

UPDATE users
SET password_hash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE email IN (
    'sam.rivera@example.com',
    'jamie.chen@example.com',
    'alicia.gomez@example.com',
    'marcus.webb@example.com',
    'priya.patel@example.com'
);

-- Either one sets all of the accounts password to `password`