ALTER TABLE transport_orders
    ADD priority_new NVARCHAR(20) NULL;
GO

UPDATE transport_orders
SET priority_new =
        CASE priority
            WHEN 0 THEN 'LOW'
            WHEN 1 THEN 'LOW'
            WHEN 2 THEN 'MEDIUM'
            WHEN 3 THEN 'HIGH'
            WHEN 4 THEN 'URGENT'
            ELSE 'MEDIUM'
            END;
GO

ALTER TABLE transport_orders
ALTER COLUMN priority_new NVARCHAR(20) NOT NULL;
GO

ALTER TABLE transport_orders
DROP COLUMN priority;
GO

EXEC sp_rename 'transport_orders.priority_new', 'priority', 'COLUMN';
GO