/*
 * Independent medium-sized cold-chain company for development and demos.
 * All operational keys use the MCC prefix and all scoped joins resolve through @companyId.
 * Shared roles, geography and vehicle make/model rows are global reference data.
 * Development password for every MCC user: Admin123!
 */
SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
BEGIN TRANSACTION;

DECLARE @Now DATETIME2(3)=SYSUTCDATETIME();
DECLARE @Today DATE = CAST(@Now AS DATE);
DECLARE @Password NVARCHAR(255)=N'$2a$10$NBqZSKuQWFxDQx5taxDczuSxfo/mwhAzngiVOPnpVAKr0RskxtaSG';
DECLARE @CountryId BIGINT=(SELECT TOP (1) id FROM countries WHERE code=N'RS');
DECLARE @TimezoneId BIGINT=(SELECT TOP (1) id FROM timezones WHERE name=N'Europe/Belgrade');
DECLARE @BelgradeId BIGINT=(SELECT TOP (1) id FROM cities WHERE country_id=@CountryId AND name=N'Belgrade');
DECLARE @NoviSadId BIGINT=(SELECT TOP (1) id FROM cities WHERE country_id=@CountryId AND name=N'Novi Sad');
DECLARE @NisId BIGINT=(SELECT TOP (1) id FROM cities WHERE country_id=@CountryId AND name=N'Nis');
DECLARE @KragujevacId BIGINT=(SELECT TOP (1) id FROM cities WHERE country_id=@CountryId AND name=N'Kragujevac');
DECLARE @CompanyId BIGINT;

IF @CountryId IS NULL OR @TimezoneId IS NULL OR @BelgradeId IS NULL OR @NoviSadId IS NULL OR @NisId IS NULL OR @KragujevacId IS NULL
    THROW 51046,'V45 prerequisites are missing.',1;
IF EXISTS (SELECT 1 FROM companies WHERE name=N'Morava Cold Chain d.o.o.')
    THROW 51047,'V45 company already exists.',1;

INSERT INTO companies
    (name,active,country_id,phone_code,timezone_id,address,city_id,postal_code,phone_number,email,tax_number,registration_number,created_at,updated_at)
VALUES
    (N'Morava Cold Chain d.o.o.',1,@CountryId,N'+381',@TimezoneId,N'Bulevar prehrambene industrije 27',@KragujevacId,N'34000',
     N'345550190',N'office@moravacold.rs',N'118462730',N'22916485',DATEADD(MONTH,-30,@Now),@Now);
SET @CompanyId=SCOPE_IDENTITY();

/* 48 named employees: 1 admin, 1 HR, 4 managers, 4 dispatchers, 12 drivers, 26 cold-store workers. */
DECLARE @FirstNames TABLE(rn INT PRIMARY KEY,value NVARCHAR(60));
INSERT INTO @FirstNames VALUES
(1,N'Mihajlo'),(2,N'Bojana'),(3,N'Veljko'),(4,N'Nevena'),(5,N'Uroš'),(6,N'Isidora'),
(7,N'Predrag'),(8,N'Maja'),(9,N'Dušan'),(10,N'Teodora'),(11,N'Vladimir'),(12,N'Sofija');
DECLARE @LastNames TABLE(rn INT PRIMARY KEY,value NVARCHAR(60));
INSERT INTO @LastNames VALUES
(1,N'Radosavljević'),(2,N'Vuković'),(3,N'Mitrović'),(4,N'Đorđević'),(5,N'Obradović'),(6,N'Maksimović'),
(7,N'Zdravković'),(8,N'Radovanović'),(9,N'Petković'),(10,N'Krstić'),(11,N'Mladenović'),(12,N'Stevanović');
DECLARE @People TABLE(rn INT PRIMARY KEY,first_name NVARCHAR(60),last_name NVARCHAR(60),email NVARCHAR(150),role_name NVARCHAR(50),position NVARCHAR(50),warehouse_slot INT NULL);
;WITH n AS (SELECT TOP (48) ROW_NUMBER() OVER(ORDER BY (SELECT NULL)) rn FROM sys.all_objects)
INSERT INTO @People
SELECT n.rn,f.value,l.value,CONCAT(N'mcc.',RIGHT(N'00'+CAST(n.rn AS NVARCHAR(2)),2),N'@moravacold.rs'),
       CASE WHEN n.rn=1 THEN N'COMPANY_ADMIN' WHEN n.rn=2 THEN N'HR_MANAGER' WHEN n.rn BETWEEN 3 AND 6 THEN N'WAREHOUSE_MANAGER'
            WHEN n.rn BETWEEN 7 AND 10 THEN N'DISPATCHER' WHEN n.rn BETWEEN 11 AND 22 THEN N'DRIVER' ELSE N'WORKER' END,
       CASE WHEN n.rn=1 THEN N'COMPANY_ADMIN' WHEN n.rn=2 THEN N'HR_MANAGER' WHEN n.rn BETWEEN 3 AND 6 THEN N'WAREHOUSE_MANAGER'
            WHEN n.rn BETWEEN 7 AND 10 THEN N'DISPATCHER' WHEN n.rn BETWEEN 11 AND 22 THEN N'DRIVER' ELSE N'WORKER' END,
       CASE WHEN n.rn<=2 THEN NULL WHEN n.rn BETWEEN 3 AND 6 THEN n.rn-2 WHEN n.rn BETWEEN 7 AND 10 THEN n.rn-6 ELSE ((n.rn-11)%4)+1 END
FROM n JOIN @FirstNames f ON f.rn=((n.rn-1)%12)+1 JOIN @LastNames l ON l.rn=(((n.rn-1)/12+n.rn-1)%12)+1;

INSERT INTO users(password,first_name,last_name,email,status,enabled,created_at,updated_at,role_id,company_id)
SELECT @Password,p.first_name,p.last_name,p.email,N'ACTIVE',1,DATEADD(DAY,-700+p.rn,@Now),@Now,r.id,@CompanyId
FROM @People p JOIN roles r ON r.name=p.role_name;

INSERT INTO employees
    (first_name,last_name,jmbg,phone_code,phone_number,email,address,city_id,postal_code,timezone_id,position,employment_date,salary,active,updated_at,
     company_id,country_id,primary_warehouse_id,user_id,auto_generated_email,email_manually_overridden,email_generation_source)
SELECT p.first_name,p.last_name,CONCAT(N'8',RIGHT(N'000000000000'+CAST(56000000000+p.rn AS NVARCHAR(12)),12)),N'+381',
       CONCAT(N'64',RIGHT(N'0000000'+CAST(8100000+p.rn AS NVARCHAR(7)),7)),p.email,CONCAT(N'Moravska ulica ',p.rn),
       CASE p.warehouse_slot WHEN 1 THEN @KragujevacId WHEN 2 THEN @BelgradeId WHEN 3 THEN @NisId WHEN 4 THEN @NoviSadId ELSE @KragujevacId END,
       CASE p.warehouse_slot WHEN 1 THEN N'34000' WHEN 2 THEN N'11271' WHEN 3 THEN N'18000' WHEN 4 THEN N'21000' ELSE N'34000' END,
       @TimezoneId,p.position,DATEADD(DAY,-650+p.rn,@Today),
       CASE p.position WHEN N'COMPANY_ADMIN' THEN 205000 WHEN N'HR_MANAGER' THEN 165000 WHEN N'WAREHOUSE_MANAGER' THEN 155000
            WHEN N'DISPATCHER' THEN 142000 WHEN N'DRIVER' THEN 130000 ELSE 101000 END,
       1,@Now,@CompanyId,@CountryId,NULL,u.id,1,0,N'V45_MORAVA_COLD_CHAIN'
FROM @People p JOIN users u ON u.email=p.email;

DECLARE @Warehouses TABLE(slot INT PRIMARY KEY,code NVARCHAR(10),name NVARCHAR(120),city_id BIGINT,postal NVARCHAR(15),address NVARCHAR(200),latitude DECIMAL(10,7),longitude DECIMAL(10,7));
INSERT INTO @Warehouses VALUES
(1,N'KG',N'Morava centralni hladnjačni centar',@KragujevacId,N'34000',N'Industrijska zona Sobovica 12',44.0581000,20.9103000),
(2,N'BG',N'Morava cross-dock Beograd',@BelgradeId,N'11271',N'Logistički park Surčin 8',44.7867000,20.2691000),
(3,N'NI',N'Morava južni temperaturni hub',@NisId,N'18000',N'Bulevar 12. februar 191',43.3371000,21.8535000),
(4,N'NS',N'Morava severni distributivni depo',@NoviSadId,N'21000',N'Privrednikova 44',45.2896000,19.8429000);
INSERT INTO warehouses(name,address,city_id,postal_code,timezone_id,latitude,longitude,capacity,status,active,updated_at,company_id,country_id,manager_id,bin_tracking_enabled,version)
SELECT w.name,w.address,w.city_id,w.postal,@TimezoneId,w.latitude,w.longitude,120000,N'ACTIVE',1,@Now,@CompanyId,@CountryId,
       (SELECT e.id FROM employees e JOIN @People p ON p.email=e.email WHERE p.rn=w.slot+2),1,0
FROM @Warehouses w;

UPDATE e SET primary_warehouse_id=w.id
FROM employees e JOIN @People p ON p.email=e.email JOIN @Warehouses sw ON sw.slot=p.warehouse_slot
JOIN warehouses w ON w.company_id=@CompanyId AND w.name=sw.name;
INSERT INTO employee_warehouse_assignments(company_id,employee_id,warehouse_id,access_type,active,valid_from,valid_to,notes,created_at,updated_at)
SELECT @CompanyId,e.id,w.id,CASE p.position WHEN N'WAREHOUSE_MANAGER' THEN N'MANAGER' WHEN N'DISPATCHER' THEN N'DISPATCH'
       WHEN N'DRIVER' THEN N'PRIMARY' ELSE N'WORKER' END,1,DATEADD(MONTH,-18,@Today),NULL,N'Matično mesto u mreži hladnog lanca',DATEADD(MONTH,-18,@Now),@Now
FROM @People p JOIN employees e ON e.email=p.email JOIN @Warehouses sw ON sw.slot=p.warehouse_slot JOIN warehouses w ON w.company_id=@CompanyId AND w.name=sw.name;

DECLARE @Zones TABLE(code NVARCHAR(10),name NVARCHAR(100),type NVARCHAR(30));
INSERT INTO @Zones VALUES
(N'REC',N'Temperaturni prijem',N'RECEIVING'),(N'AMB',N'Ambijentalna komora',N'STORAGE'),(N'CHL',N'Hladna komora 2-8 C',N'STORAGE'),
(N'FRZ',N'Komora smrznute robe',N'STORAGE'),(N'PIC',N'Hladno komisioniranje',N'PICKING'),(N'DSP',N'Kontrolisana otprema',N'DISPATCH'),
(N'QUA',N'Temperaturni karantin',N'QUARANTINE'),(N'RET',N'Povrat i reklamacije',N'RETURNS');
INSERT INTO warehouse_zones(warehouse_id,code,name,type,capacity,active,description,created_at,updated_at)
SELECT w.id,CONCAT(sw.code,N'-',z.code),z.name,z.type,15000,1,N'Zona sa praćenjem temperaturnog režima',DATEADD(MONTH,-24,@Now),@Now
FROM @Warehouses sw JOIN warehouses w ON w.company_id=@CompanyId AND w.name=sw.name CROSS JOIN @Zones z;
;WITH bins AS (SELECT 1 rn UNION ALL SELECT 2)
INSERT INTO bin_locations(warehouse_id,zone_id,code,name,capacity,active,description,created_at,updated_at)
SELECT w.id,z.id,CONCAT(sw.code,N'-',zt.code,N'-',bins.rn),CONCAT(zt.name,N' pozicija ',bins.rn),15000,1,N'Pozicija sa evidentiranim temperaturnim režimom',DATEADD(MONTH,-24,@Now),@Now
FROM @Warehouses sw JOIN warehouses w ON w.company_id=@CompanyId AND w.name=sw.name CROSS JOIN @Zones zt
JOIN warehouse_zones z ON z.warehouse_id=w.id AND z.code=CONCAT(sw.code,N'-',zt.code) CROSS JOIN bins;

