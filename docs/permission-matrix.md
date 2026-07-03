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
