import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import ReactCountryFlag from "react-country-flag";
import {
  FaFileInvoiceDollar,
  FaGlobe,
  FaMapMarkerAlt,
  FaWarehouse,
  FaClipboardList,
  FaEdit
} from "react-icons/fa";
import { setAlert } from "@/features/alert.slice";
import Button from "@/components/Button";
import CustomTable from "@/components/CustomTable";
import Dropdown from "@/components/Dropdown";
import Loader from "@/components/Loader";
import { authHeaderObj } from "@/app/authHeader";

const API_URL = import.meta.env.VITE_API_URL;

export default function PoOrders({ moduleUniqueId }) {
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

  // Fetch active countries & initial configurations
  const fetchCountriesAndSettings = async () => {
    setLoading(true);
    try {
      // 1. Fetch active countries
      const countriesRes = await axios.get(
        `${API_URL}/geolocation/active-countries?unique_id=${moduleUniqueId}&req_for=view`,
        { headers: authHeaderObj() }
      );
      
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

          navigate(`/admin-panel/solar-shop/${defaultCountry}/po-orders`, { replace: true });
          return;
        } else {
          const matchedCountry = activeCountriesList.find(c => c.name.toLowerCase() === countryName.toLowerCase());
          if (!matchedCountry) {
            const defaultCountry = activeCountriesList[0].name.toLowerCase();
            navigate(`/admin-panel/solar-shop/${defaultCountry}/po-orders`, { replace: true });
            return;
          }
        }
      }

      const currentCountryObj = activeCountriesList.find(
        c => c.name.toLowerCase() === countryName?.toLowerCase()
      );

      if (currentCountryObj) {
        // 2. Fetch states for active country
        const statesRes = await axios.post(
          `${API_URL}/geolocation/active-states?unique_id=${moduleUniqueId}&req_for=view`,
          { country_id: currentCountryObj.id },
          { headers: authHeaderObj() }
        );
        setStates(statesRes.data?.states || []);

        // 3. Fetch warehouses
        const warehousesRes = await axios.get(
          `${API_URL}/warehouses?unique_id=${moduleUniqueId}&req_for=view`,
          { headers: authHeaderObj() }
        );
        const allWarehouses = warehousesRes.data?.warehouses || [];
        // Filter warehouses locally by current country
        const countryWarehouses = allWarehouses.filter(
          w => w.country_id === currentCountryObj.id
        );
        setWarehouses(countryWarehouses);

        // 4. Fetch PO settings from both databases
        const [globalRes, indiaRes] = await Promise.all([
          axios.get(`${API_URL}/solarshop/po-settings?unique_id=${moduleUniqueId}&req_for=view`, { headers: authHeaderObj() }).catch(() => ({ data: { data: [] } })),
          axios.get(`${API_URL}/solarshop/india/po-settings?unique_id=${moduleUniqueId}&req_for=view`, { headers: authHeaderObj() }).catch(() => ({ data: { data: [] } }))
        ]);

        const allSettings = [...(globalRes.data?.data || []), ...(indiaRes.data?.data || [])];
        setSettings(allSettings);
      }
    } catch (error) {
      console.error("Error fetching PO settings data:", error);
      dispatch(setAlert({ type: "error", message: "Failed to load PO settings" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (moduleUniqueId && token) {
      fetchCountriesAndSettings();
      // Reset filters when country changes
      setStateFilter("");
      setClusterFilter("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const warehousePlans = settings.filter(s => (s.warehouse_id || s.warehouse?.id) === w.id);
    return {
      warehouse: w,
      plans: warehousePlans
    };
  });

  // Route navigation helper
  const handleConfigurePO = (w) => {
    navigate(`/admin-panel/solar-shop/${countryName?.toLowerCase()}/po-orders/${w.id}`);
  };

  // Metrics
  const configuredWarehouseIds = [...new Set(settings.map(s => s.warehouse_id?.toString()).filter(Boolean))];
  const configuredCount = warehouses.filter(w => configuredWarehouseIds.includes(w.id)).length;
  
  const activePlansCount = settings.filter(s => s.is_active).length;
  const pendingCount = Math.max(0, warehouses.length - configuredCount);

  // Table Headers
  const tableHeaders = [
    { key: "warehouse_code", label: "Warehouse" },
    { key: "address", label: "Address" },
    { key: "location", label: "State & Cluster" },
    { key: "plans_count", label: "Active Plans" },
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
                <FaFileInvoiceDollar className="text-white text-3xl" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white">
                  PO Settings Management
                </h1>
                <p className="text-white/90 mt-1">
                  Configure and manage Purchase Order limits and subscription plans warehouse-wise.
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
        <Loader text="Loading PO settings..." />
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
              <div className="h-px bg-border/40" />
              <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
                <FaGlobe className="text-primary opacity-50" />
                <span>Currency: <strong>{currentCountry?.currency_code || "USD"}</strong></span>
              </div>
            </div>

            {/* Configured Warehouses Metric */}
            <div className="card p-6 border-2 border-border shadow-sm flex items-center gap-5">
              <div className="p-4 bg-primary/10 rounded-2xl text-primary border border-primary/10">
                <FaWarehouse size={24} />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Configured Warehouses</h3>
                <h2 className="text-2xl font-black text-text-primary mt-1">
                  {configuredCount} / {warehouses.length}
                </h2>
                <p className="text-[10px] text-text-secondary font-bold mt-0.5">Setup warehouses list</p>
              </div>
            </div>

            {/* Total Plans Metric */}
            <div className="card p-6 border-2 border-border shadow-sm flex items-center gap-5">
              <div className="p-4 bg-success/10 rounded-2xl text-success border border-success/10">
                <FaClipboardList size={24} />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Active Plans</h3>
                <h2 className="text-2xl font-black text-text-primary mt-1">
                  {activePlansCount} Plans
                </h2>
                <p className="text-[10px] text-text-secondary font-bold mt-0.5">Overall subscription plans</p>
              </div>
            </div>

            {/* Pending Warehouses Metric */}
            <div className="card p-6 border-2 border-border shadow-sm flex items-center gap-5">
              <div className="p-4 bg-danger/10 rounded-2xl text-danger border border-danger/10">
                <FaWarehouse size={24} />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Pending Warehouses</h3>
                <h2 className="text-2xl font-black text-text-primary mt-1">
                  {pendingCount} Pending
                </h2>
                <p className="text-[10px] text-text-secondary font-bold mt-0.5">Warehouses without PO settings</p>
              </div>
            </div>
          </div>

          {/* Filtering Section */}
          <div className="bg-surface rounded-2xl border-2 border-border p-6 shadow-sm flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <Dropdown
                label="Filter by State"
                value={stateFilter}
                onChange={setStateFilter}
                placeholder="All States"
                options={states.map(s => ({ value: s.id, text: s.name }))}
              />
            </div>
            <div className="flex-1 w-full">
              <Dropdown
                label="Filter by Cluster"
                value={clusterFilter}
                onChange={setClusterFilter}
                placeholder={stateFilter ? "All Clusters" : "Select a state first..."}
                disabled={!stateFilter}
                options={clusters.map(c => ({ value: c.id, text: c.name }))}
              />
            </div>
            {(stateFilter || clusterFilter) && (
              <Button
                variant="secondary"
                onClick={() => {
                  setStateFilter("");
                  setClusterFilter("");
                }}
                className="mt-6 md:mt-0 rounded-xl"
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Warehouse PO Configurations Table */}
          <div className="bg-surface rounded-2xl border-2 border-border/60 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            <div className="px-6 py-4 bg-surface-hover/30 border-b border-border flex items-center justify-between">
              <h2 className="text-xs font-black text-text-primary flex items-center gap-3 uppercase tracking-[0.2em]">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary border border-primary/10 shadow-inner">
                  <FaWarehouse size={14} />
                </div>
                {currentCountry ? currentCountry.name : ""} Warehouses list
              </h2>
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest bg-surface-hover px-3 py-1.5 rounded-lg border border-border/40">
                {displayWarehouses.length} Warehouses Listed
              </span>
            </div>

            <div className="flex-1 p-6">
              <CustomTable
                headers={tableHeaders}
                data={tableData}
                loading={loading}
                emptyMessage="No warehouses identified matching filters."
                containerClassName="border-none shadow-none rounded-none bg-transparent"
                renderRow={({ warehouse, plans }) => {
                  return (
                    <>
                      <td className="px-6 py-4">
                        <div className="font-black text-text-primary tracking-tight text-sm flex items-center gap-2">
                          <FaWarehouse className="text-primary opacity-60 shrink-0" size={14} />
                          <span>{warehouse.warehouse_code || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-text-secondary text-xs truncate max-w-xs" title={warehouse.address}>
                          {warehouse.address || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-text-secondary text-xs flex flex-col gap-0.5">
                          <span className="flex items-center gap-1"><FaMapMarkerAlt className="text-primary/50 text-[10px]" /> {warehouse.state || "N/A"}</span>
                          <span className="text-text-muted pl-3.5">Cluster: <strong>{warehouse.cluster || "N/A"}</strong></span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          plans.length > 0 
                            ? "bg-success/10 text-success border border-success/20" 
                            : "bg-danger/10 text-danger border border-danger/20"
                        }`}>
                          {plans.length} Configured
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => handleConfigurePO(warehouse)}
                            size="sm"
                            leftIcon={<FaEdit />}
                            className="rounded-lg text-[10px] font-bold uppercase tracking-wider py-1.5"
                          >
                            Configure PO Settings
                          </Button>
                        </div>
                      </td>
                    </>
                  );
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
