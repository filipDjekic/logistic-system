IF COL_LENGTH('dbo.transport_order_items', 'movement_unit_cost') IS NULL
BEGIN
    ALTER TABLE dbo.transport_order_items ADD movement_unit_cost DECIMAL(19, 4) NULL;
END;

IF COL_LENGTH('dbo.transport_order_items', 'movement_total_cost') IS NULL
BEGIN
    ALTER TABLE dbo.transport_order_items ADD movement_total_cost DECIMAL(19, 4) NULL;
END;

IF COL_LENGTH('dbo.transport_order_items', 'movement_currency') IS NULL
BEGIN
    ALTER TABLE dbo.transport_order_items ADD movement_currency VARCHAR(3) NULL;
END;

ALTER TABLE dbo.transport_order_items ADD CONSTRAINT chk_transport_order_item_movement_cost
    CHECK (
        (movement_unit_cost IS NULL AND movement_total_cost IS NULL AND movement_currency IS NULL)
        OR (movement_unit_cost >= 0 AND movement_total_cost >= 0 AND LEN(movement_currency) = 3)
    );
