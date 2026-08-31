# Manual E2E Test Plan — Logistic System

> Izvor istine: aktuelni backend/frontend kod i Flyway migracije u ovom checkout-u. Dokument je plan za ručno izvršavanje kroz UI; API putanje su navedene radi dijagnostike lookup-a i permission problema. Ne izvršavati SQL niti ručno menjati bazu.

## Pravila izvršavanja

- Počni sa bazom na kojoj su izvršene sve Flyway migracije. „Prazna” baza ipak sadrži referentne seedove (role, zemlje, gradove, vremenske zone, marke/modele vozila) i seedovanog OVERLORD korisnika.
- OVERLORD login: `filip.djekic@slu.admin.rs`. Lozinku uzmi iz lokalno dogovorene/seed konfiguracije; hash u migraciji ne otkriva plaintext.
- Svi novokreirani korisnici u ovom planu koriste lozinku `Logistika!2026`.
- Datumi transporta moraju biti u budućnosti u trenutku testa. U koracima ispod `T` znači izabrani budući radni dan. Postavi `T` najmanje sutra. Koristi tačne sate iz plana.
- UI prikazuje lokalno vreme iz izabrane vremenske zone. Svuda biraj `Europe/Belgrade`.
- Posle svake mutacije sačekaj success poruku i osveži Details/List prikaz. Ako UI nudi samo trenutno dozvoljene lifecycle akcije, ne pokušavaj da „preskočiš” status.

# Quick execution order

| Step | Login as | Action | Creates/changes | Required for |
|---:|---|---|---|---|
| 1 | Public | Submit company request | PENDING request | Company bootstrap |
| 2 | OVERLORD | Mark under review, approve | Company + COMPANY_ADMIN user/employee | Entire company scope |
| 3 | COMPANY_ADMIN | Create 8 employees with users | HR, dispatcher, 2 managers, 2 workers, 2 drivers | Warehouses, shifts, transport |
| 4 | COMPANY_ADMIN | Create 3 warehouses | BG, NS, Niš; manager links | Locations, inventory, scope |
| 5 | COMPANY_ADMIN | Assign primary warehouses | Employee warehouse scope | Worker/manager lookups |
| 6 | COMPANY_ADMIN / managers | Create zones and bins | Bin-tracked structure | Bin tests |
| 7 | COMPANY_ADMIN | Create 5 products | Company product catalog | Inventory and transport items |
| 8 | Warehouse managers | Create inventory records | Initial stock + INITIAL_STOCK movements | Reservation and dispatch |
| 9 | HR_MANAGER | Create shifts | Driver interval coverage; worker shifts | Transport validation |
| 10 | DISPATCHER | Create 4 vehicles and maintenance case | 3 AVAILABLE + 1 MAINTENANCE | Assignment/filter tests |
| 11 | DISPATCHER | Create transport BG → NS | DRAFT + automatic DRIVING task | Items/reservation |
| 12 | DISPATCHER | Add 3 items (reservation occurs immediately) | Inventory reserved | Operational lifecycle |
| 13 | DISPATCHER / BG manager | ASSIGNED → PICKING → PACKING → READY_FOR_LOADING → LOADING | Automatic operational tasks | Dispatch |
| 14 | DRIVER | LOADING → IN_TRANSIT | Source physical stock decreases; vehicle IN_USE | Delivery |
| 15 | DRIVER | IN_TRANSIT → DELIVERED | Destination inventory increases; vehicle AVAILABLE | Final verification |
| 16 | All relevant roles | Verify tasks, dashboards, notifications, audit | Evidence of complete workflow | Sign-off |

# 1. Code-derived dependency and lifecycle map

## 1.1 Hard dependencies

