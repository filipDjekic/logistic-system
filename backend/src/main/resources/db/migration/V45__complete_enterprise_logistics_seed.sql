/*
 * Development/demo data completion for the enterprise logistics scenario.
 *
 * V15 created the high-volume Titan Freight data set and V44 added a smaller
 * company-scope data set.  This forward-only migration deliberately does not
 * edit either already published migration.  It fills the V15 gaps introduced
 * by modules added in V26-V40 and normalises time-sensitive lifecycle data.
 *
 * Deterministic seed timestamp: 2026-08-06T00:00:00.000 UTC
 * Shared development password: Admin123!
 */
SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
BEGIN TRANSACTION;

DECLARE @SeedNow DATETIME2(3) = '2026-08-06T00:00:00.000';
DECLARE @now DATETIME2(3) = @SeedNow;
DECLARE @today DATE = CAST(@now AS DATE);
DECLARE @password NVARCHAR(255) = '$2a$10$NBqZSKuQWFxDQx5taxDczuSxfo/mwhAzngiVOPnpVAKr0RskxtaSG';
DECLARE @companyId BIGINT = (SELECT id FROM companies WHERE name = N'Titan Freight Solutions DOO');
DECLARE @countryId BIGINT = (SELECT id FROM countries WHERE code = N'RS');
DECLARE @timezoneId BIGINT = (SELECT id FROM timezones WHERE name = N'Europe/Belgrade');

IF @companyId IS NULL OR @countryId IS NULL OR @timezoneId IS NULL
    THROW 51045, 'V45 prerequisites are missing.', 1;

/* V15 metadata pointed at non-existent seed.local files; do not retain dead links. */
DELETE a
FROM operational_attachments a
WHERE a.company_id=@companyId AND a.file_url LIKE N'https://seed.local/titan/%';

/* Grow the organisation from 33 to 100 users/employees with stable identities. */
DECLARE @firstNames TABLE (rn INT PRIMARY KEY, value NVARCHAR(60));
INSERT INTO @firstNames VALUES
(1,N'Aleksa'),(2,N'Anđela'),(3,N'Boris'),(4,N'Branka'),(5,N'Danilo'),
(6,N'Dunja'),(7,N'Emil'),(8,N'Gordana'),(9,N'Ilija'),(10,N'Jasmina');

DECLARE @lastNames TABLE (rn INT PRIMARY KEY, value NVARCHAR(60));
INSERT INTO @lastNames VALUES
(1,N'Bogdanović'),(2,N'Cvetković'),(3,N'Dimitrijević'),(4,N'Đukić'),(5,N'Gavrilović'),
(6,N'Jevtić'),(7,N'Knežević'),(8,N'Mladenović'),(9,N'Radulović'),(10,N'Živadinović');

;WITH numbers AS (
    SELECT TOP (67) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rn
    FROM sys.all_objects
),
people AS (
    SELECT n.rn, f.value AS first_name, l.value AS last_name,
           CONCAT(N'tfs.', RIGHT(N'000' + CAST(n.rn AS NVARCHAR(3)), 3), N'@titanfreight.rs') AS email,
           CASE WHEN n.rn <= 2 THEN N'HR_MANAGER'
                WHEN n.rn <= 10 THEN N'DISPATCHER'
                WHEN n.rn <= 30 THEN N'DRIVER'
                ELSE N'WORKER' END AS role_name,
           ((n.rn - 1) % 6) + 1 AS warehouse_slot
    FROM numbers n
    JOIN @firstNames f ON f.rn = ((n.rn - 1) % 10) + 1
    JOIN @lastNames l ON l.rn = (((n.rn - 1) / 10 + n.rn - 1) % 10) + 1
)
INSERT INTO users
    (password,first_name,last_name,email,status,enabled,created_at,updated_at,role_id,company_id)
SELECT @password,p.first_name,p.last_name,p.email,N'ACTIVE',1,
       DATEADD(DAY,-540-p.rn,@now),@now,r.id,@companyId
FROM people p
JOIN roles r ON r.name=p.role_name
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.email=p.email);

;WITH numbers AS (
    SELECT TOP (67) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rn
    FROM sys.all_objects
),
people AS (
    SELECT n.rn, f.value AS first_name, l.value AS last_name,
           CONCAT(N'tfs.', RIGHT(N'000' + CAST(n.rn AS NVARCHAR(3)), 3), N'@titanfreight.rs') AS email,
           CASE WHEN n.rn <= 2 THEN N'HR_MANAGER'
                WHEN n.rn <= 10 THEN N'DISPATCHER'
                WHEN n.rn <= 30 THEN N'DRIVER'
                ELSE N'WORKER' END AS position,
           ((n.rn - 1) % 6) + 1 AS warehouse_slot
    FROM numbers n
    JOIN @firstNames f ON f.rn = ((n.rn - 1) % 10) + 1
    JOIN @lastNames l ON l.rn = (((n.rn - 1) / 10 + n.rn - 1) % 10) + 1
),
warehouse_map AS (
    SELECT id,ROW_NUMBER() OVER (ORDER BY id) AS rn
    FROM warehouses WHERE company_id=@companyId
)
INSERT INTO employees
    (first_name,last_name,jmbg,phone_code,phone_number,email,address,city_id,postal_code,timezone_id,
     position,employment_date,salary,active,updated_at,company_id,country_id,primary_warehouse_id,user_id,
     auto_generated_email,email_manually_overridden,email_generation_source)
