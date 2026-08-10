// src/utils/formatters.js
import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

// ─── Currency Formatting ────────────────────────────────────────
export const formatCurrency = (amount, decimals = 0) => {
  if (amount === null || amount === undefined) return '—';
  const num = Number(amount);
  if (isNaN(num)) return '—';
  
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)}Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(decimals === 0 ? 1 : decimals)}L`;
  }
  if (num >= 1000) {
    return `₹${(num / 1000).toFixed(decimals === 0 ? 1 : decimals)}K`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
};

export const formatCurrencyFull = (amount) => {
  if (amount === null || amount === undefined) return '—';
  const num = Number(amount);
  if (isNaN(num)) return '—';
  return `₹${num.toLocaleString('en-IN')}`;
};

// ─── Number Formatting ─────────────────────────────────────────
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '—';
  return Number(num).toLocaleString('en-IN');
};

export const formatCapacity = (kw) => {
  if (!kw) return '—';
  if (kw >= 1000) {
    return `${(kw / 1000).toFixed(kw % 1000 === 0 ? 0 : 2)} MW`;
  }
  return `${kw} kWp`;
};

export const formatEnergy = (kwh) => {
  if (!kwh) return '—';
  if (kwh >= 1000) {
    return `${(kwh / 1000).toFixed(2)} MWh`;
  }
  return `${kwh.toFixed(1)} kWh`;
};

export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '—';
  return `${Number(value).toFixed(decimals)}%`;
};

// ─── Date Formatting ───────────────────────────────────────────
export const formatDate = (date, fmt = 'dd MMM yyyy') => {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '—';
    return format(d, fmt);
  } catch {
    return '—';
  }
};

export const formatDateTime = (date) => {
  return formatDate(date, 'dd MMM yyyy, hh:mm a');
};

export const formatTime = (date) => {
  return formatDate(date, 'hh:mm a');
};

export const formatRelativeTime = (date) => {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '—';
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return '—';
  }
};

export const formatDateShort = (date) => {
  return formatDate(date, 'dd/MM/yyyy');
};

// ─── Status Formatting ─────────────────────────────────────────
export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
};

export const formatStatus = (status) => {
  if (!status) return '';
  return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

// ─── Truncation ────────────────────────────────────────────────
export const truncate = (str, maxLength = 30) => {
  if (!str) return '';
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
};

// ─── Initials ─────────────────────────────────────────────────
export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// ─── Phone ────────────────────────────────────────────────────
export const formatPhone = (phone) => {
  if (!phone) return '—';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.substring(0, 5)}-${cleaned.substring(5)}`;
  }
  return phone;
};

// ─── Trend ────────────────────────────────────────────────────
export const formatTrend = (value) => {
  if (!value && value !== 0) return '';
  const isPositive = value > 0;
  return `${isPositive ? '+' : ''}${value.toFixed(1)}%`;
};

// ─── File Size ────────────────────────────────────────────────
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

// ─── GST Number Masking ────────────────────────────────────────
export const maskGST = (gst) => {
  if (!gst || gst.length < 6) return gst;
  return `${gst.substring(0, 6)}${'*'.repeat(gst.length - 10)}${gst.substring(gst.length - 4)}`;
};

// ─── SLA Remaining ────────────────────────────────────────────
export const getSLAStatus = (dueDate, resolvedAt) => {
  if (resolvedAt) return 'resolved';
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due - now;
  if (diff < 0) return 'breached';
  if (diff < 2 * 60 * 60 * 1000) return 'at_risk'; // < 2 hours
  if (diff < 24 * 60 * 60 * 1000) return 'warning'; // < 24 hours
  return 'on_track';
};

// ─── Color Helpers ─────────────────────────────────────────────
export const getTrendColor = (value) => {
  if (!value && value !== 0) return 'text-text-secondary';
  return value > 0 ? 'text-success' : 'text-danger';
};

export const getHealthColor = (score) => {
  if (score >= 90) return 'text-success';
  if (score >= 70) return 'text-warning';
  return 'text-danger';
};
