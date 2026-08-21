import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import ReactCountryFlag from "react-country-flag";
import {
  FaBoxes,
  FaGlobe,
  FaMapMarkerAlt,
  FaWarehouse,
  FaClipboardList,
  FaEdit,
  FaSlidersH,
  FaBoxOpen
} from "react-icons/fa";
import { setAlert } from "@/features/alert.slice";
import Button from "@/components/Button";
import CustomTable from "@/components/CustomTable";
import Dropdown from "@/components/Dropdown";
import Loader from "@/components/Loader";
import { authHeaderObj } from "@/app/authHeader";

const API_URL = import.meta.env.VITE_API_URL;

export default function LooseOrders({ moduleUniqueId = "ADM_LOOSE_ORDERS" }) {
  const { countryName } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  // Geolocation & Core States
  const [activeCountries, setActiveCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [settings, setSettings] = useState([]);

  // Table & UI Loading State
  const [loading, setLoading] = useState(true);

  // Filters State
  const [stateFilter, setStateFilter] = useState("");
  const [clusterFilter, setClusterFilter] = useState("");

  // Fetch active countries & loose orders settings concurrently
  const fetchCountriesAndSettings = async () => {
    setLoading(true);
    try {
      const isIndiaUrl = (countryName || "india").toLowerCase() === "india" || (countryName || "").toLowerCase() === "in";
      const looseEndpoint = isIndiaUrl ? "india/loose-order-settings" : "loose-order-settings";

      // 1. Concurrently fetch active countries, warehouses, and loose settings
      const [countriesRes, warehousesRes, looseRes] = await Promise.all([
        axios.get(
          `${API_URL}/geolocation/active-countries?unique_id=${moduleUniqueId}&req_for=view`,
          { headers: authHeaderObj() }
        ),
        axios.get(
          `${API_URL}/warehouses?unique_id=${moduleUniqueId}&req_for=view`,
          { headers: authHeaderObj() }
        ),
        axios.get(`${API_URL}/solarshop/${looseEndpoint}?unique_id=${moduleUniqueId}&req_for=view`, { headers: authHeaderObj() }).catch(() => ({ data: { data: [] } }))
      ]);

      const activeCountriesList = countriesRes.data?.countries || [];
      setActiveCountries(activeCountriesList);

      // URL Country Parameter Redirect Logic
      if (activeCountriesList.length > 0) {
        const activeCountriesNames = activeCountriesList.map(c => c.name.toLowerCase());

        if (!countryName) {
          const storedCountry = localStorage.getItem('selected_country_solar-shop');
          const defaultCountry = (storedCountry && activeCountriesNames.includes(storedCountry.toLowerCase()))
            ? storedCountry.toLowerCase()
            : activeCountriesList[0].name.toLowerCase();

          navigate(`/admin-panel/solar-shop/${defaultCountry}/loose-orders`, { replace: true });
          return;
        } else {
          const matchedCountry = activeCountriesList.find(c => c.name.toLowerCase() === countryName.toLowerCase());
          if (!matchedCountry) {
            const defaultCountry = activeCountriesList[0].name.toLowerCase();
            navigate(`/admin-panel/solar-shop/${defaultCountry}/loose-orders`, { replace: true });
            return;
          }
        }
      }

      const currentCountryObj = activeCountriesList.find(
        c => c.name.toLowerCase() === countryName?.toLowerCase()
      );

      const allWarehouses = warehousesRes.data?.warehouses || [];
      const countryWarehouses = currentCountryObj
        ? allWarehouses.filter(w => w.country_id === currentCountryObj.id)
        : allWarehouses;
      setWarehouses(countryWarehouses);

      const allSettings = looseRes.data?.data || [];
      setSettings(allSettings);

      // Non-blocking background fetch for states dropdown
      if (currentCountryObj) {
        axios.post(
          `${API_URL}/geolocation/active-states?unique_id=${moduleUniqueId}&req_for=view`,
          { country_id: currentCountryObj.id },
          { headers: authHeaderObj() }
        ).then(statesRes => {
          setStates(statesRes.data?.states || []);
        }).catch(err => console.error("Error fetching states:", err));
      }
    } catch (error) {
      console.error("Error fetching loose orders settings:", error);
      dispatch(setAlert({ type: "error", message: "Failed to load loose orders settings" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCountriesAndSettings();
      setStateFilter("");
      setClusterFilter("");
    }
  }, [moduleUniqueId, token, countryName]);

  // Find current country object
  const currentCountry = activeCountries.find(
    c => c.name.toLowerCase() === countryName?.toLowerCase()
  );

  // Fetch clusters for selected state filter
  useEffect(() => {
    const fetchClustersForFilter = async () => {
      if (!stateFilter) {
        setClusters([]);
        setClusterFilter("");
        return;
      }
      try {
        const res = await axios.get(
          `${API_URL}/geolocation/clusters/${stateFilter}?unique_id=${moduleUniqueId}&req_for=view`,
          { headers: authHeaderObj() }
        );
        setClusters(res.data?.clusters || []);
        setClusterFilter("");
      } catch (err) {
        console.error("Error fetching clusters:", err);
      }
    };
    if (token) {
      fetchClustersForFilter();
    }
  }, [stateFilter, token, moduleUniqueId]);

  // Filter warehouses based on page filter selections
  const displayWarehouses = warehouses.filter(w => {
    if (stateFilter && w.state_id !== stateFilter) return false;
    if (clusterFilter && (w.cluster_id || w.cluster) !== clusterFilter) return false;
    return true;
  });

  // Table row payload aggregator
  const tableData = displayWarehouses.map(w => {
    const warehouseSettings = settings.filter(s => (s.warehouse_id || s.warehouse?.id) === w.id);
    return {
      warehouse: w,
      settings: warehouseSettings,
      is_enabled: warehouseSettings.some(s => s.is_active !== false)
    };
  });

  // Route navigation helper
  const handleConfigureLooseOrders = (w) => {
    navigate(`/admin-panel/solar-shop/${countryName?.toLowerCase()}/loose-orders/${w.id}`);
  };

  // Metrics
  const configuredWarehouseIds = [...new Set(settings.map(s => s.warehouse_id?.toString()).filter(Boolean))];
  const configuredCount = warehouses.filter(w => configuredWarehouseIds.includes(w.id)).length;
  const pendingCount = Math.max(0, warehouses.length - configuredCount);

  // Table Headers
  const tableHeaders = [
    { key: "warehouse_code", label: "Warehouse" },
    { key: "address", label: "Address" },
    { key: "location", label: "State & Cluster" },
    { key: "status", label: "Loose Orders Status" },
    { key: "actions", label: "Actions", align: "right" }
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Header section with active country info */}
      <div className="relative rounded-2xl bg-linear-120 from-primary to-primary-end shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 mask-[linear-gradient(0deg,transparent,black)]"></div>
        <div className="relative px-6 py-8 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <FaBoxes className="text-white text-3xl" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white">
                  Loose Orders Management
                </h1>
                <p className="text-white/90 mt-1">
                  Configure and manage loose equipment, MOQ, component limits and retail unit settings warehouse-wise.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {currentCountry && (
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30 flex items-center gap-2">
                  <ReactCountryFlag
                    countryCode={currentCountry.iso2}
                    svg
                    className="w-5 h-5 rounded-sm object-cover"
                  />
                  <span className="text-white text-xs font-bold uppercase tracking-wider">
                    {currentCountry.name} Market
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <Loader text="Loading Loose Orders settings..." />
      ) : (
        <>
          {/* Active Country Context Detail Card */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="card p-6 border-l-4 border-l-primary shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Active Market</h3>
                  <h2 className="text-lg font-black text-text-primary mt-1">
                    {currentCountry ? currentCountry.name : "No Selection"}
                  </h2>
                </div>
                {currentCountry && (
                  <ReactCountryFlag
                    countryCode={currentCountry.iso2}
                    svg
                    style={{ width: "2em", height: "1.5em" }}
                    className="rounded shadow-sm"
                  />
                )}
              </div>
              <div className="space-y-1 text-xs text-text-secondary">
                <div className="flex justify-between">
                  <span>Region Dial Code:</span>
                  <span className="font-bold">{currentCountry?.phone_code || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Currency:</span>
                  <span className="font-bold">{currentCountry?.currency || "INR"}</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="card p-6 border-l-4 border-l-emerald-500 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Total Warehouses</h3>
                <h2 className="text-2xl font-black text-emerald-600 mt-2">{warehouses.length}</h2>
              </div>
              <p className="text-xs text-text-secondary mt-4">Registered facilities in this territory</p>
            </div>

            <div className="card p-6 border-l-4 border-l-blue-500 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Configured Hubs</h3>
                <h2 className="text-2xl font-black text-blue-600 mt-2">{configuredCount}</h2>
              </div>
              <p className="text-xs text-text-secondary mt-4">Active loose order configurations</p>
            </div>

            <div className="card p-6 border-l-4 border-l-amber-500 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Pending Setup</h3>
                <h2 className="text-2xl font-black text-amber-600 mt-2">{pendingCount}</h2>
              </div>
              <p className="text-xs text-text-secondary mt-4">Warehouses needing initial setup</p>
            </div>
          </div>

          {/* Filtering and Location Selection */}
          <div className="card p-5 border border-border shadow-xs">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <FaSlidersH className="text-primary" />
                <h3 className="font-bold text-text-primary text-sm">Territory Filters</h3>
              </div>

              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                <div className="w-full md:w-64">
                  <Dropdown
                    placeholder="Filter by State"
                    options={[
                      { value: "", text: "All States" },
                      ...states.map(s => ({ value: s.id, text: s.name }))
                    ]}
                    value={stateFilter}
                    onChange={(val) => {
                      setStateFilter(val);
                      setClusterFilter("");
                    }}
                  />
                </div>

                <div className="w-full md:w-64">
                  <Dropdown
                    placeholder="Filter by Cluster"
                    disabled={!stateFilter}
                    options={[
                      { value: "", text: "All Clusters" },
                      ...clusters.map(c => ({ value: c.id, text: c.name }))
                    ]}
                    value={clusterFilter}
                    onChange={(val) => setClusterFilter(val)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Warehouses Table */}
          <div className="card shadow-sm border border-border overflow-hidden">
            <CustomTable
              headers={tableHeaders}
              data={tableData}
              renderRow={(row) => (
                <tr key={row.warehouse.id} className="hover:bg-surface-hover/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <FaWarehouse size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-text-primary text-sm flex items-center gap-2">
                          {row.warehouse.warehouse_code || row.warehouse.name || "Main Warehouse"}
                          <span className="text-[10px] px-2 py-0.5 rounded-full uppercase bg-surface-hover font-bold border border-border">
                            {row.warehouse.warehouse_type || "Hub"}
                          </span>
                        </div>
                        <div className="text-xs text-text-muted mt-0.5">
                          ID: {row.warehouse.id?.slice(-8)}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="p-4 text-xs text-text-secondary max-w-xs truncate">
                    {row.warehouse.address || "N/A"}
                    {row.warehouse.pincode && <span className="block text-text-muted">PIN: {row.warehouse.pincode}</span>}
                  </td>

                  <td className="p-4">
                    <div className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                      <FaMapMarkerAlt className="text-primary text-[10px]" />
                      {row.warehouse.state_name || "N/A"}
                    </div>
                    <div className="text-[11px] text-text-muted mt-0.5">
                      Cluster: {row.warehouse.cluster_name || "General"}
                    </div>
                  </td>

                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      row.is_enabled
                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${row.is_enabled ? "bg-emerald-500" : "bg-amber-500"}`} />
                      {row.is_enabled ? "Configured & Active" : "Pending Setup"}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleConfigureLooseOrders(row.warehouse)}
                      className="text-xs font-bold gap-1.5 shadow-sm"
                    >
                      <FaEdit size={13} />
                      Configure Loose Orders
                    </Button>
                  </td>
                </tr>
              )}
            />
          </div>
        </>
      )}
    </div>
  );
}