SELECT p.first_name,p.last_name,
       CONCAT(N'9',RIGHT(N'000000000000'+CAST(45000000000+p.rn AS NVARCHAR(12)),12)),
       N'+381',CONCAT(N'65',RIGHT(N'0000000'+CAST(7000000+p.rn AS NVARCHAR(7)),7)),p.email,
       CONCAT(N'Logistički park ',p.rn),
       w.city_id,w.postal_code,@timezoneId,p.position,DATEADD(DAY,-500-p.rn,@today),
       CAST(CASE p.position WHEN N'HR_MANAGER' THEN 150000 WHEN N'DISPATCHER' THEN 135000
            WHEN N'DRIVER' THEN 118000 ELSE 92000 END AS DECIMAL(12,2)),
       1,@now,@companyId,@countryId,w.id,u.id,1,0,N'V45_ENTERPRISE_COMPLETION'
FROM people p
JOIN users u ON u.email=p.email
JOIN warehouse_map wm ON wm.rn=p.warehouse_slot
JOIN warehouses w ON w.id=wm.id
WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.company_id=@companyId AND e.email=p.email);

INSERT INTO employee_warehouse_assignments
    (company_id,employee_id,warehouse_id,access_type,active,valid_from,valid_to,notes,created_at,updated_at)
SELECT @companyId,e.id,e.primary_warehouse_id,
       CASE e.position WHEN N'DISPATCHER' THEN N'DISPATCH' WHEN N'DRIVER' THEN N'PRIMARY'
            WHEN N'WORKER' THEN N'WORKER' ELSE N'VIEW_ONLY' END,
       1,DATEADD(YEAR,-1,@today),NULL,N'Matično operativno mesto',DATEADD(YEAR,-1,@now),@now
FROM employees e
WHERE e.company_id=@companyId AND e.email LIKE N'tfs.%@titanfreight.rs'
  AND NOT EXISTS (
      SELECT 1 FROM employee_warehouse_assignments a
      WHERE a.employee_id=e.id AND a.warehouse_id=e.primary_warehouse_id
  );

/*
 * Replace generic performance product labels with deterministic, business-like
 * catalogue labels while preserving stable SKU keys and all existing FKs.
 */
;WITH catalogue AS (
    SELECT p.id,ROW_NUMBER() OVER (ORDER BY p.sku) AS rn
    FROM products p WHERE p.company_id=@companyId AND p.sku LIKE N'TFS-PERF-%'
)
UPDATE p
SET name = CASE c.rn % 12
      WHEN 0 THEN CONCAT(N'Nordex električni čajnik EK-',2000+c.rn,N', 1.7 l')
      WHEN 1 THEN CONCAT(N'Voltara produžni kabl ',3+(c.rn%5),N' m, 6 utičnica')
      WHEN 2 THEN CONCAT(N'OfficeLine papir A4 80 g, paket ',500+(c.rn%3)*250,N' listova')
      WHEN 3 THEN CONCAT(N'ProShield zaštitne rukavice L, pakovanje ',50+(c.rn%3)*25,N' kom')
      WHEN 4 THEN CONCAT(N'AquaMira negazirana voda 1.5 l, paket ',6+(c.rn%2)*6,N' kom')
      WHEN 5 THEN CONCAT(N'AutoCore filter ulja AC-',RIGHT(N'000'+CAST(c.rn AS NVARCHAR(3)),3))
      WHEN 6 THEN CONCAT(N'Gradex tipl univerzalni 8 mm, kutija ',100+c.rn,N' kom')
      WHEN 7 THEN CONCAT(N'Cleanora sredstvo za podove ',1+(c.rn%5),N' l')
      WHEN 8 THEN CONCAT(N'Lumitek LED panel ',18+(c.rn%4)*6,N' W')
      WHEN 9 THEN CONCAT(N'PackPro streč folija ',2+(c.rn%3),N' kg')
      WHEN 10 THEN CONCAT(N'Toolvia burgija za metal ',4+(c.rn%9),N' mm')
      ELSE CONCAT(N'SafeStep zaštitna cipela S3, broj ',39+(c.rn%8)) END,
    description = CASE c.rn % 6
      WHEN 0 THEN N'Mali kućni aparat za regionalnu maloprodajnu distribuciju'
      WHEN 1 THEN N'Elektro i kancelarijska oprema u transportnom pakovanju'
      WHEN 2 THEN N'Potrošni kancelarijski materijal sa stabilnom tražnjom'
      WHEN 3 THEN N'Lična zaštitna oprema za industrijske kupce'
      WHEN 4 THEN N'FMCG proizvod sa ubrzanim obrtom zaliha'
      ELSE N'Rezervni deo i skladišni potrošni materijal' END,
    updated_at=@now
