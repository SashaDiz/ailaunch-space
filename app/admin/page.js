"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "../hooks/useUser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Folder,
  Clock,
  Plus,
  EditPencil,
  Trophy,
} from "iconoir-react";
import toast from "react-hot-toast";

function StatCard({
  icon: Icon,
  title,
  value,
  description,
  color = "primary",
}) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base-content/60 text-sm">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
            {description && (
              <p className="text-xs text-base-content/50">{description}</p>
            )}
          </div>
          <div
            className={`w-12 h-12 bg-${color}/10 rounded-full flex items-center justify-center`}
          >
            <Icon className={`w-6 h-6 text-${color}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalDirectories: 0,
    pendingDirectories: 0,
    totalVotes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/auth/signin?callbackUrl=/admin");
      return;
    }

    // Check if user has admin role
    checkAdminAccess();
  }, [user, authLoading, router]);

  const checkAdminAccess = async () => {
    try {
      const response = await fetch("/api/admin");
      if (response.ok) {
        setIsAdmin(true);
        fetchAdminStats();
      } else {
        toast.error("Access denied. Admin privileges required.");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Admin check failed:", error);
      toast.error("Access denied. Admin privileges required.");
      router.push("/dashboard");
    }
  };

  const fetchAdminStats = async () => {
    try {
      setLoading(true);

      // Fetch admin statistics
      const response = await fetch("/api/admin?type=stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data.data || {});
      } else {
        console.error("Failed to load admin statistics");
        // Set default stats on error
        setStats({
          totalDirectories: 0,
          pendingDirectories: 0,
          totalVotes: 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch admin stats:", error);
      // Set default stats on error
      setStats({
        totalDirectories: 0,
        pendingDirectories: 0,
        totalVotes: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (user && !isAdmin && loading)) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!user || (!isAdmin && !loading)) {
    return null; // Redirecting or access denied...
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
              <p className="text-base-content/70">
                Review submissions, manage approvals, and monitor platform activity.
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link href="/dashboard" className="btn btn-ghost btn-sm">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          // Loading State
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="card bg-base-100 shadow-sm border border-base-300"
                >
                  <div className="card-body p-6">
                    <div className="animate-pulse">
                      <div className="skeleton h-4 w-20 mb-2"></div>
                      <div className="skeleton h-8 w-16 mb-2"></div>
                      <div className="skeleton h-3 w-24"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Simple Analytics */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Platform Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  icon={Folder}
                  title="Total Submissions"
                  value={stats.totalDirectories || 0}
                  description="All submitted AI projects"
                  color="primary"
                />
                <StatCard
                  icon={Clock}
                  title="Pending Review"
                  value={stats.pendingDirectories || 0}
                  description="Awaiting approval"
                  color="warning"
                />
                <StatCard
                  icon={Plus}
                  title="Total Votes"
                  value={stats.totalVotes || 0}
                  description="Platform-wide votes"
                  color="success"
                />
              </div>
            </div>

            {/* Review Section */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Review & Approve</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card bg-base-100 shadow-sm border border-base-300 hover:shadow-md transition-all">
                  <div className="card-body p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <EditPencil className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">Project Submissions</h3>
                          {stats.pendingDirectories > 0 && (
                            <span className="badge badge-warning badge-sm">
                              {stats.pendingDirectories} pending
                            </span>
                          )}
                        </div>
                        <p className="text-base-content/70 text-sm mb-4">
                          Review submitted AI projects, approve or reject submissions, and manage dofollow backlinks for competition winners.
                        </p>
                        <Link
                          href="/admin/directories"
                          className="btn btn-primary btn-sm"
                        >
                          {stats.pendingDirectories > 0 
                            ? `Review ${stats.pendingDirectories} Pending` 
                            : "Manage Submissions"
                          }
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card bg-base-100 shadow-sm border border-base-300 hover:shadow-md transition-all">
                  <div className="card-body p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-6 h-6 text-warning" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">Winner Badge Management</h3>
                        </div>
                        <p className="text-base-content/70 text-sm mb-4">
                          Select and manage weekly competition winners, assign 1st, 2nd, and 3rd place badges, and verify backlink placements for dofollow links.
                        </p>
                        <Link
                          href="/admin/directories?tab=winners"
                          className="btn btn-warning btn-sm"
                        >
                          Manage Winners
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
