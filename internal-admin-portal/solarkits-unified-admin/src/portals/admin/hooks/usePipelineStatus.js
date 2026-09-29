import { useState, useEffect, useCallback } from 'react';
import { fetchPipelineStatus } from '../api/pipelineApi';

export default function usePipelineStatus() {
  const [pipelineStatus, setPipelineStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const country = localStorage.getItem('selected_country_admin') || 'india';
      const data = await fetchPipelineStatus(country);
      if (data) {
        setPipelineStatus(data);
      }
    } catch (err) {
      console.warn('Failed to load pipeline status:', err);
    }
  }, []);

  useEffect(() => {
    refresh();

    // Re-check when window regains focus or when custom event fires
    const handleRefreshEvent = () => refresh();
    window.addEventListener('focus', handleRefreshEvent);
    window.addEventListener('pipeline-status-refresh', handleRefreshEvent);

    // Polling every 60s
    const timer = setInterval(refresh, 60000);

    return () => {
      window.removeEventListener('focus', handleRefreshEvent);
      window.removeEventListener('pipeline-status-refresh', handleRefreshEvent);
      clearInterval(timer);
    };
  }, [refresh]);

  return {
    pipelineStatus,
    loading,
    refreshPipelineStatus: refresh,
  };
}
