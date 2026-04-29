"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Crown,
  ExternalLink,
  Hourglass,
  Trash2,
  Mail,
  ShieldCheck,
  FileSpreadsheet,
  Pencil,
} from "lucide-react";
import toast from "react-hot-toast";
import Pagination from '@/components/shared/Pagination';
import { ProjectFormDialog } from '@/components/admin/ProjectFormDialog';
import { CsvImportDialog } from '@/components/admin/CsvImportDialog';
import { siteConfig } from "@/config/site.config";
import { getLogoDevUrl } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper function to generate project link with ref parameter and proper rel attribute
const generateProjectLink = (project) => {
  const rawUrl = typeof project.website_url === "string" ? project.website_url.trim() : "";

  // Fallback for missing or empty URL – disable external navigation but keep safe rel
  if (!rawUrl) {
    return {
      url: "#",
      rel: "nofollow noopener noreferrer",
    };
  }

  // Ensure protocol so URL(...) receives an absolute URL
  let normalizedUrl = rawUrl;
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  let href = "#";
  try {
    // Add ref parameter as per CLAUDE.md spec
    const url = new URL(normalizedUrl);
    url.searchParams.set("ref", siteConfig.refParameter);
    href = url.toString();
  } catch (error) {
    console.warn("Invalid project website_url, using safe fallback:", {
      website_url: rawUrl,
      projectId: project?.id,
    });
  }

  // Use link_type field from database
  // - "dofollow": Premium plans or manually upgraded
  // - "nofollow": Standard (FREE) plans by default
  const isDofollow = project.link_type === "dofollow";

  return {
    url: href,
    rel: isDofollow ? "noopener noreferrer" : "nofollow noopener noreferrer",
  };
};

// Prefer derived launch status when available
const getLaunchStatus = (project) => project?.launch_status || project?.status;

