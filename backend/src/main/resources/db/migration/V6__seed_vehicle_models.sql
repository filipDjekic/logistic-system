SET NOCOUNT ON;

DECLARE @models TABLE (
    brand_name NVARCHAR(60) NOT NULL,
    model_name NVARCHAR(60) NOT NULL,
    active BIT NOT NULL
);

INSERT INTO @models (brand_name, model_name, active)
VALUES
    (N'DAF', N'CF', 1),
    (N'DAF', N'LF', 1),
    (N'DAF', N'XF', 1),

    (N'Fiat', N'Doblo Cargo', 1),
    (N'Fiat', N'Ducato', 1),
    (N'Fiat', N'Fiorino', 1),

    (N'Ford', N'Tourneo Custom', 1),
    (N'Ford', N'Transit', 1),
    (N'Ford', N'Transit Connect', 1),
    (N'Ford', N'Transit Custom', 1),

    (N'Iveco', N'Daily', 1),
    (N'Iveco', N'Eurocargo', 1),
    (N'Iveco', N'S-Way', 1),

    (N'MAN', N'TGE', 1),
    (N'MAN', N'TGL', 1),
    (N'MAN', N'TGM', 1),
    (N'MAN', N'TGX', 1),

    (N'Mercedes-Benz', N'Actros', 1),
    (N'Mercedes-Benz', N'Arocs', 1),
    (N'Mercedes-Benz', N'Atego', 1),
    (N'Mercedes-Benz', N'Sprinter', 1),
    (N'Mercedes-Benz', N'Vito', 1),

    (N'Nissan', N'Interstar', 1),
    (N'Nissan', N'NV300', 1),
    (N'Nissan', N'NV400', 1),
    (N'Nissan', N'Primastar', 1),

    (N'Peugeot', N'Boxer', 1),
    (N'Peugeot', N'Expert', 1),
    (N'Peugeot', N'Partner', 1),

    (N'Renault', N'Kangoo Van', 1),
    (N'Renault', N'Master', 1),
    (N'Renault', N'Midlum', 1),
    (N'Renault', N'Trafic', 1),
    (N'Renault', N'Trucks T', 1),

    (N'Scania', N'G-series', 1),
    (N'Scania', N'L-series', 1),
    (N'Scania', N'P-series', 1),
    (N'Scania', N'R-series', 1),
    (N'Scania', N'S-series', 1),

    (N'Volkswagen', N'Crafter', 1),
    (N'Volkswagen', N'Caddy Cargo', 1),
    (N'Volkswagen', N'Transporter', 1),

    (N'Volvo', N'FE', 1),
    (N'Volvo', N'FH', 1),
    (N'Volvo', N'FL', 1),
    (N'Volvo', N'FM', 1);

MERGE vehicle_models AS target
USING (
    SELECT b.id AS brand_id, m.model_name AS name, m.active
    FROM @models m
    INNER JOIN vehicle_brands b ON LOWER(b.name) = LOWER(m.brand_name)
) AS source
ON target.brand_id = source.brand_id AND LOWER(target.name) = LOWER(source.name)
WHEN MATCHED THEN
    UPDATE SET active = source.active
WHEN NOT MATCHED THEN
    INSERT (brand_id, name, active)
    VALUES (source.brand_id, source.name, source.active);
