SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @now DATETIME2 = SYSUTCDATETIME();
DECLARE @pwd NVARCHAR(255) = '$2a$10$NBqZSKuQWFxDQx5taxDczuSxfo/mwhAzngiVOPnpVAKr0RskxtaSG'; -- password: Admin123!
DECLARE @companyId BIGINT;
DECLARE @countryId BIGINT = (SELECT TOP 1 id FROM countries WHERE code = 'RS');
DECLARE @timezoneId BIGINT = (SELECT TOP 1 id FROM timezones WHERE name = 'Europe/Belgrade');
DECLARE @belgradeCityId BIGINT = (SELECT TOP 1 id FROM cities WHERE country_id = @countryId AND name = 'Belgrade');
DECLARE @noviSadCityId BIGINT = (SELECT TOP 1 id FROM cities WHERE country_id = @countryId AND name = 'Novi Sad');
DECLARE @nisCityId BIGINT = (SELECT TOP 1 id FROM cities WHERE country_id = @countryId AND name = 'Nis');
DECLARE @kragujevacCityId BIGINT = (SELECT TOP 1 id FROM cities WHERE country_id = @countryId AND name = 'Kragujevac');
DECLARE @suboticaCityId BIGINT = (SELECT TOP 1 id FROM cities WHERE country_id = @countryId AND name = 'Subotica');
DECLARE @overlordUserId BIGINT = (SELECT TOP 1 id FROM users WHERE email = 'filip.djekic@slu.admin.rs');

IF @countryId IS NULL OR @timezoneId IS NULL OR @belgradeCityId IS NULL OR @noviSadCityId IS NULL OR @nisCityId IS NULL
    THROW 51000, 'Seed prerequisites missing: RS country, Europe/Belgrade timezone or required cities.', 1;

IF NOT EXISTS (SELECT 1 FROM companies WHERE name = 'Titan Freight Solutions DOO')
BEGIN
    INSERT INTO companies (
        name, active, country_id, phone_code, timezone_id, address, city_id, postal_code,
        phone_number, email, tax_number, registration_number, created_at, updated_at
    )
    VALUES (
        'Titan Freight Solutions DOO', 1, @countryId, '+381', @timezoneId, 'Autoput za Zagreb 44', @belgradeCityId,
        (SELECT postal_code FROM cities WHERE id = @belgradeCityId), '601234567', 'contact@titanfreight.rs',
        '112233445', '20999881', DATEADD(MONTH,-18,@now), @now
    );
END;

SELECT @companyId = id FROM companies WHERE name = 'Titan Freight Solutions DOO';

DECLARE @people TABLE (
    rn INT IDENTITY(1,1), first_name NVARCHAR(60), last_name NVARCHAR(60), role_name NVARCHAR(255),
    role_slug NVARCHAR(30), position NVARCHAR(50), phone_number NVARCHAR(30), jmbg NVARCHAR(13),
    salary DECIMAL(12,2), warehouse_slot INT NULL
);

INSERT INTO @people (first_name,last_name,role_name,role_slug,position,phone_number,jmbg,salary,warehouse_slot)
VALUES
('Milos','Petrovic','COMPANY_ADMIN','admin','COMPANY_ADMIN','601111111','0101980710001',180000,NULL),
('Nikola','Jankovic','WAREHOUSE_MANAGER','warehouse','WAREHOUSE_MANAGER','601111112','0101980710002',145000,1),
('Stefan','Milosevic','WAREHOUSE_MANAGER','warehouse','WAREHOUSE_MANAGER','601111113','0101980710003',145000,2),
('Aleksandar','Stojanovic','WAREHOUSE_MANAGER','warehouse','WAREHOUSE_MANAGER','601111114','0101980710004',140000,3),
('Nemanja','Kostic','WAREHOUSE_MANAGER','warehouse','WAREHOUSE_MANAGER','601111115','0101980710005',140000,4),
('Vladimir','Ristic','WAREHOUSE_MANAGER','warehouse','WAREHOUSE_MANAGER','601111116','0101980710006',138000,5),
('Uros','Savic','WAREHOUSE_MANAGER','warehouse','WAREHOUSE_MANAGER','601111117','0101980710007',138000,6),
('Petar','Lazic','DISPATCHER','dispatcher','DISPATCHER','601111118','0101980710008',130000,NULL),
('Dusan','Maric','DISPATCHER','dispatcher','DISPATCHER','601111119','0101980710009',130000,NULL),
('Luka','Pavlovic','DRIVER','driver','DRIVER','601111120','0101980710010',115000,NULL),
('Marko','Ilic','DRIVER','driver','DRIVER','601111121','0101980710011',115000,NULL),
('Filip','Todorovic','DRIVER','driver','DRIVER','601111122','0101980710012',112000,NULL),
('Andrej','Simic','DRIVER','driver','DRIVER','601111123','0101980710013',112000,NULL),
('Ognjen','Popovic','DRIVER','driver','DRIVER','601111124','0101980710014',110000,NULL),
('Vuk','Djordjevic','DRIVER','driver','DRIVER','601111125','0101980710015',110000,NULL),
('Ivan','Nikolic','WORKER','worker','WORKER','601111126','0101980710016',85000,1),
('Jovan','Djordjevic','WORKER','worker','WORKER','601111127','0101980710017',85000,1),
('Milan','Zivkovic','WORKER','worker','WORKER','601111128','0101980710018',83000,1),
('Sasa','Obradovic','WORKER','worker','WORKER','601111129','0101980710019',83000,2),
('Bojan','Matic','WORKER','worker','WORKER','601111130','0101980710020',82000,2),
('Goran','Radovic','WORKER','worker','WORKER','601111131','0101980710021',82000,2),
('Dejan','Vasic','WORKER','worker','WORKER','601111132','0101980710022',82000,3),
('Igor','Markovic','WORKER','worker','WORKER','601111133','0101980710023',82000,3),
('Srdjan','Antic','WORKER','worker','WORKER','601111134','0101980710024',81000,3),
('Mladen','Peric','WORKER','worker','WORKER','601111135','0101980710025',81000,4),
('Miroslav','Jovic','WORKER','worker','WORKER','601111136','0101980710026',81000,4),
('Zoran','Lukic','WORKER','worker','WORKER','601111137','0101980710027',80000,4),
('Dragan','Milic','WORKER','worker','WORKER','601111138','0101980710028',80000,5),
('Branislav','Pantic','WORKER','worker','WORKER','601111139','0101980710029',80000,5),
('Darko','Ivic','WORKER','worker','WORKER','601111140','0101980710030',80000,5),
('Nenad','Boric','WORKER','worker','WORKER','601111141','0101980710031',80000,6),
('Zeljko','Tomic','WORKER','worker','WORKER','601111142','0101980710032',80000,6),
('Slobodan','Mirkovic','WORKER','worker','WORKER','601111143','0101980710033',80000,6);

