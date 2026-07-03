IF COL_LENGTH('dbo.inventory_count_lines', 'version') IS NULL
BEGIN
    EXEC('ALTER TABLE dbo.inventory_count_lines ADD version BIGINT NOT NULL CONSTRAINT df_inventory_count_lines_version DEFAULT 0');
END;
