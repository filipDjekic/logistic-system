SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @pwd NVARCHAR(255) = '$2a$10$NBqZSKuQWFxDQx5taxDczuSxfo/mwhAzngiVOPnpVAKr0RskxtaSG';
DECLARE @now DATETIME2 = SYSUTCDATETIME();

/*
    Demo company seed for Adriatrans Logistics DOO.
    Login password for all demo users: Admin123!
*/

SET IDENTITY_INSERT companies ON;
INSERT INTO companies (
    id, name, active, country_id, phone_code, timezone_id, address, city_id, postal_code,
    phone_number, email, tax_number, registration_number, created_at, updated_at
) VALUES
(1, 'Adriatrans Logistics DOO', 1, 1, '+381', 1, 'Bulevar Evrope 12', 2, '21000', '214240100', 'office@adriatrans.rs', '109876543', '21234567', '2024-01-10T08:00:00', @now);
SET IDENTITY_INSERT companies OFF;

SET IDENTITY_INSERT users ON;
INSERT INTO users (
    id, password, first_name, last_name, email, status, enabled, created_at, updated_at, role_id, company_id
) VALUES
(2,  @pwd, 'Ana',     'Nikolic',     'ana.nikolic@adriatrans.company-admin.rs',        'ACTIVE', 1, '2024-01-10T08:15:00', @now, 2, 1),
(3,  @pwd, 'Milan',   'Jovanovic',   'milan.jovanovic@adriatrans.hr-manager.rs',       'ACTIVE', 1, '2024-01-11T09:00:00', @now, 3, 1),
(4,  @pwd, 'Petar',   'Markovic',    'petar.markovic@adriatrans.warehouse-manager.rs', 'ACTIVE', 1, '2024-01-12T09:00:00', @now, 4, 1),
(5,  @pwd, 'Jelena',  'Stojanovic',  'jelena.stojanovic@adriatrans.dispatcher.rs',     'ACTIVE', 1, '2024-01-13T09:00:00', @now, 5, 1),
(6,  @pwd, 'Nikola',  'Petrovic',    'nikola.petrovic@adriatrans.driver.rs',           'ACTIVE', 1, '2024-02-01T09:00:00', @now, 6, 1),
(7,  @pwd, 'Marko',   'Savic',       'marko.savic@adriatrans.driver.rs',               'ACTIVE', 1, '2024-02-05T09:00:00', @now, 6, 1),
(8,  @pwd, 'Ivana',   'Jovanovic',   'ivana.jovanovic@adriatrans.worker.rs',           'ACTIVE', 1, '2024-02-10T09:00:00', @now, 7, 1),
(9,  @pwd, 'Stefan',  'Nikolic',     'stefan.nikolic@adriatrans.worker.rs',            'ACTIVE', 1, '2024-02-12T09:00:00', @now, 7, 1),
(10, @pwd, 'Sara',    'Milenkovic',  'sara.milenkovic@adriatrans.worker.rs',           'ACTIVE', 1, '2024-02-15T09:00:00', @now, 7, 1),
(11, @pwd, 'Dejan',   'Ilic',        'dejan.ilic@adriatrans.driver.rs',                'ACTIVE', 1, '2024-03-01T09:00:00', @now, 6, 1),
(12, @pwd, 'Marija',  'Pavlovic',    'marija.pavlovic@adriatrans.worker.rs',           'ACTIVE', 1, '2024-03-05T09:00:00', @now, 7, 1),
(13, @pwd, 'Vladimir','Kostic',      'vladimir.kostic@adriatrans.warehouse-manager.rs','ACTIVE', 1, '2024-03-10T09:00:00', @now, 4, 1),
(14, @pwd, 'Tamara',  'Ristic',      'tamara.ristic@adriatrans.dispatcher.rs',         'ACTIVE', 1, '2024-03-12T09:00:00', @now, 5, 1),
(15, @pwd, 'Ognjen',  'Lazic',       'ognjen.lazic@adriatrans.worker.rs',              'ACTIVE', 1, '2024-04-01T09:00:00', @now, 7, 1);
SET IDENTITY_INSERT users OFF;

SET IDENTITY_INSERT employees ON;
INSERT INTO employees (
    id, first_name, last_name, jmbg, phone_code, phone_number, email, address, city_id, postal_code,
    timezone_id, position, employment_date, salary, active, updated_at, company_id, country_id, primary_warehouse_id, user_id
) VALUES
(1,  'Ana',      'Nikolic',    '0101990715001', '+381', '641010101', 'ana.nikolic@adriatrans.company-admin.rs',        'Bulevar Evrope 12',        2, '21000', 1, 'COMPANY_ADMIN',     '2024-01-10', 185000.00, 1, @now, 1, 1, NULL, 2),
(2,  'Milan',    'Jovanovic',  '0202990715002', '+381', '642020202', 'milan.jovanovic@adriatrans.hr-manager.rs',       'Futoska 10',               2, '21000', 1, 'HR_MANAGER',        '2024-01-11', 155000.00, 1, @now, 1, 1, NULL, 3),
(3,  'Petar',    'Markovic',   '0303990715003', '+381', '643030303', 'petar.markovic@adriatrans.warehouse-manager.rs', 'Industrijska 4',           2, '21000', 1, 'WAREHOUSE_MANAGER', '2024-01-12', 148000.00, 1, @now, 1, 1, NULL, 4),
(4,  'Jelena',   'Stojanovic', '0404990715004', '+381', '644040404', 'jelena.stojanovic@adriatrans.dispatcher.rs',     'Bulevar Oslobodjenja 45',  2, '21000', 1, 'DISPATCHER',        '2024-01-13', 142000.00, 1, @now, 1, 1, NULL, 5),
(5,  'Nikola',   'Petrovic',   '0505990715005', '+381', '645050505', 'nikola.petrovic@adriatrans.driver.rs',           'Rumencacka 15',            2, '21000', 1, 'DRIVER',            '2024-02-01', 128000.00, 1, @now, 1, 1, NULL, 6),
(6,  'Marko',    'Savic',      '0606990715006', '+381', '646060606', 'marko.savic@adriatrans.driver.rs',               'Cara Dusana 30',           2, '21000', 1, 'DRIVER',            '2024-02-05', 126000.00, 1, @now, 1, 1, NULL, 7),
(7,  'Ivana',    'Jovanovic',  '0707990715007', '+381', '647070707', 'ivana.jovanovic@adriatrans.worker.rs',           'Jevrejska 7',              2, '21000', 1, 'WORKER',            '2024-02-10',  98000.00, 1, @now, 1, 1, NULL, 8),
(8,  'Stefan',   'Nikolic',    '0808990715008', '+381', '648080808', 'stefan.nikolic@adriatrans.worker.rs',            'Temerinska 9',             2, '21000', 1, 'WORKER',            '2024-02-12',  96000.00, 1, @now, 1, 1, NULL, 9),
(9,  'Sara',     'Milenkovic', '0909990715009', '+381', '649090909', 'sara.milenkovic@adriatrans.worker.rs',           'Bulevar Patrijarha Pavla', 2, '21000', 1, 'WORKER',            '2024-02-15',  95000.00, 1, @now, 1, 1, NULL, 10),
(10, 'Dejan',    'Ilic',       '1010990715010', '+381', '641111111', 'dejan.ilic@adriatrans.driver.rs',                'Kisacka 22',               2, '21000', 1, 'DRIVER',            '2024-03-01', 124000.00, 1, @now, 1, 1, NULL, 11),
(11, 'Marija',   'Pavlovic',   '1111990715011', '+381', '642222222', 'marija.pavlovic@adriatrans.worker.rs',           'Brace Ribnikar 11',        2, '21000', 1, 'WORKER',            '2024-03-05',  94000.00, 1, @now, 1, 1, NULL, 12),
(12, 'Vladimir', 'Kostic',     '1212990715012', '+381', '643333333', 'vladimir.kostic@adriatrans.warehouse-manager.rs','Zmaj Jovina 18',           1, '11000', 1, 'WAREHOUSE_MANAGER', '2024-03-10', 147000.00, 1, @now, 1, 1, NULL, 13),
(13, 'Tamara',   'Ristic',     '1301990715013', '+381', '644444444', 'tamara.ristic@adriatrans.dispatcher.rs',         'Omladinskih brigada 90',   1, '11070', 1, 'DISPATCHER',        '2024-03-12', 139000.00, 1, @now, 1, 1, NULL, 14),
(14, 'Ognjen',   'Lazic',      '1402990715014', '+381', '645555555', 'ognjen.lazic@adriatrans.worker.rs',              'Maksima Gorkog 5',         1, '11000', 1, 'WORKER',            '2024-04-01',  93000.00, 1, @now, 1, 1, NULL, 15);
SET IDENTITY_INSERT employees OFF;