INSERT INTO users (password, first_name, last_name, email, status, enabled, created_at, updated_at, role_id, company_id)
SELECT @pwd, p.first_name, p.last_name,
       LOWER(p.first_name + '.' + p.last_name + '@titanfreight.' + p.role_slug + '.rs'),
       'ACTIVE', 1, DATEADD(DAY,-120,@now), @now, r.id, @companyId
FROM @people p
JOIN roles r ON r.name = p.role_name
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.email = LOWER(p.first_name + '.' + p.last_name + '@titanfreight.' + p.role_slug + '.rs')
);

INSERT INTO employees (
    first_name,last_name,jmbg,phone_code,phone_number,email,address,city_id,postal_code,timezone_id,
    position,employment_date,salary,active,updated_at,company_id,country_id,primary_warehouse_id,user_id,
    auto_generated_email,email_manually_overridden,email_generation_source
)
SELECT p.first_name, p.last_name, p.jmbg, '+381', p.phone_number,
       LOWER(p.first_name + '.' + p.last_name + '@titanfreight.' + p.role_slug + '.rs'),
       CONCAT('Employee Street ', p.rn, ', Belgrade'), @belgradeCityId, (SELECT postal_code FROM cities WHERE id=@belgradeCityId), @timezoneId,
       p.position, DATEADD(DAY, -365 - p.rn, CAST(@now AS DATE)), p.salary, 1, @now, @companyId, @countryId, NULL, u.id,
       1, 0, 'SEED_ENTERPRISE'
FROM @people p
JOIN users u ON u.email = LOWER(p.first_name + '.' + p.last_name + '@titanfreight.' + p.role_slug + '.rs')
WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.company_id = @companyId AND e.jmbg = p.jmbg);

DECLARE @warehouses TABLE(slot INT PRIMARY KEY, name NVARCHAR(100), city_id BIGINT, address NVARCHAR(200), capacity DECIMAL(38,2));
INSERT INTO @warehouses(slot,name,city_id,address,capacity)
VALUES
(1,'Titan Central Hub Belgrade',@belgradeCityId,'Industrijska zona BB',450000),
(2,'Titan North Hub Novi Sad',@noviSadCityId,'Sentandrejski put 88',320000),
(3,'Titan South Hub Nis',@nisCityId,'Bulevar 12 Februar 110',260000),
(4,'Titan Sumadija Hub Kragujevac',@kragujevacCityId,'Industrijska 17',220000),
(5,'Titan Border Hub Subotica',@suboticaCityId,'Segedinski put 52',210000),
(6,'Titan Express Crossdock Belgrade',@belgradeCityId,'Dobanovacki put 21',180000);

INSERT INTO warehouses (name,address,city_id,postal_code,timezone_id,latitude,longitude,capacity,status,active,updated_at,company_id,country_id,manager_id)
SELECT w.name,w.address,w.city_id,(SELECT postal_code FROM cities WHERE id=w.city_id),@timezoneId,
       44.0000000 + w.slot, 20.0000000 + w.slot, w.capacity,
       CASE WHEN w.slot = 5 THEN 'UNDER_MAINTENANCE' ELSE 'ACTIVE' END, 1, @now, @companyId, @countryId,
       (SELECT TOP 1 e.id FROM employees e JOIN @people p ON p.jmbg=e.jmbg WHERE p.warehouse_slot=w.slot AND p.position='WAREHOUSE_MANAGER')
FROM @warehouses w
WHERE NOT EXISTS (SELECT 1 FROM warehouses x WHERE x.company_id=@companyId AND x.name=w.name);

UPDATE e
SET primary_warehouse_id = wh.id
FROM employees e
JOIN @people p ON p.jmbg = e.jmbg
JOIN @warehouses w ON w.slot = p.warehouse_slot
JOIN warehouses wh ON wh.company_id=@companyId AND wh.name=w.name
WHERE e.company_id=@companyId;

DECLARE @zoneTypes TABLE(code NVARCHAR(10), name NVARCHAR(120), type NVARCHAR(30), cap DECIMAL(12,2));
INSERT INTO @zoneTypes VALUES
('REC','Receiving Zone','RECEIVING',30000),('STO','Storage Zone','STORAGE',120000),('PIC','Picking Zone','PICKING',45000),
('PAC','Packing Zone','PACKING',35000),('DSP','Dispatch Zone','DISPATCH',50000),('RET','Returns Zone','RETURNS',12000),('QUA','Quarantine Zone','QUARANTINE',10000);

INSERT INTO warehouse_zones (warehouse_id,code,name,type,capacity,active,description,created_at,updated_at)
SELECT wh.id, CONCAT(z.code,'-',w.slot), z.name, z.type, z.cap, 1, CONCAT(z.name,' for ',wh.name), DATEADD(DAY,-90,@now), @now
FROM @warehouses w
JOIN warehouses wh ON wh.company_id=@companyId AND wh.name=w.name
CROSS JOIN @zoneTypes z
WHERE NOT EXISTS (SELECT 1 FROM warehouse_zones wz WHERE wz.warehouse_id=wh.id AND wz.code=CONCAT(z.code,'-',w.slot));

