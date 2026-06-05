IF COL_LENGTH('dbo.tasks', 'version') IS NULL
BEGIN
    EXEC('ALTER TABLE dbo.tasks ADD version BIGINT NOT NULL CONSTRAINT df_tasks_version DEFAULT 0');
END;

IF COL_LENGTH('dbo.transport_orders', 'version') IS NULL
BEGIN
    EXEC('ALTER TABLE dbo.transport_orders ADD version BIGINT NOT NULL CONSTRAINT df_transport_orders_version DEFAULT 0');
END;

IF COL_LENGTH('dbo.vehicles', 'version') IS NULL
BEGIN
    EXEC('ALTER TABLE dbo.vehicles ADD version BIGINT NOT NULL CONSTRAINT df_vehicles_version DEFAULT 0');
END;
