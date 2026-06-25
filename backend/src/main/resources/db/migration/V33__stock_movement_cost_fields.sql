IF COL_LENGTH('dbo.stock_movements', 'unit_cost') IS NULL
BEGIN
    ALTER TABLE dbo.stock_movements ADD unit_cost DECIMAL(19, 4) NULL;
END;

IF COL_LENGTH('dbo.stock_movements', 'total_cost') IS NULL
BEGIN
    ALTER TABLE dbo.stock_movements ADD total_cost DECIMAL(19, 4) NULL;
END;

IF COL_LENGTH('dbo.stock_movements', 'currency') IS NULL
BEGIN
    ALTER TABLE dbo.stock_movements ADD currency VARCHAR(3) NULL;
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'chk_stock_movements_unit_cost_non_negative'
      AND parent_object_id = OBJECT_ID('dbo.stock_movements')
)
BEGIN
    EXEC('ALTER TABLE dbo.stock_movements
        ADD CONSTRAINT chk_stock_movements_unit_cost_non_negative
            CHECK (unit_cost IS NULL OR unit_cost >= 0)');
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'chk_stock_movements_total_cost_non_negative'
      AND parent_object_id = OBJECT_ID('dbo.stock_movements')
)
BEGIN
    EXEC('ALTER TABLE dbo.stock_movements
        ADD CONSTRAINT chk_stock_movements_total_cost_non_negative
            CHECK (total_cost IS NULL OR total_cost >= 0)');
END;
