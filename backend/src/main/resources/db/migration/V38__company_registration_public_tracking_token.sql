IF COL_LENGTH('dbo.COMPANY_REGISTRATION_REQUESTS', 'public_tracking_token') IS NULL
BEGIN
    ALTER TABLE dbo.COMPANY_REGISTRATION_REQUESTS
        ADD public_tracking_token varchar(64) NULL;
END;

EXEC('
    UPDATE dbo.COMPANY_REGISTRATION_REQUESTS
    SET public_tracking_token = CONVERT(varchar(36), NEWID())
    WHERE public_tracking_token IS NULL OR LTRIM(RTRIM(public_tracking_token)) = ''''
');

IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.COMPANY_REGISTRATION_REQUESTS')
      AND name = 'public_tracking_token'
      AND is_nullable = 1
)
BEGIN
    EXEC('ALTER TABLE dbo.COMPANY_REGISTRATION_REQUESTS ALTER COLUMN public_tracking_token varchar(64) NOT NULL');
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'ux_company_registration_requests_public_tracking_token'
      AND object_id = OBJECT_ID('dbo.COMPANY_REGISTRATION_REQUESTS')
)
BEGIN
    EXEC('CREATE UNIQUE INDEX ux_company_registration_requests_public_tracking_token ON dbo.COMPANY_REGISTRATION_REQUESTS(public_tracking_token)');
END;