1. Company request approval atomically creates an active Company, active/enabled COMPANY_ADMIN User and linked COMPANY_ADMIN Employee. The submitted password is retained only until approval.
2. Employee creation from the Employees UI uses `/api/employees/with-user`: Employee and User are created together. A separate pre-existing User is not required.
3. Warehouse create requires an existing active employee whose **position** is exactly `WAREHOUSE_MANAGER`, from the same company. A prior warehouse assignment is not required. Warehouse create links that employee as manager.
4. Zone requires Warehouse; Bin requires both Warehouse and Zone. Bin inventory requires Bin and Product.
5. Product requires only company scope.
6. Inventory record requires Warehouse + Product from the same company. A positive initial quantity is allowed and automatically records an `INBOUND / INITIAL_STOCK` stock movement. Later quantity edits are forbidden; later physical changes must use stock movement/transport/count workflows.
7. Transport requires two different active warehouses, an active DRIVER employee, an AVAILABLE active vehicle, no time overlap/maintenance conflict, and a PLANNED or ACTIVE driver shift covering the entire departure–arrival interval.
8. Transport is created as `DRAFT` with driver and vehicle already selected. It automatically creates a `DRIVING` task. Adding each item immediately reserves its source inventory and sets the reservation expiry. Explicit **Reserve** is a re-reservation operation for a DRAFT whose prior item reservations have expired/been released; it rejects an already active reservation.
9. Normal success path is `DRAFT → ASSIGNED → PICKING → PACKING → READY_FOR_LOADING → LOADING → IN_TRANSIT → DELIVERED` (actual allowed transitions are served by `/api/transport-orders/{id}/status-transitions`).
10. `ASSIGNED` keeps inventory reserved and changes vehicle to `RESERVED`. `IN_TRANSIT` consumes source quantity/reservation, records dispatched/in-transit quantities and changes vehicle to `IN_USE`. `DELIVERED` credits destination inventory, completes item delivery and returns vehicle to `AVAILABLE`.
11. Phase transitions create operational tasks automatically: DRIVING at order creation; PICKING/PACKING/LOADING for the source manager; UNLOADING on delivery for the destination manager. They are not automatically assigned to WORKER employees.

## 1.2 Roles actually implemented

| Role | Main visible pages | Write authority and scope (backend authoritative) |
|---|---|---|
| OVERLORD | Global dashboard, companies/requests, all operational modules, reports, global audit/timeline | Global reads; approves registration; can create across companies. Some lifecycle role matrices intentionally omit OVERLORD, so use company roles for operational transitions. |
| COMPANY_ADMIN | All company workforce, warehouse, transport, fleet, reports, activity logs | Company-wide create/update/archive for employees/users, warehouses, products, inventory, transport, tasks, shifts, vehicles. |
| HR_MANAGER | Employees, users, roles, profile requests, shifts, tasks, employee/task report | Company-scoped workforce management; no warehouse/product/inventory/fleet/transport creation. |
| WAREHOUSE_MANAGER | Managed warehouse/inventory/location modules, company-wide transport reference, employees/shifts reference, tasks, warehouse reports | Mutations limited to managed/assigned warehouse context. Can advance preparation statuses but controller does not allow it to call the generic status PATCH; this mismatch is recorded below. |
| DISPATCHER | Transport, tasks, vehicles, warehouse/product/inventory reference, shifts/drivers, transport report | Company-wide transport/fleet coordination; creates transport/items, reserves and advances all dispatcher-permitted statuses. |
| DRIVER | Own/related transports, tasks, assigned vehicles, own shifts | Related-resource reads; can move own task and own transport through driver-permitted execution transitions. No fleet CRUD. |
| WORKER | Own tasks, assigned transports/stock/inventory/counts, warehouse/product reference, own shifts | Related warehouse/task reads; task lifecycle for assigned work; stock movement create where warehouse scope permits. No transport status PATCH. |

Frontend navigation is not authorization. For every negative permission test, verify both hidden/disabled UI and backend rejection when opening a known URL; do not infer PASS from a hidden menu alone.

# 2. Consistent test dataset

## 2.1 Company and bootstrap administrator

| Field | Value |
|---|---|
| Company | `Dunav Interlogistika d.o.o.` |
| Registration number | `21987654` |
| Tax number | `113456789` |
| Company phone (without country code) | `113300700` |
| Country / city | `Serbia (RS)` / `Belgrade (11000)` |
| Address | `Bulevar Mihajla Pupina 10A` |
| Timezone | `Europe/Belgrade` |
| Admin | `Jelena Marković` |
| Admin JMBG | `1502985715026` |
| Admin phone | `641110001` |
| Admin address | `Jurija Gagarina 45, Beograd` |
| Employment date | `2024-01-15` |
| Generated login | `jelena.markovic@dunav-interlogistika-doo.company-admin.rs` |

The exact generated email is determined by the backend generator (diacritics removed, company/position/country slugs). Confirm the email shown on the public status page after submission; that displayed value is authoritative if a uniqueness suffix is added.

## 2.2 Employees

Create all as `ACTIVE`, enabled, country Serbia, timezone Europe/Belgrade, employment date `2024-02-01`, address as shown, and select the Role whose name equals Position. Leave Primary warehouse empty until warehouses exist.

