# Super Admin Guide: Product Creation, Reseller Assignment & EPC Storefront Management

This guide explains step-by-step how Super Admins can manage product creation, configure pricing & margin boundaries, assign products to eligible resellers, oversee reseller acceptance/publishing, and verify multi-tenant EPC storefront visibility.

---

## 1. Create and Activate a Product

1. Navigate to the **Admin Portal** -> **SolarShop Management** -> **Products & SKUs**.
2. Click **Create New Product**.
3. Enter basic details:
   - **Product Name**: e.g., `Mono PERC 550W Bifacial Solar Panel`
   - **SKU Code**: e.g., `WAA-550M-PERC`
   - **High-Quality Image URL**: e.g., product image link
   - **Detailed Description & Technical Specifications**: Wattage, efficiency, cell type, warranty, dimensions.
4. Toggle **Status** to `Active` (Products must be active before they can be assigned to channel partners).

---

## 2. Configure Industry, Category, Pricing, Stock, Taxes & Margin Limits

On the product configuration form:
- **Industry Type**: Select the target industry (e.g., `Residential Solar`, `Commercial & Industrial`).
- **Category & Subcategory**: Select product category (e.g., `Solar Panels` -> `Mono PERC Panels`).
- **Brand**: Select manufacturer brand (e.g., `Waaree Energies`).
- **Reseller Base / Purchase Price**: Set the B2B purchase price charged to resellers (e.g., ₹18,000).
- **Minimum Reseller Margin**: Set the minimum allowed margin (e.g., ₹1,000).
- **Maximum Reseller Margin**: Set the maximum allowed margin limit (e.g., ₹5,000).
- **Applicable GST Tax Rate**: Set applicable GST % (e.g., 18%).
- **Stock Quantity**: Input available warehouse inventory count (e.g., 150 units).

Click **Save Product**.

---

## 3. Assign Product to an Eligible Reseller

1. Navigate to **Reseller Management** -> **Product Authorization Matrix**.
2. Select the target reseller account (e.g., `Structasoft Admin Reseller`).
3. **System Eligibility Validation**:
   - The system automatically checks whether the product's Industry Type matches the reseller's **Approved Industry Eligibility**.
   - If the product's industry is not approved for that reseller, assignment is blocked with a validation error.
4. Select **Scope Level**: `Product`.
5. Select the newly created product.
6. Click **Save Authorization**.
7. **Initial Status**: The system assigns the product to the reseller in `Assigned` status. It will NOT automatically appear on the reseller's storefront until accepted and published by the reseller.

---

## 4. Reseller Acceptance & Purchase Flow

1. The reseller logs into the **Reseller Portal** at `http://localhost:5178/storefront-listings`.
2. The product appears with status badge `Assigned by Admin`.
3. The reseller clicks **Accept & Purchase Product**.
4. The product status transitions to `Purchased / Accepted`.

---

## 5. Margin Configuration & Product Publication

1. Under the purchased product card on `http://localhost:5178/storefront-listings`:
   - The reseller enters their profit margin in INR (e.g., ₹2,500).
   - **Backend Bound Validation**: The backend validates that `₹1,000 ≤ Margin ≤ ₹5,000`.
   - **Automatic Price Calculation**:
     $$\text{Subtotal} = \text{Reseller Purchase Price} (\text{₹}18,000) + \text{Reseller Margin} (\text{₹}2,500) = \text{₹}20,500$$
     $$\text{Taxes (18\% GST)} = \text{₹}3,690$$
     $$\text{Final EPC Selling Price} = \text{₹}24,190$$
2. Click **Save Margin**. Status changes to `Ready to Publish`.
3. Click **Publish to EPC**. Status changes to `Published & Visible to EPC`.

---

## 6. Verify Storefront & EPC Catalogue Visibility

1. **Reseller Storefront Verification (`http://localhost:5178/storefront-listings`)**:
   - Verify product card displays large image, title, SKU, tags, stock count (`In Stock`), reseller cost price (`₹18,000`), profit margin (`₹2,500`), and final selling price (`₹24,190.00`).
2. **EPC Catalogue Verification (`/api/india/v1/shop/epc-catalogue`)**:
   - Log in as an EPC user onboarded by `Structasoft Admin Reseller`.
   - Query the EPC catalogue endpoint.
   - **Tenant Isolation**: Only published products belonging to `Structasoft Admin Reseller` are visible.
   - **Confidentiality Check**: The EPC output payload displays `final_price_inr: "24190.00"`.
   - **Confidential Pricing Protected**: `cost_price_paise`, base price, reseller profit margin, and admin bounds are **100% hidden** from the EPC payload.
