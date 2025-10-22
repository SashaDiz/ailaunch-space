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
import AdminNav from "../components/admin/AdminNav";

function StatCard({
  icon: Icon,
  title,
  value,
  description,
  color = "primary",
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:border-[#ED0D79] transition duration-300 ease-in-out">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className="w-12 h-12 bg-[#ED0D79]/10 rounded-xl flex items-center justify-center">
          <Icon className="w-6 h-6 text-[#ED0D79]" />
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalProjects: 0,
    pendingProjects: 0,
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
          totalProjects: 0,
          pendingProjects: 0,
          totalVotes: 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch admin stats:", error);
      // Set default stats on error
      setStats({
        totalProjects: 0,
        pendingProjects: 0,
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <AdminNav />

        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-gray-900">Admin Panel</h1>
            <p className="text-gray-600">
              Review submissions, manage approvals, and monitor platform activity.
            </p>
          </div>
        </div>

        {loading ? (
          // Loading State
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
                >
                  <div className="animate-pulse">
                    <div className="skeleton h-4 w-20 mb-2"></div>
                    <div className="skeleton h-8 w-16 mb-2"></div>
                    <div className="skeleton h-3 w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Simple Analytics */}
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Platform Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  icon={Folder}
                  title="Total Submissions"
                  value={stats.totalProjects || 0}
                  description="All submitted AI projects"
                  color="primary"
                />
                <StatCard
                  icon={Clock}
                  title="Pending Review"
                  value={stats.pendingProjects || 0}
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
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Review & Approve</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:border-[#ED0D79] hover:shadow-md transition-all duration-300 ease-in-out">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-[#ED0D79]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <EditPencil className="w-6 h-6 text-[#ED0D79]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">Project Submissions</h3>
                        {stats.pendingProjects > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            {stats.pendingProjects} pending
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-4">
                        Review submitted AI projects, approve or reject submissions, and manage dofollow backlinks for competition winners.
                      </p>
                      <Link
                        href="/admin/projects"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#ED0D79] text-white font-semibold rounded-lg hover:bg-[#ED0D79]/90 transition duration-300 ease-in-out hover:scale-[1.02] shadow-sm text-sm"
                      >
                        {stats.pendingProjects > 0 
                          ? `Review ${stats.pendingProjects} Pending` 
                          : "Manage Submissions"
                        }
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:border-[#ED0D79] hover:shadow-md transition-all duration-300 ease-in-out">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">Winner Badge Management</h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">
                        Select and manage weekly competition winners, assign 1st, 2nd, and 3rd place badges, and verify backlink placements for dofollow links.
                      </p>
                      <Link
                        href="/admin/projects?tab=winners"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition duration-300 ease-in-out hover:scale-[1.02] shadow-sm text-sm"
                      >
                        Manage Winners
                      </Link>
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
