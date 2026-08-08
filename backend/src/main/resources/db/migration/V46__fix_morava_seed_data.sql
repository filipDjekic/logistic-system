/*
 * Correct data written by V45 so it matches the current enum mappings and the
 * EmployeeEmailGenerator contract. Every mutation is scoped to Morava through
 * its tax and registration numbers; passwords and historical snapshots are not changed.
 */
SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
BEGIN TRANSACTION;

DECLARE @Now DATETIME2(3)=SYSUTCDATETIME();
DECLARE @CompanyId BIGINT;
DECLARE @CompanySlug NVARCHAR(40)=N'morava-cold-chain-d-o-o';

IF (SELECT COUNT(*) FROM companies WHERE tax_number=N'118462730' AND registration_number=N'22916485')<>1
    THROW 51200,'V46 correction failed: Morava company business key is missing or ambiguous.',1;

SELECT @CompanyId=id
FROM companies
WHERE tax_number=N'118462730' AND registration_number=N'22916485';

IF NOT EXISTS(SELECT 1 FROM companies WHERE id=@CompanyId AND name=N'Morava Cold Chain d.o.o.')
    THROW 51201,'V46 correction failed: Morava company identity does not match the expected legal name.',1;

/* ProductUnit is PIECE, KG, LITER, PALLET, BOX. Fresh-berry CRATE rows are boxed cold-chain packages. */
UPDATE products
SET unit=N'BOX',updated_at=@Now
WHERE company_id=@CompanyId AND unit=N'CRATE';

/* CompanyService generates contact@<normalized-company>.<ISO2>. */
UPDATE c
SET email=CONCAT(N'contact@',@CompanySlug,N'.',LOWER(country.code)),updated_at=@Now
FROM companies c
JOIN countries country ON country.id=c.country_id
WHERE c.id=@CompanyId;

DECLARE @EmailBase TABLE(
    employee_id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    local_part NVARCHAR(40) NOT NULL,
    domain_part NVARCHAR(130) NOT NULL
);

INSERT INTO @EmailBase(employee_id,user_id,local_part,domain_part)
SELECT e.id,e.user_id,
       CONCAT(
           REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LOWER(e.first_name),N'đ',N'dj'),N'č',N'c'),N'ć',N'c'),N'š',N's'),N'ž',N'z'),
           N'.',
           REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LOWER(e.last_name),N'đ',N'dj'),N'č',N'c'),N'ć',N'c'),N'š',N's'),N'ž',N'z')
       ),
       CONCAT(@CompanySlug,N'.',LOWER(REPLACE(e.position,N'_',N'-')),N'.',LOWER(country.code))
FROM employees e
JOIN users u ON u.id=e.user_id AND u.company_id=@CompanyId
JOIN countries country ON country.id=e.country_id
WHERE e.company_id=@CompanyId;

IF (SELECT COUNT(*) FROM @EmailBase)<>(SELECT COUNT(*) FROM employees WHERE company_id=@CompanyId)
    THROW 51202,'V46 correction failed: a Morava employee has no company-scoped linked user.',1;

IF EXISTS(
    SELECT local_part,domain_part FROM @EmailBase
    GROUP BY local_part,domain_part HAVING COUNT(*)>1
)
    THROW 51203,'V46 correction failed: duplicate Morava base emails require an unsupported ambiguous creation order.',1;

DECLARE @EmailMap TABLE(
    employee_id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    expected_email NVARCHAR(255) NOT NULL UNIQUE
);

;WITH numbers AS (
    SELECT TOP (1000) ROW_NUMBER() OVER(ORDER BY (SELECT NULL)) n
    FROM sys.all_objects
)
INSERT INTO @EmailMap(employee_id,user_id,expected_email)
SELECT base.employee_id,base.user_id,candidate.expected_email
FROM @EmailBase base
CROSS APPLY(
    SELECT TOP (1)
           CONCAT(base.local_part,CASE WHEN numbers.n=1 THEN N'' ELSE CAST(numbers.n AS NVARCHAR(10)) END,N'@',base.domain_part) expected_email
    FROM numbers
    WHERE NOT EXISTS(
              SELECT 1 FROM users u
              WHERE (u.company_id IS NULL OR u.company_id<>@CompanyId)
                AND LOWER(u.email)=LOWER(CONCAT(base.local_part,CASE WHEN numbers.n=1 THEN N'' ELSE CAST(numbers.n AS NVARCHAR(10)) END,N'@',base.domain_part))
          )
      AND NOT EXISTS(
              SELECT 1 FROM employees e
              WHERE e.company_id<>@CompanyId
                AND LOWER(e.email)=LOWER(CONCAT(base.local_part,CASE WHEN numbers.n=1 THEN N'' ELSE CAST(numbers.n AS NVARCHAR(10)) END,N'@',base.domain_part))
          )
    ORDER BY numbers.n
) candidate;

IF (SELECT COUNT(*) FROM @EmailMap)<>(SELECT COUNT(*) FROM @EmailBase)
    THROW 51204,'V46 correction failed: no collision-free generated email was found.',1;

