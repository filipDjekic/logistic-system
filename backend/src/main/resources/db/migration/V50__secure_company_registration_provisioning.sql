ALTER TABLE company_registration_requests
    ALTER COLUMN admin_password NVARCHAR(255) NULL;

UPDATE company_registration_requests
SET admin_password = NULL
WHERE status IN ('APPROVED', 'REJECTED', 'CANCELLED');

ALTER TABLE employees
    ALTER COLUMN salary DECIMAL(12,2) NULL;

UPDATE companies
SET registration_number = NULL
WHERE LTRIM(RTRIM(registration_number)) = '';

UPDATE companies
SET tax_number = NULL
WHERE LTRIM(RTRIM(tax_number)) = '';

UPDATE company_registration_requests
SET registration_number = NULL
WHERE LTRIM(RTRIM(registration_number)) = '';

UPDATE company_registration_requests
SET tax_number = NULL
WHERE LTRIM(RTRIM(tax_number)) = '';

CREATE UNIQUE INDEX uk_companies_registration_number_not_null
    ON companies(registration_number)
    WHERE registration_number IS NOT NULL;

CREATE UNIQUE INDEX uk_companies_tax_number_not_null
    ON companies(tax_number)
    WHERE tax_number IS NOT NULL;

CREATE UNIQUE INDEX uk_company_registration_active_name
    ON company_registration_requests(company_name)
    WHERE status IN ('PENDING', 'UNDER_REVIEW');

CREATE UNIQUE INDEX uk_company_registration_active_registration_number
    ON company_registration_requests(registration_number)
    WHERE registration_number IS NOT NULL AND status IN ('PENDING', 'UNDER_REVIEW');

CREATE UNIQUE INDEX uk_company_registration_active_tax_number
    ON company_registration_requests(tax_number)
    WHERE tax_number IS NOT NULL AND status IN ('PENDING', 'UNDER_REVIEW');

CREATE UNIQUE INDEX uk_company_registration_active_admin_email
    ON company_registration_requests(admin_email)
    WHERE status IN ('PENDING', 'UNDER_REVIEW');