| Name | Position/Role | JMBG | Phone | Salary (RSD) | Address | Expected generated login |
|---|---|---|---|---:|---|---|
| Ana Ilić | HR_MANAGER | 0101990715001 | 641110002 | 145000 | Kraljice Natalije 18, Beograd | `ana.ilic@dunav-interlogistika-doo.hr-manager.rs` |
| Marko Jovanović | DISPATCHER | 0202990715002 | 641110003 | 150000 | Gandijeva 76, Beograd | `marko.jovanovic@dunav-interlogistika-doo.dispatcher.rs` |
| Nikola Petrović | WAREHOUSE_MANAGER | 0303990715003 | 641110004 | 155000 | Ustanička 120, Beograd | `nikola.petrovic@dunav-interlogistika-doo.warehouse-manager.rs` |
| Milica Nikolić | WAREHOUSE_MANAGER | 0404990715004 | 641110005 | 155000 | Bulevar oslobođenja 82, Novi Sad | `milica.nikolic@dunav-interlogistika-doo.warehouse-manager.rs` |
| Stefan Savić | WORKER | 0505990715005 | 641110006 | 95000 | Vojvode Stepe 210, Beograd | `stefan.savic@dunav-interlogistika-doo.worker.rs` |
| Ivana Đorđević | WORKER | 0606990715006 | 641110007 | 95000 | Futoški put 42, Novi Sad | `ivana.djordjevic@dunav-interlogistika-doo.worker.rs` |
| Luka Stojanović | DRIVER | 0707990715007 | 641110008 | 120000 | Tošin bunar 155, Beograd | `luka.stojanovic@dunav-interlogistika-doo.driver.rs` |
| Nemanja Pavlović | DRIVER | 0808990715008 | 641110009 | 120000 | Bulevar Evrope 33, Novi Sad | `nemanja.pavlovic@dunav-interlogistika-doo.driver.rs` |

## 2.3 Warehouses and locations

| Warehouse | City/address | Capacity | Manager | Bin tracking |
|---|---|---:|---|---|
| Centralni distributivni centar Beograd | Belgrade; Autoput za Zagreb 18 | 12000 | Nikola Petrović | YES |
| Regionalni centar Novi Sad | Novi Sad; Industrijska 12 | 8000 | Milica Nikolić | YES |
| Tranzitni centar Niš | Niš; Bulevar 12. februar 83 | 5000 | Nikola Petrović | NO |

Create BG zones/bins: `BG-PRIJEM / Prijem robe / RECEIVING / 2000`, bin `BG-R-01 / Prijemna pozicija 01 / 500`; `BG-REG / Regalno skladište / STORAGE / 8000`, bins `BG-A-01` and `BG-A-02`, each capacity `1000`. Create NS: `NS-PRIJEM / Prijem robe / RECEIVING / 1500`, bin `NS-R-01 / Prijemna pozicija 01 / 500`; `NS-REG / Regalno skladište / STORAGE / 5000`, bin `NS-A-01 / Regal A pozicija 01 / 1000`. Descriptions are optional; use `Operativna E2E lokacija`.

## 2.4 Products and initial inventory

| Product | SKU | Unit | Price RSD | Fragile | Weight kg | BG qty/min | NS qty/min |
|---|---|---|---:|---|---:|---:|---:|
| Mineralna voda 1.5L paket | DIL-VODA-001 | BOX | 620 | NO | 9.5 | 500 / 100 | 80 / 40 |
| Suncokretovo ulje 1L karton | DIL-ULJE-002 | BOX | 1850 | NO | 12 | 300 / 60 | 50 / 25 |
| LED televizor 43 inča | DIL-TV-003 | PIECE | 38990 | YES | 8.2 | 40 / 10 | 8 / 4 |
| Industrijska folija 50 cm | DIL-FOL-004 | ROLL | 890 | NO | 3.4 | 220 / 50 | 30 / 15 |
| Keramičke pločice Urban siva | DIL-PLO-005 | PALLET | 28500 | YES | 750 | 12 / 3 | 2 / 1 |

Initial inventory creation itself emits INITIAL_STOCK stock movements. Reserved quantity starts at `0`. For bin tracking, allocate only a test subset after aggregate inventory exists: BG-A-01 water `200`, BG-A-02 water `300`; NS-A-01 water `80`. The aggregate and bin totals must not exceed each other according to server validation.

## 2.5 Fleet

