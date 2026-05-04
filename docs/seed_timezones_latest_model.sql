SET XACT_ABORT ON;
BEGIN TRANSACTION;

;WITH timezone_seed AS (
    SELECT *
    FROM (VALUES
        ('RS', 'Europe/Belgrade', 'Europe/Belgrade (UTC+01:00)', 60, CAST(1 AS bit)),
        ('HR', 'Europe/Zagreb', 'Europe/Zagreb (UTC+01:00)', 60, CAST(1 AS bit)),
        ('BA', 'Europe/Sarajevo', 'Europe/Sarajevo (UTC+01:00)', 60, CAST(1 AS bit)),
        ('ME', 'Europe/Podgorica', 'Europe/Podgorica (UTC+01:00)', 60, CAST(1 AS bit)),
        ('SI', 'Europe/Ljubljana', 'Europe/Ljubljana (UTC+01:00)', 60, CAST(1 AS bit)),
        ('MK', 'Europe/Skopje', 'Europe/Skopje (UTC+01:00)', 60, CAST(1 AS bit)),
        ('DE', 'Europe/Berlin', 'Europe/Berlin (UTC+01:00)', 60, CAST(1 AS bit)),
        ('AT', 'Europe/Vienna', 'Europe/Vienna (UTC+01:00)', 60, CAST(1 AS bit)),
        ('CH', 'Europe/Zurich', 'Europe/Zurich (UTC+01:00)', 60, CAST(1 AS bit)),
        ('FR', 'Europe/Paris', 'Europe/Paris (UTC+01:00)', 60, CAST(1 AS bit)),
        ('IT', 'Europe/Rome', 'Europe/Rome (UTC+01:00)', 60, CAST(1 AS bit)),
        ('ES', 'Europe/Madrid', 'Europe/Madrid (UTC+01:00)', 60, CAST(1 AS bit)),
        ('NL', 'Europe/Amsterdam', 'Europe/Amsterdam (UTC+01:00)', 60, CAST(1 AS bit)),
        ('GB', 'Europe/London', 'Europe/London (UTC+00:00)', 0, CAST(1 AS bit)),
        ('SE', 'Europe/Stockholm', 'Europe/Stockholm (UTC+01:00)', 60, CAST(1 AS bit)),
        ('NO', 'Europe/Oslo', 'Europe/Oslo (UTC+01:00)', 60, CAST(1 AS bit)),
        ('DK', 'Europe/Copenhagen', 'Europe/Copenhagen (UTC+01:00)', 60, CAST(1 AS bit)),
        ('US', 'America/New_York', 'America/New_York (UTC-05:00)', -300, CAST(1 AS bit)),
        ('CA', 'America/Toronto', 'America/Toronto (UTC-05:00)', -300, CAST(1 AS bit)),
        ('BR', 'America/Sao_Paulo', 'America/Sao_Paulo (UTC-03:00)', -180, CAST(1 AS bit)),
        ('CN', 'Asia/Shanghai', 'Asia/Shanghai (UTC+08:00)', 480, CAST(1 AS bit)),
        ('IN', 'Asia/Kolkata', 'Asia/Kolkata (UTC+05:30)', 330, CAST(1 AS bit)),
        ('JP', 'Asia/Tokyo', 'Asia/Tokyo (UTC+09:00)', 540, CAST(1 AS bit)),
        ('AE', 'Asia/Dubai', 'Asia/Dubai (UTC+04:00)', 240, CAST(1 AS bit)),
        ('ZA', 'Africa/Johannesburg', 'Africa/Johannesburg (UTC+02:00)', 120, CAST(1 AS bit))
    ) AS v(country_code, name, display_name, utc_offset_minutes, active)
), source_rows AS (
    SELECT
        c.id AS country_id,
        s.name,
        s.display_name,
        s.utc_offset_minutes,
        s.active
    FROM timezone_seed s
    INNER JOIN countries c ON c.code = s.country_code
)
MERGE timezones WITH (HOLDLOCK) AS target
USING source_rows AS source
ON target.name = source.name
WHEN MATCHED THEN
    UPDATE SET
        target.display_name = source.display_name,
        target.utc_offset_minutes = source.utc_offset_minutes,
        target.active = source.active,
        target.country_id = source.country_id
WHEN NOT MATCHED BY TARGET THEN
    INSERT (name, display_name, utc_offset_minutes, active, country_id)
    VALUES (source.name, source.display_name, source.utc_offset_minutes, source.active, source.country_id);

UPDATE c
SET c.default_timezone_id = tz.id
FROM countries c
INNER JOIN (VALUES
    ('RS', 'Europe/Belgrade'), ('HR', 'Europe/Zagreb'), ('BA', 'Europe/Sarajevo'),
    ('ME', 'Europe/Podgorica'), ('SI', 'Europe/Ljubljana'), ('MK', 'Europe/Skopje'),
    ('DE', 'Europe/Berlin'), ('AT', 'Europe/Vienna'), ('CH', 'Europe/Zurich'),
    ('FR', 'Europe/Paris'), ('IT', 'Europe/Rome'), ('ES', 'Europe/Madrid'),
    ('NL', 'Europe/Amsterdam'), ('GB', 'Europe/London'), ('SE', 'Europe/Stockholm'),
    ('NO', 'Europe/Oslo'), ('DK', 'Europe/Copenhagen'), ('US', 'America/New_York'),
    ('CA', 'America/Toronto'), ('BR', 'America/Sao_Paulo'), ('CN', 'Asia/Shanghai'),
    ('IN', 'Asia/Kolkata'), ('JP', 'Asia/Tokyo'), ('AE', 'Asia/Dubai'),
    ('ZA', 'Africa/Johannesburg')
) AS m(country_code, timezone_name) ON m.country_code = c.code
INNER JOIN timezones tz ON tz.name = m.timezone_name;

COMMIT TRANSACTION;
