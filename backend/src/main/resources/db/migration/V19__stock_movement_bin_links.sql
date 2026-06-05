IF COL_LENGTH('dbo.stock_movements', 'source_bin_id') IS NULL
BEGIN
    ALTER TABLE dbo.stock_movements ADD source_bin_id BIGINT NULL;
END;

IF COL_LENGTH('dbo.stock_movements', 'destination_bin_id') IS NULL
BEGIN
    ALTER TABLE dbo.stock_movements ADD destination_bin_id BIGINT NULL;
END;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_stock_movements_source_bin')
BEGIN
    ALTER TABLE dbo.stock_movements
        ADD CONSTRAINT fk_stock_movements_source_bin FOREIGN KEY (source_bin_id) REFERENCES dbo.bin_locations(id);
END;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_stock_movements_destination_bin')
BEGIN
    ALTER TABLE dbo.stock_movements
        ADD CONSTRAINT fk_stock_movements_destination_bin FOREIGN KEY (destination_bin_id) REFERENCES dbo.bin_locations(id);
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_stock_movements_source_bin_id' AND object_id = OBJECT_ID('dbo.stock_movements'))
BEGIN
    CREATE INDEX idx_stock_movements_source_bin_id ON dbo.stock_movements(source_bin_id);
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_stock_movements_destination_bin_id' AND object_id = OBJECT_ID('dbo.stock_movements'))
BEGIN
    CREATE INDEX idx_stock_movements_destination_bin_id ON dbo.stock_movements(destination_bin_id);
END;