Select an existing seeded brand/model compatible with the type; record the exact displayed model in the evidence sheet.

| Registration | Type | Capacity | Max weight | Max volume | Max items | Fuel | Year | Initial status |
|---|---|---:|---:|---:|---:|---|---:|---|
| BG-1234-IL | TRUCK | 12000 | 12000 | 55 | 1200 | DIESEL | 2023 | AVAILABLE |
| BG-5678-IL | VAN | 3500 | 3500 | 18 | 400 | DIESEL | 2022 | AVAILABLE |
| NS-9012-IL | TRUCK | 10000 | 10000 | 45 | 900 | DIESEL | 2021 | AVAILABLE |
| NI-3456-IL | VAN | 3000 | 3000 | 15 | 300 | DIESEL | 2020 | AVAILABLE, then MAINTENANCE via maintenance workflow |

# 3. Phase A — Company onboarding

## Step 1 — Submit Company Creation Request

**LOGIN:** public route `/register-company`  
**ENTER:** all values from §2.1. Company email, admin email and postal code are AUTO-GENERATED/read-only. Password `Logistika!2026`; Notes `Manual E2E bootstrap kompanije`. Confirm review checkbox and submit.

**EXPECTED:** request status `PENDING`; public tracking page displays a non-guessable token and authoritative admin email; OVERLORD receives notification. Save the tracking URL.

## Step 2 — OVERLORD approval

**LOGIN:** `filip.djekic@slu.admin.rs`  
**NAVIGATION:** Registration Requests → open Dunav request.  
**ACTION:** Mark Under Review; expect `UNDER_REVIEW`. Then Approve.

**EXPECTED:** request `APPROVED`; active company, active/enabled COMPANY_ADMIN User and linked COMPANY_ADMIN Employee exist; password no longer appears in request; admin receives approval notification and can log in with generated email and `Logistika!2026`.

### Negative tests — onboarding

- Submit another active request with the same name/registration/tax number: availability chips and backend must reject it.
- Attempt Approve again: backend rejects terminal request.
- Directly open registration-request list as COMPANY_ADMIN: navigation absent and request rejected.

### CHECKPOINT

- 1 approved company; 1 company admin employee/user; request APPROVED; no warehouses/products/inventory.

# 4. Phase B — Workforce before warehouses

## Step 3 — Create employees with users

**LOGIN:** Jelena COMPANY_ADMIN. **NAVIGATION:** Employees → Create employee. Repeat §2.2 in listed order.

For each form select Country `Serbia`, matching City (Belgrade for Ana/Marko/Nikola/Stefan/Luka; Novi Sad for Milica/Ivana/Nemanja), Timezone `Europe/Belgrade`, Position and Role with identical names, status ACTIVE, enabled YES. Email is generated by the form/backend; do not override it. Primary warehouse remains OPTIONAL/empty because warehouses do not exist yet.

**EXPECTED:** one Employee and one linked User per submit; login succeeds; `/api/employees/with-user` is used; company is inherited from authenticated admin.

### Negative tests — workforce

- Duplicate JMBG or email: reject without partial User/Employee.
- Position DRIVER with unrelated Role WORKER: reject or flag mismatch; record actual behavior as a defect if accepted.
- HR_MANAGER attempts to create an employee in another company through a manipulated company id: reject.
- Terminated/inactive employee must disappear from operational assignment lookups.

### CHECKPOINT

- 9 employees/users total including Jelena: 1 COMPANY_ADMIN, 1 HR_MANAGER, 1 DISPATCHER, 2 WAREHOUSE_MANAGER, 2 WORKER, 2 DRIVER; all ACTIVE/enabled.

# 5. Phase C — Warehouses, assignments and bin structure

## Step 4 — Create three warehouses

**LOGIN:** Jelena. **NAVIGATION:** Warehouses → Create warehouse. Use §2.3. Country/City/Timezone are lookups; latitude/longitude OPTIONAL (leave empty); postal code uses the selected city. Manager is an EntityLookup selection.

**PREREQUISITES:** manager ACTIVE, same company, position WAREHOUSE_MANAGER. A prior employee-warehouse assignment is not required.

**EXPECTED:** status `ACTIVE`; manager linked immediately; bin-tracking flag matches input. Nikola may manage both BG and Niš—current validation does not enforce one warehouse per manager.

## Step 5 — Assign employee warehouse scope