/* Sixty cold-chain SKUs in six distinct commercial families. */
DECLARE @Families TABLE(rn INT PRIMARY KEY,prefix NVARCHAR(10),label NVARCHAR(80),unit NVARCHAR(20),base_price DECIMAL(12,2),base_weight DECIMAL(12,2),fragile BIT,zone_code NVARCHAR(10));
INSERT INTO @Families VALUES
(1,N'DAI',N'Fermentisani mlečni proizvod',N'BOX',4200,8.00,0,N'CHL'),(2,N'FRZ',N'Smrznuto povrće HoReCa',N'BOX',6900,10.00,0,N'FRZ'),
(3,N'MEA',N'Vakumirano sveže meso',N'BOX',12500,12.00,0,N'CHL'),(4,N'PHA',N'Farmaceutski termo-paket',N'PIECE',18900,2.20,1,N'CHL'),
(5,N'FRE',N'Sveže bobičasto voće',N'CRATE',7600,5.00,1,N'CHL'),(6,N'AMB',N'Sterilisana prehrambena sirovina',N'BOX',5100,9.00,0,N'AMB');
;WITH n AS (SELECT TOP (60) ROW_NUMBER() OVER(ORDER BY (SELECT NULL)) rn FROM sys.all_objects)
INSERT INTO products(name,description,sku,unit,price,fragile,weight,active,updated_at,company_id)
SELECT CONCAT(f.label,N' serija ',RIGHT(N'00'+CAST(((n.rn-1)/6)+1 AS NVARCHAR(2)),2)),N'Artikal kontrolisanog lanca snabdevanja',
       CONCAT(N'MCC-',f.prefix,N'-',RIGHT(N'000'+CAST(n.rn AS NVARCHAR(3)),3)),f.unit,f.base_price+((n.rn-1)/6)*275,f.fragile,f.base_weight+(n.rn%4)*0.25,1,@Now,@CompanyId
FROM n JOIN @Families f ON f.rn=((n.rn-1)%6)+1;

;WITH wr AS (SELECT id,ROW_NUMBER() OVER(ORDER BY id) rn FROM warehouses WHERE company_id=@CompanyId),
pr AS (SELECT id,price,ROW_NUMBER() OVER(ORDER BY sku) rn FROM products WHERE company_id=@CompanyId)
INSERT INTO warehouse_inventory(warehouse_id,product_id,quantity,reserved_quantity,min_stock_level,last_updated,version,average_unit_cost,total_value,currency)
SELECT w.id,p.id,CAST(180+((w.rn*37+p.rn*19)%210) AS DECIMAL(12,2)),CASE WHEN p.rn%9=0 THEN 12 ELSE 0 END,
       CASE WHEN p.rn%10=0 THEN 210 ELSE 45 END,@Now,0,p.price*0.68,(180+((w.rn*37+p.rn*19)%210))*(p.price*0.68),N'RSD'
FROM wr w CROSS JOIN pr p;
;WITH wr AS (SELECT id,ROW_NUMBER() OVER(ORDER BY id) rn FROM warehouses WHERE company_id=@CompanyId),
pr AS (SELECT id,sku,ROW_NUMBER() OVER(ORDER BY sku) rn FROM products WHERE company_id=@CompanyId),bins AS (SELECT 1 n UNION ALL SELECT 2)
INSERT INTO bin_inventory(bin_location_id,product_id,quantity,last_updated,version)
SELECT b.id,p.id,CASE WHEN bins.n=1 THEN FLOOR(wi.quantity/2) ELSE wi.quantity-FLOOR(wi.quantity/2) END,@Now,0
FROM wr w CROSS JOIN pr p CROSS JOIN bins JOIN warehouse_inventory wi ON wi.warehouse_id=w.id AND wi.product_id=p.id
JOIN bin_locations b ON b.warehouse_id=w.id AND b.code=CONCAT(CASE w.rn WHEN 1 THEN N'KG' WHEN 2 THEN N'BG' WHEN 3 THEN N'NI' ELSE N'NS' END,
     N'-',CASE WHEN p.sku LIKE N'MCC-FRZ-%' THEN N'FRZ' WHEN p.sku LIKE N'MCC-AMB-%' THEN N'AMB' ELSE N'CHL' END,N'-',bins.n);

/* Eighteen independently owned refrigerated vehicles based on global make/model reference rows. */
;WITH models AS (
    SELECT vm.id,ROW_NUMBER() OVER(ORDER BY vm.id) rn,COUNT(*) OVER() cnt FROM vehicle_models vm JOIN vehicle_brands vb ON vb.id=vm.brand_id WHERE vm.active=1 AND vb.active=1
),n AS (SELECT TOP (18) ROW_NUMBER() OVER(ORDER BY (SELECT NULL)) rn FROM sys.all_objects)
INSERT INTO vehicles(registration_number,vehicle_model_id,type,capacity,max_weight,max_volume,max_items,fuel_type,year_of_production,status,active,updated_at,company_id,version)
SELECT CONCAT(CASE WHEN n.rn%4=0 THEN N'NS' WHEN n.rn%4=1 THEN N'KG' WHEN n.rn%4=2 THEN N'BG' ELSE N'NI' END,N'-',700+n.rn,N'-MC'),
       m.id,CASE WHEN n.rn<=6 THEN N'VAN' WHEN n.rn<=14 THEN N'BOX_TRUCK' ELSE N'TRUCK' END,
       CASE WHEN n.rn<=6 THEN 1400 WHEN n.rn<=14 THEN 6500 ELSE 10500 END,CASE WHEN n.rn<=6 THEN 1400 WHEN n.rn<=14 THEN 6500 ELSE 10500 END,
       CASE WHEN n.rn<=6 THEN 15 WHEN n.rn<=14 THEN 42 ELSE 62 END,CASE WHEN n.rn<=6 THEN 120 WHEN n.rn<=14 THEN 360 ELSE 520 END,N'DIESEL',2019+n.rn%7,
       CASE WHEN n.rn=7 THEN N'IN_USE' WHEN n.rn BETWEEN 8 AND 14 THEN N'RESERVED' ELSE N'AVAILABLE' END,1,@Now,@CompanyId,0
FROM n JOIN models m ON m.rn=((n.rn-1)%m.cnt)+1;

/* Four service records per vehicle: three completed and one future planned. */
;WITH seq AS (SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4),vr AS (SELECT id,ROW_NUMBER() OVER(ORDER BY id) rn FROM vehicles WHERE company_id=@CompanyId)
INSERT INTO vehicle_maintenance(vehicle_id,company_id,type,status,scheduled_at,started_at,completed_at,cancelled_at,odometer,cost,notes,cancel_reason,created_at,updated_at)
SELECT v.id,@CompanyId,CASE s.n WHEN 1 THEN N'ROUTINE_SERVICE' WHEN 2 THEN N'OIL_CHANGE' WHEN 3 THEN N'INSPECTION' ELSE N'TIRE_CHANGE' END,
       CASE WHEN s.n=4 THEN N'PLANNED' ELSE N'COMPLETED' END,
       CASE WHEN s.n=4 THEN DATEADD(DAY,20+v.rn,@Now) ELSE DATEADD(DAY,-s.n*70-v.rn,@Now) END,
       CASE WHEN s.n<4 THEN DATEADD(HOUR,1,DATEADD(DAY,-s.n*70-v.rn,@Now)) END,
       CASE WHEN s.n<4 THEN DATEADD(HOUR,5,DATEADD(DAY,-s.n*70-v.rn,@Now)) END,NULL,45000+v.rn*2800+s.n*500,
       CASE s.n WHEN 1 THEN 39000 WHEN 2 THEN 24000 WHEN 3 THEN 18000 ELSE 62000 END,N'Servis rashladnog agregata i voznog sklopa',NULL,
       CASE WHEN s.n=4 THEN @Now ELSE DATEADD(DAY,-s.n*70-v.rn-4,@Now) END,@Now
FROM vr v CROSS JOIN seq s;

/* 120 transports: 80 delivered, 10 cancelled, 6 failed, one live, seven assigned and sixteen drafts. */
;WITH n AS (SELECT TOP (120) ROW_NUMBER() OVER(ORDER BY (SELECT NULL)) rn FROM sys.all_objects),
wr AS (SELECT id,ROW_NUMBER() OVER(ORDER BY id) rn FROM warehouses WHERE company_id=@CompanyId),
vr AS (SELECT id,ROW_NUMBER() OVER(ORDER BY id) rn FROM vehicles WHERE company_id=@CompanyId),
dr AS (SELECT id,ROW_NUMBER() OVER(ORDER BY id) rn FROM employees WHERE company_id=@CompanyId AND position=N'DRIVER'),
dispatcher AS (SELECT TOP (1) u.id FROM users u JOIN roles r ON r.id=u.role_id WHERE u.company_id=@CompanyId AND r.name=N'DISPATCHER' ORDER BY u.id)
INSERT INTO transport_orders(order_number,description,order_date,departure_time,actual_arrival_time,planned_arrival_time,status,priority,total_weight,notes,updated_at,created_at,
 source_warehouse_id,destination_warehouse_id,vehicle_id,assigned_employee_id,created_by_user_id,version)
SELECT CONCAT(N'MCC-TO-',RIGHT(N'0000'+CAST(n.rn AS NVARCHAR(4)),4)),N'Isporuka u kontrolisanom temperaturnom režimu',
       DATEADD(DAY,CASE WHEN n.rn<=96 THEN -60+((n.rn-1)/2) ELSE n.rn-97 END,@Now),
       CASE WHEN n.rn<=96 THEN DATEADD(HOUR,CASE WHEN ((n.rn-1)%12)%2=0 THEN 15 ELSE 7 END,DATEADD(DAY,-60+((n.rn-1)/2),CAST(@Today AS DATETIME2)))
            WHEN n.rn=97 THEN DATEADD(HOUR,-2,@Now)
            ELSE DATEADD(HOUR,CASE WHEN ((n.rn-1)%12)%2=0 THEN 15 ELSE 7 END,DATEADD(DAY,n.rn-97,CAST(@Today AS DATETIME2))) END,
       CASE WHEN n.rn<=80 THEN DATEADD(HOUR,CASE WHEN ((n.rn-1)%12)%2=0 THEN 20 ELSE 12 END,DATEADD(DAY,-60+((n.rn-1)/2),CAST(@Today AS DATETIME2))) END,
       CASE WHEN n.rn=97 THEN DATEADD(HOUR,6,@Now)
            ELSE DATEADD(HOUR,CASE WHEN ((n.rn-1)%12)%2=0 THEN 21 ELSE 13 END,DATEADD(DAY,CASE WHEN n.rn<=96 THEN -60+((n.rn-1)/2) ELSE n.rn-97 END,CAST(@Today AS DATETIME2))) END,
       CASE WHEN n.rn<=80 THEN N'DELIVERED' WHEN n.rn<=90 THEN N'CANCELLED' WHEN n.rn<=96 THEN N'FAILED' WHEN n.rn=97 THEN N'IN_TRANSIT'
            WHEN n.rn<=104 THEN N'ASSIGNED' ELSE N'DRAFT' END,
       CASE n.rn%4 WHEN 0 THEN N'URGENT' WHEN 1 THEN N'HIGH' WHEN 2 THEN N'MEDIUM' ELSE N'LOW' END,420+n.rn*8,
       CASE WHEN n.rn<=80 THEN N'Temperaturni zapis potvrđen pri prijemu' WHEN n.rn<=90 THEN N'Otkazano na zahtev primaoca'
            WHEN n.rn<=96 THEN N'Isporuka prekinuta zbog odstupanja temperature' ELSE N'Plan hladnog transporta' END,@Now,
       CASE WHEN n.rn<=96 THEN DATEADD(DAY,-1,DATEADD(DAY,-60+((n.rn-1)/2),@Now)) ELSE DATEADD(HOUR,-(n.rn-96),@Now) END,
       sw.id,dw.id,v.id,d.id,du.id,0