SET IDENTITY_INSERT warehouses ON;
INSERT INTO warehouses (
    id, name, address, city_id, postal_code, timezone_id, latitude, longitude, capacity, status, active, updated_at, company_id, country_id, manager_id
) VALUES
(1, 'Novi Sad Central Warehouse', 'Industrijska zona Sever 4', 2, '21000', 1, 45.2869000, 19.8451000, 12500.00, 'ACTIVE', 1, @now, 1, 1, 3),
(2, 'Belgrade Cross-Dock Hub',    'Omladinskih brigada 90',    1, '11070', 1, 44.8196000, 20.4112000,  8200.00, 'ACTIVE', 1, @now, 1, 1, 12),
(3, 'Subotica Regional Depot',   'Senćanski put 14',          5, '24000', 1, 46.1003000, 19.6654000,  5400.00, 'ACTIVE', 1, @now, 1, 1, 3),
(4, 'Nis South Distribution',    'Bulevar 12. februar 23',    3, '18000', 1, 43.3375000, 21.8957000,  6100.00, 'UNDER_MAINTENANCE', 1, @now, 1, 1, 12);
SET IDENTITY_INSERT warehouses OFF;

UPDATE employees SET primary_warehouse_id = CASE
    WHEN id IN (3, 7, 8, 9, 11) THEN 1
    WHEN id IN (12, 14) THEN 2
    WHEN id IN (5, 6, 10) THEN 1
    WHEN id IN (4, 13) THEN 2
    ELSE NULL
END
WHERE company_id = 1;

SET IDENTITY_INSERT products ON;
INSERT INTO products (id, name, description, sku, unit, price, fragile, weight, active, updated_at, company_id) VALUES
(1,  'Euro Pallet 120x80',        'Standard reusable EUR pallet',                         'ATL-PAL-12080',   'PIECE',  12.50, 0, 25.00, 1, @now, 1),
(2,  'Industrial Bearings Set',   'Packed metal bearing set for machine maintenance',      'ATL-BRG-SET-01',  'BOX',    89.90, 0, 18.50, 1, @now, 1),
(3,  'LED Lighting Panels',       'Fragile commercial lighting panels',                    'ATL-LED-PANEL',   'BOX',   135.00, 1, 12.00, 1, @now, 1),
(4,  'Automotive Filters',        'Mixed oil and air filters for fleet clients',           'ATL-FLT-AUTO',    'BOX',    46.70, 0,  8.20, 1, @now, 1),
(5,  'Food Grade Containers',     'Stackable transport containers',                        'ATL-FOOD-CNT',    'PIECE',  18.90, 0,  4.10, 1, @now, 1),
(6,  'Medical Supply Cartons',    'Sealed cartons for medical distributors',               'ATL-MED-CRT',     'BOX',    72.30, 1,  6.40, 1, @now, 1),
(7,  'Office Equipment Box',      'Mixed boxed office supplies and equipment',             'ATL-OFC-EQP',     'BOX',    54.50, 0, 10.00, 1, @now, 1),
(8,  'Textile Bale',              'Compressed textile bale',                               'ATL-TXT-BALE',    'PIECE',  31.00, 0, 32.00, 1, @now, 1),
(9,  'Glassware Protective Box',  'Fragile glassware packed in reinforced box',            'ATL-GLS-BOX',     'BOX',    64.80, 1,  9.50, 1, @now, 1),
(10, 'Warehouse Consumables Kit', 'Labels, wrap, tape and operational consumables',         'ATL-WH-KIT',      'BOX',    38.20, 0,  5.30, 1, @now, 1),
(11, 'Spare Parts Crate',         'Mixed spare parts crate for industrial customers',      'ATL-SPR-CRATE',   'PALLET',240.00, 0, 85.00, 1, @now, 1),
(12, 'Cold Chain Sensor Pack',    'Temperature sensors for sensitive transport monitoring','ATL-CC-SENSOR',   'BOX',   119.00, 1,  2.40, 1, @now, 1);
SET IDENTITY_INSERT products OFF;

INSERT INTO warehouse_inventory (warehouse_id, product_id, quantity, reserved_quantity, min_stock_level, last_updated) VALUES
(1,1,420,40,100,@now),(1,2,85,12,25,@now),(1,3,140,20,30,@now),(1,4,210,30,50,@now),(1,5,360,50,80,@now),(1,6,75,8,20,@now),(1,7,190,15,40,@now),(1,8,55,6,15,@now),(1,9,68,10,20,@now),(1,10,500,60,120,@now),(1,11,32,4,10,@now),(1,12,95,12,25,@now),
(2,1,260,25,80,@now),(2,2,44,5,15,@now),(2,3,90,12,20,@now),(2,4,125,15,35,@now),(2,5,180,18,50,@now),(2,6,48,5,15,@now),(2,7,110,8,30,@now),(2,8,70,6,20,@now),(2,9,40,4,15,@now),(2,10,260,30,70,@now),(2,11,20,2,8,@now),(2,12,54,6,18,@now),
(3,1,150,10,50,@now),(3,4,72,6,25,@now),(3,5,95,8,30,@now),(3,8,45,3,15,@now),(3,10,120,10,40,@now),(3,11,12,1,5,@now),
(4,1,80,0,40,@now),(4,2,20,0,10,@now),(4,7,35,0,20,@now),(4,10,65,0,30,@now);

