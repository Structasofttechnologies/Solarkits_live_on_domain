/**
 * distributorIndustryContent.js
 *
 * API Service for BOS Kits Distributor Industry Media Showcase.
 */

import api from './api';

export const getDistributorIndustries = () =>
  api.get('/distributor/industry/my-industries');

export const getDistributorDashboardContent = (industry_type_id, placement = null) => {
  const params = { industry_type_id };
  if (placement) params.placement = placement;
  return api.get('/distributor/industry/dashboard-content', { params });
};

export const getDistributorIndustryTheme = (industry_type_id) =>
  api.get('/distributor/industry/theme', { params: { industry_type_id } });

export const getDistributorRelatedProducts = (industry_type_id, page = 1, limit = 10) =>
  api.get('/distributor/industry/related-products', { params: { industry_type_id, page, limit } });

export const trackContentEvent = (payload) => {
  try {
    const base = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:4000/admin-api';
    const data = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([data], { type: 'application/json' });
      navigator.sendBeacon(`${base}/industry-content/analytics/track`, blob);
    } else {
      api.post(`${base}/industry-content/analytics/track`, payload).catch(() => {});
    }
  } catch (_) {}
};