From each employee Details/Edit, set Primary warehouse (or use assignment UI if exposed): Nikola/Stefan/Luka → BG; Milica/Ivana/Nemanja → NS. Marko and Ana may remain without warehouse. Confirm worker/manager lookups show only accessible employees where `mode=MANAGED_WAREHOUSE` is used.

## Step 6 — Create zones and bins

Open BG then NS Warehouse Details → Locations. Create zones then their bins exactly as §2.3. Warehouse is fixed or selected first; Zone lookup for a Bin must be filtered by selected Warehouse.

**EXPECTED:** Niš has no bin workflow because bin tracking is disabled; BG/NS location hierarchy is visible and company/warehouse scoped.

### Negative tests — warehouse

- Select inactive employee or non-WAREHOUSE_MANAGER as manager: backend rejects.
- Cross-company manager id or warehouse id: reject/not found.
- Duplicate warehouse name within company: verify backend constraint/service response.
- Create Bin with zone belonging to another warehouse: reject.
- WAREHOUSE_MANAGER Nikola attempts to mutate NS: reject despite company-wide transport reads.

### CHECKPOINT

- 3 ACTIVE warehouses; BG/NS bin tracking enabled; Niš disabled; 4 zones; 4 bins; primary warehouse scope assigned to operational staff.

# 6. Phase D — Products and inventory

## Step 7 — Create products

**LOGIN:** Jelena. **NAVIGATION:** Products → Create. Enter all §2.4 fields. Description: `E2E proizvod Dunav Interlogistike`. Company is inherited/read-only for company admin.

## Step 8 — Create initial inventory

**LOGIN:** Nikola for BG, Milica for NS. **NAVIGATION:** Inventory → Create inventory record. For every product create BG and NS rows using §2.4 quantity/min. Warehouse first, then Product lookup. Reserved is AUTO `0`; unit cost/currency/movement cost are AUTO-derived and not manually entered.

**EXPECTED:** 10 inventory rows and 10 `INBOUND / INITIAL_STOCK` movement records. Available equals Physical because Reserved=0. Add bin allocations listed in §2.4 using Warehouse Details → Locations/Bin inventory.

### Negative tests — inventory

- Duplicate Warehouse+Product record: reject.
- Later edit Quantity directly: backend says quantity can change only through stock movements.
- Reserve `501` cases of water at BG: reject because available is 500.
- Product/warehouse from different company or warehouse outside manager scope: reject.
- Bin allocation greater than aggregate or into bin of another warehouse: reject.

### CHECKPOINT

- 5 products; 10 inventory rows; 10 initial stock movements; BG water `500 physical / 0 reserved / 500 available`; NS water `80/0/80`.

# 7. Phase E — Shifts and fleet

## Step 9 — Create shifts

**LOGIN:** Ana HR_MANAGER. **NAVIGATION:** Shifts → Create.

Set `T` as future date. Create:

- Luka: `T 07:00` to `T 18:00`, Europe/Belgrade, BG warehouse, notes `BG-NS transport coverage`.
- Nemanja: `T 07:00` to `T 15:00`, Europe/Belgrade, NS warehouse, notes `Backup driver shift`.
- Stefan: `T 06:00` to `T 14:00`, BG, notes `Picking and loading`.
- Ivana: `T 12:00` to `T 20:00`, NS, notes `Receiving and unloading`.

New shifts are expected `PLANNED`. Use transport interval `T 09:00`–`T 13:00`, fully covered by Luka.

## Step 10 — Create vehicles and maintenance case

**LOGIN:** Marko DISPATCHER. **NAVIGATION:** Vehicles → Create. Enter §2.5. Then open NI-3456-IL → Maintenance, create planned maintenance starting before `T 13:00`, type `ROUTINE_SERVICE`, description `Redovni servis`, and Start it so vehicle becomes `MAINTENANCE`.

**EXPECTED:** first three remain AVAILABLE; fourth is unavailable to transport lookup/assignment and has active maintenance.

### Negative tests — shifts/fleet

- Shift end before start: frontend blocks and backend rejects.
- Overlapping shift for Luka: backend conflict.
- Cancel finished/already cancelled shift: reject.
- Duplicate registration: reject.
- Assign vehicle with maintenance before planned arrival: reject even if manipulated into lookup.
- Create transport outside Luka’s covering shift or overlapping an existing driver/vehicle interval: reject.

### CHECKPOINT

- 4 PLANNED shifts; 4 vehicles: 3 AVAILABLE, 1 MAINTENANCE; Luka covers `T 09:00–13:00`.

# 8. Lookup contract checklist

