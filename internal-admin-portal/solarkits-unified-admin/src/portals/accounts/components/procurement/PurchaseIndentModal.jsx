import React, { useState, useEffect } from "react";
import {
  FaFileInvoice, FaBuilding, FaTruck, FaWarehouse, FaTimes,
  FaCheckCircle, FaCalendarAlt, FaShieldAlt, FaInfoCircle, FaBoxes
} from "react-icons/fa";
import Dialog from "../Dialog";
import Button from "../Button";
import CustomInput from "../CustomInput";

export default function PurchaseIndentModal({
  isOpen,
  onClose,
  selectedOrder,
  selectedBatch,
  bomItem,
  destinationWarehouse,
  onSubmit,
  loading
}) {
  const [supplierName, setSupplierName] = useState("");
  const [supplierBrand, setSupplierBrand] = useState("");
  const [supplierGst, setSupplierGst] = useState("");
  const [isOemPartner, setIsOemPartner] = useState(false);
  const [procureQuantity, setProcureQuantity] = useState(1);
  const [unitRate, setUnitRate] = useState(0);
  const [gstRate, setGstRate] = useState(13.8);
  const [fulfilmentMethod, setFulfilmentMethod] = useState("Company Pickup");
  const [supplierWarehouseAddress, setSupplierWarehouseAddress] = useState("");
  const [transportCost, setTransportCost] = useState(0);
  const [advancePercentage, setAdvancePercentage] = useState(30);
  const [productionTatDays, setProductionTatDays] = useState(5);
  const [supplyTatDays, setSupplyTatDays] = useState(3);
  const [paymentTerms, setPaymentTerms] = useState("30% Advance, 70% Before Dispatch");
  const [expectedPickupDate, setExpectedPickupDate] = useState("");
  const [expectedDispatchDate, setExpectedDispatchDate] = useState("");
  const [expectedInwardDate, setExpectedInwardDate] = useState("");

  useEffect(() => {
    if (bomItem) {
      setProcureQuantity(bomItem.supplier_quantity || bomItem.required_quantity || 1);
      setUnitRate(bomItem.unit_rate || (bomItem.component_type === "panel" ? 6875 : bomItem.component_type === "inverter" ? 32000 : 12000));
      
      const defaultPartner = bomItem.selected_partner || bomItem.eligible_partners?.[0];
      if (defaultPartner) {
        setSupplierName(defaultPartner.name || "");
        setSupplierBrand(defaultPartner.brand_name || defaultPartner.name || "");
        setIsOemPartner(Boolean(defaultPartner.is_oem));
      }

      // Default dates: Expected Inward ~ 7 days out
      const today = new Date();
      const in3Days = new Date(today.getTime() + 3 * 86400000).toISOString().split("T")[0];
      const in7Days = new Date(today.getTime() + 7 * 86400000).toISOString().split("T")[0];
      setExpectedPickupDate(in3Days);
      setExpectedDispatchDate(in3Days);
      setExpectedInwardDate(in7Days);
    }
  }, [bomItem]);

  const handlePartnerSelect = (partner) => {
    setSupplierName(partner.name);
    setSupplierBrand(partner.brand_name || partner.name);
    setIsOemPartner(Boolean(partner.is_oem));
  };

  const subtotal = procureQuantity * unitRate;
  const taxAmount = Math.round((subtotal * gstRate) / 100);
  const totalPiValue = subtotal + taxAmount;
  const advanceAmount = Math.round((totalPiValue * advancePercentage) / 100);
  const balanceAmount = totalPiValue - advanceAmount;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      alert("Please select or enter an eligible Supplier / OEM Partner.");
      return;
    }
    if (procureQuantity <= 0) {
      alert("Procurement quantity must be greater than zero.");
      return;
    }

    const payload = {
      customer_order_number: selectedOrder?.order_number || selectedBatch?.order_numbers?.[0] || "ORD-2026-COMBINED",
      customer_order_id: selectedOrder?.id || null,
      order_group_id: selectedBatch?.group_id || null,
      supplier_name: supplierName,
      supplier_brand: supplierBrand,
      supplier_gst: supplierGst,
      is_oem_partner: isOemPartner,
      destination_warehouse_id: destinationWarehouse?.id || selectedBatch?.supplier_groups?.[0]?.warehouse_id || "670000000000000000000001",
      destination_warehouse_name: destinationWarehouse?.name || "Central Warehouse",
      items: [
        {
          sku_id: bomItem?.sku_id || null,
          sku_code: bomItem?.sku_code || "SKU-SOLAR",
          product_name: bomItem?.product_name || "Solar Component",
          quantity: Number(procureQuantity),
          unit_rate: Number(unitRate),
          gst_rate: Number(gstRate),
          tax_amount: taxAmount,
          total_value: totalPiValue
        }
      ],
      fulfilment: {
        method: fulfilmentMethod,
        supplier_warehouse_address: supplierWarehouseAddress || "Supplier Primary Works",
        transport_responsibility: fulfilmentMethod === "Company Pickup" ? "Company" : "Supplier",
        transport_cost: Number(transportCost) || 0,
        expected_pickup_date: fulfilmentMethod === "Company Pickup" ? expectedPickupDate : null,
        expected_dispatch_date: fulfilmentMethod === "Supplier Delivery" ? expectedDispatchDate : null,
        expected_inward_date: expectedInwardDate
      },
      payment_terms: `${advancePercentage}% Advance, ${100 - advancePercentage}% Before Dispatch`,
      advance_percentage: advancePercentage,
      advance_amount: advanceAmount,
      balance_percentage: 100 - advancePercentage,
      balance_amount: balanceAmount,
      production_tat_days: productionTatDays,
      supply_tat_days: supplyTatDays
    };

    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Create Supplier Purchase Indent (PI)" size="xl">
      <form onSubmit={handleSubmit} className="space-y-5 p-1 text-text-primary">
        
        {/* Header Banner: Order & Warehouse Context */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black tracking-widest uppercase text-primary block">
              Procurement Target
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-base font-black text-text-primary">
                {selectedOrder ? `Order #${selectedOrder.order_number}` : `Batch #${selectedBatch?.group_id}`}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface border border-border text-text-muted font-bold">
                {selectedOrder?.customer_name || `${selectedBatch?.order_count || 1} Linked Orders`}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-black tracking-widest uppercase text-text-muted block">
              Destination Warehouse
            </span>
            <div className="flex items-center gap-1.5 justify-end text-sm font-bold text-text-primary mt-0.5">
              <FaWarehouse className="text-primary" />
              <span>{destinationWarehouse?.name || "Central Regional Warehouse"}</span>
            </div>
          </div>
        </div>

        {/* Product & Quantity Breakdown */}
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <FaBoxes className="text-primary text-base" />
              <h3 className="text-xs font-black uppercase tracking-wider text-text-primary">
                Product & Indent Quantity
              </h3>
            </div>
            <span className="text-xs font-bold text-text-muted">
              SKU: <code className="text-primary font-mono">{bomItem?.sku_code}</code>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="text-[11px] font-bold text-text-muted uppercase block mb-1">
                Product Name
              </label>
              <div className="p-2.5 bg-bg border border-border rounded-xl text-xs font-bold text-text-primary">
                {bomItem?.product_name || "Solar Component"}
              </div>
            </div>

            <div>
              <CustomInput
                label="Indent Qty *"
                type="number"
                min="1"
                required
                value={procureQuantity}
                onChange={(e) => setProcureQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <span className="text-[10px] text-text-muted block mt-0.5">
                Total Required: {bomItem?.required_quantity} {bomItem?.unit}
              </span>
            </div>

            <div>
              <CustomInput
                label="Unit Rate (₹) *"
                type="number"
                min="0"
                required
                value={unitRate}
                onChange={(e) => setUnitRate(Math.max(0, parseFloat(e.target.value) || 0))}
              />
              <span className="text-[10px] text-text-muted block mt-0.5">
                Excl. GST @ {gstRate}%
              </span>
            </div>
          </div>
        </div>

        {/* Supplier / OEM Selection (with Regional Eligibility Rule) */}
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div className="flex items-center gap-2">
              <FaBuilding className="text-primary text-base" />
              <h3 className="text-xs font-black uppercase tracking-wider text-text-primary">
                Supplier / OEM Partner Sourcing
              </h3>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              Admin Region Mapped
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-text-muted uppercase block">
              Eligible Partners for this Warehouse & Product:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(bomItem?.eligible_partners || []).map((partner) => {
                const isSelected = supplierName === partner.name;
                return (
                  <div
                    key={partner.id || partner.name}
                    onClick={() => handlePartnerSelect(partner)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? "bg-primary/5 border-primary shadow-xs"
                        : "bg-surface border-border hover:border-primary/40"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-text-primary">{partner.name}</span>
                        {partner.is_oem ? (
                          <span className="text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 border border-purple-500/20">
                            OEM (SOLARKITS)
                          </span>
                        ) : (
                          <span className="text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 border border-blue-500/20">
                            Supplier (Own Brand)
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-text-muted mt-0.5">
                        Brand: <strong className="text-text-primary">{partner.brand_name || partner.name}</strong>
                      </p>
                    </div>
                    {isSelected && <FaCheckCircle className="text-primary mt-1 text-sm flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <CustomInput
              label="Selected Supplier / OEM Name *"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="e.g. Adani Solar Works / Growatt"
              required
            />
            <CustomInput
              label="Supplier GSTIN"
              value={supplierGst}
              onChange={(e) => setSupplierGst(e.target.value)}
              placeholder="e.g. 24AAACA1234F1Z9"
            />
          </div>
        </div>

        {/* Fulfilment Method: Company Pickup vs Supplier Delivery (PART 2) */}
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div className="flex items-center gap-2">
              <FaTruck className="text-primary text-base" />
              <h3 className="text-xs font-black uppercase tracking-wider text-text-primary">
                Supply Fulfilment Method
              </h3>
            </div>
            <span className="text-[10px] text-text-muted font-bold">
              PART 2 Compliance
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option A: Company Pickup */}
            <div
              onClick={() => setFulfilmentMethod("Company Pickup")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                fulfilmentMethod === "Company Pickup"
                  ? "bg-primary/5 border-primary shadow-xs"
                  : "bg-surface border-border hover:border-primary/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-text-primary">Option A: Company Pickup</span>
                {fulfilmentMethod === "Company Pickup" && <FaCheckCircle className="text-primary" />}
              </div>
              <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                Company assigns vehicle/logistics provider to collect goods directly from supplier factory/warehouse and deliver to destination warehouse.
              </p>
            </div>

            {/* Option B: Supplier Delivery */}
            <div
              onClick={() => setFulfilmentMethod("Supplier Delivery")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                fulfilmentMethod === "Supplier Delivery"
                  ? "bg-primary/5 border-primary shadow-xs"
                  : "bg-surface border-border hover:border-primary/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-text-primary">Option B: Supplier Delivery</span>
                {fulfilmentMethod === "Supplier Delivery" && <FaCheckCircle className="text-primary" />}
              </div>
              <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                Supplier arranges transport to ship directly to the selected destination warehouse. Supplier provides dispatch reference and tracking.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="md:col-span-1">
              <CustomInput
                label="Supplier Pickup/Dispatch Address"
                value={supplierWarehouseAddress}
                onChange={(e) => setSupplierWarehouseAddress(e.target.value)}
                placeholder="Supplier factory location / city"
              />
            </div>
            <div>
              {fulfilmentMethod === "Company Pickup" ? (
                <CustomInput
                  label="Expected Pickup Date *"
                  type="date"
                  required
                  value={expectedPickupDate}
                  onChange={(e) => setExpectedPickupDate(e.target.value)}
                />
              ) : (
                <CustomInput
                  label="Expected Dispatch Date *"
                  type="date"
                  required
                  value={expectedDispatchDate}
                  onChange={(e) => setExpectedDispatchDate(e.target.value)}
                />
              )}
            </div>
            <div>
              <CustomInput
                label="Expected Inward Date *"
                type="date"
                required
                value={expectedInwardDate}
                onChange={(e) => setExpectedInwardDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Payment Terms, Advance Calculation & TAT (PART 1.6 & PART 3) */}
        <div className="bg-surface border border-border rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div className="flex items-center gap-2">
              <FaFileInvoice className="text-primary text-base" />
              <h3 className="text-xs font-black uppercase tracking-wider text-text-primary">
                Payment Terms, Advance & Delivery TAT
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <CustomInput
                label="Advance Percentage (%)"
                type="number"
                min="0"
                max="100"
                value={advancePercentage}
                onChange={(e) => setAdvancePercentage(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              />
            </div>
            <div>
              <CustomInput
                label="Production TAT (Days)"
                type="number"
                min="1"
                value={productionTatDays}
                onChange={(e) => setProductionTatDays(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
            <div>
              <CustomInput
                label="Supply / Transit TAT (Days)"
                type="number"
                min="1"
                value={supplyTatDays}
                onChange={(e) => setSupplyTatDays(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
            <div>
              <CustomInput
                label="Estimated Transport Cost (₹)"
                type="number"
                min="0"
                value={transportCost}
                onChange={(e) => setTransportCost(Math.max(0, parseFloat(e.target.value) || 0))}
              />
            </div>
          </div>

          {/* Financial Calculation Summary Card */}
          <div className="bg-bg/80 border border-border rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <span className="text-[10px] font-bold text-text-muted uppercase block">Subtotal</span>
              <span className="text-sm font-black text-text-primary">₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-text-muted uppercase block">GST ({gstRate}%)</span>
              <span className="text-sm font-black text-text-primary">₹{taxAmount.toLocaleString("en-IN")}</span>
            </div>
            <div className="bg-primary/5 rounded-lg py-1 border border-primary/20">
              <span className="text-[10px] font-bold text-primary uppercase block">Advance ({advancePercentage}%)</span>
              <span className="text-sm font-black text-primary">₹{advanceAmount.toLocaleString("en-IN")}</span>
            </div>
            <div className="bg-emerald-500/5 rounded-lg py-1 border border-emerald-500/20">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">Total PI Value</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">₹{totalPiValue.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Generating Indent..." : "Generate Purchase Indent"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
