ALTER TABLE company_registration_requests
ADD admin_address NVARCHAR(200) NULL;
GO

UPDATE company_registration_requests
SET admin_address = address
WHERE admin_address IS NULL;
GO

ALTER TABLE company_registration_requests
ALTER COLUMN admin_address NVARCHAR(200) NOT NULL;
GO