SET IDENTITY_INSERT warehouse_zones ON;
INSERT INTO warehouse_zones (id, warehouse_id, code, name, type, capacity, active, description, created_at, updated_at) VALUES
(1,1,'NS-REC','Receiving Zone Novi Sad','RECEIVING',900,1,'Inbound receiving and quality check area','2024-01-20T08:00:00',@now),
(2,1,'NS-STO','Main Storage Novi Sad','STORAGE',6200,1,'Primary pallet storage area','2024-01-20T08:00:00',@now),
(3,1,'NS-PCK','Picking and Packing Novi Sad','PICKING',1800,1,'Picking lanes and packing benches','2024-01-20T08:00:00',@now),
(4,1,'NS-DSP','Dispatch Novi Sad','DISPATCH',1600,1,'Outbound staging and vehicle loading','2024-01-20T08:00:00',@now),
(5,2,'BG-XDK','Belgrade Cross-Dock','DISPATCH',3600,1,'Fast turnover cross-dock zone','2024-02-01T08:00:00',@now),
(6,2,'BG-STO','Belgrade Buffer Storage','STORAGE',2800,1,'Short-term stock buffer','2024-02-01T08:00:00',@now),
(7,3,'SU-STO','Subotica Regional Storage','STORAGE',2900,1,'Regional distribution storage','2024-02-10T08:00:00',@now),
(8,4,'NI-QAR','Nis Maintenance Quarantine','QUARANTINE',900,1,'Temporary quarantine while site is under maintenance','2024-03-01T08:00:00',@now);
SET IDENTITY_INSERT warehouse_zones OFF;

SET IDENTITY_INSERT bin_locations ON;
INSERT INTO bin_locations (id, warehouse_id, zone_id, code, name, capacity, active, description, created_at, updated_at) VALUES
(1,1,1,'NS-REC-A01','Receiving Dock A01',120,1,'Dock A inbound staging','2024-01-20T08:00:00',@now),
(2,1,2,'NS-STO-A01','Storage Aisle A01',480,1,'Heavy pallet storage','2024-01-20T08:00:00',@now),
(3,1,2,'NS-STO-B01','Storage Aisle B01',520,1,'Mixed SKU storage','2024-01-20T08:00:00',@now),
(4,1,3,'NS-PCK-01','Picking Lane 01',180,1,'Fast moving item picking','2024-01-20T08:00:00',@now),
(5,1,4,'NS-DSP-01','Dispatch Door 01',200,1,'Outbound staging door 1','2024-01-20T08:00:00',@now),
(6,2,5,'BG-XDK-01','Cross Dock Lane 01',260,1,'Inbound to outbound transfer lane','2024-02-01T08:00:00',@now),
(7,2,6,'BG-STO-A01','Belgrade Buffer A01',350,1,'Short-term stock buffer','2024-02-01T08:00:00',@now),
(8,3,7,'SU-STO-A01','Subotica Storage A01',300,1,'Regional reserve stock','2024-02-10T08:00:00',@now),
(9,4,8,'NI-QAR-01','Nis Quarantine A01',160,1,'Quarantine and blocked goods','2024-03-01T08:00:00',@now);
SET IDENTITY_INSERT bin_locations OFF;

INSERT INTO bin_inventory (bin_location_id, product_id, quantity, last_updated) VALUES
(2,1,140,@now),(2,2,40,@now),(2,11,18,@now),(3,3,70,@now),(3,4,85,@now),(4,5,100,@now),(4,6,30,@now),(5,7,35,@now),(5,10,80,@now),
(6,1,90,@now),(6,3,45,@now),(6,12,20,@now),(7,4,60,@now),(7,8,30,@now),(8,1,65,@now),(8,5,42,@now),(8,10,55,@now),(9,7,12,@now),(9,10,18,@now);

SET IDENTITY_INSERT vehicles ON;
INSERT INTO vehicles (id, registration_number, vehicle_model_id, type, capacity, max_weight, max_volume, max_items, fuel_type, year_of_production, status, active, updated_at, company_id) VALUES
(1,'NS-AT-101',21,'VAN',       12.00, 1400.00, 16.00, 160,'DIESEL',   2021,'AVAILABLE',    1,@now,1),
(2,'NS-AT-202',32,'VAN',       14.00, 1600.00, 18.00, 180,'DIESEL',   2022,'RESERVED',     1,@now,1),
(3,'NS-AT-303',18,'TRUCK',     26.00, 9000.00, 42.00, 360,'DIESEL',   2020,'IN_USE',       1,@now,1),
(4,'BG-AT-404',43,'BOX_TRUCK', 18.00, 5200.00, 34.00, 260,'DIESEL',   2021,'AVAILABLE',    1,@now,1),
(5,'BG-AT-505',10,'VAN',       10.00, 1200.00, 14.00, 140,'HYBRID',   2023,'MAINTENANCE',  1,@now,1),
(6,'SU-AT-606',35,'TRUCK',     24.00, 8500.00, 39.00, 320,'DIESEL',   2019,'OUT_OF_SERVICE',0,@now,1),
(7,'NS-AT-707',40,'VAN',       11.00, 1300.00, 15.50, 150,'ELECTRIC', 2024,'AVAILABLE',    1,@now,1);
SET IDENTITY_INSERT vehicles OFF;

