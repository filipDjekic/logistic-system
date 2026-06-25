ALTER TABLE WAREHOUSE_INVENTORY
    ADD average_unit_cost DECIMAL(19, 4) NOT NULL CONSTRAINT DF_warehouse_inventory_average_unit_cost DEFAULT 0,
        total_value DECIMAL(19, 4) NOT NULL CONSTRAINT DF_warehouse_inventory_total_value DEFAULT 0,
        currency NVARCHAR(3) NULL;

EXEC('UPDATE wi
SET wi.average_unit_cost = CAST(0 AS DECIMAL(19, 4)),
    wi.total_value = CAST(0 AS DECIMAL(19, 4))
FROM WAREHOUSE_INVENTORY wi
WHERE wi.average_unit_cost IS NULL
   OR wi.total_value IS NULL');

EXEC('CREATE INDEX idx_warehouse_inventory_value
    ON WAREHOUSE_INVENTORY (warehouse_id, total_value)');