DECLARE @i INT = 1;
WHILE @i <= 10
BEGIN
    INSERT INTO bin_locations (warehouse_id, zone_id, code, name, capacity, active, description, created_at, updated_at)
    SELECT wz.warehouse_id, wz.id,
           CONCAT(LEFT(wz.code,1), '-', RIGHT('00'+CAST(@i AS NVARCHAR(2)),2), '-01'),
           CONCAT('Bin ', wz.code, '-', RIGHT('00'+CAST(@i AS NVARCHAR(2)),2), '-01'),
           2500 + (@i * 100), 1, 'Performance seed bin', DATEADD(DAY,-80,@now), @now
    FROM warehouse_zones wz
    JOIN warehouses wh ON wh.id=wz.warehouse_id AND wh.company_id=@companyId
    WHERE wz.type IN ('STORAGE','PICKING','DISPATCH','RECEIVING')
      AND NOT EXISTS (SELECT 1 FROM bin_locations b WHERE b.warehouse_id=wz.warehouse_id AND b.code=CONCAT(LEFT(wz.code,1), '-', RIGHT('00'+CAST(@i AS NVARCHAR(2)),2), '-01'));
    SET @i += 1;
END;

SET @i = 1;
WHILE @i <= 120
BEGIN
    INSERT INTO products (name,description,sku,unit,price,fragile,weight,active,updated_at,company_id)
    SELECT CONCAT('Performance Product ', RIGHT('000'+CAST(@i AS NVARCHAR(3)),3)),
           CASE @i % 6 WHEN 0 THEN 'Automotive spare part' WHEN 1 THEN 'Industrial equipment' WHEN 2 THEN 'Consumer package' WHEN 3 THEN 'Cold chain package' WHEN 4 THEN 'Warehouse consumable' ELSE 'Fragile component' END,
           CONCAT('TFS-PERF-', RIGHT('000'+CAST(@i AS NVARCHAR(3)),3)),
           CASE @i % 5 WHEN 0 THEN 'PALLET' WHEN 1 THEN 'PIECE' WHEN 2 THEN 'BOX' WHEN 3 THEN 'KG' ELSE 'LITER' END,
           CAST(5 + (@i * 3.75) AS DECIMAL(12,2)), CASE WHEN @i % 7 = 0 THEN 1 ELSE 0 END,
           CAST(0.5 + (@i % 40) * 1.25 AS DECIMAL(12,2)), 1, @now, @companyId
    WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.company_id=@companyId AND p.sku=CONCAT('TFS-PERF-', RIGHT('000'+CAST(@i AS NVARCHAR(3)),3)));
    SET @i += 1;
END;

INSERT INTO warehouse_inventory (warehouse_id, product_id, quantity, reserved_quantity, min_stock_level, last_updated, version)
SELECT wh.id, p.id,
       CAST(500 + ((ABS(CHECKSUM(wh.id,p.id)) % 5000)) AS DECIMAL(12,2)),
       CAST((ABS(CHECKSUM(p.id,wh.id)) % 120) AS DECIMAL(12,2)),
       CAST(100 + (ABS(CHECKSUM(p.sku)) % 300) AS DECIMAL(12,2)),
       @now, 0
FROM warehouses wh
JOIN products p ON p.company_id=@companyId
WHERE wh.company_id=@companyId
  AND NOT EXISTS (SELECT 1 FROM warehouse_inventory wi WHERE wi.warehouse_id=wh.id AND wi.product_id=p.id);

INSERT INTO bin_inventory (bin_location_id, product_id, quantity, last_updated)
SELECT b.id, p.id,
       CAST(10 + (ABS(CHECKSUM(b.id,p.id)) % 250) AS DECIMAL(12,2)),
       @now
FROM bin_locations b
JOIN warehouses wh ON wh.id=b.warehouse_id AND wh.company_id=@companyId
JOIN products p ON p.company_id=@companyId AND (p.id % 4) = (b.id % 4)
WHERE NOT EXISTS (SELECT 1 FROM bin_inventory bi WHERE bi.bin_location_id=b.id AND bi.product_id=p.id);

DECLARE @driverEmployees TABLE(rn INT IDENTITY(1,1), employee_id BIGINT);
INSERT INTO @driverEmployees(employee_id)
SELECT e.id FROM employees e WHERE e.company_id=@companyId AND e.position='DRIVER' ORDER BY e.id;
DECLARE @vehicles TABLE(rn INT IDENTITY(1,1), plate NVARCHAR(20), brand NVARCHAR(60), model NVARCHAR(60), type NVARCHAR(255), status NVARCHAR(255), max_weight DECIMAL(12,2));
INSERT INTO @vehicles(plate,brand,model,type,status,max_weight)
VALUES
('BG-2201-TF','Mercedes-Benz','Actros','SEMI_TRUCK','AVAILABLE',24000),('BG-2202-TF','MAN','TGX','SEMI_TRUCK','IN_USE',23000),('NS-3301-TF','Volvo','FH','SEMI_TRUCK','RESERVED',24000),
('NI-4401-TF','Scania','R-series','SEMI_TRUCK','AVAILABLE',23000),('KG-5501-TF','DAF','XF','SEMI_TRUCK','MAINTENANCE',22000),('SU-6601-TF','Iveco','S-Way','TRUCK','AVAILABLE',18000),
('BG-2203-TF','Mercedes-Benz','Atego','BOX_TRUCK','AVAILABLE',12000),('NS-3302-TF','MAN','TGM','BOX_TRUCK','IN_USE',12000),('NI-4402-TF','Renault','Master','VAN','AVAILABLE',3500),
('KG-5502-TF','Ford','Transit','VAN','OUT_OF_SERVICE',3200),('SU-6602-TF','Volkswagen','Crafter','VAN','AVAILABLE',3500),('BG-2204-TF','Fiat','Ducato','VAN','RESERVED',3000);