SET IDENTITY_INSERT transport_orders ON;
INSERT INTO transport_orders (id, order_number, description, order_date, departure_time, actual_arrival_time, planned_arrival_time, status, priority, total_weight, notes, updated_at, created_at, source_warehouse_id, destination_warehouse_id, vehicle_id, assigned_employee_id, created_by_user_id) VALUES
(1,'ATL-2025-0001','Historical delivered shipment: lighting panels and filters Novi Sad to Belgrade','2025-12-12T08:00:00','2025-12-12T10:00:00','2025-12-12T15:40:00','2025-12-12T16:00:00','DELIVERED',2,820.00,'Delivered without discrepancy.',@now,'2025-12-12T08:00:00',1,2,3,5,5),
(2,'ATL-2026-0002','Delivered medical supply transfer to Belgrade hub','2026-01-18T08:30:00','2026-01-18T11:00:00','2026-01-18T14:20:00','2026-01-18T15:00:00','DELIVERED',3,420.00,'Temperature sensor pack recorded stable transport.',@now,'2026-01-18T08:30:00',1,2,4,6,5),
(3,'ATL-2026-0003','Subotica replenishment route for pallets and consumables','2026-02-07T07:45:00','2026-02-07T09:30:00','2026-02-07T13:10:00','2026-02-07T13:30:00','DELIVERED',2,1100.00,'Regional depot replenishment completed.',@now,'2026-02-07T07:45:00',1,3,3,10,14),
(4,'ATL-2026-0004','Failed glassware delivery due to damaged packaging inspection','2026-03-03T09:00:00','2026-03-03T12:00:00','2026-03-03T17:10:00','2026-03-03T16:30:00','FAILED',4,210.00,'Shipment returned for inspection after damage report.',@now,'2026-03-03T09:00:00',2,1,2,5,14),
(5,'ATL-2026-0005','Current assigned order: spare parts crate to Belgrade','2026-05-09T08:00:00',NULL,NULL,'2026-05-10T14:00:00','ASSIGNED',3,960.00,'Reserved for dispatch tomorrow.',@now,'2026-05-09T08:00:00',1,2,2,6,5),
(6,'ATL-2026-0006','Active picking: office equipment and consumables to Subotica','2026-05-09T09:30:00',NULL,NULL,'2026-05-11T12:00:00','PICKING',2,530.00,'Warehouse picking in progress.',@now,'2026-05-09T09:30:00',1,3,1,10,5),
(7,'ATL-2026-0007','In transit: food containers from Belgrade to Novi Sad','2026-05-08T07:00:00','2026-05-09T07:30:00',NULL,'2026-05-09T15:30:00','IN_TRANSIT',3,740.00,'Driver reports normal route conditions.',@now,'2026-05-08T07:00:00',2,1,3,5,14),
(8,'ATL-2026-0008','Draft return transfer for quarantine goods from Nis','2026-05-09T10:30:00',NULL,NULL,'2026-05-12T10:00:00','DRAFT',1,180.00,'Awaiting maintenance clearance from Nis site.',@now,'2026-05-09T10:30:00',4,1,7,6,5),
(9,'ATL-2026-0009','Cancelled route due to customer receiving window change','2026-04-21T08:00:00',NULL,NULL,'2026-04-22T16:00:00','CANCELLED',1,300.00,'Customer requested cancellation before loading.',@now,'2026-04-21T08:00:00',3,2,4,10,14),
(10,'ATL-2026-0010','Returning order: packaging issue detected by customer','2026-04-28T06:30:00','2026-04-28T08:00:00',NULL,'2026-04-28T18:00:00','RETURNING',4,265.00,'Return initiated after customer inspection.',@now,'2026-04-28T06:30:00',2,1,2,7,5);
SET IDENTITY_INSERT transport_orders OFF;

SET IDENTITY_INSERT transport_order_items ON;
INSERT INTO transport_order_items (id, quantity, reserved_quantity, dispatched_quantity, delivered_quantity, weight, note, transport_order_id, product_id) VALUES
(1,40,0,40,40,480.00,'Delivered lighting panels',1,3),(2,60,0,60,60,492.00,'Delivered automotive filters',1,4),
(3,35,0,35,35,224.00,'Delivered medical cartons',2,6),(4,20,0,20,20,48.00,'Delivered cold chain sensor packs',2,12),
(5,70,0,70,70,1750.00,'Pallet replenishment',3,1),(6,40,0,40,40,212.00,'Warehouse consumables',3,10),
(7,16,0,16,0,152.00,'Glassware failed delivery inspection',4,9),
(8,8,8,0,0,680.00,'Reserved spare parts crates',5,11),(9,45,45,0,0,450.00,'Reserved office equipment boxes',6,7),(10,80,80,0,0,424.00,'Reserved consumables',6,10),
(11,100,0,100,0,410.00,'Food containers in transit',7,5),(12,10,10,0,0,95.00,'Draft quarantine glassware',8,9),
(13,20,0,0,0,640.00,'Cancelled textile bales',9,8),(14,12,0,12,0,144.00,'Returning LED panels',10,3);
SET IDENTITY_INSERT transport_order_items OFF;

SET IDENTITY_INSERT stock_movements ON;
INSERT INTO stock_movements (id, movement_type, quantity, reason_code, reason_description, reference_type, reference_id, reference_number, reference_note, transfer_group_id, adjustment_direction, quantity_before, quantity_after, reserved_before, reserved_after, available_before, available_after, created_at, warehouse_id, product_id, created_by_user_id, transport_order_id) VALUES
(1,'INBOUND',420,'INITIAL_STOCK','Initial stock setup for Novi Sad warehouse','SYSTEM',NULL,'INIT-NS-001','Opening stock','INIT-2024-NS',NULL,0,420,0,0,0,420,'2024-01-20T08:00:00',1,1,2,NULL),
(2,'INBOUND',140,'INITIAL_STOCK','Initial LED panel stock','SYSTEM',NULL,'INIT-NS-003','Opening stock','INIT-2024-NS',NULL,0,140,0,0,0,140,'2024-01-20T08:10:00',1,3,2,NULL),
(3,'OUTBOUND',40,'TRANSPORT_DISPATCH','Dispatched lighting panels for delivered order','TRANSPORT_ORDER',1,'ATL-2025-0001','Order dispatch','TRF-2025-0001',NULL,180,140,0,0,180,140,'2025-12-12T10:05:00',1,3,5,1),
(4,'TRANSFER_IN',40,'TRANSPORT_RECEIPT','Received lighting panels in Belgrade','TRANSPORT_ORDER',1,'ATL-2025-0001','Order receipt','TRF-2025-0001',NULL,50,90,0,0,50,90,'2025-12-12T15:45:00',2,3,6,1),
(5,'OUTBOUND',35,'TRANSPORT_DISPATCH','Medical cartons dispatched','TRANSPORT_ORDER',2,'ATL-2026-0002','Medical transfer dispatch','TRF-2026-0002',NULL,110,75,0,0,110,75,'2026-01-18T11:05:00',1,6,5,2),
(6,'TRANSFER_IN',35,'TRANSPORT_RECEIPT','Medical cartons received in Belgrade','TRANSPORT_ORDER',2,'ATL-2026-0002','Medical transfer receipt','TRF-2026-0002',NULL,13,48,0,0,13,48,'2026-01-18T14:25:00',2,6,6,2),
(7,'OUTBOUND',70,'TRANSPORT_DISPATCH','Pallets dispatched to Subotica','TRANSPORT_ORDER',3,'ATL-2026-0003','Depot replenishment','TRF-2026-0003',NULL,490,420,0,0,490,420,'2026-02-07T09:40:00',1,1,14,3),
(8,'TRANSFER_IN',70,'TRANSPORT_RECEIPT','Pallets received in Subotica','TRANSPORT_ORDER',3,'ATL-2026-0003','Depot replenishment received','TRF-2026-0003',NULL,80,150,0,0,80,150,'2026-02-07T13:15:00',3,1,10,3),
(9,'WRITE_OFF',4,'DAMAGE_WRITE_OFF','Damaged glassware written off after failed delivery','TRANSPORT_ORDER',4,'ATL-2026-0004','Damage write-off','DMG-2026-0004',NULL,72,68,0,0,72,68,'2026-03-03T18:00:00',2,9,4,4),
(10,'RESERVATION',8,'STOCK_RESERVED','Spare parts reserved for assigned order','TRANSPORT_ORDER',5,'ATL-2026-0005','Reservation','RSV-2026-0005',NULL,32,32,0,8,32,24,'2026-05-09T08:10:00',1,11,5,5),
(11,'RESERVATION',45,'STOCK_RESERVED','Office equipment reserved for picking','TRANSPORT_ORDER',6,'ATL-2026-0006','Reservation','RSV-2026-0006',NULL,190,190,0,45,190,145,'2026-05-09T09:40:00',1,7,5,6),
(12,'OUTBOUND',100,'TRANSPORT_DISPATCH','Food containers dispatched and in transit','TRANSPORT_ORDER',7,'ATL-2026-0007','Dispatch','TRF-2026-0007',NULL,280,180,18,18,262,162,'2026-05-09T07:35:00',2,5,14,7),
(13,'ADJUSTMENT',12,'INVENTORY_ADJUSTMENT','Cycle count correction for warehouse consumables','INVENTORY_COUNT',NULL,'CC-2026-05-01','Monthly cycle count',NULL,'INCREASE',248,260,30,30,218,230,'2026-05-01T17:00:00',2,10,3,NULL),
(14,'RETURN_IN',12,'RETURN_IN','Returning LED panels from customer','TRANSPORT_ORDER',10,'ATL-2026-0010','Return in progress','RET-2026-0010',NULL,78,90,12,12,66,78,'2026-04-28T17:00:00',2,3,14,10),
(15,'INBOUND',95,'PURCHASE_RECEIPT','Purchased textile bales received in Novi Sad','PURCHASE_DOCUMENT',NULL,'PO-2026-0421','Supplier receipt',NULL,NULL,0,95,0,0,0,95,'2026-04-21T12:30:00',1,8,3,NULL),
(16,'RESERVATION_RELEASE',20,'RESERVATION_RELEASED','Released reservation for cancelled Subotica route','TRANSPORT_ORDER',9,'ATL-2026-0009','Cancellation release','REL-2026-0009',NULL,65,65,20,0,45,65,'2026-04-21T14:15:00',3,8,14,9);
SET IDENTITY_INSERT stock_movements OFF;