FROM products p JOIN catalogue c ON c.id=p.id;

/*
 * Rebuild Titan bin balances so their sum is exactly the warehouse balance.
 * V15 used independent pseudo-random quantities for performance only.
 */
DELETE bi
FROM bin_inventory bi
JOIN bin_locations b ON b.id=bi.bin_location_id
JOIN warehouses w ON w.id=b.warehouse_id
WHERE w.company_id=@companyId;

;WITH eligible_bins AS (
    SELECT b.id,b.warehouse_id,
           ROW_NUMBER() OVER (PARTITION BY b.warehouse_id ORDER BY b.id) AS rn,
           COUNT(*) OVER (PARTITION BY b.warehouse_id) AS bin_count
    FROM bin_locations b JOIN warehouses w ON w.id=b.warehouse_id
    WHERE w.company_id=@companyId AND b.active=1
),
distribution AS (
    SELECT eb.id AS bin_id,wi.product_id,wi.quantity,eb.rn,
           ((wi.product_id-1)%eb.bin_count)+1 AS first_rn
    FROM warehouse_inventory wi
    JOIN warehouses w ON w.id=wi.warehouse_id AND w.company_id=@companyId
    JOIN eligible_bins eb ON eb.warehouse_id=wi.warehouse_id
)
INSERT INTO bin_inventory (bin_location_id,product_id,quantity,last_updated,version)
SELECT d.bin_id,d.product_id,d.quantity,@now,0
FROM distribution d
WHERE d.rn=d.first_rn;

UPDATE b SET capacity=x.required_capacity,updated_at=@now
FROM bin_locations b
JOIN (
    SELECT bi.bin_location_id,
           CAST(CEILING(SUM(bi.quantity)*1.20+10) AS DECIMAL(12,2)) required_capacity
    FROM bin_inventory bi GROUP BY bi.bin_location_id
) x ON x.bin_location_id=b.id
JOIN warehouses w ON w.id=b.warehouse_id AND w.company_id=@companyId
WHERE b.capacity<x.required_capacity;

UPDATE z SET capacity=x.required_capacity,updated_at=@now
FROM warehouse_zones z
JOIN (
    SELECT b.zone_id,CAST(CEILING(SUM(b.capacity)*1.10) AS DECIMAL(12,2)) required_capacity
    FROM bin_locations b GROUP BY b.zone_id
) x ON x.zone_id=z.id
JOIN warehouses w ON w.id=z.warehouse_id AND w.company_id=@companyId
WHERE z.capacity<x.required_capacity;

UPDATE w SET capacity=x.required_capacity,updated_at=@now
FROM warehouses w
JOIN (
    SELECT wi.warehouse_id,CAST(CEILING(SUM(wi.quantity)*1.20) AS DECIMAL(38,2)) required_capacity
    FROM warehouse_inventory wi GROUP BY wi.warehouse_id
) x ON x.warehouse_id=w.id
WHERE w.company_id=@companyId AND w.capacity<x.required_capacity;

/* Expand the fleet from 12 to 36 vehicles using real reference brand/model rows. */
;WITH numbers AS (
    SELECT TOP (24) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rn FROM sys.all_objects
),
models AS (
    SELECT vm.id,ROW_NUMBER() OVER (ORDER BY vb.name,vm.name) AS rn,
           COUNT(*) OVER () AS total_models
    FROM vehicle_models vm JOIN vehicle_brands vb ON vb.id=vm.brand_id WHERE vm.active=1 AND vb.active=1
)
INSERT INTO vehicles
    (registration_number,vehicle_model_id,type,capacity,max_weight,max_volume,max_items,fuel_type,
     year_of_production,status,active,updated_at,company_id,version)
SELECT CONCAT(CASE n.rn%6 WHEN 0 THEN N'SU' WHEN 1 THEN N'BG' WHEN 2 THEN N'NS'
                         WHEN 3 THEN N'NI' WHEN 4 THEN N'KG' ELSE N'PA' END,
              N'-7',RIGHT(N'00'+CAST(n.rn AS NVARCHAR(2)),2),N'-TF'),
       m.id,
       CASE WHEN n.rn%4=0 THEN N'BOX_TRUCK' WHEN n.rn%4=1 THEN N'VAN'
            WHEN n.rn%4=2 THEN N'TRUCK' ELSE N'SEMI_TRUCK' END,
       CASE WHEN n.rn%4=1 THEN 12 ELSE 33 END,
       CASE WHEN n.rn%4=1 THEN 3500 WHEN n.rn%4=0 THEN 12000 ELSE 22000 END,
       CASE WHEN n.rn%4=1 THEN 18 WHEN n.rn%4=0 THEN 45 ELSE 86 END,
       CASE WHEN n.rn%4=1 THEN 45 ELSE 160 END,N'DIESEL',2018+(n.rn%7),
       CASE WHEN n.rn IN (23,24) THEN N'MAINTENANCE' ELSE N'AVAILABLE' END,
       1,@now,@companyId,0
