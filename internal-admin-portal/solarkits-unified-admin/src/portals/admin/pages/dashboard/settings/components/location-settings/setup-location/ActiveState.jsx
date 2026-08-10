import { useEffect, useState } from "react";
import axios from "axios";
import { authHeaderObj } from "@/app/authHeader";
import {
  FaMapMarkerAlt,
  FaLayerGroup,
  FaDrawPolygon,
  FaSpinner,
  FaCheckCircle,
  FaPlus,
  FaChartLine,
  FaMap,
  FaGlobeAmericas,
  FaBan,
  FaClock
} from "react-icons/fa";
import DropdownWithSearchInput from "@/components/DropdownWithSearchInput";
import SearchInputWithDropdown from "@/components/SearchInputWithDropdown";
import Dropdown from "@/components/Dropdown";
import ConfirmationPopup from "@/components/ConfirmationPopup";
import { useDispatch } from "react-redux";
import { setAlert } from "@/features/alert.slice";
import { useLocation, useNavigate } from "react-router-dom";
import ReactCountryFlag from "react-country-flag";
import Loader from "@/components/Loader";
import Button from "@/components/Button";
import IconButton from "@/components/IconButton";
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import RenderIfPermission, { useHasPermission } from "@/components/PermissionCheck";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";


export default function ActiveStates({ moduleUniqueId }) {
  const hasEditPermission = useHasPermission({ requiredUniqueId: moduleUniqueId, permission: "edit" });
  const [states, setStates] = useState([]);
  const [stateItem, setStateItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Confirmation Popup state
  const [confirmationPopup, setConfirmationPopup] = useState({
    isOpen: false,
    title: "",
    message: "",
    mode: "text",
    variant: "danger",
    onConfirm: null,
  });
  const [deactivateOTP, setDeactivateOTP] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const location = useLocation();
  const country = location.state?.country;

  useEffect(() => {
    if (!country) {
      navigate(location.pathname.replace("/active-states", ""));
      dispatch(
        setAlert({
          message: "Country not found. Redirected to country list.",
          type: "error",
        })
      );
    }
  }, [country, navigate, dispatch]);

  // ✅ Fetch all states for selected country
  useEffect(() => {
    if (!API_URL || !authHeaderObj()?.Authorization || !country?.id) return;
    let isMounted = true;

    const fetchStates = async () => {
      try {
        setLoading(true);
        const res = await axios.post(
          `${API_URL}/geolocation/states?unique_id=${moduleUniqueId}&req_for=view`,
          { country_id: country.id },
          { headers: { ...authHeaderObj() } }
        );

        if (!isMounted) return;

        const formatted = res.data.states.map((s) => ({
          text: s.name,
          value: s.id,
          ...s,
        }));

        setStates(formatted);
        setCurrentPage(1);
      } catch (err) {
        console.error("❌ Error fetching states:", err);
        setError("Failed to load states.");
        dispatch(setAlert({ message: "Failed to load states.", type: "error" }));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStates();
    return () => {
      isMounted = false;
    };
  }, [country?.id]);

  const refreshStates = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post(
        `${API_URL}/geolocation/states?unique_id=${moduleUniqueId}&req_for=view`,
        { country_id: country.id },
        { headers: { ...authHeaderObj() } }
      );
      const formatted = res.data.states.map((s) => ({
        text: s.name,
        value: s.id,
        ...s,
      }));
      setStates(formatted);
    } catch (err) {
      console.error("❌ Error refreshing states:", err);
      setError("Failed to reload states.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Activate selected state
  const handleActivate = async () => {
    if (!stateItem) {
      dispatch(setAlert({ message: "Please select a state first.", type: "error" }));
      return;
    }

    try {
      setActivating(true);

      const res = await axios.post(
        `${API_URL}/geolocation/activate-state?unique_id=${moduleUniqueId}&req_for=edit`,
        { state_id: stateItem },
        { headers: { ...authHeaderObj() } }
      );

      const updated = states.map((s) =>
        s.id === stateItem ? { ...s, is_active: true } : s
      );
      setStates(updated);

      dispatch(
        setAlert({
          message: res.data?.message || `${states.find(s => s.id === stateItem)?.name} activated successfully!`,
          type: "success",
        })
      );
    } catch (err) {
      console.error("❌ Activation failed:", err);
      dispatch(
        setAlert({
          message: err.response?.data?.message || "Failed to activate state.",
          type: "error",
        })
      );
    } finally {
      setActivating(false);
    }
  };

  const activeStates = states.filter((s) => s.is_active == true);
  const inactiveStates = states.filter((s) => !s.is_active);

  // Filter active states based on search query
  const filteredActiveStates = activeStates.filter(state =>
    state.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredActiveStates.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentActiveStates = filteredActiveStates.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        pageNumbers.push(currentPage - 1);
        pageNumbers.push(currentPage);
        pageNumbers.push(currentPage + 1);
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  // Items per page options for dropdown
  const itemsPerPageOptions = [
    { text: "4 per page", value: 4 },
    { text: "8 per page", value: 8 },
    { text: "12 per page", value: 12 },
    { text: "16 per page", value: 16 },
    { text: "20 per page", value: 20 },
  ];

  // ✅ Loading State
  if (loading) {
    return (
      <Loader text="Loading states..." />
    );
  }

  // ✅ Error UI
  if (error) {
    return (
      <div className="min-h-screen flex items-start justify-center">
        <div className="card border-danger p-8 text-center w-full">
          <div className="w-20 h-20 rounded-xl bg-linear-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-4">
            <FaGlobeAmericas className="text-white text-3xl" />
          </div>
          <h3 className="text-xl font-bold text-danger mb-2">Failed to load states</h3>
          <p className="text-text-secondary mb-4">{error}</p>
          <Button
            onClick={refreshStates}
            variant="danger"
            className="bg-linear-to-r from-red-500 to-red-600"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={country?.name || "Active States"}
        subtitle={`Manage states and geographical regions under ${country?.name || 'the selected country'}.`}
        icon={FaMapMarkerAlt}
        showBackButton={true}
        onBackClick={() => navigate(location.pathname.replace("/active-states", ""))}
        stats={[
          { label: "Total States", value: states.length, description: "In country" },
          { label: "Active", value: activeStates.length, description: "Managing" },
          { label: "Inactive", value: inactiveStates.length, description: "Available" }
        ]}
      />

      {/* ✅ Activation Section */}
      <RenderIfPermission 
        requiredUniqueId={moduleUniqueId}
        permission="edit"
        fallback={
          <div className="card p-8 text-center">
            <div className="w-20 h-20 rounded-xl bg-linear-to-br from-primary to-primary-end flex items-center justify-center mx-auto mb-4">
              <FaBan className="text-white text-3xl" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">Access Restricted</h3>
            <p className="text-text-secondary mb-4">You don't have permission to manage states.</p>
          </div>
        }
      >
        <div className="card hover:shadow-xl transition-all duration-300">
          <div className="p-5">
            {/* Last updated badge */}
            <div className="flex justify-end mb-4">
              <span className="text-xs bg-linear-120 from-primary/5 to-primary/15 text-text-secondary px-2 py-1 rounded-full flex items-center gap-1">
                <FaClock size={10} />
                Activate state
              </span>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-linear-to-br from-primary to-primary-end text-white">
                <FaPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary">Activate New State</h3>
                <p className="text-text-secondary text-sm">Select a state to activate and start managing districts</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Select State
                </label>

                {inactiveStates.length > 0 ? (
                  <DropdownWithSearchInput
                    value={stateItem}
                    onChange={setStateItem}
                    options={inactiveStates}
                    className="w-full"
                    placeholder="Choose a state to activate..."
                  />
                ) : (
                  <div className="p-3 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm">
                    All states are already active!
                  </div>
                )}
              </div>

              <div>
                {stateItem && !states.find(s => s.id === stateItem)?.is_active && (
                  <Button
                    onClick={handleActivate}
                    disabled={activating}
                    className="w-full bg-linear-to-r from-primary to-primary-end"
                    leftIcon={activating ? <FaSpinner className="animate-spin mr-2" /> : <FaCheckCircle className="mr-2" />}
                    loading={activating}
                  >
                    {activating ? 'Activating...' : 'Activate State'}
                  </Button>
                )}
                {stateItem && states.find(s => s.id === stateItem)?.is_active && (
                  <div className="w-full bg-green-50 text-green-700 py-3 px-6 rounded-xl text-center font-semibold flex items-center justify-center border border-green-200">
                    <FaCheckCircle className="mr-3" />
                    Already Active
                  </div>
                )}
              </div>
            </div>

            {stateItem && (
              <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/20">
                <div className="flex items-center gap-4">
                  <FaMapMarkerAlt className="text-primary text-2xl" />
                  <div>
                    <h4 className="font-semibold text-text-primary">{states.find(s => s.id === stateItem)?.name}</h4>
                    <p className="text-sm text-text-secondary">
                      {states.find(s => s.id === stateItem)?.is_active
                        ? "Active • Managing regions"
                        : "Ready to activate"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </RenderIfPermission>

      {/* ✅ Active States Grid */}
      <RenderIfPermission 
        requiredUniqueId={moduleUniqueId}
        permission="view"
      >
        <div className="card hover:shadow-xl transition-all duration-300">
          <div className="p-5">
            <div className="flex justify-end mb-4">
              <span className="text-xs bg-linear-120 from-primary/5 to-primary/15 text-text-secondary px-2 py-1 rounded-full flex items-center gap-1">
                <FaClock size={10} />
                Active states
              </span>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-linear-to-br from-green-500 to-green-600 text-white">
                  <FaChartLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary">Active States</h3>
                  <p className="text-text-secondary text-sm">Manage your active states and their regions</p>
                </div>
              </div>
              <div className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                {activeStates.length} {activeStates.length === 1 ? "State" : "States"} Active
              </div>
            </div>

            <div className="mb-6">
              <SearchInputWithDropdown
                options={currentActiveStates}
                value={null}
                inputValue={searchQuery}
                onInputChange={(val) => {
                  setSearchQuery(val);
                  setCurrentPage(1);
                }}
                onChange={(selectedValue) => {
                  const selected = states.find((s) => s.value === selectedValue);
                  setSearchQuery(selected?.name || "");
                  setCurrentPage(1);
                }}
                placeholder="Search active states by name..."
                className="w-full"
              />
              {searchQuery && (
                <p className="mt-2 text-sm text-text-secondary">
                  Found {filteredActiveStates.length} active states matching "{searchQuery}"
                </p>
              )}
            </div>
          </div>
        </div>

        {activeStates.length === 0 ? (
          <div className="card p-5">
            <div className="bg-primary/5 rounded-xl border-2 border-dashed border-primary/30 p-12 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <FaMapMarkerAlt className="text-primary text-3xl" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">No Active States</h3>
              <p className="text-text-secondary max-w-md mx-auto text-sm">
                Activate your first state to start managing districts, zones, and clusters.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Active States Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentActiveStates.map((state, index) => (
                <div
                  key={state.id || index}
                  className="card hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1 group"
                  onClick={() =>
                    navigate(
                      location.pathname.replace("/active-states", "/active-districts"),
                      {
                        state: {
                          state: {
                            id: state.id,
                            name: state.name,
                          },
                          country
                        },
                      }
                    )
                  }
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-linear-to-br from-primary to-primary-end flex items-center justify-center">
                          <FaMapMarkerAlt className="text-white text-lg" />
                        </div>
                        <div>
                          <h3 className="font-bold text-text-primary group-hover:text-primary transition-colors">
                            {state.name}
                          </h3>
                          <p className="text-xs text-text-secondary flex items-center mt-1">
                            <FaCheckCircle className="text-success mr-1 w-3 h-3" />
                            Active
                          </p>
                        </div>
                      </div>
                      <FiChevronRight className="text-text-secondary group-hover:text-primary transform group-hover:translate-x-1 transition-all" />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-primary/5 rounded-lg p-2 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <FaLayerGroup className="text-primary text-xs" />
                          <span className="text-[10px] font-semibold text-primary">Clusters</span>
                        </div>
                        <p className="text-lg font-bold text-text-primary">{state.active_clusters_count || 0}</p>
                      </div>
                      <div className="bg-primary/5 rounded-lg p-2 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <FaDrawPolygon className="text-primary text-xs" />
                          <span className="text-[10px] font-semibold text-primary">Zones</span>
                        </div>
                        <p className="text-lg font-bold text-text-primary">{state.active_zones_count || 0}</p>
                      </div>
                      <div className="bg-primary/5 rounded-lg p-2 text-center col-span-2">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <FaMap className="text-primary text-xs" />
                          <span className="text-[10px] font-semibold text-primary">Districts</span>
                        </div>
                        <p className="text-lg font-bold text-text-primary">{state.active_districts_count || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={filteredActiveStates.length}
                pageSize={itemsPerPage}
                className="mt-6 border-t border-border pt-4"
              />
            </div>
          </>
        )}
      </RenderIfPermission>

      {/* Confirmation Popup */}
      <ConfirmationPopup
        isOpen={confirmationPopup.isOpen}
        title={confirmationPopup.title}
        message={confirmationPopup.message}
        mode={confirmationPopup.mode}
        variant={confirmationPopup.variant}
        confirmText={confirmationPopup.confirmText}
        onConfirm={confirmationPopup.onConfirm}
        onCancel={() => setConfirmationPopup(prev => ({ ...prev, isOpen: false }))}
        isLoading={loading}
      />
    </div>
  );
}