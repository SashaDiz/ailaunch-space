"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ProductCard } from '@/components/directory/ProductCard';
import { PaidPlacementCard } from '@/components/directory/PaidPlacementCard';
import { PartnersSection } from '@/components/marketing/PartnersSection';
import { cn } from '@/lib/utils';
import { AutoSubmitModal } from '@/components/shared/AutoSubmitModal';
import { useAutoSubmitConfig } from '@/hooks/use-autosubmit-config';
import { SocialProof } from '@/components/marketing/SocialProof';
import { useRouter, useSearchParams } from "next/navigation";
import { siteConfig } from "@/config/site.config";
import { featuresConfig } from '@/config/features.config';
import { directoryConfig } from '@/config/directory.config';
import { marketingConfig } from '@/config/marketing.config';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { Rocket, Bot, PlusCircle, Search, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import Pagination from "@/components/shared/Pagination";

const SORT_OPTIONS = directoryConfig.sortOptions;
const PRICING_OPTIONS = directoryConfig.pricingOptions;
const PAGE_SIZE = directoryConfig.pageSize;

/**
 * Merges projects with ad cards at fixed grid row positions on every page.
 */
function mergeProjectsWithAds<T extends { id: string }>(
  projects: T[],
  ads: T[],
  page: number,
): ({ type: "project"; project: T } | { type: "ad"; project: T })[] {
  if (ads.length === 0 || page > 2) {
    return projects.map((p) => ({ type: "project" as const, project: p }));
  }

  const shuffledAds = [...ads].sort(() => Math.random() - 0.5);
  const adSlots: T[] = [];
  for (let i = 0; i < 4; i++) {
    adSlots.push(shuffledAds[i % shuffledAds.length]);
  }

  const targetRows = [1, 4, 7, 11];
  const insertIndices = targetRows.map((row) => {
    const col = Math.floor(Math.random() * 3);
    return row * 3 + col;
  });

  const merged: ({ type: "project"; project: T } | { type: "ad"; project: T })[] =
    projects.map((p) => ({ type: "project" as const, project: p }));

  for (let i = insertIndices.length - 1; i >= 0; i--) {
    const idx = Math.min(insertIndices[i], merged.length);
    merged.splice(idx, 0, { type: "ad" as const, project: adSlots[i] });
  }

  const fullRows = Math.floor(merged.length / 3) * 3;
  return fullRows < merged.length ? merged.slice(0, fullRows) : merged;
}

interface HomePageClientProps {
  initialProjects: any[];
  initialCategories: { slug: string; name: string; app_count?: number; sphere?: string }[];
  initialGroupedCategories: Record<string, { slug: string; name: string; app_count?: number }[]>;
  initialPagination: { page: number; totalPages: number; totalCount: number };
}

function HomePage({
  initialProjects,
  initialCategories,
  initialGroupedCategories,
  initialPagination,
}: HomePageClientProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [loading, setLoading] = useState(false);
  const [featuredPremium, setFeaturedPremium] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const [isAutoSubmitModalOpen, setIsAutoSubmitModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPricing, setSelectedPricing] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ page?: number; totalPages?: number; totalCount?: number }>(initialPagination);
  const [categories, setCategories] = useState<{ slug: string; name: string; app_count?: number }[]>(initialCategories);
  const [groupedCategories, setGroupedCategories] = useState<Record<string, { slug: string; name: string; app_count?: number }[]>>(initialGroupedCategories);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { config: autoSubmitConfig } = useAutoSubmitConfig();

  // Schema.org structured data for the homepage
  const baseUrl = siteConfig.url;

  const homepageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": `${siteConfig.name} - ${siteConfig.tagline}`,
    "description": siteConfig.description,
    "url": baseUrl,
    "mainEntity": {
      "@type": "Organization",
      "name": siteConfig.name,
      "description": siteConfig.tagline,
      "url": baseUrl,
      "logo": `${baseUrl}${siteConfig.logo.light}`
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": baseUrl
        }
      ]
    }
  };

  const heroRef = useRef(null);
  const partnersRef = useRef(null);
  const mainContentRef = useRef(null);
  const projectsRef = useRef(null);
  const socialProofRef = useRef(null);
  const plusIconRef = useRef(null);

  // Initialize filters from URL params (e.g. /?category=AI&pricing=free)
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    const pricingParam = searchParams.get("pricing");
    const sortParam = searchParams.get("sort");

    if (categoryParam) {
      setSelectedCategories([categoryParam]);
    }
    if (pricingParam && PRICING_OPTIONS.some((p) => p.value === pricingParam)) {
      setSelectedPricing(pricingParam);
    }
    if (sortParam && SORT_OPTIONS.some((s) => s.value === sortParam)) {
      setSortBy(sortParam);
    }
  }, []);

  // When filters/sort change, reset to page 1
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCategories.join(","), selectedPricing, sortBy]);

  // Fetch projects when page or filters/sort change (skip initial load since we have server data)
  const initialLoadRef = useRef(true);
  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    fetchProjects(page);
  }, [page, searchQuery, selectedCategories.join(","), selectedPricing, sortBy]);

  // Featured section (load once)
  useEffect(() => {
    fetchFeatured();
  }, []);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if modal should be shown automatically (once per day)
  useEffect(() => {
    if (!isClient || !autoSubmitConfig.enabled) return;

    const checkAndShowModal = () => {
      const storageKey = "autoSubmitModalLastShown";
      const lastShownDate = localStorage.getItem(storageKey);
      const today = new Date().toDateString();

      if (!lastShownDate || lastShownDate !== today) {
        setIsAutoSubmitModalOpen(true);
      }
    };

    checkAndShowModal();
  }, [isClient, autoSubmitConfig.enabled]);

  const handleModalClose = () => {
    const storageKey = "autoSubmitModalLastShown";
    const today = new Date().toDateString();
    localStorage.setItem(storageKey, today);
    setIsAutoSubmitModalOpen(false);
  };

  const handleSubmitClick = (e) => {
    e.preventDefault();
    router.push('/submit');
  };

  // Initialize animations on mount
  useEffect(() => {
    if (!isClient) return;

    const tl = gsap.timeline();

    const refs = [
      heroRef.current,
      socialProofRef.current,
      partnersRef.current,
      mainContentRef.current,
    ].filter(Boolean);

    if (refs.length > 0) {
      gsap.set(refs, {
        opacity: 0,
        y: 30,
      });
    }

    if (heroRef.current) {
      tl.to(heroRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
      });
    }

    if (socialProofRef.current) {
      tl.to(
        socialProofRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
        },
        "-=0.5"
      );
    }

    if (partnersRef.current) {
      tl.to(
        partnersRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
        },
        "-=0.5"
      );
    }

    if (mainContentRef.current) {
      tl.to(
        mainContentRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
        },
        "-=0.6"
      );
    }

  }, [isClient]);

  // Animate projects when they change
  useEffect(() => {
    if (isClient && projectsRef.current && !loading && projects.length > 0) {
      const cards = projectsRef.current.children;
      gsap.fromTo(
        cards,
        {
          opacity: 0,
          y: 20,
          scale: 0.95,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.1,
        }
      );
    }
  }, [isClient, projects, loading]);

  const fetchProjects = async (pageNum: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: PAGE_SIZE.toString(),
        sort: sortBy,
        status: "live",
      });
      if (selectedCategories.length > 0) params.set("categories", selectedCategories.join(","));
      if (selectedPricing !== "all") params.set("pricing", selectedPricing);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const response = await fetch(`/api/projects?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data.data.projects || []);
        setPagination(data.data.pagination || {});
      } else {
        setProjects([]);
        setPagination({});
      }
    } catch (error) {
      console.error("Homepage: Failed to fetch projects:", error);
      setProjects([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatured = async () => {
    try {
      const [featuredRes, promoRes] = await Promise.all([
        fetch("/api/projects?section=featured"),
        fetch("/api/promotions?type=catalog").catch(() => null),
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

      setFeaturedPremium([...promoCards, ...premium]);
    } catch (error) {
      console.error("Homepage: Failed to fetch featured:", error);
      setFeaturedPremium([]);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProjects(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchProjects(newPage);
  };

  const handleCategoryToggle = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handlePlusIconHover = () => {
    if (isClient && plusIconRef.current) {
      gsap.to(plusIconRef.current, {
        rotation: 90,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  };

  const handlePlusIconLeave = () => {
    if (isClient && plusIconRef.current) {
      gsap.to(plusIconRef.current, {
        rotation: 0,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  };

  return (
    <div className="relative">
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homepageSchema),
        }}
      />
      {/* Decorative asymmetric blob with dramatic morphing - only on main page */}
      <div className="decorative-blob" aria-hidden="true"></div>
      <div className="relative z-10 container-classic py-4 sm:py-8">
        <div className="flex flex-col gap-6 lg:gap-8 w-full max-w-full">
          <section
            ref={heroRef}
            className="text-center pt-4 sm:pt-8 pb-4 sm:pb-8 w-full"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl leading-tight text-foreground mb-2 sm:mb-3">
              <span className="animate-flicker">Discover</span> AI tools built by indie founders
            </h1>
            <p className="text-base sm:text-md font-normal text-muted-foreground mb-4 sm:mb-6 max-w-xl mx-auto">
              {siteConfig.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Button
                onClick={handleSubmitClick}
                className="inline-flex items-center justify-center gap-2 min-h-[48px] w-full sm:w-auto sm:min-w-[200px] uppercase"
                style={{
                  boxShadow: "var(--button-shadow)",
                }}
                onMouseEnter={handlePlusIconHover}
                onMouseLeave={handlePlusIconLeave}
              >
                <PlusCircle ref={plusIconRef} className="h-4 w-4" strokeWidth={2} />
                Submit
              </Button>
              {autoSubmitConfig.enabled && (
              <Button
                variant="outline"
                onClick={() => setIsAutoSubmitModalOpen(true)}
                className="min-h-[48px] w-full sm:w-auto sm:min-w-[200px] uppercase"
                aria-label="Learn about auto submit service"
                style={{
                  boxShadow: "var(--button-shadow)",
                }}
              >
                <Bot className="h-4 w-4" strokeWidth={2} />
                Auto submit
              </Button>
              )}
            </div>
            {/* Social proof */}
            <div ref={socialProofRef} className="mt-6 sm:mt-8 flex flex-col items-center">
              <SocialProof />
            </div>
          </section>

          {/* Partners / Sponsors */}
          {featuresConfig.partners && (
            <section ref={partnersRef} className="w-full" aria-label="Our sponsors">
              <PartnersSection />
            </section>
          )}

          <section ref={mainContentRef} id="projects-section" className="overflow-visible">
            <div className="mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                Latest Projects
              </h2>
            </div>

            {/* Search, Filters, Sort */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
              <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" aria-hidden />
                  <Input
                    type="search"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10"
                    aria-label="Search projects"
                  />
                </div>
              </form>
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                {/* Category multi-select dropdown */}
                <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="default" className="h-10 gap-2">
                      {selectedCategories.length > 0 ? (
                        <>
                          <span>{selectedCategories.length} categor{selectedCategories.length === 1 ? "y" : "ies"}</span>
                          <span
                            role="button"
                            aria-label="Clear category filter"
                            className="ml-1 rounded-full hover:bg-muted p-0.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCategories([]);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </span>
                        </>
                      ) : (
                        "Categories"
                      )}
                      <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[260px] p-0" align="start">
                    <ScrollArea className="h-[300px]">
                      <div className="p-3 space-y-3">
                        {Object.keys(groupedCategories).length > 0
                          ? Object.entries(groupedCategories).map(([sphere, cats]) => (
                            <div key={sphere}>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{sphere}</p>
                              {cats.map((cat) => (
                                <label
                                  key={cat.slug}
                                  className="flex items-center gap-2 py-1.5 px-1 cursor-pointer rounded hover:bg-muted/50"
                                >
                                  <Checkbox
                                    checked={selectedCategories.includes(cat.slug)}
                                    onCheckedChange={() => handleCategoryToggle(cat.slug)}
                                  />
                                  <span className="text-sm flex-1">{cat.name}</span>
                                  {cat.app_count != null && (
                                    <span className="text-xs text-muted-foreground">{cat.app_count}</span>
                                  )}
                                </label>
                              ))}
                            </div>
                          ))
                          : categories.map((cat) => (
                            <label key={cat.slug} className="flex items-center gap-2 py-1.5 px-1 cursor-pointer rounded hover:bg-muted/50">
                              <Checkbox
                                checked={selectedCategories.includes(cat.slug)}
                                onCheckedChange={() => handleCategoryToggle(cat.slug)}
                              />
                              <span className="text-sm flex-1">{cat.name}</span>
                              {cat.app_count != null && (
                                <span className="text-xs text-muted-foreground">{cat.app_count}</span>
                              )}
                            </label>
                          ))}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>

                {/* Pricing dropdown */}
                <Select value={selectedPricing} onValueChange={(v) => setSelectedPricing(v)}>
                  <SelectTrigger className="w-[130px] h-10">
                    <SelectValue placeholder="Pricing" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICING_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort dropdown */}
                <Select value={sortBy} onValueChange={(v) => setSortBy(v)}>
                  <SelectTrigger className="w-[150px] h-10">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Project Listings */}
            {loading ? (
              <div ref={projectsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-card rounded-lg p-4 border border-border flex flex-col"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            ) : projects.length > 0 ? (
              <>
                {pagination.totalCount != null && (
                  <p className="text-sm text-muted-foreground mb-4" aria-live="polite">
                    {pagination.totalCount} project{pagination.totalCount !== 1 ? "s" : ""} found
                  </p>
                )}
                <div ref={projectsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mergeProjectsWithAds(projects, featuredPremium.slice(0, 2), page).map((item, idx) =>
                    item.type === "ad" ? (
                      <PaidPlacementCard key={`ad-${item.project.id}-${idx}`} project={item.project} />
                    ) : (
                      <ProductCard
                        key={item.project.id}
                        project={item.project}
                        viewMode="grid"
                      />
                    )
                  )}
                </div>
                {(pagination.totalPages ?? 0) > 1 && (
                  <div className="mt-8">
                    <Pagination
                      page={pagination.page ?? 1}
                      totalPages={pagination.totalPages ?? 1}
                      onPageChange={handlePageChange}
                      ariaLabel="Homepage projects pagination"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center text-center py-12 gap-6">
                <Rocket className="w-12 h-12 text-muted-foreground" strokeWidth={1} />
                <p className="text-muted-foreground text-md font-medium">
                  No projects found yet.
                </p>
                <Link
                  href="/submit"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-background text-foreground border-2 border-foreground rounded-lg font-semibold text-sm no-underline transition duration-300 hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground min-h-[48px] min-w-[200px]"
                  aria-label="Start the submit process for your directory or project"
                  title="Start submitting your directory or project"
                >
                  Be the first to submit!
                </Link>
              </div>
            )}
          </section>

        </div>
      </div>

      <AutoSubmitModal
        isOpen={isAutoSubmitModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
}

export default function HomePageClient(props: HomePageClientProps) {
  return (
    <Suspense>
      <HomePage {...props} />
    </Suspense>
  );
}