FROM numbers n
JOIN models m ON m.rn=((n.rn-1)%m.total_models)+1
WHERE NOT EXISTS (
    SELECT 1 FROM vehicles v
    WHERE v.registration_number=CONCAT(CASE n.rn%6 WHEN 0 THEN N'SU' WHEN 1 THEN N'BG' WHEN 2 THEN N'NS'
        WHEN 3 THEN N'NI' WHEN 4 THEN N'KG' ELSE N'PA' END,N'-7',RIGHT(N'00'+CAST(n.rn AS NVARCHAR(2)),2),N'-TF')
);

/* Five dated records per vehicle: four completed services and one current/future record. */
;WITH service_numbers AS (
    SELECT v.id AS vehicle_id,v.status,seq.n
    FROM vehicles v
    CROSS JOIN (VALUES(1),(2),(3),(4),(5)) seq(n)
    WHERE v.company_id=@companyId
)
INSERT INTO vehicle_maintenance
    (vehicle_id,company_id,type,status,scheduled_at,started_at,completed_at,cancelled_at,
     odometer,cost,notes,cancel_reason,created_at,updated_at)
SELECT s.vehicle_id,@companyId,
       CASE s.n WHEN 1 THEN N'ROUTINE_SERVICE' WHEN 2 THEN N'OIL_CHANGE'
            WHEN 3 THEN N'INSPECTION' WHEN 4 THEN N'TIRE_CHANGE' ELSE N'REPAIR' END,
       CASE WHEN s.n=5 AND s.status=N'MAINTENANCE' THEN N'IN_PROGRESS'
            WHEN s.n=5 THEN N'PLANNED' ELSE N'COMPLETED' END,
       CASE WHEN s.n=5 THEN DATEADD(DAY,14+(s.vehicle_id%20),@now)
            ELSE DATEADD(DAY,-s.n*75-(s.vehicle_id%20),@now) END,
       CASE WHEN s.n=5 AND s.status<>N'MAINTENANCE' THEN NULL
            WHEN s.n=5 THEN DATEADD(HOUR,-6,@now)
            ELSE DATEADD(DAY,-s.n*75-(s.vehicle_id%20),@now) END,
       CASE WHEN s.n<5 THEN DATEADD(HOUR,6,DATEADD(DAY,-s.n*75-(s.vehicle_id%20),@now)) ELSE NULL END,
       NULL,65000+s.vehicle_id*311+s.n*420,
       CASE WHEN s.n<5 THEN CAST(180+s.n*95 AS DECIMAL(12,2)) ELSE NULL END,
       N'Plan održavanja voznog parka',NULL,
       DATEADD(DAY,-s.n*75-(s.vehicle_id%20)-3,@now),@now
FROM service_numbers s
WHERE NOT EXISTS (
    SELECT 1 FROM vehicle_maintenance m
    WHERE m.vehicle_id=s.vehicle_id AND m.notes=N'Plan održavanja voznog parka'
      AND m.type=CASE s.n WHEN 1 THEN N'ROUTINE_SERVICE' WHEN 2 THEN N'OIL_CHANGE'
                      WHEN 3 THEN N'INSPECTION' WHEN 4 THEN N'TIRE_CHANGE' ELSE N'REPAIR' END
);

/* Make the 300 legacy orders temporally coherent and resource-conflict free. */
;WITH orders_ranked AS (
    SELECT t.id,ROW_NUMBER() OVER (ORDER BY t.order_number) rn
    FROM transport_orders t WHERE t.order_number LIKE N'TFS-TO-2026-%'
),
vehicles_ranked AS (
    SELECT v.id,ROW_NUMBER() OVER (ORDER BY v.id) rn,COUNT(*) OVER () cnt
    FROM vehicles v WHERE v.company_id=@companyId AND v.status<>N'MAINTENANCE'
),
drivers_ranked AS (
    SELECT e.id,ROW_NUMBER() OVER (ORDER BY e.id) rn,COUNT(*) OVER () cnt
    FROM employees e WHERE e.company_id=@companyId AND e.position=N'DRIVER'
)
UPDATE t
SET status=CASE WHEN o.rn<=240 THEN N'DELIVERED'
                WHEN o.rn<=252 THEN N'CANCELLED'
                WHEN o.rn<=264 THEN N'FAILED'
                WHEN o.rn<=268 THEN N'IN_TRANSIT'
                ELSE N'ASSIGNED' END,
    departure_time=CASE
        WHEN o.rn<=240 THEN DATEADD(DAY,-310+o.rn,DATEADD(HOUR,6,CAST(@today AS DATETIME2)))
        WHEN o.rn<=252 THEN NULL
        WHEN o.rn<=264 THEN DATEADD(DAY,-40+(o.rn-252)*2,DATEADD(HOUR,7,CAST(@today AS DATETIME2)))
        WHEN o.rn<=268 THEN DATEADD(HOUR,-2,@now)
        ELSE DATEADD(DAY,o.rn-268,DATEADD(HOUR,6,CAST(@today AS DATETIME2))) END,
    planned_arrival_time=CASE
        WHEN o.rn BETWEEN 241 AND 252 THEN DATEADD(DAY,o.rn-240,DATEADD(HOUR,14,CAST(@today AS DATETIME2)))
        WHEN o.rn<=240 THEN DATEADD(HOUR,8,DATEADD(DAY,-310+o.rn,DATEADD(HOUR,6,CAST(@today AS DATETIME2))))
        WHEN o.rn<=264 THEN DATEADD(HOUR,8,DATEADD(DAY,-40+(o.rn-252)*2,DATEADD(HOUR,7,CAST(@today AS DATETIME2))))
        WHEN o.rn<=268 THEN DATEADD(HOUR,6,@now)
        ELSE DATEADD(DAY,o.rn-268,DATEADD(HOUR,14,CAST(@today AS DATETIME2))) END,
    actual_arrival_time=CASE
        WHEN o.rn<=240 THEN DATEADD(HOUR,7,DATEADD(DAY,-310+o.rn,DATEADD(HOUR,6,CAST(@today AS DATETIME2))))
        WHEN o.rn BETWEEN 253 AND 264 THEN DATEADD(HOUR,4,DATEADD(DAY,-40+(o.rn-252)*2,DATEADD(HOUR,7,CAST(@today AS DATETIME2))))
        ELSE NULL END,
    vehicle_id=CASE WHEN o.rn<=268 THEN vh.id ELSE vf.id END,
    assigned_employee_id=d.id,
    updated_at=@now
