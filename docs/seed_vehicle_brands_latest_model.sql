SET NOCOUNT ON;

MERGE VEHICLE_BRANDS AS target
USING (VALUES
    (N'DAF', 1),
    (N'Fiat', 1),
    (N'Ford', 1),
    (N'Iveco', 1),
    (N'MAN', 1),
    (N'Mercedes-Benz', 1),
    (N'Nissan', 1),
    (N'Peugeot', 1),
    (N'Renault', 1),
    (N'Scania', 1),
    (N'Volkswagen', 1),
    (N'Volvo', 1)
) AS source(name, active)
ON LOWER(target.name) = LOWER(source.name)
WHEN MATCHED THEN
    UPDATE SET active = source.active
WHEN NOT MATCHED THEN
    INSERT (name, active)
    VALUES (source.name, source.active);