INSERT INTO vehicles (registration_number,vehicle_model_id,type,capacity,max_weight,max_volume,max_items,fuel_type,year_of_production,status,active,updated_at,company_id)
SELECT v.plate, vm.id, v.type, CASE WHEN v.type='VAN' THEN 12 ELSE 33 END, v.max_weight, CASE WHEN v.type='VAN' THEN 18 ELSE 88 END,
       CASE WHEN v.type='VAN' THEN 40 ELSE 160 END, 'DIESEL', 2018 + (v.rn % 6), v.status, 1, @now, @companyId
FROM @vehicles v
JOIN vehicle_brands vb ON vb.name=v.brand
JOIN vehicle_models vm ON vm.brand_id=vb.id AND vm.name=v.model
WHERE NOT EXISTS (SELECT 1 FROM vehicles x WHERE x.company_id=@companyId AND x.registration_number=v.plate);

INSERT INTO vehicle_maintenance (vehicle_id,company_id,type,status,scheduled_at,started_at,completed_at,cancelled_at,odometer,cost,notes,cancel_reason,created_at,updated_at)
SELECT veh.id,@companyId,
       CASE veh.id % 5 WHEN 0 THEN 'ROUTINE_SERVICE' WHEN 1 THEN 'INSPECTION' WHEN 2 THEN 'OIL_CHANGE' WHEN 3 THEN 'TIRE_CHANGE' ELSE 'REPAIR' END,
       CASE WHEN veh.status='MAINTENANCE' THEN 'IN_PROGRESS' WHEN veh.status='OUT_OF_SERVICE' THEN 'PLANNED' ELSE 'COMPLETED' END,
       DATEADD(DAY,-30 + (veh.id % 60),@now),
       CASE WHEN veh.status IN ('MAINTENANCE','OUT_OF_SERVICE') THEN DATEADD(DAY,-1,@now) ELSE DATEADD(DAY,-25,@now) END,
       CASE WHEN veh.status IN ('MAINTENANCE','OUT_OF_SERVICE') THEN NULL ELSE DATEADD(DAY,-24,@now) END,
       NULL, 80000 + (veh.id * 137), CASE WHEN veh.status IN ('MAINTENANCE','OUT_OF_SERVICE') THEN NULL ELSE CAST(200 + (veh.id % 10) * 75 AS DECIMAL(12,2)) END,
       'Seeded maintenance record', NULL, DATEADD(DAY,-35,@now), @now
FROM vehicles veh
WHERE veh.company_id=@companyId
  AND NOT EXISTS (SELECT 1 FROM vehicle_maintenance m WHERE m.vehicle_id=veh.id);

DECLARE @orderNo INT = 1;
WHILE @orderNo <= 300
BEGIN
    DECLARE @sourceWh BIGINT = (SELECT id FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY id) rn FROM warehouses WHERE company_id=@companyId) x WHERE rn = ((@orderNo - 1) % 6) + 1);
    DECLARE @destWh BIGINT = (SELECT id FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY id) rn FROM warehouses WHERE company_id=@companyId) x WHERE rn = ((@orderNo + 1) % 6) + 1);
    IF @destWh = @sourceWh SELECT @destWh = (SELECT TOP 1 id FROM warehouses WHERE company_id=@companyId AND id<>@sourceWh ORDER BY id);
    DECLARE @vehicleId BIGINT = (SELECT id FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY id) rn FROM vehicles WHERE company_id=@companyId) x WHERE rn = ((@orderNo - 1) % 12) + 1);
    DECLARE @driverEmpId BIGINT = (SELECT employee_id FROM @driverEmployees WHERE rn = ((@orderNo - 1) % 6) + 1);
    DECLARE @status NVARCHAR(30) = CASE @orderNo % 12 WHEN 0 THEN 'DRAFT' WHEN 1 THEN 'CREATED' WHEN 2 THEN 'ASSIGNED' WHEN 3 THEN 'PICKING' WHEN 4 THEN 'PACKING' WHEN 5 THEN 'READY_FOR_LOADING' WHEN 6 THEN 'LOADING' WHEN 7 THEN 'IN_TRANSIT' WHEN 8 THEN 'DELIVERED' WHEN 9 THEN 'FAILED' WHEN 10 THEN 'RETURNING' ELSE 'CANCELLED' END;
    DECLARE @toNumber NVARCHAR(50) = CONCAT('TFS-TO-2026-', RIGHT('0000'+CAST(@orderNo AS NVARCHAR(4)),4));
    INSERT INTO transport_orders (order_number,description,order_date,departure_time,actual_arrival_time,planned_arrival_time,status,priority,total_weight,notes,updated_at,created_at,source_warehouse_id,destination_warehouse_id,vehicle_id,assigned_employee_id,created_by_user_id)
    SELECT @toNumber, CONCAT('Performance transport order ', @orderNo), DATEADD(DAY,-90 + (@orderNo % 120),@now),
           CASE WHEN @status IN ('IN_TRANSIT','DELIVERED','FAILED','RETURNING') THEN DATEADD(DAY,-20 + (@orderNo % 80),@now) ELSE NULL END,
           CASE WHEN @status IN ('DELIVERED','FAILED') THEN DATEADD(DAY,-18 + (@orderNo % 80),@now) ELSE NULL END,
           DATEADD(DAY,-18 + (@orderNo % 100),@now), @status,
           CASE @orderNo % 4 WHEN 0 THEN 'LOW' WHEN 1 THEN 'MEDIUM' WHEN 2 THEN 'HIGH' ELSE 'URGENT' END,
           CAST(1000 + (@orderNo * 27) AS DECIMAL(12,2)), 'Seed performance order', @now, DATEADD(DAY,-100 + @orderNo % 120,@now), @sourceWh, @destWh, @vehicleId, @driverEmpId,
           (SELECT TOP 1 id FROM users WHERE company_id=@companyId AND email LIKE '%@titanfreight.dispatcher.rs' ORDER BY id)
    WHERE NOT EXISTS (SELECT 1 FROM transport_orders t WHERE t.order_number=@toNumber);
    SET @orderNo += 1;
END;

