IF COL_LENGTH('dbo.bin_inventory', 'version') IS NULL
BEGIN
    ALTER TABLE dbo.bin_inventory
    ADD version BIGINT NOT NULL CONSTRAINT df_bin_inventory_version DEFAULT 0;
END
GO

IF COL_LENGTH('dbo.employee_warehouse_assignments', 'created_at') IS NULL
BEGIN
    ALTER TABLE dbo.employee_warehouse_assignments
    ADD created_at DATETIME2 NOT NULL CONSTRAINT df_emp_wh_assign_created_at DEFAULT SYSUTCDATETIME();
END
GO

IF COL_LENGTH('dbo.employee_warehouse_assignments', 'updated_at') IS NULL
BEGIN
    ALTER TABLE dbo.employee_warehouse_assignments
    ADD updated_at DATETIME2 NULL;
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'idx_change_history_entity_identifier'
      AND object_id = OBJECT_ID('dbo.change_history')
)
BEGIN
    CREATE INDEX idx_change_history_entity_identifier
    ON dbo.change_history(entity_name, entity_identifier);
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'idx_domain_events_entity_created'
      AND object_id = OBJECT_ID('dbo.domain_events')
)
BEGIN
    CREATE INDEX idx_domain_events_entity_created
    ON dbo.domain_events(entity_type, entity_id, created_at);
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'idx_operational_comments_entity_created'
      AND object_id = OBJECT_ID('dbo.operational_comments')
)
BEGIN
    CREATE INDEX idx_operational_comments_entity_created
    ON dbo.operational_comments(entity_type, entity_id, created_at);
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'idx_operational_attachments_entity_created'
      AND object_id = OBJECT_ID('dbo.operational_attachments')
)
BEGIN
    CREATE INDEX idx_operational_attachments_entity_created
    ON dbo.operational_attachments(entity_type, entity_id, created_at);
END
GO