FROM n JOIN wr sw ON sw.rn=((n.rn-1)%4)+1 JOIN wr dw ON dw.rn=(n.rn%4)+1
JOIN vr v ON v.rn=((n.rn-1)%18)+1 JOIN dr d ON d.rn=((n.rn-1)%12)+1 CROSS JOIN dispatcher du;

;WITH pr AS (SELECT id,weight,ROW_NUMBER() OVER(ORDER BY sku) rn FROM products WHERE company_id=@CompanyId),
orders AS (SELECT id,status,ROW_NUMBER() OVER(ORDER BY order_number) rn FROM transport_orders WHERE order_number LIKE N'MCC-TO-%'),
seq AS (SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3)
INSERT INTO transport_order_items(quantity,reserved_quantity,dispatched_quantity,delivered_quantity,weight,note,transport_order_id,product_id)
SELECT 4+((o.rn+s.n*7)%18),CASE WHEN o.status=N'ASSIGNED' THEN 4+((o.rn+s.n*7)%18) ELSE 0 END,
       CASE WHEN o.status IN(N'IN_TRANSIT',N'DELIVERED') THEN 4+((o.rn+s.n*7)%18) ELSE 0 END,
       CASE WHEN o.status=N'DELIVERED' THEN 4+((o.rn+s.n*7)%18) ELSE 0 END,(4+((o.rn+s.n*7)%18))*p.weight,
       N'Paleta sa evidentiranim temperaturnim loggerom',o.id,p.id
FROM orders o CROSS JOIN seq s JOIN pr p ON p.rn=((o.rn+s.n*17-2)%60)+1;

UPDATE t SET total_weight=x.item_weight
FROM transport_orders t JOIN (SELECT transport_order_id,SUM(weight) item_weight FROM transport_order_items GROUP BY transport_order_id) x ON x.transport_order_id=t.id
WHERE t.order_number LIKE N'MCC-TO-%';

UPDATE wi SET reserved_quantity=COALESCE(r.reserved_quantity,0),last_updated=@Now
FROM warehouse_inventory wi JOIN warehouses w ON w.id=wi.warehouse_id AND w.company_id=@CompanyId
LEFT JOIN (
    SELECT t.source_warehouse_id warehouse_id,i.product_id,SUM(i.reserved_quantity) reserved_quantity
    FROM transport_orders t JOIN transport_order_items i ON i.transport_order_id=t.id
    WHERE t.order_number LIKE N'MCC-TO-%' AND t.status=N'ASSIGNED'
    GROUP BY t.source_warehouse_id,i.product_id
) r ON r.warehouse_id=wi.warehouse_id AND r.product_id=wi.product_id;

/* Inventory ledger: opening + source dispatch + destination receipt = current stock. */
;WITH effects AS (
 SELECT t.source_warehouse_id warehouse_id,i.product_id,-i.quantity delta FROM transport_order_items i JOIN transport_orders t ON t.id=i.transport_order_id WHERE t.order_number LIKE N'MCC-TO-%' AND t.status=N'DELIVERED'
 UNION ALL
 SELECT t.destination_warehouse_id,i.product_id,i.quantity FROM transport_order_items i JOIN transport_orders t ON t.id=i.transport_order_id WHERE t.order_number LIKE N'MCC-TO-%' AND t.status=N'DELIVERED'
),net AS (SELECT warehouse_id,product_id,SUM(delta) delta FROM effects GROUP BY warehouse_id,product_id)
INSERT INTO stock_movements(movement_type,status,quantity,reason_code,reason_description,reference_type,reference_id,reference_number,reference_note,transfer_group_id,adjustment_direction,
 quantity_before,quantity_after,reserved_before,reserved_after,available_before,available_after,expected_quantity,actual_quantity,discrepancy_quantity,created_at,warehouse_id,product_id,
 created_by_user_id,transport_order_id,source_type,source_id,reference_code,source_bin_id,destination_bin_id,unit_cost,total_cost,currency)
SELECT N'INBOUND',N'EXECUTED',wi.quantity-COALESCE(n.delta,0),N'INITIAL_STOCK',N'Početno stanje hladnog lanca',N'MANUAL',NULL,
 CONCAT(N'MCC-OPEN-',w.id,N'-',p.id),N'Rekonstruisano početno stanje',NULL,N'INCREASE',0,wi.quantity-COALESCE(n.delta,0),0,0,0,wi.quantity-COALESCE(n.delta,0),
 wi.quantity-COALESCE(n.delta,0),wi.quantity-COALESCE(n.delta,0),0,DATEADD(MONTH,-7,@Now),wi.warehouse_id,wi.product_id,
 (SELECT TOP (1) e.user_id FROM employees e WHERE e.company_id=@CompanyId AND e.primary_warehouse_id=wi.warehouse_id AND e.position=N'WAREHOUSE_MANAGER'),NULL,N'MANUAL',NULL,CONCAT(N'MCC-OPEN-',w.id,N'-',p.id),NULL,NULL,wi.average_unit_cost,
 (wi.quantity-COALESCE(n.delta,0))*wi.average_unit_cost,N'RSD'
FROM warehouse_inventory wi JOIN warehouses w ON w.id=wi.warehouse_id AND w.company_id=@CompanyId JOIN products p ON p.id=wi.product_id LEFT JOIN net n ON n.warehouse_id=wi.warehouse_id AND n.product_id=wi.product_id;

;WITH events AS (
 SELECT t.id transport_id,t.order_number,t.source_warehouse_id warehouse_id,i.product_id,i.quantity,t.departure_time event_time,-i.quantity delta,N'TRANSFER_OUT' movement_type,N'TRANSPORT_DISPATCH' reason_code,N'OUT' side
 FROM transport_order_items i JOIN transport_orders t ON t.id=i.transport_order_id WHERE t.order_number LIKE N'MCC-TO-%' AND t.status=N'DELIVERED'
 UNION ALL
 SELECT t.id,t.order_number,t.destination_warehouse_id,i.product_id,i.quantity,t.actual_arrival_time,i.quantity,N'TRANSFER_IN',N'TRANSPORT_RECEIPT',N'IN'
 FROM transport_order_items i JOIN transport_orders t ON t.id=i.transport_order_id WHERE t.order_number LIKE N'MCC-TO-%' AND t.status=N'DELIVERED'
),sequenced AS (
 SELECT e.*,SUM(delta) OVER(PARTITION BY warehouse_id,product_id ORDER BY event_time,transport_id,side ROWS UNBOUNDED PRECEDING) running_delta,
        SUM(delta) OVER(PARTITION BY warehouse_id,product_id) net_delta,ROW_NUMBER() OVER(ORDER BY event_time,transport_id,side,product_id) rn
 FROM events e
)
INSERT INTO stock_movements(movement_type,status,quantity,reason_code,reason_description,reference_type,reference_id,reference_number,reference_note,transfer_group_id,adjustment_direction,
 quantity_before,quantity_after,reserved_before,reserved_after,available_before,available_after,expected_quantity,actual_quantity,discrepancy_quantity,created_at,warehouse_id,product_id,
 created_by_user_id,transport_order_id,source_type,source_id,reference_code,source_bin_id,destination_bin_id,unit_cost,total_cost,currency)
SELECT s.movement_type,N'EXECUTED',s.quantity,s.reason_code,
 CASE s.side WHEN N'OUT' THEN N'Otprema sa izvornog skladišta' ELSE N'Prijem u odredišno skladište' END,N'TRANSPORT_ORDER',s.transport_id,
 CONCAT(N'MCC-',s.side,N'-',RIGHT(N'0000'+CAST(s.rn AS NVARCHAR(4)),4)),s.order_number,CONCAT(N'MCC-TG-',s.transport_id,N'-',s.product_id),NULL,
 wi.quantity-s.net_delta+s.running_delta-s.delta,wi.quantity-s.net_delta+s.running_delta,0,0,
 wi.quantity-s.net_delta+s.running_delta-s.delta,wi.quantity-s.net_delta+s.running_delta,s.quantity,s.quantity,0,s.event_time,s.warehouse_id,s.product_id,
 (SELECT TOP (1) e.user_id FROM employees e WHERE e.company_id=@CompanyId AND e.primary_warehouse_id=s.warehouse_id AND e.position=N'WAREHOUSE_MANAGER'),s.transport_id,N'TRANSPORT_ORDER',s.transport_id,
 CONCAT(N'MCC-',s.side,N'-',RIGHT(N'0000'+CAST(s.rn AS NVARCHAR(4)),4)),
 CASE WHEN s.side=N'OUT' THEN (SELECT TOP (1) b.id FROM bin_inventory bi JOIN bin_locations b ON b.id=bi.bin_location_id WHERE b.warehouse_id=s.warehouse_id AND bi.product_id=s.product_id ORDER BY b.id) END,
 CASE WHEN s.side=N'IN' THEN (SELECT TOP (1) b.id FROM bin_inventory bi JOIN bin_locations b ON b.id=bi.bin_location_id WHERE b.warehouse_id=s.warehouse_id AND bi.product_id=s.product_id ORDER BY b.id) END,
 wi.average_unit_cost,s.quantity*wi.average_unit_cost,N'RSD'
FROM sequenced s JOIN warehouse_inventory wi ON wi.warehouse_id=s.warehouse_id AND wi.product_id=s.product_id;

INSERT INTO stock_movements(movement_type,status,quantity,reason_code,reason_description,reference_type,reference_id,reference_number,reference_note,transfer_group_id,adjustment_direction,
 quantity_before,quantity_after,reserved_before,reserved_after,available_before,available_after,expected_quantity,actual_quantity,discrepancy_quantity,created_at,warehouse_id,product_id,
 created_by_user_id,transport_order_id,source_type,source_id,reference_code,source_bin_id,destination_bin_id,unit_cost,total_cost,currency)
SELECT N'RESERVATION',N'EXECUTED',wi.reserved_quantity,N'STOCK_RESERVED',N'Rezervacija za predstojeće hladne isporuke',N'MANUAL',NULL,
       CONCAT(N'MCC-RES-',wi.warehouse_id,N'-',wi.product_id),N'Aktivna operativna rezervacija',NULL,NULL,wi.quantity,wi.quantity,0,wi.reserved_quantity,
       wi.quantity,wi.quantity-wi.reserved_quantity,wi.reserved_quantity,wi.reserved_quantity,0,DATEADD(HOUR,-1,@Now),wi.warehouse_id,wi.product_id,
       (SELECT TOP (1) e.user_id FROM employees e WHERE e.company_id=@CompanyId AND e.primary_warehouse_id=wi.warehouse_id AND e.position=N'WAREHOUSE_MANAGER'),
       NULL,N'MANUAL',NULL,CONCAT(N'MCC-RES-',wi.warehouse_id,N'-',wi.product_id),NULL,NULL,wi.average_unit_cost,wi.reserved_quantity*wi.average_unit_cost,N'RSD'
FROM warehouse_inventory wi JOIN warehouses w ON w.id=wi.warehouse_id AND w.company_id=@CompanyId WHERE wi.reserved_quantity>0;

