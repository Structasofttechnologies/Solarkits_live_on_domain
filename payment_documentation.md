# 💳 SolarKits v2.0 — Razorpay Payment Gateway & Financial Accounting Integration Guide

> **Document Type:** Master Technical Integration Guide & Architecture Reference  
> **Target Audience:** Backend Developers, Full-Stack Engineers, System Architects, Accounts & Operations Teams  
> **Environment:** Node.js (Express), MongoDB (Mongoose), React (Vite / Tailwind CSS), Razorpay SDK (Standard & Webhook)  
> **Core Architectural Principle:** **100% Centralized Admin Payment Inflow** + **Manual Commission Payouts via Bank Transfer (NEFT/RTGS/IMPS)**  
> **File Name:** `payment_documentation.md`  
> **Last Updated:** August 2026

---

## 📑 Table of Contents

1. [Centralized Inflow Architecture & Financial Model](#1-centralized-inflow-architecture--financial-model)
2. [Razorpay Credentials & Environment Configuration](#2-razorpay-credentials--environment-configuration)
3. [The 4 Core Payment Gateway Touchpoints in SolarKits](#3-the-4-core-payment-gateway-touchpoints-in-solarkits)
   - [3.1 Flow 1: Franchisee Plan Purchasing & Registration (With Bank Details Capture)](#31-flow-1-franchisee-plan-purchasing--registration-with-bank-details-capture)
   - [3.2 Flow 2: Franchisee B2B Inventory Procurement (Bulk Product Buy)](#32-flow-2-franchisee-b2b-inventory-procurement-bulk-product-buy)
   - [3.3 Flow 3: Direct EPC Product Buying (Solar Store / Company Direct)](#33-flow-3-direct-epc-product-buying-solar-store--company-direct)
   - [3.4 Flow 4: Onboarded EPC Product Buying via Franchisee (Product Allocation & Territory Routing)](#34-flow-4-onboarded-epc-product-buying-via-franchisee-product-allocation--territory-routing)
4. [Franchisee Bank Details Lifecycle & Management](#4-franchisee-bank-details-lifecycle--management)
5. [Accounts Panel: Financial Calculations, Manual Commission Payouts & UTR Workflow](#5-accounts-panel-financial-calculations-manual-commission-payouts--utr-workflow)
6. [EPC Catalog Allocation & Storefront Visibility Rules](#6-epc-catalog-allocation--storefront-visibility-rules)
7. [Razorpay Webhook Architecture & Idempotent Processing](#7-razorpay-webhook-architecture--idempotent-processing)
8. [Step-by-Step Backend & Frontend Implementation Code](#8-step-by-step-backend--frontend-implementation-code)
9. [Testing & Sandbox Verification Checklist](#9-testing--sandbox-verification-checklist)

---

## 1. Centralized Inflow Architecture & Financial Model

### 🏛️ 100% Inflow to SolarKits Admin Account Rule

SolarKits v2.0 operates on a **Single Merchant Central Collection Architecture**:
1. **Direct Inflow:** Har transaction ka **100% payment directly SolarKits Company/Admin ke centralized Razorpay Account me aayega**.
   - Franchisee Plan khareede tab bhi 100% payment Admin ko aayega.
   - Franchisee bulk procurement khareede tab bhi 100% payment Admin ko aayega.
   - Direct EPC buyer buy kare tab bhi 100% payment Admin ko aayega.
   - Franchisee dwara onboard kiya gaya EPC order kare tab bhi **100% payment Admin ke Razorpay Account me aayega**.
2. **Zero Third-Party Gateway Splits:** Kisi bhi customer ya EPC ka paisa direct Franchisee ke bank ya gateway par nahi jata.
3. **Manual Commission Settlement:** Franchisee jo margin ya commission earn karta hai, wo system wallet me track hota hai aur **Admin Accounts Team manually NEFT / RTGS / IMPS ke zariye Franchisee ke registered Bank Account me transfer karti hai**, aur transaction ka **UTR / Bank Reference Number** enter karke payout status update karti hai.

### 🌟 High-Level Flowchart

```mermaid
flowchart TD
    subgraph Payment_Inflow [100% Direct Inflow to SolarKits Admin Razorpay]
        F1[1. Franchisee Plan Purchase\nAmount: Plan Fee]
        F2[2. Franchisee B2B Procurement\nAmount: Bulk Order Total]
        F3[3. Direct EPC Purchase\nAmount: Cart Grand Total]
        F4[4. Onboarded EPC Purchase\nAmount: Cart Grand Total]
    end

    subgraph Central_Razorpay [SolarKits Admin Razorpay Gateway]
        RZP[Company Razorpay Account\nMID: rzp_test_... / 100% Fund Inflow]
    end

    subgraph Backend_Ledgers [SolarKits Central Backend & Ledgers]
        LEDGER[Double-Entry Settlement Engine\nResellerWallet & Ledgers]
    end

    subgraph Admin_Accounts [Internal Admin Accounts Panel]
        ACCOUNTS[Accounts Team Review\nBank Details Verification]
        BANK_TRANSFER[Manual Bank Transfer\nNEFT / RTGS / IMPS]
        UTR_UPDATE[Enter UTR Number & Mark Paid]
    end

    subgraph Franchisee_Payout [Franchisee Receiving Commission]
        FRANCHISEE_BANK[Franchisee Bank Account\n(Account No / IFSC / Holder Name)]
    end

    F1 -->|100% Payment| RZP
    F2 -->|100% Payment| RZP
    F3 -->|100% Payment| RZP
    F4 -->|100% Payment| RZP

    RZP -->|Payment Captured / Webhook| LEDGER
    LEDGER -->|Margin Credited to Pending/Available| ACCOUNTS
    ACCOUNTS -->|View Bank Details & Payout Request| BANK_TRANSFER
    BANK_TRANSFER -->|Manual Transfer Funds| FRANCHISEE_BANK
    BANK_TRANSFER -->|Provide UTR Ref| UTR_UPDATE
    UTR_UPDATE -->|Payout Status: Paid & Wallet Debited| LEDGER
```

---

## 2. Razorpay Credentials & Environment Configuration

### 2.1 Backend `.env` Configuration
File path: `backend/solarkits-central-backend/.env`

```env
# ─── CENTRAL ADMIN RAZORPAY GATEWAY CREDENTIALS ──────────────────────────────
# All payments from Franchisees and EPC Buyers land strictly on this key
RAZORPAY_ID=rzp_test_T8B85UkbvoXBOQ
RAZORPAY_KEY=YOUR_RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET_STRING

# ─── PLATFORM SETTINGS ──────────────────────────────────────────────────────
PLATFORM_DEFAULT_GST_RATE=13.8
SETTLEMENT_HOLD_DAYS=7
```

### 2.2 Frontend `.env` Configuration
File paths:
- `customer-apps/solarkits-reseller-portal/.env`
- `customer-apps/solarkits-solarshop-india/.env`
- `customer-apps/solar-store/.env`

```env
VITE_RAZORPAY_KEY_ID=rzp_test_T8B85UkbvoXBOQ
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 3. The 4 Core Payment Gateway Touchpoints in SolarKits

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                             SOLARKITS PAYMENT GATEWAY MAP                                              │
├──────────────────────────┬───────────────────────┬────────────────────────────┬────────────────────────────────────────┤
│ Flow / Touchpoint        │ Paying Party          │ Receiving Entity           │ Financial & Ledger Workflow            │
├──────────────────────────┼───────────────────────┼────────────────────────────┼────────────────────────────────────────┤
│ 1. Franchisee Plan       │ Franchisee Partner    │ SolarKits Admin (100%)     │ 100% Platform Revenue + Bank Capture   │
│ 2. Franchisee B2B Buy    │ Franchisee Partner    │ SolarKits Admin (100%)     │ 100% Platform Revenue + Stock Addition │
│ 3. Direct EPC Buy        │ EPC Buyer (Direct)    │ SolarKits Admin (100%)     │ 100% Platform Revenue (₹0 Commission)  │
│ 4. Onboarded EPC Buy     │ EPC Buyer (Onboarded) │ SolarKits Admin (100%)     │ Admin Inflow + Franchisee Wallet Margin│
└──────────────────────────┴───────────────────────┴────────────────────────────┴────────────────────────────────────────┘
```

---

### 3.1 Flow 1: Franchisee Plan Purchasing & Registration (With Bank Details Capture)

#### 🎯 Purpose
Franchisee partner registration ke time ya plan upgrade karte waqt annual fee pay karta hai. Sath hi me commission payouts receive karne ke liye apni **Bank Account Details** provide karta hai.

#### 📂 Files Involved:
- **Frontend UI:** [`PlansPortal.jsx`](file:///d:/Company_project/SolarKits%20v2.0/customer-apps/solarkits-reseller-portal/src/pages/PlansPortal.jsx) & [`Register.jsx`](file:///d:/Company_project/SolarKits%20v2.0/customer-apps/solarkits-reseller-portal/src/pages/Register.jsx)
- **Backend Controller:** [`reseller.portal.handler.js`](file:///d:/Company_project/SolarKits%20v2.0/backend/solarkits-central-backend/src/modules/solarshop-india/controller/reseller.portal.handler.js)
- **Backend Service:** [`razorpay.service.js`](file:///d:/Company_project/SolarKits%20v2.0/backend/solarkits-central-backend/src/modules/admin-panel/services/razorpay.service.js)
- **Database Collections:** `resellers`, `reseller_plans`, `reseller_plan_subscriptions`

---

#### 🛠️ Step 1.1: Backend Order Creation API
Endpoint: `POST /api/india/v1/reseller/plans/create-order`  
File: `backend/solarkits-central-backend/src/modules/solarshop-india/controller/reseller.portal.handler.js`

```javascript
/**
 * POST /api/india/v1/reseller/plans/create-order
 * Franchisee plan subscription ke liye Admin Razorpay Order create karta hai.
 */
const create_plan_razorpay_order = async (req, res) => {
  try {
    const { plan_id, bank_details } = req.body;
    const resellerId = req.reseller._id;

    if (!plan_id || !mongoose.Types.ObjectId.isValid(plan_id)) {
      return res.status(400).json({ status: "error", message: "Valid plan_id is required" });
    }

    const plan = await ResellerPlan.findOne({ _id: plan_id, is_active: true, deleted_at: null });
    if (!plan) {
      return res.status(404).json({ status: "error", message: "Plan not found or inactive" });
    }

    // 1. Agar bank details di gayi hain to reseller profile me save karein
    if (bank_details && bank_details.account_number && bank_details.ifsc_code) {
      await Reseller.findByIdAndUpdate(resellerId, {
        $set: {
          bank_details: {
            bank_name: bank_details.bank_name?.trim(),
            account_number: bank_details.account_number?.trim(),
            ifsc_code: bank_details.ifsc_code?.trim().toUpperCase(),
            account_holder_name: bank_details.account_holder_name?.trim(),
            branch: bank_details.branch?.trim() || null,
            upi_id: bank_details.upi_id?.trim() || null,
            updated_at: new Date()
          }
        }
      });
    }

    // 2. Amount in integer Paise (100% goes to Admin)
    const amountInr = Number(plan.one_time_fee || 0);
    const amountPaise = Math.round(amountInr * 100);

    // 3. Central Razorpay order create karein
    const receiptId = `PLAN_REC_${String(resellerId).slice(-6)}_${Date.now()}`;
    const razorpayOrder = await createRazorpayOrder({
      amountPaise,
      currency: plan.currency || "INR",
      receipt: receiptId,
      notes: {
        flow_type: "franchisee_plan_subscription",
        reseller_id: resellerId.toString(),
        plan_id: plan._id.toString(),
        plan_name: plan.name
      }
    });

    return res.status(200).json({
      status: "success",
      data: {
        razorpay_order_id: razorpayOrder.order_id,
        amount_paise: razorpayOrder.amount_paise,
        amount_inr: razorpayOrder.amount_inr,
        currency: razorpayOrder.currency,
        key_id: process.env.RAZORPAY_ID,
        plan: { id: plan._id, name: plan.name, fee: plan.one_time_fee }
      }
    });
  } catch (error) {
    console.error("[reseller.portal] create_plan_razorpay_order error:", error);
    return res.status(500).json({ status: "error", message: error.message || "Failed to create plan order" });
  }
};
```

---

#### 🛠️ Step 1.2: Backend Payment Signature Verification & Plan Activation
Endpoint: `POST /api/india/v1/reseller/plans/verify-payment`  
File: `backend/solarkits-central-backend/src/modules/solarshop-india/controller/reseller.portal.handler.js`

```javascript
/**
 * POST /api/india/v1/reseller/plans/verify-payment
 * Signature verify karke 100% payment admin ko credit confirm karta hai aur plan activate karta hai.
 */
const verify_plan_payment = async (req, res) => {
  try {
    const { plan_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, bank_details } = req.body;
    const resellerId = req.reseller._id;

    if (!plan_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ status: "error", message: "All Razorpay signature fields are required" });
    }

    // 1. Cryptographic HMAC-SHA256 Signature Verification
    const isValid = verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
    if (!isValid) {
      return res.status(400).json({ status: "error", message: "Invalid payment signature. Security check failed!" });
    }

    const plan = await ResellerPlan.findById(plan_id);
    if (!plan) return res.status(404).json({ status: "error", message: "Plan not found" });

    // 2. Bank details save / update karein
    if (bank_details && bank_details.account_number && bank_details.ifsc_code) {
      await Reseller.findByIdAndUpdate(resellerId, {
        $set: {
          bank_details: {
            bank_name: bank_details.bank_name?.trim(),
            account_number: bank_details.account_number?.trim(),
            ifsc_code: bank_details.ifsc_code?.trim().toUpperCase(),
            account_holder_name: bank_details.account_holder_name?.trim(),
            branch: bank_details.branch?.trim() || null,
            upi_id: bank_details.upi_id?.trim() || null,
            updated_at: new Date()
          }
        }
      });
    }

    // 3. Subscription Dates Calculation
    const startDate = new Date();
    const expiryDate = new Date(startDate);
    if (plan.validity_unit === "months") {
      expiryDate.setMonth(expiryDate.getMonth() + (plan.validity_value || 12));
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + (plan.validity_value || 1));
    }

    const graceExpiryDate = new Date(expiryDate);
    const graceDays = plan.renewal_rules?.grace_period_days || 15;
    graceExpiryDate.setDate(graceExpiryDate.getDate() + graceDays);

    // 4. Old active subscriptions deactivate karein
    await ResellerPlanSubscription.updateMany(
      { reseller_id: resellerId, status: "active" },
      { $set: { status: "cancelled" } }
    );

    // 5. Subscription Record Create karein
    const subscription = await ResellerPlanSubscription.create({
      reseller_id: resellerId,
      plan_id: plan._id,
      start_date: startDate,
      expiry_date: expiryDate,
      grace_expiry_date: graceExpiryDate,
      amount_paid: plan.one_time_fee,
      currency: plan.currency || "INR",
      payment_reference: razorpay_payment_id,
      razorpay_order_id: razorpay_order_id,
      status: "active"
    });

    // 6. Reseller status: ACTIVE
    await Reseller.findByIdAndUpdate(resellerId, {
      $set: {
        plan_subscription_id: subscription._id,
        activation_status: "active"
      }
    });

    return res.status(200).json({
      status: "success",
      message: `Plan "${plan.name}" subscribed successfully! Payment received in Admin account.`,
      data: subscription
    });
  } catch (error) {
    console.error("[reseller.portal] verify_plan_payment error:", error);
    return res.status(500).json({ status: "error", message: error.message || "Plan verification failed" });
  }
};
```

---

### 3.2 Flow 2: Franchisee B2B Inventory Procurement (Bulk Product Buy)

#### 🎯 Purpose
Franchisee partner company warehouse se bulk inventory khareedta hai.
- **Payment Inflow:** 100% payment direct SolarKits Admin account me land hota hai.
- **Inventory Ledger:** Payment verify hote hi Franchisee ke `ResellerInventoryLedger` me `procurement_in` stock credit ho jata hai.
- **Product Authorization:** Product listings franchisee ke liye active ho jati hain.

---

### 3.3 Flow 3: Direct EPC Product Buying (Solar Store / Company Direct)

#### 🎯 Purpose
Jab EPC Buyer ya koi client website/store se direct purchase karta hai aur koi assigned Franchisee nahi hota:
- **Payment Inflow:** 100% payment direct SolarKits Admin account me aata hai.
- **Commission:** ₹0 (No franchise commission deducted).
- **Accounts Panel:** Direct EPC Transactions list me log hota hai.

---

### 3.4 Flow 4: Onboarded EPC Product Buying via Franchisee (Product Allocation & Territory Routing)

#### 🎯 Purpose & Workflow
Jab kisi Franchisee ka onboarded EPC Buyer purchase karta hai:
1. **100% Fund Inflow to Admin:** Pura order amount (e.g. ₹2,20,000 + GST) **direct SolarKits Admin ke Razorpay account me receive hota hai**.
2. **Catalog Allocation Check:** EPC buyer ko wahi products/kits view aur order karne milte hain jo company dwara us region/franchisee ko allocate kiye gaye hain.
3. **Reseller Margin Calculation:** Base Price (e.g. ₹1,80,000) aur Selling Price (e.g. ₹2,20,000) ke beech ka net margin (e.g. ₹40,000 minus platform commission) Franchisee ke **`ResellerWallet` (Pending Balance)** me credit hota hai.
4. **Manual Admin Payout:** Yeh margin Franchisee ko direct online nahi jata, balki **Admin Accounts panel se manually transfer kiya jata hai**.

---

## 4. Franchisee Bank Details Lifecycle & Management

Franchisee ki bank details commission receive karne ke liye pure lifecycle me capture aur update hoti hain:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 BANK DETAILS MANAGEMENT LIFECYCLE                                │
├────────────────────────────────┬───────────────────────────────┬─────────────────────────────────┤
│ Stage                          │ Where it Happens              │ What Data is Handled            │
├────────────────────────────────┼───────────────────────────────┼─────────────────────────────────┤
│ 1. Registration / Plan Buy     │ Register.jsx / PlansPortal    │ Account No, IFSC, Holder Name   │
│ 2. Profile / Account Settings  │ Reseller Account Settings     │ Edit/Update Bank Details & UPI  │
│ 3. Payout Request Snapshot     │ WalletPortal.jsx              │ Locked Snapshot at request time │
│ 4. Admin Accounts Payout       │ ResellerWalletManager (Admin) │ Verified Details + UTR Entry    │
└────────────────────────────────┴───────────────────────────────┴─────────────────────────────────┘
```

### 4.1 Reseller Schema Bank Details Structure
File: `backend/solarkits-central-backend/src/modules/admin-panel/models/india_solarshop_db/resellers.schema.js`

```javascript
// Bank Details subdocument inside Reseller Schema
bank_details: {
  bank_name:           { type: String, default: null, trim: true },
  account_number:      { type: String, default: null, trim: true },
  ifsc_code:           { type: String, default: null, trim: true, uppercase: true },
  account_holder_name: { type: String, default: null, trim: true },
  branch:              { type: String, default: null, trim: true },
  upi_id:              { type: String, default: null, trim: true },
  is_verified:         { type: Boolean, default: false },
  updated_at:          { type: Date, default: Date.now }
}
```

### 4.2 Endpoint: Update Bank Details by Franchisee
Endpoint: `PUT /api/india/v1/reseller/profile/bank-details`  
File: `backend/solarkits-central-backend/src/modules/solarshop-india/controller/reseller.portal.handler.js`

```javascript
/**
 * PUT /api/india/v1/reseller/profile/bank-details
 * Franchisee partner apni commission receiving bank details update karta hai.
 */
const update_reseller_bank_details = async (req, res) => {
  try {
    const resellerId = req.reseller._id;
    const { bank_name, account_number, ifsc_code, account_holder_name, branch, upi_id } = req.body;

    if (!bank_name || !account_number || !ifsc_code || !account_holder_name) {
      return res.status(400).json({
        status: "error",
        message: "Bank Name, Account Number, IFSC Code, and Account Holder Name are required."
      });
    }

    // Basic IFSC validation (4 letters + 0 + 6 alphanumeric)
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifsc_code.trim().toUpperCase())) {
      return res.status(400).json({ status: "error", message: "Invalid IFSC code format (e.g. SBIN0001234)" });
    }

    const updatedReseller = await Reseller.findByIdAndUpdate(
      resellerId,
      {
        $set: {
          "bank_details.bank_name": bank_name.trim(),
          "bank_details.account_number": account_number.trim(),
          "bank_details.ifsc_code": ifsc_code.trim().toUpperCase(),
          "bank_details.account_holder_name": account_holder_name.trim(),
          "bank_details.branch": branch ? branch.trim() : null,
          "bank_details.upi_id": upi_id ? upi_id.trim() : null,
          "bank_details.updated_at": new Date()
        }
      },
      { new: true }
    ).select("business_name email mobile bank_details");

    return res.json({
      status: "success",
      message: "Bank details updated successfully! Commission payouts will be transferred to this account.",
      data: updatedReseller.bank_details
    });
  } catch (error) {
    console.error("update_reseller_bank_details error:", error);
    return res.status(500).json({ status: "error", message: "Failed to update bank details" });
  }
};
```

---

## 5. Accounts Panel: Financial Calculations, Manual Commission Payouts & UTR Workflow

Accounts Panel (`internal-admin-portal/solarkits-unified-admin/src/portals/accounts`) se SolarKits Finance Team live financial tracking aur manual payouts perform karti hai.

### 5.1 Step-by-Step Manual Payout Process:
1. **Franchisee Payout Request:** Franchisee apne wallet se withdrawal request initiate karta hai (`POST /api/india/v1/reseller/wallet/payout-request`).
2. **Admin Review:** Accounts team Payouts Management screen par request open karti hai. Wahan Franchisee ka **Account Number, Bank Name, IFSC, Holder Name, aur Amount** display hota hai.
3. **Company Bank Transfer:** Finance manager SolarKits Company Bank (Corporate Netbanking) se NEFT/RTGS/IMPS initiate karta hai.
4. **UTR Submission:** Bank transfer complete hone ke baad Finance manager panel me **Bank UTR / Transaction Reference Number** enter karke `Mark as Paid` par click karta hai.
5. **Ledger Debit:** System atomic transaction me `ResellerWallet` se `available_balance` deduct karta hai aur ledger entry create karta hai.

---

### 5.2 Admin Payout Processing Controller
Endpoint: `PUT /admin-api/reseller-mgmt/wallet/payouts/process/:id`  
File: `backend/solarkits-central-backend/src/modules/admin-panel/controller/reseller.wallet.admin.handler.js`

```javascript
/**
 * PUT /admin-api/reseller-mgmt/wallet/payouts/process/:id
 * Body: { decision: "paid" | "rejected", transaction_reference: "UTR_NUMBER", notes?: string }
 */
const review_payout_request = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { decision, transaction_reference, notes } = req.body;

    if (!["paid", "rejected"].includes(decision)) {
      await session.abortTransaction();
      return res.status(400).json({ status: "error", message: "Decision must be 'paid' or 'rejected'" });
    }

    const payout = await ResellerPayoutRequest.findById(id).session(session);
    if (!payout) {
      await session.abortTransaction();
      return res.status(404).json({ status: "error", message: "Payout request not found" });
    }

    if (payout.status !== "pending") {
      await session.abortTransaction();
      return res.status(409).json({ status: "error", message: `Payout already processed with status: ${payout.status}` });
    }

    if (decision === "paid") {
      if (!transaction_reference || !transaction_reference.trim()) {
        await session.abortTransaction();
        return res.status(400).json({ status: "error", message: "Bank UTR / Transaction Reference is mandatory to mark paid" });
      }

      // 1. Update payout record with UTR
      payout.status = "paid";
      payout.utr_reference = transaction_reference.trim();
      payout.transaction_reference = transaction_reference.trim();
      payout.processed_by = req.user?.id || null;
      payout.processed_at = new Date();
      payout.notes = notes || `Manually transferred via Bank NEFT/RTGS. UTR: ${transaction_reference.trim()}`;
      await payout.save({ session });

      // 2. Reseller wallet update: Deduct available, Increase total_withdrawn
      const wallet = await ResellerWallet.findOne({ reseller_id: payout.reseller_id }).session(session);
      if (wallet) {
        wallet.available_balance_paise = Math.max(0, (wallet.available_balance_paise || 0) - payout.amount_paise);
        wallet.available_balance = wallet.available_balance_paise / 100;
        wallet.total_withdrawn_paise = (wallet.total_withdrawn_paise || 0) + payout.amount_paise;
        wallet.total_withdrawn = wallet.total_withdrawn_paise / 100;
        await wallet.save({ session });
      }

      // 3. Reseller Wallet Ledger entry for Debit
      await ResellerWalletLedger.create([{
        reseller_id: payout.reseller_id,
        transaction_type: "payout_debit",
        amount: payout.amount_paise / 100,
        net_amount_paise: payout.amount_paise,
        balance_type: "available",
        balance_after: wallet ? wallet.available_balance : 0,
        reference_payout_id: payout._id,
        narration: `Bank Payout Transferred (UTR: ${transaction_reference.trim()}) to ${payout.bank_details_snapshot.bank_name} A/C ${payout.bank_details_snapshot.account_number}`
      }], { session });

    } else if (decision === "rejected") {
      payout.status = "rejected";
      payout.rejection_reason = notes || "Rejected by Admin Accounts";
      payout.processed_by = req.user?.id || null;
      payout.processed_at = new Date();
      await payout.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return res.json({
      status: "success",
      message: `Payout request marked as ${decision}. UTR ${transaction_reference || 'N/A'} recorded.`,
      data: payout
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("review_payout_request error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};
```

---

## 6. EPC Catalog Allocation & Storefront Visibility Rules

Franchisee dwara onboard kiye gaye EPC Buyer ko Storefront me authorized products hi display hote hain:

1. **Allocated Scope:** Jab Franchisee B2B procurement karta hai ya Admin product authorization grant karta hai (`ResellerProductAuthorization`), tab wo product ID `reseller_listings` me **`is_published: true`** mark hota hai.
2. **EPC Storefront Query:**
   ```javascript
   // EPC buyer catalog fetch karte waqt assigned reseller ke authorized products filter hote hain:
   const assignedResellerId = epc.primary_reseller_id;
   const authorizedListings = await ResellerListing.find({
     reseller_id: assignedResellerId,
     is_published: true
   }).populate('product_id');
   ```
3. **Selling Price Enforcement:** EPC ko wahi Selling Price dikhai deta hai jo company / reseller pricing rules dwara set kiya gaya hai.
4. **Order Inflow:** Jab EPC buy karta hai, checkout amount **Admin account me receive hota hai**, aur difference margin reseller ke wallet me compute ho jata hai.

---

## 7. Razorpay Webhook Architecture & Idempotent Processing

Server-side webhooks network failure ya customer dwara browser tab close karne par bhi order payment record karte hain.

### 🛡️ Webhook Rules:
1. **Raw Body Parsing:** Webhook route me `express.raw({ type: '*/*' })` use karna mandatory hai taaki original byte-stream HMAC hash verify ho sake.
2. **Idempotency Log:** Har event ko `RazorpayWebhookLog` collection me check kiya jata hai via `event_id`. Duplicate webhook requests skip ho jati hain.

#### 📂 Webhook Implementation:
File: `backend/solarkits-central-backend/src/modules/solarshop-india/controller/v1.handlers/razorpay.webhook.handler.js`

```javascript
/**
 * Server-Side Idempotent Webhook Handler
 * Route: POST /api/india/v1/shop/razorpay/webhook
 */
const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = req.body; // express.raw() ensures this is a Buffer

    // 1. Verify Webhook Signature
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn("[Razorpay Webhook] Invalid signature detected. Rejected!");
      return res.status(400).json({ status: "error", message: "Invalid webhook signature" });
    }

    // 2. Parse Event Payload
    const payload = JSON.parse(rawBody.toString("utf8"));
    const eventId = payload.event_id || payload.id;
    const eventType = payload.event;
    const entity = payload.payload?.payment?.entity || payload.payload?.order?.entity || {};

    // 3. Idempotency Check (Prevent duplicate execution)
    const existingLog = await RazorpayWebhookLog.findOne({ event_id: eventId });
    if (existingLog) {
      return res.status(200).json({ status: "ok", message: "Duplicate event already processed" });
    }

    // 4. Record Webhook Log
    await RazorpayWebhookLog.create({
      event_id: eventId,
      event_type: eventType,
      order_id: entity.order_id || entity.id,
      payment_id: entity.id,
      payload,
      processed: true
    });

    // 5. Event Handling Logic (Order paid / captured)
    if (eventType === "order.paid" || eventType === "payment.captured") {
      const razorpayOrderId = entity.order_id || entity.id;
      const razorpayPaymentId = entity.id || entity.payment_id;

      // EPC Order check karein
      const epcOrder = await EpcOrder.findOne({
        $or: [{ razorpay_order_id: razorpayOrderId }, { _id: razorpayOrderId }]
      });

      if (epcOrder && epcOrder.payment_status !== "captured") {
        await confirmEpcOrderPayment(epcOrder._id, razorpayPaymentId, null, req);
      }

      // Franchisee Procurement Order check karein
      const procOrder = await ResellerProcurementOrder.findOne({
        $or: [{ razorpay_order_id: razorpayOrderId }, { _id: razorpayOrderId }]
      });

      if (procOrder && procOrder.payment_status !== "captured") {
        procOrder.payment_status = "captured";
        procOrder.order_status = "paid";
        procOrder.payment_reference = razorpayPaymentId;
        await procOrder.save();
      }
    }

    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("[Razorpay Webhook] Error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};
```

---

## 8. Step-by-Step Backend & Frontend Implementation Code

### 📁 Summary of Files to Modify / Verify:

| # | File Path | Type | What to Implement / Verify |
|---|---|---|---|
| 1 | `backend/.../modules/admin-panel/services/razorpay.service.js` | Backend Utility | Central `createRazorpayOrder`, `verifyPaymentSignature`, `verifyWebhookSignature` |
| 2 | `backend/.../modules/solarshop-india/controller/reseller.portal.handler.js` | Backend Handler | Plan Buy Order Create, Bank Details Capture, Verification & Update API |
| 3 | `backend/.../modules/admin-panel/controller/reseller.wallet.admin.handler.js` | Backend Admin | Manual Commission Payout review, UTR persistence, Ledger balance update |
| 4 | `backend/.../modules/admin-panel/services/epc.order.service.js` | Backend Engine | 100% Inflow to Admin Razorpay, 15-min stock hold, Reseller Wallet credit |
| 5 | `customer-apps/solarkits-reseller-portal/src/pages/PlansPortal.jsx` | Frontend Reseller | Plan buy modal with Bank Details input & Razorpay checkout |
| 6 | `customer-apps/solarkits-reseller-portal/src/pages/WalletPortal.jsx` | Frontend Reseller | Live balance, Bank Details view/edit, Payout request submission |
| 7 | `customer-apps/solarkits-solarshop-india/src/pages/CheckOut.jsx` | Frontend Store | Solar Store EPC Razorpay Modal checkout |

---

## 9. Testing & Sandbox Verification Checklist

Aap automated test suite run karke pura Razorpay checkout lifecycle verify kar sakte hain.

### 🧪 Run Central Test Suite:
Command prompt / PowerShell me backend directory me run karein:

```bash
cd "d:\Company_project\SolarKits v2.0\backend\solarkits-central-backend"
node src/scratch/test_razorpay_checkout_flow.js
```

### ✅ Verification Checklist:
- [x] **100% Admin Inflow:** Saare payments (Plan, Procurement, Direct EPC, Onboarded EPC) Company ke Razorpay MID me aate hain.
- [x] **Bank Details Captured:** Plan khareedte waqt Franchisee ki Bank Account Details capture hoti hain aur profile se edit/update ho sakti hain.
- [x] **EPC Allocated Catalog:** Onboarded EPC ko company/franchisee dwara allocate kiye gaye authorized products hi view hote hain.
- [x] **Manual Payout Transfer:** Admin Accounts panel me bank details display hoti hain aur Admin NEFT/RTGS karke UTR enter karke status `paid` mark karta hai.
- [x] **Ledger Double-Entry:** Wallet ledger balance and settlement cycle accurately reflect debit and credit entries.

---

> 💡 **Reference Documentation:**  
> Master Document File: [payment_documentation.md](file:///d:/Company_project/SolarKits%20v2.0/payment_documentation.md)
