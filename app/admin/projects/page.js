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
  Trophy,
  Check,
  Hourglass,
} from "iconoir-react";
import toast from "react-hot-toast";
import WinnerBadge from "../../components/WinnerBadge";
import { WinnerEmbedButton } from "../../components/WinnerEmbed";
import AdminNav from "../../components/admin/AdminNav";
import CustomDropdown from "../../components/CustomDropdown";

// Helper function to generate project link with ref parameter and proper rel attribute
const generateProjectLink = (project) => {
  // Add ref parameter as per CLAUDE.md spec
  const url = new URL(project.website_url);
  url.searchParams.set('ref', 'ailaunchspace');
  
  // Use link_type field from database
  // - "dofollow": Premium plans, weekly winners, or manually upgraded
  // - "nofollow": Standard (FREE) plans by default
  const isDofollow = project.link_type === "dofollow";
  
  return {
    url: url.toString(),
    rel: isDofollow ? "noopener noreferrer" : "nofollow noopener noreferrer"
  };
};

function ProjectRow({ project, onStatusUpdate }) {
  const [updating, setUpdating] = useState(false);
  const [togglingLinkType, setTogglingLinkType] = useState(false);
  const [currentLinkType, setCurrentLinkType] = useState(project.link_type || "nofollow");
  const [updatingWinnerBadge, setUpdatingWinnerBadge] = useState(false);
  const [currentWinnerPosition, setCurrentWinnerPosition] = useState(project.weekly_position || null);

  // Generate project link data once for use in multiple places
  const projectLink = generateProjectLink(project);

  const handleVisitWebsite = async () => {
    // Track click analytics
    try {
      await fetch(`/api/projects/${project.slug}/click`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to track click:", error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "live":
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Live</span>;
      case "pending":
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Pending</span>;
      case "rejected":
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>;
      case "scheduled":
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Scheduled</span>;
      case "approved":
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#ED0D79]/10 text-[#ED0D79]">Approved</span>;
      case "archived":
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Archived</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
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

        const response = await fetch("/api/admin?action=approve-project", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId: project.id,
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
          onStatusUpdate(project.id, newStatus);
        } else {
          throw new Error(data.error || "Failed to update status");
        }
      } else {
        // For other status updates, use the regular endpoint
        const response = await fetch(`/api/admin?type=projects&id=${project.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (response.ok) {
          toast.success(`Project status updated to ${newStatus}`);
          onStatusUpdate(project.id, newStatus);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update status");
        }
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error(error.message || "Failed to update project status");
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
          projectId: project.id 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentLinkType(data.project.link_type);
        toast.success(`Link type changed to ${data.project.link_type}`);
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
          projectId: project.id,
          weekly_position: position
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentWinnerPosition(data.project.weekly_position);
        toast.success(
          position 
            ? `Winner badge updated to ${position}${position === 1 ? 'st' : position === 2 ? 'nd' : 'rd'} place` 
            : "Winner badge removed"
        );
        onStatusUpdate(project.id, project.status); // Trigger refresh
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
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <div className="avatar">
            <div className="w-10 h-10 rounded-lg border border-gray-300">
              <Image
                src={project.logo_url || "/placeholder-logo.png"}
                alt={`${project.name} logo`}
                width={40}
                height={40}
                className="rounded-lg object-cover"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-900">{project.name}</span>
            </div>
            <p className="text-sm text-gray-600 truncate max-w-xs">
              {project.short_description}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(project.status)}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{project.plan}</span>
          <button
            onClick={handleToggleLinkType}
            disabled={togglingLinkType}
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
              currentLinkType === "dofollow"
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
            title="Click to toggle link type"
          >
            {currentLinkType === "dofollow" ? "✓ Dofollow" : "Nofollow"}
          </button>
          {project.dofollow_reason && (
            <span className="text-xs text-gray-500">
              {project.dofollow_reason === "weekly_winner" && "🏆 Winner"}
              {project.dofollow_reason === "manual_upgrade" && "✋ Manual"}
              {project.dofollow_reason === "premium_plan" && "💎 Premium"}
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
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
              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors ${
                currentWinnerPosition === 1 ? "bg-[#ED0D79] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              title="Set as 1st place winner"
            >
              1st
            </button>
            <button
              onClick={() => handleWinnerBadgeUpdate(2)}
              disabled={updatingWinnerBadge}
              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors ${
                currentWinnerPosition === 2 ? "bg-[#ED0D79] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              title="Set as 2nd place winner"
            >
              2nd
            </button>
            <button
              onClick={() => handleWinnerBadgeUpdate(3)}
              disabled={updatingWinnerBadge}
              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors ${
                currentWinnerPosition === 3 ? "bg-[#ED0D79] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              title="Set as 3rd place winner"
            >
              3rd
            </button>
            <button
              onClick={() => handleWinnerBadgeUpdate(null)}
              disabled={updatingWinnerBadge}
              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              title="Remove winner badge"
            >
              ✕
            </button>
          </div>
          
          {updatingWinnerBadge && (
            <span className="text-xs text-gray-500">Updating...</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm">
          <div className="font-medium text-gray-900">{project.upvotes} votes</div>
          <div className="text-gray-500">{project.views} views</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">
          {formatDate(project.created_at || project.createdAt || project.submitted_at)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          {/* Quick Actions */}
          {project.status === "pending" && (
            <>
              <button
                onClick={() => handleStatusUpdate("live")}
                disabled={updating}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
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
                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
                title="Reject"
              >
                <XmarkCircle className="w-3 h-3" />
              </button>
            </>
          )}

          {/* Quick External Link */}
          <Link
            href={projectLink.url}
            target="_blank"
            rel={projectLink.rel}
            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
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

function ProjectMobileCard({ project, onStatusUpdate }) {
  const [updating, setUpdating] = useState(false);
  const [togglingLinkType, setTogglingLinkType] = useState(false);
  const [currentLinkType, setCurrentLinkType] = useState(project.link_type || "nofollow");
  const [updatingWinnerBadge, setUpdatingWinnerBadge] = useState(false);
  const [currentWinnerPosition, setCurrentWinnerPosition] = useState(project.weekly_position || null);

  // Generate project link data once for use in multiple places
  const projectLink = generateProjectLink(project);

  const handleVisitWebsite = async () => {
    // Track click analytics
    try {
      await fetch(`/api/projects/${project.slug}/click`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to track click:", error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "live":
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Live</span>;
      case "pending":
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Pending</span>;
      case "rejected":
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>;
      case "scheduled":
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Scheduled</span>;
      case "approved":
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#ED0D79]/10 text-[#ED0D79]">Approved</span>;
      case "archived":
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Archived</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
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

        const response = await fetch("/api/admin?action=approve-project", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId: project.id,
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
          onStatusUpdate(project.id, newStatus);
        } else {
          throw new Error(data.error || "Failed to update status");
        }
      } else {
        // For other status updates, use the regular endpoint
        const response = await fetch(`/api/admin?type=projects&id=${project.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (response.ok) {
          toast.success(`Project status updated to ${newStatus}`);
          onStatusUpdate(project.id, newStatus);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update status");
        }
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error(error.message || "Failed to update project status");
    } finally {
      setUpdating(false);
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
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
      {/* Header with logo and status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg border border-gray-300 overflow-hidden flex-shrink-0">
            <Image
              src={project.logo_url || "/placeholder-logo.png"}
              alt={`${project.name} logo`}
              width={48}
              height={48}
              className="rounded-lg object-cover w-full h-full"
            />
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-900">{project.name}</h3>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">
              {project.short_description}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          {getStatusBadge(project.status)}
          <div className="text-sm text-gray-500">
            {formatDate(project.created_at || project.createdAt || project.submitted_at)}
          </div>
        </div>
      </div>

      {/* Stats and plan info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-sm text-gray-500">Performance</div>
          <div className="font-medium text-gray-900">{project.upvotes} votes</div>
          <div className="text-sm text-gray-500">{project.views} views</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Plan</div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{project.plan}</span>
            <button
              onClick={() => setTogglingLinkType(!togglingLinkType)}
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                currentLinkType === "dofollow"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {currentLinkType === "dofollow" ? "✓ Dofollow" : "Nofollow"}
            </button>
          </div>
        </div>
      </div>

      {/* Winner badge section */}
      {currentWinnerPosition && (
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-2">Winner Badge</div>
          <WinnerBadge position={currentWinnerPosition} size="sm" />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {project.status === "pending" && (
          <>
            <button
              onClick={() => handleStatusUpdate("live")}
              disabled={updating}
              className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
            >
              {updating ? (
                <span className="loading loading-spinner loading-xs mr-2"></span>
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Approve
            </button>
            <button
              onClick={() => handleStatusUpdate("rejected")}
              disabled={updating}
              className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
            >
              <XmarkCircle className="w-4 h-4 mr-2" />
              Reject
            </button>
          </>
        )}

        <Link
          href={projectLink.url}
          target="_blank"
          rel={projectLink.rel}
          className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          onClick={handleVisitWebsite}
        >
          <OpenNewWindow className="w-4 h-4 mr-2" />
          Visit
        </Link>
      </div>
    </div>
  );
}

export default function AdminProjectsPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    totalCount: 0,
    totalPages: 0,
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/auth/signin?callbackUrl=/admin/projects");
      return;
    }

    checkAdminAccess();
  }, [user, authLoading, router]);

  // Handle URL parameters for tab switching
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get("tab");
    if (tab === "winners") {
      setActiveTab("winners");
    } else {
      setActiveTab("all");
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (isAdmin) {
      fetchProjects();
    }
  }, [
    isAdmin,
    pagination.page,
    statusFilter,
    planFilter,
    debouncedSearch,
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

  const fetchProjects = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        type: "projects",
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (statusFilter !== "all") params.set("status", statusFilter);
      if (planFilter !== "all") params.set("plan", planFilter);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

      const response = await fetch(
        `/api/admin?${params.toString()}`
      );
      if (response.ok) {
        const data = await response.json();
        setProjects(data.data.projects || []);
        setPagination(data.data.pagination || pagination);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to load projects");
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = (projectId, newStatus) => {
    setProjects(
      projects.map((project) =>
        project.id === projectId ? { ...project, status: newStatus } : project
      )
    );
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  // Filter projects based on active tab
  const filteredProjects = activeTab === "winners" 
    ? projects.filter(project => project.weekly_position && project.weekly_position >= 1 && project.weekly_position <= 3)
    : projects;

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <AdminNav />

        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-gray-900">AI Projects Management</h1>
            <p className="text-gray-600">
              Review, approve, and manage AI project submissions.
            </p>
          </div>
        </div>


        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
          <div className="p-4 sm:p-6">
            <div className="flex flex-nowrap items-center gap-3">
              {/* Search Input */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <label className="text-xs text-gray-500 whitespace-nowrap">Search:</label>
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search projects..."
                    className="w-full pl-7 pr-7 py-2 text-sm border border-gray-300 rounded-lg focus-visible:border-[#ED0D79] focus-visible:ring-1 focus-visible:ring-[#ED0D79]/20 focus-visible:outline-none"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 hover:text-gray-600"
                    >
                      <XmarkCircle className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 whitespace-nowrap">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="py-2 pl-2 pr-6 text-sm border border-gray-300 rounded-lg focus-visible:border-[#ED0D79] focus-visible:ring-1 focus-visible:ring-[#ED0D79]/20 focus-visible:outline-none appearance-none cursor-pointer min-w-[120px]"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="live">Live</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Plan Filter */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 whitespace-nowrap">Plan:</label>
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="py-2 pl-2 pr-6 text-sm border border-gray-300 rounded-lg focus-visible:border-[#ED0D79] focus-visible:ring-1 focus-visible:ring-[#ED0D79]/20 focus-visible:outline-none appearance-none cursor-pointer min-w-[100px]"
                >
                  <option value="all">All Plans</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              {/* Winners Filter */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 whitespace-nowrap">Filter:</label>
                <select
                  value={activeTab}
                  onChange={(e) => {
                    setActiveTab(e.target.value);
                    if (e.target.value === "winners") {
                      router.push("/admin/projects?tab=winners");
                    } else {
                      router.push("/admin/projects");
                    }
                  }}
                  className="py-2 pl-2 pr-6 text-sm border border-gray-300 rounded-lg focus-visible:border-[#ED0D79] focus-visible:ring-1 focus-visible:ring-[#ED0D79]/20 focus-visible:outline-none appearance-none cursor-pointer min-w-[120px]"
                >
                  <option value="all">All Projects</option>
                  <option value="winners">Winners Only</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchProjects()}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-[#ED0D79] text-white text-sm font-medium rounded-lg hover:bg-[#ED0D79]/90"
                >
                  <FilterAlt className="w-3 h-3" />
                  Apply
                </button>
                {/* Only show Clear button when filters are applied */}
                {(search || statusFilter !== "all" || planFilter !== "all" || activeTab !== "all") && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setDebouncedSearch("");
                      setStatusFilter("all");
                      setPlanFilter("all");
                      setActiveTab("all");
                      router.push("/admin/projects");
                    }}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
                  >
                    <XmarkCircle className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
            </div>
            
            {/* Active Filters Summary */}
            {(search || statusFilter !== "all" || planFilter !== "all" || activeTab !== "all") && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Active filters:</span>
                  {search && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#ED0D79]/10 text-[#ED0D79] rounded-full text-sm font-medium">
                      Search: "{search}"
                      <button
                        onClick={() => {
                          setSearch("");
                          setDebouncedSearch("");
                        }}
                        className="ml-1 hover:bg-[#ED0D79]/20 rounded-full p-0.5"
                      >
                        <XmarkCircle className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {statusFilter !== "all" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      <span className="flex items-center gap-1">
                        Status: {statusFilter === "pending" ? (
                          <>
                            <Hourglass className="w-3 h-3" />
                            Pending
                          </>
                        ) : statusFilter === "live" ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Live
                          </>
                        ) : (
                          <>
                            <XmarkCircle className="w-3 h-3" />
                            Rejected
                          </>
                        )}
                      </span>
                      <button
                        onClick={() => setStatusFilter("all")}
                        className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <XmarkCircle className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {planFilter !== "all" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      <span className="flex items-center gap-1">
                        Plan: {planFilter === "standard" ? "Standard" : (
                          <>
                            <Crown className="w-3 h-3" />
                            Premium
                          </>
                        )}
                      </span>
                      <button
                        onClick={() => setPlanFilter("all")}
                        className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                      >
                        <XmarkCircle className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {activeTab === "winners" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        Winners Only
                      </span>
                      <button
                        onClick={() => {
                          setActiveTab("all");
                          router.push("/admin/projects");
                        }}
                        className="ml-1 hover:bg-yellow-200 rounded-full p-0.5"
                      >
                        <XmarkCircle className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="p-0">
            {/* Stats Bar */}
            <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {filteredProjects.length} of {activeTab === "winners" ? projects.filter(p => p.weekly_position && p.weekly_position >= 1 && p.weekly_position <= 3).length : pagination.totalCount}{" "}
                {activeTab === "winners" ? "winning projects" : "projects"}
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <span className="flex items-center text-amber-600">
                  <Clock className="w-4 h-4 mr-1" />
                  {
                    filteredProjects.filter((p) => p.status === "pending").length
                  }{" "}
                  pending
                </span>
                <span className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {filteredProjects.filter((p) => p.status === "live").length} live
                </span>
                {activeTab === "winners" && (
                  <span className="flex items-center text-yellow-600">
                    <Trophy className="w-4 h-4 mr-1" />
                    {filteredProjects.length} winners
                  </span>
                )}
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
            ) : filteredProjects.length > 0 ? (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="table w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Winner Badge</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProjects.map((project) => (
                        <ProjectRow
                          key={project.id}
                          project={project}
                          onStatusUpdate={handleStatusUpdate}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                  {filteredProjects.map((project) => (
                    <ProjectMobileCard
                      key={project.id}
                      project={project}
                      onStatusUpdate={handleStatusUpdate}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="p-6 border-t border-gray-200">
                    <div className="flex items-center justify-center">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page <= 1}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                                  page === pagination.page
                                    ? "bg-[#ED0D79] text-white"
                                    : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700"
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
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  {activeTab === "winners" ? (
                    <Trophy className="w-8 h-8 text-gray-400" />
                  ) : (
                    <Search className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">
                  {activeTab === "winners" ? "No winning projects found" : "No projects found"}
                </h3>
                <p className="text-gray-600">
                  {activeTab === "winners" 
                    ? "No projects have been selected as winners yet. Use the winner badge management tools to assign winning positions."
                    : "Try adjusting your search or filter criteria."
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
