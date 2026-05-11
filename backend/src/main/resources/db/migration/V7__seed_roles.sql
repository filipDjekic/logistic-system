SET IDENTITY_INSERT roles ON;

MERGE roles AS target
USING (
    VALUES
        (1, 'OVERLORD', 'System overlord with global access'),
        (2, 'COMPANY_ADMIN', 'Company administrator with full company management permissions'),
        (3, 'HR_MANAGER', 'Human resources manager responsible for employees and shifts'),
        (4, 'WAREHOUSE_MANAGER', 'Warehouse manager responsible for inventory and warehouse operations'),
        (5, 'DISPATCHER', 'Dispatcher responsible for transport coordination'),
        (6, 'DRIVER', 'Vehicle driver responsible for transport execution'),
        (7, 'WORKER', 'Warehouse worker responsible for operational tasks')
) AS source (id, name, description)
ON target.id = source.id

WHEN MATCHED THEN
    UPDATE SET
        target.name = source.name,
        target.description = source.description

WHEN NOT MATCHED THEN
    INSERT (id, name, description)
    VALUES (source.id, source.name, source.description);

SET IDENTITY_INSERT roles OFF;