INSERT INTO transport_order_items (quantity,reserved_quantity,dispatched_quantity,delivered_quantity,weight,note,transport_order_id,product_id)
SELECT CAST(5 + (ABS(CHECKSUM(t.id,p.id)) % 60) AS DECIMAL(12,2)),
       CAST(3 + (ABS(CHECKSUM(p.id,t.id)) % 30) AS DECIMAL(12,2)),
       CASE WHEN t.status IN ('IN_TRANSIT','DELIVERED','FAILED','RETURNING') THEN CAST(3 + (ABS(CHECKSUM(p.id,t.id)) % 30) AS DECIMAL(12,2)) ELSE 0 END,
       CASE WHEN t.status='DELIVERED' THEN CAST(3 + (ABS(CHECKSUM(p.id,t.id)) % 30) AS DECIMAL(12,2)) ELSE 0 END,
       CAST(50 + (ABS(CHECKSUM(t.id,p.weight)) % 700) AS DECIMAL(12,2)),
       'Seeded order line', t.id, p.id
FROM transport_orders t
JOIN products p ON p.company_id=@companyId AND p.id IN (
    SELECT id FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY id) rn FROM products WHERE company_id=@companyId) pp
    WHERE pp.rn IN (((t.id-1)%120)+1, ((t.id+17)%120)+1, ((t.id+41)%120)+1)
)
WHERE t.order_number LIKE 'TFS-TO-2026-%'
  AND NOT EXISTS (SELECT 1 FROM transport_order_items i WHERE i.transport_order_id=t.id AND i.product_id=p.id);

INSERT INTO stock_movements (movement_type,quantity,reason_code,reason_description,reference_type,reference_id,reference_number,reference_note,transfer_group_id,adjustment_direction,quantity_before,quantity_after,reserved_before,reserved_after,available_before,available_after,created_at,warehouse_id,product_id,created_by_user_id,transport_order_id)
SELECT TOP 2000
       CASE n.n % 10 WHEN 0 THEN 'INBOUND' WHEN 1 THEN 'OUTBOUND' WHEN 2 THEN 'TRANSFER_IN' WHEN 3 THEN 'TRANSFER_OUT' WHEN 4 THEN 'ADJUSTMENT' WHEN 5 THEN 'WRITE_OFF' WHEN 6 THEN 'RETURN_IN' WHEN 7 THEN 'RETURN_OUT' WHEN 8 THEN 'RESERVATION' ELSE 'RESERVATION_RELEASE' END,
       CAST(1 + (n.n % 150) AS DECIMAL(12,2)),
       CASE n.n % 10 WHEN 0 THEN 'PURCHASE_RECEIPT' WHEN 1 THEN 'TRANSPORT_DISPATCH' WHEN 2 THEN 'TRANSPORT_RECEIPT' WHEN 3 THEN 'TRANSPORT_DISPATCH' WHEN 4 THEN 'INVENTORY_ADJUSTMENT' WHEN 5 THEN 'DAMAGE_WRITE_OFF' WHEN 6 THEN 'RETURN_IN' WHEN 7 THEN 'RETURN_OUT' WHEN 8 THEN 'STOCK_RESERVED' ELSE 'RESERVATION_RELEASED' END,
       'Performance seed movement','TRANSPORT_ORDER',t.id,t.order_number,'Seeded movement',CONCAT('TFS-GRP-',RIGHT('0000'+CAST(n.n%300 AS NVARCHAR(4)),4)),
       CASE WHEN n.n % 10 IN (4,5) THEN 'DECREASE' ELSE NULL END,
       1000, 1000 + CASE WHEN n.n % 2=0 THEN 1 ELSE -1 END * (1 + (n.n % 150)), 100, 100, 900, 900,
       DATEADD(HOUR,-n.n,@now), CASE WHEN n.n % 2=0 THEN t.source_warehouse_id ELSE t.destination_warehouse_id END,
       p.id, t.created_by_user_id, t.id
FROM (SELECT TOP 2000 ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) n FROM sys.all_objects a CROSS JOIN sys.all_objects b) n
JOIN transport_orders t ON t.order_number = CONCAT('TFS-TO-2026-', RIGHT('0000'+CAST(((n.n-1)%300)+1 AS NVARCHAR(4)),4))
JOIN products p ON p.company_id=@companyId AND p.sku = CONCAT('TFS-PERF-', RIGHT('000'+CAST(((n.n-1)%120)+1 AS NVARCHAR(3)),3))
WHERE NOT EXISTS (SELECT 1 FROM stock_movements sm WHERE sm.reference_number=t.order_number AND sm.product_id=p.id AND sm.created_at=DATEADD(HOUR,-n.n,@now));

INSERT INTO tasks (title,description,due_date,priority,status,task_type,started_at,completed_at,cancelled_at,cancel_reason,created_at,updated_at,assigned_employee_id,transport_order_id,stock_movement_id)
SELECT TOP 700
       CONCAT('Operational task ', RIGHT('0000'+CAST(n.n AS NVARCHAR(4)),4)),
       'Seeded task for performance testing', DATEADD(HOUR,n.n % 240,@now),
       CASE n.n%4 WHEN 0 THEN 'LOW' WHEN 1 THEN 'MEDIUM' WHEN 2 THEN 'HIGH' ELSE 'URGENT' END,
       CASE n.n%4 WHEN 0 THEN 'NEW' WHEN 1 THEN 'IN_PROGRESS' WHEN 2 THEN 'COMPLETED' ELSE 'CANCELLED' END,
       CASE n.n%8 WHEN 0 THEN 'PICKING' WHEN 1 THEN 'PACKING' WHEN 2 THEN 'LOADING' WHEN 3 THEN 'DRIVING' WHEN 4 THEN 'UNLOADING' WHEN 5 THEN 'COUNTING' WHEN 6 THEN 'MAINTENANCE' ELSE 'STOCK_MOVEMENT' END,
       CASE WHEN n.n%4 IN (1,2) THEN DATEADD(HOUR,-n.n%100,@now) ELSE NULL END,
       CASE WHEN n.n%4=2 THEN DATEADD(HOUR,-n.n%80,@now) ELSE NULL END,
       CASE WHEN n.n%4=3 THEN DATEADD(HOUR,-n.n%80,@now) ELSE NULL END,
       CASE WHEN n.n%4=3 THEN 'Cancelled by performance seed' ELSE NULL END,
       DATEADD(HOUR,-n.n,@now), @now,
       (SELECT employee_id FROM (SELECT e.id employee_id, ROW_NUMBER() OVER (ORDER BY e.id) rn FROM employees e WHERE e.company_id=@companyId AND e.position IN ('WORKER','DRIVER','WAREHOUSE_MANAGER')) x WHERE rn=((n.n-1)%24)+1),
       t.id,
       (SELECT TOP 1 sm.id FROM stock_movements sm WHERE sm.transport_order_id=t.id ORDER BY sm.id)
