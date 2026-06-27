ALTER TABLE INVENTORY_COUNT_LINES ADD bin_location_id BIGINT NULL;

ALTER TABLE INVENTORY_COUNT_LINES
    ADD CONSTRAINT fk_inventory_count_lines_bin_location
    FOREIGN KEY (bin_location_id) REFERENCES BIN_LOCATIONS(id);

IF EXISTS (
    SELECT 1
    FROM sys.key_constraints
    WHERE name = 'uk_inventory_count_lines_session_product'
      AND parent_object_id = OBJECT_ID('INVENTORY_COUNT_LINES')
)
BEGIN
    ALTER TABLE INVENTORY_COUNT_LINES DROP CONSTRAINT uk_inventory_count_lines_session_product;
END;

ALTER TABLE INVENTORY_COUNT_LINES
    ADD CONSTRAINT uk_inventory_count_lines_session_product_bin
    UNIQUE (session_id, product_id, bin_location_id);

CREATE INDEX idx_inventory_count_lines_bin_location_id
    ON INVENTORY_COUNT_LINES(bin_location_id);