SET IDENTITY_INSERT tasks ON;
INSERT INTO tasks (id, title, description, due_date, priority, status, task_type, started_at, completed_at, cancelled_at, cancel_reason, created_at, updated_at, assigned_employee_id, transport_order_id, stock_movement_id) VALUES
(1,'Pick LED panels','Pick LED panels for historical Belgrade transfer','2025-12-12T09:30:00','HIGH','COMPLETED','PICKING','2025-12-12T08:40:00','2025-12-12T09:20:00',NULL,NULL,'2025-12-12T08:10:00',@now,7,1,3),
(2,'Load truck NS-AT-303','Load vehicle for delivered Belgrade order','2025-12-12T10:00:00','HIGH','COMPLETED','LOADING','2025-12-12T09:30:00','2025-12-12T09:55:00',NULL,NULL,'2025-12-12T08:15:00',@now,8,1,3),
(3,'Medical cartons handover','Confirm sealed medical cartons at Belgrade hub','2026-01-18T15:00:00','URGENT','COMPLETED','UNLOADING','2026-01-18T14:10:00','2026-01-18T14:40:00',NULL,NULL,'2026-01-18T08:45:00',@now,12,2,6),
(4,'Subotica replenishment unload','Unload pallets at Subotica regional depot','2026-02-07T14:00:00','MEDIUM','COMPLETED','UNLOADING','2026-02-07T13:15:00','2026-02-07T13:55:00',NULL,NULL,'2026-02-07T08:00:00',@now,14,3,8),
(5,'Damage inspection','Inspect failed glassware packaging and document findings','2026-03-04T10:00:00','URGENT','COMPLETED','COUNTING','2026-03-04T08:30:00','2026-03-04T09:40:00',NULL,NULL,'2026-03-03T18:15:00',@now,11,4,9),
(6,'Prepare spare parts crates','Prepare spare parts crates for assigned route','2026-05-10T09:00:00','HIGH','NEW','PICKING',NULL,NULL,NULL,NULL,'2026-05-09T08:20:00',@now,7,5,10),
(7,'Office equipment picking','Pick office equipment boxes for Subotica order','2026-05-10T11:00:00','MEDIUM','IN_PROGRESS','PICKING','2026-05-09T10:00:00',NULL,NULL,NULL,'2026-05-09T09:45:00',@now,8,6,11),
(8,'Consumables packing','Pack consumables for Subotica route','2026-05-10T12:30:00','MEDIUM','NEW','PACKING',NULL,NULL,NULL,NULL,'2026-05-09T09:50:00',@now,9,6,11),
(9,'Track active Belgrade return','Monitor in-transit food container route','2026-05-09T15:30:00','HIGH','IN_PROGRESS','DRIVING','2026-05-09T07:30:00',NULL,NULL,NULL,'2026-05-08T07:30:00',@now,5,7,12),
(10,'Quarantine route review','Review Nis quarantine goods before draft approval','2026-05-11T13:00:00','LOW','NEW','ADMIN',NULL,NULL,NULL,NULL,'2026-05-09T10:40:00',@now,3,8,NULL),
(11,'Cancelled route cleanup','Release Subotica route reservations','2026-04-21T15:00:00','MEDIUM','CANCELLED','ADMIN',NULL,NULL,'2026-04-21T14:20:00','Customer cancelled route before loading.','2026-04-21T08:20:00',@now,13,9,16),
(12,'Return packaging check','Check returned LED packaging after customer issue','2026-04-29T10:00:00','HIGH','COMPLETED','COUNTING','2026-04-29T08:00:00','2026-04-29T09:30:00',NULL,NULL,'2026-04-28T17:10:00',@now,11,10,14);
SET IDENTITY_INSERT tasks OFF;

SET IDENTITY_INSERT shifts ON;
INSERT INTO shifts (id, start_time, end_time, timezone_id, status, notes, warehouse_id, employee_id) VALUES
(1,'2026-05-09T06:00:00','2026-05-09T14:00:00',1,'ACTIVE','Morning picking and loading shift',1,7),
(2,'2026-05-09T06:00:00','2026-05-09T14:00:00',1,'ACTIVE','Morning packing shift',1,8),
(3,'2026-05-09T14:00:00','2026-05-09T22:00:00',1,'PLANNED','Afternoon dispatch shift',1,9),
(4,'2026-05-09T07:00:00','2026-05-09T15:00:00',1,'ACTIVE','Belgrade cross-dock shift',2,12),
(5,'2026-05-09T08:00:00','2026-05-09T16:00:00',1,'ACTIVE','Dispatch coordination shift',2,13),
(6,'2026-05-08T06:00:00','2026-05-08T14:00:00',1,'FINISHED','Completed historical warehouse shift',1,11),
(7,'2026-05-10T06:00:00','2026-05-10T14:00:00',1,'PLANNED','Planned spare parts dispatch shift',1,7),
(8,'2026-05-09T06:00:00','2026-05-09T18:00:00',1,'ACTIVE','Driving route shift',NULL,5),
(9,'2026-05-09T10:00:00','2026-05-09T18:00:00',1,'PLANNED','Backup driving availability',NULL,6),
(10,'2026-05-07T14:00:00','2026-05-07T22:00:00',1,'CANCELLED','Cancelled due to route change',3,14);
SET IDENTITY_INSERT shifts OFF;