FROM (SELECT TOP 700 ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) n FROM sys.all_objects a CROSS JOIN sys.all_objects b) n
JOIN transport_orders t ON t.order_number = CONCAT('TFS-TO-2026-', RIGHT('0000'+CAST(((n.n-1)%300)+1 AS NVARCHAR(4)),4))
WHERE NOT EXISTS (SELECT 1 FROM tasks task WHERE task.title=CONCAT('Operational task ', RIGHT('0000'+CAST(n.n AS NVARCHAR(4)),4)));

INSERT INTO shifts (start_time,end_time,timezone_id,status,notes,warehouse_id,employee_id)
SELECT TOP 420 DATEADD(HOUR, (n.n%21)-240, @now), DATEADD(HOUR, (n.n%21)-232, @now), @timezoneId,
       CASE n.n%4 WHEN 0 THEN 'PLANNED' WHEN 1 THEN 'ACTIVE' WHEN 2 THEN 'FINISHED' ELSE 'CANCELLED' END,
       CASE n.n%3 WHEN 0 THEN 'Morning shift' WHEN 1 THEN 'Afternoon shift' ELSE 'Night shift' END,
       (SELECT id FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY id) rn FROM warehouses WHERE company_id=@companyId) wh WHERE rn=((n.n-1)%6)+1),
       (SELECT id FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY id) rn FROM employees WHERE company_id=@companyId) e WHERE rn=((n.n-1)%33)+1)
FROM (SELECT TOP 420 ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) n FROM sys.all_objects a CROSS JOIN sys.all_objects b) n;

INSERT INTO employee_warehouse_assignments (company_id,employee_id,warehouse_id,access_type,active,valid_from,valid_to,notes)
SELECT @companyId,e.id,wh.id,
       CASE e.position WHEN 'WAREHOUSE_MANAGER' THEN 'MANAGER' WHEN 'WORKER' THEN 'WORKER' WHEN 'DRIVER' THEN 'DISPATCH' ELSE 'VIEW_ONLY' END,
       1, DATEADD(MONTH,-12,CAST(@now AS DATE)), NULL, 'Performance seed assignment'
FROM employees e
JOIN warehouses wh ON wh.company_id=@companyId AND wh.id = COALESCE(e.primary_warehouse_id, (SELECT TOP 1 id FROM warehouses WHERE company_id=@companyId ORDER BY id))
WHERE e.company_id=@companyId AND e.position IN ('WAREHOUSE_MANAGER','WORKER','DRIVER','DISPATCHER')
  AND NOT EXISTS (SELECT 1 FROM employee_warehouse_assignments a WHERE a.employee_id=e.id AND a.warehouse_id=wh.id);

INSERT INTO internal_warehouse_movements (warehouse_id,product_id,source_bin_id,destination_bin_id,quantity,status,note,created_by_id,created_at)
SELECT TOP 450 b1.warehouse_id, p.id, b1.id, b2.id, CAST(2 + (ABS(CHECKSUM(b1.id,p.id)) % 60) AS DECIMAL(12,2)),
       CASE WHEN ABS(CHECKSUM(b1.id,p.id)) % 8 = 0 THEN 'CANCELLED' ELSE 'COMPLETED' END,
       'Performance seed internal bin movement',
       (SELECT TOP 1 u.id FROM users u JOIN employees e ON e.user_id=u.id WHERE e.company_id=@companyId AND e.position='WORKER' ORDER BY NEWID()),
       DATEADD(HOUR,-ABS(CHECKSUM(b1.id,p.id))%500,@now)
FROM bin_locations b1
JOIN bin_locations b2 ON b2.warehouse_id=b1.warehouse_id AND b2.id<>b1.id
JOIN warehouses wh ON wh.id=b1.warehouse_id AND wh.company_id=@companyId
JOIN products p ON p.company_id=@companyId AND p.id % 5 = b1.id % 5;

INSERT INTO notifications (title,message,type,severity,status,category,source_type,source_id,dedup_key,escalated_at,created_at,user_id)
SELECT TOP 600 CONCAT('Seed notification ', n.n), 'Performance seed notification message',
       CASE n.n%4 WHEN 0 THEN 'INFO' WHEN 1 THEN 'WARNING' WHEN 2 THEN 'SUCCESS' ELSE 'ERROR' END,
       CASE n.n%4 WHEN 0 THEN 'INFO' WHEN 1 THEN 'WARNING' WHEN 2 THEN 'SUCCESS' ELSE 'CRITICAL' END,
       CASE WHEN n.n%3=0 THEN 'READ' ELSE 'UNREAD' END,
       CASE n.n%7 WHEN 0 THEN 'GENERAL' WHEN 1 THEN 'TRANSPORT' WHEN 2 THEN 'INVENTORY' WHEN 3 THEN 'TASK' WHEN 4 THEN 'SHIFT' WHEN 5 THEN 'WAREHOUSE' ELSE 'SECURITY' END,
       CASE n.n%7 WHEN 0 THEN 'SYSTEM' WHEN 1 THEN 'TRANSPORT_ORDER' WHEN 2 THEN 'WAREHOUSE_INVENTORY' WHEN 3 THEN 'TASK' WHEN 4 THEN 'SHIFT' WHEN 5 THEN 'WAREHOUSE' ELSE 'USER' END,
       n.n, CONCAT('TFS-NOTIF-',n.n), CASE WHEN n.n%20=0 THEN DATEADD(HOUR,-n.n,@now) ELSE NULL END, DATEADD(MINUTE,-n.n*7,@now),
       (SELECT id FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY id) rn FROM users WHERE company_id=@companyId) u WHERE rn=((n.n-1)%33)+1)
