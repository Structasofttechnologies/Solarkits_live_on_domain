import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
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
  Sparkles,
  Globe,
  MapPin,
  Check,
  ArrowRight,
  TrendingUp,
  Users,
  DollarSign,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";

// Default EPC Software Tiers matching user's exact screenshot
const INITIAL_EPC_PLANS = [
  {
    id: "epc-starter",
    name: "Starter Plan",
    category: "Starter",
    country: "Global",
    countryCode: "US",
    currencySymbol: "$",
    description: "Ideal for small solar contractors & single-region installers.",
    basePrice: 49,
    priceAnnual: 470,
    customPriceText: "",
    billing: "Monthly",
    status: "Active",
    isBestSeller: false,
    isPremium: false,
    subscribersCount: 142,
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
    id: "epc-professional",
    name: "Professional Plan",
    category: "Professional",
    country: "Global",
    countryCode: "US",
    currencySymbol: "$",
    description: "Perfect for growing EPC companies scaling residential & commercial projects.",
    basePrice: 149,
    priceAnnual: 1430,
    customPriceText: "",
    billing: "Monthly",
    status: "Active",
    isBestSeller: true,
    isPremium: false,
    subscribersCount: 489,
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
    id: "epc-enterprise",
    name: "Enterprise Plan",
    category: "Enterprise",
    country: "Global",
    countryCode: "US",
    currencySymbol: "$",
    description: "Built for multi-country solar enterprises requiring full BI analytics.",
    basePrice: 499,
    priceAnnual: 4790,
    customPriceText: "",
    billing: "Monthly",
    status: "Active",
    isBestSeller: false,
    isPremium: true,
    subscribersCount: 98,
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
    id: "epc-custom",
    name: "Custom Plan",
    category: "Custom Tiers",
    country: "Global",
    countryCode: "US",
    currencySymbol: "$",
    description: "Tailored solution with custom BI, white-glove onboarding & dedicated SLA.",
    basePrice: 0,
    priceAnnual: 0,
    customPriceText: "Contact Sales",
    billing: "Monthly",
    status: "Active",
    isBestSeller: false,
    isPremium: true,
    subscribersCount: 35,
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
  { id: "global", name: "Global", iso2: "US", currencySymbol: "$" },
  { id: "india", name: "India", iso2: "IN", currencySymbol: "₹" },
  { id: "australia", name: "Australia", iso2: "AU", currencySymbol: "A$" },
  { id: "united-kingdom", name: "United Kingdom", iso2: "GB", currencySymbol: "£" },
];

export default function EpcPlans() {
  const [plans, setPlans] = useState(INITIAL_EPC_PLANS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedCountryTab, setSelectedCountryTab] = useState("All");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "Professional",
    country: "Global",
    countryCode: "US",
    currencySymbol: "$",
    description: "",
    basePrice: "",
    customPriceText: "",
    billing: "Monthly",
    status: "Active",
    isBestSeller: false,
    isPremium: false,
    buttonText: "CHECKOUT PLAN",
    features: "",
  });

  const categories = ["All", "Starter", "Professional", "Enterprise", "Custom Tiers"];

  const getEpcApiUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    if (envUrl.endsWith('/admin-api')) {
      return `${envUrl}/epc-plans`;
    }
    if (envUrl.includes('/admin-api')) {
      return `${envUrl.replace(/\/+$/, '')}/epc-plans`;
    }
    return `${envUrl}/api/epc-plans`;
  };

  // Fetch EPC Plans from API
  const fetchPlans = useCallback(async () => {
    try {
      setLoadingPlans(true);
      const url = getEpcApiUrl();
      const res = await axios.get(url, { headers: authHeaderObj() });
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setPlans(res.data.data);
      } else {
        setPlans(INITIAL_EPC_PLANS);
      }
    } catch (err) {
      console.warn("Could not load remote EPC plans, using local default list:", err);
      setPlans(INITIAL_EPC_PLANS);
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Open Modal for Create or Edit
  const handleOpenModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name || "",
        category: plan.category || "Professional",
        country: plan.country || "Global",
        countryCode: plan.countryCode || "US",
        currencySymbol: plan.currencySymbol || "$",
        description: plan.description || "",
        basePrice: plan.basePrice ?? "",
        customPriceText: plan.customPriceText || "",
        billing: plan.billing || "Monthly",
        status: plan.status || "Active",
        isBestSeller: !!plan.isBestSeller,
        isPremium: !!plan.isPremium,
        buttonText: plan.buttonText || "",
        features: Array.isArray(plan.features) ? plan.features.join("\n") : plan.features || "",
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: "",
        category: "Professional",
        country: "Global",
        countryCode: "US",
        currencySymbol: "$",
        description: "",
        basePrice: "",
        customPriceText: "",
        billing: "Monthly",
        status: "Active",
        isBestSeller: false,
        isPremium: false,
        buttonText: "CHECKOUT PLAN",
        features: "",
      });
    }
    setIsModalOpen(true);
  };

  // Save (Create / Update)
  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const featureList = formData.features
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    const payload = {
      ...formData,
      basePrice: Number(formData.basePrice) || 0,
      features: featureList,
      buttonText: formData.buttonText || `CHECKOUT ${formData.name.toUpperCase()}`,
    };

    try {
      const url = getEpcApiUrl();
      if (editingPlan) {
        await axios.put(`${url}/${editingPlan.id}`, payload, { headers: authHeaderObj() });
      } else {
        await axios.post(url, payload, { headers: authHeaderObj() });
      }
      fetchPlans();
    } catch (err) {
      console.warn("API operation failed, updating local state directly:", err);
      if (editingPlan) {
        setPlans((prev) =>
          prev.map((p) => (p.id === editingPlan.id ? { ...p, ...payload } : p))
        );
      } else {
        const newPlan = {
          ...payload,
          id: `epc-${Date.now()}`,
          subscribersCount: 0,
        };
        setPlans((prev) => [newPlan, ...prev]);
      }
    }

    setIsModalOpen(false);
  };

  // Duplicate Plan
  const handleDuplicatePlan = (plan) => {
    const duplicated = {
      ...plan,
      id: `epc-${Date.now()}`,
      name: `${plan.name} (Copy)`,
      subscribersCount: 0,
    };
    setPlans((prev) => [duplicated, ...prev]);
  };

  // Delete Plan
  const handleDeletePlan = async (id) => {
    if (!window.confirm("Are you sure you want to delete this EPC Plan?")) return;
    try {
      const url = getEpcApiUrl();
      await axios.delete(`${url}/${id}`, { headers: authHeaderObj() });
      fetchPlans();
    } catch (err) {
      console.warn("API delete failed, removing locally:", err);
      setPlans((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // Filtered plans
  const filteredPlans = plans.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesStatus = selectedStatus === "All" || p.status === selectedStatus;
    const matchesCountry =
      selectedCountryTab === "All" ||
      (p.country && p.country.toLowerCase().includes(selectedCountryTab.toLowerCase()));

    return matchesSearch && matchesCategory && matchesStatus && matchesCountry;
  });

  // Calculate Metrics
  const totalActivePlans = plans.filter((p) => p.status === "Active").length;
  const totalSubscribers = plans.reduce((acc, p) => acc + (p.subscribersCount || 0), 0);
  const estMrr = plans.reduce((acc, p) => acc + (p.basePrice || 0) * (p.subscribersCount || 0), 0);

  return null;

  // return (
  //   <div className="space-y-8 pb-16">
  //     {/* Top Header */}
  //     <PageHeader
  //       title="EPC Plans Management"
  //       subTitle="Create, edit & manage software subscription packages for Solar EPC contractors and installers."
  //       actions={
  //         <button
  //           onClick={() => handleOpenModal()}
  //           className="flex items-center gap-2 bg-solar hover:bg-solar-600 text-black font-black px-5 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
  //         >
  //           <Plus className="w-5 h-5" />
  //           <span>Create New EPC Plan</span>
  //         </button>
  //       }
  //     />

  //     {/* KPI Stats Cards */}
  //     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
  //       <div className="bg-surface rounded-3xl p-6 border border-border shadow-xs flex items-center gap-4">
  //         <div className="w-12 h-12 rounded-2xl bg-surface-hover text-primary flex items-center justify-center font-bold text-xl">
  //           <Layers className="w-6 h-6 text-solar" />
  //         </div>
  //         <div>
  //           <p className="text-xs font-semibold text-text-secondary">Total Active EPC Tiers</p>
  //           <h4 className="text-2xl font-black text-text-primary">{totalActivePlans} Plans</h4>
  //         </div>
  //       </div>

  //       <div className="bg-surface rounded-3xl p-6 border border-border shadow-xs flex items-center gap-4">
  //         <div className="w-12 h-12 rounded-2xl bg-success/10 text-success flex items-center justify-center font-bold text-xl">
  //           <Users className="w-6 h-6" />
  //         </div>
  //         <div>
  //           <p className="text-xs font-semibold text-text-secondary">Total EPC Subscribers</p>
  //           <h4 className="text-2xl font-black text-text-primary">{totalSubscribers.toLocaleString()} Active</h4>
  //         </div>
  //       </div>

  //       <div className="bg-surface rounded-3xl p-6 border border-border shadow-xs flex items-center gap-4">
  //         <div className="w-12 h-12 rounded-2xl bg-solar/10 text-primary flex items-center justify-center font-bold text-xl">
  //           <DollarSign className="w-6 h-6 text-solar" />
  //         </div>
  //         <div>
  //           <p className="text-xs font-semibold text-text-secondary">Est. Monthly Revenue (MRR)</p>
  //           <h4 className="text-2xl font-black text-text-primary">${estMrr.toLocaleString()} / mo</h4>
  //         </div>
  //       </div>

  //       <div className="bg-surface rounded-3xl p-6 border border-border shadow-xs flex items-center gap-4">
  //         <div className="w-12 h-12 rounded-2xl bg-surface-hover text-solar flex items-center justify-center font-bold text-xl">
  //           <Star className="w-6 h-6 fill-solar" />
  //         </div>
  //         <div>
  //           <p className="text-xs font-semibold text-text-secondary">Most Popular Tier</p>
  //           <h4 className="text-xl font-black text-text-primary">Professional Plan</h4>
  //         </div>
  //       </div>
  //     </div>

  //     {/* Filter and Action Bar */}
  //     <div className="bg-surface rounded-3xl p-5 border border-border shadow-xs space-y-4">
  //       {/* Country Selector Tabs */}
  //       <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border/60">
  //         <span className="text-xs font-black text-text-secondary uppercase tracking-wider mr-2 shrink-0">
  //           Market Region:
  //         </span>
  //         <button
  //           onClick={() => setSelectedCountryTab("All")}
  //           className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
  //             selectedCountryTab === "All"
  //               ? "bg-primary text-white shadow-md"
  //               : "bg-surface-hover text-text-secondary hover:text-text-primary border border-border/60"
  //           }`}
  //         >
  //           All Markets
  //         </button>
  //         {DEFAULT_ACTIVE_COUNTRIES.map((c) => (
  //           <button
  //             key={c.id}
  //             onClick={() => setSelectedCountryTab(c.name)}
  //             className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
  //               selectedCountryTab === c.name
  //                 ? "bg-primary text-white shadow-md"
  //                 : "bg-surface-hover text-text-secondary hover:text-text-primary border border-border/60"
  //             }`}
  //           >
  //             <ReactCountryFlag countryCode={c.iso2} svg style={{ width: "1.2em", height: "1.2em" }} />
  //             <span>{c.name} ({c.currencySymbol})</span>
  //           </button>
  //         ))}
  //       </div>

  //       {/* Search & View Controls */}
  //       <div className="flex flex-col md:flex-row items-center justify-between gap-4">
  //         <div className="relative w-full md:w-80">
  //           <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
  //           <input
  //             type="text"
  //             placeholder="Search EPC plans..."
  //             value={searchQuery}
  //             onChange={(e) => setSearchQuery(e.target.value)}
  //             className="w-full pl-10 pr-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm font-semibold text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40"
  //           />
  //         </div>

  //         <div className="flex items-center gap-3 w-full md:w-auto justify-end">
  //           {/* Category Filter */}
  //           <div className="flex items-center gap-2 bg-surface-hover px-3.5 py-2 rounded-xl border border-border">
  //             <Filter className="w-3.5 h-3.5 text-text-secondary" />
  //             <span className="text-xs font-medium text-text-secondary">Category:</span>
  //             <select
  //               value={selectedCategory}
  //               onChange={(e) => setSelectedCategory(e.target.value)}
  //               className="bg-transparent text-xs font-extrabold text-text-primary focus:outline-none cursor-pointer"
  //             >
  //               {categories.map((cat) => (
  //                 <option key={cat} value={cat} className="bg-surface text-text-primary">
  //                   {cat}
  //                 </option>
  //               ))}
  //             </select>
  //           </div>

  //           {/* Status Filter */}
  //           <div className="flex items-center gap-2 bg-surface-hover px-3.5 py-2 rounded-xl border border-border">
  //             <span className="text-xs font-medium text-text-secondary">Status:</span>
  //             <select
  //               value={selectedStatus}
  //               onChange={(e) => setSelectedStatus(e.target.value)}
  //               className="bg-transparent text-xs font-extrabold text-text-primary focus:outline-none cursor-pointer"
  //             >
  //               <option value="All" className="bg-surface text-text-primary">All Status</option>
  //               <option value="Active" className="bg-surface text-text-primary">Active</option>
  //               <option value="Inactive" className="bg-surface text-text-primary">Inactive</option>
  //             </select>
  //           </div>

  //           {/* View Switcher */}
  //           <div className="flex items-center bg-surface-hover border border-border rounded-xl p-1">
  //             <button
  //               onClick={() => setViewMode("grid")}
  //               className={`p-2 rounded-lg transition-all cursor-pointer ${
  //                 viewMode === "grid" ? "bg-primary text-white shadow-xs" : "text-text-secondary hover:text-text-primary"
  //               }`}
  //               title="Grid View"
  //             >
  //               <LayoutGrid className="w-4 h-4" />
  //             </button>
  //             <button
  //               onClick={() => setViewMode("table")}
  //               className={`p-2 rounded-lg transition-all cursor-pointer ${
  //                 viewMode === "table" ? "bg-primary text-white shadow-xs" : "text-text-secondary hover:text-text-primary"
  //               }`}
  //               title="Table View"
  //             >
  //               <List className="w-4 h-4" />
  //             </button>
  //           </div>
  //         </div>
  //       </div>
  //     </div>

  //     {/* Grid View (Commented Out) */}
  //     {/*
  //     <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
  //       {filteredPlans.map((plan) => (
  //         ...
  //       ))}
  //     </div>
  //     */}

  //     {/* Table View */}
  //       <div className="bg-surface rounded-3xl border border-border shadow-xs overflow-hidden">
  //         <div className="overflow-x-auto">
  //           <table className="w-full text-left border-collapse">
  //             <thead>
  //               <tr className="bg-surface-hover border-b border-border text-xs font-black text-text-secondary uppercase tracking-wider">
  //                 <th className="py-4 px-6">Plan Name</th>
  //                 <th className="py-4 px-6">Category</th>
  //                 <th className="py-4 px-6">Price</th>
  //                 <th className="py-4 px-6">Subscribers</th>
  //                 <th className="py-4 px-6">CTA Button</th>
  //                 <th className="py-4 px-6">Status</th>
  //                 <th className="py-4 px-6 text-right">Actions</th>
  //               </tr>
  //             </thead>
  //             <tbody className="divide-y divide-border text-xs font-semibold text-text-primary">
  //               {filteredPlans.map((plan) => (
  //                 <tr key={plan.id} className="hover:bg-surface-hover/60 transition-colors">
  //                   <td className="py-4 px-6 font-black text-sm text-text-primary">
  //                     <div className="flex items-center gap-2">
  //                       <span>{plan.name}</span>
  //                       {plan.isBestSeller && (
  //                         <span className="text-[10px] font-extrabold bg-solar text-black px-2 py-0.5 rounded-full">
  //                           Popular
  //                         </span>
  //                       )}
  //                     </div>
  //                   </td>
  //                   <td className="py-4 px-6 font-bold text-text-secondary">{plan.category}</td>
  //                   <td className="py-4 px-6 font-black text-sm text-text-primary">
  //                     {plan.customPriceText ? plan.customPriceText : `${plan.currencySymbol || "$"}${plan.basePrice}/mo`}
  //                   </td>
  //                   <td className="py-4 px-6 font-extrabold text-text-primary">
  //                     {plan.subscribersCount || 0} users
  //                   </td>
  //                   <td className="py-4 px-6 font-extrabold text-text-secondary">
  //                     {plan.buttonText || "N/A"}
  //                   </td>
  //                   <td className="py-4 px-6">
  //                     <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
  //                       plan.status === "Active"
  //                         ? "bg-success/15 text-success border border-success/30"
  //                         : "bg-error/15 text-error border border-error/30"
  //                     }`}>
  //                       {plan.status}
  //                     </span>
  //                   </td>
  //                   <td className="py-4 px-6 text-right">
  //                     <div className="flex items-center justify-end gap-2">
  //                       <button
  //                         onClick={() => handleOpenModal(plan)}
  //                         className="p-2 hover:bg-surface-hover rounded-lg text-text-primary transition-colors cursor-pointer"
  //                       >
  //                         <Edit className="w-4 h-4" />
  //                       </button>
  //                       <button
  //                         onClick={() => handleDuplicatePlan(plan)}
  //                         className="p-2 hover:bg-surface-hover rounded-lg text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
  //                       >
  //                         <Copy className="w-4 h-4" />
  //                       </button>
  //                       <button
  //                         onClick={() => handleDeletePlan(plan.id)}
  //                         className="p-2 hover:bg-error/10 rounded-lg text-error transition-colors cursor-pointer"
  //                       >
  //                         <Trash2 className="w-4 h-4" />
  //                       </button>
  //                     </div>
  //                   </td>
  //                 </tr>
  //               ))}
  //             </tbody>
  //           </table>
  //         </div>
  //       </div>

  //     {/* Modal Form for Create / Edit */}
  //     <AnimatePresence>
  //       {isModalOpen && (
  //         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
  //           <motion.div
  //             initial={{ opacity: 0, scale: 0.95 }}
  //             animate={{ opacity: 1, scale: 1 }}
  //             exit={{ opacity: 0, scale: 0.95 }}
  //             className="bg-surface rounded-3xl border border-border shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6"
  //           >
  //             <div className="flex items-center justify-between border-b border-border pb-4">
  //               <h3 className="text-xl font-black text-text-primary">
  //                 {editingPlan ? "Edit EPC Plan" : "Create New EPC Plan"}
  //               </h3>
  //               <button
  //                 onClick={() => setIsModalOpen(false)}
  //                 className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-xl transition-colors cursor-pointer"
  //               >
  //                 <X className="w-5 h-5" />
  //               </button>
  //             </div>

  //             <form onSubmit={handleSavePlan} className="space-y-5">
  //               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  //                 <div>
  //                   <label className="block text-xs font-extrabold text-text-primary mb-1">
  //                     Plan Name *
  //                   </label>
  //                   <input
  //                     type="text"
  //                     required
  //                     value={formData.name}
  //                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
  //                     placeholder="e.g. Professional Plan"
  //                     className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm font-semibold text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
  //                   />
  //                 </div>

  //                 <div>
  //                   <label className="block text-xs font-extrabold text-text-primary mb-1">
  //                     Category Tier
  //                   </label>
  //                   <select
  //                     value={formData.category}
  //                     onChange={(e) => setFormData({ ...formData, category: e.target.value })}
  //                     className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
  //                   >
  //                     <option value="Starter" className="bg-surface text-text-primary">Starter</option>
  //                     <option value="Professional" className="bg-surface text-text-primary">Professional</option>
  //                     <option value="Enterprise" className="bg-surface text-text-primary">Enterprise</option>
  //                     <option value="Custom Tiers" className="bg-surface text-text-primary">Custom Tiers</option>
  //                   </select>
  //                 </div>
  //               </div>

  //               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  //                 <div>
  //                   <label className="block text-xs font-extrabold text-text-primary mb-1">
  //                     Base Price ($ / mo)
  //                   </label>
  //                   <input
  //                     type="number"
  //                     value={formData.basePrice}
  //                     onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
  //                     placeholder="e.g. 149"
  //                     className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm font-semibold text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
  //                   />
  //                 </div>

  //                 <div>
  //                   <label className="block text-xs font-extrabold text-text-primary mb-1">
  //                     Custom Price Label (Optional)
  //                   </label>
  //                   <input
  //                     type="text"
  //                     value={formData.customPriceText}
  //                     onChange={(e) => setFormData({ ...formData, customPriceText: e.target.value })}
  //                     placeholder="e.g. Contact Sales"
  //                     className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm font-semibold text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
  //                   />
  //                 </div>

  //                 <div>
  //                   <label className="block text-xs font-extrabold text-text-primary mb-1">
  //                     CTA Button Text
  //                   </label>
  //                   <input
  //                     type="text"
  //                     value={formData.buttonText}
  //                     onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
  //                     placeholder="e.g. CHECKOUT PROFESSIONAL"
  //                     className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm font-semibold text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
  //                   />
  //                 </div>
  //               </div>

  //               <div>
  //                 <label className="block text-xs font-extrabold text-text-primary mb-1">
  //                   Plan Description
  //                 </label>
  //                 <textarea
  //                   rows={2}
  //                   value={formData.description}
  //                   onChange={(e) => setFormData({ ...formData, description: e.target.value })}
  //                   placeholder="Short description explaining who this plan is built for..."
  //                   className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm font-semibold text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
  //                 />
  //               </div>

  //               <div>
  //                 <label className="block text-xs font-extrabold text-text-primary mb-1">
  //                   Feature Checklist (One feature per line)
  //                 </label>
  //                 <textarea
  //                   rows={5}
  //                   value={formData.features}
  //                   onChange={(e) => setFormData({ ...formData, features: e.target.value })}
  //                   placeholder="Up to 100 users&#10;5 countries&#10;Advanced analytics&#10;Priority support"
  //                   className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-sm font-semibold text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
  //                 />
  //               </div>

  //               <div className="flex items-center gap-6 pt-2">
  //                 <label className="flex items-center gap-2 text-xs font-bold text-text-primary cursor-pointer">
  //                   <input
  //                     type="checkbox"
  //                     checked={formData.isBestSeller}
  //                     onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
  //                     className="w-4 h-4 rounded text-solar focus:ring-solar"
  //                   />
  //                   <span>⭐ Highlight as Most Popular Choice</span>
  //                 </label>

  //                 <label className="flex items-center gap-2 text-xs font-bold text-text-primary cursor-pointer">
  //                   <input
  //                     type="checkbox"
  //                     checked={formData.isPremium}
  //                     onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
  //                     className="w-4 h-4 rounded text-primary focus:ring-primary"
  //                   />
  //                   <span>Sparkles Enterprise Tier Badge</span>
  //                 </label>
  //               </div>

  //               <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
  //                 <button
  //                   type="button"
  //                   onClick={() => setIsModalOpen(false)}
  //                   className="px-5 py-2.5 rounded-xl font-bold text-xs text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer"
  //                 >
  //                   Cancel
  //                 </button>
  //                 <button
  //                   type="submit"
  //                   className="px-6 py-2.5 bg-solar hover:bg-solar-600 text-black font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
  //                 >
  //                   {editingPlan ? "Update Plan" : "Create Plan"}
  //                 </button>
  //               </div>
  //             </form>
  //           </motion.div>
  //         </div>
  //       )}
  //     </AnimatePresence>
  //   </div>
  // );
}
