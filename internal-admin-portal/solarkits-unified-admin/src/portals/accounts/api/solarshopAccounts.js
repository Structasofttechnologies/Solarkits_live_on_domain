import axios from "axios";
import { authHeaderObj } from "@/app/authHeader";

const API_BASE = import.meta.env.VITE_ACCOUNT_API_URL || import.meta.env.VITE_API_URL;
const BASE_URL = `${API_BASE}/accounts/solar-shop`;

export const getSolarShopDashboardStats = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await axios.get(`${BASE_URL}/dashboard-stats${query ? `?${query}` : ''}`, {
    headers: authHeaderObj(),
  });
  return res.data;
};

export const getSolarShopRecentTransactions = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await axios.get(`${BASE_URL}/recent-transactions${query ? `?${query}` : ''}`, {
    headers: authHeaderObj(),
  });
  return res.data;
};

export const getFranchisePlanPurchases = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await axios.get(`${BASE_URL}/franchise-plans${query ? `?${query}` : ''}`, {
    headers: authHeaderObj(),
  });
  return res.data;
};

export const updatePlanPaymentStatus = async (id, data) => {
  const res = await axios.post(`${BASE_URL}/franchise-plans/${id}/status`, data, {
    headers: authHeaderObj(),
  });
  return res.data;
};

export const getDirectEpcTransactions = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await axios.get(`${BASE_URL}/direct-epc-transactions${query ? `?${query}` : ''}`, {
    headers: authHeaderObj(),
  });
  return res.data;
};

export const getFranchiseCommissions = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await axios.get(`${BASE_URL}/franchise-commissions${query ? `?${query}` : ''}`, {
    headers: authHeaderObj(),
  });
  return res.data;
};

export const updateCommissionStatus = async (id, data) => {
  const res = await axios.post(`${BASE_URL}/franchise-commissions/${id}/status`, data, {
    headers: authHeaderObj(),
  });
  return res.data;
};

export const getOnboardedEpcPurchases = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await axios.get(`${BASE_URL}/onboarded-epc-purchases${query ? `?${query}` : ''}`, {
    headers: authHeaderObj(),
  });
  return res.data;
};

export const getTransactionDetails = async (type, id) => {
  const res = await axios.get(`${BASE_URL}/transaction-details/${type}/${id}`, {
    headers: authHeaderObj(),
  });
  return res.data;
};
