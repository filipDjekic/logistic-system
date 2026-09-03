UPDATE dbo.NOTIFICATIONS
SET status = N'READ'
WHERE status IN (N'ACKNOWLEDGED', N'RESOLVED');

DECLARE @notificationsObjectId INT = OBJECT_ID(N'dbo.NOTIFICATIONS');
DECLARE @statusColumnId INT = COLUMNPROPERTY(@notificationsObjectId, N'status', 'ColumnId');
DECLARE @hadStatusCheckConstraint BIT = 0;
DECLARE @dropSql NVARCHAR(MAX) = N'';

IF EXISTS (
    SELECT 1
    FROM sys.check_constraints cc
    LEFT JOIN sys.sql_expression_dependencies dependency
        ON dependency.referencing_id = cc.object_id
    WHERE cc.parent_object_id = @notificationsObjectId
      AND (
          dependency.referenced_minor_id = @statusColumnId
          OR cc.definition LIKE N'%status%'
      )
)
BEGIN
    SET @hadStatusCheckConstraint = 1;

    SELECT @dropSql = @dropSql
        + N'ALTER TABLE dbo.NOTIFICATIONS DROP CONSTRAINT '
        + QUOTENAME(cc.name)
        + N';'
    FROM sys.check_constraints cc
    WHERE cc.parent_object_id = @notificationsObjectId
      AND (
          EXISTS (
              SELECT 1
              FROM sys.sql_expression_dependencies dependency
              WHERE dependency.referencing_id = cc.object_id
                AND dependency.referenced_minor_id = @statusColumnId
          )
          OR cc.definition LIKE N'%status%'
      );

    EXEC sys.sp_executesql @dropSql;
END;

IF @hadStatusCheckConstraint = 1
BEGIN
    ALTER TABLE dbo.NOTIFICATIONS
        ADD CONSTRAINT ck_notifications_status_unread_read
        CHECK (status IN (N'UNREAD', N'READ'));
END;

SET @dropSql = N'';

SELECT @dropSql = @dropSql
    + N'DROP INDEX '
    + QUOTENAME(indexes.name)
    + N' ON dbo.NOTIFICATIONS;'
FROM sys.indexes indexes
WHERE indexes.object_id = @notificationsObjectId
  AND indexes.is_primary_key = 0
  AND indexes.is_unique_constraint = 0
  AND EXISTS (
      SELECT 1
      FROM sys.index_columns indexColumns
      JOIN sys.columns columns
        ON columns.object_id = indexColumns.object_id
       AND columns.column_id = indexColumns.column_id
      WHERE indexColumns.object_id = indexes.object_id
        AND indexColumns.index_id = indexes.index_id
        AND columns.name IN (N'acknowledged_at', N'resolved_at')
  );

IF LEN(@dropSql) > 0
BEGIN
    EXEC sys.sp_executesql @dropSql;
END;

SET @dropSql = N'';

SELECT @dropSql = @dropSql
    + N'ALTER TABLE dbo.NOTIFICATIONS DROP CONSTRAINT '
    + QUOTENAME(defaultConstraints.name)
    + N';'
FROM sys.default_constraints defaultConstraints
JOIN sys.columns columns
  ON columns.object_id = defaultConstraints.parent_object_id
 AND columns.column_id = defaultConstraints.parent_column_id
WHERE defaultConstraints.parent_object_id = @notificationsObjectId
  AND columns.name IN (N'acknowledged_at', N'resolved_at');

IF LEN(@dropSql) > 0
BEGIN
    EXEC sys.sp_executesql @dropSql;
END;

SET @dropSql = N'';

SELECT @dropSql = @dropSql
    + N'ALTER TABLE dbo.NOTIFICATIONS DROP CONSTRAINT '
    + QUOTENAME(checkConstraints.name)
    + N';'
FROM sys.check_constraints checkConstraints
WHERE checkConstraints.parent_object_id = @notificationsObjectId
  AND (
      EXISTS (
          SELECT 1
          FROM sys.sql_expression_dependencies dependency
          JOIN sys.columns columns
            ON columns.object_id = dependency.referenced_id
           AND columns.column_id = dependency.referenced_minor_id
          WHERE dependency.referencing_id = checkConstraints.object_id
            AND columns.name IN (N'acknowledged_at', N'resolved_at')
      )
      OR checkConstraints.definition LIKE N'%acknowledged_at%'
      OR checkConstraints.definition LIKE N'%resolved_at%'
  );

IF LEN(@dropSql) > 0
BEGIN
    EXEC sys.sp_executesql @dropSql;
END;

IF COL_LENGTH(N'dbo.NOTIFICATIONS', N'acknowledged_at') IS NOT NULL
BEGIN
    ALTER TABLE dbo.NOTIFICATIONS DROP COLUMN acknowledged_at;
END;

IF COL_LENGTH(N'dbo.NOTIFICATIONS', N'resolved_at') IS NOT NULL
BEGIN
    ALTER TABLE dbo.NOTIFICATIONS DROP COLUMN resolved_at;
END;