/* Three workflow tasks per transport, with terminal states matching their order. */
;WITH orders AS (SELECT id,status,created_at,departure_time,actual_arrival_time,source_warehouse_id,ROW_NUMBER() OVER(ORDER BY order_number) rn FROM transport_orders WHERE order_number LIKE N'MCC-TO-%'),
seq AS (SELECT 1 n,N'PICKING' typ UNION ALL SELECT 2,N'LOADING' UNION ALL SELECT 3,N'DRIVING'),
workers AS (SELECT id,primary_warehouse_id,ROW_NUMBER() OVER(PARTITION BY primary_warehouse_id ORDER BY id) rn,COUNT(*) OVER(PARTITION BY primary_warehouse_id) cnt FROM employees WHERE company_id=@CompanyId AND position=N'WORKER')
INSERT INTO tasks(title,description,due_date,priority,status,task_type,started_at,completed_at,cancelled_at,cancel_reason,created_at,updated_at,assigned_employee_id,transport_order_id,stock_movement_id,version)
SELECT CONCAT(CASE s.n WHEN 1 THEN N'Komisioniranje' WHEN 2 THEN N'Kontrolisani utovar' ELSE N'Hladni transport' END,N' MCC-',o.rn),
       N'Izvršenje uz kontrolu temperaturnog režima',COALESCE(o.departure_time,DATEADD(DAY,1,o.created_at)),N'MEDIUM',
       CASE WHEN o.status=N'DELIVERED' THEN N'COMPLETED' WHEN o.status IN(N'CANCELLED',N'FAILED') THEN N'CANCELLED'
            WHEN o.status=N'IN_TRANSIT' THEN CASE WHEN s.n=3 THEN N'IN_PROGRESS' ELSE N'COMPLETED' END WHEN o.status=N'ASSIGNED' THEN N'ASSIGNED' ELSE N'NEW' END,
       s.typ,CASE WHEN o.status IN(N'DELIVERED',N'FAILED',N'IN_TRANSIT') THEN DATEADD(HOUR,s.n-4,o.departure_time) END,
       CASE WHEN o.status=N'DELIVERED' THEN DATEADD(MINUTE,s.n*20-80,o.actual_arrival_time) WHEN o.status=N'IN_TRANSIT' AND s.n<3 THEN DATEADD(MINUTE,s.n*20,o.departure_time) END,
       CASE WHEN o.status IN(N'CANCELLED',N'FAILED') THEN DATEADD(HOUR,1,o.created_at) END,
       CASE WHEN o.status IN(N'CANCELLED',N'FAILED') THEN N'Zatvoreno zajedno sa transportnim nalogom' END,o.created_at,@Now,
       CASE WHEN s.n=3 THEN tr.assigned_employee_id ELSE w.id END,o.id,NULL,0
FROM orders o JOIN transport_orders tr ON tr.id=o.id CROSS JOIN seq s
LEFT JOIN workers w ON s.n<3 AND w.primary_warehouse_id=o.source_warehouse_id AND w.rn=((o.rn+s.n-2)%w.cnt)+1;

/* Conflict-free 75-day roster: exactly one eight-hour shift per employee/day. */
;WITH days AS (SELECT TOP (75) ROW_NUMBER() OVER(ORDER BY (SELECT NULL))-61 d FROM sys.all_objects),staff AS (SELECT id,primary_warehouse_id,ROW_NUMBER() OVER(ORDER BY id) rn FROM employees WHERE company_id=@CompanyId)
INSERT INTO shifts(start_time,end_time,timezone_id,status,notes,warehouse_id,employee_id)
SELECT DATEADD(HOUR,CASE WHEN s.rn%2=0 THEN 6 ELSE 14 END,DATEADD(DAY,d.d,CAST(@Today AS DATETIME2))),
       DATEADD(HOUR,CASE WHEN s.rn%2=0 THEN 14 ELSE 22 END,DATEADD(DAY,d.d,CAST(@Today AS DATETIME2))),@TimezoneId,
       CASE WHEN (s.rn+d.d+100)%31=0 AND NOT EXISTS(
                    SELECT 1 FROM transport_orders t
                    WHERE t.assigned_employee_id=s.id AND t.status NOT IN(N'CANCELLED',N'DRAFT')
                      AND DATEADD(HOUR,CASE WHEN s.rn%2=0 THEN 6 ELSE 14 END,DATEADD(DAY,d.d,CAST(@Today AS DATETIME2)))<=t.departure_time
                      AND DATEADD(HOUR,CASE WHEN s.rn%2=0 THEN 14 ELSE 22 END,DATEADD(DAY,d.d,CAST(@Today AS DATETIME2)))>=t.planned_arrival_time
                ) THEN N'CANCELLED'
            WHEN @Now<DATEADD(HOUR,CASE WHEN s.rn%2=0 THEN 6 ELSE 14 END,DATEADD(DAY,d.d,CAST(@Today AS DATETIME2))) THEN N'PLANNED'
            WHEN @Now>=DATEADD(HOUR,CASE WHEN s.rn%2=0 THEN 14 ELSE 22 END,DATEADD(DAY,d.d,CAST(@Today AS DATETIME2))) THEN N'FINISHED' ELSE N'ACTIVE' END,
       CASE WHEN (s.rn+d.d+100)%31=0 AND NOT EXISTS(
                    SELECT 1 FROM transport_orders t
                    WHERE t.assigned_employee_id=s.id AND t.status NOT IN(N'CANCELLED',N'DRAFT')
                      AND DATEADD(HOUR,CASE WHEN s.rn%2=0 THEN 6 ELSE 14 END,DATEADD(DAY,d.d,CAST(@Today AS DATETIME2)))<=t.departure_time
                      AND DATEADD(HOUR,CASE WHEN s.rn%2=0 THEN 14 ELSE 22 END,DATEADD(DAY,d.d,CAST(@Today AS DATETIME2)))>=t.planned_arrival_time
                ) THEN N'Otkazana smena zbog bolovanja' ELSE N'Redovna smena hladnog lanca' END,
       COALESCE(s.primary_warehouse_id,(SELECT TOP (1) id FROM warehouses WHERE company_id=@CompanyId ORDER BY id)),s.id
FROM days d CROSS JOIN staff s
WHERE NOT(d.d=0 AND s.id=(SELECT id FROM employees WHERE company_id=@CompanyId AND email=N'mcc.11@moravacold.rs'));

INSERT INTO shifts(start_time,end_time,timezone_id,status,notes,warehouse_id,employee_id)
SELECT DATEADD(HOUR,-4,@Now),DATEADD(HOUR,8,@Now),@TimezoneId,N'ACTIVE',N'Aktivna vozačka smena za transport u toku',e.primary_warehouse_id,e.id
FROM employees e WHERE e.company_id=@CompanyId AND e.email=N'mcc.11@moravacold.rs';

/* Eighty internal relocations, forty requests, and thirty count sessions with eight lines each. */
;WITH n AS (SELECT TOP (80) ROW_NUMBER() OVER(ORDER BY (SELECT NULL)) rn FROM sys.all_objects),wr AS (SELECT id,ROW_NUMBER() OVER(ORDER BY id) rn FROM warehouses WHERE company_id=@CompanyId),
pr AS (SELECT id,ROW_NUMBER() OVER(ORDER BY id) rn FROM products WHERE company_id=@CompanyId AND sku NOT LIKE N'MCC-FRZ-%' AND sku NOT LIKE N'MCC-AMB-%')
INSERT INTO internal_warehouse_movements(warehouse_id,product_id,source_bin_id,destination_bin_id,quantity,status,note,created_by_id,created_at)
SELECT w.id,p.id,src.id,dst.id,2+n.rn%9,CASE WHEN n.rn%11=0 THEN N'CANCELLED' ELSE N'COMPLETED' END,N'Rotacija FEFO zalihe između hladnih pozicija',
 (SELECT TOP (1) e.user_id FROM employees e WHERE e.company_id=@CompanyId AND e.primary_warehouse_id=w.id AND e.position=N'WAREHOUSE_MANAGER'),DATEADD(DAY,-n.rn,@Now)
FROM n JOIN wr w ON w.rn=((n.rn-1)%4)+1 JOIN pr p ON p.rn=((n.rn-1)%40)+1
JOIN bin_locations src ON src.warehouse_id=w.id AND src.code LIKE N'%-CHL-1' JOIN bin_locations dst ON dst.warehouse_id=w.id AND dst.code LIKE N'%-CHL-2';

;WITH n AS (SELECT TOP (40) ROW_NUMBER() OVER(ORDER BY (SELECT NULL)) rn FROM sys.all_objects),wr AS (SELECT id,ROW_NUMBER() OVER(ORDER BY id) rn FROM warehouses WHERE company_id=@CompanyId),pr AS (SELECT id,ROW_NUMBER() OVER(ORDER BY id) rn FROM products WHERE company_id=@CompanyId)
INSERT INTO stock_movement_requests(movement_type,status,quantity,adjustment_direction,reason_description,review_note,version,warehouse_id,destination_warehouse_id,product_id,bin_location_id,destination_bin_location_id,
 requested_by_user_id,reviewed_by_user_id,created_movement_id,created_at,updated_at,reviewed_at)
SELECT CASE n.rn%3 WHEN 0 THEN N'ADJUSTMENT' WHEN 1 THEN N'OUTBOUND' ELSE N'WRITE_OFF' END,
       CASE n.rn%4 WHEN 0 THEN N'REQUESTED' WHEN 1 THEN N'APPROVED' WHEN 2 THEN N'REJECTED' ELSE N'CANCELLED' END,2+n.rn%12,
       CASE WHEN n.rn%3=0 THEN N'INCREASE' WHEN n.rn%3=2 THEN N'DECREASE' END,N'Korekcija nakon kontrole temperaturnog odstupanja',
       CASE WHEN n.rn%4=1 THEN N'Odobreno posle QA provere' WHEN n.rn%4=2 THEN N'Odbijeno zbog nepotpune dokumentacije' END,0,w.id,NULL,p.id,NULL,NULL,
       (SELECT TOP (1) e.user_id FROM employees e WHERE e.company_id=@CompanyId AND e.primary_warehouse_id=w.id AND e.position=N'WAREHOUSE_MANAGER'),
       CASE WHEN n.rn%4 IN(1,2) THEN (SELECT TOP (1) u.id FROM users u JOIN roles r ON r.id=u.role_id WHERE u.company_id=@CompanyId AND r.name=N'COMPANY_ADMIN') END,NULL,
       DATEADD(DAY,-n.rn,@Now),@Now,CASE WHEN n.rn%4 IN(1,2) THEN DATEADD(DAY,-n.rn+1,@Now) END
FROM n JOIN wr w ON w.rn=((n.rn-1)%4)+1 JOIN pr p ON p.rn=((n.rn-1)%60)+1;

;WITH n AS (SELECT TOP (30) ROW_NUMBER() OVER(ORDER BY (SELECT NULL)) rn FROM sys.all_objects),wr AS (SELECT id,ROW_NUMBER() OVER(ORDER BY id) rn FROM warehouses WHERE company_id=@CompanyId)
INSERT INTO inventory_count_sessions(code,description,status,warehouse_id,created_by_user_id,reviewed_by_user_id,reviewed_at,created_at,updated_at,version)
SELECT CONCAT(N'MCC-IC-',RIGHT(N'000'+CAST(n.rn AS NVARCHAR(3)),3)),N'Ciklični FEFO popis hladne komore',
       CASE n.rn%6 WHEN 0 THEN N'COUNTING' WHEN 1 THEN N'CLOSED' WHEN 2 THEN N'REVIEW' WHEN 3 THEN N'APPROVED' WHEN 4 THEN N'CANCELLED' ELSE N'REJECTED' END,
       w.id,(SELECT TOP (1) id FROM users WHERE company_id=@CompanyId ORDER BY id),
       CASE WHEN n.rn%6 IN(1,2,3,5) THEN (SELECT TOP (1) id FROM users WHERE company_id=@CompanyId ORDER BY id) END,
       CASE WHEN n.rn%6 IN(1,2,3,5) THEN DATEADD(DAY,-n.rn,@Now) END,DATEADD(DAY,-n.rn-2,@Now),@Now,1
