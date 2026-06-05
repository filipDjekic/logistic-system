IF COL_LENGTH('dbo.WAREHOUSES', 'bin_tracking_enabled') IS NULL
BEGIN
    ALTER TABLE dbo.WAREHOUSES
        ADD bin_tracking_enabled bit NOT NULL CONSTRAINT df_warehouses_bin_tracking_enabled DEFAULT 0;
END;
