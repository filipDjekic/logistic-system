SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @now DATETIME2 = SYSUTCDATETIME();
DECLARE @pwd NVARCHAR(255) = '$2a$10$NBqZSKuQWFxDQx5taxDczuSxfo/mwhAzngiVOPnpVAKr0RskxtaSG';
DECLARE @countryId BIGINT = (SELECT TOP (1) id FROM countries WHERE code = 'RS');
DECLARE @timezoneId BIGINT = (SELECT TOP (1) id FROM timezones WHERE name = 'Europe/Belgrade');
DECLARE @bgCityId BIGINT = (SELECT TOP (1) id FROM cities WHERE country_id = @countryId AND name = 'Belgrade');
DECLARE @nsCityId BIGINT = (SELECT TOP (1) id FROM cities WHERE country_id = @countryId AND name = 'Novi Sad');
DECLARE @companyId BIGINT;

IF @countryId IS NULL OR @timezoneId IS NULL OR @bgCityId IS NULL OR @nsCityId IS NULL
    THROW 51044, 'V44 prerequisites are missing: Serbia, Belgrade, Novi Sad or Europe/Belgrade.', 1;

IF NOT EXISTS (SELECT 1 FROM companies WHERE name = N'Dunav Transit Logistics d.o.o.')
BEGIN
    INSERT INTO companies
        (name, active, country_id, phone_code, timezone_id, address, city_id, postal_code,
         phone_number, email, tax_number, registration_number, created_at, updated_at)
    VALUES
        (N'Dunav Transit Logistics d.o.o.', 1, @countryId, N'+381', @timezoneId,
         N'Industrijski put 18', @bgCityId, N'11070', N'116420880',
         N'office@dunavtransit.rs', N'114728390', N'22184736', DATEADD(YEAR, -3, @now), @now);
END;
SELECT @companyId = id FROM companies WHERE name = N'Dunav Transit Logistics d.o.o.';

/* Users and employees. Email is the application's login identifier. */
DECLARE @people TABLE (
    rn INT PRIMARY KEY, first_name NVARCHAR(60), last_name NVARCHAR(60), login_name NVARCHAR(40),
    role_name NVARCHAR(50), position NVARCHAR(50), jmbg NVARCHAR(13), phone NVARCHAR(30),
    salary DECIMAL(12,2), warehouse_slot INT NULL
);
INSERT INTO @people VALUES
(1,N'Nikola',N'Petrović',N'company.admin',N'COMPANY_ADMIN',N'COMPANY_ADMIN',N'0101900711001',N'641101101',190000,NULL),
(2,N'Jelena',N'Marković',N'hr.manager',N'HR_MANAGER',N'HR_MANAGER',N'0202900711002',N'641101102',160000,NULL),
(3,N'Stefan',N'Jovanović',N'warehouse.bg',N'WAREHOUSE_MANAGER',N'WAREHOUSE_MANAGER',N'0303900711003',N'641101103',150000,1),
(4,N'Milica',N'Ilić',N'warehouse.ns',N'WAREHOUSE_MANAGER',N'WAREHOUSE_MANAGER',N'0404900711004',N'641101104',148000,2),
(5,N'Marko',N'Stanković',N'dispatcher.bg',N'DISPATCHER',N'DISPATCHER',N'0505900711005',N'641101105',142000,1),
(6,N'Ana',N'Nikolić',N'dispatcher.ns',N'DISPATCHER',N'DISPATCHER',N'0606900711006',N'641101106',140000,2),
(7,N'Luka',N'Pavlović',N'driver.luka',N'DRIVER',N'DRIVER',N'0707900711007',N'641101107',128000,1),
(8,N'Mina',N'Ristić',N'driver.mina',N'DRIVER',N'DRIVER',N'0808900711008',N'641101108',126000,1),
(9,N'Vuk',N'Savić',N'driver.vuk',N'DRIVER',N'DRIVER',N'0909900711009',N'641101109',125000,2),
(10,N'Tamara',N'Kostić',N'driver.tamara',N'DRIVER',N'DRIVER',N'1010900711010',N'641101110',125000,2),
(11,N'Filip',N'Đorđević',N'worker.filip',N'WORKER',N'WORKER',N'1111900711011',N'641101111',98000,1),
(12,N'Sara',N'Milošević',N'worker.sara',N'WORKER',N'WORKER',N'1212900711012',N'641101112',97000,1),
(13,N'Nemanja',N'Popović',N'worker.nemanja',N'WORKER',N'WORKER',N'1301910711013',N'641101113',96000,1),
(14,N'Ivana',N'Lazić',N'worker.ivana',N'WORKER',N'WORKER',N'1402910711014',N'641101114',96000,1),
(15,N'Ognjen',N'Marić',N'worker.ognjen',N'WORKER',N'WORKER',N'1503910711015',N'641101115',95000,2),
(16,N'Marija',N'Vasić',N'worker.marija',N'WORKER',N'WORKER',N'1604910711016',N'641101116',95000,2),
(17,N'Andrej',N'Todorović',N'worker.andrej',N'WORKER',N'WORKER',N'1705910711017',N'641101117',94000,2),
(18,N'Katarina',N'Perić',N'worker.katarina',N'WORKER',N'WORKER',N'1806910711018',N'641101118',94000,2);

INSERT INTO users (password, first_name, last_name, email, status, enabled, created_at, updated_at, role_id, company_id)
SELECT @pwd, p.first_name, p.last_name, CONCAT(p.login_name, N'@dunavtransit.rs'),
       'ACTIVE', 1, DATEADD(MONTH, -18, @now), @now, r.id, @companyId
FROM @people p JOIN roles r ON r.name = p.role_name
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.email = CONCAT(p.login_name, N'@dunavtransit.rs'));

INSERT INTO employees
    (first_name,last_name,jmbg,phone_code,phone_number,email,address,city_id,postal_code,timezone_id,
     position,employment_date,salary,active,updated_at,company_id,country_id,primary_warehouse_id,user_id,
     auto_generated_email,email_manually_overridden,email_generation_source)
