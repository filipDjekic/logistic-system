# Permission matrix

This document defines the planned access model for the logistics system. It is documentation only and does not change runtime permissions.

Backend is the source of truth for authorization. Frontend permissions must only hide or disable UI actions that the backend already allows or denies.

## Roles

| Role | Main responsibility | Default scope |
| --- | --- | --- |
| `COMPANY_ADMIN` | Company-level administration and full operational overview inside the company. | Company scope |
| `HR_MANAGER` | Employee, user, role, shift and HR-related data management. | Company scope for HR data |
| `DISPATCHER` | Transport planning, task coordination and dispatch operations. | Company scope for dispatch data; assigned transport/task scope where applicable |
| `WAREHOUSE_MANAGER` | Warehouse operations, inventory, counts, stock movement and warehouse task coordination. | Managed warehouse scope for write operations; company scope for read where operationally required |
| `DRIVER` | Driver execution of assigned transport work. | Own/assigned scope |
| `WORKER` | Warehouse execution of assigned warehouse work. | Own/assigned scope |

## Scope rules

### Company scope

Company scope means a user can access records that belong to the authenticated user's company.

Planned rules:

- `COMPANY_ADMIN` can read and manage company-owned operational data unless a module has a stricter lifecycle or ownership rule.
- `HR_MANAGER` can manage HR-owned data inside the company: employees, employee profile change requests, users/roles where allowed, and shifts.
- `DISPATCHER` can work with company transport, dispatch, task and related lookup data needed to plan and execute transport operations.
- `WAREHOUSE_MANAGER` can read company-level operational data when it is needed to coordinate warehouse work, inventory, counts, tasks or movements.
- `DRIVER` and `WORKER` do not receive broad company-scope write access. Their access is limited to their own employee profile, assigned tasks, assigned transport/work records, notifications, comments, attachments and lifecycle actions explicitly allowed by backend policy.

Company scope must never allow access across another company unless the backend explicitly defines a system-level role for that. Cross-company administration is outside this matrix.

### Warehouse scope

Warehouse scope means access is limited by warehouse relationship.

Planned rules:

- `WAREHOUSE_MANAGER` can modify warehouse operational data only for warehouses they manage or are assigned to manage.
- `WAREHOUSE_MANAGER` may view other company warehouses when the screen or operation needs global company context, but write actions remain limited to managed warehouses.
- `WORKER` can access warehouse records only when tied to their assigned warehouse, assigned task, assigned inventory count, assigned stock operation or explicit backend rule.
- `DISPATCHER` may read warehouse lookup and transport-related warehouse data needed to plan transport orders, but should not perform warehouse-only inventory mutations unless backend explicitly allows it.
- `COMPANY_ADMIN` can manage warehouse configuration and company-wide warehouse data unless the operation is protected by lifecycle state or requires warehouse-manager execution.

Warehouse write validation must be enforced in backend services or security helpers, not only in controller annotations and never only in frontend checks.

### Own/assigned scope

Own/assigned scope means a user can access or act on data directly connected to their authenticated user, employee profile, assigned task, assigned transport order, assigned shift, assigned inventory count, notification or operational record.

Planned rules:

- `DRIVER` can read and update execution status only for assigned transport orders, assigned transport-linked tasks and own operational records.
- `WORKER` can read and update execution status only for assigned warehouse tasks, assigned counts, assigned stock operations and own operational records.
- `HR_MANAGER`, `DISPATCHER` and `WAREHOUSE_MANAGER` may access employee/task/operation records according to their module responsibility, but self-service rules still apply for personal profile and notification actions.
- Every role may access its own profile, own notifications and own permitted comments/attachments where backend allows it.
- Assigned users may complete or progress work only through valid lifecycle transitions. They must not skip lifecycle states or modify administrative fields that belong to managers.

Own/assigned checks must be made against authenticated user identity and persisted relationships, not request body values supplied by the client.

## Archive, delete and cancel policy

### General policy

- Prefer archive over hard delete for business records.
- Hard delete is allowed only for records that are safe to remove and have no operational/audit dependency.
- Records with history, lifecycle, inventory effect, transport effect, financial/HR relevance, attachments, comments or audit logs must not be physically deleted by normal business roles.
- Backend must enforce delete/archive/cancel decisions. Frontend can only hide unavailable actions.

### Archive

Archive means the record stays in the database but is removed from normal active views.

Planned rules:

- `COMPANY_ADMIN` may archive company-level master or operational records when backend allows it.
- `HR_MANAGER` may archive HR-owned records where retention rules allow it.
- `DISPATCHER` may archive dispatch-owned drafts or completed operational records where no active lifecycle depends on them.
- `WAREHOUSE_MANAGER` may archive warehouse-owned records inside managed warehouse scope where no active inventory process depends on them.
- `DRIVER` and `WORKER` cannot archive records except personal/user-facing items explicitly allowed by backend policy, such as own notifications where supported.

### Delete

Delete means permanent removal or movement to a deleted state.

Planned rules:

- Delete must be restricted to administrative roles and safe reference data only.
- `COMPANY_ADMIN` may delete only records that backend confirms are not referenced by active operations, audit history or lifecycle state.
- `HR_MANAGER` may delete only HR records that backend confirms are safe to remove.
- `DISPATCHER`, `WAREHOUSE_MANAGER`, `DRIVER` and `WORKER` should not hard-delete operational records.
- Operational entities should use cancel, archive or inactive status instead of delete.