FROM n JOIN wr w ON w.rn=((n.rn-1)%4)+1;
;WITH sessions AS (SELECT id,warehouse_id,status,ROW_NUMBER() OVER(ORDER BY code) rn FROM inventory_count_sessions WHERE code LIKE N'MCC-IC-%'),
pr AS (SELECT id,ROW_NUMBER() OVER(ORDER BY id) rn FROM products WHERE company_id=@CompanyId),seq AS (SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8)
INSERT INTO inventory_count_lines(session_id,product_id,system_quantity,counted_quantity,difference_quantity,note,adjustment_movement_id,bin_location_id,version)
SELECT s.id,p.id,wi.quantity,CASE WHEN s.status=N'COUNTING' AND q.n%3=0 THEN NULL WHEN s.status=N'COUNTING' AND q.n%7=0 THEN wi.quantity-1 ELSE wi.quantity END,
       CASE WHEN s.status=N'COUNTING' AND q.n%7=0 THEN -1 ELSE 0 END,CASE WHEN s.status=N'COUNTING' AND q.n%7=0 THEN N'Razlika čeka review i ne menja stanje' ELSE N'Količina i lot potvrđeni' END,
       NULL,(SELECT TOP (1) b.id FROM bin_locations b WHERE b.warehouse_id=s.warehouse_id ORDER BY b.id),0
FROM sessions s CROSS JOIN seq q JOIN pr p ON p.rn=((s.rn+q.n-2)%60)+1 JOIN warehouse_inventory wi ON wi.warehouse_id=s.warehouse_id AND wi.product_id=p.id;

/* Notifications, operational commentary and audit history remain company scoped. */
;WITH n AS (SELECT TOP (180) ROW_NUMBER() OVER(ORDER BY (SELECT NULL)) rn FROM sys.all_objects),ur AS (SELECT id,ROW_NUMBER() OVER(ORDER BY id) rn FROM users WHERE company_id=@CompanyId)
INSERT INTO notifications(title,message,type,severity,status,category,source_type,source_id,dedup_key,escalated_at,created_at,user_id,acknowledged_at,resolved_at,action_label,action_path)
SELECT CONCAT(N'Cold-chain obaveštenje ',n.rn),CASE n.rn%4 WHEN 0 THEN N'Potrebna je provera temperaturnog loggera.' WHEN 1 THEN N'Dodeljen je novi rashladni transport.'
       WHEN 2 THEN N'FEFO popis čeka obradu.' ELSE N'Planiran je servis rashladnog agregata.' END,
       CASE n.rn%4 WHEN 0 THEN N'WARNING' WHEN 1 THEN N'INFO' WHEN 2 THEN N'SUCCESS' ELSE N'ERROR' END,
       CASE n.rn%4 WHEN 0 THEN N'WARNING' WHEN 1 THEN N'INFO' WHEN 2 THEN N'SUCCESS' ELSE N'CRITICAL' END,
       CASE n.rn%4 WHEN 0 THEN N'UNREAD' WHEN 1 THEN N'READ' WHEN 2 THEN N'ACKNOWLEDGED' ELSE N'RESOLVED' END,
       CASE n.rn%3 WHEN 0 THEN N'INVENTORY' WHEN 1 THEN N'TRANSPORT' ELSE N'WAREHOUSE' END,N'SYSTEM',NULL,CONCAT(N'mcc-v45-',n.rn),NULL,
       DATEADD(HOUR,-n.rn,@Now),u.id,CASE WHEN n.rn%4 IN(2,3) THEN DATEADD(MINUTE,-n.rn,@Now) END,CASE WHEN n.rn%4=3 THEN DATEADD(MINUTE,-n.rn+5,@Now) END,NULL,NULL
FROM n JOIN ur u ON u.rn=((n.rn-1)%48)+1;

;WITH n AS (SELECT TOP (80) ROW_NUMBER() OVER(ORDER BY (SELECT NULL)) rn FROM sys.all_objects),ur AS (SELECT id,ROW_NUMBER() OVER(ORDER BY id) rn FROM users WHERE company_id=@CompanyId),tr AS (SELECT id,ROW_NUMBER() OVER(ORDER BY id) rn FROM transport_orders WHERE order_number LIKE N'MCC-TO-%')
INSERT INTO operational_comments(entity_type,entity_id,content,internal_note,company_id,author_id,created_at,updated_at)
SELECT N'TRANSPORT_ORDER',t.id,CASE n.rn%3 WHEN 0 THEN N'Logger je očitan i temperatura je u dozvoljenom opsegu.' WHEN 1 THEN N'Roba je složena po FEFO redosledu.' ELSE N'Prijemni termin potvrđen sa hladnjačom.' END,
       CASE WHEN n.rn%5=0 THEN 1 ELSE 0 END,@CompanyId,u.id,DATEADD(HOUR,-n.rn,@Now),NULL
FROM n JOIN ur u ON u.rn=((n.rn-1)%48)+1 JOIN tr t ON t.rn=((n.rn-1)%120)+1;

;WITH tr AS (SELECT id,order_number,status,created_at,departure_time,actual_arrival_time,created_by_user_id,ROW_NUMBER() OVER(ORDER BY order_number) rn FROM transport_orders WHERE order_number LIKE N'MCC-TO-%')
INSERT INTO domain_events(event_type,entity_type,entity_id,entity_identifier,summary,payload,company_id,created_by_id,created_at)
SELECT N'TRANSPORT_LIFECYCLE',N'TRANSPORT_ORDER',t.id,t.order_number,CONCAT(N'Transport status ',t.status),
       CONCAT(N'{"orderNumber":"',t.order_number,N'","status":"',t.status,N'","seed":"V45"}'),@CompanyId,u.id,
       CASE WHEN t.status=N'DELIVERED' THEN t.actual_arrival_time WHEN t.status IN(N'IN_TRANSIT',N'FAILED') THEN t.departure_time
            WHEN t.status=N'CANCELLED' THEN DATEADD(HOUR,1,t.created_at) ELSE t.created_at END
FROM tr t JOIN users u ON u.id=t.created_by_user_id AND u.company_id=@CompanyId;
;WITH tr AS (SELECT id,order_number,status,created_at,departure_time,actual_arrival_time,created_by_user_id,ROW_NUMBER() OVER(ORDER BY order_number) rn FROM transport_orders WHERE order_number LIKE N'MCC-TO-%')
INSERT INTO activity_logs(action,entity_name,entity_id,entity_identifier,description,created_at,user_id)
SELECT CASE WHEN t.status=N'DRAFT' THEN N'CREATE' ELSE N'STATUS_CHANGE' END,N'TRANSPORT_ORDER',t.id,t.order_number,
       CONCAT(N'Transport ',t.order_number,N' evidentiran u statusu ',t.status),
       CASE WHEN t.status=N'DELIVERED' THEN t.actual_arrival_time WHEN t.status IN(N'IN_TRANSIT',N'FAILED') THEN t.departure_time
            WHEN t.status=N'CANCELLED' THEN DATEADD(HOUR,1,t.created_at) ELSE t.created_at END,u.id
FROM tr t JOIN users u ON u.id=t.created_by_user_id AND u.company_id=@CompanyId;
;WITH tr AS (SELECT id,order_number,status,created_at,departure_time,actual_arrival_time,created_by_user_id,ROW_NUMBER() OVER(ORDER BY order_number) rn FROM transport_orders WHERE order_number LIKE N'MCC-TO-%')
INSERT INTO change_history(entity_name,entity_id,entity_identifier,change_type,field_name,old_value,new_value,changed_at,changed_by_user_id)
SELECT N'TRANSPORT_ORDER',t.id,t.order_number,CASE WHEN t.status=N'DRAFT' THEN N'CREATE' ELSE N'STATUS_CHANGE' END,N'status',
       CASE t.status WHEN N'DELIVERED' THEN N'IN_TRANSIT' WHEN N'FAILED' THEN N'IN_TRANSIT' WHEN N'IN_TRANSIT' THEN N'LOADING'
            WHEN N'ASSIGNED' THEN N'DRAFT' WHEN N'CANCELLED' THEN N'DRAFT' ELSE NULL END,t.status,
       CASE WHEN t.status=N'DELIVERED' THEN t.actual_arrival_time WHEN t.status IN(N'IN_TRANSIT',N'FAILED') THEN t.departure_time
            WHEN t.status=N'CANCELLED' THEN DATEADD(HOUR,1,t.created_at) ELSE t.created_at END,u.id
FROM tr t JOIN users u ON u.id=t.created_by_user_id AND u.company_id=@CompanyId;

/* Fail the migration atomically on any relational, accounting or scheduling inconsistency. */
IF (SELECT COUNT(*) FROM users WHERE company_id=@CompanyId)<>48 OR (SELECT COUNT(*) FROM employees WHERE company_id=@CompanyId)<>48
    THROW 51146,'V45 validation failed: employee population.',1;
IF (SELECT COUNT(*) FROM warehouses WHERE company_id=@CompanyId)<>4 OR (SELECT COUNT(*) FROM products WHERE company_id=@CompanyId)<>60 OR (SELECT COUNT(*) FROM vehicles WHERE company_id=@CompanyId)<>18
    THROW 51147,'V45 validation failed: master data population.',1;
IF EXISTS(SELECT 1 FROM warehouse_inventory wi JOIN warehouses w ON w.id=wi.warehouse_id JOIN products p ON p.id=wi.product_id WHERE w.company_id=@CompanyId AND (p.company_id<>@CompanyId OR wi.quantity<0 OR wi.reserved_quantity<0 OR wi.reserved_quantity>wi.quantity))
    THROW 51148,'V45 validation failed: inventory scope or quantity.',1;
IF EXISTS(SELECT 1 FROM warehouse_inventory wi JOIN warehouses w ON w.id=wi.warehouse_id AND w.company_id=@CompanyId LEFT JOIN bin_locations b ON b.warehouse_id=wi.warehouse_id LEFT JOIN bin_inventory bi ON bi.bin_location_id=b.id AND bi.product_id=wi.product_id GROUP BY wi.warehouse_id,wi.product_id,wi.quantity HAVING wi.quantity<>COALESCE(SUM(bi.quantity),0))
    THROW 51149,'V45 validation failed: warehouse/bin inventory mismatch.',1;
IF EXISTS(SELECT 1 FROM bin_locations b JOIN warehouses w ON w.id=b.warehouse_id AND w.company_id=@CompanyId LEFT JOIN bin_inventory bi ON bi.bin_location_id=b.id GROUP BY b.id,b.capacity HAVING COALESCE(SUM(bi.quantity),0)>b.capacity)
    THROW 51158,'V45 validation failed: bin capacity exceeded.',1;
IF EXISTS(SELECT 1 FROM warehouses w JOIN warehouse_inventory wi ON wi.warehouse_id=w.id WHERE w.company_id=@CompanyId GROUP BY w.id,w.capacity HAVING SUM(wi.quantity)>w.capacity)
    THROW 51162,'V45 validation failed: warehouse capacity exceeded.',1;
IF EXISTS(SELECT 1 FROM transport_orders t JOIN warehouses sw ON sw.id=t.source_warehouse_id JOIN warehouses dw ON dw.id=t.destination_warehouse_id JOIN vehicles v ON v.id=t.vehicle_id JOIN employees e ON e.id=t.assigned_employee_id JOIN users u ON u.id=t.created_by_user_id WHERE t.order_number LIKE N'MCC-TO-%' AND (sw.company_id<>@CompanyId OR dw.company_id<>@CompanyId OR v.company_id<>@CompanyId OR e.company_id<>@CompanyId OR u.company_id<>@CompanyId))
    THROW 51150,'V45 validation failed: cross-company transport link.',1;
IF EXISTS(SELECT 1 FROM tasks t JOIN employees e ON e.id=t.assigned_employee_id JOIN transport_orders o ON o.id=t.transport_order_id JOIN warehouses w ON w.id=o.source_warehouse_id WHERE w.company_id=@CompanyId AND e.company_id<>@CompanyId)
    THROW 51151,'V45 validation failed: cross-company task link.',1;
