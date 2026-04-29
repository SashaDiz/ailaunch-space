"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ExternalLink,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Users,
  Crown,
  X,
  Bot,
  Rocket,
} from "lucide-react";
import toast from "react-hot-toast";
import { SocialShare } from '@/components/shared/SocialShare';
import { CategoryBadge, PricingBadge } from '@/components/directory/CategoryBadge';
import { PaidPlacementCard } from '@/components/directory/PaidPlacementCard';
import { ProductCard } from '@/components/directory/ProductCard';
import { BookmarkButton } from '@/components/directory/BookmarkButton';
import { StarRating } from '@/components/directory/StarRating';
import { CommentSection } from '@/components/directory/CommentSection';
import { isEnabled } from '@/lib/features';
import { marketingConfig } from '@/config/marketing.config';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import UserProfileLink from '@/components/shared/UserProfileLink';
import { useUser } from '@/hooks/use-user';
import { useAutoSubmitConfig } from '@/hooks/use-autosubmit-config';
import { siteConfig } from "@/config/site.config";
import { getLogoDevUrl } from "@/lib/utils";

export function ProjectDetailClient({ initialProject }: { initialProject: any }) {
  const searchParams = useSearchParams();
  const submitted = searchParams.get("submitted") === "true";
  const { user } = useUser();
  const { config: autoSubmitConfig } = useAutoSubmitConfig();

  const [project, setProject] = useState(initialProject);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activeScreenshotIndex, setActiveScreenshotIndex] = useState(0);
  const modalRef = useRef(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeWeeks, setUpgradeWeeks] = useState([]);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");
  const [selectedWeekId, setSelectedWeekId] = useState("");
  const [showAutoSubmitModal, setShowAutoSubmitModal] = useState(false);
  const [featuredPremium, setFeaturedPremium] = useState([]);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [descriptionOverflows, setDescriptionOverflows] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    // 6rem = 96px — the max height for ~4 lines
    setDescriptionOverflows(el.scrollHeight > 96);
  }, [project.full_description]);

  useEffect(() => {
    if (isGalleryOpen && modalRef.current) {
      modalRef.current.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isGalleryOpen]);

  useEffect(() => {
    if (!submitted) return;

    toast.success(
      "Submission received! Your project is under review. We'll email you once it's approved and live.",
      {
        duration: 5000,
      }
    );

    if (typeof window === "undefined" || !project?.slug || !autoSubmitConfig.enabled) return;
    try {
      const storageKey = `autoSubmitModalShown_${project.slug}`;
      const hasShown = window.localStorage.getItem(storageKey);
      if (!hasShown) {
        setShowAutoSubmitModal(true);
        window.localStorage.setItem(storageKey, "true");
      }
    } catch (error) {
      setShowAutoSubmitModal(true);
    }
  }, [submitted, project?.slug, autoSubmitConfig.enabled]);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const [featuredRes, promoRes] = await Promise.all([
          fetch("/api/projects?section=featured"),
          fetch("/api/promotions?type=detail").catch(() => null),
        ]);

        let premium = [];
        if (featuredRes.ok) {
          const data = await featuredRes.json();
          premium = data.data?.premiumProjects || [];
        }

        let promoCards = [];
        if (promoRes && promoRes.ok) {
          const promoData = await promoRes.json();
          promoCards = (promoData.data || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.id,
            logo_url: p.logo_url,
            short_description: p.short_description,
            website_url: p.website_url,
            promotion_id: p.id,
            cta_text: p.cta_text,
          }));
        }

        if (promoCards.length === 0 && marketingConfig.mockPromotion?.enabled) {
          const mock = marketingConfig.mockPromotion;
          promoCards = [{
            id: 'mock-promo',
            name: mock.name,
            slug: 'mock-promo',
            logo_url: mock.logoUrl,
            short_description: mock.shortDescription,
            website_url: mock.websiteUrl,
            cta_text: mock.ctaText,
          }];
        }

        // Deduplicate promo cards by advertiser name — show max 1 per advertiser
        const seen = new Set<string>();
        const uniquePromoCards = promoCards.filter((p: any) => {
          if (seen.has(p.name)) return false;
          seen.add(p.name);
          return true;
        });

        setFeaturedPremium([...uniquePromoCards, ...premium]);
      } catch {
        setFeaturedPremium([]);
      }
    }
    fetchFeatured();
  }, []);

  // Re-fetch project data client-side to get user-specific data (votes, bookmarks, ratings)
  useEffect(() => {
    if (!initialProject?.slug) return;
    fetch(`/api/projects/${initialProject.slug}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.data?.project) {
          setProject(data.data.project);
        }
      })
      .catch(() => {});
  }, [initialProject?.slug, user?.id]);

  const openGalleryAtIndex = (index) => {
    setActiveScreenshotIndex(index);
    setIsGalleryOpen(true);
  };

  const closeGallery = () => {
    setIsGalleryOpen(false);
  };

  const showNextScreenshot = () => {
    if (!project?.screenshots?.length) return;
    setActiveScreenshotIndex((prevIndex) =>
      prevIndex === project.screenshots.length - 1 ? 0 : prevIndex + 1
    );
  };

  const showPreviousScreenshot = () => {
    if (!project?.screenshots?.length) return;
    setActiveScreenshotIndex((prevIndex) =>
      prevIndex === 0 ? project.screenshots.length - 1 : prevIndex - 1
    );
  };

  const handleGalleryKeyDown = (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      closeGallery();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showNextScreenshot();
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPreviousScreenshot();
    }
  };

  const handleVisitWebsite = async () => {
    try {
      await fetch(`/api/projects/${project.slug}/click`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to track click:", error);
    }
  };

  const getWebsiteLink = () => {
    if (!project?.website_url) return { url: '#', rel: 'nofollow noopener noreferrer' };

    try {
      const url = new URL(project.website_url);
      url.searchParams.set('ref', siteConfig.refParameter);

      const isDofollow = project.link_type === "dofollow";

      return {
        url: url.toString(),
        rel: isDofollow ? "noopener noreferrer" : "nofollow noopener noreferrer"
      };
    } catch (error) {
      return { url: project.website_url, rel: 'nofollow noopener noreferrer' };
    }
  };

  const websiteLink = project ? getWebsiteLink() : { url: '#', rel: 'nofollow noopener noreferrer' };

  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-transparent">
        <div className="container-classic py-8">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The project you're looking for doesn't exist or has been
              removed.
            </p>
            <Link href="/" className="inline-flex items-center justify-center rounded-lg border-2 border-foreground px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user && project.submitted_by === user.id;
  const canUpgradeToPremium =
    isOwner &&
    (!project.is_draft || project.payment_status) &&
    project.plan === "standard" &&
    (project.status === "pending" ||
      project.status === "scheduled" ||
      project.statusBadge === "scheduled");

  const openUpgradeModal = () => {
    setUpgradeOpen(true);
    setUpgradeWeeks([]);
    setUpgradeError("");
    setSelectedWeekId("default");
  };

  const closeUpgradeModal = () => {
    setUpgradeOpen(false);
    setUpgradeWeeks([]);
    setUpgradeError("");
    setSelectedWeekId("");
  };

  const handleAutoSubmitModalClose = () => {
    setShowAutoSubmitModal(false);
  };

  const handleConfirmUpgrade = async () => {
    if (!project) return;

    setUpgradeLoading(true);
    setUpgradeError("");

    try {
      const response = await fetch(`/api/projects/${project.slug}/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });

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
              <BreadcrumbPage className="truncate max-w-[300px]">
                {project.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Success Banner for Submitted Projects */}
        {submitted && (
          <div className="flex items-center gap-3 rounded-[var(--radius)] border border-success/30 bg-success/10 p-4 text-success mb-8"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <CheckCircle2 className="w-6 h-6" />
            <div>
              <h3 className="font-medium text-success">Submission received</h3>
              <div className="text-sm text-success-foreground">
                Thanks for submitting "{project.name}". We're reviewing your
                project now. Once approved, we'll email you when it goes live.
              </div>
            </div>
          </div>
        )}

        {/* Floating Social Share - Only on larger screens */}
        <SocialShare
          projectId={project.id}
          slug={project.slug}
          title={`Discover ${project.name} - Featured Project on ${siteConfig.name}`}
          description={project.tagline || project.description}
          url={project.website_url}
          hashtags={[
            project.category
              ? project.category.replace(/[^a-zA-Z0-9]/g, "")
              : "",
            siteConfig.name.replace(/\s+/g, ''),
          ]}
          variant="floating"
          className="hidden lg:block"
        />

        <div className="flex flex-col gap-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header Section */}
              <div className="rounded-[var(--radius)] border border-border bg-card mb-8" style={{
                boxShadow: "var(--card-shadow)",
              }}>
                <div className="p-6">
                  <div className="flex gap-6">
                    {/* Logo on top */}
                    <div className="flex justify-start">
                      <div className="avatar">
                        <div className="w-32 h-32 rounded-[var(--radius)] border border-border">
                          {(project.logo_url || getLogoDevUrl(project.website_url)) ? (
                            <Image
                              src={project.logo_url || getLogoDevUrl(project.website_url)}
                              alt={`${project.name} logo`}
                              width={128}
                              height={128}
                              className="rounded-[var(--radius)] object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-foreground bg-muted rounded-[var(--radius)]">
                              {project.name?.[0] ?? "?"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Project Name and Description below logo */}
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <h1 className="text-2xl lg:text-3xl font-bold">
                          {project.name}
                        </h1>

                        {project.premium_badge && (
                          <span className="inline-flex leading-none items-center gap-1 px-1 py-0.5 text-[11px] font-medium text-background rounded-sm" style={{ backgroundColor: 'hsl(var(--foreground))' }}>
                            <Crown className="w-4 h-4" strokeWidth={1.5} />
                            <span className="mt-0.5">Premium</span>
                          </span>
                        )}
                        {project.status === "pending" && (
                          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-warning/20 text-warning ring-1 ring-inset ring-warning/30">Under Review</span>
                        )}
                      </div>

                      <p className="text-muted-foreground text-md mb-4">
                        {project.short_description}
                      </p>

                      {/* Categories and Pricing */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.categories?.map((category) => (
                          <CategoryBadge
                            key={category}
                            category={category}
                            size="sm"
                          />
                        ))}
                        {project.pricing && (
                          <PricingBadge pricing={project.pricing} size="sm" />
                        )}
                      </div>

                      {/* Average rating (display only; user rates in comment section) */}
                      {isEnabled("ratings") && (
                        <div className="mt-2">
                          <StarRating
                            appId={project.id}
                            averageRating={project.average_rating ?? 0}
                            ratingsCount={project.ratings_count ?? 0}
                            userRating={null}
                            readonly
                            size="md"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-row items-center justify-between gap-2 flex-wrap">
                    {/* User Information */}
                    {project.user && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Created by</span>
                          <UserProfileLink
                            userId={project.user.id}
                            userName={project.user.name}
                            userAvatar={project.user.avatar}
                            size="sm"
                            className="text-foreground hover:text-foreground"
                          />
                        </div>
                      </div>
                    )}
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <SocialShare
                        projectId={project.id}
                        slug={project.slug}
                        title={project.name}
                        description={project.tagline || project.description}
                        url={project.website_url}
                        hashtags={[
                          project.category
                            ? project.category.replace(/[^a-zA-Z0-9]/g, "")
                            : "",
                          siteConfig.name.replace(/\s+/g, ''),
                        ]}
                        className="inline"
                      />

                      {isEnabled("bookmarks") && (
                        <BookmarkButton appId={project.id} initialBookmarked={project.userBookmarked ?? false} size="md" />
                      )}

                      <a
                        href={websiteLink.url}
                        target="_blank"
                        rel={websiteLink.rel}
                        onClick={handleVisitWebsite}
                        className="cursor-pointer h-10 w-10 flex items-center justify-center rounded-md border border-border bg-muted px-2.5 py-1.5 text-muted-foreground hover:bg-foreground hover:text-background transition"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>

                    {/* Owner-only upgrade CTA */}
                    {canUpgradeToPremium && (
                      <div className="w-full rounded-xl border border-border bg-muted p-3 text-right">
                        <p className="text-xs text-muted-foreground">
                          Launch sooner get guaranteed dofollow backlinks.
                        </p>
                        <button
                          type="button"
                          onClick={openUpgradeModal}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border-2 border-foreground bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_2px_0_rgba(0,0,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          Upgrade to Premium
                          <Crown className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Screenshots */}
              {project.screenshots && project.screenshots.length > 0 && (
                <div className="rounded-[var(--radius)] border border-border bg-card" style={{
                  boxShadow: "var(--card-shadow)",
                }}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold">Screenshots</h2>
                      {project.screenshots.length > 1 && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="p-1.5 rounded-md border border-border hover:bg-muted transition-colors"
                            onClick={() => {
                              const el = document.getElementById('screenshots-slider');
                              if (el) el.scrollBy({ left: -320, behavior: 'smooth' });
                            }}
                            aria-label="Scroll screenshots left"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1.5 rounded-md border border-border hover:bg-muted transition-colors"
                            onClick={() => {
                              const el = document.getElementById('screenshots-slider');
                              if (el) el.scrollBy({ left: 320, behavior: 'smooth' });
                            }}
                            aria-label="Scroll screenshots right"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div
                      id="screenshots-slider"
                      className="flex gap-3 overflow-x-auto scroll-smooth scrollbar-hide"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {project.screenshots.map((screenshot, index) => (
                        <div
                          key={index}
                          className="flex-none w-[280px] sm:w-[320px] aspect-video border border-border rounded-lg overflow-hidden bg-muted"
                        >
                          <button
                            type="button"
                            className="w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring"
                            onClick={() => openGalleryAtIndex(index)}
                            aria-label={`Open screenshot ${index + 1} of ${project.screenshots.length} in gallery`}
                          >
                            <Image
                              src={screenshot}
                              alt={`${project.name} screenshot ${index + 1}`}
                              width={640}
                              height={360}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Full Description */}
              {project.full_description && (
                <div className="rounded-[var(--radius)] border border-border bg-card" style={{
                  boxShadow: "var(--card-shadow)",
                }}>
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-4">
                      About {project.name}
                    </h2>
                    <div
                      ref={descriptionRef}
                      className={`prose max-w-none relative ${!descriptionExpanded && descriptionOverflows ? "max-h-[6rem] overflow-hidden" : ""}`}
                      aria-expanded={descriptionExpanded}
                    >
                      <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
                        {project.full_description}
                      </p>
                      {!descriptionExpanded && descriptionOverflows && (
                        <div
                          className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent pointer-events-none"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    {descriptionOverflows && (
                      <button
                        type="button"
                        onClick={() => setDescriptionExpanded((v) => !v)}
                        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                      >
                        {descriptionExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4" aria-hidden />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" aria-hidden />
                            Show full description
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}


              {/* Video */}
              {project.video_url && (
                <div className="rounded-[var(--radius)] border border-border bg-card" style={{
                  boxShadow: "var(--card-shadow)",
                }}>
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-4">Demo Video</h2>
                    <div className="aspect-video">
                      <iframe
                        src={project.video_url}
                        className="w-full h-full rounded-lg"
                        allowFullScreen
                        title={`${project.name} demo video`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Comments */}
              {isEnabled("comments") && (
                <div className="rounded-[var(--radius)] border border-border bg-card" style={{
                  boxShadow: "var(--card-shadow)",
                }}>
                  <div className="p-6">
                    <CommentSection
                      appId={project.id}
                      projectOwnerId={project.submitted_by}
                      userHasRated={project.userRating != null}
                      onRatingUpdate={() => {
                        fetch(`/api/projects/${project.slug}`)
                          .then((res) => (res.ok ? res.json() : null))
                          .then((data) => {
                            if (data?.data?.project) setProject(data.data.project);
                          })
                          .catch(() => {});
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-8 lg:sticky lg:top-32 lg:self-start">
              {/* Project Info */}
              <div className="rounded-[var(--radius)] border border-border bg-card" style={{
                boxShadow: "var(--card-shadow)",
              }}>
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-4">Project Details</h3>
                  <div className="space-y-3 text-sm">
                    {project.pricing && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Pricing:</span>
                        <PricingBadge
                          pricing={project.pricing}
                          clickable={false}
                        />
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${project.statusBadge === "past"
                          ? "bg-muted text-muted-foreground ring-border"
                          : project.statusBadge === "scheduled"
                            ? "bg-warning/20 text-warning ring-warning/30"
                            : "bg-success/20 text-success ring-success/30"
                          }`}
                      >
                        {project.statusBadge === "past" ? "Past" :
                          project.statusBadge === "scheduled" ? "Scheduled" :
                            "Live"}
                      </span>
                    </div>

                    {project.plan && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Plan:</span>
                        <span className="font-medium capitalize">
                          {project.plan}
                        </span>
                      </div>
                    )}

                    {formatDate(project.launch_date || project.created_at) && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Launch Date:</span>
                        <span className="font-medium">
                          {formatDate(project.launch_date || project.created_at)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Views:</span>
                      <span className="font-medium">{project.views}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PaidPlacementCard - featured premium projects */}
              {featuredPremium
                .filter((p) => p.id !== project.id)
                .slice(0, 2)
                .map((adProject) => (
                  <PaidPlacementCard key={adProject.id} project={adProject} />
                ))}

              {/* Maker Info */}
              {(project.maker_name || project.maker_twitter) && (
                <div className="rounded-[var(--radius)] border border-border bg-card" style={{
                  boxShadow: "var(--card-shadow)",
                }}>
                  <div className="p-6">
                    <h3 className="text-lg font-bold mb-4">
                      <Users className="w-5 h-5 inline mr-2" />
                      Maker
                    </h3>
                    <div className="space-y-2">
                      {project.maker_name && (
                        <div className="font-medium">{project.maker_name}</div>
                      )}
                      {project.maker_twitter && (
                        <div>
                          <a
                            href={`https://twitter.com/${project.maker_twitter.replace(
                              "@",
                              ""
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline-offset-4 hover:underline text-sm"
                          >
                            {project.maker_twitter}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Related Projects */}
            {project.relatedProjects &&
              project.relatedProjects.length > 0 && (
                  <div className="py-6">
                    <h2 className="text-xl font-bold mb-6">
                      Related Projects
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {project.relatedProjects.map((related) => (
                        <ProductCard
                          key={related.id}
                          project={{ ...related, categories: related.categories || [] }}
                          viewMode="grid"
                        />
                      ))}
                    </div>
                  </div>
              )}
        </div>
      </div>

      {/* Screenshot Gallery Modal */}
      {isGalleryOpen && project.screenshots && project.screenshots.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Project screenshots"
          onClick={closeGallery}
        >
          <div
            ref={modalRef}
            tabIndex={-1}
            className="relative w-full max-w-5xl outline-none"
            onKeyDown={handleGalleryKeyDown}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm text-background/80">
                Screenshot {activeScreenshotIndex + 1} of {project.screenshots.length}
              </p>
              <button
                type="button"
                onClick={closeGallery}
                className="inline-flex items-center justify-center rounded-full bg-card/90 hover:bg-card px-3 py-1 text-sm font-medium text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-background"
              >
                Close
              </button>
            </div>

            <div className="relative bg-background rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={showPreviousScreenshot}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-foreground/60 text-background hover:bg-foreground/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-background"
                aria-label="Previous screenshot"
              >
                &#8249;
              </button>

              <div className="aspect-video w-full bg-muted">
                <Image
                  src={project.screenshots[activeScreenshotIndex]}
                  alt={`${project.name} screenshot ${activeScreenshotIndex + 1}`}
                  width={1200}
                  height={675}
                  className="w-full h-full object-contain bg-background"
                />
              </div>

              <button
                type="button"
                onClick={showNextScreenshot}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-foreground/60 text-background hover:bg-foreground/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-background"
                aria-label="Next screenshot"
              >
                &#8250;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade to Premium Modal (owner only) */}
      {upgradeOpen && canUpgradeToPremium && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upgrade-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl bg-card shadow-xl">
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
                  Upgrade{" "}
                  <span className="font-semibold">{project.name}</span> to the
                  Premium launch and:
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground" />
                    <span>
                      Access premium-only slots in upcoming weeks and launch
                      sooner.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground" />
                    <span>Get 3+ guaranteed high-authority backlinks.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground" />
                    <span>Unlock premium badge and priority placement.</span>
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
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUpgrade}
                disabled={upgradeLoading}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-foreground bg-foreground px-4 py-2 text-sm font-semibold text-background transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_2px_0_rgba(0,0,0,1)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
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

      {/* Post-submission Auto-Submit Modal */}
      {showAutoSubmitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 backdrop-blur-sm px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auto-submit-modal-title"
          aria-describedby="auto-submit-modal-description"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleAutoSubmitModalClose();
            }
          }}
        >
          <div
            className="relative w-full max-w-md rounded-[var(--radius)] border border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-8">
              <button
                onClick={handleAutoSubmitModalClose}
                className="absolute top-4 right-4 text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted rounded-[var(--radius)] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" strokeWidth={2} />
              </button>

              <div className="mb-6">
                <h2
                  id="auto-submit-modal-title"
                  className="text-xl sm:text-2xl font-bold text-foreground mb-2"
                >
                  Submission received
                </h2>
                <p
                  id="auto-submit-modal-description"
                  className="text-sm text-foreground"
                >
                  Thanks for submitting{" "}
                  <span className="font-semibold">{project.name}</span>. We&apos;re
                  reviewing it now. Once approved, we'll email you when it goes live.
                </p>
              </div>

              <div className="mb-4 border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  {autoSubmitConfig.projectDetailHeading}
                </h3>
                <p className="text-sm text-foreground mb-4">
                  {autoSubmitConfig.projectDetailDescription}
                </p>
              </div>

              <div className="flex flex-col gap-3 items-center justify-center">
                <a
                  href={autoSubmitConfig.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background rounded-lg font-semibold text-sm no-underline transition duration-300 hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 min-h-[48px] uppercase"
                  onClick={handleAutoSubmitModalClose}
                >
                  <Bot className="w-4 h-4" strokeWidth={2} />
                  {autoSubmitConfig.projectDetailCtaText}
                </a>
                <button
                  type="button"
                  onClick={handleAutoSubmitModalClose}
                  className="text-muted-foreground hover:text-foreground underline text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 min-h-[24px]"
                >
                  {autoSubmitConfig.projectDetailDismissText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