UPDATE u
SET email=m.expected_email,updated_at=@Now
FROM users u
JOIN @EmailMap m ON m.user_id=u.id
WHERE u.company_id=@CompanyId;

UPDATE e
SET email=m.expected_email,
    auto_generated_email=1,
    email_manually_overridden=0,
    email_generation_source=N'EMPLOYEE_CREATE_WITH_USER',
    updated_at=@Now
FROM employees e
JOIN @EmailMap m ON m.employee_id=e.id
WHERE e.company_id=@CompanyId;

/* Runtime enum compatibility: exact values copied from current Java enums. */
IF EXISTS(SELECT 1 FROM products WHERE company_id=@CompanyId AND unit NOT IN(N'PIECE',N'KG',N'LITER',N'PALLET',N'BOX'))
    THROW 51205,'V46 validation failed: Morava product has an unsupported ProductUnit.',1;
IF EXISTS(SELECT 1 FROM employees WHERE company_id=@CompanyId AND position NOT IN(N'OVERLORD',N'COMPANY_ADMIN',N'HR_MANAGER',N'DISPATCHER',N'DRIVER',N'WAREHOUSE_MANAGER',N'WORKER'))
    THROW 51206,'V46 validation failed: Morava employee has an unsupported EmployeePosition.',1;
IF EXISTS(SELECT 1 FROM employee_warehouse_assignments WHERE company_id=@CompanyId AND access_type NOT IN(N'PRIMARY',N'WORKER',N'MANAGER',N'DISPATCH',N'VIEW_ONLY'))
    THROW 51207,'V46 validation failed: Morava warehouse assignment has an unsupported access type.',1;
IF EXISTS(SELECT 1 FROM vehicles WHERE company_id=@CompanyId AND (type NOT IN(N'VAN',N'TRUCK',N'BOX_TRUCK',N'SEMI_TRUCK',N'TANKER',N'PICKUP',N'FORKLIFT') OR status NOT IN(N'AVAILABLE',N'RESERVED',N'IN_USE',N'MAINTENANCE',N'OUT_OF_SERVICE') OR fuel_type NOT IN(N'DIESEL',N'PETROL',N'ELECTRIC',N'HYBRID',N'LPG',N'CNG')))
    THROW 51208,'V46 validation failed: Morava vehicle has an unsupported type or status.',1;
IF EXISTS(SELECT 1 FROM vehicle_maintenance WHERE company_id=@CompanyId AND (type NOT IN(N'ROUTINE_SERVICE',N'REPAIR',N'INSPECTION',N'TIRE_CHANGE',N'OIL_CHANGE',N'CLEANING',N'OTHER') OR status NOT IN(N'PLANNED',N'IN_PROGRESS',N'COMPLETED',N'CANCELLED')))
    THROW 51209,'V46 validation failed: Morava maintenance has an unsupported type or status.',1;
IF EXISTS(SELECT 1 FROM transport_orders t JOIN warehouses w ON w.id=t.source_warehouse_id AND w.company_id=@CompanyId WHERE t.status NOT IN(N'DRAFT',N'ASSIGNED',N'PICKING',N'PACKING',N'READY_FOR_LOADING',N'LOADING',N'IN_TRANSIT',N'DELIVERED',N'FAILED',N'RETURNING',N'RESCHEDULED',N'CANCELLED') OR t.priority NOT IN(N'LOW',N'MEDIUM',N'HIGH',N'URGENT'))
    THROW 51210,'V46 validation failed: Morava transport has an unsupported status or priority.',1;
IF EXISTS(SELECT 1 FROM tasks task JOIN transport_orders t ON t.id=task.transport_order_id JOIN warehouses w ON w.id=t.source_warehouse_id AND w.company_id=@CompanyId WHERE task.task_type NOT IN(N'PICKING',N'PACKING',N'LOADING',N'DRIVING',N'UNLOADING',N'COUNTING',N'MAINTENANCE',N'ADMIN',N'STOCK_MOVEMENT') OR task.status NOT IN(N'NEW',N'OPEN',N'ASSIGNED',N'IN_PROGRESS',N'BLOCKED',N'COMPLETED',N'CANCELLED') OR task.priority NOT IN(N'LOW',N'MEDIUM',N'HIGH',N'URGENT'))
    THROW 51211,'V46 validation failed: Morava task has an unsupported enum value.',1;
IF EXISTS(SELECT 1 FROM shifts s JOIN employees e ON e.id=s.employee_id AND e.company_id=@CompanyId WHERE s.status NOT IN(N'PLANNED',N'ACTIVE',N'FINISHED',N'CANCELLED'))
    THROW 51212,'V46 validation failed: Morava shift has an unsupported status.',1;
IF EXISTS(SELECT 1 FROM internal_warehouse_movements m JOIN warehouses w ON w.id=m.warehouse_id AND w.company_id=@CompanyId WHERE m.status NOT IN(N'COMPLETED',N'CANCELLED'))
    THROW 51213,'V46 validation failed: Morava internal movement has an unsupported status.',1;
