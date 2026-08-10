import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { authHeaderObj } from "@/app/authHeader";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import MapLocationPicker from "@/components/MapLocationPicker";
import CustomInput from "@/components/CustomInput";
import DropdownWithSearchInput from "@/components/DropdownWithSearchInput";
import ReactCountryFlag from "react-country-flag";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";
import { setAlert } from "@/features/alert.slice";
import Button from "@/components/Button";
import {
  FiMapPin,
  FiSave,
  FiCheckCircle,
  FiAlertCircle,
  FiPackage,
  FiGlobe,
  FiMap,
  FiHome,
  FiNavigation2,
  FiClock,
  FiStar,
  FiGitBranch,
  FiInfo,
  FiLayers,
  FiChevronLeft
} from "react-icons/fi";
import RenderIfPermission, { useHasPermission } from "@/components/PermissionCheck";
import PageHeader from "@/components/PageHeader";


// -------------------------------------------------------
// Warehouse Type Card Component
// -------------------------------------------------------
function WarehouseTypeCard({ type, selected, onClick }) {
  const isMaster = type === "master";

  return (
    <button
      type="button"
      onClick={() => onClick(type)}
      className={`
        relative w-full text-left p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
        ${selected
          ? isMaster
            ? "border-amber-500 bg-linear-120 from-amber-500/15 to-amber-600/10 shadow-md"
            : "border-primary bg-linear-120 from-primary/15 to-primary/10 shadow-md"
          : "border-border bg-surface hover:border-primary/40 hover:bg-surface-hover"
        }
      `}
    >
      {/* Selected Indicator */}
      {selected && (
        <div className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center ${isMaster ? "bg-amber-500" : "bg-primary"}`}>
          <FiCheckCircle className="text-white w-3 h-3" />
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isMaster
            ? selected ? "bg-linear-120 from-amber-500 to-amber-600" : "bg-linear-120 from-amber-500/20 to-amber-600/10"
            : selected ? "bg-linear-120 from-primary to-primary-end" : "bg-linear-120 from-primary/20 to-primary/10"
        }`}>
          {isMaster
            ? <FiStar className={`w-5 h-5 ${selected ? "text-white" : "text-amber-500"}`} />
            : <FiGitBranch className={`w-5 h-5 ${selected ? "text-white" : "text-primary"}`} />
          }
        </div>

        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm mb-0.5 ${selected ? (isMaster ? "text-amber-600" : "text-primary") : "text-text-primary"}`}>
            {isMaster ? "Master Warehouse" : "Sub Warehouse"}
          </p>
          <p className="text-xs text-text-secondary leading-relaxed">
            {isMaster
              ? "Primary hub for the cluster. Only one allowed per cluster."
              : "Optional district facility. Serves alongside the cluster master."
            }
          </p>
        </div>
      </div>
    </button>
  );
}


export default function AddWarehouse({ moduleUniqueId }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { warehouseId } = useParams();
  useHasPermission({ requiredUniqueId: moduleUniqueId, permission: warehouseId ? "edit" : "add" });

  const API = import.meta.env.VITE_API_URL;

  const [data, setData] = useState({
    lat: "",
    lng: "",
    address: "",
    country: "",
    state: "",
    district: "",
    pincode: "",
    customers_types: [],
    warehouse_type: "",
    manager_name: "",
    manager_email: "",
    manager_phone: "",
    manager_phone_code: "+91"
  });
  const [loading, setLoading] = useState(false);
  const [customerTypeOptions, setCustomerTypeOptions] = useState([]);
  const [countries, setCountries] = useState([]);
  const [selectedCountryId, setSelectedCountryId] = useState(null);
  const [minPhoneLen, setMinPhoneLen] = useState(8);
  const [maxPhoneLen, setMaxPhoneLen] = useState(15);

  // Geographic filter lists and selected values
  const [countriesList, setCountriesList] = useState([]);
  const [statesList, setStatesList] = useState([]);
  const [clustersList, setClustersList] = useState([]);

  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCluster, setSelectedCluster] = useState(null);

  const [boundaries, setBoundaries] = useState([]);
  const [loadingBoundaries, setLoadingBoundaries] = useState(false);
  const [allWarehousesInCluster, setAllWarehousesInCluster] = useState([]);
  const [editModeClusterId, setEditModeClusterId] = useState(null);

  // Derived cluster info based on selected cluster and warehouses in cluster
  const hasMaster = allWarehousesInCluster.some(
    (w) => w.warehouse_type === "master" && w.id !== warehouseId
  );

  const hasDistrictWarehouse = data.district
    ? allWarehousesInCluster.some(
        (w) => w.district?.toLowerCase() === data.district.toLowerCase() && w.id !== warehouseId
      )
    : false;

  const clusterInfo = selectedCluster
    ? {
        name: selectedCluster.name,
        id: selectedCluster.id,
        hasMaster,
        hasDistrictWarehouse
      }
    : null;

  // -------------------------------------------------------
  // Fetch boundaries for all districts in the cluster
  // -------------------------------------------------------
  const fetchClusterBoundaries = useCallback(async (clusterObj) => {
    if (!clusterObj || !clusterObj.districts || !clusterObj.districts.length) {
      setBoundaries([]);
      return;
    }

    setLoadingBoundaries(true);
    try {
      const countryName = countriesList.find(c => c.value === selectedCountry)?.text.props.children[1];
      const stateName = statesList.find(s => s.value === selectedState)?.text;

      if (!countryName || !stateName) {
        setLoadingBoundaries(false);
        return;
      }

      const promises = clusterObj.districts.map(d =>
        axios.post(
          `${API}/geolocation/district?unique_id=${moduleUniqueId}&req_for=view`,
          {
            district: d.name,
            state: stateName,
            country: countryName,
          },
          { headers: { ...authHeaderObj() } }
        ).then(res => ({
          id: d.id,
          level: 'district',
          geometry: res.data.district?.geometry
        })).catch(err => {
          console.error(`Failed to fetch boundary for ${d.name}`, err);
          return null;
        })
      );

      const results = await Promise.all(promises);
      const validBoundaries = results.filter(b => b && b.geometry);
      setBoundaries(validBoundaries);
    } catch (err) {
      console.error("Failed to load cluster boundaries", err);
      dispatch(setAlert({ type: "error", message: "Failed to load cluster boundaries." }));
    } finally {
      setLoadingBoundaries(false);
    }
  }, [API, moduleUniqueId, countriesList, statesList, selectedCountry, selectedState, dispatch]);

  // -------------------------------------------------------
  // Fetch existing warehouses in the cluster
  // -------------------------------------------------------
  const fetchClusterWarehouses = useCallback(async (clusterId) => {
    if (!clusterId) {
      setAllWarehousesInCluster([]);
      return;
    }
    try {
      const res = await axios.get(`${API}/warehouses?unique_id=${moduleUniqueId}&req_for=view`, {
        headers: { ...authHeaderObj() },
      });
      const warehouses = res.data.warehouses || [];
      const clusterWarehouses = warehouses.filter(
        w => w.cluster_id && w.cluster_id.toString() === clusterId.toString()
      );
      setAllWarehousesInCluster(clusterWarehouses);
    } catch (err) {
      console.error("Failed to fetch warehouses in cluster", err);
    }
  }, [API, moduleUniqueId]);

  // -------------------------------------------------------
  // Load location filters and handle edits
  // -------------------------------------------------------
  useEffect(() => {
    const fetchActiveCountries = async () => {
      try {
        const res = await axios.get(
          `${API}/geolocation/active-countries?unique_id=${moduleUniqueId}&req_for=view`,
          { headers: { ...authHeaderObj() } }
        );
        const formatted = res.data.countries.map((c) => ({
          text: (
            <span className="flex items-center gap-2">
              <ReactCountryFlag countryCode={c.iso2} svg className="text-xl" />
              {c.name}
            </span>
          ),
          value: c.id,
          iso2: c.iso2,
        }));
        setCountriesList(formatted);
      } catch (err) {
        console.error("Error fetching active countries:", err);
      }
    };
    fetchActiveCountries();
  }, [API, moduleUniqueId]);

  useEffect(() => {
    setStatesList([]);
    setSelectedState("");
    setClustersList([]);
    setSelectedCluster(null);

    if (!selectedCountry) return;

    const fetchStates = async () => {
      try {
        const res = await axios.post(
          `${API}/geolocation/active-states?unique_id=${moduleUniqueId}&req_for=view`,
          { country_id: selectedCountry },
          { headers: { ...authHeaderObj() } }
        );
        const formatted = res.data.states.map(({ id, name }) => ({
          text: name,
          value: id
        }));
        setStatesList(formatted);
      } catch (err) {
        console.error("Error fetching states:", err);
      }
    };

    fetchStates();
  }, [selectedCountry, API, moduleUniqueId]);

  useEffect(() => {
    setClustersList([]);
    setSelectedCluster(null);

    if (!selectedState) return;

    const fetchClusters = async () => {
      try {
        const res = await axios.get(
          `${API}/geolocation/clusters/${selectedState}?unique_id=${moduleUniqueId}&req_for=view`,
          { headers: { ...authHeaderObj() } }
        );
        setClustersList(res.data.clusters || []);
      } catch (err) {
        console.error("Error fetching clusters:", err);
      }
    };

    fetchClusters();
  }, [selectedState, API, moduleUniqueId]);

  useEffect(() => {
    if (selectedCluster) {
      fetchClusterBoundaries(selectedCluster);
      fetchClusterWarehouses(selectedCluster.id);
    } else {
      setBoundaries([]);
      setAllWarehousesInCluster([]);
    }
  }, [selectedCluster, fetchClusterBoundaries, fetchClusterWarehouses]);

  // Resolve IDs from names when editing
  useEffect(() => {
    if (!warehouseId || countriesList.length === 0 || !data.country) return;
    const matched = countriesList.find(c => {
      const name = c.text?.props?.children?.[1] || c.text;
      return name?.toString().toLowerCase() === data.country.toLowerCase();
    });
    if (matched) {
      setSelectedCountry(matched.value);
    }
  }, [data.country, countriesList, warehouseId]);

  useEffect(() => {
    if (!warehouseId || statesList.length === 0 || !data.state) return;
    const matched = statesList.find(s => s.text?.toLowerCase() === data.state.toLowerCase());
    if (matched) {
      setSelectedState(matched.value);
    }
  }, [data.state, statesList, warehouseId]);

  useEffect(() => {
    if (!warehouseId || clustersList.length === 0 || !editModeClusterId) return;
    const matched = clustersList.find(c => c.id === editModeClusterId);
    if (matched) {
      setSelectedCluster(matched);
    }
  }, [editModeClusterId, clustersList, warehouseId]);

  // -------------------------------------------------------
  // Handle map selection
  // -------------------------------------------------------
  const handleMapSelect = (mapData) => {
    if (selectedCluster && mapData.district) {
      const isDistrictInCluster = selectedCluster.districts.some(
        d => d.name.toLowerCase() === mapData.district.toLowerCase()
      );
      if (!isDistrictInCluster) {
        dispatch(setAlert({
          type: "error",
          message: `The selected location is in '${mapData.district}' district, which is not part of the selected cluster '${selectedCluster.name}'!`,
          duration: 5000
        }));
        setData(prev => ({
          ...prev,
          lat: "",
          lng: "",
          address: "",
          country: "",
          state: "",
          district: "",
          pincode: ""
        }));
        return;
      }
    }

    setData((prev) => ({ ...prev, ...mapData }));
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= maxPhoneLen) {
      setData(prev => ({ ...prev, manager_phone: val }));
    }
  };

  const handleCountrySelect = (countryId) => {
    const selected = countries.find(c => c.id === countryId);
    if (selected) {
      setSelectedCountryId(selected.id);
      setData(prev => ({ 
        ...prev, 
        manager_phone_code: selected.phone_code,
        manager_phone: "" 
      }));
      setMinPhoneLen(selected.min_phone_length || 8);
      setMaxPhoneLen(selected.max_phone_length || 15);
    }
  };

  // -------------------------------------------------------
  // Handle Form Submit
  // -------------------------------------------------------
  const handleSubmit = async () => {
    if (!data.lat || !data.lng) {
      dispatch(setAlert({ type: "error", message: "Please select a location on the map!", duration: 4000 }));
      return;
    }
    if (data.customers_types.length === 0) {
      dispatch(setAlert({ type: "error", message: "Please select at least one customer type!", duration: 4000 }));
      return;
    }
    if (!data.warehouse_type) {
      dispatch(setAlert({ type: "error", message: "Please select a warehouse type (Master or Sub)!", duration: 4000 }));
      return;
    }

    setLoading(true);
    try {
      const url = warehouseId
        ? `${API}/warehouses/${warehouseId}?unique_id=${moduleUniqueId}&req_for=edit`
        : `${API}/warehouses/add-warehouse?unique_id=${moduleUniqueId}&req_for=add`;

      const method = warehouseId ? "put" : "post";
      const res = await axios({
        method,
        url,
        data,
        headers: { ...authHeaderObj() }
      });

      dispatch(setAlert({
        type: res.data.status || "success",
        message: res.data.message || (warehouseId ? "Warehouse updated successfully!" : "Warehouse added successfully!"),
        duration: 3000
      }));

      if (!warehouseId) {
        // Reset form only in add mode
        setData({
          lat: "", lng: "", address: "", country: "", state: "",
          district: "", pincode: "", customers_types: [], warehouse_type: "",
          manager_name: "", manager_email: "", manager_phone: "",
          manager_phone_code: "+91"
        });
        setSelectedCluster(null);
      }
    } catch (err) {
      dispatch(setAlert({
        type: "error",
        message: err.response?.data?.message || `Failed to ${warehouseId ? 'update' : 'add'} warehouse.`,
        duration: 5000
      }));
    }

    setLoading(false);
  };

  // -------------------------------------------------------
  // Load customer types
  // -------------------------------------------------------
  useEffect(() => {
    axios.get(`${API}/customers/customers-types?unique_id=${moduleUniqueId}&req_for=view`, {
      headers: { ...authHeaderObj() },
    })
      .then(res => {
        const opts = res.data.data.map(t => ({
          value: t.id,
          text: (
            <span className="flex items-center gap-2">
              <div className="w-6 h-6 bg-linear-120 from-primary to-primary-end rounded-full flex items-center justify-center">
                <FiPackage className="text-white w-3 h-3" />
              </div>
              {t.type_name}
            </span>
          ),
        }));
        setCustomerTypeOptions(opts);
      })
      .catch(err => console.log(err));
  }, []);

  // -------------------------------------------------------
  // Load active countries
  // -------------------------------------------------------
  useEffect(() => {
    axios.get(`${import.meta.env.VITE_AUTH_API_URL}/countries`, {
      headers: { ...authHeaderObj() },
    })
      .then(res => {
        const list = res.data.data || [];
        setCountries(list);
        if (!warehouseId) {
          const india = list.find(c => c.phone_code === "+91");
          if (india) {
            setSelectedCountryId(india.id);
            setData(prev => ({ ...prev, manager_phone_code: india.phone_code }));
            setMinPhoneLen(india.min_phone_length || 8);
            setMaxPhoneLen(india.max_phone_length || 15);
          } else if (list.length > 0) {
            setSelectedCountryId(list[0].id);
            setData(prev => ({ ...prev, manager_phone_code: list[0].phone_code }));
            setMinPhoneLen(list[0].min_phone_length || 8);
            setMaxPhoneLen(list[0].max_phone_length || 15);
          }
        }
      })
      .catch(err => console.log("Failed to fetch active countries:", err));
  }, [API, warehouseId]);

  // Sync selected country and lengths when countries or phone code changes
  useEffect(() => {
    if (countries.length > 0 && data.manager_phone_code) {
      const matched = countries.find(c => c.phone_code.trim() === data.manager_phone_code.trim());
      if (matched) {
        setSelectedCountryId(matched.id);
        setMinPhoneLen(matched.min_phone_length || 8);
        setMaxPhoneLen(matched.max_phone_length || 15);
      }
    }
  }, [countries, data.manager_phone_code]);

  // -------------------------------------------------------
  // Load existing warehouse data if in edit mode
  // -------------------------------------------------------
  useEffect(() => {
    if (!warehouseId) return;

    const loadWarehouseData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/warehouses/${warehouseId}?unique_id=${moduleUniqueId}&req_for=edit`, {
          headers: { ...authHeaderObj() }
        });
        const wh = res.data.warehouse;

        if (wh.status_id !== 1) {
          dispatch(setAlert({
            type: "error",
            message: "Warehouse details can only be edited when status is Pending Validation Setup.",
            duration: 5000
          }));
          navigate(-1);
          return;
        }

        setData({
          lat: wh.lat,
          lng: wh.lng,
          address: wh.address,
          country: wh.country,
          state: wh.state,
          district: wh.district,
          pincode: wh.pincode,
          customers_types: (wh.customer_types || []).map(t => typeof t === 'object' ? t.id : t),
          warehouse_type: wh.warehouse_type,
          manager_name: wh.manager ? wh.manager.name : "",
          manager_email: wh.manager ? wh.manager.email : "",
          manager_phone: wh.manager ? wh.manager.phone : "",
          manager_phone_code: wh.manager ? (wh.manager.phone_code || "+91") : "+91"
        });

        setEditModeClusterId(wh.cluster_id);
      } catch (err) {
        dispatch(setAlert({
          type: "error",
          message: err.response?.data?.message || "Failed to load warehouse details.",
          duration: 5000
        }));
        navigate(-1);
      }
      setLoading(false);
    };

    loadWarehouseData();
  }, [warehouseId, API, moduleUniqueId, navigate, dispatch]);

  // -------------------------------------------------------
  // Derived validation state
  // -------------------------------------------------------
  const isManagerValid = 
    (!data.manager_name?.trim() && !data.manager_email?.trim() && !data.manager_phone?.trim()) ||
    (data.manager_name?.trim() && 
     /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.manager_email?.trim() || "") && 
     (data.manager_phone?.trim() || "").length >= minPhoneLen &&
     (data.manager_phone?.trim() || "").length <= maxPhoneLen);

  const isSubmitReady =
    data.lat &&
    data.lng &&
    data.customers_types.length > 0 &&
    data.warehouse_type &&
    (data.warehouse_type !== "master" || !clusterInfo?.hasMaster) &&
    (data.warehouse_type !== "sub" || clusterInfo?.hasMaster) &&
    isManagerValid;

  return (
    <div className="space-y-6">
      <PageHeader
        title={warehouseId ? "Edit Warehouse Details" : "Register New Warehouse"}
        subtitle={warehouseId ? "Update coordinates and administrative properties of an existing facility." : "Establish a new logistical hub by pinpointing its exact location and defining its operational scope."}
        icon={FiHome}
        actions={
          <Button
            onClick={() => navigate(-1)}
            variant="secondary"
            leftIcon={<FiChevronLeft />}
            className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 active:scale-[0.98] h-[46px]"
          >
            Back to List
          </Button>
        }
        stats={[
          {
            label: "Location Status",
            value: data.lat && data.lng ? "Selected" : "Not Set",
            description: data.lat ? `${parseFloat(data.lat).toFixed(2)}, ${parseFloat(data.lng).toFixed(2)}` : "Select on map"
          },
          {
            label: "Warehouse Type",
            value: data.warehouse_type ? (data.warehouse_type === "master" ? "Master" : "Sub") : "Not Set",
            description: data.warehouse_type === "master" ? "Cluster primary hub" : data.warehouse_type === "sub" ? "District facility" : "Select type below"
          }
        ]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-6">
        {/* MAP SECTION */}
        <div className="xl:col-span-8">
          <div className="card shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col">
            <div className="p-6">
              {/* Last updated badge */}
              <div className="flex justify-end mb-4">
                <span className="text-xs bg-linear-120 from-primary/5 to-primary/15 text-text-secondary px-2 py-1 rounded-full flex items-center gap-1">
                  <FiClock size={10} />
                  Location Selection
                </span>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-linear-120 from-primary to-primary-end text-white">
                  <FiMap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary">Select Warehouse Location</h3>
                  <p className="text-text-secondary text-sm">Click on the map to pinpoint the exact location</p>
                </div>
              </div>              {/* Cluster Selection Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Country *</label>
                  <DropdownWithSearchInput
                    options={countriesList}
                    value={selectedCountry}
                    onChange={setSelectedCountry}
                    className="w-full"
                    placeholder="Select Country"
                    disabled={!!warehouseId}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">State *</label>
                  <DropdownWithSearchInput
                    options={statesList}
                    value={selectedState}
                    onChange={setSelectedState}
                    disabled={!selectedCountry || !!warehouseId}
                    placeholder="Select State"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Cluster *</label>
                  <DropdownWithSearchInput
                    options={clustersList.map(c => ({ text: c.name, value: c.id }))}
                    value={selectedCluster?.id || ""}
                    onChange={(val) => {
                      const matched = clustersList.find(c => c.id === val);
                      setSelectedCluster(matched || null);
                    }}
                    disabled={!selectedState || !!warehouseId}
                    placeholder="Select Cluster"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Location Status Banner */}
              {data.lat && data.lng ? (
                <div className="mb-4 p-4 bg-linear-120 from-green-500/10 to-green-600/10 rounded-xl border border-green-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-linear-120 from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                        <FiCheckCircle className="text-white w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">Location Selected</p>
                        <p className="text-sm text-text-secondary">Coordinates: {data.lat}, {data.lng}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setData(prev => ({ ...prev, lat: "", lng: "", address: "", country: "", state: "", district: "", pincode: "" }));
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:bg-danger/10"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              ) : selectedCluster ? (
                <div className="mb-4 p-4 bg-linear-120 from-amber-500/10 to-amber-600/10 rounded-xl border border-amber-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-linear-120 from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                      <FiAlertCircle className="text-white w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">Click on the map to select location</p>
                      <p className="text-sm text-text-secondary">Select the exact warehouse location inside the cluster boundary</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Cluster Context Banner */}
              {selectedCluster && (
                <div className="mb-4">
                  {loadingBoundaries ? (
                    <div className="p-3 bg-linear-120 from-primary/5 to-primary/10 rounded-xl border border-primary/20 flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-text-secondary">Loading cluster boundary data...</span>
                    </div>
                  ) : clusterInfo?.hasDistrictWarehouse ? (
                    /* District already occupied */
                    <div className="p-4 bg-linear-120 from-red-500/10 to-red-600/10 rounded-xl border border-red-500/30">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-linear-120 from-red-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FiAlertCircle className="text-white w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-red-600 text-sm">District Already Has a Warehouse</p>
                          <p className="text-xs text-text-secondary mt-0.5">
                            This district already has a warehouse registered. Each district is limited to one warehouse.
                            Please select a different location.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : clusterInfo?.name ? (
                    /* Cluster found, district is free */
                    <div className={`p-4 rounded-xl border ${
                      !clusterInfo.hasMaster
                        ? "bg-linear-120 from-amber-500/10 to-amber-600/10 border-amber-500/30"
                        : "bg-linear-120 from-primary/5 to-primary/10 border-primary/20"
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-linear-120 ${
                          !clusterInfo.hasMaster ? "from-amber-500 to-amber-600" : "from-primary to-primary-end"
                        }`}>
                          <FiLayers className="text-white w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-text-primary text-sm">
                              Cluster: <span className={!clusterInfo.hasMaster ? "text-amber-600" : "text-primary"}>{clusterInfo.name}</span>
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                              clusterInfo.hasMaster
                                ? "bg-green-500/10 text-green-600 border-green-500/20"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            }`}>
                              {clusterInfo.hasMaster ? "Master assigned" : "No master yet"}
                            </span>
                          </div>
                          {!clusterInfo.hasMaster && (
                            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                              <FiInfo className="w-3 h-3 flex-shrink-0" />
                              This cluster has no master warehouse yet. Consider registering this as a Master.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Map Container */}
            <div className="flex-1 p-5 pt-0">
              {loadingBoundaries ? (
                <div className="h-125 rounded-xl border border-border flex items-center justify-center bg-surface-hover">
                  <div className="text-center space-y-3">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-text-secondary text-sm">Loading boundaries and existing warehouses...</p>
                  </div>
                </div>
              ) : selectedCluster ? (
                <MapLocationPicker
                  lat={data.lat}
                  lng={data.lng}
                  visible={true}
                  mode="full"
                  onSelect={handleMapSelect}
                  boundaries={boundaries}
                  existingWarehouses={allWarehousesInCluster}
                  currentWarehouseId={warehouseId}
                  onLocationError={(msg) => {
                    dispatch(setAlert({ type: "error", message: msg, duration: 4000 }));
                  }}
                  className="h-125 rounded-xl overflow-hidden border border-border"
                />
              ) : (
                <div className="h-125 rounded-xl border border-border border-dashed flex items-center justify-center bg-surface-hover">
                  <p className="text-text-secondary text-sm">Please select a Cluster first to load the map and boundaries.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FORM SECTION */}
        <div className="xl:col-span-4">
          <div className="card shadow-sm hover:shadow-md transition-all duration-300 h-full">
            <div className="p-6">
              {/* Last updated badge */}
              <div className="flex justify-end mb-4">
                <span className="text-xs bg-linear-120 from-primary/5 to-primary/15 text-text-secondary px-2 py-1 rounded-full flex items-center gap-1">
                  <FiClock size={10} />
                  Warehouse Details
                </span>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-linear-120 from-green-500 to-green-600 text-white">
                  <FiPackage className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary">Warehouse Details</h3>
                  <p className="text-text-secondary text-sm">Fill in the warehouse information</p>
                </div>
              </div>

              <div className="space-y-6">

                {/* ── Warehouse Type Selector ── */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-text-primary flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 bg-linear-120 from-amber-500/20 to-amber-600/10 rounded flex items-center justify-center">
                      <FiStar className="text-amber-500 w-3 h-3" />
                    </div>
                    Warehouse Type *
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    <WarehouseTypeCard
                      type="master"
                      selected={data.warehouse_type === "master"}
                      onClick={(t) => setData(prev => ({ ...prev, warehouse_type: t }))}
                    />
                    <WarehouseTypeCard
                      type="sub"
                      selected={data.warehouse_type === "sub"}
                      onClick={(t) => setData(prev => ({ ...prev, warehouse_type: t }))}
                    />
                  </div>

                  {/* Master conflict warning */}
                  {data.warehouse_type === "master" && clusterInfo?.hasMaster && !clusterInfo?.hasDistrictWarehouse && (
                    <div className="flex items-start gap-2 p-3 bg-linear-120 from-red-500/10 to-red-600/10 rounded-lg border border-red-500/20">
                      <FiAlertCircle className="text-red-500 w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600">
                        This cluster already has a master warehouse. Selecting Master will be rejected by the server.
                        Please select <strong>Sub</strong> instead.
                      </p>
                    </div>
                  )}

                  {/* Sub conflict warning: must have master first */}
                  {data.warehouse_type === "sub" && !clusterInfo?.hasMaster && !clusterInfo?.hasDistrictWarehouse && (
                    <div className="flex items-start gap-2 p-3 bg-linear-120 from-red-500/10 to-red-600/10 rounded-lg border border-red-500/20">
                      <FiAlertCircle className="text-red-500 w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600">
                        This cluster does not have a master warehouse yet. You must register a <strong>Master</strong> warehouse before you can register a Sub warehouse.
                      </p>
                    </div>
                  )}
                </div>

                {/* ── Customer Type Selection ── */}
                <div className="bg-linear-120 from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
                  <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 bg-linear-120 from-primary to-primary-end rounded flex items-center justify-center">
                      <FiPackage className="text-white w-3 h-3" />
                    </div>
                    Customer Type *
                  </h3>

                  <MultiSelectDropdown
                    label="Select Customer Type"
                    values={data.customers_types}
                    onChange={(val) => setData((prev) => ({ ...prev, customers_types: val }))}
                    options={customerTypeOptions}
                    className="w-full"
                    placeholder="Select customer types..."
                  />

                  {data.customers_types.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs text-text-secondary mb-2">Selected types:</p>
                      <div className="flex flex-wrap gap-2">
                        {data.customers_types.map(typeId => {
                          const type = customerTypeOptions.find(opt => opt.value === typeId);
                          return (
                            <div
                              key={typeId}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-linear-120 from-primary/10 to-primary/5 text-primary border border-primary/20"
                            >
                              <FiCheckCircle className="w-3 h-3" />
                              {type?.text?.props?.children?.[1] || typeId}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Location Details ── */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-text-primary flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 bg-linear-120 from-primary/10 to-primary/5 rounded flex items-center justify-center">
                      <FiNavigation2 className="text-primary w-3 h-3" />
                    </div>
                    Location Details
                  </h3>

                  <div className="space-y-4">
                    <CustomInput
                      type="textarea"
                      label="Address"
                      value={data.address}
                      disabled
                      placeholder="Address will be auto-filled from map selection"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <CustomInput
                        label="District"
                        value={data.district}
                        disabled
                        placeholder="Select on map"
                      />
                      <CustomInput
                        label="State"
                        value={data.state}
                        disabled
                        placeholder="Select on map"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <CustomInput
                        label="Country"
                        value={data.country}
                        disabled
                        placeholder="Select on map"
                        leftIcon={<FiGlobe className="text-text-secondary" />}
                      />
                      <CustomInput
                        label="Postal Code"
                        value={data.pincode}
                        disabled
                        placeholder="Select on map"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Manager Details ── */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="font-semibold text-text-primary flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 bg-linear-120 from-primary/10 to-primary/5 rounded flex items-center justify-center">
                      <FiInfo className="text-primary w-3 h-3" />
                    </div>
                    Manager Details
                  </h3>

                  <div className="space-y-4">
                    <CustomInput
                      label="Manager Name"
                      value={data.manager_name || ""}
                      onChange={(e) => setData((prev) => ({ ...prev, manager_name: e.target.value }))}
                      placeholder="Enter manager's full name"
                    />

                    <CustomInput
                      label="Manager Email"
                      value={data.manager_email || ""}
                      onChange={(e) => setData((prev) => ({ ...prev, manager_email: e.target.value }))}
                      placeholder="Enter manager's email"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-1">
                        <DropdownWithSearchInput
                          label="Country Code"
                          options={countries.map(c => ({
                            value: c.id,
                            text: (
                              <span className="flex items-center gap-2 text-sm">
                                <ReactCountryFlag countryCode={c.iso2} svg className="w-5 h-5" />
                                {c.phone_code} ({c.iso2})
                              </span>
                            )
                          }))}
                          value={selectedCountryId}
                          onChange={handleCountrySelect}
                          placeholder="Select code"
                          className="w-full"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <CustomInput
                          label="Manager Phone"
                          value={data.manager_phone || ""}
                          onChange={handlePhoneChange}
                          placeholder={minPhoneLen ? `Phone number (${minPhoneLen}-${maxPhoneLen} digits)` : "Enter manager's phone number"}
                          prefix={data.manager_phone_code || "+91"}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Submit Section ── */}
                <div className="pt-4 border-t border-border">
                  <div className="space-y-4">
                    <RenderIfPermission
                      requiredUniqueId={moduleUniqueId}
                      permission={warehouseId ? "edit" : "add"}
                      fallback={null}
                    >
                      <Button
                        onClick={handleSubmit}
                        disabled={loading || !isSubmitReady || clusterInfo?.hasDistrictWarehouse}
                        variant="primary"
                        size="lg"
                        fullWidth
                        leftIcon={loading ? null : <FiSave />}
                        loading={loading}
                        className="bg-linear-120 from-primary to-primary-end shadow-lg hover:shadow-xl"
                      >
                        {loading
                          ? "Saving Warehouse..."
                          : warehouseId
                            ? "Update Warehouse"
                            : data.warehouse_type === "master"
                              ? "Save Master Warehouse"
                              : "Save Sub Warehouse"
                        }
                      </Button>
                    </RenderIfPermission>

                    {/* Validation Checklist */}
                    <div className="space-y-2">
                      {/* Location */}
                      {!data.lat || !data.lng ? (
                        <div className="flex items-center gap-2 text-sm text-amber-600">
                          <FiAlertCircle className="flex-shrink-0" />
                          <span>Select a location on the map</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <FiCheckCircle className="flex-shrink-0" />
                          <span>Location selected ✓</span>
                        </div>
                      )}

                      {/* Customer type */}
                      {data.customers_types.length === 0 ? (
                        <div className="flex items-center gap-2 text-sm text-amber-600">
                          <FiAlertCircle className="flex-shrink-0" />
                          <span>Select at least one customer type</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <FiCheckCircle className="flex-shrink-0" />
                          <span>{data.customers_types.length} customer type(s) selected ✓</span>
                        </div>
                      )}

                      {/* Warehouse type */}
                      {!data.warehouse_type ? (
                        <div className="flex items-center gap-2 text-sm text-amber-600">
                          <FiAlertCircle className="flex-shrink-0" />
                          <span>Select a warehouse type</span>
                        </div>
                      ) : data.warehouse_type === "sub" && !clusterInfo?.hasMaster ? (
                        <div className="flex items-center gap-2 text-sm text-amber-600">
                          <FiAlertCircle className="flex-shrink-0" />
                          <span>Must open Master warehouse first</span>
                        </div>
                      ) : data.warehouse_type === "master" && clusterInfo?.hasMaster ? (
                        <div className="flex items-center gap-2 text-sm text-amber-600">
                          <FiAlertCircle className="flex-shrink-0" />
                          <span>Cluster already has a Master warehouse</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <FiCheckCircle className="flex-shrink-0" />
                          <span>
                            {data.warehouse_type === "master" ? "Master" : "Sub"} warehouse selected ✓
                          </span>
                        </div>
                      )}

                      {/* Manager validation checklist */}
                      {data.manager_name || data.manager_email || data.manager_phone ? (
                        isManagerValid ? (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <FiCheckCircle className="flex-shrink-0" />
                            <span>Manager details valid ✓</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-amber-600">
                            <FiAlertCircle className="flex-shrink-0" />
                            <span>Ensure manager email is valid & phone is between {minPhoneLen} and {maxPhoneLen} digits</span>
                          </div>
                        )
                      ) : null}

                      {/* District conflict */}
                      {clusterInfo?.hasDistrictWarehouse && (
                        <div className="flex items-center gap-2 text-sm text-red-600">
                          <FiAlertCircle className="flex-shrink-0" />
                          <span>District already has a warehouse</span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-text-secondary text-center pt-2 border-t border-border">
                      Make sure all location details are correct before submitting
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}