SELECT p.first_name,p.last_name,p.jmbg,N'+381',p.phone,CONCAT(p.login_name,N'@dunavtransit.rs'),
       CONCAT(N'Logistička ulica ',p.rn),CASE WHEN p.warehouse_slot=2 THEN @nsCityId ELSE @bgCityId END,
       CASE WHEN p.warehouse_slot=2 THEN N'21000' ELSE N'11070' END,@timezoneId,p.position,
       DATEADD(DAY,-600-p.rn,CAST(@now AS DATE)),p.salary,1,@now,@companyId,@countryId,NULL,u.id,1,0,N'V44_REALISTIC_SEED'
FROM @people p JOIN users u ON u.email=CONCAT(p.login_name,N'@dunavtransit.rs')
WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.company_id=@companyId AND e.jmbg=p.jmbg);

/* Warehouses, assignments and location hierarchy. */
DECLARE @warehouses TABLE(slot INT PRIMARY KEY, code NVARCHAR(10), name NVARCHAR(100), city_id BIGINT, address NVARCHAR(200), capacity DECIMAL(38,2));
INSERT INTO @warehouses VALUES
(1,N'BG',N'Dunav DC Beograd',@bgCityId,N'Industrijska zona Surčin 24',18000),
(2,N'NS',N'Dunav Hub Novi Sad',@nsCityId,N'Privrednikova 16',10500);

INSERT INTO warehouses (name,address,city_id,postal_code,timezone_id,latitude,longitude,capacity,status,active,updated_at,company_id,country_id,manager_id,bin_tracking_enabled)
SELECT w.name,w.address,w.city_id,CASE w.slot WHEN 1 THEN N'11271' ELSE N'21000' END,@timezoneId,
       CASE w.slot WHEN 1 THEN 44.7865000 ELSE 45.2868000 END,
       CASE w.slot WHEN 1 THEN 20.2674000 ELSE 19.8453000 END,w.capacity,'ACTIVE',1,@now,@companyId,@countryId,
       (SELECT e.id FROM employees e JOIN @people p ON p.jmbg=e.jmbg WHERE p.position='WAREHOUSE_MANAGER' AND p.warehouse_slot=w.slot),1
FROM @warehouses w
WHERE NOT EXISTS (SELECT 1 FROM warehouses x WHERE x.company_id=@companyId AND x.name=w.name);

UPDATE e SET primary_warehouse_id=w.id
FROM employees e JOIN @people p ON p.jmbg=e.jmbg
JOIN @warehouses sw ON sw.slot=p.warehouse_slot
JOIN warehouses w ON w.company_id=@companyId AND w.name=sw.name
WHERE e.company_id=@companyId AND p.warehouse_slot IS NOT NULL;

INSERT INTO employee_warehouse_assignments
    (company_id,employee_id,warehouse_id,access_type,active,valid_from,valid_to,notes,created_at,updated_at)
SELECT @companyId,e.id,w.id,
       CASE p.position WHEN 'WAREHOUSE_MANAGER' THEN 'MANAGER' WHEN 'DISPATCHER' THEN 'DISPATCH'
            WHEN 'DRIVER' THEN 'PRIMARY' ELSE 'WORKER' END,1,DATEADD(YEAR,-1,CAST(@now AS DATE)),NULL,
       N'Aktivno matično operativno mesto',DATEADD(YEAR,-1,@now),@now
FROM @people p JOIN employees e ON e.company_id=@companyId AND e.jmbg=p.jmbg
JOIN @warehouses sw ON sw.slot=p.warehouse_slot JOIN warehouses w ON w.company_id=@companyId AND w.name=sw.name
WHERE p.warehouse_slot IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM employee_warehouse_assignments a WHERE a.employee_id=e.id AND a.warehouse_id=w.id);

DECLARE @zones TABLE(code NVARCHAR(10), name NVARCHAR(120), type NVARCHAR(30), capacity DECIMAL(12,2));
INSERT INTO @zones VALUES
(N'REC',N'Prijem robe',N'RECEIVING',900),(N'STO',N'Paletno skladište',N'STORAGE',6200),
(N'PIC',N'Komisioniranje',N'PICKING',1800),(N'PAC',N'Pakovanje',N'PACKING',900),
(N'DSP',N'Otprema',N'DISPATCH',1400),(N'RET',N'Povrat robe',N'RETURNS',500),
(N'QUA',N'Karantin',N'QUARANTINE',300);
INSERT INTO warehouse_zones (warehouse_id,code,name,type,capacity,active,description,created_at,updated_at)
SELECT w.id,CONCAT(sw.code,N'-',z.code),z.name,z.type,
       CASE sw.slot WHEN 1 THEN z.capacity ELSE z.capacity*0.65 END,1,N'Operativna zona demo kompanije',DATEADD(YEAR,-2,@now),@now
FROM @warehouses sw JOIN warehouses w ON w.company_id=@companyId AND w.name=sw.name CROSS JOIN @zones z
WHERE NOT EXISTS (SELECT 1 FROM warehouse_zones x WHERE x.warehouse_id=w.id AND x.code=CONCAT(sw.code,N'-',z.code));

DECLARE @binTemplate TABLE(zone_code NVARCHAR(10), suffix NVARCHAR(10), label NVARCHAR(40), capacity DECIMAL(12,2));
INSERT INTO @binTemplate VALUES
(N'REC',N'01',N'Prijem 01',180),(N'REC',N'02',N'Prijem 02',180),
(N'STO',N'A01',N'Regal A01',520),(N'STO',N'A02',N'Regal A02',520),(N'STO',N'B01',N'Regal B01',480),(N'STO',N'B02',N'Regal B02',480),
(N'PIC',N'A01',N'Picking A01',300),(N'PIC',N'A02',N'Picking A02',300),(N'PIC',N'B01',N'Picking B01',300),
(N'PAC',N'01',N'Pakovanje 01',160),(N'DSP',N'01',N'Otprema 01',240),(N'DSP',N'02',N'Otprema 02',240),
(N'RET',N'01',N'Povrat 01',120),(N'QUA',N'01',N'Karantin 01',100);
INSERT INTO bin_locations (warehouse_id,zone_id,code,name,capacity,active,description,created_at,updated_at)
SELECT w.id,z.id,CONCAT(sw.code,N'-',b.zone_code,N'-',b.suffix),b.label,
       CASE sw.slot WHEN 1 THEN b.capacity ELSE b.capacity*0.75 END,1,N'Označena skladišna pozicija',DATEADD(YEAR,-2,@now),@now
