IF OBJECT_ID('dbo.stock_movement_requests', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.stock_movement_requests (
        id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        movement_type NVARCHAR(30) NOT NULL,
        status NVARCHAR(30) NOT NULL CONSTRAINT df_stock_movement_requests_status DEFAULT 'REQUESTED',
        quantity DECIMAL(12,2) NOT NULL,
        adjustment_direction NVARCHAR(20) NULL,
        reason_description NVARCHAR(255) NULL,
        review_note NVARCHAR(255) NULL,
        version BIGINT NOT NULL CONSTRAINT df_stock_movement_requests_version DEFAULT 0,
        warehouse_id BIGINT NOT NULL,
        destination_warehouse_id BIGINT NULL,
        product_id BIGINT NOT NULL,
        bin_location_id BIGINT NULL,
        destination_bin_location_id BIGINT NULL,
        requested_by_user_id BIGINT NOT NULL,
        reviewed_by_user_id BIGINT NULL,
        created_movement_id BIGINT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT df_stock_movement_requests_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NULL,
        reviewed_at DATETIME2 NULL,
        CONSTRAINT fk_stock_movement_requests_warehouse FOREIGN KEY (warehouse_id) REFERENCES dbo.warehouses(id),
        CONSTRAINT fk_stock_movement_requests_destination_warehouse FOREIGN KEY (destination_warehouse_id) REFERENCES dbo.warehouses(id),
        CONSTRAINT fk_stock_movement_requests_product FOREIGN KEY (product_id) REFERENCES dbo.products(id),
        CONSTRAINT fk_stock_movement_requests_bin_location FOREIGN KEY (bin_location_id) REFERENCES dbo.bin_locations(id),
        CONSTRAINT fk_stock_movement_requests_destination_bin_location FOREIGN KEY (destination_bin_location_id) REFERENCES dbo.bin_locations(id),
        CONSTRAINT fk_stock_movement_requests_requested_by FOREIGN KEY (requested_by_user_id) REFERENCES dbo.users(id),
        CONSTRAINT fk_stock_movement_requests_reviewed_by FOREIGN KEY (reviewed_by_user_id) REFERENCES dbo.users(id),
        CONSTRAINT fk_stock_movement_requests_created_movement FOREIGN KEY (created_movement_id) REFERENCES dbo.stock_movements(id)
    );
END;

IF COL_LENGTH('dbo.stock_movement_requests', 'version') IS NULL
BEGIN
    ALTER TABLE dbo.stock_movement_requests
    ADD version BIGINT NOT NULL CONSTRAINT df_stock_movement_requests_version DEFAULT 0;
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'idx_stock_movement_requests_status'
      AND object_id = OBJECT_ID('dbo.stock_movement_requests')
)
BEGIN
    CREATE INDEX idx_stock_movement_requests_status ON dbo.stock_movement_requests(status);
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'idx_stock_movement_requests_warehouse'
      AND object_id = OBJECT_ID('dbo.stock_movement_requests')
)
BEGIN
    CREATE INDEX idx_stock_movement_requests_warehouse ON dbo.stock_movement_requests(warehouse_id);
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'idx_stock_movement_requests_requested_by'
      AND object_id = OBJECT_ID('dbo.stock_movement_requests')
)
BEGIN
    CREATE INDEX idx_stock_movement_requests_requested_by ON dbo.stock_movement_requests(requested_by_user_id);
END;
