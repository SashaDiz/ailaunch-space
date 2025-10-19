"use client";

import { useState, useEffect } from "react";
import { useUser } from "./useUser";

export function useUserStats() {
  const { user } = useUser();
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    totalVotes: 0,
    totalViews: 0,
    totalClicks: 0,
    bestRank: null,
    weeklyWins: 0,
    liveProjects: 0,
    pendingProjects: 0,
    loading: true,
    error: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/user?type=stats", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success) {
          setStats({
            ...result.data,
            loading: false,
            error: null,
          });
        } else {
          throw new Error(result.error || "Failed to fetch user stats");
        }
      } catch (err) {
        console.error("Error fetching user stats:", err);
        setError(err.message);
        setStats(prev => ({ ...prev, loading: false, error: err.message }));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.id]);

  const refetch = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/user?type=stats", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setStats({
          ...result.data,
          loading: false,
          error: null,
        });
      } else {
        throw new Error(result.error || "Failed to fetch user stats");
      }
    } catch (err) {
      console.error("Error fetching user stats:", err);
      setError(err.message);
      setStats(prev => ({ ...prev, loading: false, error: err.message }));
    } finally {
      setLoading(false);
    }
  };

  return {
    ...stats,
    loading,
    error,
    refetch,
  };
}
