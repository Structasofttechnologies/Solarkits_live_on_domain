import React, { useState, useEffect, useMemo } from 'react';
import {
  FiSliders,
  FiPackage,
  FiPlus,
  FiMinus,
  FiCheck,
  FiShoppingCart,
  FiCheckCircle,
  FiRefreshCw,
  FiZap,
  FiShield,
  FiTool,
  FiLayers,
  FiDollarSign,
  FiTrendingUp,
  FiInfo,
  FiArrowRight,
} from 'react-icons/fi';
import { MdSolarPower, MdSettings, MdOutlineCable } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';
import axios from 'axios';

// Reliable equipment fallback icons/images for customizer
const GROUP_ICONS = {
  'Protection & AC/DC Enclosures': '🛡️',
  'Cables & Wiring Accessories': '🔌',
  'Earthing & Protection Systems': '⚓',
  'Mounting Structure Hardware': '🏗️',
  default: '⚡',
};

export default function DistributorCustomBosKitPage() {
  const { user, distributor } = useAuth();
  const { addToCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [catalogGroups, setCatalogGroups] = useState([]);
  const [systemKw, setSystemKw] = useState(5); // Default 5 kW capacity
  const [systemPhase, setSystemPhase] = useState('single'); // 'single' | 'three'
  const [customQuantities, setCustomQuantities] = useState({});
  const [selectedItems, setSelectedItems] = useState({}); // { [itemId]: boolean }
  const [customLengths, setCustomLengths] = useState({}); // { [itemId]: lengthMeters }
  const [addingToCart, setAddingToCart] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch live custom catalog from Backend DB API
  const fetchCustomCatalog = async () => {
    try {
      setLoading(true);
      // Try direct solarshop india endpoint first, fallback to public endpoint
      let groups = [];
      try {
        const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
        const res = await axios.get(`${apiBase}/india/v1/shop/bos-custom-catalog`);
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          groups = res.data.data;
        }
      } catch (e) {
        console.warn('Fallback fetching custom catalog:', e.message);
      }

      if (!groups || groups.length === 0) {
        // Fallback standard catalog structure
        groups = [
          {
            group: 'Protection & AC/DC Enclosures',
            icon: '🛡️',
            items: [
              {
                id: 'bos_item_dcdb_1000v_2in2out',
                name: '1000V 2 In 2 Out IP65 DC Distribution Box (DCDB)',
                unitPrice: 3500,
                unit: 'Piece',
                specs: '1000V 16A DC MCB + 600V Type II DC SPD + Fuse Holders',
                defaultQty: 1,
                recommendedPerKw: 0.2,
                image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=400&auto=format&fit=crop&q=80',
              },
              {
                id: 'bos_item_acdb_1ph_32a',
                name: 'Single Phase 32A AC Distribution Box (ACDB)',
                unitPrice: 2800,
                unit: 'Piece',
                specs: '32A C-Curve AC MCB + 275V Type II AC SPD + Rotary Switch',
                defaultQty: 1,
                recommendedPerKw: 0.2,
                image: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=400&auto=format&fit=crop&q=80',
              },
              {
                id: 'bos_item_acdb_3ph_63a',
                name: 'Three Phase 63A LT AC Distribution Box (Commercial)',
                unitPrice: 8500,
                unit: 'Piece',
                specs: '63A 4P MCCB + Type 2 AC SPD + Energy Meter CT Provisions',
                defaultQty: 1,
                recommendedPerKw: 0.02,
                image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80',
              },
            ],
          },
          {
            group: 'Cables & Wiring Accessories',
            icon: '🔌',
            items: [
              {
                id: 'bos_item_dc_cable_4sqmm',
                name: '4.0 sq mm Twin Core UV Solar DC Cable',
                unitPrice: 55,
                unit: 'Meter',
                specs: 'TUV Certified 1500V Flame Retardant Tinned Copper Cable',
                defaultQty: 50,
                recommendedPerKw: 10,
                isLengthConfigurable: true,
                image: 'https://images.unsplash.com/photo-1558441719-234757452558?w=400&auto=format&fit=crop&q=80',
              },
              {
                id: 'bos_item_dc_cable_6sqmm',
                name: '6.0 sq mm Single Core Solar DC Cable (Red & Black)',
                unitPrice: 75,
                unit: 'Meter',
                specs: 'EN 50618 Heavy Duty 1500V DC Cable for Extended Runs',
                defaultQty: 60,
                recommendedPerKw: 12,
                isLengthConfigurable: true,
                image: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=400&auto=format&fit=crop&q=80',
              },
              {
                id: 'bos_item_ac_armoured_cable',
                name: '4.0 sq mm 4 Core Heavy Duty Armoured AC Cable',
                unitPrice: 180,
                unit: 'Meter',
                specs: '1100V Heavy Duty XLPE Armoured Copper Mains Cable',
                defaultQty: 30,
                recommendedPerKw: 6,
                isLengthConfigurable: true,
                image: 'https://images.unsplash.com/photo-1558441719-234757452558?w=400&auto=format&fit=crop&q=80',
              },
              {
                id: 'bos_item_mc4_connectors_pack',
                name: 'IP68 1500V MC4 Solar Connectors (Pack of 10 Pairs)',
                unitPrice: 650,
                unit: 'Pack',
                specs: 'TUV Certified 1500V DC Copper Silver Plated Pin Connectors',
                defaultQty: 2,
                recommendedPerKw: 0.4,
                image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
              },
              {
                id: 'bos_item_hdpe_conduit_pipe',
                name: 'HDPE Flexible Conduit Pipe 25mm (Fire Retardant)',
                unitPrice: 35,
                unit: 'Meter',
                specs: 'Double Wall Corrugated Outdoor Cable Conduit Protection Pipe',
                defaultQty: 40,
                recommendedPerKw: 8,
                isLengthConfigurable: true,
                image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80',
              },
            ],
          },
          {
            group: 'Earthing & Protection Systems',
            icon: '⚓',
            items: [
              {
                id: 'bos_item_earthing_rod_copper',
                name: 'Maintenance-Free Copper Bonded Earthing Electrode (17.2mm x 3Mtr)',
                unitPrice: 3200,
                unit: 'Set',
                specs: '250 Micron Copper Coating Rod + 25kg Backfill Compound (BFC)',
                defaultQty: 3,
                recommendedPerKw: 0.6,
                image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=400&auto=format&fit=crop&q=80',
              },
              {
                id: 'bos_item_lightning_arrester_ese',
                name: 'ESE Early Streamer Emission Lightning Arrester (107m Radius)',
                unitPrice: 6500,
                unit: 'Set',
                specs: 'Class A ESE Air Terminal + 2-Meter FRP Insulating Mast & Clamps',
                defaultQty: 1,
                recommendedPerKw: 0.2,
                image: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=400&auto=format&fit=crop&q=80',
              },
              {
                id: 'bos_item_copper_strip_25x3',
                name: 'Pure Copper Earthing Strip 25mm x 3mm',
                unitPrice: 220,
                unit: 'Meter',
                specs: '99.9% Electrolytic Tough Pitch High Conductivity Copper Strip',
                defaultQty: 25,
                recommendedPerKw: 5,
                isLengthConfigurable: true,
                image: 'https://images.unsplash.com/photo-1558441719-234757452558?w=400&auto=format&fit=crop&q=80',
              },
            ],
          },
          {
            group: 'Mounting Structure Hardware',
            icon: '🏗️',
            items: [
              {
                id: 'bos_item_hdg_structure_5kw',
                name: 'Hot Dip Galvanized High Rise RCC Roof Mounting Structure (5kW Kit)',
                unitPrice: 14500,
                unit: 'Set',
                specs: '80 Micron HDG 2.0mm Column Channels (Wind Speed Rating 170 km/h)',
                defaultQty: 1,
                recommendedPerKw: 0.2,
                image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=400&auto=format&fit=crop&q=80',
              },
              {
                id: 'bos_item_anodized_clamp_set',
                name: 'Aluminum Anodized Mid & End Clamp Fastener Set (Pack of 20)',
                unitPrice: 850,
                unit: 'Pack',
                specs: 'AL6063-T5 Anodized Aluminum with SS304 Bolts & EPDM Rubber Pads',
                defaultQty: 2,
                recommendedPerKw: 0.4,
                image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80',
              },
            ],
          },
        ];
      }

      setCatalogGroups(groups);

      // Initialize default quantities and selected state
      const initialQty = {};
      const initialSelected = {};
      const initialLengths = {};

      groups.forEach((g) => {
        (g.items || []).forEach((item) => {
          const recQty = Math.max(1, Math.round((item.recommendedPerKw || 0.2) * 5));
          initialQty[item.id] = item.defaultQty || recQty;
          initialSelected[item.id] = true;
          if (item.unit === 'Meter' || item.isLengthConfigurable) {
            initialLengths[item.id] = item.defaultQty || recQty || 50;
          }
        });
      });

      setCustomQuantities(initialQty);
      setSelectedItems(initialSelected);
      setCustomLengths(initialLengths);
    } catch (err) {
      console.error('Failed to load custom catalog:', err);
      showToast('Error loading customization components.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomCatalog();
  }, []);

  // Update recommended quantities whenever systemKw changes
  const applySystemKwRecommendations = (kw) => {
    setSystemKw(kw);
    const updatedQty = { ...customQuantities };
    const updatedLengths = { ...customLengths };

    catalogGroups.forEach((g) => {
      (g.items || []).forEach((item) => {
        if (item.recommendedPerKw) {
          const rec = Math.max(1, Math.round(item.recommendedPerKw * kw));
          updatedQty[item.id] = rec;
          if (item.unit === 'Meter' || item.isLengthConfigurable) {
            updatedLengths[item.id] = rec;
          }
        }
      });
    });

    setCustomQuantities(updatedQty);
    setCustomLengths(updatedLengths);
    showToast(`Calculated recommended component sizing for ${kw} kW System!`, 'info');
  };

  // Toggle Item selection
  const handleToggleItem = (itemId) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Adjust Item quantity
  const handleQuantityChange = (itemId, delta) => {
    setCustomQuantities((prev) => {
      const current = prev[itemId] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [itemId]: next };
    });
  };

  // Set explicit length for cables / pipes
  const handleLengthChange = (itemId, val) => {
    const num = Math.max(1, parseInt(val, 10) || 1);
    setCustomLengths((prev) => ({ ...prev, [itemId]: num }));
    setCustomQuantities((prev) => ({ ...prev, [itemId]: num }));
  };

  // Calculate live package summary
  const packageSummary = useMemo(() => {
    let subtotal = 0;
    let selectedCount = 0;
    const selectedItemList = [];

    catalogGroups.forEach((g) => {
      (g.items || []).forEach((item) => {
        if (selectedItems[item.id]) {
          const qty = customQuantities[item.id] || 1;
          const linePrice = (item.unitPrice || item.price || 500) * qty;
          subtotal += linePrice;
          selectedCount += 1;
          selectedItemList.push({
            ...item,
            quantity: qty,
            lineTotal: linePrice,
            groupName: g.group,
          });
        }
      });
    });

    const gstAmount = Math.round(subtotal * 0.18);
    const grandTotal = subtotal + gstAmount;
    const estimatedRetailMrp = Math.round(subtotal * 1.30);
    const savings = estimatedRetailMrp - subtotal;

    return {
      subtotal,
      gstAmount,
      grandTotal,
      estimatedRetailMrp,
      savings,
      selectedCount,
      selectedItemList,
    };
  }, [catalogGroups, selectedItems, customQuantities]);

  // Handle Add Full Customized Kit to Cart
  const handleAddCustomKitToCart = async () => {
    if (packageSummary.selectedCount === 0) {
      showToast('Please select at least one component for your custom BOS kit.', 'error');
      return;
    }

    setAddingToCart(true);
    try {
      // 1. Create a bundle representation
      const bundleName = `Custom ${systemKw} kW ${systemPhase === 'three' ? '3-Phase' : '1-Phase'} Solar BOS Kit (${packageSummary.selectedCount} Components)`;
      
      const customBundleProduct = {
        id: `CUSTOM-BOS-${Date.now()}`,
        name: bundleName,
        mrp: packageSummary.estimatedRetailMrp,
        mrp_inr: packageSummary.estimatedRetailMrp,
        price_inr: packageSummary.subtotal,
        distributor_buy_price_inr: packageSummary.subtotal,
        category: 'boskit',
        brand: 'SolarKits CustomPro',
        image_url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80',
        moq: 1,
        quantity: 1,
        custom_specs: {
          system_capacity_kw: systemKw,
          grid_phase: systemPhase,
          component_count: packageSummary.selectedCount,
          items: packageSummary.selectedItemList.map((i) => `${i.name} (${i.quantity} ${i.unit})`),
        },
      };

      try {
        const saved = localStorage.getItem('boskit_distributor_cart');
        const existing = saved ? JSON.parse(saved) : [];
        existing.push({
          id: customBundleProduct.id,
          name: customBundleProduct.name,
          sku: `BK-CUST-${systemKw}KW`,
          brand: 'SolarKits CustomPro',
          image_url: customBundleProduct.image_url,
          distributor_buy_price_inr: customBundleProduct.distributor_buy_price_inr,
          mrp_inr: customBundleProduct.mrp_inr,
          moq: 1,
          quantity: 1,
        });
        localStorage.setItem('boskit_distributor_cart', JSON.stringify(existing));
      } catch (e) {
        console.warn('Cart localStorage sync warning:', e);
      }

      const success = await addToCart(customBundleProduct, 1);
      showToast(`🎉 "${bundleName}" added to your cart!`, 'success');
    } catch (err) {
      console.error('Error adding custom kit to cart:', err);
      showToast('Failed to add custom kit to cart.', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  // Add individual component to cart
  const handleAddSingleItemToCart = async (item) => {
    const qty = customQuantities[item.id] || 1;
    try {
      const singlePayload = {
        id: item.id,
        name: `${item.name} (${qty} ${item.unit})`,
        mrp: Math.round((item.unitPrice || 500) * 1.25),
        mrp_inr: Math.round((item.unitPrice || 500) * 1.25),
        price_inr: item.unitPrice || 500,
        distributor_buy_price_inr: item.unitPrice || 500,
        category: 'boskit',
        brand: 'SolarKits Pro',
        image_url: item.image || item.imageUrl || 'https://images.unsplash.com/photo-1558441719-234757452558?w=400&auto=format&fit=crop&q=80',
        moq: 1,
        quantity: qty,
      };

      try {
        const saved = localStorage.getItem('boskit_distributor_cart');
        const existing = saved ? JSON.parse(saved) : [];
        existing.push(singlePayload);
        localStorage.setItem('boskit_distributor_cart', JSON.stringify(existing));
      } catch (e) {
        console.warn('Cart localStorage sync warning:', e);
      }

      await addToCart(singlePayload, qty);
      showToast(`Added ${qty}x ${item.name} to Cart!`, 'success');
    } catch (e) {
      showToast(`Failed to add ${item.name} to cart.`, 'error');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl text-xs font-bold shadow-xl border flex items-center gap-2.5 transition-all animate-bounce ${
            toast.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : toast.type === 'info'
              ? 'bg-blue-50 text-blue-800 border-blue-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <FiCheckCircle size={16} />
          {toast.message}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
          <MdSolarPower size={260} />
        </div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
            <MdSettings className="w-3.5 h-3.5 text-blue-600" />
            Interactive Customization BOS Kit Engine
          </div>

          <h1 className="text-2xl sm:text-4xl font-heading font-black text-slate-900 tracking-tight">
            Configure Custom Solar BOS Kit
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed">
            Tailor your exact Balance of System protection gear, custom DC & AC cable run lengths, earthing electrodes, and mounting clamps based on your project kW rating. Add the complete configuration or individual line items directly to your procurement cart.
          </p>
        </div>

        {/* Capacity Quick Sizing Bar */}
        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          
          {/* Capacity Slabs */}
          <div className="md:col-span-8 space-y-2">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FiZap className="text-amber-500" /> Select Target Project Capacity:
            </label>
            <div className="flex flex-wrap gap-2">
              {[1, 3, 5, 10, 15, 25, 50, 100].map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => applySystemKwRecommendations(kw)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    systemKw === kw
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-600 ring-offset-2'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {kw} kW
                </button>
              ))}
            </div>
          </div>

          {/* Phase Selector */}
          <div className="md:col-span-4 space-y-2">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Electrical Phase:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSystemPhase('single')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  systemPhase === 'single'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                1-Phase (230V)
              </button>
              <button
                type="button"
                onClick={() => setSystemPhase('three')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  systemPhase === 'three'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                3-Phase (415V)
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Main Grid: Components Selector (Left 8 Cols) + Live BOM Price Summary (Right 4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Column: Component Groups */}
        <div className="lg:col-span-8 space-y-6">
          {loading ? (
            <div className="bg-white rounded-3xl p-16 border border-slate-200 text-center space-y-3">
              <FiRefreshCw className="animate-spin text-blue-600 mx-auto" size={32} />
              <p className="text-sm font-bold text-slate-600">Loading custom BOS components...</p>
            </div>
          ) : (
            catalogGroups.map((group, gIdx) => (
              <div
                key={gIdx}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs"
              >
                {/* Group Header */}
                <div className="p-5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{group.icon || GROUP_ICONS[group.group] || '⚡'}</span>
                    <div>
                      <h2 className="text-base font-heading font-black text-slate-900">
                        {group.group}
                      </h2>
                      <p className="text-xs text-slate-500 font-semibold">
                        {(group.items || []).length} Customizable Component{(group.items || []).length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                    Tier-1 Hardware
                  </span>
                </div>

                {/* Items List */}
                <div className="p-5 divide-y divide-slate-100">
                  {(group.items || []).map((item) => {
                    const isSelected = !!selectedItems[item.id];
                    const currentQty = customQuantities[item.id] || item.defaultQty || 1;
                    const unitPrice = item.unitPrice || item.price || 500;
                    const lineTotal = unitPrice * currentQty;
                    const isLengthConfigurable = item.unit === 'Meter' || item.isLengthConfigurable;

                    return (
                      <div
                        key={item.id}
                        className={`py-4 first:pt-0 last:pb-0 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center transition-colors ${
                          !isSelected ? 'opacity-50 grayscale' : ''
                        }`}
                      >
                        {/* Checkbox & Image */}
                        <div className="sm:col-span-5 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleItem(item.id)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all cursor-pointer shrink-0 ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                                : 'bg-white border-slate-300 text-transparent'
                            }`}
                          >
                            <FiCheck size={14} className={isSelected ? 'opacity-100' : 'opacity-0'} />
                          </button>

                          <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
                            <img
                              src={item.image || item.imageUrl || 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=200&auto=format&fit=crop&q=80'}
                              alt={item.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=200&auto=format&fit=crop&q=80';
                              }}
                            />
                          </div>

                          <div className="min-w-0">
                            <h3 className="text-xs font-black text-slate-900 leading-tight truncate">
                              {item.name}
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                              {item.specs || item.packInfo || 'Standard Solar BOS Component'}
                            </p>
                            <span className="text-[10px] font-mono font-bold text-emerald-700">
                              ₹{unitPrice.toLocaleString('en-IN')} / {item.unit || 'Unit'}
                            </span>
                          </div>
                        </div>

                        {/* Quantity / Length Control */}
                        <div className="sm:col-span-4 flex flex-col items-start sm:items-center">
                          {isLengthConfigurable ? (
                            <div className="w-full max-w-[170px] space-y-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                Cable / Run Length
                              </span>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="1"
                                  step="5"
                                  disabled={!isSelected}
                                  value={customLengths[item.id] || currentQty}
                                  onChange={(e) => handleLengthChange(item.id, e.target.value)}
                                  className="w-20 px-2 py-1.5 text-center text-xs font-mono font-black border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                />
                                <span className="text-xs font-bold text-slate-600">{item.unit || 'Mtr'}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                Quantity ({item.unit || 'Pcs'})
                              </span>
                              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                                <button
                                  type="button"
                                  disabled={!isSelected || currentQty <= 1}
                                  onClick={() => handleQuantityChange(item.id, -1)}
                                  className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs disabled:opacity-30 cursor-pointer shadow-xs"
                                >
                                  <FiMinus size={11} />
                                </button>
                                <span className="w-8 text-center text-xs font-mono font-black text-slate-900">
                                  {currentQty}
                                </span>
                                <button
                                  type="button"
                                  disabled={!isSelected}
                                  onClick={() => handleQuantityChange(item.id, 1)}
                                  className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs disabled:opacity-30 cursor-pointer shadow-xs"
                                >
                                  <FiPlus size={11} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Price & Single Item CTA */}
                        <div className="sm:col-span-3 text-right flex flex-row sm:flex-col items-center sm:items-end justify-between gap-1.5">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Line Total</span>
                            <span className="text-sm font-heading font-black text-blue-600 font-mono">
                              ₹{lineTotal.toLocaleString('en-IN')}
                            </span>
                          </div>

                          <button
                            type="button"
                            disabled={!isSelected}
                            onClick={() => handleAddSingleItemToCart(item)}
                            className="px-2.5 py-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1 transition-all disabled:opacity-30 cursor-pointer"
                            title="Add only this item to cart"
                          >
                            <FiShoppingCart size={11} /> Add Item
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Live Sticky Package BOM Summary */}
        <div className="lg:col-span-4 sticky top-20 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            
            <div className="space-y-1 pb-4 border-b border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 inline-block">
                Configured Kit Summary
              </span>
              <h2 className="text-lg font-heading font-black text-slate-900">
                {systemKw} kW Custom BOS Package
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                {packageSummary.selectedCount} Active Components Selected
              </p>
            </div>

            {/* Selected Components Mini List */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {packageSummary.selectedItemList.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center justify-between text-xs py-1 border-b border-slate-50"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-800 truncate text-[11px]">{it.name}</p>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {it.quantity} {it.unit} @ ₹{it.unitPrice}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 text-xs shrink-0">
                    ₹{it.lineTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations Breakdown */}
            <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
              <div className="flex justify-between items-center text-slate-600 font-semibold">
                <span>Standard Market MRP:</span>
                <span className="line-through text-slate-400 font-mono">
                  ₹{packageSummary.estimatedRetailMrp.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-700 font-bold">
                <span>Factory Buy Price (Subtotal):</span>
                <span className="font-mono text-sm text-slate-900">
                  ₹{packageSummary.subtotal.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-600 font-semibold">
                <span>GST (18% Input Credit):</span>
                <span className="font-mono text-slate-800">
                  ₹{packageSummary.gstAmount.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex justify-between items-center text-emerald-800 font-extrabold text-xs">
                <span className="flex items-center gap-1">
                  <FiCheckCircle size={14} className="text-emerald-600" /> Factory Wholesale Savings:
                </span>
                <span className="font-mono font-black text-emerald-700 text-sm">
                  -₹{packageSummary.savings.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-black text-slate-900 block">Total Procurement Amount:</span>
                  <span className="text-[10px] text-slate-400 font-medium">Includes 18% GST</span>
                </div>
                <span className="text-2xl font-heading font-black text-blue-600 font-mono">
                  ₹{packageSummary.grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleAddCustomKitToCart}
              disabled={addingToCart || packageSummary.selectedCount === 0}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {addingToCart ? (
                <FiRefreshCw className="animate-spin" />
              ) : (
                <FiShoppingCart size={18} />
              )}
              Add Customized BOS Kit to Cart
            </button>

            {/* Guarantee / Dispatch Notice */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-[11px] text-slate-500 font-medium">
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                <FiShield className="text-emerald-600" /> 100% Tested & Pre-Wired
              </div>
              <p>
                All customizable components meet IEC / IS 3043 standards and come with full GST Input Tax Credit (ITC).
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