FROM transport_orders t
JOIN orders_ranked o ON o.id=t.id
JOIN vehicles_ranked vh ON vh.rn=((o.rn-1)%4)+1
LEFT JOIN vehicles_ranked vf ON o.rn>268 AND vf.rn=((o.rn-269)%(vh.cnt-4))+5
JOIN drivers_ranked d ON d.rn=((o.rn-1)%d.cnt)+1;

UPDATE v SET status=CASE WHEN active_order.id IS NOT NULL THEN N'IN_USE'
                         WHEN future_order.id IS NOT NULL THEN N'RESERVED'
                         ELSE N'AVAILABLE' END,
             updated_at=@now
FROM vehicles v
OUTER APPLY (
    SELECT TOP (1) t.id FROM transport_orders t
    WHERE t.vehicle_id=v.id AND t.status=N'IN_TRANSIT'
) active_order
OUTER APPLY (
    SELECT TOP (1) t.id FROM transport_orders t
    WHERE t.vehicle_id=v.id AND t.status=N'ASSIGNED'
) future_order
WHERE v.company_id=@companyId AND v.status<>N'MAINTENANCE';

/* Enforce item lifecycle quantity invariants on the legacy high-volume rows. */
UPDATE i
SET reserved_quantity=CASE WHEN t.status IN (N'DRAFT',N'CANCELLED') THEN 0
                           WHEN i.reserved_quantity>i.quantity THEN i.quantity ELSE i.reserved_quantity END,
    dispatched_quantity=CASE WHEN t.status IN (N'DRAFT',N'ASSIGNED',N'PICKING',N'PACKING',N'READY_FOR_LOADING',N'CANCELLED') THEN 0
                             WHEN i.dispatched_quantity>i.quantity THEN i.quantity ELSE i.dispatched_quantity END,
    delivered_quantity=CASE WHEN t.status=N'DELIVERED' THEN
                                 CASE WHEN i.delivered_quantity>i.quantity THEN i.quantity ELSE i.delivered_quantity END
                            ELSE 0 END
FROM transport_order_items i JOIN transport_orders t ON t.id=i.transport_order_id
WHERE t.order_number LIKE N'TFS-TO-2026-%';

UPDATE m
SET scheduled_at=CASE WHEN m.started_at IS NOT NULL AND m.scheduled_at>m.started_at THEN m.started_at ELSE m.scheduled_at END,
    started_at=CASE WHEN m.status=N'PLANNED' THEN NULL ELSE m.started_at END,
    completed_at=CASE WHEN m.status IN (N'PLANNED',N'IN_PROGRESS') THEN NULL ELSE m.completed_at END,
    updated_at=@now
FROM vehicle_maintenance m
WHERE m.company_id=@companyId;

/*
 * V15 shifts were intentionally dense performance rows and overlap.  No table
 * owns a FK to shifts, so replace only Titan rows with a conflict-free,
 * relative-time roster: one eight-hour shift per employee/day.
 */
DELETE s
FROM shifts s JOIN employees e ON e.id=s.employee_id
WHERE e.company_id=@companyId;