### Cancel

Cancel means stopping an operation through its lifecycle without deleting historical data.

Planned rules:

- `DISPATCHER` may cancel transport orders and dispatch tasks while they are still in cancellable lifecycle states.
- `WAREHOUSE_MANAGER` may cancel warehouse tasks, counts or warehouse operations inside managed warehouse scope while they are still cancellable.
- `COMPANY_ADMIN` may cancel company operations when backend allows administrative override.
- `DRIVER` and `WORKER` cannot cancel whole operations unless backend explicitly defines a self-service exception. They may report blockers, reject assignment or update assigned execution state if that transition exists.
- Cancel must be blocked after irreversible effects, such as finalized inventory changes, completed transport, completed count reconciliation or closed audit workflow.

## Implementation alignment rules

- Controller annotations define coarse role access.
- Services and security helpers must enforce company, warehouse and own/assigned scope.
- Lifecycle services must enforce valid state transitions.
- Frontend route guards, buttons and menus must be aligned with backend rules but must not be treated as security.
- Any future permission change must update this document in the same package as the backend/frontend alignment change.

## Runtime permission consistency snapshot

Last aligned against backend and frontend package input on 2026-07-04.

This project does not currently implement a separate named-permission catalog such as `EMPLOYEE_READ` or `WAREHOUSE_DELETE`. Runtime authorization is role-based through Spring Security annotations, security beans and service-level scope validators. Therefore, the permission matrix is treated as the role/scope access model, not as a database-backed permission registry.

### Backend modules covered by the matrix

| Runtime area | Backend source of truth | Frontend guard/menu alignment |
| --- | --- | --- |
| Companies and company registration requests | `CompanyController`, `CompanyRegistrationRequestController` | OVERLORD-only administration. |
| Employees and HR profile requests | `EmployeeController`, `EmployeeProfileChangeRequestController` | HR module available to OVERLORD, COMPANY_ADMIN and HR_MANAGER; selected operational read access for DISPATCHER and WAREHOUSE_MANAGER follows backend read scope. |
| Users and roles | `UserController`, `RoleController` | OVERLORD/COMPANY_ADMIN/HR_MANAGER read access is represented in routes, module matrix and navigation. Mutation remains backend-restricted. |
| Shifts and own shifts | `ShiftController` | HR_MANAGER and DISPATCHER management/read access is represented; all roles keep own-shift access through dedicated personal route. |
| Warehouses, locations and assignments | `WarehouseController`, `WarehouseLocationController`, `EmployeeWarehouseAssignmentController` | Warehouse module reflects company/warehouse/worker-scoped read access; write access remains backend-enforced. |
| Products and inventory | `ProductController`, `WarehouseInventoryController` | Product/inventory pages expose only backend-allowed read/write role groups. |
| Inventory counts | `InventoryCountController` | OVERLORD/WAREHOUSE_MANAGER lifecycle management; COMPANY_ADMIN/WORKER read/counting access follows backend service scope. |
| Stock movements and movement requests | `StockMovementController`, `StockMovementRequestController` | Read access and worker request flow are represented; direct creation/execution remains manager/dispatcher/backend-scoped as defined by endpoint. |
| Transport orders and transport items | `TransportOrderController`, `TransportOrderItemController` | Dispatcher create/edit; company/warehouse/driver/worker read and lifecycle access are represented where backend allows. |
| Tasks | `TaskController` | Managed task routes and own assigned task access are represented; lifecycle mutations still depend on backend service validation. |
| Vehicles and maintenance | `VehicleController`, `VehicleMaintenanceController`, `VehicleCatalogController` | Vehicle read and maintenance read access match backend roles; maintenance mutation remains OVERLORD/COMPANY_ADMIN only. |
| Reports and data exchange | `ReportsController`, `DataExchangeController` | Report routes and import/export UI are limited to backend-allowed roles. |
| Notifications and profile | `NotificationController`, `ProfileController` | All authenticated roles keep own notification/profile access; administrative notification actions remain backend-restricted. |
| Activity timeline, domain events and change history | `ActivityTimelineController`, `DomainEventController`, `ChangeHistoryController` | Audit screens distinguish global/recent audit access from entity-scoped history. DRIVER/WORKER can open scoped change history through entity context because backend allows scoped history reads. |
| Activity logs | `ActivityLogController` | OVERLORD-only raw logs. |
| Dashboard and lifecycle monitoring | `DashboardController`, `LifecycleMonitoringController` | Dashboard role endpoints match role-specific frontend panels; lifecycle monitoring remains backend-scoped. |
| Public/reference lookups | `CountryController`, `CityController`, `TimezoneController`, `LookupController` | Public reference endpoints are not treated as protected business permissions; protected lookup endpoints follow backend role annotations. |

### Consistency findings applied in this package

- HR_MANAGER already had backend read access for `/api/users` and `/api/roles`, but HR navigation did not expose Users and Roles. Navigation now exposes both modules for HR_MANAGER.
- Change history backend and route guards allow DRIVER and WORKER in scoped/entity-context mode, but `moduleRoleMatrix` did not list them. The module matrix now includes DRIVER and WORKER for `changeHistory`.
- No separate dead named permissions were found because the system has no named permission registry. Existing access is role/scope based.

### Matrix maintenance rule

When a backend endpoint role annotation, security bean or service scope rule changes, update this document and the frontend route/menu/module guard in the same package. Frontend changes must not grant broader access than backend annotations and service validators allow.
