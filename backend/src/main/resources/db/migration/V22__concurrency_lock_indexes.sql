IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_warehouse_inventory_lock_lookup' AND object_id = OBJECT_ID('dbo.warehouse_inventory'))
BEGIN
    CREATE INDEX idx_warehouse_inventory_lock_lookup
        ON dbo.warehouse_inventory(warehouse_id, product_id)
        INCLUDE (quantity, reserved_quantity, min_stock_level, version, last_updated);
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_bin_inventory_lock_lookup' AND object_id = OBJECT_ID('dbo.bin_inventory'))
BEGIN
    CREATE INDEX idx_bin_inventory_lock_lookup
        ON dbo.bin_inventory(bin_location_id, product_id)
        INCLUDE (quantity, version, last_updated);
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_stock_movements_inventory_trace_created' AND object_id = OBJECT_ID('dbo.stock_movements'))
BEGIN
    CREATE INDEX idx_stock_movements_inventory_trace_created
        ON dbo.stock_movements(warehouse_id, product_id, created_at DESC)
        INCLUDE (movement_type, quantity, quantity_before, quantity_after, reserved_before, reserved_after, transfer_group_id);
END;
