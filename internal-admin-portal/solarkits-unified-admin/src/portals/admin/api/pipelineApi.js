import axios from 'axios';
import { authHeaderObj } from '@/app/authHeader';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Fetch solarshop connected pipeline status (checks Combo Kits pending Margin & Warehouse Activation)
 */
export const fetchPipelineStatus = async (country = 'india') => {
  try {
    const res = await axios.get(`${API_BASE}/solarshop/pipeline-status?country=${encodeURIComponent(country)}`, {
      headers: authHeaderObj(),
    });
    return res.data?.data || null;
  } catch (error) {
    console.error('Error fetching pipeline status:', error);
    return null;
  }
};
