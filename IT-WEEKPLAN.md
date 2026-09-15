# ☀️ SolarKits v2.0 — IT Weekly Task Plan & Execution Blueprint
**Execution Window:** 13 September 2026 – 18 September 2026  
**Author:** SolarKits Engineering & Architecture Team  
**System Scope:** SolarShop India (`solar-store`), Reseller Portal (`solarkits-reseller-portal`), Unified Admin (`solarkits-unified-admin`), Central Backend (`solarkits-central-backend`), Warehouse Panel, ICICI Financial Gateway.

---

## 📑 Executive Summary

The primary objective of this weekly sprint is to achieve a production-grade, end-to-end commercial workflow by connecting the physical supply chain with the digital commerce and banking infrastructure. 

By 18 September 2026, the platform will support:
1. **Intelligent Order Fulfillment**: Validating franchisee warehouse capacity and automatically assigning vehicles based on volume, weight, and kW capacity.
2. **End-to-End Tracking**: Full 8-stage order lifecycle visibility for EPC buyers and Franchisee partners.
3. **Automated Banking**: Dual ICICI integration handling automated incoming collections (Virtual Account E-Collection) and outgoing payouts (Commissions and settlements).
4. **Network Vision Dashboard**: A hierarchical analytical command center (`India → Cluster → State → District → Franchisee → Warehouse`).
5. **Hierarchical Kit Catalog Governance**: Multi-tier kit activation (`Global → Cluster → State → Franchisee → Shop`).
6. **Multi-State Cluster Architecture**: Restructuring geographical grouping to allow multi-state clusters without breaking historical transactions.

---

## 🏗️ Architectural Core Pillars

```
                     ┌─────────────────────────────────────────────────────────┐
                     │                   GLOBAL KIT MASTER                     │
                     └────────────────────────────┬────────────────────────────┘
                                                  │
                                                  ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  GEOGRAPHY & CLUSTER HIERARCHY (NEW MULTI-STATE ARCHITECTURE)                                 │
│                                                                                              │
│   [INDIA (Level 1)]                                                                          │
│          └── [CLUSTER (Multi-State Hub)]                                                     │
│                    ├── State A (Level 2) ── District 1 ── Franchisee 1 ── Warehouse X        │
│                    └── State B (Level 2) ── District 2 ── Franchisee 2 ── Warehouse Y        │
└─────────────────────────────────────────┬────────────────────────────────────────────────────┘
                                          │
                        ┌─────────────────┴─────────────────┐
                        ▼                                   ▼
          ┌───────────────────────────┐       ┌───────────────────────────┐
          │  FRANCHISEE KIT ACTIVATION│       │ WAREHOUSE CAPACITY & STOCK│
          │  - Active/Inactive Kits   │       │ - Weight & kW Capacity    │
          │  - Industry / Project Type│       │ - Incoming Reserved Hold  │
          └─────────────┬─────────────┘       └─────────────┬─────────────┘
                        │                                   │
                        └─────────────────┬─────────────────┘
                                          ▼
                      ┌───────────────────────────────────────┐
                      │    DYNAMIC SHOP CATALOG (VISIBLE)     │
                      └───────────────────┬───────────────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │      EPC / FRANCHISEE CHECKOUT        │
                      │  - Delivery Location Choice           │
                      │  - Warehouse Capacity Validation      │
                      └───────────────────┬───────────────────┘
                                          │
                        ┌─────────────────┴─────────────────┐
                        ▼                                   ▼
          ┌───────────────────────────┐       ┌───────────────────────────┐
          │     ICICI E-COLLECTION    │       │     VEHICLE ASSIGNMENT    │
          │  - Virtual Account        │       │  - Kit Qty / Load / Weight│
          │  - MIS Webhook & Posting  │       │  - Smart Recommendation   │
          └─────────────┬─────────────┘       └─────────────┬─────────────┘
                        │                                   │
                        └─────────────────┬─────────────────┘
                                          ▼
                      ┌───────────────────────────────────────┐
                      │        8-STAGE ORDER TRACKING         │
                      │  Confirmed ──► Processing ──► Ready   │
                      │  ──► Dispatched ──► In Transit ──► POD│
                      └───────────────────┬───────────────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │         ADMIN VISION DASHBOARD        │
                      │  Drill-Down Analytics & Performance   │
                      └───────────────────────────────────────┘
```