;WITH days AS (
    SELECT n FROM (VALUES(-12),(-11),(-10),(-9),(-8),(-7),(-6),(-5),(-4),(-3),
                         (-2),(-1),(0),(1),(2)) d(n)
),
staff AS (
    SELECT e.id,e.primary_warehouse_id,ROW_NUMBER() OVER (ORDER BY e.id) AS rn
    FROM employees e WHERE e.company_id=@companyId
)
INSERT INTO shifts (start_time,end_time,timezone_id,status,notes,warehouse_id,employee_id)
SELECT DATEADD(HOUR,CASE s.rn%3 WHEN 0 THEN 6 WHEN 1 THEN 14 ELSE 22 END,
               DATEADD(DAY,d.n,CAST(@today AS DATETIME2))),
       DATEADD(HOUR,CASE s.rn%3 WHEN 0 THEN 14 WHEN 1 THEN 22 ELSE 30 END,
               DATEADD(DAY,d.n,CAST(@today AS DATETIME2))),
       @timezoneId,
       CASE WHEN d.n<0 THEN N'FINISHED'
            WHEN d.n>0 THEN N'PLANNED'
            WHEN @now >= DATEADD(HOUR,CASE s.rn%3 WHEN 0 THEN 6 WHEN 1 THEN 14 ELSE 22 END,CAST(@today AS DATETIME2))
             AND @now < DATEADD(HOUR,CASE s.rn%3 WHEN 0 THEN 14 WHEN 1 THEN 22 ELSE 30 END,CAST(@today AS DATETIME2))
            THEN N'ACTIVE' ELSE N'PLANNED' END,
       CASE s.rn%3 WHEN 0 THEN N'Jutarnja smena' WHEN 1 THEN N'Popodnevna smena' ELSE N'Noćna smena' END,
       COALESCE(s.primary_warehouse_id,(SELECT TOP (1) id FROM warehouses WHERE company_id=@companyId ORDER BY id)),s.id
FROM staff s CROSS JOIN days d;

/* Add inventory count history for every warehouse and all lifecycle states. */
;WITH numbers AS (
    SELECT TOP (60) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rn FROM sys.all_objects
),
warehouses_ranked AS (
    SELECT id,ROW_NUMBER() OVER (ORDER BY id) rn FROM warehouses WHERE company_id=@companyId
),
managers AS (
    SELECT u.id,ROW_NUMBER() OVER (ORDER BY u.id) rn,COUNT(*) OVER () cnt
    FROM users u JOIN employees e ON e.user_id=u.id
    WHERE e.company_id=@companyId AND e.position IN (N'WAREHOUSE_MANAGER',N'COMPANY_ADMIN')
)
INSERT INTO inventory_count_sessions
    (code,description,status,warehouse_id,created_by_user_id,reviewed_by_user_id,reviewed_at,created_at,updated_at,version)
SELECT CONCAT(N'TFS-COUNT-',RIGHT(N'000'+CAST(n.rn AS NVARCHAR(3)),3)),
       CONCAT(N'Ciklični popis broj ',n.rn),
       CASE n.rn%6 WHEN 0 THEN N'DRAFT' WHEN 1 THEN N'OPEN' WHEN 2 THEN N'COUNTING'
            WHEN 3 THEN N'REVIEW' WHEN 4 THEN N'APPROVED' ELSE N'CANCELLED' END,
       w.id,m.id,
       CASE WHEN n.rn%6 IN (4,5) THEN m.id ELSE NULL END,
       CASE WHEN n.rn%6 IN (4,5) THEN DATEADD(DAY,-(n.rn%45),@now) ELSE NULL END,
       DATEADD(DAY,-60+n.rn,@now),@now,0
FROM numbers n
JOIN warehouses_ranked w ON w.rn=((n.rn-1)%6)+1
JOIN managers m ON m.rn=((n.rn-1)%m.cnt)+1
WHERE NOT EXISTS (
    SELECT 1 FROM inventory_count_sessions s
    WHERE s.code=CONCAT(N'TFS-COUNT-',RIGHT(N'000'+CAST(n.rn AS NVARCHAR(3)),3))
);

;WITH product_rank AS (
    SELECT id,ROW_NUMBER() OVER (ORDER BY id) rn FROM products WHERE company_id=@companyId
),
session_rank AS (
    SELECT id,warehouse_id,ROW_NUMBER() OVER (ORDER BY code) rn
    FROM inventory_count_sessions WHERE code LIKE N'TFS-COUNT-%'
),
line_numbers AS (
    SELECT TOP (20) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) rn FROM sys.all_objects
)
INSERT INTO inventory_count_lines
    (session_id,product_id,system_quantity,counted_quantity,difference_quantity,note,adjustment_movement_id,bin_location_id,version)
SELECT s.id,p.id,wi.quantity,
       CASE WHEN s.rn%6=0 THEN NULL ELSE wi.quantity END,
       CAST(0 AS DECIMAL(12,2)),N'Kontrolna linija bez utvrđenog odstupanja',NULL,
       (SELECT TOP (1) b.id FROM bin_locations b WHERE b.warehouse_id=s.warehouse_id ORDER BY b.id),0
FROM session_rank s CROSS JOIN line_numbers ln
JOIN product_rank p ON p.rn=((s.rn*17+ln.rn-2)%120)+1
JOIN warehouse_inventory wi ON wi.warehouse_id=s.warehouse_id AND wi.product_id=p.id
WHERE NOT EXISTS (
    SELECT 1 FROM inventory_count_lines l
    WHERE l.session_id=s.id AND l.product_id=p.id AND
          ISNULL(l.bin_location_id,-1)=ISNULL((SELECT TOP (1) b.id FROM bin_locations b WHERE b.warehouse_id=s.warehouse_id ORDER BY b.id),-1)
);

