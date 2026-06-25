IF COL_LENGTH('dbo.stock_movements', 'status') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.stock_movements ADD status NVARCHAR(30) NULL');
END;

EXEC(N'
UPDATE dbo.stock_movements
SET status = ''EXECUTED''
WHERE status IS NULL
');

IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.stock_movements')
      AND name = 'status'
      AND is_nullable = 1
)
BEGIN
    EXEC(N'ALTER TABLE dbo.stock_movements ALTER COLUMN status NVARCHAR(30) NOT NULL');
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.default_constraints dc
    JOIN sys.columns c ON c.default_object_id = dc.object_id
    WHERE dc.parent_object_id = OBJECT_ID('dbo.stock_movements')
      AND c.name = 'status'
)
BEGIN
    EXEC(N'ALTER TABLE dbo.stock_movements ADD CONSTRAINT df_stock_movements_status DEFAULT ''EXECUTED'' FOR status');
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'idx_stock_movements_status_created'
      AND object_id = OBJECT_ID('dbo.stock_movements')
)
BEGIN
    EXEC(N'CREATE INDEX idx_stock_movements_status_created ON dbo.stock_movements(status, created_at)');
END;
