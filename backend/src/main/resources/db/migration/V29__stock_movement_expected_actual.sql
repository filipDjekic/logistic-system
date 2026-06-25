IF COL_LENGTH('dbo.stock_movements', 'expected_quantity') IS NULL
BEGIN
    ALTER TABLE dbo.stock_movements ADD expected_quantity DECIMAL(12,2) NULL;
END;

IF COL_LENGTH('dbo.stock_movements', 'actual_quantity') IS NULL
BEGIN
    ALTER TABLE dbo.stock_movements ADD actual_quantity DECIMAL(12,2) NULL;
END;

IF COL_LENGTH('dbo.stock_movements', 'discrepancy_quantity') IS NULL
BEGIN
    ALTER TABLE dbo.stock_movements ADD discrepancy_quantity DECIMAL(12,2) NULL;
END;

IF COL_LENGTH('dbo.stock_movements', 'discrepancy_reason') IS NULL
BEGIN
    ALTER TABLE dbo.stock_movements ADD discrepancy_reason NVARCHAR(50) NULL;
END;

IF COL_LENGTH('dbo.stock_movements', 'discrepancy_note') IS NULL
BEGIN
    ALTER TABLE dbo.stock_movements ADD discrepancy_note NVARCHAR(255) NULL;
END;

EXEC(N'
UPDATE dbo.stock_movements
SET expected_quantity = COALESCE(expected_quantity, quantity),
    actual_quantity = COALESCE(actual_quantity, quantity),
    discrepancy_quantity = COALESCE(discrepancy_quantity, 0)
WHERE expected_quantity IS NULL
   OR actual_quantity IS NULL
   OR discrepancy_quantity IS NULL
');

IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.stock_movements')
      AND name = 'expected_quantity'
      AND is_nullable = 1
)
BEGIN
    ALTER TABLE dbo.stock_movements ALTER COLUMN expected_quantity DECIMAL(12,2) NOT NULL;
END;

IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.stock_movements')
      AND name = 'actual_quantity'
      AND is_nullable = 1
)
BEGIN
    ALTER TABLE dbo.stock_movements ALTER COLUMN actual_quantity DECIMAL(12,2) NOT NULL;
END;

IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.stock_movements')
      AND name = 'discrepancy_quantity'
      AND is_nullable = 1
)
BEGIN
    ALTER TABLE dbo.stock_movements ALTER COLUMN discrepancy_quantity DECIMAL(12,2) NOT NULL;
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'idx_stock_movements_transport_discrepancy'
      AND object_id = OBJECT_ID('dbo.stock_movements')
)
BEGIN
    CREATE INDEX idx_stock_movements_transport_discrepancy ON dbo.stock_movements(transport_order_id, discrepancy_quantity);
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'idx_stock_movements_discrepancy_reason_created'
      AND object_id = OBJECT_ID('dbo.stock_movements')
)
BEGIN
    CREATE INDEX idx_stock_movements_discrepancy_reason_created ON dbo.stock_movements(discrepancy_reason, created_at);
END;
