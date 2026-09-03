IF OBJECT_ID(N'dbo.stock_movement_requests', N'U') IS NOT NULL
BEGIN
    DECLARE @stockMovementRequestsObjectId INT = OBJECT_ID(N'dbo.stock_movement_requests');
    DECLARE @dropForeignKeysSql NVARCHAR(MAX) = N'';

    SELECT @dropForeignKeysSql = @dropForeignKeysSql
        + N'ALTER TABLE '
        + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id))
        + N'.'
        + QUOTENAME(OBJECT_NAME(parent_object_id))
        + N' DROP CONSTRAINT '
        + QUOTENAME(name)
        + N';'
    FROM sys.foreign_keys
    WHERE parent_object_id = @stockMovementRequestsObjectId
       OR referenced_object_id = @stockMovementRequestsObjectId;

    IF LEN(@dropForeignKeysSql) > 0
    BEGIN
        EXEC sys.sp_executesql @dropForeignKeysSql;
    END;

    DROP TABLE dbo.stock_movement_requests;
END;

DELETE FROM dbo.change_history
WHERE entity_name = N'STOCK_MOVEMENT_REQUEST';

DELETE FROM dbo.activity_logs
WHERE entity_name = N'STOCK_MOVEMENT_REQUEST';

DELETE FROM dbo.domain_events
WHERE entity_type = N'STOCK_MOVEMENT_REQUEST';

DELETE FROM dbo.operational_comments
WHERE entity_type = N'STOCK_MOVEMENT_REQUEST';

DELETE FROM dbo.operational_attachments
WHERE entity_type = N'STOCK_MOVEMENT_REQUEST';
