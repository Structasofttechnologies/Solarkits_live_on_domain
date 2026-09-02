// components/ApproveNewEPCIndia.jsx
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import axios from "axios";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaSearch,
  FaMapMarkerAlt,
  FaClock,
  FaEnvelope,
  FaTrash,
  FaCheck,
  FaExclamationTriangle,
  FaInfoCircle,
  FaBuilding,
  FaWhatsapp,
  FaEye,
  FaPhoneAlt
} from "react-icons/fa";
import { setAlert } from "@/features/alert.slice";
import Button from "@/components/Button";
import Dropdown from "@/components/Dropdown";
import Dialog from "@/components/Dialog";
import CustomFilePicker from "@/components/CustomFilePicker";
import { authHeaderObj } from "@/app/authHeader";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import CustomTable from "@/components/CustomTable";
import IconButton from "@/components/IconButton";


const API_URL = import.meta.env.VITE_API_URL;

// Custom debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function ApproveNewEPCIndia({ moduleUniqueId, countryId }) {
  const dispatch = useDispatch();

  // State Management
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Search and Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [states, setStates] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  // Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    requestId: null,
    action: null,
    companyName: "",
    email: ""
  });

  // Image modal state
  const [imageModal, setImageModal] = useState({
    isOpen: false,
    imageUrl: null
  });

  // File upload state for approve
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fileError, setFileError] = useState("");

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0
  });

  // Status options
  const statusOptions = [
    { text: "Pending", value: "pending" },
    { text: "Approved", value: "approved" },
    { text: "Rejected", value: "rejected" }
  ];

  // Fetch states for filter
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await axios.post(
          `${API_URL}/geolocation/states?unique_id=${moduleUniqueId}&req_for=view`,
          {
            country_id: countryId
          },
          { headers: { ...authHeaderObj() } }
        );

        if (response.data.status === "success") {
          const stateOptions = [
            { text: "All States", value: "all" },
            ...response.data.states.map(state => ({
              text: state.name,
              value: state.id.toString()
            }))
          ];
          setStates(stateOptions);
        }
      } catch (error) {
        console.error("Error fetching states:", error);
      }
    };

    if (countryId) {
      fetchStates();
    }
  }, [moduleUniqueId, countryId]);

  // Fetch requests with pagination and filters
  const fetchRequests = async () => {
    setLoading(true);
    let apiRequests = [];
    let localRequests = [];

    // 1. Read from Cookie (shared across all localhost ports: 5173, 5174, 5176)
    try {
      const match = document.cookie.split('; ').find((row) => row.startsWith('pending_epc_requests='));
      if (match) {
        const val = decodeURIComponent(match.split('=')[1]);
        if (val) localRequests = JSON.parse(val);
      }
    } catch (e) {
      console.error("Failed to read cookie pending requests:", e);
    }

    // 2. Read from localStorage if cookie was empty
    if (!localRequests || localRequests.length === 0) {
      try {
        const stored = localStorage.getItem('pending_epc_requests');
        if (stored) {
          localRequests = JSON.parse(stored);
        }
      } catch (e) {
        console.error("Failed to read local pending requests:", e);
      }
    }

    // 3. Fallback sample requests if no local requests exist yet
    if (!localRequests || localRequests.length === 0) {
      localRequests = [
        {
          id: 'req-demo-001',
          company_name: 'Prince Solar EPC',
          full_name: 'Prince Mehta',
          email: 'prince@solarkits.com',
          whatsapp: '+91 9876543210',
          state_name: 'Gujarat',
          district_name: 'Ahmedabad',
          is_registered_same_as_whatsapp: 1,
          registered_whatsapp: '+91 9876543210',
          gst_number: '27AAAAA0000A1Z5',
          country: 'India',
          status: 'pending',
          created_at: new Date().toISOString(),
        },
        {
          id: 'req-demo-002',
          company_name: 'Sunnovative EPC Solutions',
          full_name: 'Rahil Shah',
          email: 'rahil.sunnovative@gmail.com',
          whatsapp: '+91 9988776655',
          state_name: 'Maharashtra',
          district_name: 'Mumbai Suburban',
          is_registered_same_as_whatsapp: 1,
          registered_whatsapp: '+91 9988776655',
          gst_number: '27BBBBB1111B1Z2',
          country: 'India',
          status: 'pending',
          created_at: new Date(Date.now() - 3600000).toISOString(),
        }
      ];
      try {
        localStorage.setItem('pending_epc_requests', JSON.stringify(localRequests));
      } catch (e) {}
    }

    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
        ...(selectedState !== "all" && { state: selectedState }),
        ...(selectedStatus !== "all" && { status: selectedStatus })
      });

      const response = await axios.get(
        `${API_URL}/solarshop/india/epcs/requests?unique_id=${moduleUniqueId}&req_for=view&${params.toString()}`,
        { headers: { ...authHeaderObj() } }
      );

      if (response.data.status === "success") {
        apiRequests = response.data.data || [];
      }
    } catch (error) {
      console.warn("Backend API fetch for EPC requests warning:", error.message);
    }

    // Merge local requests with API requests (deduplicating by ID)
    const combinedMap = new Map();
    localRequests.forEach((req) => combinedMap.set(req.id, req));
    apiRequests.forEach((req) => combinedMap.set(req.id, req));
    let combined = Array.from(combinedMap.values());

    // Filter combined list
    if (debouncedSearchQuery) {
      const q = debouncedSearchQuery.toLowerCase();
      combined = combined.filter((r) =>
        r.company_name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.full_name?.toLowerCase().includes(q) ||
        r.whatsapp?.toLowerCase().includes(q)
      );
    }

    if (selectedStatus !== "all") {
      combined = combined.filter((r) => (r.status || 'pending').toLowerCase() === selectedStatus.toLowerCase());
    }

    setRequests(combined);
    setTotalRecords(combined.length);
    setTotalPages(Math.max(1, Math.ceil(combined.length / itemsPerPage)));

    // Calculate stats
    const todayStr = new Date().toISOString().split('T')[0];
    setStats({
      total: combined.filter((r) => (r.status || 'pending').toLowerCase() === 'pending').length,
      today: combined.filter((r) => r.created_at?.startsWith(todayStr)).length,
      thisWeek: combined.length
    });

    setLoading(false);
  };

  // Update request status (approve with image, reject without)
  const updateRequestStatus = async (requestId, action) => {
    setProcessingId(requestId);
    const isApproval = action === "approve";
    const newStatus = isApproval ? "approved" : "rejected";

    // Check local pending requests first
    try {
      let localReqs = [];
      const cookieMatch = document.cookie.split('; ').find((row) => row.startsWith('pending_epc_requests='));
      if (cookieMatch) {
        localReqs = JSON.parse(decodeURIComponent(cookieMatch.split('=')[1]) || '[]');
      } else {
        localReqs = JSON.parse(localStorage.getItem('pending_epc_requests') || '[]');
      }

      const foundReq = localReqs.find((r) => r.id === requestId);
      if (foundReq) {
        foundReq.status = newStatus;
        const cookieVal = encodeURIComponent(JSON.stringify(localReqs));
        document.cookie = `pending_epc_requests=${cookieVal}; path=/; max-age=864000`;
        localStorage.setItem('pending_epc_requests', JSON.stringify(localReqs));

        if (isApproval) {
          const approvedEpc = {
            id: 'epc-' + Date.now(),
            name: foundReq.company_name,
            email: foundReq.email,
            source: 'verified',
            status: 'valid',
            email_valid: true,
            states: [foundReq.state_name || 'Gujarat'],
            created_at: new Date().toISOString(),
          };

          let approvedList = [];
          const appCookie = document.cookie.split('; ').find((row) => row.startsWith('approved_epcs='));
          if (appCookie) {
            approvedList = JSON.parse(decodeURIComponent(appCookie.split('=')[1]) || '[]');
          } else {
            approvedList = JSON.parse(localStorage.getItem('approved_epcs') || '[]');
          }

          approvedList = [approvedEpc, ...approvedList.filter((e) => e.name?.toLowerCase() !== approvedEpc.name.toLowerCase())];
          const appCookieVal = encodeURIComponent(JSON.stringify(approvedList));
          document.cookie = `approved_epcs=${appCookieVal}; path=/; max-age=864000`;
          localStorage.setItem('approved_epcs', JSON.stringify(approvedList));

          if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel('epc_registration_channel');
            channel.postMessage({ type: 'EPC_APPROVED', epc: approvedEpc, approvedList });
            channel.close();
          }
        }

        dispatch(setAlert({
          type: "success",
          message: `Request for "${foundReq.company_name}" ${newStatus} successfully!`
        }));

        fetchRequests();
        setProcessingId(null);
        setConfirmDialog({ isOpen: false, requestId: null, action: null, companyName: "", email: "" });
        setSelectedFile(null);
        setFileError("");
        return;
      }
    } catch (e) {
      console.error("Local request approval error:", e);
    }

    try {
      if (action === "approve") {
        // Validate image is selected
        if (!selectedFile) {
          setFileError("Reference image is required for approval");
          dispatch(setAlert({
            type: "error",
            message: "Reference image is required for approval"
          }));
          setProcessingId(null);
          return;
        }

        setUploadingImage(true);

        // Use FormData for approve with image
        const formData = new FormData();
        formData.append("request_id", requestId);
        formData.append("action", "approve");
        formData.append("reference_image", selectedFile);

        const response = await axios.post(
          `${API_URL}/solarshop/india/epcs/update-status?unique_id=${moduleUniqueId}&req_for=edit`,
          formData,
          {
            headers: {
              ...authHeaderObj(),
              "Content-Type": "multipart/form-data"
            }
          }
        );

        setUploadingImage(false);

        if (response.data.status === "success") {
          dispatch(setAlert({
            type: "success",
            message: response.data.message || "Request approved successfully"
          }));

          // Reset file selection and error
          setSelectedFile(null);
          setFileError("");

          // Refetch the current page to get updated data
          fetchRequests();
        } else {
          throw new Error(response.data.message || "Failed to approve request");
        }
      } else {
        // Reject - normal JSON request, no image required
        const response = await axios.post(
          `${API_URL}/solarshop/india/epcs/update-status?unique_id=${moduleUniqueId}&req_for=edit`,
          {
            request_id: requestId,
            action: action
          },
          { headers: { ...authHeaderObj() } }
        );

        if (response.data.status === "success") {
          dispatch(setAlert({
            type: "success",
            message: response.data.message || `Request rejected successfully`
          }));

          // Refetch the current page to get updated data
          fetchRequests();
        } else {
          throw new Error(response.data.message || "Failed to reject request");
        }
      }
    } catch (error) {
      console.error("Error updating request status:", error);
      dispatch(setAlert({
        type: "error",
        message: error.response?.data?.message || "Failed to update request status"
      }));
      setUploadingImage(false);
    } finally {
      setProcessingId(null);
      setConfirmDialog({ isOpen: false, requestId: null, action: null, companyName: "", email: "" });
      setSelectedFile(null);
      setFileError("");
    }
  };

  // Handle approve/reject click
  const handleAction = (requestId, action, companyName, email, status) => {
    // Disable action if request is not pending
    if (status?.toLowerCase() !== "pending") {
      dispatch(setAlert({
        type: "warning",
        message: `Cannot ${action} a request that is already ${status || 'processed'}`
      }));
      return;
    }

    setConfirmDialog({
      isOpen: true,
      requestId,
      action,
      companyName,
      email
    });

    // Reset file selection for new approval
    if (action === "approve") {
      setSelectedFile(null);
      setFileError("");
    }
  };

  const confirmAction = () => {
    const { requestId, action } = confirmDialog;
    if (requestId && action) {
      updateRequestStatus(requestId, action);
    }
  };

  // Handle file change for approve
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError("");

    if (file) {
      // Validate file type (supporting jpeg, jpg, png)
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setFileError("Please upload a valid image file (JPEG, PNG)");
        dispatch(setAlert({
          type: "error",
          message: "Please upload a valid image file (JPEG, PNG)"
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFileError("Image size should be less than 5MB");
        dispatch(setAlert({
          type: "error",
          message: "Image size should be less than 5MB"
        }));
        return;
      }

      setSelectedFile(file);
    }
  };

  // Handle image click to open modal
  const handleImageClick = (imageUrl) => {
    setImageModal({
      isOpen: true,
      imageUrl: imageUrl
    });
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle search change - reset to page 1
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Handle state filter change - reset to page 1
  const handleStateChange = (value) => {
    setSelectedState(value);
    setCurrentPage(1);
  };

  // Handle status filter change - reset to page 1
  const handleStatusChange = (value) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get relative time
  const getRelativeTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-success/10 text-success border-success/20 font-black text-[10px]";
      case "rejected":
        return "bg-danger/10 text-danger border-danger/20 font-black text-[10px]";
      case "pending":
      default:
        return "bg-warning/10 text-warning border-warning/20 font-black text-[10px]";
    }
  };

  // Get same as WhatsApp badge
  const getSameAsWhatsAppBadge = (isSame) => {
    if (isSame === 1 || isSame === true) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black bg-success/10 text-success border border-success/20">
          <FaCheck className="mr-1 text-[9px]" /> Verified
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black bg-danger/10 text-danger border border-danger/20">
        <FaTimesCircle className="mr-1 text-[9px]" /> External
      </span>
    );
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedState("all");
    setSelectedStatus("all");
    setCurrentPage(1);
  };

  // Fetch requests when dependencies change & listen for real-time registrations
  useEffect(() => {
    fetchRequests();

    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('epc_registration_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'NEW_REGISTRATION') {
          fetchRequests();
        }
      };
      return () => channel.close();
    }
  }, [currentPage, itemsPerPage, debouncedSearchQuery, selectedState, selectedStatus]);

  // Calculate displayed record range
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalRecords);

  // Table Headers
  const tableHeaders = [
    { key: 'company_name', label: 'Company Entity' },
    { key: 'contact_info', label: 'Contact Metadata' },
    { key: 'location', label: 'Geography' },
    { key: 'verification', label: 'Identity Verification' },
    { key: 'status', label: 'Status', align: 'center' },
    { key: 'reference', label: 'Asset Reference', align: 'center' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'actions', label: 'Actions', align: 'right' }
  ];

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="EPC Registration Control"
        subtitle="Validate and process incoming EPC requests with secure credential verification."
        icon={FaBuilding}
        stats={[
          { label: "Pending Validation", value: stats.total, description: "Total backlog" },
          { label: "Today's Intake", value: stats.today, description: "New requests" },
          { label: "Weekly Capacity", value: stats.thisWeek, description: "System volume" }
        ]}
      />

      {/* Control Bar */}
      <div className="bg-surface rounded-2xl border-2 border-border/60 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative group">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1 mb-2 block">Search Registry</label>
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Company, Email, WhatsApp..."
                  className="w-full h-11 pl-11 pr-12 bg-surface border-2 border-border rounded-xl text-sm font-bold text-text-primary focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all placeholder:text-text-muted/40"
                />
                {searchQuery && (
                  <button
                    onClick={() => clearFilters()}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-danger transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 lg:w-[40%]">
             {/* State Filter */}
             <div className="flex-1">
               <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1 mb-2 block">State Context</label>
               <Dropdown
                 value={selectedState}
                 onChange={handleStateChange}
                 options={states}
                 placeholder="All States"
                 className="w-full h-11"
               />
             </div>

             {/* Status Filter */}
             <div className="flex-1">
               <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1 mb-2 block">Request Status</label>
               <Dropdown
                 value={selectedStatus}
                 onChange={handleStatusChange}
                 options={statusOptions}
                 placeholder="Pending Only"
                 className="w-full h-11"
               />
             </div>
          </div>

          {/* Clear Filters */}
          {(searchQuery || selectedState !== "all" || selectedStatus !== "pending") && (
            <div className="flex items-end">
               <Button
                 onClick={clearFilters}
                 variant="ghost"
                 size="md"
                 leftIcon={<FaTrash size={12} />}
                 className="h-11 rounded-xl bg-danger/5 text-danger border border-danger/10 hover:bg-danger hover:text-white"
               >
                 Reset
               </Button>
            </div>
          )}
        </div>
      </div>

      {/* Data Section */}
      <div className="bg-surface rounded-2xl border-2 border-border/60 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
         <div className="px-6 py-4 bg-surface-hover/30 border-b border-border flex items-center justify-between">
            <h2 className="text-xs font-black text-text-primary flex items-center gap-3 uppercase tracking-[0.2em]">
               <div className="p-2.5 bg-primary/10 rounded-xl text-primary border border-primary/10 shadow-inner">
                  <FaBuilding size={14} />
               </div>
               Incoming Requests Registry
            </h2>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black text-text-muted uppercase tracking-widest bg-surface-hover px-3 py-1.5 rounded-lg border border-border/40">
                  Showing {startIndex}-{endIndex} of {totalRecords}
               </span>
            </div>
         </div>

         <div className="flex-1 p-6">
            <CustomTable
              headers={tableHeaders}
              data={requests}
              loading={loading}
              emptyMessage={searchQuery || selectedState !== "all" || selectedStatus !== "all" ? "No matching records identified." : "No incoming EPC requests detected."}
              containerClassName="border-none shadow-none rounded-none bg-transparent"
              renderRow={(request) => (
                <>
                  <td className="px-6 py-4">
                    <div className="font-black text-text-primary tracking-tight text-sm">
                      {request.company_name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary">
                        <FaEnvelope className="text-primary opacity-40" />
                        {request.email}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary">
                        <FaWhatsapp className="text-success opacity-40" />
                        {request.whatsapp}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-black text-text-secondary">
                        <FaMapMarkerAlt className="text-primary opacity-40" />
                        {request.state_name || "-"}
                      </div>
                      <div className="text-[10px] font-bold text-text-muted ml-5 opacity-60">
                        {request.district_name || "Region N/A"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-text-primary">
                        <FaPhoneAlt className="text-primary opacity-40" size={10} />
                        {request.is_registered_same_as_whatsapp ? request.whatsapp : (request.registered_whatsapp || "-")}
                      </div>
                      <div className="flex">
                        {getSameAsWhatsAppBadge(request.is_registered_same_as_whatsapp)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full border shadow-sm ${getStatusBadge(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {request.reference_image ? (
                      <button
                        onClick={() => handleImageClick(request.reference_image.startsWith('http') ? request.reference_image : `${API_URL}${request.reference_image}`)}
                        className="p-1 rounded-xl bg-surface border border-border shadow-sm hover:border-primary/40 hover:shadow-lg transition-all active:scale-95 group mx-auto"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden relative">
                          <img src={request.reference_image.startsWith('http') ? request.reference_image : `${API_URL}${request.reference_image}`} alt="Ref" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                             <FaEye className="text-white" />
                          </div>
                        </div>
                      </button>
                    ) : <span className="text-text-muted opacity-20 font-black">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                       <div className="text-[10px] font-black text-text-primary">{formatDate(request.created_at).split(',')[0]}</div>
                       <div className="text-[9px] font-bold text-text-muted opacity-40 flex items-center gap-1">
                          <FaClock size={9} />
                          {getRelativeTime(request.created_at)}
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <IconButton
                         onClick={() => handleAction(request.id, "approve", request.company_name, request.email, request.status)}
                         disabled={processingId === request.id || request.status?.toLowerCase() !== "pending"}
                         variant="ghost"
                         size="sm"
                         className="bg-success/5 text-success hover:bg-success hover:text-white rounded-xl h-9 w-9 transition-all active:scale-90"
                       >
                         {processingId === request.id && confirmDialog.action === "approve" ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                       </IconButton>

                       <IconButton
                         onClick={() => handleAction(request.id, "reject", request.company_name, request.email, request.status)}
                         disabled={processingId === request.id || request.status?.toLowerCase() !== "pending"}
                         variant="ghost"
                         size="sm"
                         className="bg-danger/5 text-danger hover:bg-danger hover:text-white rounded-xl h-9 w-9 transition-all active:scale-90"
                       >
                         {processingId === request.id && confirmDialog.action === "reject" ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                       </IconButton>
                    </div>
                  </td>
                </>
              )}
            />
         </div>

         <div className="p-6 border-t border-border bg-surface-hover/20">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={totalRecords}
              pageSize={itemsPerPage}
              className="w-full"
            />
         </div>
      </div>

      {/* Modals & Dialogs */}
      <Dialog
        isOpen={confirmDialog.isOpen}
        onClose={() => {
          setConfirmDialog({ isOpen: false, requestId: null, action: null, companyName: "", email: "" });
          setSelectedFile(null);
          setFileError("");
        }}
        title={confirmDialog.action === "approve" ? "Finalize Credential Approval" : "Terminate Registration Request"}
        size="md"
      >
        <div className="space-y-6 pt-2">
          <div className="flex items-center justify-center">
            {confirmDialog.action === "approve" ? (
              <div className="w-16 h-16 bg-success/10 rounded-3xl flex items-center justify-center text-success border border-success/20 shadow-inner">
                <FaCheckCircle size={32} />
              </div>
            ) : (
              <div className="w-16 h-16 bg-danger/10 rounded-3xl flex items-center justify-center text-danger border border-danger/20 shadow-inner">
                <FaExclamationTriangle size={32} />
              </div>
            )}
          </div>

          <div className="text-center space-y-4">
            <div className="space-y-1">
               <h3 className="text-lg font-black text-text-primary uppercase tracking-tight">
                 {confirmDialog.action === "approve" ? "Registry Confirmation" : "Termination Protocol"}
               </h3>
               <p className="text-xs text-text-muted font-bold uppercase tracking-widest opacity-60">
                 Validating identity for {confirmDialog.companyName}
               </p>
            </div>

            <div className="bg-surface-hover/50 p-5 rounded-2xl border border-border shadow-inner space-y-3">
               <p className="text-[10px] font-black text-text-primary">{confirmDialog.companyName}</p>
               <div className="h-px bg-border/40 w-12 mx-auto" />
               <div className="flex flex-col items-center gap-1">
                 <p className="text-[10px] font-bold text-text-muted">{confirmDialog.email}</p>
               </div>
            </div>

            {confirmDialog.action === "approve" && (
              <div className="space-y-4 text-left">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Asset Verification *</label>
                   <CustomFilePicker
                     name="reference_image"
                     onChange={handleFileChange}
                     accept="image/*"
                     files={selectedFile ? [selectedFile] : []}
                     className="w-full"
                   />
                </div>
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex gap-3">
                   <FaInfoCircle className="text-primary mt-0.5" size={14} />
                   <p className="text-[10px] font-bold text-primary uppercase leading-relaxed tracking-tight">Approval requires a verified reference document (JPEG/PNG). Max payload capacity: 5MB.</p>
                </div>
                {fileError && <p className="text-xs font-black text-danger uppercase tracking-widest text-center animate-pulse">{fileError}</p>}
              </div>
            )}

            <p className="text-[10px] font-bold text-text-muted opacity-40">Operational Warning: This action is irreversible.</p>
          </div>

          <div className="flex gap-3 pt-6 border-t border-border">
             <Button variant="secondary" onClick={() => setConfirmDialog({ isOpen: false })} className="flex-1 rounded-xl">Cancel</Button>
             <Button
               variant={confirmDialog.action === "approve" ? "success" : "danger"}
               onClick={confirmAction}
               loading={uploadingImage || (processingId === confirmDialog.requestId)}
               className="flex-1 rounded-xl shadow-lg font-black uppercase tracking-widest text-xs"
               disabled={confirmDialog.action === "approve" && !selectedFile}
             >
               Confirm {confirmDialog.action}
             </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        isOpen={imageModal.isOpen}
        onClose={() => setImageModal({ isOpen: false, imageUrl: null })}
        title="Asset Verification"
        size="xl"
      >
        <div className="relative aspect-video bg-surface rounded-2xl overflow-hidden border border-border group shadow-2xl">
           <img src={imageModal.imageUrl} alt="Ref" className="w-full h-full object-contain" />
           <div className="absolute inset-x-0 bottom-0 p-6 bg-linear-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white font-black text-[10px]">Registry Credential Asset View</p>
           </div>
        </div>
      </Dialog>
    </div>
  );
}