FROM @warehouses sw JOIN warehouses w ON w.company_id=@companyId AND w.name=sw.name
JOIN @binTemplate b ON sw.slot=1 OR b.suffix NOT IN (N'02',N'B02')
JOIN warehouse_zones z ON z.warehouse_id=w.id AND z.code=CONCAT(sw.code,N'-',b.zone_code)
WHERE NOT EXISTS (SELECT 1 FROM bin_locations x WHERE x.warehouse_id=w.id AND x.code=CONCAT(sw.code,N'-',b.zone_code,N'-',b.suffix));

/* Product catalogue and balanced warehouse/bin inventory. */
DECLARE @products TABLE(rn INT PRIMARY KEY, sku NVARCHAR(50), name NVARCHAR(100), unit NVARCHAR(20), price DECIMAL(12,2), weight DECIMAL(12,2), fragile BIT);
INSERT INTO @products VALUES
(1,N'ELC-0001',N'Vektor Air Fryer AF-52',N'PIECE',12990,5.20,1),(2,N'HOM-0001',N'Morava kuvalo K18',N'PIECE',4290,1.35,1),
(3,N'ELC-0002',N'Orion bežični miš M200',N'PIECE',2190,0.12,0),(4,N'ELC-0003',N'Avala monitor 24 inča',N'PIECE',18990,4.60,1),
(5,N'OFF-0001',N'A4 papir OfficePro 80 g',N'BOX',3490,12.50,0),(6,N'OFF-0002',N'Toner LaserPrint 410',N'PIECE',6790,0.82,0),
(7,N'FMC-0001',N'Mineralna voda 0,5 l paket 24',N'BOX',1190,12.40,0),(8,N'FMC-0002',N'Integralni keks paket 12',N'BOX',1580,3.20,0),
(9,N'HYG-0001',N'Deterdžent za veš 3 l',N'PIECE',1390,3.25,0),(10,N'HYG-0002',N'Papirni ubrusi 12/1',N'BOX',990,2.10,0),
(11,N'AUT-0001',N'Motorno ulje 5W-30 4 l',N'PIECE',4290,3.70,0),(12,N'AUT-0002',N'Komplet prve pomoći',N'PIECE',1890,0.65,0),
(13,N'PKG-0001',N'Streč folija 500 mm',N'PIECE',1090,2.40,0),(14,N'PKG-0002',N'Kartonska kutija 400x300x300',N'BOX',1450,6.00,0),
(15,N'PKG-0003',N'Lepljiva traka 48 mm paket 36',N'BOX',2290,4.30,0),(16,N'HOM-0002',N'Usisivač Tara Compact',N'PIECE',15990,6.80,1),
(17,N'ELC-0004',N'USB-C punjač 65 W',N'PIECE',3890,0.28,0),(18,N'OFF-0003',N'Arhivska fascikla paket 20',N'BOX',2750,7.10,0),
(19,N'HYG-0003',N'Sredstvo za podove 5 l',N'PIECE',1790,5.25,0),(20,N'AUT-0003',N'Brisači univerzalni 600 mm',N'PIECE',1690,0.55,0),
(21,N'FMC-0003',N'Kafa u zrnu 1 kg paket 6',N'BOX',8490,6.30,0),(22,N'PKG-0004',N'Zaštitna folija sa mehurićima',N'PIECE',2390,4.80,0),
(23,N'ELC-0005',N'Prenosni skener barkoda',N'PIECE',22990,0.74,1),(24,N'HOM-0003',N'Mikrotalasna pećnica 20 l',N'PIECE',13990,11.20,1);
INSERT INTO products (name,description,sku,unit,price,fragile,weight,active,updated_at,company_id)
SELECT p.name,N'Komercijalni artikal za realističnu logističku simulaciju',p.sku,p.unit,p.price,p.fragile,p.weight,1,@now,@companyId
FROM @products p WHERE NOT EXISTS (SELECT 1 FROM products x WHERE x.company_id=@companyId AND x.sku=p.sku);

INSERT INTO warehouse_inventory
    (warehouse_id,product_id,quantity,reserved_quantity,min_stock_level,last_updated,version,average_unit_cost,total_value,currency)
SELECT w.id,p.id,CASE sw.slot WHEN 1 THEN 45+(t.rn*13)%180 ELSE 20+(t.rn*9)%95 END,
       CASE WHEN t.rn%4=0 THEN 8 WHEN t.rn%5=0 THEN 3 ELSE 0 END,
       CASE WHEN t.rn%6=0 THEN 55 ELSE 18 END,@now,0,t.price*0.72,
       (CASE sw.slot WHEN 1 THEN 45+(t.rn*13)%180 ELSE 20+(t.rn*9)%95 END)*(t.price*0.72),N'RSD'
FROM @warehouses sw JOIN warehouses w ON w.company_id=@companyId AND w.name=sw.name
CROSS JOIN @products t JOIN products p ON p.company_id=@companyId AND p.sku=t.sku
WHERE NOT (sw.slot=2 AND t.rn IN (2,6,16,24))
  AND NOT EXISTS (SELECT 1 FROM warehouse_inventory x WHERE x.warehouse_id=w.id AND x.product_id=p.id);

INSERT INTO bin_inventory (bin_location_id,product_id,quantity,last_updated,version)
SELECT b.id,wi.product_id,wi.quantity,@now,0
FROM warehouse_inventory wi JOIN warehouses w ON w.id=wi.warehouse_id AND w.company_id=@companyId
JOIN products p ON p.id=wi.product_id
JOIN bin_locations b ON b.warehouse_id=w.id AND b.code =
    CONCAT(CASE WHEN w.name=N'Dunav DC Beograd' THEN N'BG' ELSE N'NS' END,
           CASE WHEN p.weight>=10 THEN N'-STO-A01' WHEN p.fragile=1 THEN N'-STO-B01' ELSE N'-PIC-A01' END)
