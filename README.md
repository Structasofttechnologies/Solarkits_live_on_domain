# SolarKits — B2B Solar E-Commerce Ecosystem ☀️🔋

Welcome to the **SolarKits** repository. **SolarKits** is a comprehensive, enterprise-grade B2B E-Commerce & Operations Ecosystem designed specifically for bulk solar equipment sales, distribution, and lifecycle management. It connects B2B solar customers, EPC contractors, solar dealers, equipment manufacturers/suppliers, warehouse teams, financial accounts, and system administrators into one integrated platform.

---

## 🌟 Platform Overview

SolarKits powers the digital transformation of B2B solar commerce by enabling solar dealers, commercial installers, and EPC contractors to purchase high-quality solar products, packaged solar kits, inverters, panels, and accessories directly at wholesale rates with dynamic quote generation and multi-warehouse logistics.

### 🏬 Target Audience & Use Cases
- **B2B Solar Buyers & EPC Contractors**: Purchase bulk solar components, customcombo solar kits, track orders, request custom quotations, and manage project installations.
- **Suppliers & Manufacturers**: Onboard products, manage brand catalogs, supply chain inventory, and manage quotation bids.
- **Warehouse Logistics Teams**: Oversee inward inventory, stock activations, SKU serial tracking, dispatch management, and delivery logistics.
- **Finance & Accounts Teams**: Manage ledgers, invoice generation, payment processing, supplier registries, and financial reporting.
- **Operations & Management**: Order lifecycle management, staff access control, and task routing.

---

## 🏗️ Repository Architecture

SolarKits v2.0 is organized into three primary high-performance modules:

```text
SolarKits v2.0/
├── customer-apps/
│   └── solarkits-solarshop-india/        # Customer-facing B2B Solar Shop Marketplace UI (React + Vite)
│
├── internal-admin-portal/
│   └── solarkits-unified-admin/          # Unified Staff & Operations Portal (React + Vite)
│       ├── src/portals/admin/            # System Administration & Website Config
│       ├── src/portals/accounts/         # Accounts, Ledgers & Invoicing
│       ├── src/portals/warehouse/        # Warehouse & Inventory Control
│       ├── src/portals/operations/       # Order & Dispatch Management
│       ├── src/portals/developer/        # Module Management & Developer Utilities
│       └── src/portals/cms-auth/         # Security Gateway & Role Selection
│
├── backend/
│   └── solarkits-central-backend/        # Centralized REST API Service (Node.js + Express + MongoDB)
│       └── src/modules/
│           ├── solarkits-website/        # Website Content Management API
│           ├── solarshop-india/          # B2B Store API & Checkout Engine
│           ├── admin-panel/              # Core Administration API
│           ├── warehouse-panel/          # Warehouse & Stock Activation API
│           ├── supplier-panel/           # Supplier Onboarding API
│           └── accounts-panel/           # Ledger & Financial API
│
├── Dockerfile                            # Multi-stage Containerization Build File
├── nginx.conf                            # Development Nginx Reverse Proxy Configuration
├── nginx.prod.conf.template              # Production Nginx NGINX Deployment Template
└── README.md                             # Project Documentation
```

---

## ⚡ Key Features

### 🛒 1. B2B Solar Shop Marketplace (`customer-apps/solarkits-solarshop-india`)
- **Product Catalog**: Solar panels (Mono PERC, TopCon, Bifacial), Ongrid/Offgrid/Hybrid inverters, Mounting structures, Solar batteries, and BOS accessories.
- **Custom Solar Kits Configurator**: Pre-packaged and custom solar system kits tailored for residential, commercial, and industrial rooftop projects.
- **EPC Contractor Onboarding**: Registration, business document verification, and tier-based trade pricing.
- **B2B Bulk Checkout & Quote Generator**: Dynamic cart calculation, tax estimation, and payment integration.

### 🏢 2. Unified Internal Staff Portal (`internal-admin-portal/solarkits-unified-admin`)
- **Single-Sign-On (SSO) Security Gateway**: Multi-tenant access control for staff members based on assigned roles.
- **Admin Dashboard**: Comprehensive site setting controls, website banner updates, pricing plans, and EPC approvals.
- **Warehouse & Inventory Hub**: Stock inward logs, SKU serial assignment, inventory transfer, and delivery tracking.
- **Accounts & Supplier Portal**: Supplier registries, ledger auditing, tax invoice management, and payout verification.
- **Operations & Logistics Control**: Live order tracking, dispatch status monitoring, and customer support ticket routing.

### ⚙️ 3. Centralized API Server (`backend/solarkits-central-backend`)
- **Unified MongoDB Architecture**: High-speed database handling core product catalogs, user credentials, orders, and geolocation boundary data.
- **Cloudinary Media Assets**: Automatic asset folder management and cloud-hosted product image uploads.
- **Automated Communication**: Transactional emails and OTP verification via Nodemailer and SMS gateways.

---

## 🛠️ Tech Stack

- **Frontend Core**: React 19, Vite, React Router v7, Redux Toolkit
- **Styling & UI**: Tailwind CSS v4, Framer Motion, Lucide Icons, React Icons
- **Backend Runtime**: Node.js, Express.js
- **Database & Storage**: MongoDB (Mongoose ORM), Cloudinary
- **DevOps & Proxy**: Docker, Nginx, Powershell automation scripts

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.x or higher
- **MongoDB**: Local MongoDB instance or MongoDB Atlas Connection URI
- **Nginx**: (Optional for local multi-port routing)

### Quick Start Guide

#### 1. Backend Server Setup
```bash
cd backend/solarkits-central-backend
npm install
npm run dev
```
*Backend runs by default on `http://localhost:3000` or port configured in `.env`.*

#### 2. B2B Customer Solar Shop Frontend Setup
```bash
cd customer-apps/solarkits-solarshop-india
npm install
npm run dev
```
*Solar Shop UI runs by default on `http://localhost:5173`.*

#### 3. Unified Internal Admin Portal Setup
```bash
cd internal-admin-portal/solarkits-unified-admin
npm install
npm run dev
```
*Unified Admin Portal runs by default on `http://localhost:5174`.*

---

## 🔒 Security & Environment Configuration

Each application sub-folder contains an `example.env` file. Create a `.env` file in each directory with your specific configurations:

```env
# Backend .env Example
PORT=3000
MONGODB_URI=mongodb://localhost:27017/solarkits-project
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 📜 License & Copyright

© 2026 **SolarKits Technologies Pvt. Ltd.** All Rights Reserved.  
*B2B Solar E-Commerce Ecosystem Platform.*




live login panel on render: 

admin url :- https://solarkits-unified-admin.onrender.com

solar reseller : https://solarkits-reseller-portal.onrender.com

solar shop : https://solarkits-solarshop-india.onrender.com


new epc login id and pword :- 
Login URL: http://localhost:5177/auth/login
Email / Phone: samir@gmail.com (ya WhatsApp 9874561230)
Password: 1234