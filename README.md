# Logistics Management System

Enterprise-style multi-tenant logistics management platform for fleet operations, warehouse management, inventory tracking, transport coordination and operational task management.

---

# Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Multi-Tenant Architecture](#multi-tenant-architecture)
- [Authentication & Authorization](#authentication--authorization)
- [Domain Modules](#domain-modules)
- [Entity Overview](#entity-overview)
- [Lifecycle Logic](#lifecycle-logic)
- [Dashboard & Analytics](#dashboard--analytics)
- [Audit & Activity Tracking](#audit--activity-tracking)
- [CSV Import / Export](#csv-import--export)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Database & Migrations](#database--migrations)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Production Notes](#production-notes)
- [Testing](#testing)
- [Security](#security)
- [Future Improvements](#future-improvements)
- [License](#license)

---

# Overview

The Logistics Management System is a full-stack enterprise-oriented web application designed for managing logistics operations across multiple companies within a single platform.

The system centralizes:

- fleet management
- warehouse operations
- inventory tracking
- transport coordination
- employee organization
- operational task assignment
- reporting and analytics
- audit history
- notification management

The platform follows a multi-tenant architecture where each company operates in an isolated scope with role-based access control and secured business operations.

---

# Core Features

## Authentication & Authorization

- JWT authentication
- role-based authorization
- protected API endpoints
- tenant/company scoping
- secure session handling

## Fleet Management

- vehicle registration
- vehicle status tracking
- transport assignment
- availability monitoring
- vehicle lifecycle management

## Warehouse Management

- warehouse organization
- location tracking
- warehouse inventory overview
- operational capacity monitoring

## Inventory Management

- stock tracking
- stock movement history
- inbound/outbound operations
- inventory synchronization
- warehouse-level inventory management

## Employee Management

- employee records
- role assignments
- work organization
- shift scheduling
- operational visibility

## Transport Operations

- transport order management
- transport status lifecycle
- warehouse-to-warehouse transport coordination
- driver and vehicle assignment

## Operational Tasks

- task assignment
- operational workflow tracking
- employee responsibilities
- task status management

## Dashboard & Analytics

- operational statistics
- KPI monitoring
- logistics insights
- graphical reports

## Notifications

- operational alerts
- user notifications
- logistics event tracking

## Audit & Activity Tracking

- activity logs
- entity change history
- audit records
- user action tracking

## Import / Export

- CSV import
- CSV export
- report generation
- validation-aware import system

---

# System Architecture

The application follows a modular enterprise-style architecture:

```text
Frontend (React + TypeScript)
        |
 REST API Communication
        |
Backend (Spring Boot)
        |
Business Services
        |
Repositories / JPA
        |
Microsoft SQL Server
```

The system is divided into isolated business modules with centralized authentication, authorization, validation and audit layers.

---

# Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Frontend Language | TypeScript |
| UI Framework | Material UI |
| Charts | Recharts |
| Backend | Spring Boot |
| Security | Spring Security |
| Authentication | JWT |
| ORM | Hibernate / JPA |
| Database | Microsoft SQL Server |
| Migrations | Flyway |
| Build Tool | Maven |
| Package Manager | npm |

---

# Multi-Tenant Architecture

The platform supports multiple companies inside a single system instance.

Each company operates in an isolated data scope.

## Multi-tenant protections

- company-scoped queries
- scoped reports
- scoped dashboards
- tenant validation
- isolated operational data
- role-aware entity access

The system prevents cross-company data leakage through centralized security and repository scoping.

---

# Authentication & Authorization

Authentication is implemented using JWT tokens.

After successful login:

1. user credentials are validated
2. JWT token is generated
3. token is used for secured API access

## Supported Roles

| Role | Description |
|---|---|
| OVERLORD | Global platform administrator |
| COMPANY_ADMIN | Company-level administrator |
| WAREHOUSE_MANAGER | Warehouse operations management |
| DRIVER | Transport execution |
| WORKER | Operational warehouse tasks |

---

# Domain Modules

## Company Management

Handles:

- company registration
- company isolation
- company operational scope

## User Management

Handles:

- authentication
- authorization
- role assignment
- account lifecycle

## Vehicle Management

Handles:

- fleet records
- operational statuses
- transport readiness

## Warehouse Management

Handles:

- warehouse locations
- inventory storage
- logistics organization

## Inventory Management

Handles:

- stock quantities
- stock movement operations
- inventory consistency

## Transport Orders

Handles:

- transport planning
- execution tracking
- operational lifecycle

## Task System

Handles:

- operational task assignment
- workflow tracking
- employee responsibilities

## Shift Management

Handles:

- work scheduling
- operational workforce organization

## Notifications

Handles:

- operational alerts
- event notifications
- logistics updates

## Reports & Analytics

Handles:

- operational reports
- business metrics
- visual statistics

---

# Entity Overview

Main entities inside the system:

- Company
- User
- Employee
- Warehouse
- Vehicle
- Product
- Inventory
- StockMovement
- TransportOrder
- Task
- Shift
- Notification
- ActivityLog
- ChangeHistory

---

# Lifecycle Logic

## Vehicle Lifecycle

```text
AVAILABLE
    ↓
IN_USE
    ↓
MAINTENANCE
    ↓
AVAILABLE
```

## Transport Order Lifecycle

```text
CREATED
    ↓
ASSIGNED
    ↓
IN_PROGRESS
    ↓
COMPLETED
```

Alternative flow:

```text
CREATED
    ↓
CANCELLED
```

## Task Lifecycle

```text
PENDING
    ↓
IN_PROGRESS
    ↓
COMPLETED
```

Alternative flow:

```text
PENDING
    ↓
CANCELLED
```

## Inventory Movement Logic

- inbound stock increases inventory
- outbound stock decreases inventory
- movement history is audit tracked
- warehouse inventory is synchronized

---

# Dashboard & Analytics

The dashboard provides operational visibility across the platform.

## Dashboard features

- transport statistics
- inventory analytics
- warehouse overview
- fleet utilization
- operational summaries
- graphical KPI reports

Charts are implemented using Recharts.

---

# Audit & Activity Tracking

The system contains centralized audit tracking.

## Activity Logs

Tracks:

- authentication events
- operational actions
- entity modifications
- user activity

## Change History

Tracks:

- entity field changes
- previous/new values
- timestamps
- responsible user

The audit system improves operational traceability and accountability.

---

# CSV Import / Export

The system supports controlled CSV import/export operations.

## Import Features

- validation-aware imports
- row-level validation
- transaction-safe processing
- scoped imports
- operational consistency

## Export Features

- report exports
- operational data exports
- analytics extraction

---

# Frontend Architecture

Frontend follows a modular feature-based architecture.

## Main structure

```text
src/
 ├── features/
 ├── shared/
 ├── layouts/
 ├── hooks/
 ├── api/
 ├── components/
 └── pages/
```

## Frontend features

- modular architecture
- reusable shared table system
- centralized API handling
- responsive UI
- reusable dialogs/forms
- role-aware routing

---

# Backend Architecture

Backend follows layered enterprise architecture.

## Main structure

```text
src/main/java/
 ├── controller/
 ├── service/
 ├── repository/
 ├── dto/
 ├── mapper/
 ├── entity/
 ├── security/
 ├── config/
 └── validation/
```

## Backend features

- DTO mapping
- centralized validation
- layered business logic
- secured repositories
- audit integration
- transactional consistency

---

# Database & Migrations

Database management is implemented using Microsoft SQL Server and Flyway migrations.

## Migration system

Flyway handles:

- schema versioning
- migration ordering
- automatic database updates
- consistent deployment setup

## Seed Data

The project supports seed/demo data generation for:

- companies
- users
- warehouses
- vehicles
- products
- inventory
- transport operations

---

# Environment Variables

## Backend

```env
DB_URL=jdbc:sqlserver://localhost:1433;databaseName=logistics_system
DB_USERNAME=sa
DB_PASSWORD=your_password

JWT_SECRET=your_secret
JWT_EXPIRATION=86400000
```

## Frontend

```env
VITE_API_URL=http://localhost:8080/api
```

---

# Getting Started

## Backend Setup

### Requirements

- Java 21+
- Maven
- Microsoft SQL Server

### Run Backend

```bash
cd backend

mvn clean install

mvn spring-boot:run
```

---

## Frontend Setup

### Requirements

- Node.js
- npm

### Run Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# Production Notes

## Recommended Production Stack

- Nginx reverse proxy
- Docker deployment
- HTTPS
- production database server
- secure JWT secret management

## Recommended Improvements

- centralized logging
- Redis caching
- rate limiting
- CI/CD pipeline
- monitoring
- container orchestration

---

# Testing

## Backend Testing

- REST API testing
- authorization testing
- scope validation
- migration validation

## Frontend Testing

- UI testing
- responsive testing
- workflow testing
- role visibility testing

## Manual Operational Testing

Recommended manual flows:

- authentication
- company isolation
- inventory operations
- transport lifecycle
- task lifecycle
- dashboard validation
- CSV import/export
- audit verification

---

# Security

## Security Features

- JWT authentication
- role-based authorization
- protected endpoints
- scoped queries
- audit tracking
- secured imports
- validation layer
- forbidden access handling

## Security Goals

- prevent tenant data leakage
- prevent unauthorized operations
- ensure operational traceability
- secure business workflows

---

# Future Improvements

Potential future upgrades:

- real-time tracking
- GPS vehicle integration
- barcode scanning
- route optimization
- predictive analytics
- mobile application
- WebSocket notifications
- advanced reporting engine

---

# License

This project is intended for educational and portfolio purposes.

---

# Author

Logistics Management System  
Software Engineering Project
