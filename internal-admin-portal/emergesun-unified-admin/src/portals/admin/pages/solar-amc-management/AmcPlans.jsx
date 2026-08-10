import React, { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { authHeaderObj } from "@/app/authHeader";
import ReactCountryFlag from "react-country-flag";
import {
  Plus,
  Edit,
  Copy,
  Trash2,
  CheckCircle2,
  Star,
  Search,
  Filter,
  LayoutGrid,
  List,
  X,
  Building2,
  FileText,
  ShieldCheck,
  Clock,
  Wrench,
  Globe,
  MapPin,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";

// Default AMC Plans mapped to active countries
const INITIAL_PLANS = [
  {
    id: "amc-basic-in",
    name: "Basic AMC",
    category: "Residential",
    country: "India",
    countryCode: "IN",
    currencySymbol: "₹",
    description: "Essential maintenance coverage with annual preventive visits and remote monitoring support.",
    basePrice: 18000,
    pricePerKw: 180,
    visitFrequency: "2 Visits/Year",
    cleaningFrequency: "Not Included",
    contractDuration: "1 Year",
    slaResponse: "24 Hours",
    billing: "Annual",
    status: "Active",
    isBestSeller: false,
    isPremium: false,
    subscribersCount: 312,
    features: [
      "Preventive Maintenance",
      "Remote Monitoring",
      "Corrective Support (Chargeable)",
    ],
  },
  {
    id: "amc-cleaning-in",
    name: "Cleaning AMC",
    category: "Residential",
    country: "India",
    countryCode: "IN",
    currencySymbol: "₹",
    description: "Regular panel cleaning service to maintain peak generation performance year-round.",
    basePrice: 12000,
    pricePerKw: 120,
    visitFrequency: "Not Included",
    cleaningFrequency: "4 Visits/Year",
    contractDuration: "1 Year",
    slaResponse: "48 Hours",
    billing: "Annual",
    status: "Active",
    isBestSeller: false,
    isPremium: false,
    subscribersCount: 189,
    features: [
      "Panel Cleaning (4x/year)",
      "Generation Report",
      "Before/After Photo Documentation",
    ],
  },
  {
    id: "amc-clean-maint-in",
    name: "Cleaning + Maintenance AMC",
    category: "Commercial",
    country: "India",
    countryCode: "IN",
    currencySymbol: "₹",
    description: "Comprehensive AMC combining regular cleaning with preventive maintenance for maximum uptime.",
    basePrice: 32000,
    pricePerKw: 320,
    visitFrequency: "4 Visits/Year",
    cleaningFrequency: "6 Visits/Year",
    contractDuration: "1 Year",
    slaResponse: "8 Hours",
    billing: "Quarterly",
    status: "Active",
    isBestSeller: true,
    isPremium: false,
    subscribersCount: 421,
    features: [
      "Preventive Maintenance (4x/year)",
      "Panel Cleaning (6x/year)",
      "Remote Monitoring",
      "Priority Support",
      "Thermal Imaging Inspection",
      "Consumables Cover",
    ],
  },
  {
    id: "amc-warranty-in",
    name: "Power Generation Warranty AMC",
    category: "Industrial",
    country: "India",
    countryCode: "IN",
    currencySymbol: "₹",
    description: "Premium AMC with guaranteed minimum power generation and comprehensive corrective support.",
    basePrice: 58000,
    pricePerKw: 580,
    visitFrequency: "6 Visits/Year",
    cleaningFrequency: "12 Visits/Year",
    contractDuration: "3 Years",
    slaResponse: "4 Hours",
    billing: "Quarterly",
    status: "Active",
    isBestSeller: false,
    isPremium: true,
    subscribersCount: 164,
    features: [
      "Monthly Preventive Maintenance",
      "Monthly Panel Cleaning",
      "Remote Monitoring (24/7)",
      "Generation Guarantee (90% of design)",
      "Zero Labor Charge Repairs",
      "Component Indemnification",
      "Dedicated Account Manager",
    ],
  },
  {
    id: "amc-aus-pro",
    name: "Australia Solar Care Pro",
    category: "Commercial",
    country: "Australia",
    countryCode: "AU",
    currencySymbol: "A$",
    description: "CEC-compliant preventive maintenance and inverter warranty renewal package in Australia.",
    basePrice: 2400,
    pricePerKw: 24,
    visitFrequency: "4 Visits/Year",
    cleaningFrequency: "4 Visits/Year",
    contractDuration: "1 Year",
    slaResponse: "12 Hours",
    billing: "Quarterly",
    status: "Active",
    isBestSeller: true,
    isPremium: true,
    subscribersCount: 95,
    features: [
      "Clean Energy Council Safety Audit",
      "Inverter Firmware & Health Scan",
      "Bi-annual Panel Wash",
      "Grid Compliance Protection",
    ],
  },
  {
    id: "amc-us-enterprise",
    name: "US Commercial Solar Shield",
    category: "Industrial",
    country: "United States",
    countryCode: "US",
    currencySymbol: "$",
    description: "Enterprise O&M coverage with 24/7 telemetry monitoring and fast technician dispatch in the US.",
    basePrice: 4800,
    pricePerKw: 45,
    visitFrequency: "6 Visits/Year",
    cleaningFrequency: "6 Visits/Year",
    contractDuration: "2 Years",
    slaResponse: "6 Hours",
    billing: "Quarterly",
    status: "Active",
    isBestSeller: false,
    isPremium: true,
    subscribersCount: 112,
    features: [
      "24/7 Telemetry Alert Monitoring",
      "Drone Thermal Mapping",
      "NEC 2023 Rapid Shutdown Audit",
      "Guaranteed 99.2% Plant Uptime",
    ],
  },
  {
    id: "saas-starter",
    name: "Starter Plan",
    category: "EPC Plans",
    country: "Global",
    countryCode: "US",
    currencySymbol: "$",
    description: "Ideal for small solar contractors & single-region installers.",
    basePrice: 49,
    pricePerKw: 0,
    visitFrequency: "N/A",
    cleaningFrequency: "N/A",
    contractDuration: "Monthly",
    slaResponse: "Email Support",
    billing: "Monthly",
    status: "Active",
    isBestSeller: false,
    isPremium: false,
    subscribersCount: 120,
    buttonText: "CHECKOUT STARTER",
    features: [
      "Up to 10 users",
      "1 country",
      "Basic analytics",
      "Email support",
      "5 GB storage",
    ],
  },
  {
    id: "saas-professional",
    name: "Professional Plan",
    category: "EPC Plans",
    country: "Global",
    countryCode: "US",
    currencySymbol: "$",
    description: "Perfect for growing EPC companies scaling residential & commercial projects.",
    basePrice: 149,
    pricePerKw: 0,
    visitFrequency: "N/A",
    cleaningFrequency: "N/A",
    contractDuration: "Monthly",
    slaResponse: "Priority Support",
    billing: "Monthly",
    status: "Active",
    isBestSeller: true,
    isPremium: false,
    subscribersCount: 380,
    buttonText: "CHECKOUT PROFESSIONAL",
    features: [
      "Up to 100 users",
      "5 countries",
      "Advanced analytics",
      "Priority support",
      "50 GB storage",
    ],
  },
  {
    id: "saas-enterprise",
    name: "Enterprise Plan",
    category: "EPC Plans",
    country: "Global",
    countryCode: "US",
    currencySymbol: "$",
    description: "Built for multi-country solar enterprises requiring full BI analytics.",
    basePrice: 499,
    pricePerKw: 0,
    visitFrequency: "N/A",
    cleaningFrequency: "N/A",
    contractDuration: "Monthly",
    slaResponse: "Dedicated SLA",
    billing: "Monthly",
    status: "Active",
    isBestSeller: false,
    isPremium: true,
    subscribersCount: 84,
    buttonText: "CHECKOUT ENTERPRISE",
    features: [
      "Unlimited users",
      "20 countries",
      "Full analytics suite",
      "Dedicated account manager",
      "500 GB storage",
      "Custom integrations",
    ],
  },
  {
    id: "saas-custom",
    name: "Custom Plan",
    category: "EPC Plans",
    country: "Global",
    countryCode: "US",
    currencySymbol: "$",
    description: "Tailored solution with custom BI, white-glove onboarding & dedicated SLA.",
    basePrice: 0,
    customPriceText: "Contact Sales",
    pricePerKw: 0,
    visitFrequency: "N/A",
    cleaningFrequency: "N/A",
    contractDuration: "Custom",
    slaResponse: "Dedicated SLA",
    billing: "Monthly",
    status: "Active",
    isBestSeller: false,
    isPremium: true,
    subscribersCount: 42,
    buttonText: "CHECKOUT CUSTOM",
    features: [
      "Unlimited everything",
      "Custom integrations",
      "White glove support",
      "Custom BI dashboard",
      "SLA guarantee",
    ],
  },
];

const DEFAULT_ACTIVE_COUNTRIES = [
  { id: "india", name: "India", iso2: "IN", currencySymbol: "₹" },
  { id: "australia", name: "Australia", iso2: "AU", currencySymbol: "A$" },
  { id: "united-states", name: "United States", iso2: "US", currencySymbol: "$" },
  { id: "united-kingdom", name: "United Kingdom", iso2: "GB", currencySymbol: "£" },
];

const CURRENCY_MAP = {
  IN: "₹",
  AU: "A$",
  US: "$",
  GB: "£",
  CA: "C$",
  DE: "€",
  FR: "€",
  AE: "AED",
};

const resolveCountryCode = (countryName, countryCode) => {
  if (countryName) {
    const c = countryName.toLowerCase();
    if (c.includes('australia')) return 'AU';
    if (c.includes('india')) return 'IN';
    if (c.includes('united states') || c.includes('us')) return 'US';
    if (c.includes('united kingdom') || c.includes('uk')) return 'GB';
    if (c.includes('canada')) return 'CA';
    if (c.includes('germany')) return 'DE';
    if (c.includes('france')) return 'FR';
    if (c.includes('emirates') || c.includes('uae')) return 'AE';
  }
  return countryCode || 'IN';
};

export default function AmcPlans({ defaultCategory }) {
  const { countryName } = useParams();
  const location = useLocation();

  const [activeCountries, setActiveCountries] = useState(DEFAULT_ACTIVE_COUNTRIES);
  const [selectedCountryTab, setSelectedCountryTab] = useState("All");
  const [loadingCountries, setLoadingCountries] = useState(false);

  const [plans, setPlans] = useState(INITIAL_PLANS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    defaultCategory || (location.pathname?.includes('epc-plans') ? "EPC Plans" : "All")
  );
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "Residential",
    country: "India",
    countryCode: "IN",
    currencySymbol: "₹",
    description: "",
    basePrice: "",
    pricePerKw: "",
    visitFrequency: "4 Visits/Year",
    cleaningFrequency: "6 Visits/Year",
    contractDuration: "1 Year",
    slaResponse: "24 Hours",
    billing: "Annual",
    status: "Active",
    isBestSeller: false,
    isPremium: false,
    buttonText: "",
    customPriceText: "",
    features: "",
  });

  const categories = ["All", "EPC Plans", "Residential", "Commercial", "Industrial"];

  const getAmcApiUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    if (envUrl.endsWith('/admin-api')) {
      return `${envUrl}/amc-plans`;
    }
    return `${envUrl}/api/amc-plans`;
  };

  // Fetch AMC Plans from backend API
  const fetchPlans = useCallback(async () => {
    try {
      setLoadingPlans(true);
      const url = getAmcApiUrl();
      const res = await axios.get(url, { headers: authHeaderObj() });
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setPlans(res.data.data.map(p => {
          const code = resolveCountryCode(p.country, p.countryCode);
          return {
            ...p,
            id: p._id || p.planId || p.id,
            countryCode: code,
            currencySymbol: p.currencySymbol || CURRENCY_MAP[code] || "₹",
            features: Array.isArray(p.features) ? p.features : (p.services || [])
          };
        }));
      }
    } catch (err) {
      console.warn("Error fetching AMC plans from backend, using fallback data:", err);
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Fetch Active Countries from Setup Location API (`geolocation/countries`)
  const fetchActiveCountries = useCallback(async () => {
    const API_URL = import.meta.env.VITE_API_URL;
    if (!API_URL || !authHeaderObj()?.Authorization) return;

    try {
      setLoadingCountries(true);
      const res = await axios.get(
        `${API_URL}/geolocation/countries?unique_id=ADM_SETUP_LOC&req_for=view`,
        { headers: authHeaderObj() }
      );

      if (res.data?.countries) {
        const activeList = res.data.countries
          .filter((c) => c.is_active || c.status === "active")
          .map((c) => ({
            id: c.name.toLowerCase().replace(/\s+/g, "-"),
            name: c.name,
            iso2: c.iso2 || "IN",
            currencySymbol: CURRENCY_MAP[c.iso2?.toUpperCase()] || c.currency_symbol || "₹",
          }));

        if (activeList.length > 0) {
          setActiveCountries(activeList);
        }
      }
    } catch (err) {
      console.warn("Using default active location countries fallback:", err);
    } finally {
      setLoadingCountries(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveCountries();
  }, [fetchActiveCountries]);

  // Handle URL route country matching if passed in params
  useEffect(() => {
    if (countryName) {
      const matched = activeCountries.find(
        (c) => c.name.toLowerCase() === countryName.toLowerCase() || c.iso2.toLowerCase() === countryName.toLowerCase()
      );
      if (matched) {
        setSelectedCountryTab(matched.name);
      }
    }
  }, [countryName, activeCountries]);

  // Filter plans based on active country tab, category, status, and search query
  const filteredPlans = plans.filter((plan) => {
    const matchesCountry =
      selectedCountryTab === "All" ||
      plan.country.toLowerCase() === selectedCountryTab.toLowerCase() ||
      plan.country === "Global";

    const matchesSearch =
      plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || plan.category === selectedCategory;

    const matchesStatus =
      selectedStatus === "All" || plan.status === selectedStatus;

    return matchesCountry && matchesSearch && matchesCategory && matchesStatus;
  });

  const totalActive = plans.filter((p) => p.status === "Active").length;
  const totalSubscribers = plans.reduce((sum, p) => sum + (p.subscribersCount || 0), 0);

  const stats = [
    { label: "Active Location Markets", value: activeCountries.length, description: "Configured in Settings" },
    { label: "Total Active Plans", value: plans.length, description: `${totalActive} Active Tiers` },
    { label: "Enrolled Solar Sites", value: totalSubscribers.toLocaleString(), description: "Active Contracts" },
    { label: "Avg SLA Compliance", value: "99.4%", description: "Guaranteed Response" },
  ];

  const handleOpenCreateModal = () => {
    const defaultCountryObj = activeCountries[0] || DEFAULT_ACTIVE_COUNTRIES[0];
    setEditingPlan(null);
    setFormData({
      name: "",
      category: "Residential",
      country: selectedCountryTab !== "All" ? selectedCountryTab : defaultCountryObj.name,
      countryCode: defaultCountryObj.iso2,
      currencySymbol: defaultCountryObj.currencySymbol,
      description: "",
      basePrice: "",
      pricePerKw: "",
      visitFrequency: "4 Visits/Year",
      cleaningFrequency: "6 Visits/Year",
      contractDuration: "1 Year",
      slaResponse: "24 Hours",
      billing: "Annual",
      status: "Active",
      isBestSeller: false,
      isPremium: false,
      features: "Preventive Maintenance (4x/year)\nPanel Cleaning (6x/year)\nRemote Monitoring\nPriority Support",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      category: plan.category,
      country: plan.country,
      countryCode: plan.countryCode || "IN",
      currencySymbol: plan.currencySymbol || "₹",
      description: plan.description,
      basePrice: plan.basePrice,
      pricePerKw: plan.pricePerKw,
      visitFrequency: plan.visitFrequency,
      cleaningFrequency: plan.cleaningFrequency,
      contractDuration: plan.contractDuration,
      slaResponse: plan.slaResponse,
      billing: plan.billing || "Annual",
      status: plan.status,
      isBestSeller: plan.isBestSeller,
      isPremium: plan.isPremium,
      features: Array.isArray(plan.features) ? plan.features.join("\n") : (plan.services ? plan.services.join("\n") : ""),
    });
    setIsModalOpen(true);
  };

  const handleCountryChangeInModal = (countryNameStr) => {
    const found = activeCountries.find((c) => c.name.toLowerCase() === countryNameStr.toLowerCase());
    const code = found?.iso2 || resolveCountryCode(countryNameStr, "IN");
    const symbol = found?.currencySymbol || CURRENCY_MAP[code] || "₹";
    setFormData((prev) => ({
      ...prev,
      country: countryNameStr,
      countryCode: code,
      currencySymbol: symbol,
    }));
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm("Are you sure you want to delete this AMC plan?")) return;
    try {
      const url = `${getAmcApiUrl()}/${id}`;
      await axios.delete(url, { headers: authHeaderObj() });
      fetchPlans();
    } catch (err) {
      console.warn("Failed to delete via API, removing locally:", err);
      setPlans((prev) => prev.filter((p) => p.id !== id && p._id !== id && p.planId !== id));
    }
  };

  const handleDuplicatePlan = async (plan) => {
    const newPlanData = {
      ...plan,
      planId: `amc-${Date.now()}`,
      name: `${plan.name} (Copy)`,
      subscribersCount: 0,
    };
    delete newPlanData._id;
    delete newPlanData.id;

    try {
      const url = getAmcApiUrl();
      await axios.post(url, newPlanData, { headers: authHeaderObj() });
      fetchPlans();
    } catch (err) {
      console.warn("Failed to duplicate via API, duplicating locally:", err);
      setPlans((prev) => [...prev, { ...newPlanData, id: newPlanData.planId }]);
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    const featureList = formData.features
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    const resolvedCode = resolveCountryCode(formData.country, formData.countryCode);
    const resolvedSymbol = formData.currencySymbol || CURRENCY_MAP[resolvedCode] || "₹";

    const payload = {
      name: formData.name,
      category: formData.category,
      country: formData.country,
      countryCode: resolvedCode,
      currencySymbol: resolvedSymbol,
      description: formData.description,
      basePrice: Number(formData.basePrice) || 0,
      pricePerKw: Number(formData.pricePerKw) || 0,
      visitFrequency: formData.visitFrequency,
      cleaningFrequency: formData.cleaningFrequency,
      contractDuration: formData.contractDuration,
      slaResponse: formData.slaResponse,
      billing: formData.billing,
      status: formData.status,
      isBestSeller: formData.isBestSeller,
      isPremium: formData.isPremium,
      features: featureList,
    };

    try {
      const apiUrl = getAmcApiUrl();
      if (editingPlan) {
        const targetId = editingPlan._id || editingPlan.planId || editingPlan.id;
        await axios.put(`${apiUrl}/${targetId}`, payload, { headers: authHeaderObj() });
      } else {
        payload.planId = `amc-${Date.now()}`;
        payload.subscribersCount = 0;
        await axios.post(apiUrl, payload, { headers: authHeaderObj() });
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (err) {
      console.warn("API request failed, updating local state fallback:", err);
      if (editingPlan) {
        setPlans((prev) =>
          prev.map((p) =>
            (p.id === editingPlan.id || p._id === editingPlan._id)
              ? { ...p, ...payload }
              : p
          )
        );
      } else {
        const newPlan = {
          ...payload,
          id: `amc-${Date.now()}`,
          subscribersCount: 0,
        };
        setPlans((prev) => [...prev, newPlan]);
      }
      setIsModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="AMC Plans Management"
        subtitle="Manage country-specific annual maintenance contract packages configured via Setup Location active markets"
        icon={FileText}
        stats={stats}
        actions={
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md hover:scale-105 transition-all text-sm cursor-pointer"
          >
            <Plus size={16} />
            <span>Create AMC Plan</span>
          </button>
        }
      />

      {/* Active Countries Selection Tabs (Sourced from Settings -> Setup Location -> Active Countries) */}
      <div className="card p-4 bg-surface border border-border rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="text-primary w-4 h-4" />
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Setup Location Active Markets
            </h3>
          </div>
          <span className="text-[11px] font-medium text-text-secondary">
            Select an active country to view localized plans
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/60">
          <button
            onClick={() => setSelectedCountryTab("All")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCountryTab === "All"
                ? "bg-primary text-white shadow-md"
                : "bg-surface-hover text-text-secondary hover:text-text-primary border border-border/60"
            }`}
          >
            <Globe size={14} />
            <span>All Active Countries</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
              selectedCountryTab === "All" ? "bg-white/20 text-white" : "bg-border/60 text-text-secondary"
            }`}>
              {plans.length}
            </span>
          </button>

          {activeCountries.map((c) => {
            const countryPlansCount = plans.filter(
              (p) => p.country.toLowerCase() === c.name.toLowerCase()
            ).length;
            const isSelected = selectedCountryTab.toLowerCase() === c.name.toLowerCase();

            return (
              <button
                key={c.id}
                onClick={() => setSelectedCountryTab(c.name)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary text-white shadow-md"
                    : "bg-surface-hover text-text-secondary hover:text-text-primary border border-border/60"
                }`}
              >
                <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center border border-border/50 shrink-0">
                  <ReactCountryFlag countryCode={c.iso2} svg style={{ width: "1.1em", height: "1.1em" }} />
                </div>
                <span>{c.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isSelected ? "bg-white/20 text-white" : "bg-border/60 text-text-secondary"
                }`}>
                  {countryPlansCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls Bar: Search, Category, Status, View Toggle */}
      <div className="card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" />
          <input
            type="text"
            placeholder="Search plans by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-text-primary placeholder:text-text-secondary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-surface-hover px-3 py-1.5 rounded-xl border border-border">
            <Filter className="text-text-secondary w-3.5 h-3.5" />
            <span className="text-xs font-medium text-text-secondary">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs font-bold text-text-primary focus:outline-none cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-surface text-text-primary">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-surface-hover px-3 py-1.5 rounded-xl border border-border">
            <span className="text-xs font-medium text-text-secondary">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-xs font-bold text-text-primary focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-surface text-text-primary">All Status</option>
              <option value="Active" className="bg-surface text-text-primary">Active</option>
              <option value="Inactive" className="bg-surface text-text-primary">Inactive</option>
            </select>
          </div>

          <div className="flex items-center bg-surface-hover border border-border rounded-xl p-1 ml-auto md:ml-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
              title="Table View"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {filteredPlans.map((plan) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`card bg-surface p-5 flex flex-col justify-between border-2 transition-all duration-200 hover:shadow-lg rounded-2xl ${
                plan.isBestSeller
                  ? "border-amber-400/80 shadow-md shadow-amber-500/5"
                  : "border-border/80 hover:border-primary/40"
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-text-primary text-base leading-snug">
                      {plan.name}
                    </h3>
                    {plan.isBestSeller && (
                      <span className="text-[10px] font-extrabold bg-amber-500 text-white px-2 py-0.5 rounded-md tracking-wider">
                        POPULAR
                      </span>
                    )}
                    {plan.isPremium && (
                      <Star size={14} className="text-amber-500 fill-amber-500 shrink-0" />
                    )}
                  </div>
                </div>

                {/* Country Tag & Status Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-surface-hover rounded-lg border border-border/60 text-[11px] font-bold text-text-secondary">
                    <ReactCountryFlag countryCode={resolveCountryCode(plan.country, plan.countryCode)} svg style={{ width: "1.1em", height: "1.1em" }} />
                    <span>{plan.country}</span>
                  </div>
                </div>

                {/* Subtitle / Description */}
                <p className="text-xs text-text-secondary leading-relaxed mb-4 min-h-[36px]">
                  {plan.description}
                </p>

                {/* Base Price Box */}
                <div className="p-3.5 bg-surface-hover/80 rounded-xl border border-border/60 mb-4">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">
                    BASE PRICE ({plan.country.toUpperCase()})
                  </p>
                  <p className="text-2xl font-black text-text-primary tracking-tight">
                    {plan.currencySymbol || "₹"}
                    {plan.basePrice >= 1000 ? `${(plan.basePrice / 1000).toFixed(0)}K` : plan.basePrice}
                    <span className="text-xs font-normal text-text-secondary">/year</span>
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {plan.currencySymbol || "₹"}{plan.pricePerKw}/kWp/year
                  </p>
                </div>

                {/* Specifications Grid */}
                <div className="space-y-2 mb-4 text-xs">
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-text-secondary">PM Visits</span>
                    <span className={`font-semibold ${plan.visitFrequency === "Not Included" ? "text-text-secondary/60" : "text-text-primary"}`}>
                      {plan.visitFrequency}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-text-secondary">Cleaning</span>
                    <span className={`font-semibold ${plan.cleaningFrequency === "Not Included" ? "text-text-secondary/60" : "text-text-primary"}`}>
                      {plan.cleaningFrequency}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-text-secondary">Duration</span>
                    <span className="font-semibold text-text-primary">
                      {plan.contractDuration}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-text-secondary">SLA Response</span>
                    <span className="font-semibold text-text-primary">
                      {plan.slaResponse}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-text-secondary">Billing</span>
                    <span className="font-semibold text-text-primary">
                      {plan.billing}
                    </span>
                  </div>
                </div>

                {/* Services Checklist */}
                <div className="pt-3 border-t border-border/60 space-y-2 mb-4">
                  {plan.features.map((svc, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-text-secondary">{svc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-border/60">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="font-bold text-text-primary">
                    {plan.subscribersCount}{" "}
                    <span className="font-normal text-text-secondary">active contracts</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(plan)}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 bg-surface hover:bg-surface-hover border border-border rounded-xl text-xs font-bold text-text-primary transition-all cursor-pointer"
                  >
                    <Edit size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDuplicatePlan(plan)}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 bg-surface hover:bg-surface-hover border border-border rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                  >
                    <Copy size={13} />
                    <span>Copy</span>
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan.id || plan._id || plan.planId)}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 bg-surface hover:bg-red-50 dark:hover:bg-red-950/30 border border-border hover:border-red-200 dark:hover:border-red-900 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 transition-all cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-primary">
              <thead className="bg-surface-hover border-b border-border text-xs uppercase font-bold text-text-secondary tracking-wider">
                <tr>
                  <th className="p-4">Plan Name</th>
                  <th className="p-4">Country</th>
                  <th className="p-4">Base Price</th>
                  <th className="p-4">Rate / kWp</th>
                  <th className="p-4">PM Visits</th>
                  <th className="p-4">Cleaning</th>
                  <th className="p-4">SLA Response</th>
                  <th className="p-4">Billing</th>
                  <th className="p-4">Contracts</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="p-4 font-bold text-text-primary">
                      <div className="flex items-center gap-2">
                        <span>{plan.name}</span>
                        {plan.isBestSeller && (
                          <span className="text-[9px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded">
                            POPULAR
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
                        <ReactCountryFlag countryCode={resolveCountryCode(plan.country, plan.countryCode)} svg style={{ width: "1.1em", height: "1.1em" }} />
                        <span>{plan.country}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-primary">
                      {plan.currencySymbol || "₹"}{plan.basePrice >= 1000 ? `${(plan.basePrice / 1000).toFixed(0)}K` : plan.basePrice}/yr
                    </td>
                    <td className="p-4 text-text-secondary text-xs">
                      {plan.currencySymbol || "₹"}{plan.pricePerKw}/kWp
                    </td>
                    <td className="p-4 text-text-secondary text-xs">{plan.visitFrequency}</td>
                    <td className="p-4 text-text-secondary text-xs">{plan.cleaningFrequency}</td>
                    <td className="p-4 text-text-secondary text-xs">{plan.slaResponse}</td>
                    <td className="p-4 text-text-secondary text-xs">{plan.billing}</td>
                    <td className="p-4 font-bold text-text-primary">{plan.subscribersCount}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          className="p-1.5 hover:bg-surface-hover rounded-lg text-text-secondary hover:text-danger cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Create / Edit */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card bg-surface w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 border border-border shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                <h3 className="text-xl font-bold text-text-primary">
                  {editingPlan ? "Edit AMC Plan" : "Create New AMC Plan"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-text-secondary hover:text-text-primary rounded-xl hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1">
                      Target Active Country (Setup Location) *
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => handleCountryChangeInModal(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-text-primary font-bold"
                    >
                      {activeCountries.map((c) => (
                        <option key={c.id} value={c.name} className="bg-surface text-text-primary">
                          {c.name} ({c.currencySymbol})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1">
                      Plan Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Basic AMC"
                      className="w-full px-3 py-2 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-text-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1">
                      Target Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-text-primary"
                    >
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Industrial">Industrial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1">
                      Base Price ({formData.currencySymbol} / Year) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                      placeholder="18000"
                      className="w-full px-3 py-2 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-text-primary font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1">
                      Price per kWp ({formData.currencySymbol} / kWp / Year)
                    </label>
                    <input
                      type="number"
                      value={formData.pricePerKw}
                      onChange={(e) => setFormData({ ...formData, pricePerKw: e.target.value })}
                      placeholder="180"
                      className="w-full px-3 py-2 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-text-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1">
                      PM Visit Frequency
                    </label>
                    <input
                      type="text"
                      value={formData.visitFrequency}
                      onChange={(e) => setFormData({ ...formData, visitFrequency: e.target.value })}
                      placeholder="e.g. 2 Visits/Year"
                      className="w-full px-3 py-2 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-text-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1">
                      Cleaning Frequency
                    </label>
                    <input
                      type="text"
                      value={formData.cleaningFrequency}
                      onChange={(e) => setFormData({ ...formData, cleaningFrequency: e.target.value })}
                      placeholder="e.g. 4 Visits/Year"
                      className="w-full px-3 py-2 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-text-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1">
                      Contract Duration
                    </label>
                    <input
                      type="text"
                      value={formData.contractDuration}
                      onChange={(e) => setFormData({ ...formData, contractDuration: e.target.value })}
                      placeholder="e.g. 1 Year"
                      className="w-full px-3 py-2 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-text-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1">
                      SLA Response Guarantee
                    </label>
                    <input
                      type="text"
                      value={formData.slaResponse}
                      onChange={(e) => setFormData({ ...formData, slaResponse: e.target.value })}
                      placeholder="e.g. 24 Hours"
                      className="w-full px-3 py-2 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-text-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-1">
                      Billing Cycle
                    </label>
                    <input
                      type="text"
                      value={formData.billing}
                      onChange={(e) => setFormData({ ...formData, billing: e.target.value })}
                      placeholder="Annual or Quarterly"
                      className="w-full px-3 py-2 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-text-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">
                    Plan Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Briefly describe the coverage..."
                    className="w-full px-3 py-2 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-text-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1">
                    Included Features (One feature per line)
                  </label>
                  <textarea
                    rows={4}
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    placeholder="Preventive Maintenance&#10;Remote Monitoring&#10;Corrective Support"
                    className="w-full px-3 py-2 bg-surface-hover border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-text-primary font-mono text-xs"
                  />
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-text-primary">
                    <input
                      type="checkbox"
                      checked={formData.isBestSeller}
                      onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Mark as Popular (Yellow Highlight)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-text-primary">
                    <input
                      type="checkbox"
                      checked={formData.isPremium}
                      onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Add Star Badge (Premium Tier)</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 border-t border-border pt-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-sm font-bold bg-primary text-white shadow-md hover:scale-105 transition-all cursor-pointer"
                  >
                    {editingPlan ? "Save Changes" : "Create Plan"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
