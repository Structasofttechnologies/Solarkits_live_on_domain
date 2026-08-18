import React, { useState, useEffect } from 'react';
import {
  FiZap,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiTrendingDown,
  FiShield,
  FiDollarSign,
  FiMapPin,
} from 'react-icons/fi';
import api from '../../services/api';

const SAMPLE_PRODUCTS = [
  { id: '64f000000000000000000001', name: '550W Monocrystalline TOPCon Solar PV Module', mrp: 14500, defaultQty: 20 },
  { id: '64f000000000000000000002', name: '10kW 3-Phase On-Grid Solar Inverter', mrp: 68000, defaultQty: 2 },
  { id: '64f000000000000000000003', name: 'Aluminium Pre-Engineered Structure (4-Panel Kit)', mrp: 4800, defaultQty: 5 },
];

const STATES = [
  { code: 'GJ', name: 'Gujarat (Origin Hub)' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'MP', name: 'Madhya Pradesh' },
  { code: 'DL', name: 'Delhi' },
  { code: 'KA', name: 'Karnataka' },
];

export default function PricingCalculatorModal({ isOpen, onClose }) {
  const [buyerType, setBuyerType] = useState('distributor');
  const [destState, setDestState] = useState('GJ');
  const [items, setItems] = useState([
    { product_id: SAMPLE_PRODUCTS[0].id, quantity: 20 },
    { product_id: SAMPLE_PRODUCTS[1].id, quantity: 2 },
  ]);

  const [calcResult, setCalcResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculatePrice = () => {
    setLoading(true);
    api
      .post('/pricing/calculate', {
        items,
        buyer_type: buyerType,
        origin_state_code: 'GJ',
        destination_state_code: destState,
      })
      .then((res) => {
        if (res.data?.success) setCalcResult(res.data.data);
      })
      .catch((err) => console.error('Pricing calculation error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) calculatePrice();
  }, [isOpen, buyerType, destState, items]);

  if (!isOpen) return null;

  const summary = calcResult?.summary || {};

  return (
    <div className="fixed inset-0 bg-[#17211B]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-[#FFFFFF] border border-[#DDE8E1] rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DDE8E1] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ECF8F1] border border-[#DDE8E1] text-[#1F8F4E] flex items-center justify-center font-black shadow-xs">
              <FiZap size={20} />
            </div>
            <div>
              <h2 className="font-heading font-black text-xl text-[#17211B]">
                B2B Pricing & GST Tax Calculator
              </h2>
              <p className="text-xs text-[#5F6F65]">
                Live simulation of wholesale margins, bulk volume tiers, and CGST/SGST/IGST tax splits.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#5F6F65] hover:text-[#17211B] hover:bg-[#F7FAF8] transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Control Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#17211B] block mb-1">Select Channel Role *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'distributor', name: 'Distributor (-25%)' },
                { id: 'dealer', name: 'Dealer (-18%)' },
                { id: 'guest', name: 'Standard B2B (-5%)' },
              ].map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setBuyerType(role.id)}
                  className={`py-2 px-2 text-center rounded-xl text-[11px] font-bold border transition-all ${
                    buyerType === role.id
                      ? 'bg-[#1F8F4E] text-white border-[#1F8F4E] shadow-xs'
                      : 'bg-[#F7FAF8] text-[#5F6F65] border-[#DDE8E1] hover:border-[#1F8F4E]/40'
                  }`}
                >
                  {role.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#17211B] block mb-1">Destination Shipping State *</label>
            <select
              value={destState}
              onChange={(e) => setDestState(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#F7FAF8] border border-[#DDE8E1] text-xs text-[#17211B] focus:outline-none focus:border-[#1F8F4E] focus:bg-[#FFFFFF]"
            >
              {STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name} {s.code === 'GJ' ? '(Intra-State: CGST+SGST)' : '(Inter-State: IGST)'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-[#5F6F65] uppercase tracking-wider">
            Simulated Equipment Lot
          </div>
          <div className="space-y-2">
            {SAMPLE_PRODUCTS.map((prod, idx) => {
              const currentQty = items.find((i) => i.product_id === prod.id)?.quantity || 0;

              return (
                <div
                  key={prod.id}
                  className="p-3.5 rounded-2xl bg-[#F7FAF8] border border-[#DDE8E1] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-[#17211B] text-sm">{prod.name}</div>
                    <div className="text-[#5F6F65] text-[11px]">Retail MRP: ₹{prod.mrp.toLocaleString('en-IN')} / unit</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[#5F6F65]">Quantity:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          const newQty = Math.max(0, currentQty - 5);
                          setItems(items.map((i) => (i.product_id === prod.id ? { ...i, quantity: newQty } : i)));
                        }}
                        className="w-7 h-7 rounded-lg bg-[#FFFFFF] border border-[#DDE8E1] text-[#17211B] font-bold hover:bg-[#ECF8F1] shadow-xs"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-bold text-[#1F8F4E]">{currentQty}</span>
                      <button
                        onClick={() => {
                          const newQty = currentQty + 5;
                          setItems(items.map((i) => (i.product_id === prod.id ? { ...i, quantity: newQty } : i)));
                        }}
                        className="w-7 h-7 rounded-lg bg-[#FFFFFF] border border-[#DDE8E1] text-[#17211B] font-bold hover:bg-[#ECF8F1] shadow-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Price Breakdown Summary */}
        <div className="p-6 rounded-3xl bg-[#F7FAF8] border border-[#DDE8E1] space-y-4">
          <div className="flex items-center justify-between border-b border-[#DDE8E1] pb-3">
            <span className="font-heading font-bold text-sm text-[#17211B]">Commercial Quote Breakdown</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#ECF8F1] text-[#1F8F4E] border border-[#DDE8E1]">
              {summary.is_interstate ? 'Inter-State (IGST 12%)' : 'Intra-State (CGST 6% + SGST 6%)'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <div className="flex justify-between text-[#5F6F65]">
                <span>Catalogue Subtotal (MRP):</span>
                <span className="text-[#17211B] font-semibold">₹{(summary.subtotal_inr || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#1F8F4E]">
                <span>Channel Margin Discount:</span>
                <span className="font-bold">- ₹{(summary.total_discount_inr || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#5F6F65]">
                <span>Net Taxable Value:</span>
                <span className="text-[#17211B] font-bold">₹{(summary.net_taxable_inr || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="space-y-2 sm:border-l sm:border-[#DDE8E1] sm:pl-4">
              {summary.is_interstate ? (
                <div className="flex justify-between text-[#5F6F65]">
                  <span>Integrated GST (IGST 12%):</span>
                  <span className="text-[#1F8F4E] font-semibold">₹{(summary.igst_inr || 0).toLocaleString('en-IN')}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-[#5F6F65]">
                    <span>Central GST (CGST 6%):</span>
                    <span className="text-[#1F8F4E] font-semibold">₹{(summary.cgst_inr || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-[#5F6F65]">
                    <span>State GST (SGST 6%):</span>
                    <span className="text-[#1F8F4E] font-semibold">₹{(summary.sgst_inr || 0).toLocaleString('en-IN')}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-[#5F6F65]">
                <span>Commercial Freight:</span>
                <span className="text-[#1F8F4E] font-semibold">
                  {summary.shipping_inr === 0 ? 'FREE Freight' : `₹${summary.shipping_inr?.toLocaleString('en-IN')}`}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#DDE8E1] flex items-baseline justify-between">
            <div>
              <span className="text-xs text-[#5F6F65] block font-medium">Total Payable Value (incl. GST)</span>
              <span className="text-[10px] text-[#1F8F4E] font-bold">100% Tax Invoice with Input Tax Credit (ITC)</span>
            </div>
            <div className="font-heading font-black text-3xl text-[#1F8F4E]">
              ₹{(summary.grand_total_inr || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E] transition-colors shadow-xs"
          >
            Close Calculator
          </button>
        </div>

      </div>
    </div>
  );
}