| Lookup | Endpoint | Must show | Must not show / filter |
|---|---|---|---|
| Warehouse manager | `GET /api/employees/lookup` | ACTIVE same-company Nikola/Milica with WAREHOUSE_MANAGER position | Inactive, other company, non-manager. Existing management of another warehouse is **not** excluded by backend rule. |
| Warehouse | `GET /api/warehouses/lookup` | ACTIVE company warehouses; role-scoped assigned set where applicable | Archived/inaccessible warehouse; cross-company. |
| Product | `GET /api/products/lookup` | Same-company active catalog; for `mode=AVAILABLE_STOCK`, only products with `quantity-reservedQuantity > 0` in selected warehouse | Other company; zero availability in AVAILABLE_STOCK mode. |
| Driver/employee | `GET /api/employees/lookup` | ACTIVE DRIVER for driver mode; managed-warehouse employees for task mode | Inactive/wrong position/out-of-scope. Schedule conflict is revalidated on submit; do not trust lookup alone. |
| Vehicle | `GET /api/vehicles/lookup` | Active same-company AVAILABLE vehicle compatible with filters | MAINTENANCE/OUT_OF_SERVICE/archived/cross-company; schedule and planned maintenance are revalidated on submit. |
| Bin | `GET /api/bin-locations/lookup` | Bins of selected accessible warehouse/zone when bin tracking is enabled | Bin from another warehouse/zone or inaccessible scope. |

Diagnostic rule: if lookup is empty, inspect prerequisites first (status, company, position, warehouse assignment, selected parent, availability). Then verify request parameters in browser Network panel. A visible option never overrides backend submit validation.

# 9. Phase F — Main connected transport scenario

## Step 11 — Create DRAFT transport

**LOGIN:** Marko. **NAVIGATION:** Transport Orders → Create.

| Field | Value |
|---|---|
| Order number | `DIL-BGNS-T-001` |
| Description | `Redovna isporuka Beograd–Novi Sad` |
| Order date | `T 08:00` |
| Departure | `T 09:00` |
| Planned arrival | `T 13:00` |
| Priority | `HIGH` |
| Notes | `E2E transport; prijem na NS-R-01` |
| Source | Centralni distributivni centar Beograd |
| Destination | Regionalni centar Novi Sad |
| Vehicle | BG-1234-IL |
| Driver | Luka Stojanović |

**EXPECTED:** status DRAFT, vehicle still AVAILABLE until reservation/assignment logic reserves it, automatic DRIVING task linked to Luka/order, totals initially zero.

## Step 12 — Add items and verify immediate reservation

Open transport Details → Items → Add:

- Water DIL-VODA-001 quantity `100`, movement unit cost `620`, currency `RSD`, note `20 transportnih paketa po paleti`. UI calculates total `62000.0000`.
- Oil DIL-ULJE-002 quantity `40`, movement unit cost `1850`, currency `RSD`, note `Zaštititi od prevrtanja`. UI calculates total `74000.0000`.
- TV DIL-TV-003 quantity `5`, movement unit cost `38990`, currency `RSD`, note `Fragile — uspravno slaganje`. UI calculates total `194950.0000`.

Current UI requires unit cost and currency and calculates total as quantity × unit cost. Enter the initial product prices above so the test can continue, but treat this as the implementation issue documented in §11. Do **not** click Reserve after adding the items: item creation has already reserved inventory. Reserve is only for re-reserving a DRAFT after reservation expiry/release.

**EXPECTED after item creation:** BG water `500 physical / 100 reserved / 400 available`; oil `300/40/260`; TV `40/5/35`. Item reserved quantities match requested quantities. Vehicle becomes RESERVED on `ASSIGNED`, not merely because items exist. If a Reserve action is visible, invoking it while reservation is active must reject with `Transport reservation is already active`.

## Step 13 — Preparation lifecycle

Use the transition actions returned by the UI:

1. Marko: `DRAFT → ASSIGNED`; reason `Plan i resursi potvrđeni`.
2. Marko (or company admin): `ASSIGNED → PICKING`; reason `Komisioniranje započeto`.
3. Open Tasks: confirm automatic PICKING task assigned to Nikola. For explicit WORKER coverage, create a manual linked PICKING task titled `Komisioniranje DIL-BGNS-T-001`, due `T 10:00`, HIGH, assignee Stefan, link only this transport. Stefan logs in and moves it through allowed task statuses to COMPLETED.
4. Marko: `PICKING → PACKING`; confirm automatic PACKING task for Nikola; complete it through task lifecycle as Nikola.
5. Marko: `PACKING → READY_FOR_LOADING`; confirm automatic LOADING task exists.
6. Marko: `READY_FOR_LOADING → LOADING`; reason `Vozilo na rampi BG-R-01`. Complete loading task as Nikola/authorized assignee.