/* Representative employee self-service requests in all real statuses. */
;WITH staff AS (
    SELECT TOP (50) e.id,e.user_id,ROW_NUMBER() OVER (ORDER BY e.id) rn
    FROM employees e WHERE e.company_id=@companyId AND e.email LIKE N'tfs.%@titanfreight.rs'
),
reviewer AS (
    SELECT TOP (1) u.id FROM users u JOIN roles r ON r.id=u.role_id
    WHERE u.company_id=@companyId AND r.name=N'HR_MANAGER' ORDER BY u.id
)
INSERT INTO employee_profile_change_requests
    (employee_id,requested_by_user_id,company_id,status,requested_changes_json,reason,
     reviewed_by_user_id,reviewed_at,rejection_reason,created_at,updated_at,version)
SELECT s.id,s.user_id,
       @companyId,
       CASE s.rn%4 WHEN 0 THEN N'PENDING' WHEN 1 THEN N'APPLIED' WHEN 2 THEN N'REJECTED' ELSE N'CANCELLED' END,
       CONCAT(N'{"address":"Nova poslovna adresa ',s.rn,N'"}'),
       N'Usklađivanje kontakt adrese zaposlenog',
       CASE WHEN s.rn%4 IN (1,2) THEN r.id ELSE NULL END,
       CASE WHEN s.rn%4 IN (1,2) THEN DATEADD(DAY,-s.rn,@now) ELSE NULL END,
       CASE WHEN s.rn%4=2 THEN N'Adresa nije mogla biti potvrđena' ELSE NULL END,
       DATEADD(DAY,-s.rn-2,@now),@now,0
FROM staff s JOIN employees e ON e.id=s.id CROSS JOIN reviewer r
WHERE NOT EXISTS (
    SELECT 1 FROM employee_profile_change_requests q
    WHERE q.employee_id=s.id AND q.requested_changes_json=CONCAT(N'{"address":"Nova poslovna adresa ',s.rn,N'"}')
);

/*
 * Critical post-seed validation. These checks intentionally run before COMMIT
 * so any inconsistent enterprise data rolls back together with this migration.
 */
IF EXISTS (
    SELECT 1
    FROM warehouse_inventory wi
    JOIN warehouses w ON w.id=wi.warehouse_id
    WHERE w.company_id=@companyId
      AND (wi.quantity<0 OR wi.reserved_quantity<0 OR wi.reserved_quantity>wi.quantity)
)
BEGIN
    THROW 51101, 'V45 validation failed: invalid warehouse inventory quantities.', 1;
END;

IF EXISTS (
    SELECT 1
    FROM bin_inventory bi
    JOIN bin_locations b ON b.id=bi.bin_location_id
    JOIN warehouses w ON w.id=b.warehouse_id
    WHERE w.company_id=@companyId AND bi.quantity<0
)
BEGIN
    THROW 51102, 'V45 validation failed: negative bin inventory.', 1;
END;

IF EXISTS (
    SELECT 1
    FROM warehouse_inventory wi
    JOIN warehouses w ON w.id=wi.warehouse_id AND w.company_id=@companyId
    LEFT JOIN bin_locations b ON b.warehouse_id=wi.warehouse_id
    LEFT JOIN bin_inventory bi ON bi.bin_location_id=b.id AND bi.product_id=wi.product_id
    WHERE w.bin_tracking_enabled=1
    GROUP BY wi.warehouse_id,wi.product_id,wi.quantity
    HAVING wi.quantity<>COALESCE(SUM(bi.quantity),0)
)
BEGIN
    THROW 51103, 'V45 validation failed: warehouse and bin inventory differ.', 1;
END;

IF EXISTS (
    SELECT 1
    FROM bin_locations b
    JOIN warehouses w ON w.id=b.warehouse_id AND w.company_id=@companyId
    JOIN bin_inventory bi ON bi.bin_location_id=b.id
    GROUP BY b.id,b.capacity
    HAVING SUM(bi.quantity)>b.capacity
)
BEGIN
    THROW 51104, 'V45 validation failed: bin capacity exceeded.', 1;
END;

IF EXISTS (
    SELECT 1
    FROM transport_order_items i
    JOIN transport_orders t ON t.id=i.transport_order_id
    JOIN warehouses w ON w.id=t.source_warehouse_id AND w.company_id=@companyId
    WHERE i.quantity<=0 OR i.reserved_quantity<0 OR i.dispatched_quantity<0 OR i.delivered_quantity<0
       OR i.reserved_quantity>i.quantity OR i.dispatched_quantity>i.quantity OR i.delivered_quantity>i.quantity
)
BEGIN
    THROW 51105, 'V45 validation failed: invalid transport item quantities.', 1;
END;

IF EXISTS (
    SELECT 1
    FROM transport_orders t
    JOIN warehouses sw ON sw.id=t.source_warehouse_id
    JOIN warehouses dw ON dw.id=t.destination_warehouse_id
    JOIN vehicles v ON v.id=t.vehicle_id
    JOIN employees e ON e.id=t.assigned_employee_id
    JOIN users u ON u.id=t.created_by_user_id
    WHERE sw.company_id=@companyId
      AND (dw.company_id<>@companyId OR v.company_id<>@companyId
           OR e.company_id<>@companyId OR u.company_id<>@companyId)
)
BEGIN
    THROW 51106, 'V45 validation failed: transport company scope mismatch.', 1;
