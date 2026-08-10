# Emergesun Project Ecosystem

Welcome to the **Emergesun Project** ecosystem. This repository serves as a monorepo-style collection of multiple integrated applications designed for solar shop operations, administrative management, warehouse logistics, account operations, supplier coordination, and developer tools.

## 🌟 Overview

The ecosystem consists of eight main functional areas, each with a dedicated frontend and backend:

1. **CMS Authentication**: Centralized authentication service for all panels.
2. **Admin Panel**: Comprehensive management dashboard for administrators.
3. **Developer Panel**: Tools and module management for developers.
4. **Solar Shop India**: Customer-facing platform for the Indian solar market.
5. **Operation Management Panel**: Operational control, task scheduling, and tracking.
6. **Warehouse Panel**: Inventory control, stock routing, and warehousing logs.
7. **Account Panel**: Ledger management, invoicing, and financial reports.
8. **Supplier Panel**: Supplier onboarding, stock provisioning, and quotes.

## 🏗️ Architecture

The projects follow a standardized stack:
- **Frontend**: React + Vite + Tailwind CSS v4 + Framer Motion.
- **Backend**: Node.js + Express + Mongoose (MongoDB) + MySQL (support).
- **Reverse Proxy**: Nginx (Local development entry point).

### Port Mapping & Routing

All services are integrated through a local Nginx reverse proxy (listening on port `5176`).

| Application / Service | Frontend Port | Backend Port | Nginx Route |
| :--- | :--- | :--- | :--- |
| **CMS Auth** | `5173` | `3000` | `/` (Auth), `/auth-api/` |
| **Admin Panel** | `5174` | `3001` | `/admin-panel/`, `/admin-api/` |
| **Developer Panel** | `5175` | `3002` | `/developer-panel/`, `/developer-api/` |
| **Solar Shop India** | `5177` | `3003` | `/solarshop/` (TBD), `/solarshop-api/` (TBD) |
| **Operation Management**| `5178` | `3004` | `/operation-management-panel/`, `/operation-management-api/` |
| **Warehouse Panel** | `5179` | `3005` | `/warehouse-management-panel/`, `/warehouse-api/` |
| **Account Panel** | `5180` | `3006` | `/account-panel/`, `/account-api/` |
| **Supplier Panel** | `5181` | `3007` | `/supplier-panel/` (TBD), `/supplier-api/` (TBD) |

## 📁 Project Structure

```text
Emergesun-Project-/
├── cms-auth-backend/                         # Auth API (Node.js)
├── cms-auth-frontend/                        # Auth UI (React)
├── emergesun-account-panel-backend/          # Account API (Node.js)
├── emergesun-account-panel-frontend/         # Account UI (React)
├── emergesun-admin-panel-backend/            # Admin API (Node.js)
├── emergesun-admin-panel-frontend/           # Admin UI (React)
├── emergesun-developer-panel-backend/        # Developer API (Node.js)
├── emergesun-developer-panel-frontend/       # Developer UI (React)
├── emergesun-operation-management-panel-backend/ # Operation API (Node.js)
├── emergesun-operation-management-panel-frontend/# Operation UI (React)
├── emergesun-solarshop-india-backend/        # Solar Shop API (Node.js)
├── emergesun-solarshop-india-frontend/       # Solar Shop UI (React)
├── emergesun-warehouse-panel-backend/        # Warehouse API (Node.js)
├── emergesun-warehouse-panel-frontend/       # Warehouse UI (React)
├── supplier-panel-backend/                   # Supplier API (Node.js)
├── supplier-panel-frontend/                  # Supplier UI (React)
├── nginx.conf                                # Local Nginx Configurations
└── README.md                                 # This file
```

## 🚀 Local Setup

### Prerequisites
- **Node.js**: v18+ recommended.
- **MongoDB**: Atlas or local instance.
- **MySQL**: Local instance for binary logs / legacy data.
- **Nginx**: Installed on your local machine (e.g., `C:\nginx-1.28.1`).

### Quick Start
1. **Configure Nginx**:
   - Use the provided [nginx.conf](file:///d:/Emergesun/Emergesun-Project-/nginx.conf) in your Nginx installation.
   - Update paths if necessary.
2. **Setup Environment Variables**:
   - Navigate to each project directory (both frontend and backend).
   - Copy `example.env` to `.env` and update variables as needed.
3. **Install & Run**:
   - For any project:
     ```bash
     npm install
     npm run dev
     ```
4. **Access the App**:
   - Open `http://localhost:5176` in your browser.

## 📜 Individual Documentation

Detailed documentation for each project can be found in their respective directories:

- [CMS Auth Backend](file:///d:/Emergesun/Emergesun-Project-/cms-auth-backend/README.md)
- [CMS Auth Frontend](file:///d:/Emergesun/Emergesun-Project-/cms-auth-frontend/README.md)
- [Account Panel Backend](file:///d:/Emergesun/Emergesun-Project-/emergesun-account-panel-backend/README.md)
- [Account Panel Frontend](file:///d:/Emergesun/Emergesun-Project-/emergesun-account-panel-frontend/README.md)
- [Admin Panel Backend](file:///d:/Emergesun/Emergesun-Project-/emergesun-admin-panel-backend/README.md)
- [Admin Panel Frontend](file:///d:/Emergesun/Emergesun-Project-/emergesun-admin-panel-frontend/README.md)
- [Developer Panel Backend](file:///d:/Emergesun/Emergesun-Project-/emergesun-developer-panel-backend/README.md)
- [Developer Panel Frontend](file:///d:/Emergesun/Emergesun-Project-/emergesun-developer-panel-frontend/README.md)
- [Operation Management Backend](file:///d:/Emergesun/Emergesun-Project-/emergesun-operation-management-panel-backend/README.md)
- [Operation Management Frontend](file:///d:/Emergesun/Emergesun-Project-/emergesun-operation-management-panel-frontend/README.md)
- [Solar Shop India Backend](file:///d:/Emergesun/Emergesun-Project-/emergesun-solarshop-india-backend/README.md)
- [Solar Shop India Frontend](file:///d:/Emergesun/Emergesun-Project-/emergesun-solarshop-india-frontend/README.md)
- [Warehouse Panel Backend](file:///d:/Emergesun/Emergesun-Project-/emergesun-warehouse-panel-backend/README.md)
- [Warehouse Panel Frontend](file:///d:/Emergesun/Emergesun-Project-/emergesun-warehouse-panel-frontend/README.md)
- [Supplier Panel Backend](file:///d:/Emergesun/Emergesun-Project-/supplier-panel-backend/README.md)
- [Supplier Panel Frontend](file:///d:/Emergesun/Emergesun-Project-/supplier-panel-frontend/README.md)

---
© 2026 Emergesun Projects.
