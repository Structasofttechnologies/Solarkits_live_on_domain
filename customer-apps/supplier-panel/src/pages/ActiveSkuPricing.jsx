import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { 
  FaCoins, FaSearch, FaFilter, FaSave, FaExclamationTriangle, 
  FaUndo, FaChevronLeft, FaChevronRight, FaTimes, FaEdit, FaInfoCircle,
  FaBarcode, FaDatabase, FaIndustry, FaTag, FaLayerGroup, FaImage
} from "react-icons/fa";
import Button from "../components/Button";
import DropdownWithSearchInput from "../components/DropdownWithSearchInput";
import CustomInput from "../components/CustomInput";
import { catalog_api } from "../features/supplier.api";
import { addAlert } from "../features/alert.slice";
import { motion, AnimatePresence } from "framer-motion";
const buildApiUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
  return `${API_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

export default function ActiveSkuPricing() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const activeWarehouse = useSelector(state => state.auth_slice?.activeWarehouse);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Data lists
  const [skus, setSkus] = useState([]);
  const [prices, setPrices] = useState({}); // Local edited prices { [skuId]: number }
  const [originalPrices, setOriginalPrices] = useState({}); // Original prices for comparison
  
  // Warehouse Supply configuration
  const [supplyTemplates, setSupplyTemplates] = useState([]);
  const [supplyBrands, setSupplyBrands] = useState([]);
  
  // Filter Options (populated by backend response)
  const [subtypes, setSubtypes] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Filter values
  const [filterTemplate, setFilterTemplate] = useState("");
  const [filterSubtype, setFilterSubtype] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal States
  const [activeEditSku, setActiveEditSku] = useState(null);
  const [editPriceVal, setEditPriceVal] = useState("");
  const [activeInfoSku, setActiveInfoSku] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [activeInfoSku]);

  // 1. Initial Load: Fetch active warehouse's supply configuration (templates & brands)
  useEffect(() => {
    if (!activeWarehouse?._id) return;
    
    const loadSupplyConfig = async () => {
      setLoading(true);
      try {
        const res = await catalog_api.get_supply_config(activeWarehouse._id);
        if (res.data?.status === "success") {
          const config = res.data.data || {};
          setSupplyTemplates(config.supply_templates || []);
          setSupplyBrands(config.supply_brands || []);
        }
      } catch (err) {
        console.error("Failed to load supply config:", err);
        dispatch(addAlert({ type: "error", message: "Failed to load supply configuration." }));
      } finally {
        setLoading(false);
      }
    };
    
    loadSupplyConfig();
  }, [activeWarehouse, dispatch]);

  // 2. Fetch SKUs from backend based on filters
  const fetchSkus = useCallback(async () => {
    if (!activeWarehouse?._id) return;
    setLoading(true);
    try {
      const params = {};
      if (filterTemplate) params.template_id = filterTemplate;
      if (filterSubtype) params.subtype_id = filterSubtype;
      if (filterProduct) params.product_id = filterProduct;
      if (filterBrand) params.brand_id = filterBrand;
      if (searchQuery.trim() !== "") params.search = searchQuery.trim();
      
      const res = await catalog_api.get_skus(activeWarehouse._id, params);
      if (res.data?.status === "success") {
        const data = res.data.data || {};
        const loadedSkus = data.skus || [];
        setSkus(loadedSkus);
        setSubtypes(data.subtypes || []);
        setProducts(data.products || []);
        
        // Initialize price maps
        const newPrices = {};
        const original = {};
        loadedSkus.forEach(s => {
          const isSolar = (s.template_name || "").toLowerCase().includes("solar panel");
          const initPrice = isSolar ? s.price_per_watt : s.price;
          newPrices[s.id] = initPrice;
          original[s.id] = initPrice;
        });
        setPrices(newPrices);
        setOriginalPrices(original);
      }
    } catch (err) {
      console.error("Failed to load SKUs:", err);
      dispatch(addAlert({ type: "error", message: "Failed to load SKUs." }));
    } finally {
      setLoading(false);
    }
  }, [activeWarehouse, filterTemplate, filterSubtype, filterProduct, filterBrand, searchQuery, dispatch]);

  // Trigger fetch when warehouse or filters change
  useEffect(() => {
    fetchSkus();
    setCurrentPage(1); // Reset pagination on filter changes
  }, [activeWarehouse, filterTemplate, filterSubtype, filterProduct, filterBrand, searchQuery]);

  // 3. Handlers for filter selections (respecting hierarchy)
  const handleTemplateChange = (val) => {
    setFilterTemplate(val);
    setFilterSubtype("");
    setFilterProduct("");
  };

  const handleSubtypeChange = (val) => {
    setFilterSubtype(val);
    setFilterProduct("");
  };

  const handleProductChange = (val) => {
    setFilterProduct(val);
  };

  // 4. Handle inline price editing
  const handlePriceChange = (skuId, val) => {
    // Only accept numeric inputs (integers/decimals)
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      setPrices(prev => ({
        ...prev,
        [skuId]: val
      }));
    }
  };

  // Determine modified pricing list
  const modifiedPrices = useMemo(() => {
    const list = [];
    Object.keys(prices).forEach(skuId => {
      const current = Number(prices[skuId]) || 0;
      const original = Number(originalPrices[skuId]) || 0;
      if (current !== original) {
        list.push({ sku_id: skuId, price: current });
      }
    });
    return list;
  }, [prices, originalPrices]);

  const handleReset = () => {
    setPrices({ ...originalPrices });
  };

  const handleSavePrices = async () => {
    if (!activeWarehouse?._id) return;
    if (modifiedPrices.length === 0) return;
    
    setSaving(true);
    try {
      const res = await catalog_api.update_prices(activeWarehouse._id, modifiedPrices);
      if (res.data?.status === "success") {
        dispatch(addAlert({ type: "success", message: `Successfully updated ${modifiedPrices.length} prices!` }));
        // Refresh list
        await fetchSkus();
      } else {
        dispatch(addAlert({ type: "error", message: res.data?.message || "Failed to update prices." }));
      }
    } catch (err) {
      console.error("Failed to save SKU prices:", err);
      dispatch(addAlert({ type: "error", message: "Failed to save prices. Please try again." }));
    } finally {
      setSaving(false);
    }
  };

  // Pagination Calculations
  const totalPages = Math.ceil(skus.length / pageSize);
  const activePage = Math.min(Math.max(1, currentPage), totalPages || 1);
  const startIndex = (activePage - 1) * pageSize;
  const paginatedSkus = skus.slice(startIndex, startIndex + pageSize);

  if (!activeWarehouse?._id) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="card p-10 max-w-md bg-surface border-border text-center space-y-6 shadow-xl animate-in fade-in duration-500">
          <div className="w-20 h-20 bg-warning/10 text-warning border border-warning/20 rounded-3xl flex items-center justify-center text-3xl mx-auto shadow-inner">
            <FaExclamationTriangle />
          </div>
          <div>
            <h3 className="text-xl font-black text-text-primary uppercase tracking-wider">Active Workspace Required</h3>
            <p className="text-text-muted text-sm mt-3 font-semibold leading-relaxed">
              You must select an approved fulfillment warehouse workspace before configuring active SKU pricing.
            </p>
          </div>
          <Button 
            variant="primary" 
            fullWidth 
            onClick={() => navigate("/dashboard/select-warehouse")}
            className="uppercase tracking-widest text-xs font-black h-12 rounded-xl"
          >
            Select Warehouse Workspace
          </Button>
        </div>
      </div>
    );
  }

  // If supplier has no templates configured
  const hasNoConfig = supplyTemplates.length === 0;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <PageHeader 
        title="Active SKU & Pricing" 
        subtitle={`Set and manage supply pricing for SKUs configured under: ${activeWarehouse.name}`}
        icon={FaCoins}
        stats={[
          { label: "Active Warehouse", value: activeWarehouse.name, description: `Fulfillment Hub` },
          { label: "Total SKUs Listed", value: skus.length, description: "Matching active catalog" },
          { label: "Modified Prices", value: modifiedPrices.length, description: "Unsaved edits" }
        ]}
      />

      {hasNoConfig ? (
        <div className="card p-16 border-2 border-border border-dashed text-center flex flex-col items-center justify-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 text-primary border border-primary/20 rounded-3xl flex items-center justify-center text-3xl shadow-inner">
            <FaFilter />
          </div>
          <div>
            <h4 className="text-lg font-black text-text-primary uppercase tracking-wider">Supply Setup Required</h4>
            <p className="text-text-secondary text-xs max-w-sm mt-2 font-semibold leading-relaxed">
              Your warehouse has no product templates or brands configured yet. Please configure the supply catalogue first.
            </p>
          </div>
          <Button 
            variant="primary" 
            onClick={() => navigate("/dashboard/supply-setup")}
            className="uppercase tracking-widest text-xs font-black h-12 px-8 rounded-xl shadow-lg shadow-primary/20"
          >
            Setup Supply Catalogue
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* CASCADING FILTER BAR */}
          <div className="card p-6 bg-surface border-border shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <FaFilter className="w-4 h-4" />
              </div>
              <h3 className="font-black text-text-primary text-xs uppercase tracking-widest">
                Search & Filter SKU Catalog
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
              {/* 1. Template Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Template</label>
                <DropdownWithSearchInput 
                  options={[
                    { value: "", text: "All Supply Templates" },
                    ...supplyTemplates.map(t => ({ value: t.id, text: t.name }))
                  ]}
                  value={filterTemplate}
                  onChange={handleTemplateChange}
                  placeholder="Select Template"
                  className="w-full"
                />
              </div>

              {/* 2. Subtype Dropdown (Cascaded) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Subtype</label>
                <DropdownWithSearchInput 
                  options={[
                    { value: "", text: "All Subtypes" },
                    ...subtypes.map(s => ({ value: s.id, text: s.name }))
                  ]}
                  value={filterSubtype}
                  onChange={handleSubtypeChange}
                  placeholder={filterTemplate ? "Select Subtype" : "Select template first"}
                  disabled={!filterTemplate}
                  className="w-full"
                />
              </div>

              {/* 3. Product Dropdown (Cascaded) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Product</label>
                <DropdownWithSearchInput 
                  options={[
                    { value: "", text: "All Products" },
                    ...products.map(p => ({ value: p.id, text: p.name }))
                  ]}
                  value={filterProduct}
                  onChange={handleProductChange}
                  placeholder={filterSubtype ? "Select Product" : "Select subtype first"}
                  disabled={!filterSubtype}
                  className="w-full"
                />
              </div>

              {/* 4. Brand Dropdown (Independent) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Brand Filter</label>
                <DropdownWithSearchInput 
                  options={[
                    { value: "", text: "All Brands" },
                    ...supplyBrands.map(b => ({
                      value: b.id,
                      text: (
                        <div className="flex items-center gap-2">
                          {b.logo && <img src={b.logo} alt="" className="w-4 h-4 object-contain rounded" />}
                          <span>{b.name}</span>
                        </div>
                      )
                    }))
                  ]}
                  value={filterBrand}
                  onChange={setFilterBrand}
                  placeholder="Filter Brand"
                  className="w-full"
                />
              </div>

              {/* 5. Search Bar */}
              <div className="relative group">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1 mb-2 block">Search SKU</label>
                <div className="relative">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search sku code..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-11 pr-10 bg-surface border-2 border-border rounded-xl text-xs font-bold text-text-primary focus:border-primary outline-none transition-all placeholder:text-text-muted/40 shadow-sm"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* TABLE OF SKUs */}
          <div className="card bg-surface border-border overflow-hidden shadow-sm relative">
            <AnimatePresence>
              {loading && (
                <div className="absolute inset-0 bg-surface/50 backdrop-blur-[2px] z-10 flex items-center justify-center transition-all">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </AnimatePresence>

            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-hover/50 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-border/60">
                    <th className="px-6 py-4">SKU Identity</th>
                    <th className="px-6 py-4">Brand</th>
                    <th className="px-6 py-4">Template & Subtype</th>
                    <th className="px-6 py-4">Product Model</th>
                    <th className="px-6 py-4">Benchmark Price (₹)</th>
                    <th className="px-6 py-4 w-52 text-right">Supply Price (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {paginatedSkus.length > 0 ? (
                    paginatedSkus.map((sku) => {
                      const localVal = prices[sku.id];
                      const origVal = originalPrices[sku.id];
                      const isModified = localVal !== undefined && Number(localVal) !== Number(origVal);
                      
                      return (
                        <tr key={sku.id} className="hover:bg-surface-hover/10 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-text-primary uppercase tracking-wider block">
                                {sku.sku_code}
                              </span>
                              <button 
                                onClick={() => setActiveInfoSku(sku)}
                                className="text-primary hover:text-primary-hover p-1 rounded transition-colors text-sm"
                                title="View Details"
                              >
                                <FaInfoCircle />
                              </button>
                            </div>
                            <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-1 block">
                              ID: {sku.id.substring(sku.id.length - 8)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {sku.brand_logo ? (
                                <img src={sku.brand_logo} alt="" className="w-6 h-6 object-contain rounded bg-surface border border-border" />
                              ) : (
                                <div className="w-6 h-6 bg-surface-hover border border-border rounded flex items-center justify-center text-[9px] font-black text-text-muted">G</div>
                              )}
                              <span className="text-xs font-bold text-text-primary uppercase">{sku.brand_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-semibold text-text-secondary block">
                              {sku.template_name}
                            </span>
                            <span className="text-[10px] text-text-muted font-bold block mt-0.5">
                              {sku.subtype_name}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-text-primary">{sku.product_name}</span>
                          </td>
                          <td className="px-6 py-4 font-bold text-xs text-text-secondary">
                            {(sku.template_name || "").toLowerCase().includes("solar panel") ? (
                              <span>
                                ₹{Number(sku.benchmark_price_per_watt || 0).toFixed(2)}/W
                                <span className="text-[10px] text-text-secondary block font-bold mt-0.5">
                                  (₹{Number(sku.benchmark_price || 0).toLocaleString()}/pc)
                                </span>
                              </span>
                            ) : (
                              `₹${(sku.benchmark_price || 0).toLocaleString()}`
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3 font-mono">
                              <span className="text-xs font-black text-text-primary">
                                {localVal !== undefined && localVal !== "" && Number(localVal) !== 0 ? (
                                  (sku.template_name || "").toLowerCase().includes("solar panel") ? (
                                    <span className="text-right block">
                                      ₹{Number(localVal).toFixed(2)}/W
                                      <span className="text-[10px] text-text-secondary block font-bold mt-0.5">
                                        (₹{Number(Number(localVal) * (sku.capacity_w || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/pc)
                                      </span>
                                    </span>
                                  ) : (
                                    `₹${Number(localVal).toLocaleString()}`
                                  )
                                ) : (
                                  "Not Set"
                                )}
                              </span>
                              
                              <button 
                                onClick={() => {
                                  setActiveEditSku(sku);
                                  setEditPriceVal(localVal !== undefined ? String(localVal) : "");
                                }}
                                className="p-2 bg-surface-hover border border-border rounded-lg text-text-secondary hover:text-primary hover:border-primary/40 transition-colors"
                                title="Edit Price"
                              >
                                <FaEdit />
                              </button>

                              {isModified && (
                                <span 
                                  className="text-[9px] font-black uppercase tracking-wider text-warning bg-warning/10 border border-warning/20 px-2 py-1 rounded-lg shrink-0"
                                  title="Unsaved changes"
                                >
                                  Edited
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <p className="text-text-secondary text-sm font-semibold">
                          No SKUs found matching the selected filters.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border bg-surface-hover/20 flex items-center justify-between">
                <span className="text-xs font-bold text-text-muted">
                  Showing {startIndex + 1} to {Math.min(startIndex + pageSize, skus.length)} of {skus.length} SKUs
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={activePage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="p-2 border border-border rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                  >
                    <FaChevronLeft size={10} />
                  </button>
                  <span className="text-xs font-black text-text-primary px-3">
                    Page {activePage} of {totalPages}
                  </span>
                  <button 
                    disabled={activePage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="p-2 border border-border rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                  >
                    <FaChevronRight size={10} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* UNSAVED MODIFIED ACTION BAR */}
          <AnimatePresence>
            {modifiedPrices.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
              >
                <div className="bg-surface/90 border border-primary/20 backdrop-blur-md rounded-2xl p-4 shadow-2xl flex items-center justify-between border-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center text-lg shadow-inner">
                      <FaCoins />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">Unsaved Pricing Changes</h4>
                      <p className="text-[10px] text-text-muted font-bold uppercase mt-0.5">
                        {modifiedPrices.length} product variant(s) edited
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="link" 
                      onClick={handleReset}
                      leftIcon={<FaUndo />}
                      className="text-[10px] font-black uppercase text-text-muted hover:text-text-primary transition-colors"
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={handleSavePrices}
                      disabled={saving}
                      leftIcon={<FaSave />}
                      className="text-[10px] font-black uppercase tracking-wider h-10 px-5 rounded-xl shadow-lg shadow-primary/20"
                    >
                      {saving ? "Saving..." : "Save Prices"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* EDIT PRICE MODAL */}
          <AnimatePresence>
            {activeEditSku && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setActiveEditSku(null)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-md bg-surface border border-border rounded-3xl p-8 shadow-2xl z-10 space-y-6 animate-in fade-in duration-300"
                >
                  <div className="flex justify-between items-center border-b border-border/50 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">Set SKU Supply Price</h3>
                      <p className="text-[10px] text-text-muted font-bold uppercase mt-1">SKU: {activeEditSku.sku_code}</p>
                    </div>
                    <button 
                      onClick={() => setActiveEditSku(null)}
                      className="p-2 rounded-xl hover:bg-surface-hover transition-colors text-text-muted"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 p-4 bg-surface-hover/30 rounded-2xl border border-border/40 text-xs font-semibold text-text-secondary">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider font-bold text-text-muted block">
                          {(activeEditSku.template_name || "").toLowerCase().includes("solar panel") ? "Benchmark Price / W" : "Benchmark Price"}
                        </span>
                        <span className="text-sm font-black text-text-primary mt-1 block font-mono">
                          {(activeEditSku.template_name || "").toLowerCase().includes("solar panel") ? (
                            `₹${Number(activeEditSku.benchmark_price_per_watt || 0).toFixed(2)}/W`
                          ) : (
                            `₹${(activeEditSku.benchmark_price || 0).toLocaleString()}`
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider font-bold text-text-muted block">
                          {(activeEditSku.template_name || "").toLowerCase().includes("solar panel") ? "Current Price / W" : "Current Supply Price"}
                        </span>
                        <span className="text-sm font-black text-text-primary mt-1 block font-mono">
                          {prices[activeEditSku.id] !== undefined && prices[activeEditSku.id] !== "" && Number(prices[activeEditSku.id]) !== 0 ? (
                            (activeEditSku.template_name || "").toLowerCase().includes("solar panel") ? (
                              `₹${Number(prices[activeEditSku.id]).toFixed(2)}/W`
                            ) : (
                              `₹${Number(prices[activeEditSku.id]).toLocaleString()}`
                            )
                          ) : (
                            "Not Set"
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">
                        {(activeEditSku.template_name || "").toLowerCase().includes("solar panel") ? "New Supply Price (₹/W) *" : "New Supply Price (₹) *"}
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={editPriceVal}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || /^\d*\.?\d*$/.test(val)) {
                              setEditPriceVal(val);
                            }
                          }}
                          placeholder={(activeEditSku.template_name || "").toLowerCase().includes("solar panel") ? "Enter price per watt..." : "Enter price..."}
                          className="w-full h-12 pl-4 pr-10 bg-surface border-2 border-border rounded-xl text-sm font-bold text-text-primary focus:border-primary outline-none transition-all shadow-sm font-mono"
                        />
                        {(activeEditSku.template_name || "").toLowerCase().includes("solar panel") && (
                          <span className="absolute right-4 text-xs font-black text-text-muted">/W</span>
                        )}
                      </div>
                    </div>

                    {/* Solar preview capacity and calculated total price */}
                    {(activeEditSku.template_name || "").toLowerCase().includes("solar panel") && (
                      <div className="mt-2 flex justify-between text-xs text-text-secondary bg-surface-hover/20 p-3 rounded-xl border border-border/40 font-mono">
                        <span>Capacity:</span>
                        <span className="font-bold text-text-primary">{activeEditSku.capacity_w || 0} {activeEditSku.capacity_unit || 'W'}</span>
                        <span className="ml-2 border-l border-border/40 pl-2">Total Price:</span>
                        <span className="font-black text-primary">
                          ₹{Number((Number(editPriceVal) || 0) * (activeEditSku.capacity_w || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}

                    {/* REAL-TIME VALIDATION WARNING */}
                    {editPriceVal && Number(editPriceVal) > Number((activeEditSku.template_name || "").toLowerCase().includes("solar panel") ? activeEditSku.benchmark_price_per_watt : activeEditSku.benchmark_price) && (
                      <div className="p-4 rounded-2xl bg-warning/5 border border-warning/20 text-warning text-[11px] font-bold flex gap-3 items-start animate-in fade-in duration-300">
                        <FaExclamationTriangle className="shrink-0 mt-0.5 text-sm" />
                        <p className="leading-relaxed font-semibold">
                          your inventory not show when direct shop order
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-border/50">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setActiveEditSku(null)}
                      className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-xs border border-border"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => {
                        handlePriceChange(activeEditSku.id, editPriceVal);
                        setActiveEditSku(null);
                      }}
                      className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                    >
                      Apply Price
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* SKU DETAILS MODAL */}
          <AnimatePresence>
            {activeInfoSku && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setActiveInfoSku(null)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-2xl bg-surface border border-border rounded-3xl p-6 shadow-2xl z-10 max-h-[85vh] overflow-y-auto animate-in fade-in duration-300 space-y-6"
                >
                  <div className="flex justify-between items-start border-b border-border/50 pb-4">
                    <div>
                      <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">Product SKU Specification details</h3>
                      <p className="text-[10px] text-text-muted font-bold uppercase mt-1">Classification: {activeInfoSku.template_name} &gt; {activeInfoSku.subtype_name}</p>
                    </div>
                    <button 
                      onClick={() => setActiveInfoSku(null)}
                      className="p-2 rounded-xl hover:bg-surface-hover transition-colors text-text-muted"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Main Info Block */}
                    <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-linear-to-br from-primary/5 to-indigo-500/5 p-6 shadow-xs">
                      <div className="absolute -right-4 -top-4 opacity-5">
                        <FaBarcode size={120} className="rotate-12 text-primary" />
                      </div>

                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                              <FaTag className="h-2 w-2" /> SKU Code
                            </span>
                            <span className="font-mono text-xs font-black tracking-widest text-text-primary">
                              {activeInfoSku.sku_code}
                            </span>
                          </div>
                          <h3 className="text-lg font-black uppercase tracking-wide text-text-primary">
                            {activeInfoSku.product_name || "Enriched Product SKU"}
                          </h3>
                          {activeInfoSku.brand_name && (
                            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                              <FaIndustry className="h-3.5 w-3.5 text-text-muted" />
                              <span className="font-bold uppercase tracking-wider text-teal-700">
                                {activeInfoSku.brand_name}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-white shadow-xs flex items-center justify-center">
                          {activeInfoSku.image && !imageError ? (
                            <img
                              src={buildApiUrl(activeInfoSku.image)}
                              alt={activeInfoSku.product_name || "Product"}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                setImageError(true);
                              }}
                            />
                          ) : null}
                          {(!activeInfoSku.image || imageError) && (
                            <FaImage className="text-text-muted/40" size={32} />
                          )}
                        </div>
                      </div>

                      {activeInfoSku.product_description && (
                        <div className="mt-4 border-t border-border/40 pt-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Description</p>
                          <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                            {activeInfoSku.product_description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Features list if present */}
                    {activeInfoSku.product_features && activeInfoSku.product_features.length > 0 && (
                      <div className="space-y-3 rounded-2xl border border-border bg-surface p-5">
                        <div className="flex items-center gap-2 border-b border-border pb-2">
                          <FaLayerGroup className="text-indigo-600" size={14} />
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-text-primary">Key Highlights & Features</h4>
                        </div>
                        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          {activeInfoSku.product_features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-text-secondary">
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Technical attributes */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 border-b border-border pb-2">
                        <FaDatabase className="text-primary" size={14} />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-text-primary">Technical Specifications</h4>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {activeInfoSku.attributes && activeInfoSku.attributes.length > 0 ? (
                          activeInfoSku.attributes.map((attr, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between rounded-xl border border-border/60 bg-surface-hover/20 p-3 hover:bg-surface-hover/40 transition-colors"
                            >
                              <div className="space-y-0.5">
                                <p className="text-[8px] font-black uppercase tracking-widest text-text-muted">
                                  {attr.name}
                                </p>
                                <p className="text-xs font-black uppercase tracking-wider text-text-primary">
                                  {attr.value} {attr.unit}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 py-6 text-center text-xs italic text-text-muted">
                            No specifications defined for this SKU.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50 flex justify-end">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => setActiveInfoSku(null)}
                      className="w-32 h-12 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                    >
                      Close
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
