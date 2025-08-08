import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";

/**
 * Custom hook for making API calls with authentication
 */
export function useApi(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getToken, userId } = useAuth();

  const apiCall = useCallback(
    async (url, fetchOptions = {}) => {
      try {
        setLoading(true);
        setError(null);

        const token = await getToken();

        const response = await fetch(`/api${url}`, {
          ...fetchOptions,
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(userId && { "x-clerk-user-id": userId }),
            ...fetchOptions.headers,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();
        return result;
      } catch (err) {
        console.error(`API Error (${url}):`, err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getToken, userId]
  );

  useEffect(() => {
    if (!endpoint) return;

    async function fetchData() {
      try {
        const result = await apiCall(endpoint, options);
        setData(result);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchData();
  }, [endpoint, apiCall, options]);

  return {
    data,
    loading,
    error,
    refetch: useCallback(() => {
      if (endpoint) {
        return apiCall(endpoint, options).then(setData).catch(setError);
      }
    }, [endpoint, apiCall, options]),
    apiCall,
  };
}

/**
 * Hook for submitting data to APIs
 */
export function useApiMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { getToken, userId } = useAuth();

  const mutate = useCallback(
    async (endpoint, options = {}) => {
      try {
        setLoading(true);
        setError(null);

        const token = await getToken();

        const response = await fetch(`/api${endpoint}`, {
          method: "POST",
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(userId && { "x-clerk-user-id": userId }),
            ...options.headers,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();
        return result;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getToken, userId]
  );

  return { mutate, loading, error };
}

/**
 * Hook for voting on apps
 */
export function useVoting() {
  const [votingLoading, setVotingLoading] = useState(new Set());
  const [votedApps, setVotedApps] = useState(new Set());
  const { apiCall } = useApi();

  const vote = useCallback(
    async (appSlug, appId) => {
      if (votingLoading.has(appId)) return;

      setVotingLoading((prev) => new Set(prev).add(appId));

      try {
        const result = await apiCall(`/apps?slug=${appSlug}&action=vote`, {
          method: "POST",
        });

        if (result.success) {
          setVotedApps((prev) => new Set(prev).add(appId));
          return result;
        } else {
          throw new Error(result.error || "Failed to vote");
        }
      } catch (error) {
        console.error("Voting error:", error);
        throw error;
      } finally {
        setVotingLoading((prev) => {
          const newSet = new Set(prev);
          newSet.delete(appId);
          return newSet;
        });
      }
    },
    [apiCall, votingLoading]
  );

  return {
    vote,
    votingLoading,
    votedApps,
    setVotedApps,
  };
}