IF EXISTS(SELECT 1 FROM tasks task JOIN transport_orders t ON t.id=task.transport_order_id JOIN warehouses w ON w.id=t.source_warehouse_id AND w.company_id=@CompanyId JOIN employees e ON e.id=task.assigned_employee_id WHERE (task.task_type=N'DRIVING' AND task.assigned_employee_id<>t.assigned_employee_id) OR (task.task_type IN(N'PICKING',N'LOADING') AND e.primary_warehouse_id<>t.source_warehouse_id))
    THROW 51163,'V45 validation failed: task assignee does not match transport context.',1;
IF EXISTS(SELECT 1 FROM vehicle_maintenance m JOIN vehicles v ON v.id=m.vehicle_id WHERE m.company_id=@CompanyId AND v.company_id<>@CompanyId)
    THROW 51152,'V45 validation failed: cross-company maintenance link.',1;
IF EXISTS(SELECT 1 FROM employee_warehouse_assignments a JOIN employees e ON e.id=a.employee_id JOIN warehouses w ON w.id=a.warehouse_id WHERE a.company_id=@CompanyId AND (e.company_id<>@CompanyId OR w.company_id<>@CompanyId))
    THROW 51159,'V45 validation failed: cross-company warehouse assignment.',1;
IF EXISTS(SELECT 1 FROM transport_orders a JOIN transport_orders b ON b.vehicle_id=a.vehicle_id AND b.id>a.id AND a.departure_time<b.planned_arrival_time AND b.departure_time<a.planned_arrival_time JOIN warehouses w ON w.id=a.source_warehouse_id AND w.company_id=@CompanyId WHERE a.status IN(N'ASSIGNED',N'PICKING',N'PACKING',N'READY_FOR_LOADING',N'LOADING',N'IN_TRANSIT',N'RETURNING',N'RESCHEDULED') AND b.status IN(N'ASSIGNED',N'PICKING',N'PACKING',N'READY_FOR_LOADING',N'LOADING',N'IN_TRANSIT',N'RETURNING',N'RESCHEDULED'))
    THROW 51153,'V45 validation failed: overlapping vehicle transports.',1;
IF EXISTS(SELECT 1 FROM transport_orders a JOIN transport_orders b ON b.assigned_employee_id=a.assigned_employee_id AND b.id>a.id AND a.departure_time<b.planned_arrival_time AND b.departure_time<a.planned_arrival_time JOIN warehouses w ON w.id=a.source_warehouse_id AND w.company_id=@CompanyId WHERE a.status IN(N'ASSIGNED',N'PICKING',N'PACKING',N'READY_FOR_LOADING',N'LOADING',N'IN_TRANSIT',N'RETURNING',N'RESCHEDULED') AND b.status IN(N'ASSIGNED',N'PICKING',N'PACKING',N'READY_FOR_LOADING',N'LOADING',N'IN_TRANSIT',N'RETURNING',N'RESCHEDULED'))
    THROW 51154,'V45 validation failed: overlapping driver transports.',1;
IF EXISTS(SELECT 1 FROM shifts a JOIN employees e ON e.id=a.employee_id AND e.company_id=@CompanyId JOIN shifts b ON b.employee_id=a.employee_id AND b.id>a.id AND a.start_time<b.end_time AND b.start_time<a.end_time WHERE a.status<>N'CANCELLED' AND b.status<>N'CANCELLED')
    THROW 51155,'V45 validation failed: overlapping shifts.',1;
IF EXISTS(SELECT 1 FROM transport_orders t JOIN warehouses w ON w.id=t.source_warehouse_id AND w.company_id=@CompanyId WHERE (t.status=N'DELIVERED' AND (t.departure_time IS NULL OR t.actual_arrival_time IS NULL OR t.actual_arrival_time<t.departure_time OR t.actual_arrival_time>@Now)) OR (t.status<>N'DELIVERED' AND t.actual_arrival_time IS NOT NULL))
    THROW 51156,'V45 validation failed: transport temporal lifecycle.',1;
IF EXISTS(SELECT 1 FROM transport_orders t JOIN warehouses w ON w.id=t.source_warehouse_id AND w.company_id=@CompanyId WHERE t.status NOT IN(N'CANCELLED',N'DRAFT') AND NOT EXISTS(SELECT 1 FROM shifts s WHERE s.employee_id=t.assigned_employee_id AND s.status<>N'CANCELLED' AND s.start_time<=t.departure_time AND s.end_time>=t.planned_arrival_time))
    THROW 51164,'V45 validation failed: driver shift does not cover transport.',1;
IF EXISTS(SELECT 1 FROM stock_movements m JOIN warehouses w ON w.id=m.warehouse_id AND w.company_id=@CompanyId WHERE m.quantity<0 OR m.quantity_before<0 OR m.quantity_after<0 OR m.available_before<0 OR m.available_after<0)
    THROW 51157,'V45 validation failed: negative movement ledger value.',1;
IF EXISTS(
    SELECT 1 FROM warehouse_inventory wi JOIN warehouses w ON w.id=wi.warehouse_id AND w.company_id=@CompanyId
    CROSS APPLY(SELECT TOP (1) m.quantity_after,m.reserved_after,m.available_after FROM stock_movements m WHERE m.warehouse_id=wi.warehouse_id AND m.product_id=wi.product_id AND m.status=N'EXECUTED' ORDER BY m.created_at DESC,m.id DESC) last_movement
    WHERE last_movement.quantity_after<>wi.quantity OR last_movement.reserved_after<>wi.reserved_quantity OR last_movement.available_after<>wi.quantity-wi.reserved_quantity
)
    THROW 51160,'V45 validation failed: movement ledger does not reconcile to current inventory.',1;
IF EXISTS(SELECT 1 FROM warehouse_inventory wi JOIN warehouses w ON w.id=wi.warehouse_id AND w.company_id=@CompanyId CROSS APPLY(SELECT SUM(CASE m.movement_type WHEN N'INBOUND' THEN m.quantity WHEN N'TRANSFER_IN' THEN m.quantity WHEN N'TRANSFER_OUT' THEN -m.quantity ELSE 0 END) ledger_quantity FROM stock_movements m WHERE m.warehouse_id=wi.warehouse_id AND m.product_id=wi.product_id AND m.status=N'EXECUTED' AND m.movement_type<>N'RESERVATION') x WHERE x.ledger_quantity<>wi.quantity)
    THROW 51165,'V45 validation failed: reconstructed movement arithmetic differs from current inventory.',1;
IF EXISTS(SELECT 1 FROM transport_order_items i JOIN transport_orders t ON t.id=i.transport_order_id JOIN warehouses w ON w.id=t.source_warehouse_id AND w.company_id=@CompanyId WHERE t.status=N'DELIVERED' AND ((SELECT COUNT(*) FROM stock_movements m WHERE m.transport_order_id=t.id AND m.product_id=i.product_id AND m.status=N'EXECUTED' AND m.movement_type IN(N'TRANSFER_OUT',N'TRANSFER_IN'))<>2))
    THROW 51166,'V45 validation failed: delivered item does not have both transfer ledger sides.',1;
IF (SELECT COALESCE(SUM(CASE WHEN m.movement_type=N'TRANSFER_IN' THEN m.quantity WHEN m.movement_type=N'TRANSFER_OUT' THEN -m.quantity ELSE 0 END),0) FROM stock_movements m JOIN warehouses w ON w.id=m.warehouse_id WHERE w.company_id=@CompanyId AND m.transport_order_id IS NOT NULL)<>0
    THROW 51167,'V45 validation failed: internal transports changed total company stock.',1;
IF EXISTS(
    SELECT 1
    FROM bin_inventory bi
    JOIN bin_locations b ON b.id=bi.bin_location_id
    JOIN warehouses w ON w.id=b.warehouse_id AND w.company_id=@CompanyId
    LEFT JOIN (
        SELECT movement_effects.bin_id,movement_effects.product_id,
               SUM(movement_effects.moved_out) moved_out,
               SUM(movement_effects.moved_in) moved_in
        FROM (
            SELECT im.source_bin_id bin_id,im.product_id,im.quantity moved_out,CAST(0 AS DECIMAL(12,2)) moved_in
            FROM internal_warehouse_movements im
            WHERE im.status=N'COMPLETED'
            UNION ALL
            SELECT im.destination_bin_id,im.product_id,CAST(0 AS DECIMAL(12,2)),im.quantity
            FROM internal_warehouse_movements im
            WHERE im.status=N'COMPLETED'
        ) movement_effects
        GROUP BY movement_effects.bin_id,movement_effects.product_id
    ) x ON x.bin_id=b.id AND x.product_id=bi.product_id
    WHERE bi.quantity+COALESCE(x.moved_out,0)-COALESCE(x.moved_in,0)<0
)
    THROW 51168,'V45 validation failed: internal movement history implies negative opening bin stock.',1;
IF EXISTS(
    SELECT 1 FROM vehicle_maintenance m JOIN vehicles v ON v.id=m.vehicle_id AND v.company_id=@CompanyId
    JOIN transport_orders t ON t.vehicle_id=v.id JOIN warehouses w ON w.id=t.source_warehouse_id AND w.company_id=@CompanyId
    WHERE m.status IN(N'PLANNED',N'IN_PROGRESS')
      AND t.status IN(N'ASSIGNED',N'PICKING',N'PACKING',N'READY_FOR_LOADING',N'LOADING',N'IN_TRANSIT',N'RETURNING',N'RESCHEDULED')
      AND m.scheduled_at<t.planned_arrival_time
)
    THROW 51161,'V45 validation failed: maintenance conflicts with an active transport before its planned end.',1;
IF EXISTS(SELECT 1 FROM vehicle_maintenance m JOIN vehicles v ON v.id=m.vehicle_id AND v.company_id=@CompanyId JOIN transport_orders t ON t.vehicle_id=v.id JOIN warehouses w ON w.id=t.source_warehouse_id AND w.company_id=@CompanyId WHERE m.status=N'COMPLETED' AND t.departure_time<m.completed_at AND COALESCE(t.actual_arrival_time,t.planned_arrival_time)>m.started_at)
    THROW 51169,'V45 validation failed: historical maintenance overlaps effective transport interval.',1;
IF EXISTS(SELECT 1 FROM transport_orders t JOIN vehicles v ON v.id=t.vehicle_id JOIN warehouses w ON w.id=t.source_warehouse_id AND w.company_id=@CompanyId JOIN (SELECT transport_order_id,SUM(weight) total_weight FROM transport_order_items GROUP BY transport_order_id) x ON x.transport_order_id=t.id WHERE x.total_weight>v.max_weight OR t.total_weight<>x.total_weight)
    THROW 51170,'V45 validation failed: transport exceeds vehicle payload or total weight differs.',1;
IF EXISTS(SELECT 1 FROM domain_events d WHERE d.company_id=@CompanyId AND d.entity_type=N'TRANSPORT_ORDER' AND NOT EXISTS(SELECT 1 FROM transport_orders t WHERE t.id=d.entity_id AND t.order_number=d.entity_identifier))
 OR EXISTS(SELECT 1 FROM change_history h JOIN users u ON u.id=h.changed_by_user_id WHERE u.company_id=@CompanyId AND h.entity_name=N'TRANSPORT_ORDER' AND NOT EXISTS(SELECT 1 FROM transport_orders t WHERE t.id=h.entity_id AND t.order_number=h.entity_identifier))
 OR EXISTS(SELECT 1 FROM activity_logs a JOIN users u ON u.id=a.user_id WHERE u.company_id=@CompanyId AND a.entity_name=N'TRANSPORT_ORDER' AND NOT EXISTS(SELECT 1 FROM transport_orders t WHERE t.id=a.entity_id AND t.order_number=a.entity_identifier))
    THROW 51171,'V45 validation failed: orphan audit or domain event reference.',1;

