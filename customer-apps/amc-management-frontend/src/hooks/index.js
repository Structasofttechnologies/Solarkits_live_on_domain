// src/hooks/index.js
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ─── useDebounce ───────────────────────────────────────────────
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// ─── useLocalStorage ──────────────────────────────────────────
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};

// ─── usePagination ────────────────────────────────────────────
export const usePagination = (data = [], pageSize = 20) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, currentPage, pageSize]);

  const goToPage = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);

  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  return {
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
};

// ─── useToast ─────────────────────────────────────────────────
let toastIdCounter = 0;
let toastListeners = [];
const toastStore = { toasts: [] };

export const useToast = () => {
  const [toasts, setToasts] = useState(toastStore.toasts);

  useEffect(() => {
    const listener = (t) => setToasts([...t]);
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  }, []);

  const addToast = useCallback((type, message, duration = 4000) => {
    const id = ++toastIdCounter;
    const toast = { id, type, message, duration };
    toastStore.toasts = [...toastStore.toasts, toast];
    toastListeners.forEach(l => l(toastStore.toasts));

    if (duration > 0) {
      setTimeout(() => {
        toastStore.toasts = toastStore.toasts.filter(t => t.id !== id);
        toastListeners.forEach(l => l(toastStore.toasts));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    toastStore.toasts = toastStore.toasts.filter(t => t.id !== id);
    toastListeners.forEach(l => l(toastStore.toasts));
  }, []);

  return {
    toasts,
    success: (msg, dur) => addToast('success', msg, dur),
    error: (msg, dur) => addToast('error', msg, dur),
    warning: (msg, dur) => addToast('warning', msg, dur),
    info: (msg, dur) => addToast('info', msg, dur),
    removeToast,
  };
};

// Standalone toast function for use outside components
export const toast = {
  success: (msg, dur) => {
    const id = ++toastIdCounter;
    const t = { id, type: 'success', message: msg, duration: dur || 4000 };
    toastStore.toasts = [...toastStore.toasts, t];
    toastListeners.forEach(l => l(toastStore.toasts));
    if ((dur || 4000) > 0) {
      setTimeout(() => {
        toastStore.toasts = toastStore.toasts.filter(x => x.id !== id);
        toastListeners.forEach(l => l(toastStore.toasts));
      }, dur || 4000);
    }
  },
  error: (msg, dur) => {
    const id = ++toastIdCounter;
    const t = { id, type: 'error', message: msg, duration: dur || 5000 };
    toastStore.toasts = [...toastStore.toasts, t];
    toastListeners.forEach(l => l(toastStore.toasts));
    if ((dur || 5000) > 0) {
      setTimeout(() => {
        toastStore.toasts = toastStore.toasts.filter(x => x.id !== id);
        toastListeners.forEach(l => l(toastStore.toasts));
      }, dur || 5000);
    }
  },
  warning: (msg, dur) => {
    const id = ++toastIdCounter;
    const t = { id, type: 'warning', message: msg, duration: dur || 4000 };
    toastStore.toasts = [...toastStore.toasts, t];
    toastListeners.forEach(l => l(toastStore.toasts));
    if ((dur || 4000) > 0) {
      setTimeout(() => {
        toastStore.toasts = toastStore.toasts.filter(x => x.id !== id);
        toastListeners.forEach(l => l(toastStore.toasts));
      }, dur || 4000);
    }
  },
  info: (msg, dur) => {
    const id = ++toastIdCounter;
    const t = { id, type: 'info', message: msg, duration: dur || 4000 };
    toastStore.toasts = [...toastStore.toasts, t];
    toastListeners.forEach(l => l(toastStore.toasts));
    if ((dur || 4000) > 0) {
      setTimeout(() => {
        toastStore.toasts = toastStore.toasts.filter(x => x.id !== id);
        toastListeners.forEach(l => l(toastStore.toasts));
      }, dur || 4000);
    }
  },
};

// ─── useClickOutside ──────────────────────────────────────────
export const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler(e);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

// ─── useMediaQuery ────────────────────────────────────────────
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return matches;
};

export const useIsMobile = () => useMediaQuery('(max-width: 768px)');
export const useIsTablet = () => useMediaQuery('(max-width: 1024px)');

// ─── useSearch ────────────────────────────────────────────────
export const useSearch = (data, searchKeys, searchTerm) => {
  const debouncedTerm = useDebounce(searchTerm, 250);
  
  return useMemo(() => {
    if (!debouncedTerm) return data;
    const lower = debouncedTerm.toLowerCase();
    return data.filter(item =>
      searchKeys.some(key => {
        const val = key.split('.').reduce((obj, k) => obj?.[k], item);
        return String(val || '').toLowerCase().includes(lower);
      })
    );
  }, [data, searchKeys, debouncedTerm]);
};

// ─── useSortable ──────────────────────────────────────────────
export const useSortable = (data) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      const aVal = sortConfig.key.split('.').reduce((obj, k) => obj?.[k], a);
      const bVal = sortConfig.key.split('.').reduce((obj, k) => obj?.[k], b);
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });
  }, [data, sortConfig]);

  const requestSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  return { sortedData, sortConfig, requestSort };
};
