ALTER TABLE warehouses ADD version BIGINT NOT NULL
    CONSTRAINT df_warehouses_version DEFAULT 0;

ALTER TABLE warehouses ADD CONSTRAINT ck_warehouses_capacity_positive
    CHECK (capacity > 0);

ALTER TABLE warehouses ADD CONSTRAINT ck_warehouses_status
    CHECK (status IN ('ACTIVE', 'INACTIVE', 'FULL', 'UNDER_MAINTENANCE', 'ARCHIVED'));