END;

IF EXISTS (
    SELECT 1
    FROM transport_orders t
    JOIN warehouses w ON w.id=t.source_warehouse_id AND w.company_id=@companyId
    WHERE (t.status=N'DELIVERED' AND
           (t.departure_time IS NULL OR t.actual_arrival_time IS NULL
            OR t.actual_arrival_time<t.departure_time OR t.actual_arrival_time>@SeedNow))
       OR (t.status IN (N'DRAFT',N'ASSIGNED',N'PICKING',N'PACKING',N'READY_FOR_LOADING',N'LOADING',N'IN_TRANSIT',N'RETURNING')
           AND t.actual_arrival_time IS NOT NULL)
)
BEGIN
    THROW 51107, 'V45 validation failed: transport status and timestamps conflict.', 1;
END;

IF EXISTS (
    SELECT 1
    FROM transport_orders t
    JOIN warehouses w ON w.id=t.source_warehouse_id AND w.company_id=@companyId
    JOIN vehicles v ON v.id=t.vehicle_id
    JOIN employees e ON e.id=t.assigned_employee_id
    JOIN warehouses sw ON sw.id=t.source_warehouse_id
    JOIN warehouses dw ON dw.id=t.destination_warehouse_id
    WHERE t.status IN (N'ASSIGNED',N'PICKING',N'PACKING',N'READY_FOR_LOADING',N'LOADING',N'IN_TRANSIT',N'RETURNING')
      AND (v.active=0 OR v.status IN (N'MAINTENANCE',N'OUT_OF_SERVICE',N'AVAILABLE')
           OR e.active=0 OR sw.active=0 OR sw.status<>N'ACTIVE'
           OR dw.active=0 OR dw.status<>N'ACTIVE')
)
BEGIN
    THROW 51108, 'V45 validation failed: active transport uses an unavailable resource.', 1;
END;

IF EXISTS (
    SELECT 1
    FROM transport_orders a
    JOIN transport_orders b ON b.vehicle_id=a.vehicle_id AND b.id>a.id
      AND a.departure_time<b.planned_arrival_time
      AND b.departure_time<a.planned_arrival_time
    JOIN warehouses w ON w.id=a.source_warehouse_id AND w.company_id=@companyId
    WHERE a.status NOT IN (N'DRAFT',N'CANCELLED',N'FAILED')
      AND b.status NOT IN (N'DRAFT',N'CANCELLED',N'FAILED')
)
BEGIN
    THROW 51109, 'V45 validation failed: overlapping vehicle transports.', 1;
END;

IF EXISTS (
    SELECT 1
    FROM transport_orders a
    JOIN transport_orders b ON b.assigned_employee_id=a.assigned_employee_id AND b.id>a.id
      AND a.departure_time<b.planned_arrival_time
      AND b.departure_time<a.planned_arrival_time
    JOIN warehouses w ON w.id=a.source_warehouse_id AND w.company_id=@companyId
    WHERE a.status NOT IN (N'DRAFT',N'CANCELLED',N'FAILED')
      AND b.status NOT IN (N'DRAFT',N'CANCELLED',N'FAILED')
)
BEGIN
    THROW 51110, 'V45 validation failed: overlapping driver transports.', 1;
END;

IF EXISTS (
    SELECT 1
    FROM shifts a
    JOIN employees e ON e.id=a.employee_id AND e.company_id=@companyId
    JOIN shifts b ON b.employee_id=a.employee_id AND b.id>a.id
      AND a.start_time<b.end_time AND b.start_time<a.end_time
    WHERE a.status<>N'CANCELLED' AND b.status<>N'CANCELLED'
)
BEGIN
    THROW 51111, 'V45 validation failed: overlapping employee shifts.', 1;
END;

IF EXISTS (
    SELECT 1
    FROM vehicle_maintenance m
    WHERE m.company_id=@companyId
      AND ((m.status=N'COMPLETED' AND
            (m.started_at IS NULL OR m.completed_at IS NULL
             OR m.completed_at<m.started_at OR m.completed_at>@SeedNow))
        OR (m.status IN (N'PLANNED',N'IN_PROGRESS') AND m.completed_at IS NOT NULL))
)
BEGIN
    THROW 51112, 'V45 validation failed: maintenance status and timestamps conflict.', 1;
END;

IF EXISTS (
    SELECT 1
    FROM inventory_count_sessions s
    JOIN warehouses w ON w.id=s.warehouse_id AND w.company_id=@companyId
    LEFT JOIN inventory_count_lines l ON l.session_id=s.id
    WHERE s.status IN (N'REVIEW',N'APPROVED',N'ADJUSTMENTS_CREATED',N'CLOSED',N'REJECTED')
    GROUP BY s.id
    HAVING COUNT(l.id)=0
)
BEGIN
    THROW 51113, 'V45 validation failed: inventory count session has no lines.', 1;
END;

COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
