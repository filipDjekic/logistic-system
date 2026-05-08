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