SET IDENTITY_INSERT employee_warehouse_assignments ON;
INSERT INTO employee_warehouse_assignments (id, company_id, employee_id, warehouse_id, access_type, active, valid_from, valid_to, notes) VALUES
(1,1,3,1,'MANAGER',1,'2024-01-12',NULL,'Primary manager for Novi Sad warehouse'),
(2,1,12,2,'MANAGER',1,'2024-03-10',NULL,'Manager for Belgrade cross-dock hub'),
(3,1,7,1,'WORKER',1,'2024-02-10',NULL,'Picking and packing worker'),
(4,1,8,1,'WORKER',1,'2024-02-12',NULL,'Packing worker'),
(5,1,9,1,'WORKER',1,'2024-02-15',NULL,'Dispatch worker'),
(6,1,11,2,'WORKER',1,'2024-03-05',NULL,'Belgrade operations worker'),
(7,1,14,3,'WORKER',1,'2024-04-01',NULL,'Subotica depot worker'),
(8,1,4,2,'DISPATCH',1,'2024-01-13',NULL,'Dispatcher access to Belgrade hub'),
(9,1,13,2,'DISPATCH',1,'2024-03-12',NULL,'Dispatcher access to Belgrade hub'),
(10,1,5,1,'VIEW_ONLY',1,'2024-02-01',NULL,'Driver pickup visibility'),
(11,1,6,1,'VIEW_ONLY',1,'2024-02-05',NULL,'Driver pickup visibility');
SET IDENTITY_INSERT employee_warehouse_assignments OFF;

SET IDENTITY_INSERT vehicle_maintenance ON;
INSERT INTO vehicle_maintenance (id, vehicle_id, company_id, type, status, scheduled_at, started_at, completed_at, cancelled_at, odometer, cost, notes, cancel_reason, created_at, updated_at) VALUES
(1,5,1,'ROUTINE_SERVICE','IN_PROGRESS','2026-05-08T09:00:00','2026-05-08T09:15:00',NULL,NULL,84200,NULL,'Hybrid van regular service and battery check.',NULL,'2026-05-01T10:00:00',@now),
(2,6,1,'REPAIR','PLANNED','2026-05-13T08:00:00',NULL,NULL,NULL,176500,NULL,'Truck brake system repair planned before reactivation.',NULL,'2026-05-06T12:00:00',@now),
(3,3,1,'INSPECTION','COMPLETED','2026-04-10T08:00:00','2026-04-10T08:10:00','2026-04-10T11:30:00',NULL,132400,42000.00,'Quarterly inspection completed.',NULL,'2026-04-01T09:00:00',@now),
(4,1,1,'TIRE_CHANGE','COMPLETED','2026-03-15T09:00:00','2026-03-15T09:20:00','2026-03-15T10:40:00',NULL,90500,18500.00,'Seasonal tire change completed.',NULL,'2026-03-05T09:00:00',@now),
(5,2,1,'CLEANING','CANCELLED','2026-04-22T15:00:00',NULL,NULL,'2026-04-22T12:00:00',65200,NULL,'Cleaning cancelled due to customer route change.','Vehicle reassigned to urgent route.','2026-04-18T09:00:00',@now);
SET IDENTITY_INSERT vehicle_maintenance OFF;

SET IDENTITY_INSERT internal_warehouse_movements ON;
INSERT INTO internal_warehouse_movements (id, warehouse_id, product_id, source_bin_id, destination_bin_id, quantity, status, note, created_by_id, created_at) VALUES
(1,1,3,3,4,20,'COMPLETED','Moved LED panels from storage to picking lane for historical order.',8,'2025-12-12T08:35:00'),
(2,1,10,3,5,35,'COMPLETED','Moved consumables to dispatch staging.',9,'2026-02-07T08:50:00'),
(3,2,5,7,6,80,'COMPLETED','Moved food containers to cross-dock lane for active route.',12,'2026-05-09T07:00:00'),
(4,1,11,2,5,8,'COMPLETED','Moved spare parts crates to outbound staging.',7,'2026-05-09T08:30:00'),
(5,4,7,9,9,4,'CANCELLED','Attempted quarantine relocation cancelled because source and destination remained blocked.',13,'2026-05-07T11:00:00');
SET IDENTITY_INSERT internal_warehouse_movements OFF;

SET IDENTITY_INSERT notifications ON;
INSERT INTO notifications (id, title, message, type, severity, status, category, source_type, source_id, dedup_key, escalated_at, created_at, user_id) VALUES
(1,'Route in transit','ATL-2026-0007 is currently in transit to Novi Sad.','INFO','INFO','UNREAD','TRANSPORT','TRANSPORT_ORDER',7,'transport-7-in-transit',NULL,'2026-05-09T07:35:00',5),
(2,'Urgent maintenance','Vehicle BG-AT-505 maintenance is in progress.','WARNING','WARNING','UNREAD','WAREHOUSE','USER',5,'vehicle-5-maintenance',NULL,'2026-05-08T09:20:00',4),
(3,'Low stock warning','Subotica depot has low stock for spare parts crate.','WARNING','WARNING','READ','INVENTORY','WAREHOUSE_INVENTORY',11,'inventory-3-11-low',NULL,'2026-05-08T12:00:00',3),
(4,'Task overdue risk','Packing task for ATL-2026-0006 must be started before noon.','WARNING','WARNING','UNREAD','TASK','TASK',8,'task-8-risk','2026-05-09T11:30:00','2026-05-09T10:00:00',8),
(5,'Registration request pending','Beta Freight DOO registration request is awaiting review.','INFO','INFO','UNREAD','SECURITY','SYSTEM',NULL,'registration-beta-pending',NULL,'2026-05-02T09:31:00',1),
(6,'Delivered order archived','ATL-2026-0003 has been delivered and archived in history.','SUCCESS','SUCCESS','READ','TRANSPORT','TRANSPORT_ORDER',3,'transport-3-delivered',NULL,'2026-02-07T13:20:00',14),
(7,'Critical failed delivery','ATL-2026-0004 failed due to packaging damage.','ERROR','CRITICAL','READ','TRANSPORT','TRANSPORT_ORDER',4,'transport-4-failed','2026-03-03T17:30:00','2026-03-03T17:15:00',2),
(8,'Shift active','Morning Novi Sad picking shift is active.','INFO','INFO','READ','SHIFT','SHIFT',1,'shift-1-active',NULL,'2026-05-09T06:05:00',7),
(9,'Warehouse maintenance','Nis South Distribution is under maintenance.','WARNING','WARNING','UNREAD','WAREHOUSE','WAREHOUSE',4,'warehouse-4-maintenance',NULL,'2026-05-07T08:00:00',12),
(10,'Inventory adjustment posted','Cycle count correction has been posted for consumables.','SUCCESS','SUCCESS','READ','INVENTORY','WAREHOUSE_INVENTORY',10,'stockmovement-13-adjustment',NULL,'2026-05-01T17:05:00',3);
SET IDENTITY_INSERT notifications OFF;

