# Logistics System

Enterprise-grade Logistics Management System built to manage warehouse operations, inventory, transportation, employees, fleet, operational tasks, and business workflows through a modern web application.

The system is designed around real business processes rather than simple CRUD operations, providing role-based access control, operational dashboards, auditability, lifecycle management, and warehouse-oriented workflows.

---

# Features

## Authentication & Authorization

- JWT Authentication
- Spring Security
- Role-Based Access Control (RBAC)
- Protected frontend routes
- Permission-based UI rendering

---

## Company Management

- Company administration
- Company registration requests
- Company settings
- Multi-company architecture support

---

## User Management

- User administration
- Role assignment
- Account status management
- Employee profile integration

---

## Employee Management

- Employee records
- Departments
- Positions
- Shift management
- Availability tracking

---

## Warehouse Management

- Warehouse management
- Warehouse zones
- Bin locations
- Warehouse access
- Warehouse inventory
- Capacity overview

---

## Inventory Management

- Products
- Categories
- Units of measure
- Inventory tracking
- Inventory adjustments
- Stock reservations
- Low stock monitoring

---

## Stock Movements

- Inbound operations
- Outbound operations
- Internal warehouse movements
- Inventory history
- Movement traceability

---

## Fleet Management

- Vehicle management
- Vehicle availability
- Maintenance records
- Vehicle assignments

---

## Transportation

- Transport orders
- Route management
- Driver assignment
- Shipment tracking
- Transport lifecycle

---

## Operational Tasks

- Task creation
- Task assignment
- Task lifecycle
- Employee workload
- Operational monitoring

---

## Dashboard

Role-based dashboards providing operational insights, including:

- Warehouse overview
- Inventory statistics
- Transport statistics
- Fleet utilization
- Employee overview
- Operational KPIs

---

## Activity Monitoring

- Activity logs
- Change history
- Timeline view
- Audit trail

---

## Notifications

- System notifications
- Operational alerts
- Real-time updates

---

## Import / Export

- CSV import
- Data export
- Reporting support

---

## Search & Filtering

- Global lookup components
- Advanced filtering
- Pagination
- Sorting

---

# Technology Stack

## Backend

- Java
- Spring Boot
- Spring Security
- Spring Data JPA
- Hibernate
- JWT Authentication
- Flyway
- Maven
- Microsoft SQL Server

---

## Frontend

- React
- TypeScript
- Vite
- Material UI
- React Router
- TanStack Query
- React Hook Form
- Zod
- Axios
- Recharts
- Day.js
- Notistack

---

# Architecture

The project follows a layered architecture.

```
Frontend (React)

        │

REST API

        │

Spring Boot Backend

        │

Business Services

        │

Repositories

        │

Microsoft SQL Server
```

Main architectural principles:

- Separation of concerns
- DTO-based communication
- Layered service architecture
- Repository pattern
- Role-based authorization
- Reusable frontend components
- Domain-oriented organization

---

# Security

The application implements several security mechanisms:

- JWT Authentication
- Password encryption
- Spring Security
- Role-based authorization
- Endpoint protection
- Request validation
- Secure REST communication

---

# Main Business Modules

- Authentication
- Companies
- Users
- Employees
- Warehouses
- Warehouse Zones
- Bin Locations
- Warehouse Inventory
- Products
- Categories
- Inventory
- Stock Movements
- Internal Movements
- Vehicles
- Drivers
- Transport Orders
- Operational Tasks
- Shifts
- Notifications
- Activity Logs
- Change History
- Dashboard
- Reporting

---

# Project Structure

## Backend

```
backend
│
├── config
├── controller
├── dto
├── entity
├── enums
├── exception
├── mapper
├── repository
├── security
├── service
├── specification
├── validation
└── resources
```

---

## Frontend

```
frontend
│
├── app
├── assets
├── components
├── hooks
├── layouts
├── pages
├── services
├── types
├── utils
└── validation
```

---

# Getting Started

## Requirements

- Java 21+
- Maven
- Node.js 20+
- npm
- Microsoft SQL Server

---

## Backend

```bash
cd backend

mvn clean install

mvn spring-boot:run
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# Database

The project uses:

- Microsoft SQL Server
- Spring Data JPA
- Hibernate
- Flyway database migrations

Database schema is automatically versioned using Flyway.

---

# API

The backend exposes a REST API consumed by the React frontend.

Typical API features include:

- CRUD operations
- Pagination
- Filtering
- Search
- Validation
- Role protection
- Lifecycle actions

---

# Design Goals

The application was designed with the following goals:

- Maintainability
- Scalability
- Modularity
- Reusability
- Security
- Clear domain separation
- Production-ready architecture

---

# Future Improvements

Potential future enhancements include:

- Docker deployment
- Kubernetes support
- CI/CD pipelines
- Distributed caching
- Message broker integration
- Advanced reporting
- Mobile client
- Multi-language support
- Advanced analytics

---

# License

This project was developed for educational purposes as a university software engineering project while following production-oriented architectural practices.