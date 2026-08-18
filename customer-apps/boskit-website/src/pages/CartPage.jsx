import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  FiShoppingCart,
  FiTrash2,
  FiArrowRight,
  FiShield,
  FiAlertCircle,
  FiZap,
  FiCheckCircle,
  FiPackage,
} from 'react-icons/fi';

export default function CartPage() {
  const { cart, removeFromCart, addToCart, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const items = cart.items || [];
  const summary = cart.summary || {};
  const moqPassed = cart.moq_passed !== false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 bg-[#FFFFFF]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DDE8E1] pb-6">
        <div>
          <span className="text-xs font-bold text-[#1F8F4E] uppercase tracking-widest bg-[#ECF8F1] px-3 py-1 rounded-full border border-[#DDE8E1]">
            Commercial Procurement
          </span>
          <h1 className="font-heading font-black text-3xl sm:text-4xl text-[#17211B] mt-2">
            Wholesale Equipment Cart
          </h1>
        </div>

        <Link
          to="/products"
          className="text-xs font-bold text-[#1F8F4E] hover:text-[#18733E] flex items-center gap-1.5 self-start sm:self-auto"
        >
          <FiPackage /> Continue Browsing Catalogue
        </Link>
      </div>

      {items.length === 0 ? (
        /* Empty Cart State */
        <div className="p-16 rounded-3xl bg-[#FFFFFF] border border-[#DDE8E1] text-center space-y-5 max-w-2xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-[#ECF8F1] border border-[#DDE8E1] text-[#1F8F4E] flex items-center justify-center mx-auto text-2xl">
            <FiShoppingCart />
          </div>
          <div>
            <h3 className="font-heading font-bold text-xl text-[#17211B]">Your wholesale cart is empty</h3>
            <p className="text-xs text-[#5F6F65] mt-1">
              Select solar panels, inverters, or mounting kits from our authorized B2B catalogue to place an order.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E] shadow-xs transition-all"
          >
            Explore Equipment Catalogue <FiArrowRight className="text-[#F5B700]" />
          </Link>
        </div>
      ) : (
        /* Cart Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Wholesale Savings Banner */}
            <div className="p-4 rounded-2xl bg-[#ECF8F1] border border-[#DDE8E1] text-[#1F8F4E] text-xs font-bold flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <FiCheckCircle className="text-[#1F8F4E]" />
                <span>Channel Wholesale Pricing Applied! You saved ₹{(summary.total_discount_inr || 0).toLocaleString('en-IN')} off MRP.</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs space-y-4">
              <div className="divide-y divide-[#DDE8E1]">
                {items.map((item, idx) => (
                  <div key={idx} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-md">
                      <span className="text-[10px] font-mono text-[#5F6F65] uppercase">{item.sku}</span>
                      <h4 className="font-heading font-bold text-sm text-[#17211B]">{item.product_name}</h4>
                      <div className="flex items-center gap-3 text-xs text-[#5F6F65]">
                        <span>MRP: <del>₹{Math.round((item.unit_mrp_paise || 0) / 100).toLocaleString('en-IN')}</del></span>
                        <span className="font-bold text-[#1F8F4E]">
                          Net: ₹{Math.round((item.unit_net_paise || 0) / 100).toLocaleString('en-IN')} (-{item.discount_percent}%)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => addToCart({ id: item.product_id }, -1)}
                          disabled={item.quantity <= 1}
                          className="w-8 h-8 rounded-lg bg-[#F7FAF8] border border-[#DDE8E1] text-[#17211B] font-bold hover:bg-[#ECF8F1] disabled:opacity-30"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-bold text-[#1F8F4E] text-sm">{item.quantity}</span>
                        <button
                          onClick={() => addToCart({ id: item.product_id }, 1)}
                          className="w-8 h-8 rounded-lg bg-[#F7FAF8] border border-[#DDE8E1] text-[#17211B] font-bold hover:bg-[#ECF8F1]"
                        >
                          +
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="text-right">
                        <div className="font-heading font-black text-base text-[#17211B]">
                          ₹{(item.line_grand_total_inr || 0).toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-[#5F6F65]">incl. 12% GST</span>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="p-2 text-[#5F6F65] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Order Summary & Checkout Card */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#DDE8E1] shadow-xs space-y-5">
              <h3 className="font-heading font-bold text-base text-[#17211B] flex items-center gap-2">
                <FiShield className="text-[#1F8F4E]" /> Commercial Quote Summary
              </h3>

              <div className="space-y-3 text-xs border-t border-[#DDE8E1] pt-4">
                <div className="flex justify-between text-[#5F6F65]">
                  <span>Gross Catalogue Value:</span>
                  <span className="text-[#17211B] font-semibold">₹{(summary.subtotal_inr || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[#1F8F4E]">
                  <span>Wholesale Discount:</span>
                  <span className="font-bold">- ₹{(summary.total_discount_inr || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[#5F6F65]">
                  <span>Net Taxable Amount:</span>
                  <span className="text-[#17211B] font-bold">₹{(summary.net_taxable_inr || 0).toLocaleString('en-IN')}</span>
                </div>

                {/* GST Split */}
                <div className="p-3 rounded-2xl bg-[#F7FAF8] border border-[#DDE8E1] space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-[#5F6F65]">
                    <span>Central GST (CGST 6%):</span>
                    <span className="text-[#1F8F4E] font-semibold">₹{(summary.cgst_inr || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-[#5F6F65]">
                    <span>State GST (SGST 6%):</span>
                    <span className="text-[#1F8F4E] font-semibold">₹{(summary.sgst_inr || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex justify-between text-[#5F6F65]">
                  <span>Commercial Freight:</span>
                  <span className="text-[#1F8F4E] font-semibold">
                    {summary.shipping_inr === 0 ? 'FREE Freight' : `₹${(summary.shipping_inr || 0).toLocaleString('en-IN')}`}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#DDE8E1] flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-[#5F6F65] block font-medium">Grand Total</span>
                  <span className="text-[10px] text-[#1F8F4E] font-bold">100% ITC Eligible</span>
                </div>
                <div className="font-heading font-black text-2xl text-[#1F8F4E]">
                  ₹{(summary.grand_total_inr || 0).toLocaleString('en-IN')}
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-4 rounded-xl text-xs font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E] shadow-xs flex items-center justify-center gap-2 transition-all"
              >
                Proceed to B2B Checkout <FiArrowRight className="text-[#F5B700]" />
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