WHERE NOT EXISTS (SELECT 1 FROM bin_inventory x WHERE x.bin_location_id=b.id AND x.product_id=wi.product_id);

/* Fleet, maintenance and transport lifecycle. */
DECLARE @vehicles TABLE(rn INT PRIMARY KEY, plate NVARCHAR(20), brand NVARCHAR(60), model NVARCHAR(60), type NVARCHAR(30), status NVARCHAR(30), max_weight DECIMAL(12,2));
INSERT INTO @vehicles VALUES
(1,N'BG-1847-LT',N'Mercedes-Benz',N'Sprinter',N'VAN',N'AVAILABLE',1450),(2,N'BG-2365-KM',N'Volkswagen',N'Crafter',N'VAN',N'RESERVED',1600),
(3,N'BG-771-TD',N'MAN',N'TGL',N'BOX_TRUCK',N'IN_USE',7200),(4,N'NS-908-TD',N'Iveco',N'Eurocargo',N'TRUCK',N'AVAILABLE',7800),
(5,N'BG-552-TR',N'Mercedes-Benz',N'Actros',N'SEMI_TRUCK',N'IN_USE',22000),(6,N'NS-663-RP',N'Scania',N'P-series',N'SEMI_TRUCK',N'AVAILABLE',21000),
(7,N'BG-419-VN',N'Renault',N'Master',N'VAN',N'MAINTENANCE',1500),(8,N'NS-327-KR',N'MAN',N'TGM',N'TRUCK',N'OUT_OF_SERVICE',9000);
INSERT INTO vehicles (registration_number,vehicle_model_id,type,capacity,max_weight,max_volume,max_items,fuel_type,year_of_production,status,active,updated_at,company_id,version)
SELECT v.plate,m.id,v.type,v.max_weight,v.max_weight,CASE WHEN v.type='VAN' THEN 16 ELSE 45 END,
       CASE WHEN v.type='VAN' THEN 160 ELSE 420 END,'DIESEL',2018+v.rn%7,v.status,
       CASE WHEN v.status='OUT_OF_SERVICE' THEN 0 ELSE 1 END,@now,@companyId,0
FROM @vehicles v JOIN vehicle_brands b ON b.name=v.brand JOIN vehicle_models m ON m.brand_id=b.id AND m.name=v.model
WHERE NOT EXISTS (SELECT 1 FROM vehicles x WHERE x.company_id=@companyId AND x.registration_number=v.plate);

INSERT INTO vehicle_maintenance (vehicle_id,company_id,type,status,scheduled_at,started_at,completed_at,cancelled_at,odometer,cost,notes,cancel_reason,created_at,updated_at)
SELECT v.id,@companyId,x.type,x.status,DATEADD(DAY,x.day_offset,@now),
       CASE WHEN x.status IN ('IN_PROGRESS','COMPLETED') THEN DATEADD(HOUR,1,DATEADD(DAY,x.day_offset,@now)) END,
       CASE WHEN x.status='COMPLETED' THEN DATEADD(HOUR,5,DATEADD(DAY,x.day_offset,@now)) END,
       CASE WHEN x.status='CANCELLED' THEN DATEADD(HOUR,-2,DATEADD(DAY,x.day_offset,@now)) END,
       85000+x.rn*17000,x.cost,x.note,CASE WHEN x.status='CANCELLED' THEN N'Termin pomeren zbog dostupnosti servisa' END,
       DATEADD(DAY,x.day_offset-3,@now),@now
FROM (VALUES
 (1,N'ROUTINE_SERVICE',N'COMPLETED',-60,42000,N'Redovan servis i zamena filtera'),
 (2,N'TIRE_CHANGE',N'PLANNED',12,36000,N'Planirana zamena letnjih pneumatika'),
 (7,N'REPAIR',N'IN_PROGRESS',-1,78000,N'Dijagnostika sistema ubrizgavanja'),
 (8,N'INSPECTION',N'PLANNED',7,22000,N'Vanredni tehnički pregled'),
 (4,N'OIL_CHANGE',N'COMPLETED',-25,28000,N'Zamenjeno ulje i filter ulja'),
 (6,N'ROUTINE_SERVICE',N'CANCELLED',-8,0,N'Otkazani servisni termin')
) x(rn,type,status,day_offset,cost,note)
JOIN @vehicles sv ON sv.rn=x.rn JOIN vehicles v ON v.company_id=@companyId AND v.registration_number=sv.plate;

DECLARE @orders TABLE(rn INT PRIMARY KEY,status NVARCHAR(30),src INT,dst INT,vehicle INT,driver INT,priority NVARCHAR(20));
INSERT INTO @orders VALUES
(1,N'DELIVERED',1,2,1,7,N'HIGH'),(2,N'DELIVERED',2,1,4,9,N'MEDIUM'),(3,N'IN_TRANSIT',1,2,3,8,N'URGENT'),
(4,N'ASSIGNED',2,1,2,10,N'HIGH'),(5,N'PICKING',1,2,1,7,N'MEDIUM'),(6,N'PACKING',2,1,4,9,N'MEDIUM'),
(7,N'READY_FOR_LOADING',1,2,6,8,N'HIGH'),(8,N'LOADING',2,1,2,10,N'URGENT'),(9,N'DRAFT',1,2,1,7,N'LOW'),
(10,N'CANCELLED',2,1,4,9,N'LOW'),(11,N'FAILED',1,2,6,8,N'HIGH'),(12,N'RETURNING',2,1,3,10,N'URGENT');
INSERT INTO transport_orders
    (order_number,description,order_date,departure_time,actual_arrival_time,planned_arrival_time,status,priority,total_weight,notes,updated_at,created_at,
     source_warehouse_id,destination_warehouse_id,vehicle_id,assigned_employee_id,created_by_user_id,version)