FROM (SELECT TOP 600 ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) n FROM sys.all_objects a CROSS JOIN sys.all_objects b) n
WHERE NOT EXISTS (SELECT 1 FROM notifications no WHERE no.dedup_key=CONCAT('TFS-NOTIF-',n.n));

INSERT INTO operational_comments (entity_type,entity_id,content,internal_note,company_id,author_id,created_at,updated_at)
SELECT TOP 350 CASE n.n%5 WHEN 0 THEN 'TRANSPORT_ORDER' WHEN 1 THEN 'TASK' WHEN 2 THEN 'STOCK_MOVEMENT' WHEN 3 THEN 'VEHICLE' ELSE 'WAREHOUSE_INVENTORY' END,
       CASE n.n%5 WHEN 0 THEN (SELECT TOP 1 id FROM transport_orders WHERE order_number=CONCAT('TFS-TO-2026-',RIGHT('0000'+CAST(((n.n-1)%300)+1 AS NVARCHAR(4)),4)))
                  WHEN 1 THEN (SELECT TOP 1 id FROM tasks WHERE title=CONCAT('Operational task ',RIGHT('0000'+CAST(((n.n-1)%700)+1 AS NVARCHAR(4)),4)))
                  WHEN 2 THEN (SELECT TOP 1 id FROM stock_movements ORDER BY id DESC)
                  WHEN 3 THEN (SELECT TOP 1 id FROM vehicles WHERE company_id=@companyId ORDER BY id)
                  ELSE (SELECT TOP 1 warehouse_id FROM warehouse_inventory wi JOIN warehouses w ON w.id=wi.warehouse_id WHERE w.company_id=@companyId) END,
       CONCAT('Performance operational comment ',n.n), CASE WHEN n.n%6=0 THEN 1 ELSE 0 END,
       @companyId, (SELECT id FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY id) rn FROM users WHERE company_id=@companyId) u WHERE rn=((n.n-1)%33)+1),
       DATEADD(MINUTE,-n.n*13,@now), @now
FROM (SELECT TOP 350 ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) n FROM sys.all_objects a CROSS JOIN sys.all_objects b) n;

INSERT INTO operational_attachments (entity_type,entity_id,file_name,content_type,file_url,size_bytes,description,company_id,uploaded_by_id,created_at)
SELECT TOP 180 CASE n.n%4 WHEN 0 THEN 'TRANSPORT_ORDER' WHEN 1 THEN 'TASK' WHEN 2 THEN 'VEHICLE_MAINTENANCE' ELSE 'PRODUCT' END,
       CASE n.n%4 WHEN 0 THEN (SELECT TOP 1 id FROM transport_orders WHERE order_number=CONCAT('TFS-TO-2026-',RIGHT('0000'+CAST(((n.n-1)%300)+1 AS NVARCHAR(4)),4)))
                  WHEN 1 THEN (SELECT TOP 1 id FROM tasks WHERE title=CONCAT('Operational task ',RIGHT('0000'+CAST(((n.n-1)%700)+1 AS NVARCHAR(4)),4)))
                  WHEN 2 THEN (SELECT TOP 1 vm.id FROM vehicle_maintenance vm WHERE vm.company_id=@companyId ORDER BY vm.id)
                  ELSE (SELECT TOP 1 id FROM products WHERE company_id=@companyId ORDER BY id) END,
       CONCAT('seed-attachment-',n.n,'.pdf'), 'application/pdf', CONCAT('https://seed.local/titan/attachment-',n.n,'.pdf'),
       12000 + n.n*17, 'Seed attachment metadata only', @companyId,
       (SELECT id FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY id) rn FROM users WHERE company_id=@companyId) u WHERE rn=((n.n-1)%33)+1),
       DATEADD(MINUTE,-n.n*9,@now)
FROM (SELECT TOP 180 ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) n FROM sys.all_objects a CROSS JOIN sys.all_objects b) n;

INSERT INTO domain_events (event_type,entity_type,entity_id,entity_identifier,summary,payload,company_id,created_by_id,created_at)
SELECT TOP 700 CASE n.n%5 WHEN 0 THEN 'TRANSPORT_LIFECYCLE' WHEN 1 THEN 'INVENTORY_LIFECYCLE' WHEN 2 THEN 'TASK_LIFECYCLE' WHEN 3 THEN 'SHIFT_LIFECYCLE' ELSE 'SYSTEM_EVENT' END,
       CASE n.n%5 WHEN 0 THEN 'TRANSPORT_ORDER' WHEN 1 THEN 'STOCK_MOVEMENT' WHEN 2 THEN 'TASK' WHEN 3 THEN 'SHIFT' ELSE 'COMPANY' END,
       CASE n.n%5 WHEN 0 THEN (SELECT TOP 1 id FROM transport_orders WHERE order_number=CONCAT('TFS-TO-2026-',RIGHT('0000'+CAST(((n.n-1)%300)+1 AS NVARCHAR(4)),4)))
                  WHEN 1 THEN (SELECT TOP 1 id FROM stock_movements ORDER BY id DESC)
                  WHEN 2 THEN (SELECT TOP 1 id FROM tasks WHERE title=CONCAT('Operational task ',RIGHT('0000'+CAST(((n.n-1)%700)+1 AS NVARCHAR(4)),4)))
                  WHEN 3 THEN (SELECT TOP 1 id FROM shifts ORDER BY id DESC)
                  ELSE @companyId END,
       CONCAT('TFS-EVENT-',n.n),'Performance domain event', CONCAT('{"seed":true,"sequence":',n.n,'}'), @companyId,
       (SELECT id FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY id) rn FROM users WHERE company_id=@companyId) u WHERE rn=((n.n-1)%33)+1),
       DATEADD(MINUTE,-n.n*5,@now)