---

## 🔍 Module-by-Module Detailed Breakdown

---

### Module 1: Order Journey + Delivery Management

#### 1.1 Checkout Delivery Location & Warehouse Capacity Validation
When an EPC Buyer or Franchisee completes a checkout, they are presented with 3 fulfillment modes:
1. **Franchisee Warehouse**
2. **EPC Warehouse / Self Warehouse**
3. **Direct Site Address / Pincode Delivery**

##### Logic Flow for Franchisee Warehouse Delivery:
```
Buyer Selects "Franchisee Warehouse"
         │
         ▼
Calculate Order Load Metrics:
  • Total Kits Count: Σ(Kit Items Quantity)
  • Total System Capacity: Σ(Quantity × Kit kW)
  • Total Payload Weight: Σ(Kit Net Weight in kg)
         │
         ▼
Fetch Warehouse Live Metrics:
  • Max Physical Storage Capacity (Kits / Weight / Area)
  • Current In-Stock Inventory
  • Pending / Allocated Inward Commitments (Incoming orders not yet dispatched)
         │
         ▼
Compute Available Capacity:
  Available Capacity = Max Capacity - (Current Stock + Reserved Incoming Orders)
         │
         ▼
Capacity >= Order Load?
   ├── YES ──► Enable "Franchisee Warehouse" radio option
   │           Display available slots & confirmation notice
   │
   └── NO  ──► Disable "Franchisee Warehouse" option
               Show warning: "Franchisee warehouse at capacity limit. Please select Direct Delivery or EPC Warehouse."
               Prevent order submission to this warehouse.
```

##### Critical Data Protection Rule:
* **Double Commit Prevention**: When an order is placed, immediately increment `allocated_incoming_capacity`. Do not wait for physical dispatch, or concurrent orders will cause an inventory overflow.

---

#### 1.2 Vehicle Assignment Settings & Recommendation Engine
The Delivery & Logistics team configures delivery vehicle fleets categorized by mechanical and logistical constraints:
* **Vehicle Master Fields**:
  * Vehicle Type (e.g., Tata Ace / 3-Wheeler Electric / 14ft Canter / 20ft Truck / 32ft Container).
  * Max Kit Quantity limit.
  * Max kW Load limit.
  * Max Payload Weight (kg).
  * Serviceable Geographies (Clusters, States, Districts, Pincodes).
  * Linked Warehouse.

##### Smart Auto-Recommendation Algorithm:
```javascript
// Recommendation Pseudocode
const eligibleVehicles = vehicles.filter(v => 
  v.is_active &&
  v.warehouse_id.equals(order.warehouse_id) &&
  v.max_kits >= order.total_kits &&
  v.max_weight_kg >= order.total_weight_kg &&
  v.max_kw >= order.total_kw &&
  v.serviceable_districts.includes(order.delivery_district_id)
);

// Rank by optimal capacity utilization (closest fit without exceeding capacity)
eligibleVehicles.sort((a, b) => a.max_weight_kg - b.max_weight_kg);
const recommendedVehicle = eligibleVehicles[0] || null;
```

##### Admin Override Capability:
If an Admin or Delivery Dispatcher decides to choose a different vehicle (e.g., due to breakdown, road restrictions, or bundling multiple orders), the system allows manual vehicle selection but requires:
* `override_reason` (Mandatory string, e.g., "Tata Ace unavailable; upgraded to Canter").
* `overridden_by` (Logged CMS User ID + timestamp).

---

#### 1.3 8-Stage Order & Dispatch Tracking
Both EPC Buyers and Franchisees must have real-time visibility through their portals (`solar-store` and `solarkits-reseller-portal`).

