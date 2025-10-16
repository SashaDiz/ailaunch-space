"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "../../hooks/useUser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  NavArrowLeft,
  Search,
  FilterAlt,
  CheckCircle,
  XmarkCircle,
  Clock,
  Crown,
  OpenNewWindow,
} from "iconoir-react";
import toast from "react-hot-toast";
import WinnerBadge from "../../components/WinnerBadge";
import { WinnerEmbedButton } from "../../components/WinnerEmbed";

// Helper function to generate directory link with ref parameter and proper rel attribute
const generateDirectoryLink = (directory) => {
  // Add ref parameter as per CLAUDE.md spec
  const url = new URL(directory.website_url);
  url.searchParams.set('ref', 'ailaunchspace');
  
  // Use link_type field from database
  // - "dofollow": Premium plans, weekly winners, or manually upgraded
  // - "nofollow": Standard (FREE) plans by default
  const isDofollow = directory.link_type === "dofollow";
  
  return {
    url: url.toString(),
    rel: isDofollow ? "noopener noreferrer" : "nofollow noopener noreferrer"
  };
};

function DirectoryRow({ directory, onStatusUpdate }) {
  const [updating, setUpdating] = useState(false);
  const [togglingLinkType, setTogglingLinkType] = useState(false);
  const [currentLinkType, setCurrentLinkType] = useState(directory.link_type || "nofollow");
  const [updatingWinnerBadge, setUpdatingWinnerBadge] = useState(false);
  const [currentWinnerPosition, setCurrentWinnerPosition] = useState(directory.weekly_position || null);

  // Generate directory link data once for use in multiple places
  const directoryLink = generateDirectoryLink(directory);

  const handleVisitWebsite = async () => {
    // Track click analytics
    try {
      await fetch(`/api/directories/${directory.slug}/click`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to track click:", error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "live":
        return <span className="badge badge-success badge-sm">Live</span>;
      case "pending":
        return <span className="badge badge-warning badge-sm">Pending</span>;
      case "rejected":
        return <span className="badge badge-error badge-sm">Rejected</span>;
      case "scheduled":
        return <span className="badge badge-info badge-sm">Scheduled</span>;
      case "approved":
        return <span className="badge badge-primary badge-sm">Approved</span>;
      case "archived":
        return <span className="badge badge-neutral badge-sm">Archived</span>;
      default:
        return <span className="badge badge-neutral badge-sm">{status}</span>;
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      // For approval/rejection, use the dedicated endpoint with email notifications
      if (newStatus === "live" || newStatus === "rejected") {
        const action = newStatus === "live" ? "approve" : "reject";
        let rejectionReason = "";

        // If rejecting, prompt for reason
        if (action === "reject") {
          rejectionReason = prompt("Please provide a reason for rejection:");
          if (!rejectionReason) {
            toast.error("Rejection reason is required");
            setUpdating(false);
            return;
          }
        }

        const response = await fetch("/api/admin?action=approve-directory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            directoryId: directory.id,
            action,
            rejectionReason,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          toast.success(
            `AI project ${action === "approve" ? "approved" : "rejected"} successfully! ${
              data.data.emailSent ? "Email notification sent." : ""
            }`
          );
          onStatusUpdate(directory.id, newStatus);
        } else {
          throw new Error(data.error || "Failed to update status");
        }
      } else {
        // For other status updates, use the regular endpoint
        const response = await fetch(`/api/admin/directories/${directory.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (response.ok) {
          toast.success(`Directory status updated to ${newStatus}`);
          onStatusUpdate(directory.id, newStatus);
        } else {
          throw new Error("Failed to update status");
        }
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error(error.message || "Failed to update directory status");
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleLinkType = async () => {
    setTogglingLinkType(true);
    try {
      const response = await fetch("/api/admin?action=link-type", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          action: "toggle",
          directoryId: directory.id 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentLinkType(data.directory.link_type);
        toast.success(`Link type changed to ${data.directory.link_type}`);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to toggle link type");
      }
    } catch (error) {
      console.error("Link type toggle error:", error);
      toast.error(error.message || "Failed to toggle link type");
    } finally {
      setTogglingLinkType(false);
    }
  };

  const handleWinnerBadgeUpdate = async (position) => {
    setUpdatingWinnerBadge(true);
    try {
      const response = await fetch("/api/admin?action=winner-badge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          action: "update",
          directoryId: directory.id,
          weekly_position: position
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentWinnerPosition(data.directory.weekly_position);
        toast.success(
          position 
            ? `Winner badge updated to ${position}${position === 1 ? 'st' : position === 2 ? 'nd' : 'rd'} place` 
            : "Winner badge removed"
        );
        onStatusUpdate(directory.id, directory.status); // Trigger refresh
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update winner badge");
      }
    } catch (error) {
      console.error("Winner badge update error:", error);
      toast.error(error.message || "Failed to update winner badge");
    } finally {
      setUpdatingWinnerBadge(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "N/A";
    }
  };

  return (
    <tr className="hover:bg-base-200/50">
      <td>
        <div className="flex items-center space-x-3">
          <div className="avatar">
            <div className="w-10 h-10 rounded-lg border border-base-300">
              <Image
                src={directory.logo_url || "/placeholder-logo.png"}
                alt={`${directory.name} logo`}
                width={40}
                height={40}
                className="rounded-lg object-cover"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold">{directory.name}</span>
              {directory.premium_badge && (
                <Crown className="w-4 h-4 text-warning" />
              )}
            </div>
            <p className="text-sm text-base-content/60 truncate max-w-xs">
              {directory.short_description}
            </p>
          </div>
        </div>
      </td>
      <td>{getStatusBadge(directory.status)}</td>
      <td>
        <div className="flex flex-col gap-1">
          <span className="badge badge-outline badge-sm">{directory.plan}</span>
          <button
            onClick={handleToggleLinkType}
            disabled={togglingLinkType}
            className={`badge badge-sm cursor-pointer transition-colors ${
              currentLinkType === "dofollow"
                ? "badge-success"
                : "badge-ghost"
            }`}
            title="Click to toggle link type"
          >
            {currentLinkType === "dofollow" ? "✓ Dofollow" : "Nofollow"}
          </button>
          {directory.dofollow_reason && (
            <span className="text-xs text-base-content/60">
              {directory.dofollow_reason === "weekly_winner" && "🏆 Winner"}
              {directory.dofollow_reason === "manual_upgrade" && "✋ Manual"}
              {directory.dofollow_reason === "premium_plan" && "💎 Premium"}
            </span>
          )}
        </div>
      </td>
      <td>
        <div className="flex flex-col gap-2">
          {/* Current Winner Badge Display */}
          {currentWinnerPosition && (
            <WinnerBadge position={currentWinnerPosition} size="xs" />
          )}
          
          {/* Winner Badge Management */}
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => handleWinnerBadgeUpdate(1)}
              disabled={updatingWinnerBadge}
              className={`btn btn-xs ${
                currentWinnerPosition === 1 ? "btn-primary" : "btn-ghost"
              }`}
              title="Set as 1st place winner"
            >
              1st
            </button>
            <button
              onClick={() => handleWinnerBadgeUpdate(2)}
              disabled={updatingWinnerBadge}
              className={`btn btn-xs ${
                currentWinnerPosition === 2 ? "btn-primary" : "btn-ghost"
              }`}
              title="Set as 2nd place winner"
            >
              2nd
            </button>
            <button
              onClick={() => handleWinnerBadgeUpdate(3)}
              disabled={updatingWinnerBadge}
              className={`btn btn-xs ${
                currentWinnerPosition === 3 ? "btn-primary" : "btn-ghost"
              }`}
              title="Set as 3rd place winner"
            >
              3rd
            </button>
            <button
              onClick={() => handleWinnerBadgeUpdate(null)}
              disabled={updatingWinnerBadge}
              className="btn btn-xs btn-ghost"
              title="Remove winner badge"
            >
              ✕
            </button>
            
            {/* Embed Button - Only show for winners */}
            {currentWinnerPosition && (
              <WinnerEmbedButton
                position={currentWinnerPosition}
                directoryName={directory.name}
                directorySlug={directory.slug}
                className="btn-xs"
              />
            )}
          </div>
          
          {updatingWinnerBadge && (
            <span className="text-xs text-base-content/60">Updating...</span>
          )}
        </div>
      </td>
      <td>
        <div className="text-sm">
          <div>{directory.upvotes} votes</div>
          <div className="text-base-content/60">{directory.views} views</div>
        </div>
      </td>
      <td>
        <div className="text-sm text-base-content/60">
          {formatDate(directory.created_at || directory.createdAt || directory.submitted_at)}
        </div>
      </td>
      <td>
        <div className="flex items-center space-x-2">
          {/* Quick Actions */}
          {directory.status === "pending" && (
            <>
              <button
                onClick={() => handleStatusUpdate("live")}
                disabled={updating}
                className="btn btn-success btn-xs"
                title="Approve"
              >
                {updating ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <CheckCircle className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => handleStatusUpdate("rejected")}
                disabled={updating}
                className="btn btn-error btn-xs"
                title="Reject"
              >
                <XmarkCircle className="w-3 h-3" />
              </button>
            </>
          )}

          {/* Quick External Link */}
          <Link
            href={directoryLink.url}
            target="_blank"
            rel={directoryLink.rel}
            className="btn btn-ghost btn-xs"
            title="Visit Website"
            onClick={handleVisitWebsite}
          >
            <OpenNewWindow className="w-4 h-4" />
          </Link>
        </div>
      </td>
    </tr>
  );
}

export default function AdminDirectoriesPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [directories, setDirectories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    totalCount: 0,
    totalPages: 0,
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/auth/signin?callbackUrl=/admin/directories");
      return;
    }

    checkAdminAccess();
  }, [user, authLoading, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchDirectories();
    }
  }, [
    isAdmin,
    pagination.page,
    statusFilter,
    planFilter,
    search,
  ]);

  const checkAdminAccess = async () => {
    try {
      const response = await fetch("/api/admin");
      if (response.ok) {
        setIsAdmin(true);
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

  const fetchDirectories = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        type: "directories",
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (statusFilter !== "all") params.set("status", statusFilter);
      if (planFilter !== "all") params.set("plan", planFilter);
      if (search.trim()) params.set("search", search.trim());

      const response = await fetch(
        `/api/admin?${params.toString()}`
      );
      if (response.ok) {
        const data = await response.json();
        setDirectories(data.data.directories || []);
        setPagination(data.data.pagination || pagination);
      } else {
        toast.error("Failed to load directories");
      }
    } catch (error) {
      console.error("Failed to fetch directories:", error);
      toast.error("Failed to load directories");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = (directoryId, newStatus) => {
    setDirectories(
      directories.map((dir) =>
        dir.id === directoryId ? { ...dir, status: newStatus } : dir
      )
    );
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  if (authLoading || (user && !isAdmin)) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <Link href="/admin" className="btn btn-ghost btn-sm">
                  <NavArrowLeft className="w-4 h-4 mr-2" />
                  Back to Admin
                </Link>
              </div>
              <h1 className="text-3xl font-bold mb-2">AI Projects Management</h1>
              <p className="text-base-content/70">
                Review, approve, and manage AI project submissions.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card bg-base-100 shadow-sm border border-base-300 mb-6">
          <div className="card-body p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="form-control">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search directories..."
                    className="input input-bordered w-full pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="form-control">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="select select-bordered w-full"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending Review</option>
                  <option value="live">Live</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Plan Filter */}
              <div className="form-control">
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="select select-bordered w-full"
                >
                  <option value="all">All Plans</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              {/* Quick Actions */}
              <div className="form-control">
                <button
                  onClick={() => fetchDirectories()}
                  className="btn btn-primary"
                >
                  <FilterAlt className="w-4 h-4 mr-2" />
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-0">
            {/* Stats Bar */}
            <div className="p-6 border-b border-base-300">
              <div className="flex items-center justify-between">
                <div className="text-sm text-base-content/60">
                  Showing {directories.length} of {pagination.totalCount}{" "}
                  directories
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-warning" />
                    {
                      directories.filter((d) => d.status === "pending").length
                    }{" "}
                    pending
                  </span>
                  <span className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1 text-success" />
                    {directories.filter((d) => d.status === "live").length} live
                  </span>
                </div>
              </div>
            </div>

            {loading ? (
              // Loading State
              <div className="p-6">
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse flex items-center space-x-4"
                    >
                      <div className="skeleton w-10 h-10 rounded-lg"></div>
                      <div className="space-y-2">
                        <div className="skeleton h-4 w-48"></div>
                        <div className="skeleton h-3 w-32"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : directories.length > 0 ? (
              <>
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>Directory</th>
                        <th>Status</th>
                        <th>Plan</th>
                        <th>Winner Badge</th>
                        <th>Performance</th>
                        <th>Submitted</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {directories.map((directory) => (
                        <DirectoryRow
                          key={directory.id}
                          directory={directory}
                          onStatusUpdate={handleStatusUpdate}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="p-6 border-t border-base-300">
                    <div className="flex items-center justify-center">
                      <div className="join">
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page <= 1}
                          className="join-item btn btn-outline"
                        >
                          «
                        </button>

                        {[...Array(Math.min(5, pagination.totalPages))].map(
                          (_, i) => {
                            const page = i + 1;
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`join-item btn ${
                                  page === pagination.page
                                    ? "btn-active"
                                    : "btn-outline"
                                }`}
                              >
                                {page}
                              </button>
                            );
                          }
                        )}

                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page >= pagination.totalPages}
                          className="join-item btn btn-outline"
                        >
                          »
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Empty State
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto bg-base-200 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-base-content/30" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  No directories found
                </h3>
                <p className="text-base-content/60">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
