IF DB_ID(N'$(DB_NAME)') IS NULL
BEGIN
    DECLARE @createDatabaseSql nvarchar(max) =
        N'CREATE DATABASE ' + QUOTENAME(N'$(DB_NAME)') + N';';
    EXEC sys.sp_executesql @createDatabaseSql;
END;
GO
