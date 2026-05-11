CREATE TABLE countries (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    code NVARCHAR(2) NOT NULL,
    code_three NVARCHAR(3) NOT NULL,
    numeric_code NVARCHAR(3) NULL,
    name NVARCHAR(100) NOT NULL,
    phone_code NVARCHAR(10) NULL,
    currency_code NVARCHAR(3) NULL,
    currency_name NVARCHAR(80) NULL,
    default_timezone_id BIGINT NULL,
    eu_member BIT NOT NULL CONSTRAINT df_countries_eu_member DEFAULT 0,
    active BIT NOT NULL CONSTRAINT df_countries_active DEFAULT 1,
    CONSTRAINT uk_countries_code UNIQUE (code),
    CONSTRAINT uk_countries_code_three UNIQUE (code_three),
    CONSTRAINT uk_countries_numeric_code UNIQUE (numeric_code)
);

CREATE TABLE timezones (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    name NVARCHAR(80) NOT NULL,
    display_name NVARCHAR(120) NOT NULL,
    utc_offset_minutes INT NOT NULL,
    active BIT NOT NULL CONSTRAINT df_timezones_active DEFAULT 1,
    country_id BIGINT NOT NULL,
    CONSTRAINT uk_timezones_name UNIQUE (name),
    CONSTRAINT fk_timezones_country FOREIGN KEY (country_id) REFERENCES countries(id)
);
ALTER TABLE countries ADD CONSTRAINT fk_countries_default_timezone FOREIGN KEY (default_timezone_id) REFERENCES timezones(id);

CREATE TABLE cities (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    postal_code NVARCHAR(20) NULL,
    active BIT NOT NULL CONSTRAINT df_cities_active DEFAULT 1,
    country_id BIGINT NOT NULL,
    CONSTRAINT uk_cities_country_name UNIQUE (country_id, name),
    CONSTRAINT fk_cities_country FOREIGN KEY (country_id) REFERENCES countries(id)
);

CREATE TABLE companies (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    name NVARCHAR(120) NOT NULL,
    active BIT NOT NULL CONSTRAINT df_companies_active DEFAULT 1,
    country_id BIGINT NOT NULL,
    phone_code NVARCHAR(10) NULL,
    timezone_id BIGINT NOT NULL,
    address NVARCHAR(200) NULL,
    city_id BIGINT NULL,
    postal_code NVARCHAR(20) NULL,
    phone_number NVARCHAR(30) NULL,
    email NVARCHAR(255) NULL,
    tax_number NVARCHAR(40) NULL,
    registration_number NVARCHAR(40) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT df_companies_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT uk_companies_name UNIQUE (name),
    CONSTRAINT fk_companies_country FOREIGN KEY (country_id) REFERENCES countries(id),
    CONSTRAINT fk_companies_timezone FOREIGN KEY (timezone_id) REFERENCES timezones(id),
    CONSTRAINT fk_companies_city FOREIGN KEY (city_id) REFERENCES cities(id)
);

CREATE TABLE roles (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(255) NULL,
    CONSTRAINT uk_roles_name UNIQUE (name)
);