SELECT CONCAT(N'DTL-2026-',RIGHT(CONCAT(N'0000',o.rn),4)),N'Međuskladišni transport Beograd–Novi Sad',
       DATEADD(DAY,-15+o.rn,@now),
       CASE WHEN o.status IN ('DELIVERED','IN_TRANSIT','RETURNING','FAILED') THEN DATEADD(HOUR,2,DATEADD(DAY,-15+o.rn,@now)) END,
       CASE WHEN o.status='DELIVERED' THEN DATEADD(HOUR,6,DATEADD(DAY,-15+o.rn,@now)) END,
       DATEADD(HOUR,8,DATEADD(DAY,-15+o.rn,@now)),o.status,o.priority,280+o.rn*47,
       CASE o.status WHEN 'CANCELLED' THEN N'Otkazano zbog izmene termina prijema'
                     WHEN 'FAILED' THEN N'Neuspešna isporuka zbog oštećene ambalaže'
                     WHEN 'RETURNING' THEN N'Povrat robe nakon kontrole primaoca' ELSE N'Operativni nalog demo kompanije' END,
       @now,DATEADD(DAY,-16+o.rn,@now),ws.id,wd.id,v.id,e.id,
       (SELECT id FROM users WHERE email=N'dispatcher.bg@dunavtransit.rs'),0
FROM @orders o
JOIN @warehouses sw ON sw.slot=o.src JOIN warehouses ws ON ws.company_id=@companyId AND ws.name=sw.name
JOIN @warehouses dw ON dw.slot=o.dst JOIN warehouses wd ON wd.company_id=@companyId AND wd.name=dw.name
JOIN @vehicles sv ON sv.rn=o.vehicle JOIN vehicles v ON v.company_id=@companyId AND v.registration_number=sv.plate
JOIN @people pe ON pe.rn=o.driver JOIN employees e ON e.company_id=@companyId AND e.jmbg=pe.jmbg
WHERE NOT EXISTS (SELECT 1 FROM transport_orders t WHERE t.order_number=CONCAT(N'DTL-2026-',RIGHT(CONCAT(N'0000',o.rn),4)));

INSERT INTO transport_order_items (quantity,reserved_quantity,dispatched_quantity,delivered_quantity,weight,note,transport_order_id,product_id)
SELECT 5+(o.rn+p.rn)%16,
       CASE WHEN o.status IN ('ASSIGNED','PICKING','PACKING','READY_FOR_LOADING','LOADING') THEN 5+(o.rn+p.rn)%16 ELSE 0 END,
       CASE WHEN o.status IN ('IN_TRANSIT','DELIVERED','FAILED','RETURNING') THEN 5+(o.rn+p.rn)%16 ELSE 0 END,
       CASE WHEN o.status='DELIVERED' THEN 5+(o.rn+p.rn)%16 ELSE 0 END,
       (5+(o.rn+p.rn)%16)*p.weight,N'Roba pravilno deklarisana',t.id,pr.id
FROM @orders o JOIN transport_orders t ON t.order_number=CONCAT(N'DTL-2026-',RIGHT(CONCAT(N'0000',o.rn),4))
JOIN @products p ON p.rn IN (((o.rn-1)%8)+1,((o.rn+7)%16)+1,((o.rn+15)%24)+1)
JOIN products pr ON pr.company_id=@companyId AND pr.sku=p.sku;

/* Workflow history and actionable work. */
INSERT INTO stock_movements
    (movement_type,status,quantity,reason_code,reason_description,reference_type,reference_id,reference_number,reference_note,
     transfer_group_id,adjustment_direction,quantity_before,quantity_after,reserved_before,reserved_after,available_before,available_after,
     expected_quantity,actual_quantity,discrepancy_quantity,created_at,warehouse_id,product_id,created_by_user_id,transport_order_id,
     source_type,source_id,reference_code,source_bin_id,destination_bin_id,unit_cost,total_cost,currency)
SELECT CASE n.n%6 WHEN 0 THEN 'INBOUND' WHEN 1 THEN 'OUTBOUND' WHEN 2 THEN 'ADJUSTMENT' WHEN 3 THEN 'RETURN_IN' WHEN 4 THEN 'RESERVATION' ELSE 'WRITE_OFF' END,
       CASE n.n%7 WHEN 0 THEN 'PENDING_APPROVAL' WHEN 1 THEN 'APPROVED' WHEN 2 THEN 'CANCELLED' WHEN 3 THEN 'REJECTED' ELSE 'EXECUTED' END,
       2+n.n%18,
       CASE n.n%6 WHEN 0 THEN 'PURCHASE_RECEIPT' WHEN 1 THEN 'TRANSPORT_DISPATCH' WHEN 2 THEN 'INVENTORY_ADJUSTMENT'
            WHEN 3 THEN 'RETURN_IN' WHEN 4 THEN 'STOCK_RESERVED' ELSE 'DAMAGE_WRITE_OFF' END,
       N'Realistična istorija kretanja zalihe','MANUAL',NULL,CONCAT(N'DTL-SM-',RIGHT(CONCAT(N'000',n.n),3)),N'Knjiženo u demo workflow-u',
       NULL,CASE WHEN n.n%6 IN (0,2,3) THEN 'INCREASE' WHEN n.n%6=5 THEN 'DECREASE' END,
       100,CASE WHEN n.n%6 IN (0,2,3) THEN 102+n.n%18 ELSE 98-n.n%18 END,10,10,90,CASE WHEN n.n%6 IN (0,2,3) THEN 92+n.n%18 ELSE 88-n.n%18 END,
       2+n.n%18,CASE WHEN n.n%9=0 THEN 1+n.n%18 ELSE 2+n.n%18 END,CASE WHEN n.n%9=0 THEN -1 ELSE 0 END,
       DATEADD(DAY,-45+n.n,@now),w.id,p.id,(SELECT id FROM users WHERE email=N'warehouse.bg@dunavtransit.rs'),NULL,
       'MANUAL',NULL,CONCAT(N'DTL-SM-',RIGHT(CONCAT(N'000',n.n),3)),NULL,NULL,t.price*0.72,(2+n.n%18)*(t.price*0.72),'RSD'
FROM (SELECT TOP (28) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) n FROM sys.all_objects) n
JOIN @products t ON t.rn=((n.n-1)%24)+1 JOIN products p ON p.company_id=@companyId AND p.sku=t.sku
JOIN warehouses w ON w.company_id=@companyId AND w.name=CASE WHEN n.n%2=0 THEN N'Dunav DC Beograd' ELSE N'Dunav Hub Novi Sad' END;

