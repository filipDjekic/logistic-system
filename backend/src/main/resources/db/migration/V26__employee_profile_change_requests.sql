IF OBJECT_ID('dbo.employee_profile_change_requests', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.employee_profile_change_requests (
        id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        employee_id BIGINT NOT NULL,
        requested_by_user_id BIGINT NOT NULL,
        company_id BIGINT NOT NULL,
        status NVARCHAR(20) NOT NULL CONSTRAINT df_emp_profile_change_requests_status DEFAULT 'PENDING',
        requested_changes_json NVARCHAR(MAX) NOT NULL,
        reason NVARCHAR(1000) NULL,
        reviewed_by_user_id BIGINT NULL,
        reviewed_at DATETIME2 NULL,
        rejection_reason NVARCHAR(1000) NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT df_emp_profile_change_requests_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NULL,
        version BIGINT NOT NULL CONSTRAINT df_emp_profile_change_requests_version DEFAULT 0,
        CONSTRAINT fk_emp_profile_change_requests_employee FOREIGN KEY (employee_id) REFERENCES dbo.employees(id),
        CONSTRAINT fk_emp_profile_change_requests_requested_by FOREIGN KEY (requested_by_user_id) REFERENCES dbo.users(id),
        CONSTRAINT fk_emp_profile_change_requests_company FOREIGN KEY (company_id) REFERENCES dbo.companies(id),
        CONSTRAINT fk_emp_profile_change_requests_reviewed_by FOREIGN KEY (reviewed_by_user_id) REFERENCES dbo.users(id),
        CONSTRAINT ck_emp_profile_change_requests_status CHECK (status IN ('PENDING', 'APPLIED', 'REJECTED', 'CANCELLED'))
    );
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'idx_emp_profile_change_requests_employee_id'
      AND object_id = OBJECT_ID('dbo.employee_profile_change_requests')
)
BEGIN
    CREATE INDEX idx_emp_profile_change_requests_employee_id
    ON dbo.employee_profile_change_requests(employee_id);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'idx_emp_profile_change_requests_company_status'
      AND object_id = OBJECT_ID('dbo.employee_profile_change_requests')
)
BEGIN
    CREATE INDEX idx_emp_profile_change_requests_company_status
    ON dbo.employee_profile_change_requests(company_id, status);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'idx_emp_profile_change_requests_requested_by'
      AND object_id = OBJECT_ID('dbo.employee_profile_change_requests')
)
BEGIN
    CREATE INDEX idx_emp_profile_change_requests_requested_by
    ON dbo.employee_profile_change_requests(requested_by_user_id);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'idx_emp_profile_change_requests_reviewed_by'
      AND object_id = OBJECT_ID('dbo.employee_profile_change_requests')
)
BEGIN
    CREATE INDEX idx_emp_profile_change_requests_reviewed_by
    ON dbo.employee_profile_change_requests(reviewed_by_user_id);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'idx_emp_profile_change_requests_created_at'
      AND object_id = OBJECT_ID('dbo.employee_profile_change_requests')
)
BEGIN
    CREATE INDEX idx_emp_profile_change_requests_created_at
    ON dbo.employee_profile_change_requests(created_at);
END
GO
