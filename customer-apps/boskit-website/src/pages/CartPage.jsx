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
  FiMinus,
  FiPlus,
} from 'react-icons/fi';

export default function CartPage() {
  const { cart, removeFromCart, addToCart, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const items = cart.items || [];
  const summary = cart.summary || {};
  const moqPassed = cart.moq_passed !== false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#FFFFFF] min-h-[70vh]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DDE8E1] pb-6">
        <div>
          <nav className="text-xs text-[#5F6F65] mb-2 flex items-center gap-1.5">
            <Link to="/" className="hover:text-[#1F8F4E]">Home</Link>
            <span>›</span>
            <span className="text-[#17211B] font-medium">Shopping Cart</span>
          </nav>
          <h1 className="font-heading font-black text-3xl sm:text-4xl text-[#17211B]">
            Your Shopping Cart
          </h1>
          <p className="text-xs text-[#5F6F65] mt-1">
            {items.length} item{items.length !== 1 ? 's' : ''} in your cart · GST invoice provided on order
          </p>
        </div>

        <Link
          to="/products"
          className="text-xs font-bold text-[#1F8F4E] hover:text-[#18733E] flex items-center gap-1.5 self-start sm:self-auto bg-[#ECF8F1] px-4 py-2 rounded-xl border border-[#DDE8E1] transition-all"
        >
          <FiPackage /> Continue Shopping
        </Link>
      </div>

      {items.length === 0 ? (
        /* Empty Cart State */
        <div className="p-16 rounded-3xl bg-[#F7FAF8] border border-[#DDE8E1] text-center space-y-5 max-w-2xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-[#ECF8F1] border border-[#DDE8E1] text-[#1F8F4E] flex items-center justify-center mx-auto text-2xl">
            <FiShoppingCart />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-xl text-[#17211B]">Your cart is currently empty</h3>
            <p className="text-xs text-[#5F6F65]">
              Explore our solar equipment catalogue to find inverters, panels, mounting structures, and BOS kits.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E] shadow-xs transition-all"
          >
            Explore Equipment Store <FiArrowRight className="text-[#F5B700]" />
          </Link>
        </div>
      ) : (
        /* Cart Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Wholesale Savings Banner if applicable */}
            {summary.total_discount_inr > 0 && (
              <div className="p-4 rounded-2xl bg-[#ECF8F1] border border-[#DDE8E1] text-[#1F8F4E] text-xs font-bold flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-[#1F8F4E] shrink-0" />
                  <span>Partner Tier Savings Applied: You save ₹{(summary.total_discount_inr || 0).toLocaleString('en-IN')} off MRP!</span>
                </div>
              </div>
            )}

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
                          Net: ₹{Math.round((item.unit_net_paise || 0) / 100).toLocaleString('en-IN')}
                          {item.discount_percent > 0 && ` (-${item.discount_percent}%)`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => addToCart({ id: item.product_id }, -1)}
                          disabled={item.quantity <= 1}
                          className="w-8 h-8 rounded-lg bg-[#F7FAF8] border border-[#DDE8E1] text-[#17211B] font-bold hover:bg-[#ECF8F1] disabled:opacity-30 flex items-center justify-center transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <FiMinus size={12} />
                        </button>
                        <span className="w-8 text-center font-bold text-[#1F8F4E] text-sm">{item.quantity}</span>
                        <button
                          onClick={() => addToCart({ id: item.product_id }, 1)}
                          className="w-8 h-8 rounded-lg bg-[#F7FAF8] border border-[#DDE8E1] text-[#17211B] font-bold hover:bg-[#ECF8F1] flex items-center justify-center transition-colors"
                          aria-label="Increase quantity"
                        >
                          <FiPlus size={12} />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="text-right">
                        <div className="font-heading font-black text-base text-[#17211B]">
                          ₹{(item.line_grand_total_inr || 0).toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-[#5F6F65]">incl. GST</span>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="p-2 text-[#5F6F65] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        aria-label="Remove item"
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
                <FiShield className="text-[#1F8F4E]" /> Order Summary
              </h3>

              <div className="space-y-3 text-xs border-t border-[#DDE8E1] pt-4">
                <div className="flex justify-between text-[#5F6F65]">
                  <span>Item Subtotal:</span>
                  <span className="text-[#17211B] font-semibold">₹{(summary.subtotal_inr || 0).toLocaleString('en-IN')}</span>
                </div>
                {summary.total_discount_inr > 0 && (
                  <div className="flex justify-between text-[#1F8F4E]">
                    <span>Discount:</span>
                    <span className="font-bold">- ₹{(summary.total_discount_inr || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#5F6F65]">
                  <span>Taxable Amount:</span>
                  <span className="text-[#17211B] font-bold">₹{(summary.net_taxable_inr || 0).toLocaleString('en-IN')}</span>
                </div>

                {/* GST Split */}
                <div className="p-3 rounded-2xl bg-[#F7FAF8] border border-[#DDE8E1] space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-[#5F6F65]">
                    <span>Central GST (CGST):</span>
                    <span className="text-[#1F8F4E] font-semibold">₹{(summary.cgst_inr || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-[#5F6F65]">
                    <span>State GST (SGST):</span>
                    <span className="text-[#1F8F4E] font-semibold">₹{(summary.sgst_inr || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="flex justify-between text-[#5F6F65]">
                  <span>Shipping & Delivery:</span>
                  <span className="text-[#1F8F4E] font-semibold">
                    {summary.shipping_inr === 0 ? 'FREE Delivery' : `₹${(summary.shipping_inr || 0).toLocaleString('en-IN')}`}
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
                className="w-full py-4 rounded-xl text-xs font-bold bg-[#1F8F4E] text-white hover:bg-[#18733E] shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                Proceed to Checkout <FiArrowRight className="text-[#F5B700]" />
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