| Stage # | Stage Name | Trigger & Description |
| :--- | :--- | :--- |
| **1** | `Order Confirmed` | Payment verified via ICICI or Credit approval. Order acknowledged. |
| **2** | `Processing` | Warehouse picks items and prepares staging pallet. |
| **3** | `Vehicle Assigned` | System recommends or Admin assigns delivery vehicle & driver. |
| **4** | `Ready for Dispatch` | Quality check passed; e-Way bill generated; invoice attached. |
| **5** | `Dispatched` | Vehicle leaves warehouse gate; out-for-delivery notification sent. |
| **6** | `In Transit` | Vehicle en route; live location or milestone updates shown. |
| **7** | `Reached Destination` | Vehicle arrived at delivery address or franchisee warehouse. |
| **8** | `Delivered` | Delivery confirmed via Proof of Delivery (POD) - OTP or signature. |

---

### Module 2: Admin Vision Dashboard

The Vision Dashboard is the executive command center for network expansion, sales distribution, and warehouse utilization across India.

#### 2.1 Hierarchy Tree Drill-Down
```
[ALL INDIA]
   └── [CLUSTERS] (e.g., Western Hub, Northern Corridor, Southern Sun Zone)
          └── [STATES] (e.g., Maharashtra, Gujarat, Rajasthan)
                 └── [DISTRICTS] (e.g., Pune, Nashik, Surat)
                        └── [FRANCHISEES] (Active Reseller Partners)
                               └── [WAREHOUSES] (Primary & Secondary Hubs)
```

#### 2.2 Core Metric Cards & Analytics Visualizations
1. **Network Coverage**:
   * Total States Covered vs. Target.
   * Total Districts Active vs. Unassigned Districts.
   * Active vs. Target Franchisees (Expansion velocity).
2. **Franchisee Goal vs. Achievement**:
   * Assigned Monthly Targets (in kW and INR) vs. Actual Sales Achievement.
   * Top Performing Franchisees vs. Underperforming Franchisees.
3. **Warehouse Health**:
   * Total Storage Capacity vs. Occupied Stock vs. Inward Transit commitments.
   * Average dispatch turnaround time (TAT).
4. **Kit Performance & Adoption**:
   * Top-Selling Kits (by volume and by kW capacity).
   * Low-Selling / Stagnant Kits (alerting inventory aging).
   * Industry & Project Type Distribution (Residential Rooftop vs Commercial C&I vs Agricultural Solar Pumps).
5. **Multi-Dimension Filter Bar**:
   * `[Cluster]` | `[State]` | `[District]` | `[Franchisee]` | `[Warehouse]` | `[Industry]` | `[Project Type]` | `[Kit Model]` | `[kW Capacity]`

---

### Module 3: ICICI API Integration – Orders, E-Collection & Payout

Financial transactions in SolarKits operate on dual ICICI banking tracks: **E-Collection (Inward)** and **Payouts (Outward)**.

```
       ┌────────────────────────────────────────────────────────┐
       │                ICICI FINANCIAL GATEWAY                 │
       └───────────┬────────────────────────────────┬───────────┘
                   │                                │
                   ▼                                ▼
       ┌───────────────────────┐        ┌───────────────────────┐
       │   INWARD E-COLLECTION │        │    OUTWARD PAYOUTS    │
       │   (Orders & Top-ups)  │        │ (Commissions/Refunds) │
       └───────────┬───────────┘        └───────────┬───────────┘
                   │                                │
       ┌───────────┴───────────┐        ┌───────────┴───────────┐
       │ 1. Virtual Account    │        │ 1. Eligible Ledger Bal│
       │ 2. MSG HOLD (Validate)│        │ 2. Admin Approval Flow│
       │ 3. MIS Webhook (Credit│        │ 3. ICICI Payout API   │
       │ 4. Order Auto-Marked  │        │ 4. Bank UTR Logged    │
       └───────────────────────┘        └───────────────────────┘
```

#### 3.1 Inward E-Collection Journey
1. **Order Creation**: An EPC Buyer or Franchisee places an order.
2. **Virtual Account Generation**: The buyer is assigned a unique Virtual Account Number (e.g., `SKITSEPC98234` or dynamic QR).
3. **MSG HOLD Webhook**: When the remitter transfers funds (via NEFT/RTGS/IMPS), ICICI sends an encrypted `MSG HOLD` packet to validate the beneficiary.
   * Backend verifies account validity and responds with acceptance.