INSERT INTO tasks (title,description,due_date,priority,status,task_type,started_at,completed_at,cancelled_at,cancel_reason,created_at,updated_at,assigned_employee_id,transport_order_id,stock_movement_id,version)
SELECT CONCAT(N'Operativni zadatak ',n.n),N'Priprema, provera i obrada robe prema dnevnom planu',DATEADD(HOUR,n.n,@now),
       CASE n.n%4 WHEN 0 THEN 'URGENT' WHEN 1 THEN 'LOW' WHEN 2 THEN 'MEDIUM' ELSE 'HIGH' END,
       CASE n.n%7 WHEN 0 THEN 'CANCELLED' WHEN 1 THEN 'NEW' WHEN 2 THEN 'ASSIGNED' WHEN 3 THEN 'IN_PROGRESS'
            WHEN 4 THEN 'BLOCKED' ELSE 'COMPLETED' END,
       CASE n.n%7 WHEN 0 THEN 'PICKING' WHEN 1 THEN 'PACKING' WHEN 2 THEN 'LOADING' WHEN 3 THEN 'COUNTING'
            WHEN 4 THEN 'STOCK_MOVEMENT' WHEN 5 THEN 'ADMIN' ELSE 'UNLOADING' END,
       CASE WHEN n.n%7 IN (3,4,5,6) THEN DATEADD(HOUR,-3,@now) END,
       CASE WHEN n.n%7 IN (5,6) THEN DATEADD(HOUR,-1,@now) END,
       CASE WHEN n.n%7=0 THEN DATEADD(HOUR,-2,@now) END,
       CASE WHEN n.n%7=0 THEN N'Otkazano zbog promene operativnog plana' END,DATEADD(DAY,-n.n,@now),@now,e.id,NULL,NULL,0
FROM (SELECT TOP (26) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) n FROM sys.all_objects) n
JOIN @people pe ON pe.rn=11+((n.n-1)%8) JOIN employees e ON e.company_id=@companyId AND e.jmbg=pe.jmbg;

INSERT INTO shifts (start_time,end_time,timezone_id,status,notes,warehouse_id,employee_id)
SELECT DATEADD(HOUR,CASE n.n%2 WHEN 0 THEN 6 ELSE 14 END,DATEADD(DAY,(n.n-1)/18-2,CAST(CAST(@now AS DATE) AS DATETIME2))),
       DATEADD(HOUR,CASE n.n%2 WHEN 0 THEN 14 ELSE 22 END,DATEADD(DAY,(n.n-1)/18-2,CAST(CAST(@now AS DATE) AS DATETIME2))),
       @timezoneId,CASE WHEN n.n%13=0 THEN 'CANCELLED' WHEN (n.n-1)/18<2 THEN 'FINISHED' WHEN n.n%5=0 THEN 'ACTIVE' ELSE 'PLANNED' END,
       CASE WHEN n.n%13=0 THEN N'Otkazana zbog prijavljenog bolovanja' ELSE N'Redovna skladišna smena' END,w.id,e.id
FROM (SELECT TOP (54) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) n FROM sys.all_objects) n
JOIN @people pe ON pe.rn=3+((n.n-1)%16) JOIN employees e ON e.company_id=@companyId AND e.jmbg=pe.jmbg
JOIN warehouses w ON w.id=e.primary_warehouse_id;

INSERT INTO internal_warehouse_movements (warehouse_id,product_id,source_bin_id,destination_bin_id,quantity,status,note,created_by_id,created_at)
SELECT w.id,p.id,src.id,dst.id,2+n.n%7,CASE WHEN n.n%5=0 THEN 'CANCELLED' ELSE 'COMPLETED' END,
       CASE WHEN n.n%5=0 THEN N'Otkazano zbog zauzete odredišne pozicije' ELSE N'Premeštanje iz paletne u picking zonu' END,
       (SELECT id FROM users WHERE email=N'warehouse.bg@dunavtransit.rs'),DATEADD(DAY,-n.n,@now)
FROM (SELECT TOP (10) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) n FROM sys.all_objects) n
JOIN warehouses w ON w.company_id=@companyId AND w.name=N'Dunav DC Beograd'
JOIN bin_locations src ON src.warehouse_id=w.id AND src.code=N'BG-STO-A01'
JOIN bin_locations dst ON dst.warehouse_id=w.id AND dst.code=N'BG-PIC-A01'
JOIN @products tp ON tp.rn=n.n JOIN products p ON p.company_id=@companyId AND p.sku=tp.sku;

/* Newer inventory count, request and employee self-service modules. */
DECLARE @bgWarehouseId BIGINT=(SELECT id FROM warehouses WHERE company_id=@companyId AND name=N'Dunav DC Beograd');
DECLARE @nsWarehouseId BIGINT=(SELECT id FROM warehouses WHERE company_id=@companyId AND name=N'Dunav Hub Novi Sad');
DECLARE @wmBg BIGINT=(SELECT id FROM users WHERE email=N'warehouse.bg@dunavtransit.rs');
DECLARE @wmNs BIGINT=(SELECT id FROM users WHERE email=N'warehouse.ns@dunavtransit.rs');

INSERT INTO inventory_count_sessions (code,description,status,warehouse_id,created_by_user_id,reviewed_by_user_id,reviewed_at,created_at,updated_at,version)
VALUES
(N'DTL-IC-2026-001',N'Završni mesečni popis Beograd',N'CLOSED',@bgWarehouseId,@wmBg,@wmBg,DATEADD(DAY,-20,@now),DATEADD(DAY,-22,@now),DATEADD(DAY,-20,@now),2),
(N'DTL-IC-2026-002',N'Ciklični popis picking zone Novi Sad',N'COUNTING',@nsWarehouseId,@wmNs,NULL,NULL,DATEADD(DAY,-1,@now),@now,1),
(N'DTL-IC-2026-003',N'Otkazani vanredni popis Beograd',N'CANCELLED',@bgWarehouseId,@wmBg,NULL,NULL,DATEADD(DAY,-8,@now),DATEADD(DAY,-7,@now),1);

