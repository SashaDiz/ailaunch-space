"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "../hooks/useUser";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Eye,
  EditPencil,
  OpenNewWindow,
  Trophy,
  Crown,
  Group,
  StatsReport,
} from "iconoir-react";
import toast from "react-hot-toast";

function StatsCard({ icon: Icon, title, value, description, className = "" }) {
  return (
    <div
      className={`card bg-base-100 shadow-sm border border-base-300 ${className}`}
    >
      <div className="card-body p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base-content/60 text-sm">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
            {description && (
              <p className="text-xs text-base-content/50">{description}</p>
            )}
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DirectoryCard({ directory, onResumeDraft }) {
  const getStatusBadge = (status, isDraft) => {
    if (isDraft) {
      return <span className="badge badge-ghost badge-sm">Draft</span>;
    }
    switch (status) {
      case "live":
        return <span className="badge badge-success badge-sm">Live</span>;
      case "pending":
        return (
          <span className="badge badge-warning badge-sm">Under Review</span>
        );
      case "rejected":
        return <span className="badge badge-error badge-sm">Rejected</span>;
      case "scheduled":
        return <span className="badge badge-info badge-sm">Scheduled</span>;
      case "approved":
        return <span className="badge badge-primary badge-sm">Approved</span>;
      case "archived":
        return <span className="badge badge-neutral badge-sm">Archived</span>;
      case "draft":
        return <span className="badge badge-ghost badge-sm">Draft</span>;
      default:
        return <span className="badge badge-neutral badge-sm">{status}</span>;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleCardClick = (e) => {
    // Prevent navigation if clicking on interactive elements
    if (
      e.target.closest("button") ||
      e.target.closest("select") ||
      e.target.closest(".dropdown")
    ) {
      return;
    }
    
    // Don't navigate for drafts - they should use "Resume Draft" button
    if (directory.is_draft || directory.status === "draft") {
      return;
    }
    
    window.location.href = `/directory/${directory.slug}`;
  };

  const handleEditClick = () => {
    // Check if editing is allowed for this directory
    if (directory.status !== "scheduled") {
      toast.error("Editing is only allowed for scheduled directories");
      return;
    }

    // Redirect to dedicated edit page
    window.location.href = `/edit/${directory.slug}`;
  };
  
  const handleResumeDraft = () => {
    if (onResumeDraft) {
      onResumeDraft(directory);
    }
  };
  
  const handleDeleteDraft = async () => {
    if (!confirm("Are you sure you want to delete this draft?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/directories?id=${directory.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (response.ok) {
        toast.success("Draft deleted successfully");
        window.location.reload();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete draft");
      }
    } catch (error) {
      console.error("Error deleting draft:", error);
      toast.error("Failed to delete draft");
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  return (
    <div className="block">
      <div
        className="w-full bg-white rounded-2xl border border-gray-200 p-6 group cursor-pointer transition duration-300 ease-in-out hover:border-gray-900 hover:shadow-[0_6px_0_rgba(0,0,0,1)] hover:-translate-y-1.5"
        onClick={handleCardClick}
      >
        {/* Header: Logo, Title, and Actions */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-16 h-16 border rounded-2xl border-gray-300 overflow-hidden flex-shrink-0">
              <Image
                src={directory.logo_url}
                alt={`${directory.name} logo`}
                width={64}
                height={64}
                className="rounded-2xl object-cover w-full h-full"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {directory.name}
                </h3>
                {directory.premium_badge && (
                  <Crown className="w-4 h-4 text-amber-500" />
                )}
                {getStatusBadge(directory.status, directory.is_draft)}
              </div>
              <p className="text-sm text-gray-600">
                Launched {formatDate(directory.launch_date)}
              </p>
            </div>
          </div>

          {/* Dropdown Menu */}
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-sm hover:bg-gray-100"
            >
              <EditPencil className="w-4 h-4" />
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu p-2 shadow-lg bg-white rounded-xl w-52 border border-gray-200"
            >
              {!directory.is_draft && directory.status !== "draft" && (
                <li>
                  <Link
                    href={`/directory/${directory.slug}`}
                    className="hover:bg-gray-50"
                  >
                    <OpenNewWindow className="w-4 h-4" />
                    View AI Project
                  </Link>
                </li>
              )}
              {(directory.is_draft || directory.status === "draft") && (
                <>
                  <li>
                    <button
                      className="hover:bg-gray-50"
                      onClick={handleResumeDraft}
                    >
                      <EditPencil className="w-4 h-4" />
                      Resume Draft
                    </button>
                  </li>
                  <li>
                    <button
                      className="hover:bg-gray-50 text-error"
                      onClick={handleDeleteDraft}
                    >
                      <Xmark className="w-4 h-4" />
                      Delete Draft
                    </button>
                  </li>
                </>
              )}
              {!directory.is_draft && directory.status === "scheduled" && (
                <li>
                  <button
                    className="hover:bg-gray-50"
                    onClick={handleEditClick}
                  >
                    <EditPencil className="w-4 h-4" />
                    Edit Details
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700 mb-4 line-clamp-2">
          {directory.short_description}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center text-blue-600 mb-1">
              <Plus className="w-4 h-4 mr-1" />
              <span className="font-semibold text-gray-900">
                {formatNumber(directory.upvotes || 0)}
              </span>
            </div>
            <p className="text-xs text-gray-500">Votes</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center text-green-600 mb-1">
              <Eye className="w-4 h-4 mr-1" />
              <span className="font-semibold text-gray-900">
                {formatNumber(directory.views || 0)}
              </span>
            </div>
            <p className="text-xs text-gray-500">Views</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center text-purple-600 mb-1">
              <OpenNewWindow className="w-4 h-4 mr-1" />
              <span className="font-semibold text-gray-900">
                {formatNumber(directory.clicks || 0)}
              </span>
            </div>
            <p className="text-xs text-gray-500">Clicks</p>
          </div>
        </div>

        {/* Draft Actions - Only for drafts */}
        {(directory.is_draft || directory.status === "draft") && (
          <div className="pt-4 border-t border-gray-200">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-amber-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">
                    Draft saved
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    {directory.plan === "premium"
                      ? "Complete payment to submit your premium launch and get guaranteed dofollow backlinks."
                      : "This submission is saved as a draft. Complete it to launch your project."}
                  </p>
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={handleResumeDraft}
                      className="btn btn-sm btn-primary"
                    >
                      Resume Draft
                    </button>
                    <button
                      onClick={handleDeleteDraft}
                      className="btn btn-sm btn-ghost btn-error"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Competition Rankings - Only for live directories */}
        {directory.status === "live" && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Competition Rank:</span>
              <div className="flex items-center space-x-2">
                {directory.weekly_position ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    W#{directory.weekly_position}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">Competing...</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [directories, setDirectories] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "overview"
  );

  const handleResumeDraft = (directory) => {
    // Redirect to submit page with draft data pre-filled
    // Store draft data in sessionStorage so submit page can load it
    sessionStorage.setItem("resumeDraft", JSON.stringify(directory));
    router.push("/submit?draft=" + directory.id);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/auth/signin?callbackUrl=/dashboard");
      return;
    }

    if (user) {
      fetchDashboardData();
    }
  }, [user, authLoading, router]);

  // Update active tab when URL changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch user's directories
      const directoriesResponse = await fetch("/api/user?type=directories", {
        method: "GET",
        credentials: "include",
      });
      if (directoriesResponse.ok) {
        const directoriesData = await directoriesResponse.json();
        console.log(
          "User directories received:",
          directoriesData.data.directories
        );
        setDirectories(directoriesData.data.directories || []);
      }

      // Fetch user stats
      const statsResponse = await fetch("/api/user?type=stats", {
        method: "GET",
        credentials: "include",
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log("User stats received:", statsData.data);
        setStats(statsData.data || {});
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!user) {
    return null; // Redirecting...
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.user_metadata?.name?.split(" ")[0] || user?.email?.split("@")[0] || "Creator"}!
              </h1>
              <p className="text-base-content/70">
                Manage your AI projects and track your launch performance.
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link href="/submit" className="btn btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Submit New AI Project
              </Link>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-base-300 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "overview"
                  ? "border-primary text-primary"
                  : "border-transparent text-base-content/60 hover:text-base-content hover:border-base-300"
              }`}
            >
              <StatsReport className="w-4 h-4 mr-2 inline" />
              Overview
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {loading ? (
          // Loading State
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="card bg-base-100 shadow-sm border border-base-300"
                >
                  <div className="card-body p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="skeleton w-12 h-12 rounded-lg"></div>
                        <div className="space-y-2">
                          <div className="skeleton h-4 w-32"></div>
                          <div className="skeleton h-3 w-24"></div>
                        </div>
                      </div>
                      <div className="skeleton h-12 w-full"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                icon={Group}
                title="Total AI Projects"
                value={directories.length}
                description="Submissions to date"
              />
              <StatsCard
                icon={Plus}
                title="Total Votes"
                value={formatNumber(stats.totalVotesReceived || 0)}
                description="Across all AI projects"
              />
              <StatsCard
                icon={Eye}
                title="Total Views"
                value={formatNumber(stats.totalViews || 0)}
                description="Profile page visits"
              />
              <StatsCard
                icon={Trophy}
                title="Best Rank"
                value={stats.bestRank ? `#${stats.bestRank}` : "N/A"}
                description="Highest competition rank"
              />
            </div>

            {/* AI Projects Section */}
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold">Your AI Projects</h2>
                <p className="text-base-content/60">
                  Manage and track your submitted AI projects
                </p>
              </div>

              {directories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {directories.map((directory) => (
                    <DirectoryCard 
                      key={directory.id} 
                      directory={directory} 
                      onResumeDraft={handleResumeDraft}
                    />
                  ))}
                </div>
              ) : (
                // Empty State
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto bg-base-200 rounded-full flex items-center justify-center mb-6">
                    <Plus className="w-12 h-12 text-base-content/30" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    No AI projects yet
                  </h3>
                  <p className="text-base-content/60 mb-6 max-w-md mx-auto">
                    Ready to launch your first AI project? Submit it now and
                    start building your audience and getting valuable backlinks.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                    <Link href="/submit" className="btn btn-primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Submit Your First AI Project
                    </Link>
                    <Link href="/directories" className="btn btn-outline">
                      Browse Examples
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