4. **MIS POSTING Webhook**: ICICI confirms credit and sends transaction reference (UTR, Amount, Remitter Name, Timestamp).
5. **Reconciliation & Order Status**:
   * Check for duplicate UTR (Idempotency).
   * Match order amount.
   * Change order state from `Payment Pending` → `Order Confirmed`.
   * Credit customer ledger / wallet if applicable.

#### 3.2 Outward Payout Journey
1. **Eligibility Trigger**: Franchisee earns sales commission or requires a margin settlement / refund.
2. **Approval Gateway**: Admin reviews requested payout in the Accounts / Unified Admin module.
3. **ICICI Payout Initiation**: Backend calls ICICI Corporate API (Encrypted packet with beneficiary IFSC, account number, amount, unique payout reference).
4. **Callback & Webhook**:
   * `SUCCESS`: Deduct from system liabilities, post ledger debit, notify franchisee with bank UTR.
   * `PENDING`: Keep payout in `Processing` state; poll or wait for callback.
   * `FAILED`: Roll back ledger hold, restore available balance, log bank error code.
5. **Duplicate Protection**: Unique idempotency token generated per payout ID to prevent double disbursements.

---

### Module 4: Franchisee-Level Kit Activation Module

Every Franchisee operates under specific contractual agreements, local grid regulations, and regional market demands. Admin requires granular control over kit availability per franchisee.

#### 4.1 Admin Control Interface
* **Navigation**: `Admin Portal → Franchisees → Select Franchisee → Kit Activation Tab`.
* **Details Displayed**:
  * Franchisee Profile (Name, Code, Contact).
  * Territory (Assigned State & District).
  * Franchisee Tier/Plan (Gold / Silver / Standard).
  * Available Industry Types (Residential, Commercial, Industrial, Agro).
  * Master Kit List with toggle switches.

#### 4.2 Kit Configuration Attributes
For each kit assigned to a franchisee, Admin can configure:
* **Activation Toggle**: `Active` / `Inactive`.
* **Kit Type**: ComboKit (Pre-engineered) vs. Customized Kit.
* **kW Capacity Range**: Allowed kW configurations (e.g., 3kW to 10kW allowed; 50kW disabled).
* **Allowed Project & Industry Types**: (e.g., Residential On-Grid only).
* **Effective Date Range**: Start date and optional expiry date.

#### 4.3 Catalog Enforcement:
When a Franchisee logs into `solarkits-reseller-portal` or an EPC buyer places an order in their territory, the query MUST filter:
```javascript
// Query Kit Availability Filter
const availableKits = await ComboKit.find({
  _id: { $in: franchiseeConfig.activated_kit_ids },
  is_active: true,
  capacity_kw: { $gte: minKw, $lte: maxKw }
});
```
Kits not activated for that franchisee will NEVER appear in their store or quotation builder.

---

### Module 5: Warehouse-Linked Shop + Dynamic Availability

Previously, shop products might have displayed nationwide. In the new architecture, kit availability is strictly tethered to the physical fulfillment network.

#### 5.1 End-to-End Availability Pipeline
```
[User Pincode / District Detected]
               │
               ▼
[Identify Serviceable Warehouse(s) for that District]
               │
               ▼
[Check Warehouse Kit Activation (Is the kit enabled at this warehouse?)]
               │
               ▼
[Check Live Real-Time Physical Stock (Available Inventory > 0)]
               │
               ▼
[Check Delivery Capability (Active Vehicle / Delivery Partner Serviceable)]
               │
               ▼
[DISPLAY IN SOLAR-STORE / EPC STORE WITH ESTIMATED DELIVERY TIME]
```

#### 5.2 Warehouse Configuration Matrix
Each warehouse record must maintain:
* **Serviceable Area**: List of mapped Districts and Pincodes.
* **Activated Kits**: Specific kit SKUs supported by the facility.
* **Physical Constraints**: Maximum storage weight (MT) and Kit capacity.
* **Live Stock Count**: On-hand units minus reserved allocations.

