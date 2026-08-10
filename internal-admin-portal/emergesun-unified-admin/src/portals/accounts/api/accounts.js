import axios from "axios";
import { authHeaderObj } from "@/app/authHeader";

const API_URL = import.meta.env.VITE_ACCOUNT_API_URL || import.meta.env.VITE_API_URL;

export const getPendingInwards = async () => {
  const res = await axios.get(`${API_URL}/accounts/pending-inwards`, {
    headers: authHeaderObj(),
  });
  return res.data;
};

export const approveInward = async (id) => {
  const res = await axios.post(
    `${API_URL}/accounts/inwards/${id}/approve`,
    {},
    { headers: authHeaderObj() }
  );
  return res.data;
};

export const rejectInward = async (id, reason) => {
  const res = await axios.post(
    `${API_URL}/accounts/inwards/${id}/reject`,
    { reason },
    { headers: authHeaderObj() }
  );
  return res.data;
};

export const getWarehouses = async (clusterId = "", stateId = "", countryId = "") => {
  const res = await axios.get(`${API_URL}/accounts/warehouses?clusterId=${clusterId}&stateId=${stateId}&countryId=${countryId}`, {
    headers: authHeaderObj(),
  });
  return res.data;
};

export const getWarehouseInwards = async (warehouseId) => {
  const res = await axios.get(`${API_URL}/accounts/warehouse-inwards?warehouseId=${warehouseId}`, {
    headers: authHeaderObj(),
  });
  return res.data;
};

export const getSuppliers = async () => {
  const res = await axios.get(`${API_URL}/accounts/suppliers`, {
    headers: authHeaderObj(),
  });
  return res.data;
};

export const registerSupplier = async (data) => {
  const res = await axios.post(
    `${API_URL}/accounts/suppliers`,
    data,
    { headers: authHeaderObj() }
  );
  return res.data;
};

export const gstGenerateOtp = async (gstin) => {
  const res = await axios.post(
    `${API_URL}/accounts/gst/generate-otp`,
    { gstin },
    { headers: authHeaderObj() }
  );
  return res.data;
};

export const gstSubmitOtp = async (request_id, otp, gstin) => {
  const res = await axios.post(
    `${API_URL}/accounts/gst/submit-otp`,
    { request_id, otp, gstin },
    { headers: authHeaderObj() }
  );
  return res.data;
};

export const getCountries = async () => {
  const res = await axios.get(`${API_URL}/geography/countries`, {
    headers: authHeaderObj(),
  });
  return res.data;
};

export const getStates = async (countryId) => {
  const res = await axios.get(`${API_URL}/geography/states/${countryId}`, {
    headers: authHeaderObj(),
  });
  return res.data;
};

export const getWarehouseSkus = async (warehouseId) => {
  const res = await axios.get(`${API_URL}/accounts/warehouses/${warehouseId}/skus`, {
    headers: authHeaderObj(),
  });
  return res.data;
};

export const getSkuSuppliers = async (warehouseId, skuId) => {
  const res = await axios.get(`${API_URL}/accounts/warehouses/${warehouseId}/skus/${skuId}/suppliers`, {
    headers: authHeaderObj(),
  });
  return res.data;
};

export const getWarehouseSuppliers = async (warehouseId) => {
  const res = await axios.get(`${API_URL}/accounts/warehouses/${warehouseId}/suppliers`, {
    headers: authHeaderObj(),
  });
  return res.data;
};

export const getSupplierWarehousePrices = async (warehouseId, supplierId) => {
  const res = await axios.get(`${API_URL}/accounts/warehouses/${warehouseId}/suppliers/${supplierId}/prices`, {
    headers: authHeaderObj(),
  });
  return res.data;
};

export const createPurchaseOrder = async (poData) => {
  const res = await axios.post(`${API_URL}/accounts/purchase-orders`, poData, {
    headers: authHeaderObj(),
  });
  return res.data;
};

export const getPurchaseOrders = async (clusterId = "", stateId = "", countryId = "") => {
  const res = await axios.get(`${API_URL}/accounts/purchase-orders?clusterId=${clusterId}&stateId=${stateId}&countryId=${countryId}`, {
    headers: authHeaderObj(),
  });
  return res.data;
};

export const getSkuDetails = async (skuId) => {
  const res = await axios.get(`${API_URL}/accounts/skus/${skuId}/details`, {
    headers: authHeaderObj(),
  });
  return res.data;
};

export const payPurchaseOrder = async (id, paymentData) => {
  const res = await axios.post(`${API_URL}/accounts/purchase-orders/${id}/pay`, paymentData, {
    headers: authHeaderObj(),
  });
  return res.data;
};

export const updatePurchaseOrderTimeline = async (id, timeline) => {
  const res = await axios.put(`${API_URL}/accounts/purchase-orders/${id}/timeline`, { timeline }, {
    headers: authHeaderObj(),
  });
  return res.data;
};

export const uploadPaymentReceipt = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await axios.post(
    `${API_URL}/accounts/upload-payment-receipt`,
    formData,
    {
      headers: {
        ...authHeaderObj(),
        "Content-Type": "multipart/form-data"
      }
    }
  );
  return res.data;
};

export const getComboKits = async (warehouseId = "") => {
  const params = warehouseId ? `?warehouseId=${warehouseId}` : "";
  const res = await axios.get(`${API_URL}/accounts/combo-kits${params}`, {
    headers: authHeaderObj(),
  });
  return res.data;
};

export const getCountrySaaSProducts = async (countryId) => {
  const res = await axios.get(`${API_URL}/accounts/countries/${countryId}/saas-products`, {
    headers: authHeaderObj(),
  });
  return res.data;
};

export const cancelPurchaseOrder = async (id) => {
  const res = await axios.post(`${API_URL}/accounts/purchase-orders/${id}/cancel`, {}, {
    headers: authHeaderObj(),
  });
  return res.data;
};

export const getCompletedDeliveries = async (clusterId = "", stateId = "", countryId = "") => {
  const res = await axios.get(`${API_URL}/accounts/completed-deliveries?clusterId=${clusterId}&stateId=${stateId}&countryId=${countryId}`, {
    headers: authHeaderObj(),
  });
  return res.data;
};

export const getPoRequests = async (clusterId = "") => {
  const params = clusterId ? `?clusterId=${clusterId}` : "";
  const res = await axios.get(`${API_URL}/accounts/po-requests${params}`, {
    headers: authHeaderObj(),
  });
  return res.data;
};

export const updatePoRequestStatus = async (id, status) => {
  const res = await axios.post(`${API_URL}/accounts/po-requests/${id}/status`, { status }, {
    headers: authHeaderObj(),
  });
  return res.data;
};