/* Final-schema and backend-workflow validation matrix. Child scope follows real FK chains. */
/*
 * Diagnostic projections for the three independent invariants below:
 * SELECT t.id,t.order_number,t.status,t.source_warehouse_id,t.destination_warehouse_id,
 *        t.assigned_employee_id,CONCAT(e.first_name,N' ',e.last_name) employee_name,
 *        e.position employee_position,r.name employee_role,e.company_id employee_company_id,e.active employee_active,
 *        t.vehicle_id,v.company_id vehicle_company_id,v.active vehicle_active,
 *        N'Invalid or inactive driver/vehicle assignment' violation_reason
 * FROM transport_orders t LEFT JOIN employees e ON e.id=t.assigned_employee_id
 * LEFT JOIN users u ON u.id=e.user_id LEFT JOIN roles r ON r.id=u.role_id
 * LEFT JOIN vehicles v ON v.id=t.vehicle_id WHERE t.order_number LIKE N'MCC-TO-%'
 * AND (e.id IS NULL OR v.id IS NULL OR e.active=0 OR e.position<>N'DRIVER' OR v.active=0);
 *
 * SELECT t.id,t.order_number,t.status,t.source_warehouse_id,sw.company_id source_company_id,
 *        t.destination_warehouse_id,dw.company_id destination_company_id,
 *        e.company_id employee_company_id,v.company_id vehicle_company_id,
 *        N'Cross-company, same-warehouse, or unavailable warehouse link' violation_reason
 * FROM transport_orders t LEFT JOIN warehouses sw ON sw.id=t.source_warehouse_id
 * LEFT JOIN warehouses dw ON dw.id=t.destination_warehouse_id
 * LEFT JOIN employees e ON e.id=t.assigned_employee_id LEFT JOIN vehicles v ON v.id=t.vehicle_id
 * WHERE t.order_number LIKE N'MCC-TO-%' AND
 *   (sw.id IS NULL OR dw.id IS NULL OR sw.id=dw.id OR sw.company_id<>@CompanyId
 *    OR dw.company_id<>@CompanyId OR e.company_id<>@CompanyId OR v.company_id<>@CompanyId
 *    OR sw.active=0 OR sw.status<>N'ACTIVE' OR dw.active=0 OR dw.status<>N'ACTIVE');
 *
 * SELECT t.id,t.order_number,t.status,t.departure_time transport_start,
 *        COALESCE(t.actual_arrival_time,t.planned_arrival_time) effective_end,
 *        s.id shift_id,s.start_time shift_start,s.end_time shift_end,s.status shift_status,
 *        N'Invalid planned/actual transport interval' violation_reason
 * FROM transport_orders t LEFT JOIN shifts s ON s.employee_id=t.assigned_employee_id
 *   AND s.status<>N'CANCELLED' AND s.start_time<=t.departure_time
 *   AND s.end_time>=t.planned_arrival_time
 * WHERE t.order_number LIKE N'MCC-TO-%' AND
 *   (t.departure_time IS NULL OR t.planned_arrival_time IS NULL
 *    OR t.departure_time>=t.planned_arrival_time
 *    OR (t.actual_arrival_time IS NOT NULL AND t.actual_arrival_time<t.departure_time));
 */
IF EXISTS(
    SELECT 1 FROM transport_orders t
    LEFT JOIN employees e ON e.id=t.assigned_employee_id
    LEFT JOIN vehicles v ON v.id=t.vehicle_id
    WHERE t.order_number LIKE N'MCC-TO-%'
      AND (e.id IS NULL OR v.id IS NULL OR e.active=0 OR e.position<>N'DRIVER' OR v.active=0)
)
    THROW 51172,'V45 validation failed: transport has an invalid driver or vehicle assignment.',1;

IF EXISTS(
    SELECT 1 FROM transport_orders t
    LEFT JOIN warehouses sw ON sw.id=t.source_warehouse_id
    LEFT JOIN warehouses dw ON dw.id=t.destination_warehouse_id
    LEFT JOIN employees e ON e.id=t.assigned_employee_id
    LEFT JOIN vehicles v ON v.id=t.vehicle_id
    WHERE t.order_number LIKE N'MCC-TO-%'
      AND (sw.id IS NULL OR dw.id IS NULL OR sw.id=dw.id
           OR sw.company_id<>@CompanyId OR dw.company_id<>@CompanyId
           OR e.company_id<>@CompanyId OR v.company_id<>@CompanyId
           OR sw.active=0 OR sw.status<>N'ACTIVE' OR dw.active=0 OR dw.status<>N'ACTIVE')
)
    THROW 51189,'V45 validation failed: transport has a cross-company or unavailable warehouse/resource link.',1;

IF EXISTS(
    SELECT 1 FROM transport_orders t
    JOIN warehouses sw ON sw.id=t.source_warehouse_id AND sw.company_id=@CompanyId
    WHERE t.order_number LIKE N'MCC-TO-%'
      AND (t.departure_time IS NULL OR t.planned_arrival_time IS NULL OR t.departure_time>=t.planned_arrival_time
           OR (t.actual_arrival_time IS NOT NULL AND t.actual_arrival_time<t.departure_time))
)
    THROW 51190,'V45 validation failed: transport has an invalid planned or actual schedule interval.',1;

IF EXISTS(
    SELECT 1 FROM transport_orders t
    JOIN warehouses w ON w.id=t.source_warehouse_id AND w.company_id=@CompanyId
    LEFT JOIN transport_order_items i ON i.transport_order_id=t.id
    WHERE t.order_number LIKE N'MCC-TO-%'
    GROUP BY t.id,t.status,t.departure_time,t.actual_arrival_time
    HAVING COUNT(i.id)=0
       OR SUM(CASE WHEN i.quantity<=0 OR i.reserved_quantity<0 OR i.dispatched_quantity<0 OR i.delivered_quantity<0
                        OR i.reserved_quantity>i.quantity OR i.dispatched_quantity>i.quantity OR i.delivered_quantity>i.quantity THEN 1 ELSE 0 END)>0
       OR (t.status IN(N'ASSIGNED',N'PICKING',N'PACKING',N'READY_FOR_LOADING',N'LOADING',N'RESCHEDULED')
           AND SUM(CASE WHEN i.reserved_quantity=i.quantity AND i.dispatched_quantity=0 AND i.delivered_quantity=0 THEN 0 ELSE 1 END)>0)
       OR (t.status IN(N'IN_TRANSIT',N'RETURNING')
           AND SUM(CASE WHEN i.reserved_quantity=0 AND i.dispatched_quantity=i.quantity AND i.delivered_quantity=0 THEN 0 ELSE 1 END)>0)
       OR (t.status=N'DELIVERED'
           AND (t.departure_time IS NULL OR t.actual_arrival_time IS NULL
                OR SUM(CASE WHEN i.reserved_quantity=0 AND i.dispatched_quantity=i.quantity AND i.delivered_quantity=i.quantity THEN 0 ELSE 1 END)>0))
       OR (t.status=N'FAILED'
           AND SUM(CASE WHEN i.reserved_quantity=0 AND i.dispatched_quantity=0 AND i.delivered_quantity=0 THEN 0 ELSE 1 END)>0)
       OR (t.status=N'CANCELLED' AND SUM(CASE WHEN i.reserved_quantity=0 THEN 0 ELSE 1 END)>0)
)
    THROW 51173,'V45 validation failed: transport item lifecycle quantities.',1;

IF EXISTS(
    SELECT 1 FROM vehicles v
    WHERE v.company_id=@CompanyId AND (
        (EXISTS(SELECT 1 FROM transport_orders t WHERE t.vehicle_id=v.id AND t.status IN(N'IN_TRANSIT',N'RETURNING')) AND v.status<>N'IN_USE')
        OR (NOT EXISTS(SELECT 1 FROM transport_orders t WHERE t.vehicle_id=v.id AND t.status IN(N'IN_TRANSIT',N'RETURNING'))
            AND EXISTS(SELECT 1 FROM transport_orders t WHERE t.vehicle_id=v.id AND t.status IN(N'ASSIGNED',N'PICKING',N'PACKING',N'READY_FOR_LOADING',N'LOADING',N'RESCHEDULED')) AND v.status<>N'RESERVED')
        OR (NOT EXISTS(SELECT 1 FROM transport_orders t WHERE t.vehicle_id=v.id AND t.status IN(N'ASSIGNED',N'PICKING',N'PACKING',N'READY_FOR_LOADING',N'LOADING',N'IN_TRANSIT',N'RETURNING',N'RESCHEDULED'))
            AND NOT EXISTS(SELECT 1 FROM vehicle_maintenance m WHERE m.vehicle_id=v.id AND m.status=N'IN_PROGRESS') AND v.status<>N'AVAILABLE')
        OR (EXISTS(SELECT 1 FROM vehicle_maintenance m WHERE m.vehicle_id=v.id AND m.status=N'IN_PROGRESS') AND v.status<>N'MAINTENANCE')
    )
)
    THROW 51174,'V45 validation failed: vehicle current status differs from workflow state.',1;

IF EXISTS(
    SELECT 1 FROM tasks task
    JOIN transport_orders t ON t.id=task.transport_order_id
    JOIN warehouses sw ON sw.id=t.source_warehouse_id AND sw.company_id=@CompanyId
    JOIN employees e ON e.id=task.assigned_employee_id
    WHERE e.company_id<>@CompanyId
       OR task.task_type NOT IN(N'PICKING',N'PACKING',N'LOADING',N'DRIVING',N'UNLOADING',N'COUNTING',N'MAINTENANCE',N'ADMIN',N'STOCK_MOVEMENT')
       OR task.status NOT IN(N'NEW',N'OPEN',N'ASSIGNED',N'IN_PROGRESS',N'BLOCKED',N'COMPLETED',N'CANCELLED')
       OR (task.task_type=N'DRIVING' AND (e.position<>N'DRIVER' OR task.assigned_employee_id<>t.assigned_employee_id))
       OR (task.task_type IN(N'PICKING',N'LOADING') AND (e.position<>N'WORKER' OR e.primary_warehouse_id<>t.source_warehouse_id))
       OR (task.status=N'COMPLETED' AND (task.started_at IS NULL OR task.completed_at IS NULL OR task.completed_at<task.started_at))
       OR (task.status=N'CANCELLED' AND task.cancelled_at IS NULL)
       OR (task.status NOT IN(N'COMPLETED',N'CANCELLED') AND (task.completed_at IS NOT NULL OR task.cancelled_at IS NOT NULL))
)
    THROW 51175,'V45 validation failed: task type, assignee, status, or timestamps.',1;

IF EXISTS(
    SELECT 1 FROM shifts s JOIN employees e ON e.id=s.employee_id JOIN warehouses w ON w.id=s.warehouse_id
    WHERE e.company_id=@CompanyId AND (w.company_id<>@CompanyId OR s.start_time>=s.end_time
       OR s.status NOT IN(N'PLANNED',N'ACTIVE',N'FINISHED',N'CANCELLED')
       OR (s.status=N'PLANNED' AND s.start_time<=@Now)
       OR (s.status=N'ACTIVE' AND NOT(s.start_time<=@Now AND s.end_time>@Now))
       OR (s.status=N'FINISHED' AND s.end_time>@Now))
)
    THROW 51176,'V45 validation failed: shift scope, interval, or current status.',1;

IF EXISTS(
    SELECT 1 FROM vehicle_maintenance m JOIN vehicles v ON v.id=m.vehicle_id
    WHERE m.company_id=@CompanyId AND (v.company_id<>@CompanyId OR m.status NOT IN(N'PLANNED',N'IN_PROGRESS',N'COMPLETED',N'CANCELLED')
       OR (m.status=N'PLANNED' AND (m.started_at IS NOT NULL OR m.completed_at IS NOT NULL OR m.cancelled_at IS NOT NULL))
       OR (m.status=N'IN_PROGRESS' AND (m.started_at IS NULL OR m.completed_at IS NOT NULL OR m.cancelled_at IS NOT NULL))
       OR (m.status=N'COMPLETED' AND (m.started_at IS NULL OR m.completed_at IS NULL OR m.completed_at<m.started_at OR m.completed_at>@Now))
       OR (m.status=N'CANCELLED' AND m.cancelled_at IS NULL))
)
    THROW 51177,'V45 validation failed: maintenance lifecycle or company scope.',1;

