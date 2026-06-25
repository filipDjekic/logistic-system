IF COL_LENGTH('OPERATIONAL_ATTACHMENTS', 'attachment_type') IS NULL
BEGIN
    ALTER TABLE OPERATIONAL_ATTACHMENTS
        ADD attachment_type VARCHAR(40) NOT NULL CONSTRAINT DF_OPERATIONAL_ATTACHMENTS_attachment_type DEFAULT 'DOCUMENT';
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'idx_operational_attachments_entity_type_created'
      AND object_id = OBJECT_ID('OPERATIONAL_ATTACHMENTS')
)
BEGIN
    CREATE INDEX idx_operational_attachments_entity_type_created
        ON OPERATIONAL_ATTACHMENTS(entity_type, entity_id, attachment_type, created_at);
END;
