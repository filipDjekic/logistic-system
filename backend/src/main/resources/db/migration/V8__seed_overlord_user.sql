-- Overlord seed. Demo company users are seeded separately in V9__seed_demo_company.sql.
DECLARE @Email NVARCHAR(255) = 'filip.djekic@slu.admin.rs';
DECLARE @RoleName NVARCHAR(100) = 'OVERLORD';

DECLARE @RoleId BIGINT;

SELECT @RoleId = id
FROM roles
WHERE name = @RoleName;

IF @RoleId IS NULL
BEGIN
    THROW 50001, 'Role OVERLORD ne postoji. Prvo pokreni aplikaciju ili seed za roles.', 1;
END;

IF NOT EXISTS (
    SELECT 1
    FROM users
    WHERE email = @Email
)
BEGIN
    INSERT INTO users (
        password,
        first_name,
        last_name,
        email,
        status,
        enabled,
        created_at,
        updated_at,
        role_id,
        company_id
    )
    VALUES (
        '$2a$12$xubu7119KQiOmhV1w1bPBOZYgI6OVCoC/JGgiO7HSZIkfFsu6xsRC',
        'Filip',
        'Djekic',
        @Email,
        'ACTIVE',
        1,
        '2026-03-11T16:39:01.780',
        '2026-03-11T16:39:01.780',
        @RoleId,
        NULL
    );
END;