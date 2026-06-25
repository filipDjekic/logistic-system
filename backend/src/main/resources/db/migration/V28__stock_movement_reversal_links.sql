IF COL_LENGTH('dbo.stock_movements', 'reversal_of_movement_id') IS NULL
BEGIN
    ALTER TABLE dbo.stock_movements ADD reversal_of_movement_id BIGINT NULL;
END;

IF COL_LENGTH('dbo.stock_movements', 'reversed_by_movement_id') IS NULL
BEGIN
    ALTER TABLE dbo.stock_movements ADD reversed_by_movement_id BIGINT NULL;
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'idx_stock_movements_reversal_of_movement_id'
      AND object_id = OBJECT_ID('dbo.stock_movements')
)
BEGIN
    CREATE INDEX idx_stock_movements_reversal_of_movement_id ON dbo.stock_movements(reversal_of_movement_id);
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'idx_stock_movements_reversed_by_movement_id'
      AND object_id = OBJECT_ID('dbo.stock_movements')
)
BEGIN
    CREATE INDEX idx_stock_movements_reversed_by_movement_id ON dbo.stock_movements(reversed_by_movement_id);
END;
