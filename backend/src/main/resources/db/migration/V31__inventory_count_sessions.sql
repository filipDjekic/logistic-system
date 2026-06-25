CREATE TABLE INVENTORY_COUNT_SESSIONS (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    code NVARCHAR(80) NOT NULL,
    description NVARCHAR(255) NULL,
    status NVARCHAR(30) NOT NULL,
    warehouse_id BIGINT NOT NULL,
    created_by_user_id BIGINT NOT NULL,
    reviewed_by_user_id BIGINT NULL,
    reviewed_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL,
    updated_at DATETIME2 NULL,
    CONSTRAINT uk_inventory_count_sessions_code UNIQUE (code),
    CONSTRAINT fk_inventory_count_sessions_warehouse FOREIGN KEY (warehouse_id) REFERENCES WAREHOUSES(id),
    CONSTRAINT fk_inventory_count_sessions_created_by FOREIGN KEY (created_by_user_id) REFERENCES USERS(id),
    CONSTRAINT fk_inventory_count_sessions_reviewed_by FOREIGN KEY (reviewed_by_user_id) REFERENCES USERS(id)
);

CREATE TABLE INVENTORY_COUNT_LINES (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    session_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    system_quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
    counted_quantity DECIMAL(12,2) NULL,
    difference_quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
    note NVARCHAR(255) NULL,
    adjustment_movement_id BIGINT NULL,
    CONSTRAINT uk_inventory_count_lines_session_product UNIQUE (session_id, product_id),
    CONSTRAINT fk_inventory_count_lines_session FOREIGN KEY (session_id) REFERENCES INVENTORY_COUNT_SESSIONS(id),
    CONSTRAINT fk_inventory_count_lines_product FOREIGN KEY (product_id) REFERENCES PRODUCTS(id),
    CONSTRAINT fk_inventory_count_lines_adjustment_movement FOREIGN KEY (adjustment_movement_id) REFERENCES STOCK_MOVEMENTS(id)
);

CREATE INDEX idx_inventory_count_sessions_warehouse_status ON INVENTORY_COUNT_SESSIONS(warehouse_id, status);
CREATE INDEX idx_inventory_count_sessions_created_at ON INVENTORY_COUNT_SESSIONS(created_at);
CREATE INDEX idx_inventory_count_lines_session_id ON INVENTORY_COUNT_LINES(session_id);
CREATE INDEX idx_inventory_count_lines_product_id ON INVENTORY_COUNT_LINES(product_id);
CREATE INDEX idx_inventory_count_lines_adjustment_movement_id ON INVENTORY_COUNT_LINES(adjustment_movement_id);
