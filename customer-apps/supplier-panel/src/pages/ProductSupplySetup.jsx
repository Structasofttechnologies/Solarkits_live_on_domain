import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { FaLayerGroup, FaExclamationTriangle,  FaSave } from "react-icons/fa";
import Button from "../components/Button";
import MultiSelectDropdownWithSearchInput from "../components/MultiSelectDropdownWithSearchInput";
import DropdownWithSearchInput from "../components/DropdownWithSearchInput";
import { catalog_api } from "../features/supplier.api";
import { addAlert } from "../features/alert.slice";
import { motion } from "framer-motion";

export default function ProductSupplySetup() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const activeWarehouse = useSelector(state => state.auth_slice?.activeWarehouse);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [supplyType, setSupplyType] = useState(null);
  
  const [templates, setTemplates] = useState([]);
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  
  const [brands, setBrands] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);

  // Fetch templates for a given supply type
  const fetchTemplates = useCallback(async (type) => {
    if (!type) return;
    try {
      const res = await catalog_api.get_templates(type);
      if (res.data?.status === "success") {
        setTemplates(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load templates:", err);
      dispatch(addAlert({ type: "error", message: "Failed to load product templates." }));
    }
  }, [dispatch]);

  // Fetch brands for selected templates
  const fetchBrands = useCallback(async (templateIds) => {
    if (!templateIds || templateIds.length === 0) {
      setBrands([]);
      setSelectedBrands([]);
      return;
    }
    try {
      const res = await catalog_api.get_brands(templateIds.join(","));
      if (res.data?.status === "success") {
        const loadedBrands = res.data.data || [];
        setBrands(loadedBrands);
        // Clean up selected brands that are no longer available in the fetched brands list
        setSelectedBrands(prev => prev.filter(id => loadedBrands.some(b => b.id === id)));
      }
    } catch (err) {
      console.error("Failed to load brands:", err);
      dispatch(addAlert({ type: "error", message: "Failed to load brands mapped to selected templates." }));
    }
  }, [dispatch]);

  // Initial load of warehouse configuration
  useEffect(() => {
    if (!activeWarehouse?._id) return;
    
    const loadConfig = async () => {
      setLoading(true);
      try {
        const res = await catalog_api.get_supply_config(activeWarehouse._id);
        if (res.data?.status === "success") {
          const config = res.data.data || {};
          setSupplyType(config.supply_type);
          
          if (config.supply_type) {
            // First fetch templates for this type
            const tempRes = await catalog_api.get_templates(config.supply_type);
            if (tempRes.data?.status === "success") {
              setTemplates(tempRes.data.data || []);
              
              const savedTempIds = (config.supply_templates || []).map(t => t.id);
              setSelectedTemplates(savedTempIds);
              
              if (savedTempIds.length > 0) {
                // Fetch brands
                const brandRes = await catalog_api.get_brands(savedTempIds.join(","));
                if (brandRes.data?.status === "success") {
                  setBrands(brandRes.data.data || []);
                  setSelectedBrands((config.supply_brands || []).map(b => b.id));
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to load warehouse supply configuration:", err);
        dispatch(addAlert({ type: "error", message: "Failed to load supply config." }));
      } finally {
        setLoading(false);
      }
    };
    
    loadConfig();
  }, [activeWarehouse, dispatch]);

  const handleSupplyTypeChange = (type) => {
    setSupplyType(type);
    setSelectedTemplates([]);
    setSelectedBrands([]);
    setTemplates([]);
    setBrands([]);
    fetchTemplates(type);
  };

  const handleTemplatesChange = (newTemplates) => {
    setSelectedTemplates(newTemplates);
    fetchBrands(newTemplates);
  };

  const handleSave = async () => {
    if (!activeWarehouse?._id) return;
    if (!supplyType) {
      dispatch(addAlert({ type: "error", message: "Please select a product supply type." }));
      return;
    }
    if (selectedTemplates.length === 0) {
      dispatch(addAlert({ type: "error", message: "Please select at least one product template." }));
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        supply_type: supplyType,
        supply_templates: selectedTemplates,
        supply_brands: selectedBrands
      };
      
      const res = await catalog_api.update_supply_config(activeWarehouse._id, payload);
      if (res.data?.status === "success") {
        dispatch(addAlert({ type: "success", message: "Warehouse supply configuration saved successfully!" }));
      } else {
        dispatch(addAlert({ type: "error", message: res.data?.message || "Failed to save configuration." }));
      }
    } catch (err) {
      console.error("Failed to save supply configuration:", err);
      dispatch(addAlert({ type: "error", message: "Internal server error while saving." }));
    } finally {
      setSaving(false);
    }
  };

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
              You must select an approved fulfillment warehouse workspace before configuring product supply settings.
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

  const templateOptions = templates.map(t => ({ value: t.id, text: t.name }));
  const brandOptions = brands.map(b => ({
    value: b.id,
    text: (
      <div className="flex items-center gap-3">
        {b.logo && (
          <img 
            src={b.logo} 
            alt="" 
            className="w-5 h-5 rounded object-contain bg-surface border border-border shrink-0" 
          />
        )}
        <span className="font-bold">{b.name}</span>
      </div>
    )
  }));

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <PageHeader 
        title="Product Supply Setup" 
        subtitle={`Configure templates and brands supplied by the active warehouse workspace: ${activeWarehouse.name}`}
        icon={FaLayerGroup}
      />

      {loading ? (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-text-secondary text-sm font-bold uppercase tracking-widest">Loading Configuration...</p>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto card p-8 bg-surface border-border shadow-md space-y-8">
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <FaLayerGroup className="text-primary text-xl shrink-0" />
            <div>
              <h3 className="text-xs font-black text-text-primary uppercase tracking-widest">
                Product Supply Configuration
              </h3>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-tight mt-0.5">
                Configure templates and brands supplied by this warehouse
              </p>
            </div>
          </div>
          
          {/* 1. PRODUCT CLASSIFICATION SELECT DROPDOWN */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] block mb-1">
              Product Classification *
            </label>
            <DropdownWithSearchInput
              options={[
                { value: "", text: "Select Supply Classification" },
                { value: "Primary", text: "Primary (Solar Panel templates only)" },
                { value: "Other", text: "Other (Inverters, structures, auxiliary hardware, etc.)" },
                { value: "Both", text: "Both Supplies (All templates)" }
              ]}
              value={supplyType || ""}
              onChange={(val) => handleSupplyTypeChange(val || null)}
              placeholder="Select Supply Classification"
              className="w-full"
            />
          </div>

          {/* 2. SELECT PRODUCT TEMPLATES */}
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] block mb-1">
                Product Templates *
              </label>
              <p className="text-[10px] font-semibold text-text-muted">
                Select templates matching your catalog supply capabilities.
              </p>
            </div>
            <MultiSelectDropdownWithSearchInput 
              options={templateOptions}
              values={selectedTemplates}
              onChange={handleTemplatesChange}
              placeholder={supplyType ? "Search and select templates..." : "Select product classification first..."}
              searchPlaceholder="Filter templates..."
              disabled={!supplyType}
            />
          </div>

          {/* 3. SELECT BRANDS */}
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] block mb-1">
                Brand Manufacturer Catalog
              </label>
              <p className="text-[10px] font-semibold text-text-muted">
                Choose the brands you are authorized to supply for the selected templates.
              </p>
            </div>
            <MultiSelectDropdownWithSearchInput 
              options={brandOptions}
              values={selectedBrands}
              onChange={setSelectedBrands}
              placeholder={
                !supplyType 
                  ? "Select product classification first..."
                  : selectedTemplates.length === 0 
                    ? "Select templates first..." 
                    : brandOptions.length > 0 
                      ? "Search and select brands..." 
                      : "No brands available for selected templates"
              }
              searchPlaceholder="Filter brands..."
              disabled={!supplyType || selectedTemplates.length === 0 || brandOptions.length === 0}
            />
            {!supplyType || selectedTemplates.length === 0 ? null : brandOptions.length === 0 && (
              <div className="p-4 rounded-xl border border-border bg-surface-hover/10 text-xs font-semibold text-text-muted text-center">
                No brands registered under the selected templates.
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="pt-6 border-t border-border/50 flex justify-end">
            <Button 
              variant="primary" 
              onClick={handleSave} 
              disabled={saving || !supplyType || selectedTemplates.length === 0} 
              leftIcon={<FaSave />}
              className="uppercase tracking-widest text-xs font-black h-12 px-8 rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all"
            >
              {saving ? "Saving Changes..." : "Save Configuration"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
