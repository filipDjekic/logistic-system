ALTER TABLE warehouse_inventory
ADD version BIGINT NOT NULL CONSTRAINT df_warehouse_inventory_version DEFAULT 0;