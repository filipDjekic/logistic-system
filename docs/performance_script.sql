/* USERS */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_users_company_id_id' AND object_id = OBJECT_ID('dbo.USERS'))
CREATE INDEX IX_users_company_id_id ON dbo.USERS(company_id, id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_users_status_company_role' AND object_id = OBJECT_ID('dbo.USERS'))
CREATE INDEX IX_users_status_company_role ON dbo.USERS(status, company_id, role_id) INCLUDE (enabled, email);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_users_role_enabled_status' AND object_id = OBJECT_ID('dbo.USERS'))
CREATE INDEX IX_users_role_enabled_status ON dbo.USERS(role_id, enabled, status);

/* EMPLOYEES */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_employees_company_position_active' AND object_id = OBJECT_ID('dbo.EMPLOYEES'))
CREATE INDEX IX_employees_company_position_active ON dbo.EMPLOYEES(company_id, position, active) INCLUDE (user_id, first_name, last_name, email, jmbg, phone_number);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_employees_company_active_employment' AND object_id = OBJECT_ID('dbo.EMPLOYEES'))
CREATE INDEX IX_employees_company_active_employment ON dbo.EMPLOYEES(company_id, active, employment_date);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_employees_user_id' AND object_id = OBJECT_ID('dbo.EMPLOYEES'))
CREATE INDEX IX_employees_user_id ON dbo.EMPLOYEES(user_id);

/* VEHICLES */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_vehicles_company_status_active' AND object_id = OBJECT_ID('dbo.VEHICLES'))
CREATE INDEX IX_vehicles_company_status_active ON dbo.VEHICLES(company_id, status, active) INCLUDE (registration_number, brand, model, type, fuel_type, year_of_production, capacity);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_vehicles_company_capacity' AND object_id = OBJECT_ID('dbo.VEHICLES'))
CREATE INDEX IX_vehicles_company_capacity ON dbo.VEHICLES(company_id, capacity);

/* WAREHOUSES */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_warehouses_company_status_active_manager' AND object_id = OBJECT_ID('dbo.WAREHOUSES'))
CREATE INDEX IX_warehouses_company_status_active_manager ON dbo.WAREHOUSES(company_id, status, active, manager_id) INCLUDE (name, city, address);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_warehouses_manager_company' AND object_id = OBJECT_ID('dbo.WAREHOUSES'))
CREATE INDEX IX_warehouses_manager_company ON dbo.WAREHOUSES(manager_id, company_id);

/* PRODUCTS */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_products_company_sku' AND object_id = OBJECT_ID('dbo.PRODUCTS'))
CREATE INDEX IX_products_company_sku ON dbo.PRODUCTS(company_id, sku) INCLUDE (name);

/* WAREHOUSE INVENTORY */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_inventory_warehouse_product' AND object_id = OBJECT_ID('dbo.WAREHOUSE_INVENTORY'))
CREATE INDEX IX_inventory_warehouse_product ON dbo.WAREHOUSE_INVENTORY(warehouse_id, product_id) INCLUDE (quantity, reserved_quantity, min_stock_level, last_updated);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_inventory_product_warehouse' AND object_id = OBJECT_ID('dbo.WAREHOUSE_INVENTORY'))
CREATE INDEX IX_inventory_product_warehouse ON dbo.WAREHOUSE_INVENTORY(product_id, warehouse_id) INCLUDE (quantity, reserved_quantity, min_stock_level, last_updated);

/* STOCK MOVEMENTS */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_stock_movements_filters' AND object_id = OBJECT_ID('dbo.STOCK_MOVEMENTS'))
CREATE INDEX IX_stock_movements_filters ON dbo.STOCK_MOVEMENTS(warehouse_id, movement_type, product_id, transport_order_id, created_at DESC) INCLUDE (reference_type, reference_id, reference_number, quantity, reason_code);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_stock_movements_product_date' AND object_id = OBJECT_ID('dbo.STOCK_MOVEMENTS'))
CREATE INDEX IX_stock_movements_product_date ON dbo.STOCK_MOVEMENTS(product_id, created_at DESC) INCLUDE (warehouse_id, movement_type, transport_order_id, quantity);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_stock_movements_reference' AND object_id = OBJECT_ID('dbo.STOCK_MOVEMENTS'))
CREATE INDEX IX_stock_movements_reference ON dbo.STOCK_MOVEMENTS(reference_type, reference_id, created_at DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_stock_movements_transport_order' AND object_id = OBJECT_ID('dbo.STOCK_MOVEMENTS'))
CREATE INDEX IX_stock_movements_transport_order ON dbo.STOCK_MOVEMENTS(transport_order_id);

/* TRANSPORT ORDERS */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_transport_orders_created_by_filters' AND object_id = OBJECT_ID('dbo.TRANSPORT_ORDERS'))
CREATE INDEX IX_transport_orders_created_by_filters ON dbo.TRANSPORT_ORDERS(created_by_user_id, status, priority, departure_time DESC) INCLUDE (source_warehouse_id, destination_warehouse_id, vehicle_id, assigned_employee_id, order_number, created_at, total_weight);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_transport_orders_vehicle_schedule' AND object_id = OBJECT_ID('dbo.TRANSPORT_ORDERS'))
CREATE INDEX IX_transport_orders_vehicle_schedule ON dbo.TRANSPORT_ORDERS(vehicle_id, status, departure_time, planned_arrival_time);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_transport_orders_driver_schedule' AND object_id = OBJECT_ID('dbo.TRANSPORT_ORDERS'))
CREATE INDEX IX_transport_orders_driver_schedule ON dbo.TRANSPORT_ORDERS(assigned_employee_id, status, departure_time, planned_arrival_time);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_transport_orders_source_warehouse' AND object_id = OBJECT_ID('dbo.TRANSPORT_ORDERS'))
CREATE INDEX IX_transport_orders_source_warehouse ON dbo.TRANSPORT_ORDERS(source_warehouse_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_transport_orders_destination_warehouse' AND object_id = OBJECT_ID('dbo.TRANSPORT_ORDERS'))
CREATE INDEX IX_transport_orders_destination_warehouse ON dbo.TRANSPORT_ORDERS(destination_warehouse_id);

/* TASKS */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tasks_assignee_status_priority' AND object_id = OBJECT_ID('dbo.TASKS'))
CREATE INDEX IX_tasks_assignee_status_priority ON dbo.TASKS(assigned_employee_id, status, priority) INCLUDE (transport_order_id, stock_movement_id, due_date, created_at, updated_at);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tasks_due_date_status' AND object_id = OBJECT_ID('dbo.TASKS'))
CREATE INDEX IX_tasks_due_date_status ON dbo.TASKS(due_date, status) INCLUDE (assigned_employee_id, priority);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tasks_transport_order' AND object_id = OBJECT_ID('dbo.TASKS'))
CREATE INDEX IX_tasks_transport_order ON dbo.TASKS(transport_order_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tasks_stock_movement' AND object_id = OBJECT_ID('dbo.TASKS'))
CREATE INDEX IX_tasks_stock_movement ON dbo.TASKS(stock_movement_id);

/* SHIFTS */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_shifts_employee_time' AND object_id = OBJECT_ID('dbo.SHIFTS'))
CREATE INDEX IX_shifts_employee_time ON dbo.SHIFTS(employee_id, start_time, end_time) INCLUDE (status);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_shifts_status_time_employee' AND object_id = OBJECT_ID('dbo.SHIFTS'))
CREATE INDEX IX_shifts_status_time_employee ON dbo.SHIFTS(status, start_time, end_time, employee_id);

/* ACTIVITY LOGS */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_activity_logs_user_created' AND object_id = OBJECT_ID('dbo.ACTIVITY_LOGS'))
CREATE INDEX IX_activity_logs_user_created ON dbo.ACTIVITY_LOGS(user_id, created_at DESC) INCLUDE (action, entity_name, entity_id, entity_identifier);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_activity_logs_action_user' AND object_id = OBJECT_ID('dbo.ACTIVITY_LOGS'))
CREATE INDEX IX_activity_logs_action_user ON dbo.ACTIVITY_LOGS(action, user_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_activity_logs_entity_user' AND object_id = OBJECT_ID('dbo.ACTIVITY_LOGS'))
CREATE INDEX IX_activity_logs_entity_user ON dbo.ACTIVITY_LOGS(entity_name, user_id);

/* CHANGE HISTORY */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_change_history_changed_by_date' AND object_id = OBJECT_ID('dbo.CHANGE_HISTORY'))
CREATE INDEX IX_change_history_changed_by_date ON dbo.CHANGE_HISTORY(changed_by_user_id, changed_at DESC) INCLUDE (entity_name, entity_id, change_type);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_change_history_entity' AND object_id = OBJECT_ID('dbo.CHANGE_HISTORY'))
CREATE INDEX IX_change_history_entity ON dbo.CHANGE_HISTORY(entity_name, entity_id);

/* NOTIFICATIONS */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_notifications_user_status_created' AND object_id = OBJECT_ID('dbo.NOTIFICATIONS'))
CREATE INDEX IX_notifications_user_status_created ON dbo.NOTIFICATIONS(user_id, status, created_at DESC) INCLUDE (type);