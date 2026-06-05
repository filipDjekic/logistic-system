IF COL_LENGTH('dbo.NOTIFICATIONS', 'acknowledged_at') IS NULL
BEGIN
    ALTER TABLE dbo.NOTIFICATIONS ADD acknowledged_at datetime2 NULL;
END;

IF COL_LENGTH('dbo.NOTIFICATIONS', 'resolved_at') IS NULL
BEGIN
    ALTER TABLE dbo.NOTIFICATIONS ADD resolved_at datetime2 NULL;
END;

IF COL_LENGTH('dbo.NOTIFICATIONS', 'action_label') IS NULL
BEGIN
    ALTER TABLE dbo.NOTIFICATIONS ADD action_label nvarchar(80) NULL;
END;

IF COL_LENGTH('dbo.NOTIFICATIONS', 'action_path') IS NULL
BEGIN
    ALTER TABLE dbo.NOTIFICATIONS ADD action_path nvarchar(220) NULL;
END;

EXEC sp_executesql N'
UPDATE dbo.NOTIFICATIONS
SET action_label = CASE source_type
    WHEN ''TRANSPORT_ORDER'' THEN ''Open transport''
    WHEN ''WAREHOUSE_INVENTORY'' THEN ''Open inventory''
    WHEN ''STOCK_MOVEMENT'' THEN ''Open movement''
    WHEN ''TASK'' THEN ''Open task''
    WHEN ''SHIFT'' THEN ''Open shift''
    WHEN ''WAREHOUSE'' THEN ''Open warehouse''
    WHEN ''USER'' THEN ''Open user''
    ELSE NULL
END,
action_path = CASE
    WHEN source_type = ''TRANSPORT_ORDER'' AND source_id IS NOT NULL THEN CONCAT(''/transport-orders/'', source_id)
    WHEN source_type = ''WAREHOUSE_INVENTORY'' AND source_id IS NOT NULL THEN CONCAT(''/inventory/'', source_id)
    WHEN source_type = ''STOCK_MOVEMENT'' AND source_id IS NOT NULL THEN CONCAT(''/stock-movements/'', source_id)
    WHEN source_type = ''TASK'' AND source_id IS NOT NULL THEN CONCAT(''/tasks/'', source_id)
    WHEN source_type = ''SHIFT'' AND source_id IS NOT NULL THEN CONCAT(''/shifts/'', source_id)
    WHEN source_type = ''WAREHOUSE'' AND source_id IS NOT NULL THEN CONCAT(''/warehouses/'', source_id)
    WHEN source_type = ''USER'' AND source_id IS NOT NULL THEN CONCAT(''/users/'', source_id)
    ELSE NULL
END
WHERE source_type IS NOT NULL
  AND (action_label IS NULL OR action_path IS NULL);
';
