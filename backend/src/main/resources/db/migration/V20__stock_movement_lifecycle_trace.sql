IF COL_LENGTH('dbo.stock_movements', 'source_type') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.stock_movements ADD source_type NVARCHAR(50) NULL');
END;

IF COL_LENGTH('dbo.stock_movements', 'source_id') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.stock_movements ADD source_id BIGINT NULL');
END;

IF COL_LENGTH('dbo.stock_movements', 'reference_code') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.stock_movements ADD reference_code NVARCHAR(120) NULL');
END;

IF COL_LENGTH('dbo.stock_movements', 'parent_movement_id') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.stock_movements ADD parent_movement_id BIGINT NULL');
END;

IF COL_LENGTH('dbo.stock_movements', 'root_movement_id') IS NULL
BEGIN
    EXEC(N'ALTER TABLE dbo.stock_movements ADD root_movement_id BIGINT NULL');
END;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_stock_movements_parent_movement')
BEGIN
    EXEC(N'ALTER TABLE dbo.stock_movements ADD CONSTRAINT fk_stock_movements_parent_movement FOREIGN KEY (parent_movement_id) REFERENCES dbo.stock_movements(id)');
END;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_stock_movements_root_movement')
BEGIN
    EXEC(N'ALTER TABLE dbo.stock_movements ADD CONSTRAINT fk_stock_movements_root_movement FOREIGN KEY (root_movement_id) REFERENCES dbo.stock_movements(id)');
END;

EXEC(N'
UPDATE dbo.stock_movements
SET source_type = COALESCE(source_type, CAST(reference_type AS NVARCHAR(50))),
    source_id = COALESCE(source_id, reference_id),
    reference_code = COALESCE(reference_code, reference_number, transfer_group_id)
WHERE source_type IS NULL OR source_id IS NULL OR reference_code IS NULL
');

EXEC(N'
UPDATE child
SET parent_movement_id = child.reference_id,
    root_movement_id = COALESCE(parent.root_movement_id, parent.id)
FROM dbo.stock_movements child
JOIN dbo.stock_movements parent ON parent.id = child.reference_id
WHERE child.reference_type = ''STOCK_MOVEMENT''
  AND child.reference_id IS NOT NULL
  AND child.parent_movement_id IS NULL
');

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_stock_movements_parent_movement_id' AND object_id = OBJECT_ID('dbo.stock_movements'))
BEGIN
    EXEC(N'CREATE INDEX idx_stock_movements_parent_movement_id ON dbo.stock_movements(parent_movement_id)');
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_stock_movements_root_movement_id' AND object_id = OBJECT_ID('dbo.stock_movements'))
BEGIN
    EXEC(N'CREATE INDEX idx_stock_movements_root_movement_id ON dbo.stock_movements(root_movement_id)');
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_stock_movements_source' AND object_id = OBJECT_ID('dbo.stock_movements'))
BEGIN
    EXEC(N'CREATE INDEX idx_stock_movements_source ON dbo.stock_movements(source_type, source_id)');
END;