---

### Module 6: New Multi-State Cluster Architecture

Currently, clusters may have been mapped directly to individual states or districts. The business model now demands **Multi-State Regional Clusters** (e.g., *Western Hub* overseeing Maharashtra, Gujarat, and Goa).

#### 6.1 New Hierarchical Taxonomy
```
Level 1: Country (India)
   │
   └── Level 1.5: Cluster (Multi-State Regional Hub)
            │
            ├── Level 2: Multiple States (e.g., State A, State B, State C)
            │        │
            │        └── Level 3: Districts
            │                 │
            │                 ├── Franchisees (Territory Partner)
            │                 └── Warehouses (Fulfillment Hub)
```

#### 6.2 Kit Activation Inheritance Chain
To avoid configuring kits hundreds of times individually, activation follows a cascading inheritance rule:
```
[GLOBAL KIT CATALOG] (Kit created by SolarKits Master Admin)
         │
         ▼
[CLUSTER ACTIVATION] (Enabled for the entire multi-state cluster)
         │
         ├── [STATE ACTIVATION] (Inherited by all states in cluster, can disable specific state)
         │        │
         │        └── [FRANCHISEE ACTIVATION] (Inherited by franchisee, Admin can override)
         │                 │
         │                 └── [SHOP AVAILABILITY] (Visible to buyers in that zone)
```
* **Inheritance Rule**: A kit is active at the Franchisee level if and only if:
  `Global = Active` **AND** `Cluster = Active` **AND** `State != Blocked` **AND** `Franchisee = Active`.

#### 6.3 Backward Compatibility Safeguard
* Existing `orders`, `fpo_orders`, and `invoices` have foreign key references to historical state/district IDs.
* **Migration Rule**: The schema changes must update the parent references without altering historical document IDs. All reports querying past orders must use snapshot location data stored at the time of purchase.

---

## 📅 Day-by-Day Execution Plan (13 – 18 September 2026)

| Date | Phase / Target | Detailed Scope & Daily Milestones | Key Deliverables |
| :--- | :--- | :--- | :--- |
| **13 Sep** | **Order Journey & Warehouse Capacity** | • Build warehouse capacity calculation logic in checkout handler.<br>• Implement `available_capacity` check before allowing Franchisee Warehouse option.<br>• Add immediate capacity reservation hold upon order placement.<br>• Checkout UI: Disable warehouse radio when at capacity with clear banner. | ✅ Warehouse capacity validation API<br>✅ Checkout capacity guard<br>✅ Dual-mode checkout updated |
| **14 Sep** | **Vehicle Assignment & Tracking** | • Configure Vehicle Master schema (Max kits, Max kW, Max kg, Geographies).<br>• Develop Auto-Recommendation algorithm based on order size/weight.<br>• Build Admin Vehicle Assignment modal with mandatory override reason.<br>• Implement 8-stage order tracking pipeline in EPC & Franchisee portals.<br>• Add Proof of Delivery (POD) capture stub (OTP/signature). | ✅ Vehicle recommendation engine<br>✅ Admin vehicle override flow<br>✅ 8-stage tracking UI in portals |
| **15 Sep** | **ICICI E-Collection Integration** | • Validate Virtual Account generator for EPC / Franchisee checkout.<br>• Implement `MSG HOLD` webhook for remitter validation.<br>• Implement `MIS POSTING` webhook for transaction credit confirmation.<br>• Idempotency & duplicate UTR detection.<br>• Auto-reconcile order payment state (`Pending` → `Paid`). | ✅ ICICI E-Collection webhooks<br>✅ Transaction ledger logging<br>✅ Automated payment status trigger |
| **16 Sep** | **ICICI Payout & Vision Dashboard** | • Build ICICI Payout API service (IMPS/NEFT) for franchisee commissions/refunds.<br>• Payout approval workflow with admin auth.<br>• Payout status webhook (Success/Failure/Pending) & ledger adjustments.<br>• Start Admin Vision Dashboard: Build India → Cluster → State → District drill-down.<br>• Implement KPIs: Franchisee Goal vs Achievement, Active Warehouses, Kit sales. | ✅ ICICI Payout integration<br>✅ Payout ledger reconciliation<br>✅ Vision Dashboard frontend & API |
| **17 Sep** | **Franchisee Kit Activation & Shop** | • Build Admin Franchisee Kit Activation interface (`Admin → Franchisee → Kits`).<br>• Add kit activation attributes (Combo/Custom, kW range, Project types).<br>• Link dynamic Shop catalog with Warehouse inventory and serviceable pincodes.<br>• Ensure non-activated kits are hidden in Franchisee and EPC stores. | ✅ Franchisee Kit Activation module<br>✅ Warehouse-linked shop catalog<br>✅ Geographic availability filters |
| **18 Sep** | **Multi-State Clusters & Final QA** | • Restructure Cluster schema to hold `[state_ids]` (Multi-State Cluster).<br>• Implement Kit Activation Hierarchy (`Global → Cluster → State → Franchisee`).<br>• Run comprehensive end-to-end order-to-delivery test runs.<br>• Verify backward compatibility with existing orders and invoices.<br>• Bug fixing, code polish, GitHub branch merge, and final weekly sign-off. | ✅ Multi-state cluster architecture<br>✅ Kit inheritance logic verified<br>✅ End-to-end regression testing<br>✅ Weekly Completion Report |

