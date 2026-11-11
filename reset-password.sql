UPDATE users
SET password_hash = '$2a$12$s5wecf/WcTdBK3tPjP3DyuTGDapPrfILRgDz/mcs.SzJ4DTz7GVOq'
WHERE id IN (1, 2, 3, 4, 5);

-- OR

UPDATE users
SET password_hash = '$2a$12$s5wecf/WcTdBK3tPjP3DyuTGDapPrfILRgDz/mcs.SzJ4DTz7GVOq'
WHERE email IN (
    'sam.rivera@example.com',
    'jamie.chen@example.com',
    'alicia.gomez@example.com',
    'marcus.webb@example.com',
    'priya.patel@example.com'
);

-- Either one sets all of the accounts password to `password`