IF EXISTS(SELECT 1 FROM inventory_count_sessions s JOIN warehouses w ON w.id=s.warehouse_id AND w.company_id=@CompanyId WHERE s.status NOT IN(N'DRAFT',N'OPEN',N'COUNTING',N'REVIEW',N'APPROVED',N'ADJUSTMENTS_CREATED',N'CLOSED',N'REJECTED',N'CANCELLED'))
    THROW 51214,'V46 validation failed: Morava inventory count has an unsupported status.',1;
IF EXISTS(SELECT 1 FROM stock_movement_requests r JOIN warehouses w ON w.id=r.warehouse_id AND w.company_id=@CompanyId WHERE r.status NOT IN(N'REQUESTED',N'APPROVED',N'REJECTED',N'CANCELLED') OR r.movement_type NOT IN(N'INBOUND',N'OUTBOUND',N'TRANSFER_IN',N'TRANSFER_OUT',N'ADJUSTMENT',N'WRITE_OFF',N'RETURN_IN',N'RETURN_OUT',N'RESERVATION',N'RESERVATION_RELEASE') OR (r.adjustment_direction IS NOT NULL AND r.adjustment_direction NOT IN(N'INCREASE',N'DECREASE')))
    THROW 51215,'V46 validation failed: Morava stock request has an unsupported enum value.',1;
IF EXISTS(SELECT 1 FROM stock_movements m JOIN warehouses w ON w.id=m.warehouse_id AND w.company_id=@CompanyId WHERE m.movement_type NOT IN(N'INBOUND',N'OUTBOUND',N'TRANSFER_IN',N'TRANSFER_OUT',N'ADJUSTMENT',N'WRITE_OFF',N'RETURN_IN',N'RETURN_OUT',N'RESERVATION',N'RESERVATION_RELEASE') OR m.status NOT IN(N'DRAFT',N'PENDING_APPROVAL',N'APPROVED',N'EXECUTED',N'REJECTED',N'CANCELLED',N'REVERSED') OR m.reason_code NOT IN(N'INITIAL_STOCK',N'PURCHASE_RECEIPT',N'MANUAL_INBOUND',N'MANUAL_OUTBOUND',N'TRANSPORT_DISPATCH',N'TRANSPORT_RECEIPT',N'INVENTORY_ADJUSTMENT',N'DAMAGE_WRITE_OFF',N'RETURN_IN',N'RETURN_OUT',N'STOCK_RESERVED',N'RESERVATION_RELEASED',N'CORRECTION') OR m.reference_type NOT IN(N'MANUAL',N'TRANSPORT_ORDER',N'INVENTORY_COUNT',N'PURCHASE_DOCUMENT',N'RETURN_DOCUMENT',N'SYSTEM',N'STOCK_MOVEMENT') OR (m.adjustment_direction IS NOT NULL AND m.adjustment_direction NOT IN(N'INCREASE',N'DECREASE')) OR (m.discrepancy_reason IS NOT NULL AND m.discrepancy_reason NOT IN(N'SHORTAGE',N'OVERAGE',N'DAMAGE',N'PICKING_ERROR',N'RECEIVING_ERROR',N'TRANSPORT_LOSS',N'OTHER')))
    THROW 51216,'V46 validation failed: Morava stock movement has an unsupported enum value.',1;
IF EXISTS(SELECT 1 FROM notifications n JOIN users u ON u.id=n.user_id AND u.company_id=@CompanyId WHERE n.type NOT IN(N'INFO',N'WARNING',N'ERROR',N'SUCCESS') OR n.status NOT IN(N'UNREAD',N'READ',N'ACKNOWLEDGED',N'RESOLVED') OR n.severity NOT IN(N'INFO',N'WARNING',N'CRITICAL',N'SUCCESS') OR n.category NOT IN(N'GENERAL',N'TRANSPORT',N'INVENTORY',N'TASK',N'SHIFT',N'WAREHOUSE',N'SECURITY') OR n.source_type NOT IN(N'SYSTEM',N'TRANSPORT_ORDER',N'WAREHOUSE_INVENTORY',N'STOCK_MOVEMENT',N'TASK',N'SHIFT',N'WAREHOUSE',N'USER'))
    THROW 51217,'V46 validation failed: Morava notification has an unsupported enum value.',1;

IF EXISTS(SELECT 1 FROM @EmailMap m JOIN users u ON u.id=m.user_id JOIN employees e ON e.id=m.employee_id WHERE u.company_id<>@CompanyId OR e.company_id<>@CompanyId OR LOWER(u.email)<>LOWER(m.expected_email) OR LOWER(e.email)<>LOWER(m.expected_email) OR LOWER(u.email)<>LOWER(e.email))
    THROW 51218,'V46 validation failed: Morava user and employee generated emails are inconsistent.',1;
IF EXISTS(SELECT LOWER(email) FROM users GROUP BY LOWER(email) HAVING COUNT(*)>1)
    THROW 51219,'V46 validation failed: generated email conflicts with an existing user.',1;
IF EXISTS(SELECT LOWER(email) FROM employees WHERE company_id=@CompanyId GROUP BY LOWER(email) HAVING COUNT(*)>1)
    THROW 51220,'V46 validation failed: duplicate Morava employee email.',1;

COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