INSERT INTO inventory_count_lines (session_id,product_id,system_quantity,counted_quantity,difference_quantity,note,adjustment_movement_id,bin_location_id,version)
SELECT s.id,p.id,wi.quantity,
       CASE WHEN s.status='COUNTING' AND t.rn%3=0 THEN NULL WHEN t.rn%5=0 THEN wi.quantity-1 WHEN t.rn%7=0 THEN wi.quantity+2 ELSE wi.quantity END,
       CASE WHEN s.status='COUNTING' AND t.rn%3=0 THEN 0 WHEN t.rn%5=0 THEN -1 WHEN t.rn%7=0 THEN 2 ELSE 0 END,
       CASE WHEN t.rn%5=0 THEN N'Manjak nakon dvostruke provere' WHEN t.rn%7=0 THEN N'Višak pronađen u susednoj poziciji' ELSE N'Količina potvrđena' END,
       NULL,b.id,0
FROM inventory_count_sessions s
JOIN warehouse_inventory wi ON wi.warehouse_id=s.warehouse_id
JOIN products p ON p.id=wi.product_id AND p.company_id=@companyId JOIN @products t ON t.sku=p.sku
JOIN bin_inventory bi ON bi.product_id=p.id JOIN bin_locations b ON b.id=bi.bin_location_id AND b.warehouse_id=s.warehouse_id
WHERE s.code IN (N'DTL-IC-2026-001',N'DTL-IC-2026-002') AND t.rn<=10;

INSERT INTO stock_movement_requests
    (movement_type,status,quantity,adjustment_direction,reason_description,review_note,version,warehouse_id,destination_warehouse_id,product_id,
     bin_location_id,destination_bin_location_id,requested_by_user_id,reviewed_by_user_id,created_movement_id,created_at,updated_at,reviewed_at)
SELECT CASE n.n%4 WHEN 0 THEN 'TRANSFER_OUT' WHEN 1 THEN 'ADJUSTMENT' WHEN 2 THEN 'OUTBOUND' ELSE 'WRITE_OFF' END,
       CASE n.n%4 WHEN 0 THEN 'REQUESTED' WHEN 1 THEN 'APPROVED' WHEN 2 THEN 'REJECTED' ELSE 'CANCELLED' END,
       3+n.n,CASE WHEN n.n%4=1 THEN 'INCREASE' WHEN n.n%4=3 THEN 'DECREASE' END,
       N'Operativni zahtev za korekciju ili izdavanje zalihe',
       CASE WHEN n.n%4=2 THEN N'Odbijeno: nije priložena potvrda o oštećenju' WHEN n.n%4=1 THEN N'Odobreno nakon provere stanja' END,
       0,CASE WHEN n.n%2=0 THEN @bgWarehouseId ELSE @nsWarehouseId END,
       CASE WHEN n.n%4=0 THEN CASE WHEN n.n%2=0 THEN @nsWarehouseId ELSE @bgWarehouseId END END,p.id,NULL,NULL,
       CASE WHEN n.n%2=0 THEN @wmBg ELSE @wmNs END,
       CASE WHEN n.n%4 IN (1,2) THEN @wmBg END,NULL,DATEADD(DAY,-n.n,@now),@now,
       CASE WHEN n.n%4 IN (1,2) THEN DATEADD(DAY,-n.n+1,@now) END
FROM (SELECT TOP (10) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) n FROM sys.all_objects) n
JOIN @products tp ON tp.rn=n.n JOIN products p ON p.company_id=@companyId AND p.sku=tp.sku;

INSERT INTO employee_profile_change_requests
    (employee_id,requested_by_user_id,company_id,status,requested_changes_json,reason,reviewed_by_user_id,reviewed_at,rejection_reason,created_at,updated_at,version)
SELECT e.id,u.id,@companyId,x.status,x.json,x.reason,
       CASE WHEN x.status IN ('APPLIED','REJECTED') THEN (SELECT id FROM users WHERE email=N'hr.manager@dunavtransit.rs') END,
       CASE WHEN x.status IN ('APPLIED','REJECTED') THEN DATEADD(DAY,-x.rn,@now) END,
       CASE WHEN x.status='REJECTED' THEN N'Zahtev sadrži nepotpunu adresu' END,DATEADD(DAY,-x.rn-2,@now),@now,1
FROM (VALUES
 (7,N'PENDING',N'{"phoneNumber":"641209900"}',N'Promena kontakt telefona'),
 (11,N'APPLIED',N'{"address":"Radnička 42, Beograd"}',N'Promena adrese prebivališta'),
 (15,N'REJECTED',N'{"address":"Nova adresa"}',N'Ispravka adrese')
) x(rn,status,json,reason)
JOIN @people p ON p.rn=x.rn JOIN employees e ON e.company_id=@companyId AND e.jmbg=p.jmbg JOIN users u ON u.id=e.user_id;

/* Notifications, comments and audit/history. Attachments are intentionally omitted. */
INSERT INTO notifications
    (title,message,type,severity,status,category,source_type,source_id,dedup_key,escalated_at,created_at,user_id,acknowledged_at,resolved_at,action_label,action_path)
SELECT CONCAT(N'Operativno obaveštenje ',n.n),
       CASE n.n%5 WHEN 0 THEN N'Zaliha je ispod minimalnog nivoa.' WHEN 1 THEN N'Dodeljen je novi transportni nalog.'
            WHEN 2 THEN N'Inventory count zahteva pažnju.' WHEN 3 THEN N'Planiran je servis vozila.' ELSE N'Smena uskoro počinje.' END,
       CASE n.n%4 WHEN 0 THEN 'WARNING' WHEN 1 THEN 'INFO' WHEN 2 THEN 'SUCCESS' ELSE 'ERROR' END,
       CASE n.n%4 WHEN 0 THEN 'WARNING' WHEN 1 THEN 'INFO' WHEN 2 THEN 'SUCCESS' ELSE 'CRITICAL' END,
       CASE n.n%4 WHEN 0 THEN 'UNREAD' WHEN 1 THEN 'READ' WHEN 2 THEN 'ACKNOWLEDGED' ELSE 'RESOLVED' END,
       CASE n.n%5 WHEN 0 THEN 'INVENTORY' WHEN 1 THEN 'TRANSPORT' WHEN 2 THEN 'INVENTORY' WHEN 3 THEN 'WAREHOUSE' ELSE 'SHIFT' END,
       'SYSTEM',NULL,CONCAT(N'dtl-v44-',n.n),CASE WHEN n.n%4=3 THEN DATEADD(HOUR,-n.n,@now) END,DATEADD(HOUR,-n.n,@now),u.id,
       CASE WHEN n.n%4 IN (2,3) THEN DATEADD(MINUTE,-n.n,@now) END,
       CASE WHEN n.n%4=3 THEN DATEADD(MINUTE,-n.n+5,@now) END,NULL,NULL
