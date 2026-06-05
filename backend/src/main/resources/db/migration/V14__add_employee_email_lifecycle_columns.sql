ALTER TABLE employees ADD
    auto_generated_email BIT NOT NULL CONSTRAINT df_employees_auto_generated_email DEFAULT 0,
    email_manually_overridden BIT NOT NULL CONSTRAINT df_employees_email_manually_overridden DEFAULT 0,
    email_generation_source NVARCHAR(80) NULL;
GO

UPDATE employees
SET auto_generated_email = 0,
    email_manually_overridden = 1,
    email_generation_source = COALESCE(email_generation_source, 'LEGACY');
GO
