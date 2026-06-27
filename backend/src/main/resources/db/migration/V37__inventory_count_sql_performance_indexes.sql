IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_inventory_count_sessions_warehouse_created_at' AND object_id = OBJECT_ID('INVENTORY_COUNT_SESSIONS'))
BEGIN
    CREATE INDEX idx_inventory_count_sessions_warehouse_created_at
        ON INVENTORY_COUNT_SESSIONS(warehouse_id, created_at DESC);
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_inventory_count_lines_session_counted' AND object_id = OBJECT_ID('INVENTORY_COUNT_LINES'))
BEGIN
    CREATE INDEX idx_inventory_count_lines_session_counted
        ON INVENTORY_COUNT_LINES(session_id, counted_quantity);
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_inventory_count_lines_session_difference' AND object_id = OBJECT_ID('INVENTORY_COUNT_LINES'))
BEGIN
    CREATE INDEX idx_inventory_count_lines_session_difference
        ON INVENTORY_COUNT_LINES(session_id, difference_quantity);
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_inventory_count_lines_session_bin' AND object_id = OBJECT_ID('INVENTORY_COUNT_LINES'))
BEGIN
    CREATE INDEX idx_inventory_count_lines_session_bin
        ON INVENTORY_COUNT_LINES(session_id, bin_location_id);
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_inventory_count_lines_session_adjustment' AND object_id = OBJECT_ID('INVENTORY_COUNT_LINES'))
BEGIN
    CREATE INDEX idx_inventory_count_lines_session_adjustment
        ON INVENTORY_COUNT_LINES(session_id, adjustment_movement_id);
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_bin_inventory_product_bin' AND object_id = OBJECT_ID('BIN_INVENTORY'))
BEGIN
    CREATE INDEX idx_bin_inventory_product_bin
        ON BIN_INVENTORY(product_id, bin_location_id);
END;