FROM (SELECT TOP 700 ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) n FROM sys.all_objects a CROSS JOIN sys.all_objects b) n;

INSERT INTO activity_logs (action,entity_name,entity_id,entity_identifier,description,created_at,user_id)
SELECT TOP 800 CASE n.n%5 WHEN 0 THEN 'LOGIN' WHEN 1 THEN 'CREATE' WHEN 2 THEN 'UPDATE' WHEN 3 THEN 'STATUS_CHANGE' ELSE 'EXPORT' END,
       CASE n.n%5 WHEN 0 THEN 'USER' WHEN 1 THEN 'TRANSPORT_ORDER' WHEN 2 THEN 'WAREHOUSE_INVENTORY' WHEN 3 THEN 'TASK' ELSE 'REPORT' END,
       n.n, CONCAT('TFS-ACT-',n.n), 'Performance activity log', DATEADD(MINUTE,-n.n*3,@now),
       (SELECT id FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY id) rn FROM users WHERE company_id=@companyId) u WHERE rn=((n.n-1)%33)+1)
FROM (SELECT TOP 800 ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) n FROM sys.all_objects a CROSS JOIN sys.all_objects b) n;

INSERT INTO change_history (entity_name,entity_id,entity_identifier,change_type,field_name,old_value,new_value,changed_at,changed_by_user_id)
SELECT TOP 500 CASE n.n%4 WHEN 0 THEN 'TRANSPORT_ORDER' WHEN 1 THEN 'TASK' WHEN 2 THEN 'VEHICLE' ELSE 'WAREHOUSE_INVENTORY' END,
       n.n, CONCAT('TFS-CHG-',n.n), CASE n.n%3 WHEN 0 THEN 'UPDATE' WHEN 1 THEN 'STATUS_CHANGE' ELSE 'CREATE' END,
       CASE n.n%3 WHEN 0 THEN 'status' WHEN 1 THEN 'quantity' ELSE 'priority' END,
       CASE n.n%3 WHEN 0 THEN 'CREATED' WHEN 1 THEN '100' ELSE NULL END,
       CASE n.n%3 WHEN 0 THEN 'IN_PROGRESS' WHEN 1 THEN '125' ELSE 'HIGH' END,
       DATEADD(MINUTE,-n.n*4,@now),
       (SELECT id FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY id) rn FROM users WHERE company_id=@companyId) u WHERE rn=((n.n-1)%33)+1)
FROM (SELECT TOP 500 ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) n FROM sys.all_objects a CROSS JOIN sys.all_objects b) n;

IF NOT EXISTS (SELECT 1 FROM company_registration_requests WHERE admin_email='milos.petrovic@titanfreight.admin.rs')
BEGIN
    INSERT INTO company_registration_requests (
        company_name,registration_number,tax_number,company_email,company_phone_number,country_id,city_id,timezone_id,address,postal_code,
        admin_first_name,admin_last_name,admin_email,admin_phone_number,admin_jmbg,admin_password,admin_employment_date,status,submitted_at,
        reviewed_at,reviewed_by_id,rejection_reason,notes,created_company_id,updated_at,admin_address
    ) VALUES (
        'Titan Freight Solutions DOO','20999881','112233445','contact@titanfreight.rs','601234567',@countryId,@belgradeCityId,@timezoneId,
        'Autoput za Zagreb 44',(SELECT postal_code FROM cities WHERE id=@belgradeCityId),'Milos','Petrovic','milos.petrovic@titanfreight.admin.rs','601111111','0101980710001',@pwd,
        DATEADD(YEAR,-2,CAST(@now AS DATE)),'APPROVED',DATEADD(MONTH,-18,@now),DATEADD(MONTH,-18,DATEADD(DAY,1,@now)),@overlordUserId,NULL,
        'Approved enterprise performance seed request',@companyId,@now,'Autoput za Zagreb 44'
    );
END;

IF NOT EXISTS (SELECT 1 FROM company_registration_requests WHERE admin_email='ana.maric@pendinglogistics.admin.rs')
BEGIN
    INSERT INTO company_registration_requests (
        company_name,registration_number,tax_number,company_email,company_phone_number,country_id,city_id,timezone_id,address,postal_code,
        admin_first_name,admin_last_name,admin_email,admin_phone_number,admin_jmbg,admin_password,admin_employment_date,status,submitted_at,
        reviewed_at,reviewed_by_id,rejection_reason,notes,created_company_id,updated_at,admin_address
    ) VALUES (
        'Pending Logistics DOO','30555111','119991112','contact@pendinglogistics.rs','602222222',@countryId,@noviSadCityId,@timezoneId,
        'Bulevar Evrope 77',(SELECT postal_code FROM cities WHERE id=@noviSadCityId),'Ana','Maric','ana.maric@pendinglogistics.admin.rs','602223333','0101980710999',@pwd,
        DATEADD(DAY,-10,CAST(@now AS DATE)),'PENDING',DATEADD(DAY,-2,@now),NULL,NULL,NULL,
        'Pending request for Overlord panel testing',NULL,@now,'Bulevar Evrope 77'
    );
END;

COMMIT TRANSACTION;

/*
PERFORMANCE SEED LOGIN DATA
Password for all Titan Freight users: Admin123!

Main logins:
milos.petrovic@titanfreight.admin.rs
nikola.jankovic@titanfreight.warehouse.rs
stefan.milosevic@titanfreight.warehouse.rs
petar.lazic@titanfreight.dispatcher.rs
luka.pavlovic@titanfreight.driver.rs
ivan.nikolic@titanfreight.worker.rs

Approximate inserted volume:
1 company, 33 users, 33 employees, 6 warehouses, 42 zones, 240 bins, 120 products,
720 warehouse inventory rows, several thousand bin inventory rows, 12 vehicles,
300 transport orders, 900 transport items, 2000 stock movements, 700 tasks,
420 shifts, 600 notifications, 350 comments, 180 attachments, 700 domain events,
800 activity logs, 500 change history rows, 2 company registration requests.
*/