IF EXISTS(
    SELECT 1 FROM stock_movements m
    JOIN warehouses w ON w.id=m.warehouse_id
    JOIN products p ON p.id=m.product_id
    JOIN users u ON u.id=m.created_by_user_id
    WHERE w.company_id=@CompanyId AND (p.company_id<>@CompanyId OR u.company_id<>@CompanyId
       OR m.status NOT IN(N'DRAFT',N'PENDING_APPROVAL',N'APPROVED',N'EXECUTED',N'REJECTED',N'CANCELLED',N'REVERSED')
       OR m.movement_type NOT IN(N'INBOUND',N'OUTBOUND',N'TRANSFER_IN',N'TRANSFER_OUT',N'ADJUSTMENT',N'WRITE_OFF',N'RETURN_IN',N'RETURN_OUT',N'RESERVATION',N'RESERVATION_RELEASE')
       OR m.quantity<=0 OR m.available_before<>m.quantity_before-m.reserved_before OR m.available_after<>m.quantity_after-m.reserved_after
       OR m.expected_quantity<0 OR m.actual_quantity<0 OR m.discrepancy_quantity<>m.actual_quantity-m.expected_quantity
       OR (m.transport_order_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM transport_orders t WHERE t.id=m.transport_order_id AND t.source_warehouse_id IN(SELECT mw.id FROM warehouses mw WHERE mw.company_id=@CompanyId)))
       OR (m.source_bin_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM bin_locations b WHERE b.id=m.source_bin_id AND b.warehouse_id=m.warehouse_id))
       OR (m.destination_bin_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM bin_locations b WHERE b.id=m.destination_bin_id AND b.warehouse_id=m.warehouse_id)))
)
    THROW 51178,'V45 validation failed: stock movement scope, type, or arithmetic.',1;

IF EXISTS(
    SELECT 1 FROM stock_movement_requests r
    JOIN warehouses w ON w.id=r.warehouse_id
    JOIN products p ON p.id=r.product_id
    JOIN users requester ON requester.id=r.requested_by_user_id
    LEFT JOIN users reviewer ON reviewer.id=r.reviewed_by_user_id
    WHERE w.company_id=@CompanyId AND (p.company_id<>@CompanyId OR requester.company_id<>@CompanyId
       OR (reviewer.id IS NOT NULL AND reviewer.company_id<>@CompanyId)
       OR r.status NOT IN(N'REQUESTED',N'APPROVED',N'REJECTED',N'CANCELLED')
       OR r.quantity<=0 OR r.created_at>r.updated_at
       OR (r.status IN(N'APPROVED',N'REJECTED') AND (r.reviewed_by_user_id IS NULL OR r.reviewed_at IS NULL OR r.reviewed_at<r.created_at))
       OR (r.status IN(N'REQUESTED',N'CANCELLED') AND (r.reviewed_by_user_id IS NOT NULL OR r.reviewed_at IS NOT NULL)))
)
    THROW 51179,'V45 validation failed: stock movement request lifecycle or scope.',1;

IF EXISTS(
    SELECT 1 FROM internal_warehouse_movements im
    JOIN warehouses w ON w.id=im.warehouse_id
    JOIN products p ON p.id=im.product_id
    JOIN bin_locations sb ON sb.id=im.source_bin_id
    JOIN bin_locations db ON db.id=im.destination_bin_id
    JOIN users u ON u.id=im.created_by_id
    WHERE w.company_id=@CompanyId AND (p.company_id<>@CompanyId OR u.company_id<>@CompanyId OR im.quantity<=0
       OR im.source_bin_id=im.destination_bin_id OR sb.warehouse_id<>im.warehouse_id OR db.warehouse_id<>im.warehouse_id
       OR im.status NOT IN(N'COMPLETED',N'CANCELLED'))
)
    THROW 51180,'V45 validation failed: internal warehouse movement scope or structure.',1;

IF EXISTS(
    SELECT 1 FROM inventory_count_sessions s
    JOIN warehouses w ON w.id=s.warehouse_id
    JOIN users creator ON creator.id=s.created_by_user_id
    LEFT JOIN users reviewer ON reviewer.id=s.reviewed_by_user_id
    WHERE w.company_id=@CompanyId AND (creator.company_id<>@CompanyId OR (reviewer.id IS NOT NULL AND reviewer.company_id<>@CompanyId)
       OR s.status NOT IN(N'DRAFT',N'OPEN',N'COUNTING',N'REVIEW',N'APPROVED',N'ADJUSTMENTS_CREATED',N'CLOSED',N'REJECTED',N'CANCELLED')
       OR s.created_at>s.updated_at
       OR (s.status IN(N'REVIEW',N'APPROVED',N'ADJUSTMENTS_CREATED',N'CLOSED',N'REJECTED') AND (s.reviewed_by_user_id IS NULL OR s.reviewed_at IS NULL OR s.reviewed_at<s.created_at)))
)
OR EXISTS(
    SELECT 1 FROM inventory_count_lines l
    JOIN inventory_count_sessions s ON s.id=l.session_id
    JOIN warehouses w ON w.id=s.warehouse_id AND w.company_id=@CompanyId
    JOIN products p ON p.id=l.product_id
    LEFT JOIN bin_locations b ON b.id=l.bin_location_id
    WHERE p.company_id<>@CompanyId OR (b.id IS NOT NULL AND b.warehouse_id<>s.warehouse_id)
       OR l.system_quantity<0 OR l.counted_quantity<0
       OR (l.counted_quantity IS NOT NULL AND l.difference_quantity<>l.counted_quantity-l.system_quantity)
       OR (s.status<>N'COUNTING' AND l.counted_quantity IS NULL)
)
    THROW 51181,'V45 validation failed: inventory count lifecycle, arithmetic, or scope.',1;

IF EXISTS(
    SELECT 1 FROM notifications n JOIN users u ON u.id=n.user_id
    WHERE u.company_id=@CompanyId AND (n.status NOT IN(N'UNREAD',N'READ',N'ACKNOWLEDGED',N'RESOLVED')
       OR n.created_at>@Now OR n.acknowledged_at<n.created_at OR n.resolved_at<n.created_at
       OR (n.status=N'ACKNOWLEDGED' AND n.acknowledged_at IS NULL)
       OR (n.status=N'RESOLVED' AND (n.acknowledged_at IS NULL OR n.resolved_at IS NULL OR n.resolved_at<n.acknowledged_at)))
)
    THROW 51182,'V45 validation failed: notification lifecycle or timestamps.',1;

IF EXISTS(
    SELECT 1 FROM operational_comments c JOIN users u ON u.id=c.author_id
    WHERE c.company_id=@CompanyId AND (u.company_id<>@CompanyId OR c.entity_type<>N'TRANSPORT_ORDER'
       OR NOT EXISTS(SELECT 1 FROM transport_orders t JOIN warehouses w ON w.id=t.source_warehouse_id AND w.company_id=@CompanyId WHERE t.id=c.entity_id))
)
    THROW 51183,'V45 validation failed: operational comment scope or entity reference.',1;

IF EXISTS(
    SELECT 1 FROM domain_events d JOIN users u ON u.id=d.created_by_id
    WHERE d.company_id=@CompanyId AND (u.company_id<>@CompanyId OR d.event_type<>N'TRANSPORT_LIFECYCLE'
       OR d.entity_type<>N'TRANSPORT_ORDER' OR d.created_at>@Now OR ISJSON(d.payload)<>1
       OR NOT EXISTS(SELECT 1 FROM transport_orders t WHERE t.id=d.entity_id AND t.order_number=d.entity_identifier))
)
    THROW 51184,'V45 validation failed: domain event type, payload, scope, or timestamp.',1;

IF EXISTS(
    SELECT transport_order_id,product_id
    FROM stock_movements m JOIN warehouses w ON w.id=m.warehouse_id
    WHERE w.company_id=@CompanyId AND m.transport_order_id IS NOT NULL AND m.status=N'EXECUTED'
      AND m.movement_type IN(N'TRANSFER_OUT',N'TRANSFER_IN')
    GROUP BY transport_order_id,product_id
    HAVING SUM(CASE WHEN m.movement_type=N'TRANSFER_IN' THEN m.quantity ELSE -m.quantity END)<>0
       OR SUM(CASE WHEN m.movement_type=N'TRANSFER_OUT' THEN 1 ELSE 0 END)<>1
       OR SUM(CASE WHEN m.movement_type=N'TRANSFER_IN' THEN 1 ELSE 0 END)<>1
)
    THROW 51185,'V45 validation failed: transport stock is not conserved per order item.',1;

IF EXISTS(
    SELECT 1 FROM warehouse_zones z JOIN warehouses w ON w.id=z.warehouse_id
    WHERE w.company_id=@CompanyId AND (z.warehouse_id<>w.id OR z.active=0)
)
OR EXISTS(
    SELECT 1 FROM bin_locations b JOIN warehouses w ON w.id=b.warehouse_id JOIN warehouse_zones z ON z.id=b.zone_id
    WHERE w.company_id=@CompanyId AND (z.warehouse_id<>b.warehouse_id OR b.active=0)
)
OR EXISTS(
    SELECT 1 FROM bin_inventory bi JOIN bin_locations b ON b.id=bi.bin_location_id JOIN warehouses w ON w.id=b.warehouse_id JOIN products p ON p.id=bi.product_id
    WHERE w.company_id=@CompanyId AND (p.company_id<>@CompanyId OR bi.quantity<0)
)
OR EXISTS(
    SELECT 1 FROM transport_order_items i JOIN transport_orders t ON t.id=i.transport_order_id JOIN warehouses w ON w.id=t.source_warehouse_id JOIN products p ON p.id=i.product_id
    WHERE w.company_id=@CompanyId AND p.company_id<>@CompanyId
)
OR EXISTS(
    SELECT 1 FROM employees e JOIN users u ON u.id=e.user_id
    WHERE e.company_id=@CompanyId AND u.company_id<>@CompanyId
)
OR EXISTS(
    SELECT 1 FROM warehouses w JOIN employees manager ON manager.id=w.manager_id
    WHERE w.company_id=@CompanyId AND (manager.company_id<>@CompanyId OR manager.position<>N'WAREHOUSE_MANAGER')
)
    THROW 51186,'V45 validation failed: master or child entity company scope.',1;

IF EXISTS(
    SELECT 1 FROM activity_logs a JOIN users u ON u.id=a.user_id
    WHERE u.company_id=@CompanyId AND (a.entity_name<>N'TRANSPORT_ORDER' OR a.created_at>@Now
       OR NOT EXISTS(SELECT 1 FROM transport_orders t WHERE t.id=a.entity_id AND t.order_number=a.entity_identifier))
)
OR EXISTS(
    SELECT 1 FROM change_history h JOIN users u ON u.id=h.changed_by_user_id
    WHERE u.company_id=@CompanyId AND (h.entity_name<>N'TRANSPORT_ORDER' OR h.changed_at>@Now
       OR h.field_name<>N'status'
       OR NOT EXISTS(SELECT 1 FROM transport_orders t WHERE t.id=h.entity_id AND t.order_number=h.entity_identifier AND t.status=h.new_value))
)
    THROW 51187,'V45 validation failed: activity or change-history actor, timestamp, or entity reference.',1;

IF EXISTS(
    SELECT n.dedup_key FROM notifications n JOIN users u ON u.id=n.user_id
    WHERE u.company_id=@CompanyId AND n.dedup_key IS NOT NULL
    GROUP BY n.dedup_key HAVING COUNT(*)>1
)
    THROW 51188,'V45 validation failed: duplicate notification deduplication key.',1;

COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