SET IDENTITY_INSERT domain_events ON;
INSERT INTO domain_events (id, event_type, entity_type, entity_id, entity_identifier, summary, payload, company_id, created_by_id, created_at) VALUES
(1,'SYSTEM_EVENT','COMPANY',1,'Adriatrans Logistics DOO','Company onboarded through approved registration request.','{"registrationNumber":"21234567","taxNumber":"109876543"}',1,1,'2024-01-10T09:00:00'),
(2,'INVENTORY_LIFECYCLE','WAREHOUSE_INVENTORY',1,'NS-ATL-PAL-12080','Initial inventory loaded for Novi Sad central warehouse.','{"warehouseId":1,"productId":1,"quantity":420}',1,2,'2024-01-20T08:05:00'),
(3,'TRANSPORT_LIFECYCLE','TRANSPORT_ORDER',1,'ATL-2025-0001','Order delivered successfully from Novi Sad to Belgrade.','{"from":1,"to":2,"status":"DELIVERED"}',1,5,'2025-12-12T15:45:00'),
(4,'TRANSPORT_LIFECYCLE','TRANSPORT_ORDER',4,'ATL-2026-0004','Transport failed due to packaging damage report.','{"status":"FAILED","reason":"DAMAGED_PACKAGING"}',1,14,'2026-03-03T17:20:00'),
(5,'TASK_LIFECYCLE','TASK',7,'Office equipment picking','Task moved to IN_PROGRESS.','{"oldStatus":"NEW","newStatus":"IN_PROGRESS"}',1,8,'2026-05-09T10:00:00'),
(6,'SHIFT_LIFECYCLE','SHIFT',1,'Novi Sad morning shift','Shift became active.','{"status":"ACTIVE"}',1,7,'2026-05-09T06:00:00'),
(7,'VEHICLE_MAINTENANCE','VEHICLE_MAINTENANCE',1,'BG-AT-505','Vehicle maintenance started.','{"vehicleId":5,"status":"IN_PROGRESS"}',1,4,'2026-05-08T09:15:00'),
(8,'COMMENT_CREATED','TRANSPORT_ORDER',7,'ATL-2026-0007','Dispatcher added route condition comment.','{"commentId":3}',1,14,'2026-05-09T08:00:00'),
(9,'ATTACHMENT_ADDED','TRANSPORT_ORDER',4,'ATL-2026-0004','Damage report attachment uploaded.','{"attachmentId":2}',1,11,'2026-03-03T18:05:00'),
(10,'SYSTEM_EVENT','COMPANY_REGISTRATION_REQUEST',1,'Beta Freight DOO','New company registration request submitted.','{"status":"SUBMITTED"}',NULL,1,'2026-05-02T09:31:00');
SET IDENTITY_INSERT domain_events OFF;

SET IDENTITY_INSERT operational_comments ON;
INSERT INTO operational_comments (id, entity_type, entity_id, content, internal_note, company_id, author_id, created_at, updated_at) VALUES
(1,'COMPANY',1,'Demo company initialized with realistic operational history for testing dashboard, reports and audit flows.',1,1,2,'2024-01-10T09:05:00',NULL),
(2,'TRANSPORT_ORDER',1,'Customer confirmed receipt. No missing items reported.',0,1,5,'2025-12-12T15:50:00',NULL),
(3,'TRANSPORT_ORDER',7,'Driver reports normal route conditions and expected arrival within planned window.',0,1,14,'2026-05-09T08:00:00',NULL),
(4,'TRANSPORT_ORDER',4,'Packaging damage visible on two glassware boxes. Inspection opened.',1,1,11,'2026-03-03T18:00:00',NULL),
(5,'WAREHOUSE',4,'Nis site remains available only for quarantine handling until maintenance is completed.',1,1,12,'2026-05-07T08:30:00',NULL),
(6,'TASK',7,'Picking started. Missing one box label roll, replacement requested.',0,1,8,'2026-05-09T10:15:00',NULL),
(7,'VEHICLE',5,'Vehicle moved to service bay. Battery diagnostics pending.',1,1,4,'2026-05-08T09:25:00',NULL),
(8,'WAREHOUSE_INVENTORY',10,'Cycle count adjustment reviewed and approved by warehouse manager.',1,1,3,'2026-05-01T17:10:00',NULL),
(9,'COMPANY_REGISTRATION_REQUEST',1,'Pending request left visible for overlord review testing.',1,NULL,1,'2026-05-02T09:35:00',NULL),
(10,'EMPLOYEE',5,'Driver Nikola assigned as primary driver for active Novi Sad-Belgrade lane.',1,1,2,'2026-04-15T10:00:00',NULL);
SET IDENTITY_INSERT operational_comments OFF;

SET IDENTITY_INSERT operational_attachments ON;
INSERT INTO operational_attachments (id, entity_type, entity_id, file_name, content_type, file_url, size_bytes, description, company_id, uploaded_by_id, created_at) VALUES
(1,'COMPANY',1,'adriatrans-registration.pdf','application/pdf','/demo/files/adriatrans-registration.pdf',245760,'Company registration document used for demo audit trail.',1,2,'2024-01-10T09:10:00'),
(2,'TRANSPORT_ORDER',4,'atl-2026-0004-damage-report.pdf','application/pdf','/demo/files/atl-2026-0004-damage-report.pdf',389120,'Damage report for failed glassware delivery.',1,11,'2026-03-03T18:05:00'),
(3,'TRANSPORT_ORDER',1,'atl-2025-0001-pod.pdf','application/pdf','/demo/files/atl-2025-0001-pod.pdf',198400,'Proof of delivery for historical completed order.',1,5,'2025-12-12T15:55:00'),
(4,'VEHICLE_MAINTENANCE',1,'bg-at-505-service-checklist.pdf','application/pdf','/demo/files/bg-at-505-service-checklist.pdf',156300,'Service checklist for hybrid van maintenance.',1,4,'2026-05-08T09:30:00'),
(5,'WAREHOUSE',4,'nis-maintenance-plan.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','/demo/files/nis-maintenance-plan.xlsx',88560,'Maintenance plan for Nis warehouse site.',1,12,'2026-05-07T08:45:00'),
(6,'TASK',7,'picking-list-atl-2026-0006.csv','text/csv','/demo/files/picking-list-atl-2026-0006.csv',12480,'Picking list generated for active Subotica order.',1,8,'2026-05-09T09:55:00');
SET IDENTITY_INSERT operational_attachments OFF;

