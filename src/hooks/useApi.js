import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";

/**
 * Custom hook for making API calls with authentication
 */
export function useApi(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getToken, userId } = useAuth();

  // Use ref to store latest options without causing re-renders
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Create stable reference for options
  const optionsKey = JSON.stringify(options);

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
        setLoading(true);
        setError(null);

        const token = await getToken();

        const response = await fetch(`/api${endpoint}`, {
          ...optionsRef.current,
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(userId && { "x-clerk-user-id": userId }),
            ...optionsRef.current.headers,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error(`API Error (${endpoint}):`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [endpoint, optionsKey, getToken, userId]); // Use optionsKey for dependency

  return {
    data,
    loading,
    error,
    refetch: useCallback(async () => {
      if (!endpoint) return;

      try {
        setLoading(true);
        setError(null);

        const token = await getToken();

        const response = await fetch(`/api${endpoint}`, {
          ...optionsRef.current,
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(userId && { "x-clerk-user-id": userId }),
            ...optionsRef.current.headers,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();
        setData(result);
        return result;
      } catch (err) {
        console.error(`API Error (${endpoint}):`, err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    }, [endpoint, getToken, userId]),
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
  const { getToken, userId } = useAuth();

  // Fetch user's voted apps on mount
  useEffect(() => {
    if (!userId) return;

    const fetchVotedApps = async () => {
      try {
        const token = await getToken();
        const response = await fetch("/api/user/votes", {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(userId && { "x-clerk-user-id": userId }),
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.voted_apps) {
            setVotedApps(new Set(result.voted_apps));
          }
        }
      } catch (error) {
        console.error("Error fetching voted apps:", error);
      }
    };

    fetchVotedApps();
  }, [userId, getToken]);

  const vote = useCallback(
    async (appSlug, appId) => {
      setVotingLoading((prev) => {
        if (prev.has(appId)) return prev; // Already voting, don't proceed
        return new Set(prev).add(appId);
      });

      try {
        const token = await getToken();

        const response = await fetch(`/api/apps?slug=${appSlug}&action=vote`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(userId && { "x-clerk-user-id": userId }),
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();

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
    [getToken, userId] // Stable dependencies only
  );

  return {
    vote,
    votingLoading,
    votedApps,
    setVotedApps,
  };
}
