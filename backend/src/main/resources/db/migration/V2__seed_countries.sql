BEGIN TRANSACTION;

MERGE countries AS target
USING (VALUES
    ('RS', 'SRB', '688', 'Serbia', '+381', 'RSD', 'Serbian dinar', CAST(0 AS bit), CAST(1 AS bit)),
    ('HR', 'HRV', '191', 'Croatia', '+385', 'EUR', 'Euro', CAST(1 AS bit), CAST(1 AS bit)),
    ('BA', 'BIH', '070', 'Bosnia and Herzegovina', '+387', 'BAM', 'Convertible mark', CAST(0 AS bit), CAST(1 AS bit)),
    ('ME', 'MNE', '499', 'Montenegro', '+382', 'EUR', 'Euro', CAST(0 AS bit), CAST(1 AS bit)),
    ('SI', 'SVN', '705', 'Slovenia', '+386', 'EUR', 'Euro', CAST(1 AS bit), CAST(1 AS bit)),
    ('MK', 'MKD', '807', 'North Macedonia', '+389', 'MKD', 'Denar', CAST(0 AS bit), CAST(1 AS bit)),
    ('DE', 'DEU', '276', 'Germany', '+49', 'EUR', 'Euro', CAST(1 AS bit), CAST(1 AS bit)),
    ('AT', 'AUT', '040', 'Austria', '+43', 'EUR', 'Euro', CAST(1 AS bit), CAST(1 AS bit)),
    ('CH', 'CHE', '756', 'Switzerland', '+41', 'CHF', 'Swiss franc', CAST(0 AS bit), CAST(1 AS bit)),
    ('FR', 'FRA', '250', 'France', '+33', 'EUR', 'Euro', CAST(1 AS bit), CAST(1 AS bit)),
    ('IT', 'ITA', '380', 'Italy', '+39', 'EUR', 'Euro', CAST(1 AS bit), CAST(1 AS bit)),
    ('ES', 'ESP', '724', 'Spain', '+34', 'EUR', 'Euro', CAST(1 AS bit), CAST(1 AS bit)),
    ('NL', 'NLD', '528', 'Netherlands', '+31', 'EUR', 'Euro', CAST(1 AS bit), CAST(1 AS bit)),
    ('GB', 'GBR', '826', 'United Kingdom', '+44', 'GBP', 'Pound sterling', CAST(0 AS bit), CAST(1 AS bit)),
    ('SE', 'SWE', '752', 'Sweden', '+46', 'SEK', 'Swedish krona', CAST(1 AS bit), CAST(1 AS bit)),
    ('NO', 'NOR', '578', 'Norway', '+47', 'NOK', 'Norwegian krone', CAST(0 AS bit), CAST(1 AS bit)),
    ('DK', 'DNK', '208', 'Denmark', '+45', 'DKK', 'Danish krone', CAST(1 AS bit), CAST(1 AS bit)),
    ('US', 'USA', '840', 'United States', '+1', 'USD', 'US dollar', CAST(0 AS bit), CAST(1 AS bit)),
    ('CA', 'CAN', '124', 'Canada', '+1', 'CAD', 'Canadian dollar', CAST(0 AS bit), CAST(1 AS bit)),
    ('BR', 'BRA', '076', 'Brazil', '+55', 'BRL', 'Brazilian real', CAST(0 AS bit), CAST(1 AS bit)),
    ('CN', 'CHN', '156', 'China', '+86', 'CNY', 'Yuan', CAST(0 AS bit), CAST(1 AS bit)),
    ('IN', 'IND', '356', 'India', '+91', 'INR', 'Indian rupee', CAST(0 AS bit), CAST(1 AS bit)),
    ('JP', 'JPN', '392', 'Japan', '+81', 'JPY', 'Yen', CAST(0 AS bit), CAST(1 AS bit)),
    ('AE', 'ARE', '784', 'United Arab Emirates', '+971', 'AED', 'Dirham', CAST(0 AS bit), CAST(1 AS bit)),
    ('ZA', 'ZAF', '710', 'South Africa', '+27', 'ZAR', 'Rand', CAST(0 AS bit), CAST(1 AS bit))
) AS source (code, code_three, numeric_code, name, phone_code, currency_code, currency_name, eu_member, active)
ON target.code = source.code
WHEN MATCHED THEN UPDATE SET
    target.code_three = source.code_three,
    target.numeric_code = source.numeric_code,
    target.name = source.name,
    target.phone_code = source.phone_code,
    target.currency_code = source.currency_code,
    target.currency_name = source.currency_name,
    target.eu_member = source.eu_member,
    target.active = source.active
WHEN NOT MATCHED THEN INSERT
    (code, code_three, numeric_code, name, phone_code, currency_code, currency_name, eu_member, active)
VALUES
    (source.code, source.code_three, source.numeric_code, source.name, source.phone_code, source.currency_code, source.currency_name, source.eu_member, source.active);

COMMIT TRANSACTION;
