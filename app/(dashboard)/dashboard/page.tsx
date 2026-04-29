"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useUser } from '@/hooks/use-user';
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import {
  Plus,
  Eye,
  Pencil,
  ExternalLink,
  Crown,
  Users,
  BarChart3,
  X,
  Rocket,
  Bot,
  Bookmark,
} from "lucide-react";
import toast from "react-hot-toast";
import { AutoSubmitModal } from '@/components/shared/AutoSubmitModal';
import { useAutoSubmitConfig } from '@/hooks/use-autosubmit-config';
import { siteConfig } from "@/config/site.config";
import { ProductCard } from "@/components/directory/ProductCard";
import { isEnabled } from "@/lib/features";
import { getLogoDevUrl } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function StatsCard({ icon: Icon, title, value, description, className = "" }) {
  return (
    <div
      className={`rounded-[var(--radius)] border border-border bg-card p-6 hover:border-foreground transition duration-300 ease-in-out ${className}`}
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-foreground mt-1">{value}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="w-12 h-12 bg-foreground/10 rounded-[var(--radius)] flex items-center justify-center">
          <Icon className="w-6 h-6 text-foreground" />
        </div>
      </div>
    </div>
  );
}

function WinnerReminder({ winningProjects }) {
  if (!winningProjects || winningProjects.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="p-4 bg-muted border border-border rounded-[var(--radius)]">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg 
              className="w-5 h-5 text-foreground mt-0.5" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              <strong>Pro Tip:</strong> {winningProjects.length === 1 
                ? `Your project "${winningProjects[0].name}" won a competition! ` 
                : `You have ${winningProjects.length} winning projects! `} 
              Make sure to place the embed badge on your website to receive SEO benefits and boost your domain authority with the dofollow backlink.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project, onResumeDraft }) {
  // Check if project is actually paid - consider it paid if:
  // 1. payment_status is explicitly true, OR
  // 2. plan is premium AND premium_badge is true (indicates premium was activated)
  const isPaid = project.payment_status === true ||
    (project.plan === "premium" && project.premium_badge === true);

  // Check if this is an upgrade pending payment
  const isUpgradePending = project.upgrade_pending === true && !isPaid;

  // Check if project needs payment (draft or upgrade pending)
  const needsPayment = (project.is_draft && !isPaid) || isUpgradePending;

  const isScheduledForEdit = project?.statusBadge
    ? project.statusBadge === "scheduled"
    : project.status === "scheduled";
  const canEdit = (!project.is_draft || isPaid) && isScheduledForEdit && !isUpgradePending;
  const canUpgradeToPremium =
    (!project.is_draft || isPaid) &&
    project.plan === "standard" &&
    !isUpgradePending &&
    (project.status === "pending" ||
      project.status === "scheduled" ||
      project.statusBadge === "scheduled");
  const getStatusBadge = (project, isDraft) => {
    // Show upgrade pending badge for projects with pending upgrade
    if (isUpgradePending) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning/20 text-warning">Upgrade Pending</span>;
    }

    // Don't show draft badge if payment is completed
    if ((isDraft || project.status === "draft") && !isPaid) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-foreground">Draft</span>;
    }
    
    // Use statusBadge for competition-related status (past, scheduled, live)
    if (project.statusBadge) {
      switch (project.statusBadge) {
        case "past":
          return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-foreground">Past</span>;
        case "scheduled":
          return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-info/20 text-info">Scheduled</span>;
        case "live":
          return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/20 text-success">Live</span>;
      }
    }
    
    // Fallback to regular status for non-competition statuses
    switch (project.status) {
      case "live":
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/20 text-success">Live</span>;
      case "pending":
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning/20 text-warning">Pending</span>;
      case "rejected":
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-destructive/20 text-destructive">Rejected</span>;
      case "scheduled":
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-info/20 text-info">Scheduled</span>;
      case "approved":
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-foreground/10 text-foreground">Approved</span>;
      case "archived":
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-foreground">Archived</span>;
      case "draft":
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-foreground">Draft</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-foreground">{project.status}</span>;
    }
  };

  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-US", {
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
      e.target.closest("[data-dropdown]")
    ) {
      return;
    }
    
    // Don't navigate for unpaid drafts or upgrade pending - they should use "Resume" button
    if (needsPayment) {
      return;
    }
    
    window.location.href = `/project/${project.slug}`;
  };

  const handleEditClick = () => {
    // Allow editing only before the launch starts
    if (!canEdit) {
      toast.error("Projects from current or past launches can't be edited");
      return;
    }

    // Redirect to dedicated edit page
    window.location.href = `/edit/${project.slug}`;
  };
  
  const handleResumeDraft = () => {
    if (onResumeDraft) {
      onResumeDraft(project);
    }
  };
  
  const handleDeleteDraft = async () => {
    if (!confirm("Are you sure you want to delete this draft?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/projects?id=${project.id}`, {
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
    <div className="block h-full">
      <div
        className="w-full h-full rounded-[var(--radius)] border border-border bg-card p-4 group cursor-pointer transition duration-300 ease-in-out hover:border-foreground hover:scale-[1.01] flex flex-col"
        style={{ boxShadow: "var(--card-shadow)" }}
        onClick={handleCardClick}
      >
        {/* Top section: Logo with badges and Actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-[64px] h-[64px] border rounded-[var(--radius)] border-border overflow-hidden flex-shrink-0">
              {(project.logo_url || getLogoDevUrl(project.website_url)) ? (
                <Image
                  src={project.logo_url || getLogoDevUrl(project.website_url)}
                  alt={`${project.name} logo`}
                  width={64}
                  height={64}
                  className="rounded-[var(--radius)] object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-bold text-foreground bg-muted rounded-[var(--radius)]">
                  {project.name?.[0] ?? "?"}
                </div>
              )}
            </div>
            
            {/* Badges next to logo */}
            <div className="flex flex-col space-y-1">
              {/* Premium Badge */}
              {project.premium_badge && (
                <span className="inline-flex leading-none items-center gap-1 px-1 py-0.5 text-[11px] font-medium text-primary-foreground rounded-sm" style={{backgroundColor: 'hsl(var(--primary))'}}>
                  <Crown className="w-4 h-4" strokeWidth={1.5} />
                  <span className="mt-0.5">Premium</span>
                </span>
              )}
            </div>
          </div>

          {/* Dropdown Menu */}
          <div className="relative" data-dropdown>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const menu = e.currentTarget.nextElementSibling;
                menu?.classList.toggle('hidden');
              }}
              className="inline-flex items-center justify-center rounded-[var(--radius)] px-2 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <ul
              className="hidden absolute right-0 z-50 p-2 bg-card rounded-[var(--radius)] w-52 border border-border"
              style={{ boxShadow: "var(--card-shadow)" }}
            >
              {((!project.is_draft && project.status !== "draft") || isPaid || isUpgradePending) ? (
                <li>
                  <Link
                    href={`/project/${project.slug}`}
                    className="hover:bg-muted"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Project
                  </Link>
                </li>
              ) : null}
              {needsPayment && (
                <>
                  <li>
                    <button
                      className="hover:bg-muted"
                      onClick={handleResumeDraft}
                    >
                      <Pencil className="w-4 h-4" />
                      {isUpgradePending ? "Complete Upgrade" : "Resume Draft"}
                    </button>
                  </li>
                  {!isUpgradePending && (
                    <li>
                      <button
                        className="hover:bg-muted text-destructive"
                        onClick={handleDeleteDraft}
                      >
                        <X className="w-4 h-4" />
                        Delete Draft
                      </button>
                    </li>
                  )}
                </>
              )}
              {canEdit && (
                <li>
                  <button
                    className="hover:bg-muted"
                    onClick={handleEditClick}
                  >
                    <Pencil className="w-4 h-4" />
                    Edit Details
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Title */}
        <div className="mb-3">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-semibold text-foreground">
              {project.name}
            </h3>
          </div>
          {formatDate(project.launch_date || project.created_at) && (
            <p className="text-sm text-muted-foreground">
              Launched {formatDate(project.launch_date || project.created_at)}
            </p>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-3 line-clamp-3 flex-grow">
          {project.short_description}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="text-center">
            <div className="flex items-center justify-center text-foreground mb-1">
              <Eye className="w-4 h-4 mr-1" />
              <span className="font-semibold text-foreground">
                {formatNumber(project.views || 0)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Views</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center text-foreground mb-1">
              <ExternalLink className="w-4 h-4 mr-1" />
              <span className="font-semibold text-foreground">
                {formatNumber(project.clicks || 0)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Clicks</p>
          </div>
        </div>

        {/* Upgrade to Premium CTA (for standard, upcoming projects) */}
        {canUpgradeToPremium && (
          <div className="mb-3 rounded-[var(--radius)] border border-border bg-muted p-3">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground">
                  Launch sooner and get guaranteed dofollow backlinks.
                </p>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (typeof window !== "undefined") {
                        const event = new CustomEvent("dashboard-upgrade-project", {
                          detail: { projectId: project.id },
                        });
                        window.dispatchEvent(event);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-[var(--radius)] border-2 border-foreground bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_2px_0_rgba(0,0,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    Upgrade to Premium
                    <Crown className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Draft/Upgrade Actions - Only for drafts or upgrade pending that haven't been paid */}
        {needsPayment && (
          <div className="pt-3 border-t border-border">
            <div className="bg-warning/10 border border-warning/30 rounded-[var(--radius)] px-3 py-3">
              <div className="flex items-start space-x-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-warning">
                    {isUpgradePending ? "Upgrade pending payment" : "Draft saved"}
                  </p>
                  <p className="text-xs text-warning mt-1 leading-snug">
                    {isUpgradePending
                      ? "Complete payment to upgrade to premium and get guaranteed dofollow backlinks."
                      : project.plan === "premium"
                        ? "Complete payment to submit your premium launch and get guaranteed dofollow backlinks."
                        : "This submission is saved as a draft. Complete it to launch your project."}
                  </p>
                  <div className="mt-2 flex space-x-2">
                    <button
                      onClick={handleResumeDraft}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-card text-foreground border-2 border-foreground font-semibold rounded-[var(--radius)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_2px_0_rgba(0,0,0,1)] text-xs"
                    >
                      {isUpgradePending ? "Complete Upgrade" : "Resume Draft"}
                    </button>
                    {!isUpgradePending && (
                      <button
                        onClick={handleDeleteDraft}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-card text-destructive font-semibold rounded-[var(--radius)] border border-destructive/30 hover:border-destructive/50 hover:bg-destructive/10 transition duration-200 text-xs"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Actions - Embed button and status badge */}
        {(project.weekly_position || ((!project.is_draft && project.status !== "draft") || isPaid) || isUpgradePending) && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              {/* Status Badge - Bottom Right */}
              {getStatusBadge(project, project.is_draft)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SubmitCard({ onLaunchClick }) {
  const handleClick = (e) => {
    e.preventDefault();
    if (onLaunchClick) {
      onLaunchClick();
    }
  };

  return (
    <div className="block h-full">
      <button
        onClick={handleClick}
        className="w-full h-full rounded-[var(--radius)] border border-foreground/90 bg-foreground/10 p-6 group cursor-pointer transition duration-300 ease-in-out hover:scale-[1.01] flex flex-col items-center justify-center text-center hover:bg-foreground/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Rocket className="w-8 h-8 text-foreground mb-2" />
        <h3 className="text-lg font-semibold text-foreground">
          Submit Your Project
        </h3>
      </button>
    </div>
  );
}

function DashboardContent() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { config: autoSubmitConfig } = useAutoSubmitConfig();
  const promoRef = useRef(null);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "overview"
  );
  const [bookmarkedProjects, setBookmarkedProjects] = useState<any[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [upgradeProject, setUpgradeProject] = useState(null);
  const [upgradeWeeks, setUpgradeWeeks] = useState([]);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");
  const [selectedWeekId, setSelectedWeekId] = useState("");
  const [isAutoSubmitModalOpen, setIsAutoSubmitModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined" || !promoRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.to(promoRef.current, {
        scale: 1.02,
        duration: 0.6,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1,
        repeatDelay: 20, // long pause between pulses
        transformOrigin: "center center",
      });
    }, promoRef);

    return () => {
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    const submitted = searchParams.get("submitted");
    if (submitted) {
      setIsAutoSubmitModalOpen(true);
    }
  }, [searchParams]);

  const handleAutoSubmitModalClose = () => {
    setIsAutoSubmitModalOpen(false);
    const submitted = searchParams.get("submitted");
    if (submitted) {
      router.replace("/dashboard");
    }
  };

  const handleResumeDraft = async (project) => {
    // For upgrade pending, create new checkout session and redirect to payment
    if (project.upgrade_pending && project.plan === "premium" && !project.payment_status) {
      try {
        toast.loading("Creating payment session...", { id: "upgrade-payment" });

        const response = await fetch(`/api/projects/${project.slug}/upgrade`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            launch_week: project.pending_launch_week || project.launch_week,
          }),
          credentials: "include",
        });

        const result = await response.json();

        if (response.ok && result.success && result.data?.checkoutUrl) {
          toast.success("Redirecting to payment...", { id: "upgrade-payment" });
          window.open(result.data.checkoutUrl, "_blank");
        } else {
          toast.error(result.error || "Failed to create payment session", { id: "upgrade-payment" });
        }
      } catch (error) {
        console.error("Error creating upgrade payment:", error);
        toast.error("Failed to create payment session", { id: "upgrade-payment" });
      }
      return;
    }

    // For regular drafts, redirect to submit page with draft data pre-filled
    // Store draft data in sessionStorage so submit page can load it
    sessionStorage.setItem("resumeDraft", JSON.stringify(project));
    router.push("/submit?draft=" + project.id);
  };

  const handleLaunchClick = () => {
    router.push('/submit');
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

    if (!user?.id) {
      router.push("/auth/signin?callbackUrl=/dashboard");
      return;
    }

    fetchDashboardData();
  }, [user?.id, authLoading, router]);

  // Handle payment status from Stripe redirects
  useEffect(() => {
    const payment = searchParams.get("payment");
    const projectId = searchParams.get("projectId");

    if (!payment || !projectId) return;

    if (payment === "success") {
      toast.success(
        "🎉 Payment successful! Your launch has been upgraded to Premium."
      );
      // Refresh dashboard data to show updated project
      fetchDashboardData();
    } else if (payment === "cancelled") {
      // Restore original schedule when payment is cancelled
      const restoreOriginalSchedule = async () => {
        try {
          const response = await fetch(`/api/projects/${projectId}/upgrade/cancel`, {
            method: "POST",
            credentials: "include",
          });

          if (response.ok) {
            toast.error("Payment was cancelled. Your project remains on the free plan.");
            // Refresh dashboard data to show restored project
            fetchDashboardData();
          } else {
            toast.error("Payment was cancelled. Please refresh to see your project status.");
          }
        } catch (error) {
          console.error("Failed to restore original schedule:", error);
          toast.error("Payment was cancelled. Please refresh to see your project status.");
        }
      };

      restoreOriginalSchedule();
    }

    // Clean URL after handling
    router.replace("/dashboard");
  }, [searchParams, router]);

  // Update active tab when URL changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Listen for upgrade CTA events from project cards
  useEffect(() => {
    const handler = (event) => {
      const { projectId } = event.detail || {};
      if (!projectId) return;
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      openUpgradeModal(project);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("dashboard-upgrade-project", handler);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("dashboard-upgrade-project", handler);
      }
    };
  }, [projects]);

  const openUpgradeModal = (project) => {
    setUpgradeProject(project);
    setUpgradeWeeks([]);
    setUpgradeError("");
    setSelectedWeekId("default");
  };

  const closeUpgradeModal = () => {
    setUpgradeProject(null);
    setUpgradeWeeks([]);
    setUpgradeError("");
    setSelectedWeekId("");
  };

  const handleConfirmUpgrade = async () => {
    if (!upgradeProject) return;

    setUpgradeLoading(true);
    setUpgradeError("");

    try {
      const response = await fetch(
        `/api/projects/${upgradeProject.slug}/upgrade`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({}),
        }
      );

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result.error || "Upgrade failed");
      }

      const checkoutUrl = result.data?.checkoutUrl;
      if (!checkoutUrl) {
        throw new Error("No checkout URL returned from server");
      }

      toast.success("Redirecting to secure payment...");
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Upgrade to premium failed:", error);
      setUpgradeError(error.message || "Failed to upgrade to premium.");
      toast.error("Failed to start premium upgrade. Please try again.");
    } finally {
      setUpgradeLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch user's projects
      const projectsResponse = await fetch("/api/user?type=projects", {
        method: "GET",
        credentials: "include",
      });
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData.data.projects || []);
      }

      // Fetch user stats
      const statsResponse = await fetch("/api/user?type=stats", {
        method: "GET",
        credentials: "include",
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data || {});
      }

      // Fetch user profile
      const profileResponse = await fetch(`/api/user?type=profile&t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData.success) {
          setUserProfile(profileData.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };


  if (!user) {
    return null; // Redirecting...
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container-classic py-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2 text-foreground">
            Welcome back, {(userProfile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Creator").split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground">
            Manage your projects and track your launch performance.
          </p>
        </div>

        {/* Directory submission promo */}
        {autoSubmitConfig.enabled && (
        <section
          className="mb-8"
          aria-label="Directory submission service promotion"
        >
          <div
            ref={promoRef}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-[var(--radius)] border border-border bg-card px-4 py-4 sm:px-6 sm:py-5"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-foreground text-background shadow-sm">
                <Bot className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-foreground">
                  {autoSubmitConfig.title}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-2xl">
                  {autoSubmitConfig.description}
                </p>
                <Link
                  href={autoSubmitConfig.learnMoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground underline"
                >
                  {autoSubmitConfig.learnMoreText}
                </Link>
              </div>
            </div>
            <div className="flex md:flex-shrink-0">
              <a
                href={autoSubmitConfig.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-card text-foreground border-2 border-foreground rounded-[var(--radius)] font-semibold text-xs sm:text-sm no-underline transition duration-300 hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring min-h-[44px] sm:min-h-[48px] min-w-[200px] text-center uppercase"
              >
                <Bot className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                {autoSubmitConfig.dashboardCtaText}
              </a>
            </div>
          </div>
        </section>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-border mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "overview"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-2 inline" />
              Overview
            </button>
            {isEnabled("bookmarks") && (
              <button
                onClick={() => {
                  setActiveTab("bookmarks");
                  if (bookmarkedProjects.length === 0 && !bookmarksLoading) {
                    setBookmarksLoading(true);
                    fetch("/api/bookmarks?limit=50")
                      .then((res) => res.json())
                      .then((data) => {
                        if (data.success) {
                          setBookmarkedProjects(data.data.projects || []);
                        }
                      })
                      .catch(() => {})
                      .finally(() => setBookmarksLoading(false));
                  }
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "bookmarks"
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <Bookmark className="w-4 h-4 mr-2 inline" />
                Bookmarks
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && loading ? (
          // Loading State
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-[var(--radius)] border border-border bg-card p-6"
                  style={{ boxShadow: "var(--card-shadow)" }}
                >
                  <div className="animate-pulse">
                    <div className="bg-muted rounded h-4 w-20 mb-2"></div>
                    <div className="bg-muted rounded h-8 w-16 mb-2"></div>
                    <div className="bg-muted rounded h-3 w-24"></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-[var(--radius)] border border-border bg-card p-6"
                  style={{ boxShadow: "var(--card-shadow)" }}
                >
                  <div className="animate-pulse space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-muted w-12 h-12 rounded-lg"></div>
                      <div className="space-y-2">
                        <div className="bg-muted rounded h-4 w-32"></div>
                        <div className="bg-muted rounded h-3 w-24"></div>
                      </div>
                    </div>
                    <div className="bg-muted rounded h-12 w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === "overview" ? (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                icon={Users}
                title="Total Projects"
                value={projects.length}
                description="Submissions to date"
              />
              <StatsCard
                icon={Eye}
                title="Total Views"
                value={formatNumber(stats.totalViews || 0)}
                description="Profile page visits"
              />
            </div>

            {/* Projects Section */}
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground">Your Projects</h2>
                <p className="text-muted-foreground">
                  Manage and track your submitted projects
                </p>
              </div>

              {projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  <SubmitCard onLaunchClick={handleLaunchClick} />
                  {projects.map((project) => (
                    <ProjectCard 
                      key={project.id} 
                      project={project} 
                      onResumeDraft={handleResumeDraft}
                    />
                  ))}
                </div>
              ) : (
                // Empty State
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  <SubmitCard onLaunchClick={handleLaunchClick} />
                  <div className="col-span-1 md:col-span-1 lg:col-span-2">
                    <div className="text-center py-16">
                      <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-6">
                        <Plus className="w-12 h-12 text-muted-foreground/60" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-foreground">
                        No projects yet
                      </h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Ready to launch your first project? Submit it now and
                        start building your audience and getting valuable backlinks.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                        <Link href="/#projects-section" className="inline-flex items-center gap-2 px-6 py-3 bg-muted text-muted-foreground font-semibold rounded-[var(--radius)] border border-border hover:border-foreground hover:bg-muted transition">
                          Browse Examples
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Bookmarks Tab Content */}
        {activeTab === "bookmarks" && isEnabled("bookmarks") && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Bookmarked Projects</h2>
              <p className="text-muted-foreground">Projects you&apos;ve saved for later</p>
            </div>
            {bookmarksLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-[var(--radius)] border border-border bg-card p-6" style={{ boxShadow: "var(--card-shadow)" }}>
                    <div className="animate-pulse space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-muted w-12 h-12 rounded-lg"></div>
                        <div className="space-y-2">
                          <div className="bg-muted rounded h-4 w-32"></div>
                          <div className="bg-muted rounded h-3 w-24"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : bookmarkedProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookmarkedProjects.map((project: any) => (
                  <ProductCard
                    key={project.id}
                    project={{ ...project, userBookmarked: true }}
                    viewMode="grid"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-6">
                  <Bookmark className="w-12 h-12 text-muted-foreground/60" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">No bookmarks yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Browse projects and click the bookmark icon to save them here.
                </p>
                <Link href="/#projects-section" className="inline-flex items-center gap-2 px-6 py-3 bg-muted text-muted-foreground font-semibold rounded-[var(--radius)] border border-border hover:border-foreground hover:bg-muted transition">
                  Browse Projects
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Upgrade to Premium Modal */}
        {upgradeProject && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upgrade-title"
          >
            <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-[var(--radius)] border border-border bg-card" style={{ boxShadow: "var(--card-shadow)" }}>
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2
                  id="upgrade-title"
                  className="flex items-center gap-2 text-lg font-semibold text-foreground"
                >
                  <Crown className="h-5 w-5 text-foreground" strokeWidth={1.5} />
                  Upgrade to Premium
                </h2>
                <button
                  type="button"
                  onClick={closeUpgradeModal}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Close upgrade dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-5 px-6 py-5">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Upgrade <span className="font-semibold">{upgradeProject.name}</span>{" "}
                    to the Premium launch and:
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground" />
                      <span>Launch sooner with extra premium-only slots each week.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground" />
                      <span>Get 3+ guaranteed high-authority dofollow backlinks.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground" />
                      <span>Receive a premium badge and priority placement.</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    You will be redirected to secure payment. After payment, your project will be upgraded to Premium.
                  </p>
                  {upgradeError && (
                    <p className="text-xs text-destructive">{upgradeError}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                  <span>Secure payment is processed by Stripe.</span>
                  <span className="font-semibold text-foreground">$19 one-time</span>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
                <button
                  type="button"
                  onClick={closeUpgradeModal}
                  className="rounded-[var(--radius)] px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUpgrade}
                  disabled={upgradeLoading}
                  className="inline-flex items-center gap-2 rounded-[var(--radius)] border-2 border-foreground bg-foreground px-4 py-2 text-sm font-semibold text-background transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_2px_0_rgba(0,0,0,1)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
                >
                  {upgradeLoading && (
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  )}
                  {!upgradeLoading && (
                    <Rocket className="h-4 w-4" strokeWidth={2} />
                  )}
                  {upgradeLoading ? "Processing..." : "Upgrade & Pay $19"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <AutoSubmitModal
        isOpen={isAutoSubmitModalOpen}
        onClose={handleAutoSubmitModalClose}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={null}
    >
      <DashboardContent />
    </Suspense>
  );
}
