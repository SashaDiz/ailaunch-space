"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  FilterAlt,
  Plus,
  Eye,
  Calendar,
  ViewGrid,
  List,
  NavArrowDown,
  Xmark,
} from "iconoir-react";
import toast from "react-hot-toast";
import { ProductCard } from "../components/ProductCard";

const SORT_OPTIONS = [
  { value: "upvotes", label: "Most Votes", icon: Plus },
  { value: "recent", label: "Recently Added", icon: Calendar },
  { value: "views", label: "Most Views", icon: Eye },
];

const VIEW_MODES = [
  { value: "list", label: "List View", icon: List },
  { value: "grid", label: "Grid View", icon: ViewGrid },
];

function FilterSidebar({
  categories,
  selectedCategories,
  setSelectedCategories,
  selectedPricing,
  setSelectedPricing,
  onClose,
}) {
  const [pricingOptions, setPricingOptions] = useState([]);
  const [groupedCategories, setGroupedCategories] = useState({});

  useEffect(() => {
    fetchPricingOptions();
    fetchGroupedCategories();
  }, []);

  const fetchPricingOptions = async () => {
    try {
      const response = await fetch("/api/categories?type=pricing&includeCount=true");
      if (response.ok) {
        const data = await response.json();
        setPricingOptions(data.data.pricing || []);
      }
    } catch (error) {
      console.error("Failed to fetch pricing options:", error);
      // Fallback to static options
      setPricingOptions([
        { value: "free", label: "Free", app_count: 0 },
        { value: "freemium", label: "Freemium", app_count: 0 },
        { value: "paid", label: "Paid", app_count: 0 },
      ]);
    }
  };

  const fetchGroupedCategories = async () => {
    try {
      const response = await fetch("/api/categories?includeCount=true");
      if (response.ok) {
        const data = await response.json();
        setGroupedCategories(data.data.groupedCategories || {});
      }
    } catch (error) {
      console.error("Failed to fetch grouped categories:", error);
    }
  };

  // Generate color for category dots
  const getCategoryDotColor = (category) => {
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-green-500",
      "bg-pink-500",
      "bg-orange-500",
      "bg-indigo-500",
      "bg-cyan-500",
      "bg-emerald-500",
      "bg-lime-500",
      "bg-violet-500",
      "bg-rose-500",
      "bg-amber-500",
      "bg-teal-500",
      "bg-slate-500",
      "bg-red-500",
      "bg-yellow-500",
    ];

    return colors[Math.abs(hash) % colors.length];
  };

  // Handle category selection
  const handleCategoryToggle = (categorySlug) => {
    setSelectedCategories(prev => {
      if (prev.includes(categorySlug)) {
        return prev.filter(slug => slug !== categorySlug);
      } else {
        return [...prev, categorySlug];
      }
    });
  };

  // Clear all selected categories
  const clearAllCategories = () => {
    setSelectedCategories([]);
  };

  return (
    <div className="bg-base-100 border border-base-300 rounded-lg p-4 space-y-6 max-h-screen overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center">Filters</h3>
        {onClose && (
          <button onClick={onClose} className="btn btn-ghost btn-xs">
            <Xmark className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-sm text-base-content/80">
            Categories
          </h4>
          {selectedCategories.length > 0 && (
            <button
              onClick={clearAllCategories}
              className="text-xs text-primary hover:text-primary/80"
            >
              Clear all
            </button>
          )}
        </div>
        
        {selectedCategories.length > 0 && (
          <div className="mb-3 p-2 bg-primary/10 rounded-lg">
            <div className="text-xs text-primary font-medium mb-1">
              {selectedCategories.length} selected
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedCategories.map((categorySlug) => {
                // Find category name from all categories
                const category = [...categories, ...Object.values(groupedCategories).flat()]
                  .find(cat => cat.slug === categorySlug);
                return (
                  <span
                    key={categorySlug}
                    className="badge badge-primary badge-xs"
                  >
                    {category?.name || categorySlug}
                    <button
                      onClick={() => handleCategoryToggle(categorySlug)}
                      className="ml-1 hover:bg-primary/20 rounded-full w-3 h-3 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Grouped Categories with Scroll */}
        <div className="max-h-80 overflow-y-auto border border-base-300 rounded-lg">
          {Object.keys(groupedCategories).length > 0 ? (
            Object.entries(groupedCategories).map(([sphere, sphereCategories]) => (
              <div key={sphere} className="border-b border-base-300 last:border-b-0">
                {/* Sphere Header */}
                <div className="px-3 py-2 bg-base-200 text-xs font-medium text-base-content/70 sticky top-0 z-10">
                  {sphere}
                </div>
                
                {/* Categories in Sphere */}
                <div className="py-1">
                  {sphereCategories.map((category) => (
                    <label
                      key={category.slug}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-base-200 rounded-md p-2 mx-1"
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-sm"
                        checked={selectedCategories.includes(category.slug)}
                        onChange={() => handleCategoryToggle(category.slug)}
                      />
                      <span className={`w-2 h-2 ${getCategoryDotColor(category.name)} rounded-full flex-shrink-0`}></span>
                      <span className="text-sm flex-1 truncate">{category.name}</span>
                      {category.app_count > 0 && (
                        <span className="badge badge-ghost badge-xs flex-shrink-0">
                          {category.app_count}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ))
          ) : (
            /* Fallback to simple list if grouped data not available */
            <div className="p-2">
              {categories.map((category) => (
                <label
                  key={category.slug}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-base-200 rounded-md p-2"
                >
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary checkbox-sm"
                    checked={selectedCategories.includes(category.slug)}
                    onChange={() => handleCategoryToggle(category.slug)}
                  />
                  <span className={`w-2 h-2 ${getCategoryDotColor(category.name)} rounded-full flex-shrink-0`}></span>
                  <span className="text-sm flex-1 truncate">{category.name}</span>
                  {category.app_count > 0 && (
                    <span className="badge badge-ghost badge-xs flex-shrink-0">
                      {category.app_count}
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pricing */}
      <div>
        <h4 className="font-medium mb-3 text-sm text-base-content/80">
          Pricing
        </h4>
        
        {/* All Pricing Option */}
        <div className="mb-3">
          <label className="flex items-center space-x-2 cursor-pointer hover:bg-base-200 rounded-md p-2 -m-2">
            <input
              type="radio"
              name="pricing"
              className="radio radio-primary radio-sm"
              checked={selectedPricing === "all"}
              onChange={() => setSelectedPricing("all")}
            />
            <span className="text-sm font-medium">All Pricing</span>
          </label>
        </div>

        {/* Pricing Options with Scroll */}
        <div className="max-h-32 overflow-y-auto border border-base-300 rounded-lg">
          <div className="p-2">
            {pricingOptions.map((pricing) => (
              <label
                key={pricing.value}
                className="flex items-center space-x-2 cursor-pointer hover:bg-base-200 rounded-md p-2"
              >
                <input
                  type="radio"
                  name="pricing"
                  className="radio radio-primary radio-sm"
                  checked={selectedPricing === pricing.value}
                  onChange={() => setSelectedPricing(pricing.value)}
                />
                <span className="text-sm flex-1 truncate">{pricing.label}</span>
                {pricing.app_count > 0 && (
                  <span className="badge badge-ghost badge-xs flex-shrink-0">
                    {pricing.app_count}
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      <button
        onClick={() => {
          setSelectedCategories([]);
          setSelectedPricing("all");
        }}
        className="btn btn-outline btn-sm w-full"
      >
        Clear All Filters
      </button>
    </div>
  );
}

function ProjectsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [selectedCategories, setSelectedCategories] = useState(
    searchParams.get("categories") ? searchParams.get("categories").split(",") : []
  );
  const [selectedPricing, setSelectedPricing] = useState("all");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "upvotes");
  const [viewMode, setViewMode] = useState("list");
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchCategories();
  }, []);

  // Sync URL params to state after hydration
  useEffect(() => {
    const categoriesParam = searchParams.get("categories");
    setSelectedCategories(categoriesParam ? categoriesParam.split(",") : []);
    setSelectedPricing(searchParams.get("pricing") || "all");
  }, [searchParams]);

  useEffect(() => {
    fetchProjects();
  }, [selectedCategories, selectedPricing, sortBy, searchQuery]);

  // Update URL when filters change (but not on initial load)
  useEffect(() => {
    if (projects.length > 0) {
      // Only after initial load
      handleFilterChange();
    }
  }, [selectedCategories, selectedPricing, sortBy]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories?includeCount=true");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data.categories || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchProjects = async (page = 1) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        sort: sortBy,
        status: "live",
      });

      if (selectedCategories.length > 0) {
        params.set("categories", selectedCategories.join(","));
      }

      if (selectedPricing !== "all") {
        params.set("pricing", selectedPricing);
      }

      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      const response = await fetch(`/api/projects?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data.data.projects || []);
        setPagination(data.data.pagination || {});
      } else {
        toast.error("Failed to load AI projects");
      }
    } catch (error) {
      console.error("Failed to fetch AI projects:", error);
      toast.error("Failed to load AI projects");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProjects(1);
    // Update URL
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (selectedCategories.length > 0) params.set("categories", selectedCategories.join(","));
    if (selectedPricing !== "all") params.set("pricing", selectedPricing);
    if (sortBy !== "upvotes") params.set("sort", sortBy);

    const newUrl = params.toString()
      ? `/projects?${params}`
      : "/projects";
    router.push(newUrl, { shallow: true });
  };

  const handlePageChange = (newPage) => {
    fetchProjects(newPage);
  };

  const handleFilterChange = () => {
    // Update URL with current filter state
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (selectedCategories.length > 0) params.set("categories", selectedCategories.join(","));
    if (selectedPricing !== "all") params.set("pricing", selectedPricing);
    if (sortBy !== "upvotes") params.set("sort", sortBy);

    const newUrl = params.toString()
      ? `/projects?${params}`
      : "/projects";
    router.push(newUrl, { shallow: true });
  };

  const handleProjectVote = (projectId, newVoteCount, userVoted) => {
    // Update the AI project in the projects list
    setProjects((prevProjects) =>
      prevProjects.map((project) =>
        project.id === projectId
          ? { ...project, upvotes: newVoteCount, userVoted }
          : project
      )
    );
  };

  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            Browse AI Projects
          </h1>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            Discover curated AI projects from our community of makers and
            entrepreneurs.
          </p>
        </div>

        {/* Search and Controls */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-base-content/50" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search AI projects..."
                  className="input input-bordered w-full pl-10 bg-base-200/50"
                />
              </div>
            </form>

            {/* Controls */}
            <div className="flex items-center space-x-3">
              {/* Sort Dropdown */}
              <div className="dropdown dropdown-end">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-outline btn-sm"
                >
                  {React.createElement(
                    SORT_OPTIONS.find((opt) => opt.value === sortBy)?.icon ||
                      Plus,
                    { className: "w-4 h-4 mr-2" }
                  )}
                  {SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label}
                  <NavArrowDown className="w-3 h-3 ml-1" />
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box w-56 border border-base-300 mt-1"
                >
                  {SORT_OPTIONS.map((option) => (
                    <li key={option.value}>
                      <button
                        onClick={() => setSortBy(option.value)}
                        className={`flex items-center ${
                          sortBy === option.value ? "active" : ""
                        }`}
                      >
                        {React.createElement(option.icon, {
                          className: "w-4 h-4 mr-2",
                        })}
                        {option.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* View Mode Toggle */}
              <div className="hidden sm:flex btn-group">
                {VIEW_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setViewMode(mode.value)}
                    className={`btn btn-sm ${
                      viewMode === mode.value ? "btn-active" : "btn-outline"
                    }`}
                  >
                    {React.createElement(mode.icon, { className: "w-4 h-4" })}
                  </button>
                ))}
              </div>

              {/* Filter Toggle (Mobile) */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-outline btn-sm lg:hidden"
              >
                <FilterAlt className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div
            className={`lg:col-span-1 ${
              showFilters ? "block" : "hidden lg:block"
            }`}
          >
            <div className="sticky top-24">
              <FilterSidebar
                categories={categories}
                selectedCategories={selectedCategories}
                setSelectedCategories={setSelectedCategories}
                selectedPricing={selectedPricing}
                setSelectedPricing={setSelectedPricing}
                onClose={() => setShowFilters(false)}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-base-content/60">
                {loading
                  ? "Loading..."
                  : `${pagination.totalCount || 0} AI projects found`}
              </div>
              <div className="text-sm text-base-content/60">
                Page {pagination.page || 1} of {pagination.totalPages || 1}
              </div>
            </div>

            {/* AI Projects Grid/List */}
            {loading ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                    : "space-y-4"
                }
              >
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="card bg-base-100 shadow-sm border border-base-300"
                  >
                    <div className="card-body p-4">
                      <div className="animate-pulse">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="skeleton w-12 h-12 rounded-lg"></div>
                          <div className="space-y-2">
                            <div className="skeleton h-4 w-32"></div>
                            <div className="skeleton h-3 w-24"></div>
                          </div>
                        </div>
                        <div className="skeleton h-12 w-full mb-3"></div>
                        <div className="flex space-x-1">
                          <div className="skeleton h-5 w-16"></div>
                          <div className="skeleton h-5 w-20"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : projects.length > 0 ? (
              <>
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                      : "space-y-4"
                  }
                >
                  {projects.map((project) => (
                    <ProductCard
                      key={project.id}
                      project={project}
                      onVote={handleProjectVote}
                      inactiveCta={project.status !== "live"}
                      viewMode={viewMode}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <div className="join">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={!pagination.hasPrev}
                        className="join-item btn btn-outline"
                      >
                        Previous
                      </button>

                      {[...Array(Math.min(5, pagination.totalPages))].map(
                        (_, i) => {
                          const pageNum = Math.max(1, pagination.page - 2) + i;
                          if (pageNum > pagination.totalPages) return null;

                          return (
                            <button
                              key={`page-${pageNum}`}
                              onClick={() => handlePageChange(pageNum)}
                              className={`join-item btn ${
                                pageNum === pagination.page
                                  ? "btn-active"
                                  : "btn-outline"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                      )}

                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={!pagination.hasNext}
                        className="join-item btn btn-outline"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="text-base-content/60 mb-4">
                  <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No AI projects found matching your criteria.</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCategories([]);
                    setSelectedPricing("all");
                    setSearchQuery("");
                    fetchProjects(1);
                  }}
                  className="btn btn-outline"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function ProjectsPageLoading() {
  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="skeleton h-10 w-64 mx-auto mb-4"></div>
          <div className="skeleton h-6 w-96 mx-auto"></div>
        </div>
        <div className="animate-pulse">Loading...</div>
      </div>
    </div>
  );
}

// Main export with Suspense boundary
export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectsPageLoading />}>
      <ProjectsPageContent />
    </Suspense>
  );
}
