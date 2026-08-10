import React, { useState, useEffect } from "react";
import axiosInstance from "@/utils/axiosInstance";
import { 
  FaShoppingCart, FaEye, FaRegClock, FaCheckCircle, 
  FaTimesCircle, FaMapMarkerAlt, FaEdit, FaTimes, FaTruck,
  FaWarehouse, FaTruckLoading
} from "react-icons/fa";
import { BsArrowRepeat } from "react-icons/bs";
import Button from "@/components/Button";
import CustomInput from "@/components/CustomInput";
import MapLocationPicker from "@/components/MapLocationPicker";



export default function ProjectOrderStatus() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Filter tab state
  const [activeTab, setActiveTab] = useState("All");

  // Address edit modal state
  const [editingOrder, setEditingOrder] = useState(null);
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [selectedStateId, setSelectedStateId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [selectedLat, setSelectedLat] = useState("");
  const [selectedLng, setSelectedLng] = useState("");
  const [modalError, setModalError] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const [boundaries, setBoundaries] = useState([]);

  useEffect(() => {
    const fetchBoundary = async () => {
      if (!editingOrder) {
        setBoundaries([]);
        return;
      }
      
      const districtName = editingOrder.district_id?.name;
      const stateObj = statesList.find(s => s.id === selectedStateId);
      const stateName = stateObj?.name || editingOrder.state_id?.name || editingOrder.district_id?.state_name;
      const countryName = "India";
      
      if (!districtName || !stateName) return;
      
      try {
        const res = await axiosInstance.get(`/india/v1/geo/district-boundary?district=${districtName}&state=${stateName}&country=${countryName}`);
        if (res.data?.success && res.data.district?.geometry) {
          setBoundaries([{
            id: res.data.district.id,
            level: 'district',
            geometry: res.data.district.geometry
          }]);
        }
      } catch (err) {
        console.error("Failed to fetch district boundary:", err);
      }
    };
    fetchBoundary();
  }, [editingOrder, selectedStateId, statesList]);

  // Fetch orders on load
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/india/v1/shop/orders");
      if (res.data?.success) {
        setOrders(res.data.data || []);
      } else {
        setErrorMsg("Failed to load orders.");
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
      setErrorMsg(err.response?.data?.message || "Error fetching order list. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchStates();
  }, []);

  const fetchStates = async () => {
    try {
      const response = await axiosInstance.get(`/india/v1/geo/states`);
      if (response.data?.states) {
        setStatesList(response.data.states);
      }
    } catch (error) {
      console.error("Error fetching states:", error);
    }
  };

  // Fetch districts when selectedStateId changes
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!selectedStateId) {
        setDistrictsList([]);
        return;
      }
      try {
        const response = await axiosInstance.get(`/india/v1/geo/districts?state_id=${selectedStateId}`);
        if (response.data?.districts) {
          setDistrictsList(response.data.districts);
        }
      } catch (error) {
        console.error("Error fetching districts:", error);
      }
    };
    fetchDistricts();
  }, [selectedStateId]);

  // Open Edit Address Modal
  const handleOpenEditAddress = (order) => {
    setEditingOrder(order);
    setStreetAddress(order.delivery_address?.address_line || "");
    setPincode(order.delivery_address?.pincode || "");
    setContactNumber(order.delivery_address?.contact_number || "");
    setContactName(order.delivery_address?.contact_name || "");
    
    const stateVal = order.delivery_address?.state_id || order.state_id?._id || order.state_id || "";
    const distVal = order.delivery_address?.district_id || order.district_id?._id || order.district_id || "";
    
    setSelectedStateId(stateVal ? stateVal.toString() : "");
    setSelectedDistrictId(distVal ? distVal.toString() : "");
    setSelectedLat(order.delivery_address?.lat || "");
    setSelectedLng(order.delivery_address?.lng || "");
    setModalError("");
  };

  // Handle Save Address
  const handleSaveAddress = async () => {
    setModalError("");
    if (!streetAddress.trim()) {
      setModalError("Street address is required.");
      return;
    }
    if (!pincode.trim() || pincode.trim().length !== 6 || isNaN(pincode.trim())) {
      setModalError("Please enter a valid 6-digit pincode.");
      return;
    }
    if (!contactName.trim()) {
      setModalError("Delivery contact person name is required.");
      return;
    }
    if (!contactNumber.trim()) {
      setModalError("Delivery contact mobile number is required.");
      return;
    }
    if (!/^\d{10}$/.test(contactNumber.trim())) {
      setModalError("Please enter a valid 10-digit delivery contact mobile number.");
      return;
    }
    if (!selectedStateId) {
      setModalError("Please select a state.");
      return;
    }
    if (!selectedDistrictId) {
      setModalError("Please select a district.");
      return;
    }

    // Verify district boundary restriction
    const targetDistrictId = editingOrder.district_id?._id || editingOrder.district_id;
    if (targetDistrictId && selectedDistrictId !== targetDistrictId.toString()) {
      const allowedDistrictName = editingOrder.district_id?.name || "the original ordering district";
      setModalError(`Delivery address must be within the district boundary from which the kit was ordered (Locked to: ${allowedDistrictName}).`);
      return;
    }

    // Verify pin coordinates are inside the district boundaries
    if (selectedLat && selectedLng && boundaries && boundaries.length > 0 && window.google) {
      if (google.maps.geometry && google.maps.geometry.poly) {
        const latLng = new google.maps.LatLng(parseFloat(selectedLat), parseFloat(selectedLng));
        let isInside = false;

        const tempDiv = document.createElement("div");
        const tempMap = new google.maps.Map(tempDiv);

        for (const b of boundaries) {
          if (!b.geometry?.coordinates) continue;
          const { type, coordinates } = b.geometry;
          const paths = [];
          if (type === "Polygon") {
            paths.push(coordinates.map(ring => ring.map(([lng, lat]) => ({ lat: parseFloat(lat), lng: parseFloat(lng) }))));
          } else if (type === "MultiPolygon") {
            coordinates.forEach(polygonCoordinates =>
              paths.push(polygonCoordinates.map(ring => ring.map(([lng, lat]) => ({ lat: parseFloat(lat), lng: parseFloat(lng) }))))
            );
          }

          for (const path of paths) {
            const poly = new google.maps.Polygon({ paths: path, map: tempMap });
            if (google.maps.geometry.poly.containsLocation(latLng, poly)) {
              isInside = true;
              break;
            }
          }
          if (isInside) break;
        }

        if (!isInside) {
          const allowedDistrictName = editingOrder.district_id?.name || "the original ordering district";
          setModalError(`The selected location pin is outside the ${allowedDistrictName} district boundaries! Please move the pin inside the highlighted red boundary on the map.`);
          return;
        }
      }
    }

    setSavingAddress(true);
    try {
      const stateObj = statesList.find(s => s.id === selectedStateId);
      const districtObj = districtsList.find(d => d.id === selectedDistrictId);

      const payload = {
        delivery_address: {
          address_line: streetAddress,
          state_id: selectedStateId,
          state_name: stateObj?.name || "",
          district_id: selectedDistrictId,
          district_name: districtObj?.name || "",
          pincode,
          contact_number: contactNumber,
          contact_name: contactName,
          lat: selectedLat ? parseFloat(selectedLat) : null,
          lng: selectedLng ? parseFloat(selectedLng) : null
        }
      };

      const res = await axios.put(
        `${API_URL}/india/v1/shop/orders/${editingOrder._id}/address`,
        payload,
        { withCredentials: true }
      );

      if (res.data?.success) {
        setEditingOrder(null);
        fetchOrders();
      } else {
        setModalError(res.data?.message || "Failed to update delivery address.");
      }
    } catch (error) {
      console.error("Failed to update address:", error);
      setModalError(error.response?.data?.message || "Failed to update delivery address.");
    } finally {
      setSavingAddress(false);
    }
  };

  // Status mapping
  const statusColors = {
    pending: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
    confirmed: "bg-blue-600/10 text-blue-600 border border-blue-600/20",
    completed: "bg-green-600/10 text-green-600 border border-green-600/20",
    cancelled: "bg-red-600/10 text-red-600 border border-red-600/20",
  };

  // Stats calculation
  const stats = {
    total: orders.length,
    processing: orders.filter(o => o.status === "pending" || o.status === "confirmed").length,
    completed: orders.filter(o => o.status === "completed").length,
    cancelled: orders.filter(o => o.status === "cancelled").length
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab === "All") return true;
    if (activeTab === "Processing") return o.status === "pending" || o.status === "confirmed";
    return o.status.toLowerCase() === activeTab.toLowerCase();
  });

  return (
    <div className="min-h-screen space-y-6">
      {/* Header */}
      <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-text-primary dark:text-info tracking-tight">
            Order Kit Status & Tracking
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Manage your solar kits, view real-time delivery statuses, and adjust delivery addresses.
          </p>
        </div>
        <Button onClick={fetchOrders} variant="secondary" className="px-4 py-2 flex items-center gap-1">
          <BsArrowRepeat className={loading ? "animate-spin" : ""} /> Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: "Total Orders", value: stats.total, color: "blue", icon: FaShoppingCart },
          { title: "Processing", value: stats.processing, color: "amber", icon: BsArrowRepeat },
          { title: "Completed", value: stats.completed, color: "green", icon: FaCheckCircle },
          { title: "Cancelled", value: stats.cancelled, color: "red", icon: FaTimesCircle }
        ].map((stat, idx) => (
          <div key={idx} className="bg-surface p-5 rounded-2xl border border-border flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-extrabold text-text-secondary tracking-widest">{stat.title}</p>
              <h2 className="text-2xl font-black text-text-primary mt-1.5">{stat.value}</h2>
            </div>
            <div className={`p-3 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-600`}>
              <stat.icon className="text-xl" />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-border gap-2">
        {["All", "Processing", "Completed", "Cancelled"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3.5 text-xs font-bold transition-all border-b-2 -mb-0.5 ${
              activeTab === tab
                ? "border-primary text-primary dark:border-info dark:text-info"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-text-muted">Loading your orders...</p>
        </div>
      ) : errorMsg ? (
        <div className="bg-danger/5 border border-danger/20 rounded-xl p-5 text-center text-danger text-sm">
          {errorMsg}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center space-y-4">
          <FaShoppingCart className="text-text-muted mx-auto text-5xl opacity-40" />
          <div>
            <h3 className="text-base font-bold text-text-primary">No Orders Found</h3>
            <p className="text-xs text-text-secondary mt-1">There are no orders matching this filter.</p>
          </div>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-hover/50 border-b border-border text-[10px] uppercase font-bold text-text-secondary tracking-wider">
                <tr>
                  <th className="p-4">Order Details</th>
                  <th className="p-4">District Boundary</th>
                  <th className="p-4">Order Value</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date Ordered</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredOrders.map((order) => {
                  const isExpanded = expandedOrderId === order._id;
                  const kitName = order.combo_kit_id?.kitName || "Solar Combo Kit";
                  const districtName = order.district_id?.name || order.delivery_address?.district_name || "Original District";

                  return (
                    <React.Fragment key={order._id}>
                      <tr 
                        onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                        className="hover:bg-surface-hover/30 cursor-pointer transition-colors"
                      >
                        <td className="p-4">
                          <div className="font-bold text-text-primary">{kitName}</div>
                          <div className="text-[10px] text-text-muted font-mono mt-0.5">{order._id}</div>
                        </td>
                        <td className="p-4 font-semibold text-text-secondary flex items-center gap-1.5 mt-2">
                          <FaMapMarkerAlt className="text-primary text-xs" />
                          {districtName}
                        </td>
                        <td className="p-4 font-bold text-text-primary">
                          ₹{order.selling_price_snapshot?.toLocaleString("en-IN")}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[order.status] || ""}`}>
                              {order.status}
                            </span>
                            {(!order.delivery_address || !order.delivery_address.address_line) && (
                              <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[9px] font-black px-2 py-0.5 rounded tracking-wide uppercase">
                                ⚠️ Pending Address
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-xs text-text-secondary">
                          {new Date(order.created_at || order.created_by).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          })}
                        </td>
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                              className="p-2 text-text-secondary hover:text-primary transition-colors"
                              title="View Details"
                            >
                              <FaEye size={15} />
                            </button>
                            <button
                              onClick={() => handleOpenEditAddress(order)}
                              className="p-2 text-text-secondary hover:text-primary transition-colors"
                              title="Update Delivery Address"
                            >
                              <FaEdit size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Section */}
                      {isExpanded && (
                        <tr className="bg-surface-hover/10">
                          <td colSpan={6} className="p-5 border-t border-b border-border">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Left - Kit specs & details */}
                              <div className="space-y-3">
                                <h4 className="text-xs uppercase font-extrabold text-text-secondary tracking-wider">
                                  📦 Kit Configuration Specifications
                                </h4>
                                <div className="bg-surface rounded-xl p-4 border border-border text-xs space-y-2 text-text-secondary">
                                  <div className="flex justify-between">
                                    <span>Brand Name:</span>
                                    <span className="font-bold text-text-primary">{order.combo_kit_id?.brand || "SolarShop Brand"}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Generation Capacity:</span>
                                    <span className="font-bold text-text-primary">{order.combo_kit_id?.capacityKW} kW</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Usage Type:</span>
                                    <span className="font-bold text-text-primary">{order.combo_kit_id?.usageType || "Residential"}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Estimated Annual Savings:</span>
                                    <span className="font-bold text-success">
                                      ₹{((order.combo_kit_id?.generationEstimateKWhPerYear || 0) * 8.5).toLocaleString("en-IN")} / Year
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Right - Delivery Address Information */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs uppercase font-extrabold text-text-secondary tracking-wider flex items-center gap-1">
                                    <FaMapMarkerAlt className="text-primary dark:text-info shrink-0" /> Delivery Address
                                  </h4>
                                  <button
                                    onClick={() => handleOpenEditAddress(order)}
                                    className="text-xs text-primary dark:text-info hover:underline font-bold flex items-center gap-1"
                                  >
                                    <FaEdit /> Edit Address
                                  </button>
                                </div>

                                <div className="bg-surface rounded-xl p-4 border border-border text-xs space-y-3">
                                  {order.delivery_address?.address_line ? (
                                    <div className="space-y-1 text-text-primary">
                                      <p className="font-semibold">{order.delivery_address.address_line}</p>
                                      <p>{order.delivery_address.district_name}, {order.delivery_address.state_name}</p>
                                      <p className="font-bold text-text-secondary mt-1">Pincode: {order.delivery_address.pincode}</p>
                                      {order.delivery_address.contact_name && (
                                        <p className="font-bold text-text-secondary mt-1">Contact Person: {order.delivery_address.contact_name}</p>
                                      )}
                                      {order.delivery_address.contact_number && (
                                        <p className="font-bold text-text-secondary">Contact Number: {order.delivery_address.contact_number}</p>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-amber-500 font-semibold flex items-center gap-1.5">
                                      <FaRegClock /> Address details pending update.
                                    </div>
                                  )}
                                  <div className="text-[10px] text-text-muted bg-surface-hover/50 p-2.5 rounded-lg border border-border">
                                    🚚 Dispatched from: <span className="font-bold text-text-secondary">{order.delivery_address?.district_name || districtName} solar hub</span>. 
                                    Delivery destination must reside within {districtName} district boundary limits.
                                  </div>
                                </div>
                              </div>
                              {/* Bottom (Span 2) - Real-time tracking stepper */}
                              {order.status !== 'pending' && (() => {
                                const steps = ['At Warehouse', 'Loaded', 'Out for Delivery', 'Reached Site', 'Delivered'];
                                const stepIcons = [FaWarehouse, FaTruckLoading, FaTruck, FaMapMarkerAlt, FaCheckCircle];
                                const currentStatus = order.tracking_status || (order.status === 'completed' ? 'Delivered' : null);
                                const currentIdx = currentStatus ? steps.indexOf(currentStatus) : -1;
                                return (
                                  <div className="md:col-span-2 space-y-3 border-t border-border/60 pt-4">
                                    {/* Header row */}
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-xs uppercase font-extrabold text-text-secondary tracking-wider flex items-center gap-1.5">
                                        <FaTruck className="text-primary dark:text-info shrink-0" />
                                        Live Delivery Tracking — {kitName}
                                      </h4>
                                      {currentStatus ? (
                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                                          currentStatus === 'Delivered'
                                            ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                        }`}>
                                          {currentStatus}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-bold text-text-muted px-2.5 py-1 rounded-full border border-border/50 bg-surface">
                                          Awaiting Dispatch
                                        </span>
                                      )}
                                    </div>

                                    <div className="bg-surface rounded-2xl p-5 border border-border">
                                      {currentStatus ? (
                                        /* Connected Stepper */
                                        <div className="relative">
                                          {/* Progress bar track */}
                                          <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-border/50 rounded-full" />
                                          {/* Progress fill */}
                                          <div
                                            className="absolute top-5 left-[10%] h-1 bg-primary dark:bg-info rounded-full transition-all duration-700"
                                            style={{ width: `${currentIdx >= 0 ? (currentIdx / (steps.length - 1)) * 80 : 0}%` }}
                                          />
                                          <div className="relative grid grid-cols-5 text-center gap-1">
                                            {steps.map((status, idx) => {
                                              const isPassed = currentIdx >= idx;
                                              const isCurrent = currentIdx === idx;
                                              const StepIcon = stepIcons[idx];
                                              return (
                                                <div key={status} className="flex flex-col items-center gap-1.5">
                                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${
                                                    isCurrent
                                                      ? 'bg-primary dark:bg-info text-white shadow-md ring-4 ring-primary/20 dark:ring-info/20 scale-110'
                                                      : isPassed
                                                        ? 'bg-primary/80 dark:bg-info/80 text-white'
                                                        : 'bg-border/50 text-text-muted'
                                                  }`}>
                                                    <StepIcon size={14} />
                                                  </div>
                                                  <span className={`text-[9px] font-bold leading-tight max-w-[60px] ${
                                                    isPassed ? 'text-primary dark:text-info' : 'text-text-muted'
                                                  }`}>
                                                    {status}
                                                  </span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      ) : (
                                        /* Awaiting dispatch state */
                                        <div className="flex flex-col items-center gap-3 py-4 text-center">
                                          <div className="w-12 h-12 rounded-full bg-border/30 flex items-center justify-center text-text-muted">
                                            <FaWarehouse size={20} />
                                          </div>
                                          <div>
                                            <p className="text-xs font-bold text-text-primary">Order Confirmed</p>
                                            <p className="text-[10px] text-text-muted mt-0.5">Your kit is being prepared at the warehouse. Tracking will begin once dispatched.</p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Address Edit Dialog Backdrop / Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingOrder(null)} />
          
          <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl shadow-2xl p-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Close */}
            <button
              onClick={() => setEditingOrder(null)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
            >
              <FaTimes size={16} />
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
              <FaMapMarkerAlt className="text-primary text-xl" />
              <div>
                <h3 className="text-lg font-black text-text-primary tracking-tight">Pin Delivery Address</h3>
                <p className="text-[10px] text-text-muted">Locked to district: {editingOrder.district_id?.name || "Original District"}</p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="space-y-4">
              {modalError && (
                <div className="bg-danger/10 text-danger p-3 rounded-xl border border-danger/20 text-xs font-semibold">
                  {modalError}
                </div>
              )}

              {/* Map Location Picker */}
              <div className="bg-surface-hover/50 p-2.5 rounded-2xl border border-border">
                <MapLocationPicker
                  lat={selectedLat}
                  lng={selectedLng}
                  visible={true}
                  boundaries={boundaries}
                  onLocationError={(err) => setModalError(err)}
                  onSelect={(loc) => {
                    setModalError("");
                    setStreetAddress(loc.address || "");
                    setPincode(loc.pincode || "");
                    setSelectedLat(loc.lat);
                    setSelectedLng(loc.lng);
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">Street Address</label>
                <textarea
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="Street name, building number, locality..."
                  className="w-full px-3.5 py-2.5 bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm transition-all outline-hidden resize-none h-16 text-text-primary animate-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <CustomInput
                  label="Contact Person Name"
                  placeholder="Enter receiver's name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />

                <CustomInput
                  label="Contact Mobile Number"
                  placeholder="10-digit mobile number"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                />

                <CustomInput
                  label="Pincode"
                  placeholder="400001"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                />
                
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">State</label>
                  <input
                    type="text"
                    value={statesList.find(s => s.id?.toString() === selectedStateId?.toString())?.name || editingOrder?.state_id?.name || editingOrder?.delivery_address?.state_name || ""}
                    disabled
                    className="w-full px-3.5 py-2.5 bg-surface-hover/50 border border-border rounded-xl text-sm outline-hidden text-text-muted cursor-not-allowed h-[42px]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">District</label>
                  <input
                    type="text"
                    value={districtsList.find(d => d.id?.toString() === selectedDistrictId?.toString())?.name || editingOrder?.district_id?.name || editingOrder?.delivery_address?.district_name || ""}
                    disabled
                    className="w-full px-3.5 py-2.5 bg-surface-hover/50 border border-border rounded-xl text-sm outline-hidden text-text-muted cursor-not-allowed h-[42px]"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 mt-6 border-t border-border pt-4">
              <Button
                variant="secondary"
                onClick={() => setEditingOrder(null)}
                disabled={savingAddress}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveAddress}
                loading={savingAddress}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}