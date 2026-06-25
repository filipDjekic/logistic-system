IF COL_LENGTH('dbo.stock_movements', 'batch_lot_number') IS NULL
BEGIN
    ALTER TABLE dbo.stock_movements ADD batch_lot_number NVARCHAR(100) NULL;
END;

IF COL_LENGTH('dbo.stock_movements', 'batch_expiration_date') IS NULL
BEGIN
    ALTER TABLE dbo.stock_movements ADD batch_expiration_date DATE NULL;
END;

IF COL_LENGTH('dbo.stock_movements', 'serial_numbers') IS NULL
BEGIN
    ALTER TABLE dbo.stock_movements ADD serial_numbers NVARCHAR(2000) NULL;
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_stock_movements_batch_lot_created' AND object_id = OBJECT_ID('dbo.stock_movements'))
BEGIN
    CREATE INDEX idx_stock_movements_batch_lot_created ON dbo.stock_movements(batch_lot_number, created_at);
END;
