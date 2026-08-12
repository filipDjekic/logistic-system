ALTER TABLE shifts ADD version BIGINT NOT NULL
    CONSTRAINT df_shifts_version DEFAULT 0;
