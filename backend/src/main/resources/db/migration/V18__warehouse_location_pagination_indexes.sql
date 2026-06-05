IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_warehouse_zones_warehouse_code_search' AND object_id = OBJECT_ID('dbo.warehouse_zones'))
BEGIN
    CREATE INDEX idx_warehouse_zones_warehouse_code_search ON dbo.warehouse_zones(warehouse_id, code) INCLUDE (name, type, active);
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_bin_locations_warehouse_zone_code_search' AND object_id = OBJECT_ID('dbo.bin_locations'))
BEGIN
    CREATE INDEX idx_bin_locations_warehouse_zone_code_search ON dbo.bin_locations(warehouse_id, zone_id, code) INCLUDE (name, active);
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_bin_inventory_product_bin_quantity' AND object_id = OBJECT_ID('dbo.bin_inventory'))
BEGIN
    CREATE INDEX idx_bin_inventory_product_bin_quantity ON dbo.bin_inventory(product_id, bin_location_id) INCLUDE (quantity, last_updated);
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_internal_movements_warehouse_product_created' AND object_id = OBJECT_ID('dbo.internal_warehouse_movements'))
BEGIN
    CREATE INDEX idx_internal_movements_warehouse_product_created ON dbo.internal_warehouse_movements(warehouse_id, product_id, created_at DESC) INCLUDE (source_bin_id, destination_bin_id, quantity, status);
END;