---

## 📋 Comprehensive Testing & Verification Matrix

| Area | Test Case Description | Expected Result |
| :--- | :--- | :--- |
| **Warehouse Capacity** | Place order exceeding warehouse spare capacity. | "Franchisee Warehouse" delivery option is disabled; user directed to direct delivery. |
| **Capacity Double-Commit** | Place two simultaneous orders filling remaining capacity. | First order succeeds; second order dynamically rejects warehouse delivery. |
| **Vehicle Recommendation** | Create 15kW order weighing 1200kg. | System recommends optimal vehicle (e.g., Canter) within weight/kW parameters. |
| **Vehicle Override** | Admin overrides vehicle without entering reason. | System blocks submission with validation error: "Override reason required". |
| **Order Tracking** | Advance order through all 8 stages. | Real-time status, timestamps, and driver details update on buyer & reseller portals. |
| **ICICI E-Collection** | Send simulated ICICI MIS webhook with matching UTR. | Order automatically transitions to `Order Confirmed`, ledger credited, no duplicate credit on resend. |
| **ICICI Payout** | Initiate franchisee commission payout. | Admin approval required; ICICI API invoked; UTR captured; wallet debited. |
| **Kit Activation** | Deactivate Kit X for Franchisee Y. | Kit X immediately disappears from Franchisee Y's portal and EPC quote builder. |
| **Multi-State Cluster** | Assign Maharashtra and Gujarat to Cluster "Western Hub". | All reports, kit activations, and warehouse linkages function across both states without corrupting historical orders. |

---

## 🎯 Final Sprint Deliverables Checklist

- [ ] **End-to-End Order Journey Verified**: Checkout → Warehouse Capacity Check → Vehicle Assignment → Dispatch → 8-Stage Tracking → Delivery Confirmation.
- [ ] **Smart Vehicle Assignment**: Capacity calculations (kg, kW, kits) with Admin override tracking.
- [ ] **Vision Dashboard Deployed**: Multi-tier drill-down (`India → Cluster → State → District → Franchisee → Warehouse`) with complete filter set.
- [ ] **ICICI Banking Operations Active**: E-Collection automated order payments and outbound payout processing with reconciliation.
- [ ] **Franchisee Kit Activation Module**: Granular Admin controls over kit visibility and commercial parameters.
- [ ] **Warehouse-Linked Dynamic Storefront**: Real-time geolocation-based inventory presentation in `solar-store`.
- [ ] **Multi-State Cluster Hierarchy Migrated**: Cluster → Multiple States schema live with kit inheritance and zero data corruption.
- [ ] **Weekly Completion Documentation**: GitHub commits organized, test results logged, and executive handoff completed.