FROM (SELECT TOP (36) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) n FROM sys.all_objects) n
JOIN (SELECT id,ROW_NUMBER() OVER (ORDER BY id) rn FROM users WHERE company_id=@companyId) u ON u.rn=((n.n-1)%18)+1;

INSERT INTO operational_comments (entity_type,entity_id,content,internal_note,company_id,author_id,created_at,updated_at)
SELECT CASE n.n%4 WHEN 0 THEN 'TRANSPORT_ORDER' WHEN 1 THEN 'TASK' WHEN 2 THEN 'INVENTORY_COUNT' ELSE 'VEHICLE_MAINTENANCE' END,
       CASE n.n%4 WHEN 0 THEN (SELECT TOP (1) id FROM transport_orders WHERE order_number LIKE N'DTL-%' ORDER BY id)
            WHEN 1 THEN (SELECT TOP (1) id FROM tasks WHERE assigned_employee_id IN (SELECT id FROM employees WHERE company_id=@companyId) ORDER BY id)
            WHEN 2 THEN (SELECT id FROM inventory_count_sessions WHERE code=N'DTL-IC-2026-002')
            ELSE (SELECT TOP (1) vm.id FROM vehicle_maintenance vm JOIN vehicles v ON v.id=vm.vehicle_id WHERE v.company_id=@companyId ORDER BY vm.id) END,
       CASE n.n%4 WHEN 0 THEN N'Roba je spremna; vozač je obavešten o terminu utovara.'
            WHEN 1 THEN N'Komisioniranje je u toku, proveriti seriju pre pakovanja.'
            WHEN 2 THEN N'Razlika je proverena na susednoj lokaciji.'
            ELSE N'Servis čeka završni rezultat dijagnostike.' END,
       CASE WHEN n.n%3=0 THEN 1 ELSE 0 END,@companyId,u.id,DATEADD(HOUR,-n.n,@now),NULL
FROM (SELECT TOP (18) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) n FROM sys.all_objects) n
JOIN (SELECT id,ROW_NUMBER() OVER (ORDER BY id) rn FROM users WHERE company_id=@companyId) u ON u.rn=((n.n-1)%18)+1;

INSERT INTO domain_events (event_type,entity_type,entity_id,entity_identifier,summary,payload,company_id,created_by_id,created_at)
SELECT CASE n.n%5 WHEN 0 THEN 'TRANSPORT_LIFECYCLE' WHEN 1 THEN 'TASK_LIFECYCLE' WHEN 2 THEN 'INVENTORY_LIFECYCLE'
            WHEN 3 THEN 'SHIFT_LIFECYCLE' ELSE 'VEHICLE_MAINTENANCE' END,
       CASE n.n%5 WHEN 0 THEN 'TRANSPORT_ORDER' WHEN 1 THEN 'TASK' WHEN 2 THEN 'INVENTORY_COUNT'
            WHEN 3 THEN 'SHIFT' ELSE 'VEHICLE_MAINTENANCE' END,n.n,CONCAT(N'DTL-EVT-',n.n),
       N'Poslovni lifecycle događaj realistične demo kompanije',N'{"seed":"V44","company":"DTL"}',
       @companyId,u.id,DATEADD(HOUR,-n.n*2,@now)
FROM (SELECT TOP (24) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) n FROM sys.all_objects) n
JOIN (SELECT id,ROW_NUMBER() OVER (ORDER BY id) rn FROM users WHERE company_id=@companyId) u ON u.rn=((n.n-1)%18)+1;

INSERT INTO activity_logs (action,entity_name,entity_id,entity_identifier,description,created_at,user_id)
SELECT CASE n.n%4 WHEN 0 THEN 'STATUS_CHANGE' WHEN 1 THEN 'CREATE' WHEN 2 THEN 'UPDATE' ELSE 'ASSIGN' END,
       CASE n.n%4 WHEN 0 THEN 'TRANSPORT_ORDER' WHEN 1 THEN 'TASK' WHEN 2 THEN 'WAREHOUSE_INVENTORY' ELSE 'SHIFT' END,
       n.n,CONCAT(N'DTL-ACT-',n.n),N'Zabeležena aktivnost realističnog operativnog workflow-a',DATEADD(HOUR,-n.n,@now),u.id
FROM (SELECT TOP (40) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) n FROM sys.all_objects) n
JOIN (SELECT id,ROW_NUMBER() OVER (ORDER BY id) rn FROM users WHERE company_id=@companyId) u ON u.rn=((n.n-1)%18)+1;

INSERT INTO change_history (entity_name,entity_id,entity_identifier,change_type,field_name,old_value,new_value,changed_at,changed_by_user_id)
SELECT CASE n.n%3 WHEN 0 THEN 'TRANSPORT_ORDER' WHEN 1 THEN 'TASK' ELSE 'WAREHOUSE_INVENTORY' END,n.n,
       CONCAT(N'DTL-CHG-',n.n),CASE WHEN n.n%3=0 THEN 'STATUS_CHANGE' ELSE 'UPDATE' END,
       CASE WHEN n.n%3=2 THEN 'quantity' ELSE 'status' END,
       CASE WHEN n.n%3=2 THEN '100' ELSE 'ASSIGNED' END,
       CASE WHEN n.n%3=2 THEN '98' ELSE 'IN_PROGRESS' END,DATEADD(HOUR,-n.n,@now),u.id
FROM (SELECT TOP (32) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) n FROM sys.all_objects) n
JOIN (SELECT id,ROW_NUMBER() OVER (ORDER BY id) rn FROM users WHERE company_id=@companyId) u ON u.rn=((n.n-1)%18)+1;

COMMIT TRANSACTION;