CREATE TABLE users (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    password NVARCHAR(255) NOT NULL,
    first_name NVARCHAR(60) NOT NULL,
    last_name NVARCHAR(60) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    status NVARCHAR(20) NOT NULL,
    enabled BIT NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT df_users_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,
    role_id BIGINT NOT NULL,
    company_id BIGINT NULL,
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE vehicle_brands (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    name NVARCHAR(60) NOT NULL,
    active BIT NOT NULL CONSTRAINT df_vehicle_brands_active DEFAULT 1,
    CONSTRAINT uk_vehicle_brands_name UNIQUE (name)
);

CREATE TABLE vehicle_models (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    name NVARCHAR(60) NOT NULL,
    active BIT NOT NULL CONSTRAINT df_vehicle_models_active DEFAULT 1,
    brand_id BIGINT NOT NULL,
    CONSTRAINT uk_vehicle_models_brand_name UNIQUE (brand_id, name),
    CONSTRAINT fk_vehicle_models_brand FOREIGN KEY (brand_id) REFERENCES vehicle_brands(id)
);

CREATE TABLE employees (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    first_name NVARCHAR(60) NOT NULL,
    last_name NVARCHAR(60) NOT NULL,
    jmbg NVARCHAR(13) NOT NULL,
    phone_code NVARCHAR(10) NULL,
    phone_number NVARCHAR(30) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    address NVARCHAR(200) NULL,
    city_id BIGINT NULL,
    postal_code NVARCHAR(20) NULL,
    timezone_id BIGINT NULL,
    position NVARCHAR(50) NOT NULL,
    employment_date DATE NOT NULL,
    salary DECIMAL(12,2) NOT NULL,
    active BIT NOT NULL CONSTRAINT df_employees_active DEFAULT 1,
    updated_at DATETIME2 NULL,
    company_id BIGINT NOT NULL,
    country_id BIGINT NULL,
    primary_warehouse_id BIGINT NULL,
    user_id BIGINT NULL,
    CONSTRAINT uk_employees_company_jmbg UNIQUE (company_id, jmbg),
    CONSTRAINT uk_employees_company_email UNIQUE (company_id, email),
    CONSTRAINT uk_employees_user_id UNIQUE (user_id),
    CONSTRAINT fk_employees_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_employees_city FOREIGN KEY (city_id) REFERENCES cities(id),
    CONSTRAINT fk_employees_timezone FOREIGN KEY (timezone_id) REFERENCES timezones(id),
    CONSTRAINT fk_employees_country FOREIGN KEY (country_id) REFERENCES countries(id),
    CONSTRAINT fk_employees_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE warehouses (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    address NVARCHAR(200) NOT NULL,
    city_id BIGINT NOT NULL,
    postal_code NVARCHAR(20) NULL,
    timezone_id BIGINT NOT NULL,
    latitude DECIMAL(10,7) NULL,
    longitude DECIMAL(10,7) NULL,
    capacity DECIMAL(38,2) NOT NULL,
    status NVARCHAR(255) NOT NULL,
    active BIT NOT NULL CONSTRAINT df_warehouses_active DEFAULT 1,
    updated_at DATETIME2 NULL,
    company_id BIGINT NOT NULL,
    country_id BIGINT NOT NULL,
    manager_id BIGINT NULL,
    CONSTRAINT uk_warehouses_company_name UNIQUE (company_id, name),
    CONSTRAINT fk_warehouses_city FOREIGN KEY (city_id) REFERENCES cities(id),
    CONSTRAINT fk_warehouses_timezone FOREIGN KEY (timezone_id) REFERENCES timezones(id),
    CONSTRAINT fk_warehouses_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_warehouses_country FOREIGN KEY (country_id) REFERENCES countries(id),
    CONSTRAINT fk_warehouses_manager FOREIGN KEY (manager_id) REFERENCES employees(id)
);
ALTER TABLE employees ADD CONSTRAINT fk_employees_primary_warehouse FOREIGN KEY (primary_warehouse_id) REFERENCES warehouses(id);

CREATE TABLE products (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(255) NULL,
    sku NVARCHAR(50) NOT NULL,
    unit NVARCHAR(20) NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    fragile BIT NOT NULL,
    weight DECIMAL(12,2) NOT NULL,
    active BIT NOT NULL CONSTRAINT df_products_active DEFAULT 1,
    updated_at DATETIME2 NULL,
    company_id BIGINT NOT NULL,
    CONSTRAINT uk_products_company_sku UNIQUE (company_id, sku),
    CONSTRAINT fk_products_company FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE warehouse_inventory (
    warehouse_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity DECIMAL(12,2) NOT NULL,
    reserved_quantity DECIMAL(12,2) NOT NULL CONSTRAINT df_warehouse_inventory_reserved DEFAULT 0,
    min_stock_level DECIMAL(12,2) NULL,
    last_updated DATETIME2 NULL,
    CONSTRAINT pk_warehouse_inventory PRIMARY KEY (warehouse_id, product_id),
    CONSTRAINT uk_warehouse_inventory_warehouse_product UNIQUE (warehouse_id, product_id),
    CONSTRAINT fk_warehouse_inventory_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    CONSTRAINT fk_warehouse_inventory_product FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE warehouse_zones (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    warehouse_id BIGINT NOT NULL,
    code NVARCHAR(40) NOT NULL,
    name NVARCHAR(120) NOT NULL,
    type NVARCHAR(30) NOT NULL,
    capacity DECIMAL(12,2) NULL,
    active BIT NOT NULL CONSTRAINT df_warehouse_zones_active DEFAULT 1,
    description NVARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT df_warehouse_zones_created DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT uk_warehouse_zones_warehouse_code UNIQUE (warehouse_id, code),
    CONSTRAINT fk_warehouse_zones_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

CREATE TABLE bin_locations (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    warehouse_id BIGINT NOT NULL,
    zone_id BIGINT NOT NULL,
    code NVARCHAR(60) NOT NULL,
    name NVARCHAR(120) NOT NULL,
    capacity DECIMAL(12,2) NULL,
    active BIT NOT NULL CONSTRAINT df_bin_locations_active DEFAULT 1,
    description NVARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT df_bin_locations_created DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT uk_bin_locations_warehouse_code UNIQUE (warehouse_id, code),
    CONSTRAINT fk_bin_locations_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    CONSTRAINT fk_bin_locations_zone FOREIGN KEY (zone_id) REFERENCES warehouse_zones(id)
);

CREATE TABLE bin_inventory (
    bin_location_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity DECIMAL(12,2) NOT NULL,
    last_updated DATETIME2 NULL,
    CONSTRAINT pk_bin_inventory PRIMARY KEY (bin_location_id, product_id),
    CONSTRAINT fk_bin_inventory_bin_location FOREIGN KEY (bin_location_id) REFERENCES bin_locations(id),
    CONSTRAINT fk_bin_inventory_product FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE vehicles (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    registration_number NVARCHAR(20) NOT NULL,
    vehicle_model_id BIGINT NOT NULL,
    type NVARCHAR(255) NOT NULL,
    capacity DECIMAL(12,2) NOT NULL,
    max_weight DECIMAL(12,2) NOT NULL,
    max_volume DECIMAL(12,2) NULL,
    max_items INT NULL,
    fuel_type NVARCHAR(255) NOT NULL,
    year_of_production INT NOT NULL,
    status NVARCHAR(255) NOT NULL,
    active BIT NOT NULL CONSTRAINT df_vehicles_active DEFAULT 1,
    updated_at DATETIME2 NULL,
    company_id BIGINT NOT NULL,
    CONSTRAINT uk_vehicles_company_registration_number UNIQUE (company_id, registration_number),
    CONSTRAINT fk_vehicles_model FOREIGN KEY (vehicle_model_id) REFERENCES vehicle_models(id),
    CONSTRAINT fk_vehicles_company FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE transport_orders (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    order_number NVARCHAR(50) NOT NULL,
    description NVARCHAR(500) NOT NULL,
    order_date DATETIME2 NOT NULL,
    departure_time DATETIME2 NULL,
    actual_arrival_time DATETIME2 NULL,
    planned_arrival_time DATETIME2 NULL,
    status NVARCHAR(30) NOT NULL,
    priority INT NOT NULL,
    total_weight DECIMAL(12,2) NOT NULL,
    notes NVARCHAR(255) NULL,
    updated_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT df_transport_orders_created DEFAULT SYSUTCDATETIME(),
    source_warehouse_id BIGINT NOT NULL,
    destination_warehouse_id BIGINT NOT NULL,
    vehicle_id BIGINT NOT NULL,
    assigned_employee_id BIGINT NOT NULL,
    created_by_user_id BIGINT NOT NULL,
    CONSTRAINT uk_transport_orders_order_number UNIQUE (order_number),
    CONSTRAINT fk_transport_orders_source FOREIGN KEY (source_warehouse_id) REFERENCES warehouses(id),
    CONSTRAINT fk_transport_orders_destination FOREIGN KEY (destination_warehouse_id) REFERENCES warehouses(id),
    CONSTRAINT fk_transport_orders_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    CONSTRAINT fk_transport_orders_employee FOREIGN KEY (assigned_employee_id) REFERENCES employees(id),
    CONSTRAINT fk_transport_orders_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE transport_order_items (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    quantity DECIMAL(12,2) NOT NULL,
    reserved_quantity DECIMAL(12,2) NOT NULL CONSTRAINT df_transport_order_items_reserved DEFAULT 0,
    dispatched_quantity DECIMAL(12,2) NOT NULL CONSTRAINT df_transport_order_items_dispatched DEFAULT 0,
    delivered_quantity DECIMAL(12,2) NOT NULL CONSTRAINT df_transport_order_items_delivered DEFAULT 0,
    weight DECIMAL(12,2) NOT NULL,
    note NVARCHAR(255) NULL,
    transport_order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    CONSTRAINT uk_transport_order_items_order_product UNIQUE (transport_order_id, product_id),
    CONSTRAINT fk_transport_order_items_order FOREIGN KEY (transport_order_id) REFERENCES transport_orders(id),
    CONSTRAINT fk_transport_order_items_product FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE stock_movements (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    movement_type NVARCHAR(30) NOT NULL,
    quantity DECIMAL(12,2) NOT NULL,
    reason_code NVARCHAR(50) NOT NULL,
    reason_description NVARCHAR(255) NULL,
    reference_type NVARCHAR(50) NOT NULL,
    reference_id BIGINT NULL,
    reference_number NVARCHAR(100) NULL,
    reference_note NVARCHAR(255) NULL,
    transfer_group_id NVARCHAR(100) NULL,
    adjustment_direction NVARCHAR(20) NULL,
    quantity_before DECIMAL(12,2) NOT NULL,
    quantity_after DECIMAL(12,2) NOT NULL,
    reserved_before DECIMAL(12,2) NOT NULL,
    reserved_after DECIMAL(12,2) NOT NULL,
    available_before DECIMAL(12,2) NOT NULL,
    available_after DECIMAL(12,2) NOT NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT df_stock_movements_created DEFAULT SYSUTCDATETIME(),
    warehouse_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    created_by_user_id BIGINT NOT NULL,
    transport_order_id BIGINT NULL,
    CONSTRAINT fk_stock_movements_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    CONSTRAINT fk_stock_movements_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_stock_movements_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id),
    CONSTRAINT fk_stock_movements_transport_order FOREIGN KEY (transport_order_id) REFERENCES transport_orders(id)
);

CREATE TABLE tasks (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    title NVARCHAR(100) NOT NULL,
    description NVARCHAR(500) NULL,
    due_date DATETIME2 NULL,
    priority NVARCHAR(20) NOT NULL,
    status NVARCHAR(20) NOT NULL,
    task_type NVARCHAR(30) NOT NULL,
    started_at DATETIME2 NULL,
    completed_at DATETIME2 NULL,
    cancelled_at DATETIME2 NULL,
    cancel_reason NVARCHAR(255) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT df_tasks_created DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,
    assigned_employee_id BIGINT NOT NULL,
    transport_order_id BIGINT NULL,
    stock_movement_id BIGINT NULL,
    CONSTRAINT fk_tasks_employee FOREIGN KEY (assigned_employee_id) REFERENCES employees(id),
    CONSTRAINT fk_tasks_transport_order FOREIGN KEY (transport_order_id) REFERENCES transport_orders(id),
    CONSTRAINT fk_tasks_stock_movement FOREIGN KEY (stock_movement_id) REFERENCES stock_movements(id)
);

CREATE TABLE shifts (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    start_time DATETIME2 NOT NULL,
    end_time DATETIME2 NOT NULL,
    timezone_id BIGINT NOT NULL,
    status NVARCHAR(255) NOT NULL,
    notes NVARCHAR(255) NULL,
    warehouse_id BIGINT NULL,
    employee_id BIGINT NOT NULL,
    CONSTRAINT fk_shifts_timezone FOREIGN KEY (timezone_id) REFERENCES timezones(id),
    CONSTRAINT fk_shifts_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    CONSTRAINT fk_shifts_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE employee_warehouse_assignments (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    company_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    warehouse_id BIGINT NOT NULL,
    access_type NVARCHAR(30) NOT NULL,
    active BIT NOT NULL CONSTRAINT df_emp_wh_assign_active DEFAULT 1,
    valid_from DATE NULL,
    valid_to DATE NULL,
    notes NVARCHAR(500) NULL,
    CONSTRAINT uk_employee_warehouse_assignment UNIQUE (employee_id, warehouse_id),
    CONSTRAINT fk_emp_wh_assign_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_emp_wh_assign_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
    CONSTRAINT fk_emp_wh_assign_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

CREATE TABLE vehicle_maintenance (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    vehicle_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    type NVARCHAR(40) NOT NULL,
    status NVARCHAR(40) NOT NULL,
    scheduled_at DATETIME2 NOT NULL,
    started_at DATETIME2 NULL,
    completed_at DATETIME2 NULL,
    cancelled_at DATETIME2 NULL,
    odometer INT NULL,
    cost DECIMAL(12,2) NULL,
    notes NVARCHAR(1000) NULL,
    cancel_reason NVARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT df_vehicle_maintenance_created DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT fk_vehicle_maintenance_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    CONSTRAINT fk_vehicle_maintenance_company FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE internal_warehouse_movements (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    warehouse_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    source_bin_id BIGINT NOT NULL,
    destination_bin_id BIGINT NOT NULL,
    quantity DECIMAL(12,2) NOT NULL,
    status NVARCHAR(30) NOT NULL,
    note NVARCHAR(500) NULL,
    created_by_id BIGINT NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT df_internal_movements_created DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_internal_movements_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    CONSTRAINT fk_internal_movements_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_internal_movements_source_bin FOREIGN KEY (source_bin_id) REFERENCES bin_locations(id),
    CONSTRAINT fk_internal_movements_dest_bin FOREIGN KEY (destination_bin_id) REFERENCES bin_locations(id),
    CONSTRAINT fk_internal_movements_user FOREIGN KEY (created_by_id) REFERENCES users(id)
);

CREATE TABLE notifications (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    title NVARCHAR(100) NOT NULL,
    message NVARCHAR(500) NOT NULL,
    type NVARCHAR(20) NOT NULL,
    severity NVARCHAR(20) NOT NULL,
    status NVARCHAR(20) NOT NULL,
    category NVARCHAR(30) NOT NULL,
    source_type NVARCHAR(40) NOT NULL,
    source_id BIGINT NULL,
    dedup_key NVARCHAR(180) NULL,
    escalated_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT df_notifications_created DEFAULT SYSUTCDATETIME(),
    user_id BIGINT NOT NULL,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE domain_events (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    event_type NVARCHAR(80) NOT NULL,
    entity_type NVARCHAR(60) NOT NULL,
    entity_id BIGINT NOT NULL,
    entity_identifier NVARCHAR(255) NULL,
    summary NVARCHAR(500) NOT NULL,
    payload NVARCHAR(4000) NULL,
    company_id BIGINT NULL,
    created_by_id BIGINT NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT df_domain_events_created DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_domain_events_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_domain_events_user FOREIGN KEY (created_by_id) REFERENCES users(id)
);

CREATE TABLE operational_comments (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    entity_type NVARCHAR(60) NOT NULL,
    entity_id BIGINT NOT NULL,
    content NVARCHAR(2000) NOT NULL,
    internal_note BIT NOT NULL CONSTRAINT df_operational_comments_internal DEFAULT 0,
    company_id BIGINT NULL,
    author_id BIGINT NOT NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT df_operational_comments_created DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT fk_operational_comments_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_operational_comments_author FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE operational_attachments (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    entity_type NVARCHAR(60) NOT NULL,
    entity_id BIGINT NOT NULL,
    file_name NVARCHAR(255) NOT NULL,
    content_type NVARCHAR(120) NULL,
    file_url NVARCHAR(1000) NOT NULL,
    size_bytes BIGINT NULL,
    description NVARCHAR(500) NULL,
    company_id BIGINT NULL,
    uploaded_by_id BIGINT NOT NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT df_operational_attachments_created DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_operational_attachments_company FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_operational_attachments_user FOREIGN KEY (uploaded_by_id) REFERENCES users(id)
);

CREATE TABLE change_history (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    entity_name NVARCHAR(100) NOT NULL,
    entity_id BIGINT NOT NULL,
    entity_identifier NVARCHAR(255) NULL,
    change_type NVARCHAR(30) NOT NULL,
    field_name NVARCHAR(100) NULL,
    old_value NVARCHAR(1000) NULL,
    new_value NVARCHAR(1000) NULL,
    changed_at DATETIME2 NOT NULL CONSTRAINT df_change_history_changed DEFAULT SYSUTCDATETIME(),
    changed_by_user_id BIGINT NOT NULL,
    CONSTRAINT fk_change_history_user FOREIGN KEY (changed_by_user_id) REFERENCES users(id)
);

CREATE TABLE activity_logs (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    action NVARCHAR(100) NOT NULL,
    entity_name NVARCHAR(100) NOT NULL,
    entity_id BIGINT NULL,
    entity_identifier NVARCHAR(255) NULL,
    description NVARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT df_activity_logs_created DEFAULT SYSUTCDATETIME(),
    user_id BIGINT NOT NULL,
    CONSTRAINT fk_activity_logs_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE company_registration_requests (
    id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    company_name NVARCHAR(120) NOT NULL,
    registration_number NVARCHAR(40) NULL,
    tax_number NVARCHAR(40) NULL,
    company_email NVARCHAR(255) NULL,
    company_phone_number NVARCHAR(30) NULL,
    country_id BIGINT NOT NULL,
    city_id BIGINT NOT NULL,
    timezone_id BIGINT NOT NULL,
    address NVARCHAR(200) NULL,
    postal_code NVARCHAR(20) NULL,
    admin_first_name NVARCHAR(60) NOT NULL,
    admin_last_name NVARCHAR(60) NOT NULL,
    admin_email NVARCHAR(255) NOT NULL,
    admin_phone_number NVARCHAR(30) NOT NULL,
    admin_jmbg NVARCHAR(13) NOT NULL,
    admin_password NVARCHAR(255) NOT NULL,
    admin_employment_date DATE NOT NULL,
    status NVARCHAR(30) NOT NULL,
    submitted_at DATETIME2 NOT NULL CONSTRAINT df_company_reg_submitted DEFAULT SYSUTCDATETIME(),
    reviewed_at DATETIME2 NULL,
    reviewed_by_id BIGINT NULL,
    rejection_reason NVARCHAR(500) NULL,
    notes NVARCHAR(1000) NULL,
    created_company_id BIGINT NULL,
    updated_at DATETIME2 NULL,
    CONSTRAINT fk_company_reg_country FOREIGN KEY (country_id) REFERENCES countries(id),
    CONSTRAINT fk_company_reg_city FOREIGN KEY (city_id) REFERENCES cities(id),
    CONSTRAINT fk_company_reg_timezone FOREIGN KEY (timezone_id) REFERENCES timezones(id),
    CONSTRAINT fk_company_reg_reviewed_by FOREIGN KEY (reviewed_by_id) REFERENCES users(id),
    CONSTRAINT fk_company_reg_created_company FOREIGN KEY (created_company_id) REFERENCES companies(id)
);

-- Indexes
CREATE INDEX idx_countries_active ON countries(active);
CREATE INDEX idx_countries_currency_code ON countries(currency_code);
CREATE INDEX idx_countries_default_timezone_id ON countries(default_timezone_id);
CREATE INDEX idx_timezones_country_id ON timezones(country_id);
CREATE INDEX idx_timezones_active ON timezones(active);
CREATE INDEX idx_cities_country_id ON cities(country_id);
CREATE INDEX idx_cities_country_active ON cities(country_id, active);
CREATE INDEX idx_cities_name ON cities(name);
CREATE INDEX idx_companies_active ON companies(active);
CREATE INDEX idx_companies_country_id ON companies(country_id);
CREATE INDEX idx_companies_timezone_id ON companies(timezone_id);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_company_status ON users(company_id, status);
CREATE INDEX idx_users_role_enabled_status ON users(role_id, enabled, status);
CREATE INDEX idx_employees_company_id ON employees(company_id);
CREATE INDEX idx_employees_company_position ON employees(company_id, position);
CREATE INDEX idx_employees_company_active ON employees(company_id, active);
CREATE INDEX idx_employees_company_active_employment ON employees(company_id, active, employment_date);
CREATE INDEX idx_employees_primary_warehouse_id ON employees(primary_warehouse_id);
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_warehouses_company_id ON warehouses(company_id);
CREATE INDEX idx_warehouses_company_status ON warehouses(company_id, status);
CREATE INDEX idx_warehouses_company_status_active ON warehouses(company_id, status, active);
CREATE INDEX idx_warehouses_manager_company ON warehouses(manager_id, company_id);
CREATE INDEX idx_products_company_id ON products(company_id);
CREATE INDEX idx_products_company_active ON products(company_id, active);
CREATE INDEX idx_warehouse_inventory_warehouse_id ON warehouse_inventory(warehouse_id);
CREATE INDEX idx_warehouse_inventory_product_id ON warehouse_inventory(product_id);
CREATE INDEX idx_warehouse_inventory_product_warehouse ON warehouse_inventory(product_id, warehouse_id);
CREATE INDEX idx_warehouse_zones_warehouse_id ON warehouse_zones(warehouse_id);
CREATE INDEX idx_warehouse_zones_warehouse_active ON warehouse_zones(warehouse_id, active);
CREATE INDEX idx_warehouse_zones_type ON warehouse_zones(type);
CREATE INDEX idx_bin_locations_warehouse_id ON bin_locations(warehouse_id);
CREATE INDEX idx_bin_locations_zone_id ON bin_locations(zone_id);
CREATE INDEX idx_bin_locations_warehouse_active ON bin_locations(warehouse_id, active);
CREATE INDEX idx_bin_inventory_bin_location ON bin_inventory(bin_location_id);
CREATE INDEX idx_bin_inventory_product ON bin_inventory(product_id);
CREATE INDEX idx_vehicles_company_id ON vehicles(company_id);
CREATE INDEX idx_vehicles_company_status ON vehicles(company_id, status);
CREATE INDEX idx_vehicles_company_active ON vehicles(company_id, active);
CREATE INDEX idx_vehicles_company_status_active ON vehicles(company_id, status, active);
CREATE INDEX idx_vehicles_vehicle_model_id ON vehicles(vehicle_model_id);
CREATE INDEX idx_transport_orders_created_by_user_id ON transport_orders(created_by_user_id);
CREATE INDEX idx_transport_orders_assigned_employee_id ON transport_orders(assigned_employee_id);
CREATE INDEX idx_transport_orders_vehicle_id ON transport_orders(vehicle_id);
CREATE INDEX idx_transport_orders_status ON transport_orders(status);
CREATE INDEX idx_transport_orders_created_by_status ON transport_orders(created_by_user_id, status);
CREATE INDEX idx_transport_orders_vehicle_status_time ON transport_orders(vehicle_id, status, departure_time, planned_arrival_time);
CREATE INDEX idx_transport_orders_driver_status_time ON transport_orders(assigned_employee_id, status, departure_time, planned_arrival_time);
CREATE INDEX idx_transport_orders_source_warehouse_id ON transport_orders(source_warehouse_id);
CREATE INDEX idx_transport_orders_destination_warehouse_id ON transport_orders(destination_warehouse_id);
CREATE INDEX idx_transport_order_items_transport_order_id ON transport_order_items(transport_order_id);
CREATE INDEX idx_transport_order_items_product_id ON transport_order_items(product_id);
CREATE INDEX idx_stock_movements_warehouse_product_created ON stock_movements(warehouse_id, product_id, created_at);
CREATE INDEX idx_stock_movements_transport_order_id ON stock_movements(transport_order_id);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
CREATE INDEX idx_stock_movements_transfer_group_id ON stock_movements(transfer_group_id);
CREATE INDEX idx_stock_movements_product_created ON stock_movements(product_id, created_at);
CREATE INDEX idx_stock_movements_warehouse_type_created ON stock_movements(warehouse_id, movement_type, created_at);
CREATE INDEX idx_tasks_assigned_employee_id ON tasks(assigned_employee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_transport_order_id ON tasks(transport_order_id);
CREATE INDEX idx_tasks_stock_movement_id ON tasks(stock_movement_id);
CREATE INDEX idx_tasks_assignee_status_priority ON tasks(assigned_employee_id, status, priority);
CREATE INDEX idx_tasks_due_date_status ON tasks(due_date, status);
CREATE INDEX idx_tasks_type_status ON tasks(task_type, status);
CREATE INDEX idx_shifts_employee_id ON shifts(employee_id);
CREATE INDEX idx_shifts_employee_start_time ON shifts(employee_id, start_time);
CREATE INDEX idx_shifts_employee_time ON shifts(employee_id, start_time, end_time);
CREATE INDEX idx_shifts_status ON shifts(status);
CREATE INDEX idx_shifts_status_time ON shifts(status, start_time, end_time);
CREATE INDEX idx_shifts_warehouse_status_time ON shifts(warehouse_id, status, start_time, end_time);
CREATE INDEX idx_employee_warehouse_assignments_employee ON employee_warehouse_assignments(employee_id);
CREATE INDEX idx_employee_warehouse_assignments_warehouse ON employee_warehouse_assignments(warehouse_id);
CREATE INDEX idx_employee_warehouse_assignments_company_active ON employee_warehouse_assignments(company_id, active);
CREATE INDEX idx_employee_warehouse_assignments_access ON employee_warehouse_assignments(access_type);
CREATE INDEX idx_vehicle_maintenance_vehicle_id ON vehicle_maintenance(vehicle_id);
CREATE INDEX idx_vehicle_maintenance_vehicle_status ON vehicle_maintenance(vehicle_id, status);
CREATE INDEX idx_vehicle_maintenance_status_scheduled ON vehicle_maintenance(status, scheduled_at);
CREATE INDEX idx_vehicle_maintenance_company_status ON vehicle_maintenance(company_id, status);
CREATE INDEX idx_internal_movements_warehouse_id ON internal_warehouse_movements(warehouse_id);
CREATE INDEX idx_internal_movements_product_id ON internal_warehouse_movements(product_id);
CREATE INDEX idx_internal_movements_source_bin_id ON internal_warehouse_movements(source_bin_id);
CREATE INDEX idx_internal_movements_destination_bin_id ON internal_warehouse_movements(destination_bin_id);
CREATE INDEX idx_internal_movements_created_at ON internal_warehouse_movements(created_at);
CREATE INDEX idx_notifications_user_status_created ON notifications(user_id, status, created_at);
CREATE INDEX idx_notifications_user_severity_status ON notifications(user_id, severity, status);
CREATE INDEX idx_notifications_category_status ON notifications(category, status);
CREATE INDEX idx_notifications_dedup_key ON notifications(dedup_key);
CREATE INDEX idx_domain_events_entity ON domain_events(entity_type, entity_id);
CREATE INDEX idx_domain_events_company_created ON domain_events(company_id, created_at);
CREATE INDEX idx_domain_events_type ON domain_events(event_type);
CREATE INDEX idx_operational_comments_entity ON operational_comments(entity_type, entity_id);
CREATE INDEX idx_operational_comments_company_created ON operational_comments(company_id, created_at);
CREATE INDEX idx_operational_comments_author ON operational_comments(author_id);
CREATE INDEX idx_operational_attachments_entity ON operational_attachments(entity_type, entity_id);
CREATE INDEX idx_operational_attachments_company_created ON operational_attachments(company_id, created_at);
CREATE INDEX idx_operational_attachments_uploaded_by ON operational_attachments(uploaded_by_id);
CREATE INDEX idx_change_history_changed_by_date ON change_history(changed_by_user_id, changed_at);
CREATE INDEX idx_change_history_entity ON change_history(entity_name, entity_id);
CREATE INDEX idx_activity_logs_user_created ON activity_logs(user_id, created_at);
CREATE INDEX idx_activity_logs_action_user ON activity_logs(action, user_id);
CREATE INDEX idx_activity_logs_entity_user ON activity_logs(entity_name, user_id);
CREATE INDEX idx_company_registration_requests_status ON company_registration_requests(status);
CREATE INDEX idx_company_registration_requests_country_id ON company_registration_requests(country_id);
CREATE INDEX idx_company_registration_requests_admin_email ON company_registration_requests(admin_email);
CREATE INDEX idx_company_registration_requests_submitted_at ON company_registration_requests(submitted_at);