function ProjectRow({ project, onStatusUpdate, onDelete, onEdit }) {
  const [updating, setUpdating] = useState(false);
  const [togglingLinkType, setTogglingLinkType] = useState(false);
  const [currentLinkType, setCurrentLinkType] = useState(project.link_type || "nofollow");
  const [deleting, setDeleting] = useState(false);
  const [verifyingBadge, setVerifyingBadge] = useState(false);

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
        return <span className="inline-flex items-center px-2 py-1 rounded-[var(--radius)] text-xs font-medium bg-success/20 text-success">Live</span>;
      case "pending":
        return <span className="inline-flex items-center px-2 py-1 rounded-[var(--radius)] text-xs font-medium bg-warning/20 text-warning">Pending</span>;
      case "rejected":
        return <span className="inline-flex items-center px-2 py-1 rounded-[var(--radius)] text-xs font-medium bg-destructive/20 text-destructive">Rejected</span>;
      case "scheduled":
        return <span className="inline-flex items-center px-2 py-1 rounded-[var(--radius)] text-xs font-medium bg-info/20 text-info">Scheduled</span>;
      case "past":
        return <span className="inline-flex items-center px-2 py-1 rounded-[var(--radius)] text-xs font-medium bg-muted text-foreground">Past</span>;
      case "approved":
        return <span className="inline-flex items-center px-2 py-1 rounded-[var(--radius)] text-xs font-medium bg-foreground/10 text-foreground">Approved</span>;
      case "archived":
        return <span className="inline-flex items-center px-2 py-1 rounded-[var(--radius)] text-xs font-medium bg-muted text-foreground">Archived</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-[var(--radius)] text-xs font-medium bg-muted text-foreground">{status}</span>;
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
            `Project ${action === "approve" ? "approved" : "rejected"} successfully! ${
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

  const handleResendApprovalEmail = async () => {
    setUpdating(true);
    try {
      const response = await fetch("/api/admin?action=approve-project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: project.id,
          action: "resend-approval-email",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Approval email sent successfully!");
      } else {
        throw new Error(data.error || "Failed to send approval email");
      }
    } catch (error) {
      console.error("Resend email error:", error);
      toast.error(error.message || "Failed to send approval email");
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

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin?type=projects&id=${project.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Project deleted successfully");
        if (onDelete) {
          onDelete(project.id);
        }
      } else {
        throw new Error(data.error || "Failed to delete project");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  const handleVerifyBadge = async () => {
    if (!project.website_url) {
      toast.error("No website URL for this project");
      return;
    }

    setVerifyingBadge(true);
    try {
      const response = await fetch("/api/verify-badge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl: project.website_url }),
      });

      const result = await response.json();

      if (result.verified) {
        toast.success(`✅ Badge verified! Dofollow link found on ${project.name}`);
      } else {
        toast.error(`❌ ${result.message || "Badge not found"}`);
      }
    } catch (error) {
      console.error("Badge verification error:", error);
      toast.error("Failed to verify badge");
    } finally {
      setVerifyingBadge(false);
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
    <tr className="hover:bg-muted transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <div className="avatar">
            <div className="w-10 h-10 rounded-[var(--radius)] border border-border">
              {(project.logo_url || getLogoDevUrl(project.website_url)) ? (
                <Image
                  src={project.logo_url || getLogoDevUrl(project.website_url)}
                  alt={`${project.name} logo`}
                  width={40}
                  height={40}
                  className="rounded-[var(--radius)] object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-foreground bg-muted rounded-[var(--radius)]">
                  {project.name?.[0] ?? "?"}
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <button onClick={() => onEdit?.(project)} className="font-semibold text-foreground hover:text-primary hover:underline cursor-pointer text-left truncate max-w-[200px]">{project.name}</button>
            </div>
            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
              {project.short_description}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(getLaunchStatus(project))}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center px-2 py-1 rounded-[var(--radius)] text-xs font-medium bg-muted text-foreground">{project.plan}</span>
          <button
            onClick={handleToggleLinkType}
            disabled={togglingLinkType}
            className={`inline-flex items-center px-2 py-1 rounded-[var(--radius)] text-xs font-medium cursor-pointer transition-colors ${
              currentLinkType === "dofollow"
                ? "bg-success/20 text-success"
                : "bg-muted text-foreground"
            }`}
            title="Click to toggle link type"
          >
            {currentLinkType === "dofollow" ? "✓ Dofollow" : "Nofollow"}
          </button>
          {project.dofollow_reason && (
            <span className="text-xs text-muted-foreground">
              {project.dofollow_reason === "manual_upgrade" && "✋ Manual"}
              {project.dofollow_reason === "premium_plan" && "💎 Premium"}
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm">
          <div className="font-medium text-foreground">{project.views} views</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-muted-foreground">
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
                className="inline-flex items-center px-2 py-1 rounded-[var(--radius)] text-xs font-medium bg-success/20 text-success hover:bg-success/30 transition-colors"
                title="Approve"
              >
                {updating ? (
                  <span className="inline-block h-3 w-3 animate-spin rounded-[var(--radius)] border-2 border-current border-t-transparent"></span>
                ) : (
                  <CheckCircle2 className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => handleStatusUpdate("rejected")}
                disabled={updating}
                className="inline-flex items-center px-2 py-1 rounded-[var(--radius)] text-xs font-medium bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
                title="Reject"
              >
                <XCircle className="w-3 h-3" />
              </button>
            </>
          )}

          {/* Resend Approval Email - Show for approved projects */}
          {(project.status === "live" || project.status === "scheduled" || project.approved) && (
            <button
              onClick={handleResendApprovalEmail}
              disabled={updating}
              className="inline-flex items-center px-2 py-1 rounded-[var(--radius)] text-xs font-medium bg-info/20 text-info hover:bg-info/30 transition-colors"
              title="Resend Approval Email"
            >
              {updating ? (
                <span className="inline-block h-3 w-3 animate-spin rounded-[var(--radius)] border-2 border-current border-t-transparent"></span>
              ) : (
                <Mail className="w-3 h-3" />
              )}
            </button>
          )}

          {/* Quick External Link */}
          <Link
            href={projectLink.url}
            target="_blank"
            rel={projectLink.rel}
            className="inline-flex items-center px-2 py-1 rounded-[var(--radius)] text-xs font-medium bg-muted text-muted-foreground hover:bg-muted transition-colors"
            title="Visit Website"
            onClick={handleVisitWebsite}
          >
            <ExternalLink className="w-4 h-4" />
          </Link>

          {/* Verify Badge Button */}
          <button
            onClick={handleVerifyBadge}
            disabled={verifyingBadge}
            className="inline-flex items-center px-2 py-1 rounded-[var(--radius)] text-xs font-medium bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Verify Badge on Website"
          >
            {verifyingBadge ? (
              <span className="inline-block h-3 w-3 animate-spin rounded-[var(--radius)] border-2 border-current border-t-transparent"></span>
            ) : (
              <ShieldCheck className="w-3 h-3" />
            )}
          </button>

          {/* Edit Button */}
          <button
            onClick={() => onEdit?.(project)}
            className="inline-flex items-center px-2 py-1 rounded-[var(--radius)] text-xs font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors"
            title="Edit Project"
          >
            <Pencil className="w-3 h-3" />
          </button>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center px-2 py-1 rounded-[var(--radius)] text-xs font-medium bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete Project"
          >
            {deleting ? (
              <span className="inline-block h-3 w-3 animate-spin rounded-[var(--radius)] border-2 border-current border-t-transparent"></span>
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}

function ProjectMobileCard({ project, onStatusUpdate, onDelete, onEdit }) {
  const [updating, setUpdating] = useState(false);
  const [togglingLinkType, setTogglingLinkType] = useState(false);
  const [currentLinkType, setCurrentLinkType] = useState(project.link_type || "nofollow");
  const [deleting, setDeleting] = useState(false);
  const [verifyingBadge, setVerifyingBadge] = useState(false);

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
        return <span className="inline-flex items-center px-2 py-1 rounded-[var(--radius)] text-xs font-medium bg-success/20 text-success">Live</span>;
      case "pending":
        return <span className="inline-flex items-center px-2 py-1 rounded-[var(--radius)] text-xs font-medium bg-warning/20 text-warning">Pending</span>;
      case "rejected":
        return <span className="inline-flex items-center px-2 py-1 rounded-[var(--radius)] text-xs font-medium bg-destructive/20 text-destructive">Rejected</span>;
      case "scheduled":
        return <span className="inline-flex items-center px-2 py-1 rounded-[var(--radius)] text-xs font-medium bg-info/20 text-info">Scheduled</span>;
      case "past":
        return <span className="inline-flex items-center px-2 py-1 rounded-[var(--radius)] text-xs font-medium bg-muted text-foreground">Past</span>;
      case "approved":
        return <span className="inline-flex items-center px-2 py-1 rounded-[var(--radius)] text-xs font-medium bg-foreground/10 text-foreground">Approved</span>;
      case "archived":
        return <span className="inline-flex items-center px-2 py-1 rounded-[var(--radius)] text-xs font-medium bg-muted text-foreground">Archived</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-[var(--radius)] text-xs font-medium bg-muted text-foreground">{status}</span>;
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
            `Project ${action === "approve" ? "approved" : "rejected"} successfully! ${
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

  const handleResendApprovalEmail = async () => {
    setUpdating(true);
    try {
      const response = await fetch("/api/admin?action=approve-project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: project.id,
          action: "resend-approval-email",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Approval email sent successfully!");
      } else {
        throw new Error(data.error || "Failed to send approval email");
      }
    } catch (error) {
      console.error("Resend email error:", error);
      toast.error(error.message || "Failed to send approval email");
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

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin?type=projects&id=${project.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Project deleted successfully");
        if (onDelete) {
          onDelete(project.id);
        }
      } else {
        throw new Error(data.error || "Failed to delete project");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  const handleVerifyBadge = async () => {
    if (!project.website_url) {
      toast.error("No website URL for this project");
      return;
    }

    setVerifyingBadge(true);
    try {
      const response = await fetch("/api/verify-badge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl: project.website_url }),
      });

      const result = await response.json();

      if (result.verified) {
        toast.success(`✅ Badge verified! Dofollow link found on ${project.name}`);
      } else {
        toast.error(`❌ ${result.message || "Badge not found"}`);
      }
    } catch (error) {
      console.error("Badge verification error:", error);
      toast.error("Failed to verify badge");
    } finally {
      setVerifyingBadge(false);
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
    <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
      {/* Header with logo and status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg border border-border overflow-hidden flex-shrink-0">
            {(project.logo_url || getLogoDevUrl(project.website_url)) ? (
              <Image
                src={project.logo_url || getLogoDevUrl(project.website_url)}
                alt={`${project.name} logo`}
                width={48}
                height={48}
                className="rounded-lg object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-foreground bg-muted">
                {project.name?.[0] ?? "?"}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <button onClick={() => onEdit?.(project)} className="font-semibold text-foreground hover:text-primary hover:underline cursor-pointer text-left truncate max-w-[200px]">{project.name}</button>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.short_description}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          {getStatusBadge(getLaunchStatus(project))}
          <div className="text-sm text-muted-foreground">
            {formatDate(project.created_at || project.createdAt || project.submitted_at)}
          </div>
        </div>
      </div>

      {/* Stats and plan info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-sm text-muted-foreground">Performance</div>
          <div className="font-medium text-foreground">{project.views} views</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Plan</div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-1 rounded-[var(--radius)] text-xs font-medium bg-muted text-foreground">{project.plan}</span>
            <button
              onClick={handleToggleLinkType}
              disabled={togglingLinkType}
              className={`inline-flex items-center px-2 py-1 rounded-[var(--radius)] text-xs font-medium cursor-pointer transition-colors ${
                currentLinkType === "dofollow"
                  ? "bg-success/20 text-success"
                  : "bg-muted text-foreground"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Click to toggle link type"
            >
              {currentLinkType === "dofollow" ? "✓ Dofollow" : "Nofollow"}
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {project.status === "pending" && (
          <>
            <button
              onClick={() => handleStatusUpdate("live")}
              disabled={updating}
              className="inline-flex items-center px-3 py-2 rounded-[var(--radius)] text-sm font-medium bg-success/20 text-success hover:bg-success/30 transition-colors"
            >
              {updating ? (
                <span className="inline-block h-3 w-3 animate-spin rounded-[var(--radius)] border-2 border-current border-t-transparent mr-2"></span>
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Approve
            </button>
            <button
              onClick={() => handleStatusUpdate("rejected")}
              disabled={updating}
              className="inline-flex items-center px-3 py-2 rounded-[var(--radius)] text-sm font-medium bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </button>
          </>
        )}

        {/* Resend Approval Email - Show for approved projects */}
        {(project.status === "live" || project.status === "scheduled" || project.approved) && (
          <button
            onClick={handleResendApprovalEmail}
            disabled={updating}
            className="inline-flex items-center px-3 py-2 rounded-[var(--radius)] text-sm font-medium bg-info/20 text-info hover:bg-info/30 transition-colors"
          >
            {updating ? (
              <span className="inline-block h-3 w-3 animate-spin rounded-[var(--radius)] border-2 border-current border-t-transparent mr-2"></span>
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            Resend Email
          </button>
        )}

        <Link
          href={projectLink.url}
          target="_blank"
          rel={projectLink.rel}
          className="inline-flex items-center px-3 py-2 rounded-[var(--radius)] text-sm font-medium bg-muted text-muted-foreground hover:bg-muted transition-colors"
          onClick={handleVisitWebsite}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Visit
        </Link>

        <button
          onClick={handleVerifyBadge}
          disabled={verifyingBadge}
          className="inline-flex items-center px-3 py-2 rounded-[var(--radius)] text-sm font-medium bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {verifyingBadge ? (
            <span className="inline-block h-3 w-3 animate-spin rounded-[var(--radius)] border-2 border-current border-t-transparent mr-2"></span>
          ) : (
            <ShieldCheck className="w-4 h-4 mr-2" />
          )}
          Badge
        </button>

        <button
          onClick={() => onEdit?.(project)}
          className="inline-flex items-center px-3 py-2 rounded-[var(--radius)] text-sm font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors"
        >
          <Pencil className="w-4 h-4 mr-2" />
          Edit
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center px-3 py-2 rounded-[var(--radius)] text-sm font-medium bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleting ? (
            <span className="inline-block h-3 w-3 animate-spin rounded-[var(--radius)] border-2 border-current border-t-transparent mr-2"></span>
          ) : (
            <Trash2 className="w-4 h-4 mr-2" />
          )}
          Delete
        </button>
      </div>
    </div>
  );
}

export default function AdminProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    totalCount: 0,
    totalPages: 0,
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchProjects();
  }, [
    pagination.page,
    statusFilter,
    planFilter,
    debouncedSearch,
  ]);

  useEffect(() => {
  }, []);

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
        const apiPagination = data.data.pagination || {};
        const totalCount =
          apiPagination.totalCount ??
          apiPagination.total ??
          pagination.totalCount;
        const totalPages =
          apiPagination.totalPages ??
          apiPagination.pages ??
          Math.ceil((totalCount || 0) / (apiPagination.limit || pagination.limit || 1));

        setPagination({
          page: apiPagination.page ?? pagination.page,
          limit: apiPagination.limit ?? pagination.limit,
          totalCount,
          totalPages,
        });
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

  const handleDelete = (projectId) => {
    // Remove the project from the list
    setProjects(projects.filter((project) => project.id !== projectId));
    // Refresh the list to update pagination
    fetchProjects();
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const filteredProjects = projects;

  return (
    <>
      {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-foreground">Listings Management</h1>
            <p className="text-muted-foreground">
              Review, approve, and manage project submissions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCsvImportOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-background text-foreground border border-border font-semibold rounded-lg hover:bg-muted transition text-sm whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Import CSV
            </button>
            <button
              onClick={() => { setEditingProject(null); setFormDialogOpen(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition text-sm whitespace-nowrap"
            >
              + Add Listing
            </button>
          </div>
        </div>


        {/* Filters */}
        <div className="bg-card rounded-[var(--radius)] border border-border mb-6"
        style={{
          boxShadow: "var(--card-shadow)",
        }}
        >
          <div className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">
              {/* Search Input */}
              <div className="flex flex-col gap-2 flex-1 min-w-0 w-full lg:w-auto lg:max-w-xs">
                <label className="text-xs text-muted-foreground whitespace-nowrap">Search:</label>
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground/60" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search projects..."
                    className="w-full pl-7 pr-7 py-2 text-sm border border-border rounded-lg focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/20 focus-visible:outline-none"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground/60 hover:text-muted-foreground"
                    >
                      <XCircle className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Row - Labels above on desktop, inline on mobile */}
              <div className="flex flex-wrap gap-4 flex-1 lg:flex-nowrap lg:items-end">
                {/* Status Filter */}
                <div className="flex flex-col gap-2 flex-1 lg:flex-initial lg:min-w-[140px]">
                  <label className="text-xs text-muted-foreground whitespace-nowrap">Status:</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Plan Filter */}
                <div className="flex flex-col gap-2 flex-1 lg:flex-initial lg:min-w-[120px]">
                  <label className="text-xs text-muted-foreground whitespace-nowrap">Plan:</label>
                  <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="All Plans" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plans</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 flex-shrink-0 w-full lg:w-auto">
                  <label className="text-xs text-muted-foreground whitespace-nowrap lg:hidden">Actions:</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchProjects()}
                      className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-background text-foreground border-2 border-foreground text-sm font-semibold rounded-[var(--radius)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)] flex-1 lg:flex-initial"
                    >
                      <Filter className="w-3 h-3" />
                      Apply
                    </button>
                    {/* Only show Clear button when filters are applied */}
                    {(search || statusFilter !== "all" || planFilter !== "all") && (
                      <button
                        onClick={() => {
                          setSearch("");
                          setDebouncedSearch("");
                          setStatusFilter("all");
                          setPlanFilter("all");
                          router.push("/admin/projects");
                        }}
                        className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-muted text-muted-foreground text-sm font-medium rounded-[var(--radius)] hover:bg-muted flex-1 lg:flex-initial"
                      >
                        <XCircle className="w-3 h-3" />
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Active Filters Summary */}
            {(search || statusFilter !== "all" || planFilter !== "all") && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
                  {search && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-foreground/10 text-foreground rounded-[var(--radius)] text-sm font-medium">
                      Search: "{search}"
                      <button
                        onClick={() => {
                          setSearch("");
                          setDebouncedSearch("");
                        }}
                        className="ml-1 hover:bg-foreground/20 rounded-[var(--radius)] p-0.5"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {statusFilter !== "all" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-info/20 text-info rounded-[var(--radius)] text-sm font-medium">
                      <span className="flex items-center gap-1">
                        Status: {statusFilter === "pending" ? (
                          <>
                            <Hourglass className="w-3 h-3" />
                            Pending
                          </>
                        ) : statusFilter === "live" ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Live
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Rejected
                          </>
                        )}
                      </span>
                      <button
                        onClick={() => setStatusFilter("all")}
                        className="ml-1 hover:bg-info/30 rounded-[var(--radius)] p-0.5"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {planFilter !== "all" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-success/20 text-success rounded-[var(--radius)] text-sm font-medium">
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
                        className="ml-1 hover:bg-success/30 rounded-[var(--radius)] p-0.5"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="bg-card rounded-[var(--radius)] border border-border"
        style={{
          boxShadow: "var(--card-shadow)",
        }}
        >
          <div className="p-0">
            {/* Stats Bar */}
            <div className="p-4 sm:p-6 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredProjects.length} of {pagination.totalCount} projects
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm">
                <span className="flex items-center text-warning">
                  <Clock className="w-4 h-4 mr-1" />
                  {filteredProjects.filter((p) => getLaunchStatus(p) === "pending").length}{" "}
                  pending
                </span>
                <span className="flex items-center text-success">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  {filteredProjects.filter((p) => getLaunchStatus(p) === "live").length} live
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
                      <div className="bg-muted w-10 h-10 rounded-[var(--radius)] animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="bg-muted h-4 w-48 rounded-[var(--radius)] animate-pulse"></div>
                        <div className="bg-muted h-3 w-32 rounded-[var(--radius)] animate-pulse"></div>
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
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[280px] max-w-[280px]">Project</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Plan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Performance</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Submitted</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {filteredProjects.map((project) => (
                        <ProjectRow
                          key={project.id}
                          project={project}
                          onStatusUpdate={handleStatusUpdate}
                          onDelete={handleDelete}
                          onEdit={(p) => { setEditingProject(p); setFormDialogOpen(true); }}
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
                      onDelete={handleDelete}
                      onEdit={(p) => { setEditingProject(p); setFormDialogOpen(true); }}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="p-6 border-t border-border">
                    <Pagination
                      page={pagination.page || 1}
                      totalPages={pagination.totalPages}
                      onPageChange={handlePageChange}
                      ariaLabel="Admin projects pagination"
                    />
                  </div>
                )}
              </>
            ) : (
              // Empty State
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto bg-muted rounded-[var(--radius)] flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-muted-foreground/60" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  No projects found
                </h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            )}
          </div>
        </div>

      <ProjectFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        project={editingProject}
        onSuccess={() => fetchProjects()}
      />

      <CsvImportDialog
        open={csvImportOpen}
        onOpenChange={setCsvImportOpen}
        onSuccess={() => fetchProjects()}
      />
    </>
  );
}
