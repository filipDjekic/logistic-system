IF COL_LENGTH('dbo.NOTIFICATIONS', 'group_key') IS NULL
BEGIN
ALTER TABLE dbo.NOTIFICATIONS ADD group_key NVARCHAR(180) NULL;
END;

IF COL_LENGTH('dbo.NOTIFICATIONS', 'group_count') IS NULL
BEGIN
ALTER TABLE dbo.NOTIFICATIONS ADD group_count INT NOT NULL CONSTRAINT DF_notifications_group_count DEFAULT 1;
END;

IF COL_LENGTH('dbo.NOTIFICATIONS', 'last_grouped_at') IS NULL
BEGIN
ALTER TABLE dbo.NOTIFICATIONS ADD last_grouped_at DATETIME2 NULL;
END;

EXEC('
UPDATE dbo.NOTIFICATIONS
SET group_key = dedup_key
WHERE group_key IS NULL AND dedup_key IS NOT NULL
');

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'idx_notifications_user_group_status'
      AND object_id = OBJECT_ID('dbo.NOTIFICATIONS')
)
BEGIN
EXEC('CREATE INDEX idx_notifications_user_group_status ON dbo.NOTIFICATIONS(user_id, group_key, status)');
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'idx_notifications_status_created'
      AND object_id = OBJECT_ID('dbo.NOTIFICATIONS')
)
BEGIN
CREATE INDEX idx_notifications_status_created ON dbo.NOTIFICATIONS(status, created_at);
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'idx_activity_logs_created_at'
      AND object_id = OBJECT_ID('dbo.ACTIVITY_LOGS')
)
BEGIN
CREATE INDEX idx_activity_logs_created_at ON dbo.ACTIVITY_LOGS(created_at);
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'idx_change_history_changed_at'
      AND object_id = OBJECT_ID('dbo.CHANGE_HISTORY')
)
BEGIN
CREATE INDEX idx_change_history_changed_at ON dbo.CHANGE_HISTORY(changed_at);
END;