During all preparation statuses physical and reserved figures remain unchanged: water 500/100/400, oil 300/40/260, TV 40/5/35. Vehicle is RESERVED, not yet IN_USE.

## Step 14 — Dispatch

**LOGIN:** Luka DRIVER. Open My Transport Orders → DIL-BGNS-T-001. Confirm related-resource access and own DRIVING task. Transition `LOADING → IN_TRANSIT`, reason `Utovar završen; vozilo napustilo BG centar`.

**EXPECTED:** vehicle IN_USE; driving task IN_PROGRESS; source reservation cleared and physical stock reduced:

| Product | BG physical | BG reserved | BG available | In transit |
|---|---:|---:|---:|---:|
| Water | 400 | 0 | 400 | 100 |
| Oil | 260 | 0 | 260 | 40 |
| TV | 35 | 0 | 35 | 5 |

Stock movement/audit records show dispatch/transfer-out semantics and the item cost snapshots. Destination remains water 80, oil 50, TV 8.

## Step 15 — Delivery and unloading

**LOGIN:** Luka. Transition `IN_TRANSIT → DELIVERED`, reason `Roba predata centru Novi Sad bez odstupanja`.

**EXPECTED:** delivered quantities 100/40/5; in-transit quantities 0; destination becomes:

| Product | NS before | Received | NS final physical/reserved/available |
|---|---:|---:|---|
| Water | 80 | 100 | `180 / 0 / 180` |
| Oil | 50 | 40 | `90 / 0 / 90` |
| TV | 8 | 5 | `13 / 0 / 13` |

Vehicle BG-1234-IL returns AVAILABLE. DRIVING task becomes COMPLETED. An automatic UNLOADING task is created for destination manager Milica; because creation happens on delivery, verify and complete it after delivery. Transport terminal status is named `DELIVERED` (there is no separate `COMPLETED` transport enum).

### Negative tests — transport

- Add water quantity `401` after 100 is already reserved (or create a separate DRAFT): reservation rejects quantity > available.
- Source equals destination: reject.
- Select NI-3456-IL or a vehicle with overlapping transport/maintenance: reject.
- Select Nemanja without a shift covering the chosen interval: reject.
- Attempt `DRAFT → IN_TRANSIT` by URL/API manipulation: transition policy rejects.
- WORKER tries generic transport status endpoint: controller rejects even if UI displays related transport.
- Change item after transport is no longer editable: reject.

### CHECKPOINT

- Transport DIL-BGNS-T-001 DELIVERED; all item reserved/in-transit quantities 0 and delivered equals requested.
- BG final: water 400, oil 260, TV 35. NS final: water 180, oil 90, TV 13. Folija and pločice unchanged.
- BG-1234-IL AVAILABLE; NI-3456-IL MAINTENANCE.
- Driving and phase tasks visible; manual Stefan task COMPLETED; destination UNLOADING task COMPLETED after explicit action.

# 10. Phase G — Scope, dashboards, notifications and audit

## Role-by-role verification

- Jelena: company dashboard totals reflect 9 employees, 3 warehouses, 5 products, 4 vehicles and delivered transport; can read company Activity Logs.
- Ana: sees workforce/shifts/tasks and employee-task report, but not warehouse/fleet/transport create pages.
- Nikola: sees BG and Niš managed warehouse mutations; cannot mutate NS; can read company-wide transport details required for operations.
- Milica: sees NS scope and unloading task; cannot mutate BG inventory.
- Marko: sees company drivers, vehicles, transport and report; cannot create employees/products/warehouses.
- Luka: sees own shift, own DIL-BGNS-T-001, related vehicle/task; not Nemanja’s unrelated resources.
- Stefan: sees assigned warehouse inventory/stock movements/tasks and related transport; cannot see NS-only worker data.
- OVERLORD: sees global activity timeline and registration lifecycle evidence.

## Evidence to capture

