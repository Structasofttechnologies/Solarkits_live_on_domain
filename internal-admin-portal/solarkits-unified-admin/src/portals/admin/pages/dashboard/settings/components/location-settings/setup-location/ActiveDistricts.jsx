import { useEffect, useState } from "react";
import axios from "axios";
import { authHeaderObj } from "@/app/authHeader";
import {
  FaMapMarkerAlt,
  FaCheckCircle,
  FaPlus,
  FaSpinner,
  FaBuilding,
  FaHome,
  FaGlobeAmericas,
  FaBan,
  FaChartLine
} from "react-icons/fa";
import DropdownWithSearchInput from "@/components/DropdownWithSearchInput";
import SearchInputWithDropdown from "@/components/SearchInputWithDropdown";
import Dropdown from "@/components/Dropdown";
import ConfirmationPopup from "@/components/ConfirmationPopup";
import { useDispatch } from "react-redux";
import { setAlert } from "@/features/alert.slice";
import { useLocation, useNavigate } from "react-router-dom";
import Loader from "@/components/Loader";
import Button from "@/components/Button";
import {  FiChevronRight, FiClock } from "react-icons/fi";
import RenderIfPermission from "@/components/PermissionCheck";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";


export default function ActiveDistricts({ moduleUniqueId }) {
  const [districts, setDistricts] = useState([]);
  const [districtItem, setDistrictItem] = useState(null);
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

  // Get state & country from route state
  const location = useLocation();
  const stateData = location.state?.state;
  const country = location.state?.country;

  // Redirect if missing
  useEffect(() => {
    if (!stateData || !country) {
      navigate(location.pathname.replace("/active-districts", ""));
      dispatch(
        setAlert({
          message: "Missing state or country. Redirected to setup location.",
          type: "error",
        })
      );
    }
  }, [stateData, country, navigate, dispatch]);

  // Fetch districts for state
  useEffect(() => {
    if (!API_URL || !stateData?.id) return;
    let isMounted = true;

    const fetchDistricts = async () => {
      try {
        setLoading(true);
        const res = await axios.post(
          `${API_URL}/geolocation/districts?unique_id=${moduleUniqueId}&req_for=view`,
          { state_id: stateData.id },
          { headers: { ...authHeaderObj() } }
        );

        if (!isMounted) return;

        const formatted = res.data.districts.map((d) => ({
          text: d.name,
          value: d.id,
          ...d,
        }));

        setDistricts(formatted);
        setCurrentPage(1);
      } catch (err) {
        console.error("❌ Error fetching districts:", err);
        setError("Failed to load districts.");
        dispatch(setAlert({ message: "Failed to load districts.", type: "error" }));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDistricts();
    return () => {
      isMounted = false;
    };
  }, [stateData?.id]);

  // Refresh districts
  const refreshDistricts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post(
        `${API_URL}/geolocation/districts?unique_id=${moduleUniqueId}&req_for=view`,
        { state_id: stateData.id },
        { headers: { ...authHeaderObj() } }
      );

      const formatted = res.data.districts.map((d) => ({
        text: d.name,
        value: d.id,
        ...d,
      }));

      setDistricts(formatted);
    } catch (err) {
      console.error("❌ Error refreshing districts:", err);
      setError("Failed to reload districts.");
    } finally {
      setLoading(false);
    }
  };

  // Activate selected district
  const handleActivate = async () => {
    if (!districtItem) {
      dispatch(setAlert({ message: "Please select a district first.", type: "error" }));
      return;
    }

    try {
      setActivating(true);

      const districtId = districtItem.id ?? districtItem.value ?? districtItem;

      const res = await axios.post(
        `${API_URL}/geolocation/activate-district?unique_id=${moduleUniqueId}&req_for=edit`,
        { district_id: districtId },
        { headers: { ...authHeaderObj() } }
      );

      const updated = districts.map((d) =>
        d.id === districtId ? { ...d, is_active: true } : d
      );
      setDistricts(updated);

      dispatch(
        setAlert({
          message: res.data?.message || `${districts.find(d => d.id === districtId)?.name} activated successfully!`,
          type: "success",
        })
      );
    } catch (err) {
      console.error("❌ Activation failed:", err);
      dispatch(
        setAlert({
          message: err.response?.data?.message || "Failed to activate district.",
          type: "error",
        })
      );
    } finally {
      setActivating(false);
    }
  };

  const activeDistricts = districts.filter((d) => d.is_active == true);
  const inactiveDistricts = districts.filter((d) => !d.is_active);

  // Filter active districts based on search query
  const filteredActiveDistricts = activeDistricts.filter(district =>
    district.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredActiveDistricts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentActiveDistricts = filteredActiveDistricts.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  // Items per page options for dropdown
  const itemsPerPageOptions = [
    { text: "4 per page", value: 4 },
    { text: "8 per page", value: 8 },
    { text: "12 per page", value: 12 },
    { text: "16 per page", value: 16 },
    { text: "20 per page", value: 20 },
  ];

  if (loading) {
    return (
      <Loader text="Loading districts..." />
    );
  }

  // Error UI
  if (error) {
    return (
      <div className="min-h-screen flex items-start justify-center">
        <div className="card border-danger p-8 text-center w-full">
          <div className="w-20 h-20 rounded-xl bg-linear-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-4">
            <FaGlobeAmericas className="text-white text-3xl" />
          </div>
          <h3 className="text-xl font-bold text-danger mb-2">Failed to load districts</h3>
          <p className="text-text-secondary mb-4">{error}</p>
          <Button
            onClick={refreshDistricts}
            variant="danger"
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
        title={stateData?.name || "Active Districts"}
        subtitle={`Manage districts and administrative areas under ${stateData?.name || 'the selected state'}.`}
        icon={FaMapMarkerAlt}
        showBackButton={true}
        onBackClick={() =>
          navigate(location.pathname.replace("/active-districts", "/active-states"), {
            state: { country },
          })
        }
        stats={[
          { label: "Total Districts", value: districts.length, description: "In state" },
          { label: "Active", value: activeDistricts.length, description: "Managing" },
          { label: "Inactive", value: inactiveDistricts.length, description: "Available" }
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
            <p className="text-text-secondary mb-4">You don't have permission to manage districts.</p>
          </div>
        }
      >
        <div className="card hover:shadow-xl transition-all duration-300 ">
          <div className="p-5">
            {/* Last updated badge */}
            <div className="flex justify-end mb-4">
              <span className="text-xs bg-linear-120 from-primary/5 to-primary/15 text-text-secondary px-2 py-1 rounded-full flex items-center gap-1">
                <FiClock size={10} />
                Activate district
              </span>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-linear-to-br from-primary to-primary-end text-white">
                <FaPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary">Activate New District</h3>
                <p className="text-text-secondary text-sm">Select a district to activate and start managing zones & clusters</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Select District
                </label>

                {inactiveDistricts.length > 0 ? (
                  <DropdownWithSearchInput
                    value={districtItem}
                    onChange={setDistrictItem}
                    options={inactiveDistricts}
                    className="w-full"
                    placeholder="Choose a district to activate..."
                  />
                ) : (
                  <div className="p-3 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm">
                    All districts are already active!
                  </div>
                )}
              </div>

              <div>
                {districtItem && !districts.find(d => d.id === districtItem)?.is_active && (
                  <Button
                    onClick={handleActivate}
                    disabled={activating}
                    className="w-full bg-linear-120 from-primary to-primary-end"
                    leftIcon={activating ? <FaSpinner className="animate-spin mr-2" /> : <FaCheckCircle className="mr-2" />}
                    loading={activating}
                  >
                    {activating ? 'Activating...' : 'Activate District'}
                  </Button>
                )}

                {districtItem && districts.find(d => d.id === districtItem)?.is_active ? (
                  <div className="w-full bg-green-50 text-green-700 py-3 px-6 rounded-xl text-center font-semibold flex items-center justify-center border border-green-200">
                    <FaCheckCircle className="mr-3" />
                    Already Active
                  </div>
                ) : ""}
              </div>
            </div>

            {districtItem && (
              <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/20">
                <div className="flex items-center gap-4">
                  <FaMapMarkerAlt className="text-primary text-2xl" />
                  <div>
                    <h4 className="font-semibold text-text-primary">{districts.find(d => d.id === districtItem)?.name}</h4>
                    <p className="text-sm text-text-secondary">
                      {districts.find(d => d.id === districtItem)?.is_active ? "Active • Managing regions" : "Ready to activate"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </RenderIfPermission>

      {/* ✅ Active Districts Grid */}
      <RenderIfPermission
        requiredUniqueId={moduleUniqueId}
        permission="view"
      >
        <div className="card hover:shadow-xl transition-all duration-300 ">
          <div className="p-5">
            <div className="flex justify-end mb-4">
              <span className="text-xs bg-linear-120 from-primary/5 to-primary/15 text-text-secondary px-2 py-1 rounded-full flex items-center gap-1">
                <FiClock size={10} />
                Active districts
              </span>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-linear-to-br from-green-500 to-green-600 text-white">
                  <FaChartLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary">Active Districts</h3>
                  <p className="text-text-secondary text-sm">Manage your active districts</p>
                </div>
              </div>
              <div className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                {activeDistricts.length} {activeDistricts.length === 1 ? "District" : "Districts"} Active
              </div>
            </div>

            <div className="">
              <SearchInputWithDropdown
                options={currentActiveDistricts}
                value={null}
                inputValue={searchQuery}
                onInputChange={(val) => {
                  setSearchQuery(val);
                  setCurrentPage(1);
                }}
                onChange={(selectedValue) => {
                  const selected = districts.find((d) => d.value === selectedValue);
                  setSearchQuery(selected?.name || "");
                  setCurrentPage(1);
                }}
                placeholder="Search active districts by name..."
                className="w-full"
              />
              {searchQuery && (
                <p className="mt-2 text-sm text-text-secondary">
                  Found {filteredActiveDistricts.length} active districts matching "{searchQuery}"
                </p>
              )}
            </div>
          </div>
        </div>
        {activeDistricts.length === 0 ? (
          <div className="card hover:shadow-xl transition-all duration-300 ">
            <div className="p-5">
              <div className="bg-primary/5 rounded-xl border-2 border-dashed border-primary/30 p-12 text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <FaMapMarkerAlt className="text-primary text-3xl" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">No Active Districts</h3>
                <p className="text-text-secondary max-w-md mx-auto text-sm">Activate a district to start managing its zones and clusters.</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Active Districts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentActiveDistricts.map((d, index) => (
                <div
                  key={d.id || index}
                  className="card hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1 group"
                  onClick={() =>
                    navigate(location.pathname.replace("/active-districts", "/urban-cities"), {
                      state: {
                        district: {
                          id: d.id,
                          name: d.name,
                        },
                        state: stateData,
                        country,
                      },
                    })
                  }
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-linear-to-br from-primary to-primary-end flex items-center justify-center">
                          <FaMapMarkerAlt className="text-text-inverse text-lg" />
                        </div>
                        <div>
                          <h3 className="font-bold text-text-primary group-hover:text-primary transition-colors">
                            {d.name}
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
                          <FaBuilding className="text-primary text-xs" />
                          <span className="text-[10px] font-semibold text-primary">Urban</span>
                        </div>
                        <p className="text-lg font-bold text-text-primary">{d.urban_cities_count || 0}</p>
                      </div>
                      <div className="bg-primary/5 rounded-lg p-2 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <FaHome className="text-primary text-xs" />
                          <span className="text-[10px] font-semibold text-primary">Rural</span>
                        </div>
                        <p className="text-lg font-bold text-text-primary">{d.rural_cities_count || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={filteredActiveDistricts.length}
                pageSize={itemsPerPage}
                className="mt-6 border-t border-border pt-4"
              />
            </div>
          </>
        )}

        {/* Confirmation Popup */}
        < ConfirmationPopup
          isOpen={confirmationPopup.isOpen}
          title={confirmationPopup.title}
          message={confirmationPopup.message}
          mode={confirmationPopup.mode}
          variant={confirmationPopup.variant}
          confirmText={confirmationPopup.confirmText}
          onConfirm={confirmationPopup.onConfirm}
          onCancel={() => setConfirmationPopup(prev => ({ ...prev, isOpen: false }))
          }
          isLoading={loading}
        />
      </RenderIfPermission >
    </div >
  );
}