SET IDENTITY_INSERT change_history ON;
INSERT INTO change_history (id, entity_name, entity_id, entity_identifier, change_type, field_name, old_value, new_value, changed_at, changed_by_user_id) VALUES
(1,'COMPANY',1,'Adriatrans Logistics DOO','CREATE',NULL,NULL,'Company created from approved registration request','2024-01-10T09:00:00',1),
(2,'WAREHOUSE',1,'Novi Sad Central Warehouse','CREATE',NULL,NULL,'Warehouse created','2024-01-20T08:00:00',2),
(3,'TRANSPORT_ORDER',1,'ATL-2025-0001','STATUS_CHANGE','status','IN_TRANSIT','DELIVERED','2025-12-12T15:45:00',5),
(4,'TRANSPORT_ORDER',4,'ATL-2026-0004','STATUS_CHANGE','status','IN_TRANSIT','FAILED','2026-03-03T17:20:00',14),
(5,'TASK',7,'Office equipment picking','STATUS_CHANGE','status','NEW','IN_PROGRESS','2026-05-09T10:00:00',8),
(6,'VEHICLE',5,'BG-AT-505','STATUS_CHANGE','status','AVAILABLE','MAINTENANCE','2026-05-08T09:15:00',4),
(7,'WAREHOUSE',4,'Nis South Distribution','STATUS_CHANGE','status','ACTIVE','UNDER_MAINTENANCE','2026-05-07T08:00:00',12),
(8,'WAREHOUSE_INVENTORY',10,'Belgrade consumables','UPDATE','quantity','248','260','2026-05-01T17:00:00',3),
(9,'TRANSPORT_ORDER',9,'ATL-2026-0009','STATUS_CHANGE','status','ASSIGNED','CANCELLED','2026-04-21T14:10:00',14),
(10,'COMPANY_REGISTRATION_REQUEST',2,'North Line Cargo DOO','STATUS_CHANGE','status','SUBMITTED','REJECTED','2026-04-26T12:15:00',1),
(11,'SHIFT',1,'Novi Sad morning shift','STATUS_CHANGE','status','PLANNED','ACTIVE','2026-05-09T06:00:00',7),
(12,'STOCK_MOVEMENT',13,'CC-2026-05-01','CREATE',NULL,NULL,'Inventory adjustment created','2026-05-01T17:00:00',3);
SET IDENTITY_INSERT change_history OFF;

SET IDENTITY_INSERT activity_logs ON;
INSERT INTO activity_logs (id, action, entity_name, entity_id, entity_identifier, description, created_at, user_id) VALUES
(1,'COMPANY_ONBOARDED','COMPANY',1,'Adriatrans Logistics DOO','Approved company registration and created operational tenant.','2024-01-10T09:00:00',1),
(2,'WAREHOUSE_CREATED','WAREHOUSE',1,'Novi Sad Central Warehouse','Created central warehouse and initial zones.','2024-01-20T08:00:00',2),
(3,'INVENTORY_SEEDED','WAREHOUSE_INVENTORY',1,'Initial inventory','Initial stock loaded for demo company.','2024-01-20T08:30:00',2),
(4,'ORDER_DELIVERED','TRANSPORT_ORDER',1,'ATL-2025-0001','Historical order delivered successfully.','2025-12-12T15:45:00',5),
(5,'ORDER_FAILED','TRANSPORT_ORDER',4,'ATL-2026-0004','Failed order due to damaged packaging.','2026-03-03T17:20:00',14),
(6,'TASK_STARTED','TASK',7,'Office equipment picking','Worker started active picking task.','2026-05-09T10:00:00',8),
(7,'MAINTENANCE_STARTED','VEHICLE_MAINTENANCE',1,'BG-AT-505','Maintenance workflow started.','2026-05-08T09:15:00',4),
(8,'REGISTRATION_SUBMITTED','COMPANY_REGISTRATION_REQUEST',1,'Beta Freight DOO','Pending company registration request submitted.','2026-05-02T09:30:00',1),
(9,'REGISTRATION_REJECTED','COMPANY_REGISTRATION_REQUEST',2,'North Line Cargo DOO','Rejected incomplete registration request.','2026-04-26T12:15:00',1),
(10,'STOCK_ADJUSTED','STOCK_MOVEMENT',13,'CC-2026-05-01','Cycle count correction posted.','2026-05-01T17:00:00',3),
(11,'SHIFT_ACTIVATED','SHIFT',1,'Novi Sad morning shift','Shift lifecycle moved to ACTIVE.','2026-05-09T06:00:00',7),
(12,'ATTACHMENT_UPLOADED','OPERATIONAL_ATTACHMENT',2,'Damage report','Damage report uploaded to failed order.','2026-03-03T18:05:00',11);
SET IDENTITY_INSERT activity_logs OFF;

SET IDENTITY_INSERT company_registration_requests ON;
INSERT INTO company_registration_requests (id, company_name, registration_number, tax_number, company_email, company_phone_number, country_id, city_id, timezone_id, address, postal_code, admin_first_name, admin_last_name, admin_email, admin_phone_number, admin_jmbg, admin_password, admin_employment_date, status, submitted_at, reviewed_at, reviewed_by_id, rejection_reason, notes, created_company_id, updated_at) VALUES
(1,'Beta Freight DOO','21345678','108765432','office@betafreight.rs','113330444',1,1,1,'Omladinskih brigada 90','11070','Luka','Stevanovic','luka.stevanovic@betafreight.company-admin.rs','641111222','1503990715015',@pwd,'2026-04-01','SUBMITTED','2026-05-02T09:30:00',NULL,NULL,NULL,'Pending demo registration request for overlord review.',NULL,NULL),
(2,'North Line Cargo DOO','22345678','107654321','office@northline.rs','214440555',1,5,1,'Senćanski put 14','24000','Maja','Todorovic','maja.todorovic@northline.company-admin.rs','642222333','1604990715016',@pwd,'2026-03-20','REJECTED','2026-04-25T10:00:00','2026-04-26T12:15:00',1,'Incomplete registration documentation.','Rejected demo request with visible rejection reason.',NULL,@now),
(3,'Adriatrans Logistics DOO','21234567','109876543','office@adriatrans.rs','214240100',1,2,1,'Bulevar Evrope 12','21000','Ana','Nikolic','ana.nikolic@adriatrans.company-admin.rs','641010101','0101990715001',@pwd,'2024-01-10','APPROVED','2024-01-10T08:00:00','2024-01-10T09:00:00',1,NULL,'Approved demo company registration record.',1,@now),
(4,'Danube Cold Chain DOO','23345678','106543210','office@danubecold.rs','214550666',1,2,1,'Put novosadskog partizanskog odreda 8','21000','Filip','Radovanovic','filip.radovanovic@danubecold.company-admin.rs','643333444','1705990715017',@pwd,'2026-02-12','CANCELLED','2026-03-05T11:00:00','2026-03-06T08:45:00',1,NULL,'Cancelled by applicant before review completion.',NULL,@now);
SET IDENTITY_INSERT company_registration_requests OFF;

COMMIT TRANSACTION;