- Notification for request submission/approval and lifecycle events; mark one read, acknowledge/resolve if actions exist, and confirm unread count changes.
- Transport Details lifecycle/history, domain events, comments/attachments panels if enabled, item cost and quantity trace.
- Activity Logs as COMPANY_ADMIN and global Activity Timeline as OVERLORD.
- Transport, Inventory and Employee/Task reports with filters for this company/order.
- Dashboard counts before/after delivery; allow cache refresh/invalidation delay, then reload once.

# 11. Potential implementation issues found in current code

## POTENTIAL IMPLEMENTATION ISSUE — Warehouse manager transition mismatch

**Files:** `backend/.../lifecycle/LifecyclePolicyRegistry.java`, `backend/.../controller/TransportOrderController.java`  
**Relevant code:** role matrix permits WAREHOUSE_MANAGER for PICKING/PACKING/READY_FOR_LOADING/LOADING, but `PATCH /api/transport-orders/{id}/status` controller allows only OVERLORD/COMPANY_ADMIN/DISPATCHER/DRIVER.  
**Problem:** manager may receive automatic tasks and see allowed-transition metadata but cannot execute the transport status PATCH.  
**Expected:** controller and lifecycle role policy should agree.  
**Impact:** preparation transitions must be executed by Dispatcher/Company Admin in this plan.  
**Workaround:** Marko executes transport transitions; Nikola/Milica execute their tasks. Not a blocker.

## POTENTIAL IMPLEMENTATION ISSUE — Automatic operational tasks target managers, not workers

**File:** `backend/.../service/implementation/TransportOrderService.java`  
**Relevant code:** phase task assignee is `warehouse.getManager().getId()`.  
**Problem:** expected warehouse work may be thought to flow automatically to WORKER, but it flows to manager.  
**Expected business behaviour:** either explicit manager triage/reassignment or deterministic worker assignment should be documented.  
**Impact:** a worker will not automatically receive picking/loading/unloading.  
**Workaround:** create a manual linked worker task as Step 13. Not a blocker.

## POTENTIAL IMPLEMENTATION ISSUE — Transport item cost is client-authored

**File:** `backend/.../dto/create/TransportOrderItemCreate.java`  
**Relevant code:** `TransportOrderDetailsPage.tsx` exposes `movementUnitCost` and `movementCurrency`, calculates total in the client; `TransportOrderItemCreate` requires all three and `TransportOrderItemService.validateMovementCost` only validates multiplication.  
**Problem:** a dispatcher manually determines financial snapshot values; the backend does not derive them from authoritative inventory valuation at item creation.  
**Expected:** backend derives unit cost, currency and total from source WarehouseInventory and returns read-only metadata.  
**Impact:** incorrect but arithmetically consistent cost can be persisted, compromising financial reporting.  
**Workaround:** for this manual run enter the product/initial inventory price values in Step 12 and record the issue. Not a workflow blocker.

## POTENTIAL IMPLEMENTATION ISSUE — OVERLORD operational lifecycle ambiguity

**Files:** lifecycle role matrices and operational controllers.  
**Problem:** controllers often include OVERLORD while transition role matrices list only company operational roles.  
**Impact:** global admin can read/create but may be refused for some lifecycle actions.  
**Workaround:** execute company operations with the named company role. Not a blocker.

# 12. Final verification checklist

- [ ] Company lifecycle works
- [ ] Company scope works
- [ ] Employee lifecycle works
- [ ] Warehouse manager assignment works
- [ ] Warehouse scope works
- [ ] Bin tracking works
- [ ] Inventory is consistent
- [ ] Stock movement is consistent
- [ ] Reservation is consistent
- [ ] Transport lifecycle works
- [ ] Driver assignment works
- [ ] Vehicle assignment works
- [ ] Worker workflow works
- [ ] Destination receipt works
- [ ] Notifications work
- [ ] Audit/history works
- [ ] Dashboard reflects resulting state
- [ ] BG final water/oil/TV = 400/260/35
- [ ] NS final water/oil/TV = 180/90/13
- [ ] Transport items reserved=0, inTransit=0, delivered=100/40/5
- [ ] BG-1234-IL is AVAILABLE and NI-3456-IL is MAINTENANCE
- [ ] Cross-company, warehouse-scope and related-resource negative tests return access denial/not-found

## PASS / FAIL recording rule

For each checkbox record `PASS`, `FAIL`, or `NOT AVAILABLE`, user/login, timestamp, visible result, and screenshot/network response where useful. A hidden frontend control is not sufficient proof of authorization. Do not mark SQL Server runtime, browser rendering, notification SSE, dashboard cache refresh or lifecycle integration PASS unless the corresponding manual step was actually executed.
