import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import ReactCountryFlag from "react-country-flag";
import {
  FaArrowLeft,
  FaWarehouse,
  FaMapMarkerAlt,
  FaSlidersH,
  FaPercent,
  FaLayerGroup,
  FaEdit
} from "react-icons/fa";
import { setAlert } from "@/features/alert.slice";
import Button from "@/components/Button";
import CustomInput from "@/components/CustomInput";
import Loader from "@/components/Loader";
import CustomTable from "@/components/CustomTable";
import Dialog from "@/components/Dialog";
import IconButton from "@/components/IconButton";
import { authHeaderObj } from "@/app/authHeader";

const API_URL = import.meta.env.VITE_API_URL;

export default function WarehouseMarginConfig({ moduleUniqueId }) {
  const { countryName, warehouseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  const [searchParams] = useSearchParams();
  const editKitId = searchParams.get("combo_kit_id");

  const urlKitIdRef = useRef(editKitId);
  const dialogOpenedRef = useRef(false);

  // Core Metadata States
  const [warehouse, setWarehouse] = useState(null);
  const [countryObj, setCountryObj] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingKitId, setSavingKitId] = useState(null);
  const [activeTab, setActiveTab] = useState("combokit");

  // Kits & Margins lists
  const [comboKits, setComboKits] = useState([]);
  const [customizeKits, setCustomizeKits] = useState([]);
  const [marginsInput, setMarginsInput] = useState({});

  // Dialog State
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    kit: null,
    showcase_margin: "",
    standard_margin: "",
    po_margin: "",
    gst_rate: ""
  });

  // 1. Fetch specific warehouse margin lists to synchronize input map
  const fetchMargins = async (isIndia) => {
    try {
      const marginEndpoint = isIndia ? "india/company-margins" : "company-margins";
      const marginRes = await axios.get(
        `${API_URL}/solarshop/${marginEndpoint}/warehouse/${warehouseId}?unique_id=${moduleUniqueId}&req_for=view`,
        { headers: authHeaderObj() }
      );
      const margins = marginRes.data?.data || [];
      const inputs = {};
      margins.forEach(m => {
        if (m.combo_kit_id) {
          inputs[m.combo_kit_id] = {
            showcase_margin: m.showcase_margin !== undefined ? m.showcase_margin : 0,
            standard_margin: m.standard_margin !== undefined ? m.standard_margin : 0,
            po_margin: m.po_discounted_margin !== undefined ? m.po_discounted_margin : 0,
            gst_rate: m.gst_rate !== undefined ? m.gst_rate : ""
          };
        }
      });
      setMarginsInput(prev => ({ ...prev, ...inputs }));
    } catch (e) {
      console.error("Error fetching margins map:", e);
    }
  };

  // 2. Fetch Warehouse, Country & Kits details
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch active countries
      const countriesRes = await axios.get(
        `${API_URL}/geolocation/active-countries?unique_id=${moduleUniqueId}&req_for=view`,
        { headers: authHeaderObj() }
      );
      const activeCountries = countriesRes.data?.countries || [];
      const foundCountry = activeCountries.find(
        c => c.name.toLowerCase() === countryName?.toLowerCase()
      );
      setCountryObj(foundCountry);

      // Fetch all warehouses to locate the selected warehouse details
      const warehousesRes = await axios.get(
        `${API_URL}/warehouses?unique_id=${moduleUniqueId}&req_for=view`,
        { headers: authHeaderObj() }
      );
      const allWarehouses = warehousesRes.data?.warehouses || [];
      const wh = allWarehouses.find(w => w.id === warehouseId);
      setWarehouse(wh);

      if (wh && foundCountry) {
        const isIndia = foundCountry.iso2?.toLowerCase() === "in";

        // Fetch Combo Kits (is_custom=false)
        const comboKitsRes = await axios.get(
          `${API_URL}/combo-kits${isIndia ? "/india" : ""}/get-kits?unique_id=${moduleUniqueId}&req_for=view&is_custom=false&country_id=${foundCountry.id}`,
          { headers: authHeaderObj() }
        );
        setComboKits(comboKitsRes.data?.data || []);

        // Fetch Customize Kits (is_custom=true)
        const customizeKitsRes = await axios.get(
          `${API_URL}/combo-kits${isIndia ? "/india" : ""}/get-kits?unique_id=${moduleUniqueId}&req_for=view&is_custom=true&country_id=${foundCountry.id}`,
          { headers: authHeaderObj() }
        );
        setCustomizeKits(customizeKitsRes.data?.data || []);

        // Fetch saved margins map
        await fetchMargins(isIndia);
      }
    } catch (error) {
      console.error("Error loading margin configuration data:", error);
      dispatch(setAlert({ type: "error", message: "Failed to load warehouse margins data" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (moduleUniqueId && token && warehouseId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleUniqueId, token, warehouseId, countryName]);

  // Open Edit popup dialog
  const handleOpenEditDialog = (row) => {
    const entry = marginsInput[row.id] || { showcase_margin: 0, standard_margin: 0, po_margin: 0, gst_rate: "" };
    setDialogState({
      isOpen: true,
      kit: row,
      showcase_margin: entry.showcase_margin,
      standard_margin: entry.standard_margin,
      po_margin: entry.po_margin,
      gst_rate: entry.gst_rate
    });
  };

  useEffect(() => {
    if (!urlKitIdRef.current) return;
    if (dialogOpenedRef.current) return;
    if (loading) return;
    if (comboKits.length === 0 && customizeKits.length === 0) return;

    let foundKit = comboKits.find((k) => (k.id || k._id) === urlKitIdRef.current);
    let tab = "combokit";

    if (!foundKit) {
      foundKit = customizeKits.find((k) => (k.id || k._id) === urlKitIdRef.current);
      tab = "customizekit";
    }

    if (foundKit) {
      setActiveTab(tab);
      handleOpenEditDialog(foundKit);
      dialogOpenedRef.current = true;
    }
  }, [loading, comboKits, customizeKits, marginsInput]);

  // 3. Save Margin handler on a per-kit basis
  const handleSaveMargin = async (e) => {
    if (e) e.preventDefault();
    if (!warehouse || !countryObj || !dialogState.kit) return;

    const kitId = dialogState.kit.id;
    const displayVal = dialogState.showcase_margin !== "" ? Number(dialogState.showcase_margin) : 0;
    const standardVal = dialogState.standard_margin !== "" ? Number(dialogState.standard_margin) : 0;
    const poVal = dialogState.po_margin !== "" ? Number(dialogState.po_margin) : 0;
    const gstVal = dialogState.gst_rate !== "" ? Number(dialogState.gst_rate) : null;

    if (displayVal < 0 || standardVal < 0 || poVal < 0) {
      dispatch(setAlert({ type: "warning", message: "Margin percentages must be 0 or a positive number" }));
      return;
    }

    if (standardVal > displayVal) {
      dispatch(setAlert({ type: "warning", message: "Standard Sales Margin cannot exceed Display Margin" }));
      return;
    }

    if (poVal > displayVal) {
      dispatch(setAlert({ type: "warning", message: "PO Sales Margin cannot exceed Display Margin" }));
      return;
    }

    setSavingKitId(kitId);
    try {
      const isIndia = countryObj.iso2?.toLowerCase() === "in";
      const endpointBase = isIndia ? "india/company-margins" : "company-margins";

      const payload = {
        country_id: warehouse.country_id,
        state_id: warehouse.state_id,
        cluster_id: warehouse.cluster_id || warehouse.cluster,
        warehouse_id: warehouse.id,
        combo_kit_id: kitId,
        // API field names kept backward-compatible
        showcase_margin: displayVal,
        standard_margin: standardVal,
        po_discounted_margin: poVal,
        gst_rate: gstVal
      };

      const response = await axios.post(
        `${API_URL}/solarshop/${endpointBase}/save?unique_id=${moduleUniqueId}&req_for=add`,
        payload,
        { headers: authHeaderObj() }
      );

      if (response.data.status === "success") {
        dispatch(setAlert({ type: "success", message: "Margins saved successfully" }));
        setDialogState((prev) => ({ ...prev, isOpen: false }));
        await fetchMargins(isIndia);
      }
    } catch (error) {
      console.error("Error saving warehouse kit margin details:", error);
      dispatch(setAlert({
        type: "error",
        message: error.response?.data?.message || "Failed to save margin"
      }));
    } finally {
      setSavingKitId(null);
    }
  };

  if (loading) {
    return <Loader text="Loading configurations..." />;
  }

  if (!warehouse) {
    return (
      <div className="card p-12 text-center border-2 border-dashed border-border flex flex-col justify-center items-center gap-4">
        <FaWarehouse className="text-4xl text-text-muted opacity-30" />
        <h3 className="text-lg font-black text-text-primary">Warehouse Not Found</h3>
        <Button onClick={() => navigate(`/admin-panel/solar-shop/${countryName}/company-margin`)} variant="secondary" className="rounded-xl">
          Back to List
        </Button>
      </div>
    );
  }

  // Table Headers definition matching CustomTable expectations
  const tableHeaders = [
    {
      key: "name",
      accessor: "name",
      label: "Kit Name",
      render: (val) => (
        <span className="font-black text-xs text-text-primary uppercase tracking-wide">
          {val || "N/A"}
        </span>
      )
    },
    {
      key: "blueprint",
      accessor: "solar_kit_id",
      label: "Solar Kit Blueprint",
      render: (val) => (
        <span className="font-bold text-xs text-text-secondary uppercase">
          {val?.name || "N/A"}
        </span>
      )
    },
    {
      key: "capacity",
      accessor: "capacity",
      label: "Capacity",
      render: (val) => (
        <span className="font-semibold text-xs text-text-secondary">
          {val || 0} kW
        </span>
      )
    },
    {
      key: "showcase_margin",
      accessor: "id",
      label: "Display Margin",
      render: (val, row) => {
        const entry = marginsInput[row.id] || { showcase_margin: 0, standard_margin: 0, po_margin: 0, gst_rate: "" };
        return (
          <span className="font-bold text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-lg border border-primary/20">
            {Number(entry.showcase_margin).toFixed(2)}%
          </span>
        );
      }
    },
    {
      key: "standard_margin",
      accessor: "id",
      label: "Standard Sales Margin",
      render: (val, row) => {
        const entry = marginsInput[row.id] || { showcase_margin: 0, standard_margin: 0, po_margin: 0, gst_rate: "" };
        return (
          <span className="font-bold text-xs text-text-secondary bg-surface-hover px-2.5 py-1 rounded-lg border border-border/40">
            {Number(entry.standard_margin).toFixed(2)}%
          </span>
        );
      }
    },
    {
      key: "po_margin",
      accessor: "id",
      label: "PO Sales Margin",
      render: (val, row) => {
        const entry = marginsInput[row.id] || { showcase_margin: 0, standard_margin: 0, po_margin: 0, gst_rate: "" };
        return (
          <span className="font-bold text-xs text-text-secondary bg-surface-hover px-2.5 py-1 rounded-lg border border-border/40">
            {Number(entry.po_margin).toFixed(2)}%
          </span>
        );
      }
    },
    {
      key: "gst_rate",
      accessor: "id",
      label: "GST Rate",
      render: (val, row) => {
        const entry = marginsInput[row.id] || { showcase_margin: 0, standard_margin: 0, po_margin: 0, gst_rate: "" };
        const gstValue = entry.gst_rate;
        const hasGst = gstValue !== undefined && gstValue !== null && gstValue !== "";

        return (
          <span className={`font-bold text-xs px-2.5 py-1 rounded-lg border ${hasGst ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}`}>
            {hasGst ? `${Number(gstValue).toFixed(2)}%` : "Not set"}
          </span>
        );
      }
    },
    {
      key: "actions",
      accessor: "id",
      label: "Actions",
      align: "right",
      render: (val, row) => (
        <IconButton
          onClick={() => handleOpenEditDialog(row)}
          variant="primary"
          size="sm"
          tooltip="Configure Margins"
        >
          <FaEdit />
        </IconButton>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      {/* Header section with active country info & Back button with premium styling */}
      <div className="relative rounded-2xl bg-linear-120 from-primary to-primary-end shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 mask-[linear-gradient(0deg,transparent,black)]"></div>
        <div className="relative px-6 py-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate(`/admin-panel/solar-shop/${countryName}/company-margin`)}
                variant="secondary"
                className="w-10 h-10 p-0 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 border-white/20 text-white shadow-sm hover:scale-105 transition-transform shrink-0"
              >
                <FaArrowLeft />
              </Button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 text-white shrink-0">
                  <FaSlidersH className="text-2xl" />
                </div>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-white leading-tight">
                    Configure Warehouse Margins
                  </h1>
                  <p className="text-white/80 text-xs mt-0.5 font-bold">
                    Configure Display, Standard Sales, and PO Sales margin percentages on a per-kit basis.
                  </p>
                </div>
              </div>
            </div>

            {countryObj && (
              <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-2 flex items-center gap-2 shadow-sm shrink-0 w-fit">
                <ReactCountryFlag
                  countryCode={countryObj.iso2}
                  svg
                  className="w-5 h-5 rounded-sm object-cover"
                />
                <span className="text-white text-xs font-bold uppercase tracking-wider">
                  {countryObj.name} Market
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Warehouse Detail Header Card */}
      <div className="card p-6 border-l-4 border-l-primary shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <span className="font-bold block uppercase tracking-wider text-[9px] text-text-muted">Warehouse Code</span>
          <span className="font-black text-text-primary text-sm flex items-center gap-2 mt-1">
            <FaWarehouse className="text-primary opacity-60" size={14} />
            {warehouse.warehouse_code}
          </span>
        </div>
        <div className="md:col-span-2">
          <span className="font-bold block uppercase tracking-wider text-[9px] text-text-muted">Address</span>
          <span className="font-semibold text-text-secondary text-xs mt-1 block">
            {warehouse.address} (PIN: {warehouse.pincode || "N/A"})
          </span>
        </div>
        <div>
          <span className="font-bold block uppercase tracking-wider text-[9px] text-text-muted">State & Cluster</span>
          <span className="font-bold text-text-secondary text-xs flex flex-col gap-0.5 mt-1">
            <span className="flex items-center gap-1"><FaMapMarkerAlt className="text-primary/50 text-[10px]" /> {warehouse.state}</span>
            <span className="text-text-muted pl-3.5">Cluster: <strong>{warehouse.cluster || "N/A"}</strong></span>
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-surface rounded-2xl border-2 border-border/60 shadow-sm overflow-hidden flex flex-col">
        <div className="flex border-b border-border bg-surface-hover/30 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab("combokit")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-none outline-none cursor-pointer ${activeTab === "combokit"
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "text-text-secondary hover:bg-surface-hover"
              }`}
          >
            <FaLayerGroup size={14} />
            Combo kits
          </button>
          <button
            onClick={() => setActiveTab("customizekit")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-none outline-none cursor-pointer ${activeTab === "customizekit"
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "text-text-secondary hover:bg-surface-hover"
              }`}
          >
            <FaSlidersH size={14} />
            Customized kits
          </button>
        </div>

        {/* Tab Content Areas */}
        <div className="p-6">
          {activeTab === "combokit" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">Combo Kit Margins</h3>
                <p className="text-xs text-text-muted mt-1 font-bold">Configure Display, Standard Sales, and PO Sales margin percentages specifically applied to each Combo Kit definition.</p>
              </div>
              <div className="bg-surface rounded-2xl border border-border overflow-hidden">
                <CustomTable
                  headers={tableHeaders}
                  data={comboKits}
                  loading={loading}
                  emptyMessage="No configured combo kits found for this country context."
                />
              </div>
            </div>
          )}

          {activeTab === "customizekit" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">Customized Kit Margins</h3>
                <p className="text-xs text-text-muted mt-1 font-bold">Configure Display, Standard Sales, and PO Sales margin percentages specifically applied to each customized/custom kit combination.</p>
              </div>
              <div className="bg-surface rounded-2xl border border-border overflow-hidden">
                <CustomTable
                  headers={tableHeaders}
                  data={customizeKits}
                  loading={loading}
                  emptyMessage="No configured custom/customize kits found for this country context."
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configure Margins Popup Dialog */}
      <Dialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
        title="Configure Kit Margins"
        size="md"
      >
        {dialogState.kit && (
          <form onSubmit={handleSaveMargin} className="space-y-6 pt-2">
            {/* Kit Details Header (Read-Only) */}
            <div className="bg-surface-hover/50 p-4 border border-border rounded-xl space-y-2 animate-in fade-in zoom-in duration-300">
              <span className="font-bold block uppercase tracking-wider text-[9px] text-text-muted">Target Kit Details</span>
              <div className="flex flex-col gap-1">
                <span className="font-black text-text-primary text-sm uppercase">
                  {dialogState.kit.name}
                </span>
                <span className="text-xs text-text-secondary font-bold">
                  Blueprint: {dialogState.kit.solar_kit_id?.name || "N/A"} ({dialogState.kit.capacity || 0} kW)
                </span>
              </div>
            </div>

            {/* Display Margin */}
            <CustomInput
              label="Display Margin (%) *"
              type="number"
              min="0"
              step="0.01"
              value={dialogState.showcase_margin}
              onChange={(e) => setDialogState((prev) => ({ ...prev, showcase_margin: e.target.value }))}
              placeholder="0.00"
              prefix={<FaPercent className="text-text-muted text-[10px]" />}
            />

            {/* Standard Sales Margin */}
            <CustomInput
              label="Standard Sales Margin (%) *"
              type="number"
              min="0"
              step="0.01"
              value={dialogState.standard_margin}
              onChange={(e) => setDialogState((prev) => ({ ...prev, standard_margin: e.target.value }))}
              placeholder="0.00"
              prefix={<FaPercent className="text-text-muted text-[10px]" />}
            />

            {/* PO Sales Margin */}
            <CustomInput
              label="PO Sales Margin (%) *"
              type="number"
              min="0"
              step="0.01"
              value={dialogState.po_margin}
              onChange={(e) => setDialogState((prev) => ({ ...prev, po_margin: e.target.value }))}
              placeholder="0.00"
              prefix={<FaPercent className="text-text-muted text-[10px]" />}
            />

            {/* GST Rate */}
            <CustomInput
              label="GST Rate (%)"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={dialogState.gst_rate}
              onChange={(e) => setDialogState((prev) => ({ ...prev, gst_rate: e.target.value }))}
              placeholder="13.8"
              prefix={<FaPercent className="text-text-muted text-[10px]" />}
              helperText="Leave blank to use the default shop GST fallback."
            />

            <div className="flex gap-3 pt-6 border-t border-border">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={savingKitId !== null}
                className="flex-1 rounded-xl shadow-lg font-black uppercase tracking-widest text-xs"
              >
                Save Margins
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
