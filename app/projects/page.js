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
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 max-h-screen overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">Filters</h3>
        {onClose && (
          <button 
            onClick={onClose} 
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Xmark className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-sm text-gray-700">
            Categories
          </h4>
          {selectedCategories.length > 0 && (
            <button
              onClick={clearAllCategories}
              className="text-xs text-[#ED0D79] hover:text-[#ED0D79]/80 font-medium"
            >
              Clear all
            </button>
          )}
        </div>
        
        {selectedCategories.length > 0 && (
          <div className="mb-3 p-3 bg-[#ED0D79]/10 rounded-lg border border-[#ED0D79]/20">
            <div className="text-xs text-[#ED0D79] font-medium mb-2">
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
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-[#ED0D79] rounded-md"
                  >
                    {category?.name || categorySlug}
                    <button
                      onClick={() => handleCategoryToggle(categorySlug)}
                      className="ml-1 hover:bg-white/20 rounded-full w-3 h-3 flex items-center justify-center text-xs"
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
        <div className="max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg">
          {Object.keys(groupedCategories).length > 0 ? (
            Object.entries(groupedCategories).map(([sphere, sphereCategories]) => (
              <div key={sphere} className="border-b border-gray-200 last:border-b-0">
                {/* Sphere Header */}
                <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-600 sticky top-0 z-10">
                  {sphere}
                </div>
                
                {/* Categories in Sphere */}
                <div className="py-1">
                  {sphereCategories.map((category) => (
                    <label
                      key={category.slug}
                      className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-md p-3 mx-1 transition-colors"
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-[#ED0D79] bg-gray-100 border-gray-300 rounded focus:ring-[#ED0D79] focus:ring-2"
                        checked={selectedCategories.includes(category.slug)}
                        onChange={() => handleCategoryToggle(category.slug)}
                      />
                      <span className={`w-2 h-2 ${getCategoryDotColor(category.name)} rounded-full flex-shrink-0`}></span>
                      <span className="text-sm text-gray-700 flex-1 truncate">{category.name}</span>
                      {category.app_count > 0 && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md flex-shrink-0">
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
                  className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-md p-3 transition-colors"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-[#ED0D79] bg-gray-100 border-gray-300 rounded focus:ring-[#ED0D79] focus:ring-2"
                    checked={selectedCategories.includes(category.slug)}
                    onChange={() => handleCategoryToggle(category.slug)}
                  />
                  <span className={`w-2 h-2 ${getCategoryDotColor(category.name)} rounded-full flex-shrink-0`}></span>
                  <span className="text-sm text-gray-700 flex-1 truncate">{category.name}</span>
                  {category.app_count > 0 && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md flex-shrink-0">
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
        <h4 className="font-medium mb-3 text-sm text-gray-700">
          Pricing
        </h4>

        {/* Pricing Options with Scroll */}
        <div className="overflow-y-auto border border-gray-200 rounded-lg">
          <div className="p-2">
            {/* All Pricing Option */}
            <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-md p-3 transition-colors">
              <input
                type="radio"
                name="pricing"
                className="w-4 h-4 text-[#ED0D79] bg-gray-100 border-gray-300 focus:ring-[#ED0D79] focus:ring-2"
                checked={selectedPricing === "all"}
                onChange={() => setSelectedPricing("all")}
              />
              <span className="text-sm font-medium text-gray-700">All Pricing</span>
            </label>
            
            {pricingOptions.map((pricing) => (
              <label
                key={pricing.value}
                className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-md p-3 transition-colors"
              >
                <input
                  type="radio"
                  name="pricing"
                  className="w-4 h-4 text-[#ED0D79] bg-gray-100 border-gray-300 focus:ring-[#ED0D79] focus:ring-2"
                  checked={selectedPricing === pricing.value}
                  onChange={() => setSelectedPricing(pricing.value)}
                />
                <span className="text-sm text-gray-700 flex-1 truncate">{pricing.label}</span>
                {pricing.app_count > 0 && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md flex-shrink-0">
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
        className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
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
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-semibold text-gray-900 mb-4">
            Browse AI Projects
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search AI projects..."
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#ED0D79] focus:border-[#ED0D79] transition-colors"
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
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-[#ED0D79] focus:border-[#ED0D79] transition-colors"
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
                  className="dropdown-content menu p-2 shadow-lg bg-white rounded-lg w-56 border border-gray-200 mt-1"
                >
                  {SORT_OPTIONS.map((option) => (
                    <li key={option.value}>
                      <button
                        onClick={() => setSortBy(option.value)}
                        className={`flex items-center px-3 py-2 text-sm hover:bg-gray-50 rounded-md transition-colors ${
                          sortBy === option.value ? "bg-[#ED0D79]/10 text-[#ED0D79]" : "text-gray-700"
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
              <div className="hidden sm:flex border border-gray-300 rounded-lg overflow-hidden">
                {VIEW_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setViewMode(mode.value)}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      viewMode === mode.value 
                        ? "bg-[#ED0D79] text-white" 
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {React.createElement(mode.icon, { className: "w-4 h-4" })}
                  </button>
                ))}
              </div>

              {/* Filter Toggle (Mobile) */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-[#ED0D79] focus:border-[#ED0D79] transition-colors lg:hidden"
              >
                <FilterAlt className="w-4 h-4 mr-2" />
                Filters
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
              <div className="text-sm text-gray-600">
                {loading
                  ? "Loading..."
                  : `${pagination.totalCount || 0} AI projects found`}
              </div>
              <div className="text-sm text-gray-600">
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
                    className="bg-white rounded-2xl border border-gray-200 p-4"
                  >
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
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={!pagination.hasPrev}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                pageNum === pagination.page
                                  ? "bg-[#ED0D79] text-white"
                                  : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
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
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="text-gray-500 mb-4">
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="skeleton h-10 w-64 mx-auto mb-4"></div>
          <div className="skeleton h-6 w-96 mx-auto"></div>
        </div>
        <div className="animate-pulse text-gray-500">Loading...</div>
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
