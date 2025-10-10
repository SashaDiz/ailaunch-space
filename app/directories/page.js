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
  selectedCategory,
  setSelectedCategory,
  selectedPricing,
  setSelectedPricing,
  onClose,
}) {
  const [pricingOptions, setPricingOptions] = useState([]);

  useEffect(() => {
    fetchPricingOptions();
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
        { value: "paid", label: "Premium/Paid", app_count: 0 },
      ]);
    }
  };

  return (
    <div className="bg-base-100 border border-base-300 rounded-lg p-4 space-y-6">
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
        <h4 className="font-medium mb-3 text-sm text-base-content/80">
          Categories
        </h4>
        <div className="space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="category"
              className="radio radio-primary radio-sm"
              checked={selectedCategory === "all"}
              onChange={() => setSelectedCategory("all")}
            />
            <span className="text-sm">All Categories</span>
          </label>
          {categories.map((category) => (
            <label
              key={category.slug}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <input
                type="radio"
                name="category"
                className="radio radio-primary radio-sm"
                checked={selectedCategory === category.slug}
                onChange={() => setSelectedCategory(category.slug)}
              />
              <span className="text-sm">{category.name}</span>
              {category.app_count > 0 && (
                <span className="badge badge-ghost badge-xs">
                  {category.app_count}
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div>
        <h4 className="font-medium mb-3 text-sm text-base-content/80">
          Pricing
        </h4>
        <div className="space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="pricing"
              className="radio radio-primary radio-sm"
              checked={selectedPricing === "all"}
              onChange={() => setSelectedPricing("all")}
            />
            <span className="text-sm">All Pricing</span>
          </label>
          {pricingOptions.map((pricing) => (
            <label
              key={pricing.value}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <input
                type="radio"
                name="pricing"
                className="radio radio-primary radio-sm"
                checked={selectedPricing === pricing.value}
                onChange={() => setSelectedPricing(pricing.value)}
              />
              <span className="text-sm">{pricing.label}</span>
              {pricing.app_count > 0 && (
                <span className="badge badge-ghost badge-xs">
                  {pricing.app_count}
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <button
        onClick={() => {
          setSelectedCategory("all");
          setSelectedPricing("all");
        }}
        className="btn btn-outline btn-sm w-full"
      >
        Clear All Filters
      </button>
    </div>
  );
}

function DirectoriesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [directories, setDirectories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all"
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
    setSelectedCategory(searchParams.get("category") || "all");
    setSelectedPricing(searchParams.get("pricing") || "all");
  }, [searchParams]);

  useEffect(() => {
    fetchDirectories();
  }, [selectedCategory, selectedPricing, sortBy, searchQuery]);

  // Update URL when filters change (but not on initial load)
  useEffect(() => {
    if (directories.length > 0) {
      // Only after initial load
      handleFilterChange();
    }
  }, [selectedCategory, selectedPricing, sortBy]);

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

  const fetchDirectories = async (page = 1) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        sort: sortBy,
        status: "live",
      });

      if (selectedCategory !== "all") {
        params.set("category", selectedCategory);
      }

      if (selectedPricing !== "all") {
        params.set("pricing", selectedPricing);
      }

      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      const response = await fetch(`/api/directories?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDirectories(data.data.directories || []);
        setPagination(data.data.pagination || {});
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

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDirectories(1);
    // Update URL
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedPricing !== "all") params.set("pricing", selectedPricing);
    if (sortBy !== "upvotes") params.set("sort", sortBy);

    const newUrl = params.toString()
      ? `/directories?${params}`
      : "/directories";
    router.push(newUrl, { shallow: true });
  };

  const handlePageChange = (newPage) => {
    fetchDirectories(newPage);
  };

  const handleFilterChange = () => {
    // Update URL with current filter state
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedPricing !== "all") params.set("pricing", selectedPricing);
    if (sortBy !== "upvotes") params.set("sort", sortBy);

    const newUrl = params.toString()
      ? `/directories?${params}`
      : "/directories";
    router.push(newUrl, { shallow: true });
  };

  const handleDirectoryVote = (directoryId, newVoteCount, userVoted) => {
    // Update the directory in the directories list
    setDirectories((prevDirectories) =>
      prevDirectories.map((directory) =>
        directory.id === directoryId
          ? { ...directory, upvotes: newVoteCount, userVoted }
          : directory
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
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
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
                  : `${pagination.totalCount || 0} directories found`}
              </div>
              <div className="text-sm text-base-content/60">
                Page {pagination.page || 1} of {pagination.totalPages || 1}
              </div>
            </div>

            {/* Directory Grid/List */}
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
            ) : directories.length > 0 ? (
              <>
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                      : "space-y-4"
                  }
                >
                  {directories.map((directory) => (
                    <ProductCard
                      key={directory.id}
                      directory={directory}
                      onVote={handleDirectoryVote}
                      inactiveCta={directory.status !== "live"}
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
                  <p>No directories found matching your criteria.</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedPricing("all");
                    setSearchQuery("");
                    fetchDirectories(1);
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
function DirectoriesPageLoading() {
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
export default function DirectoriesPage() {
  return (
    <Suspense fallback={<DirectoriesPageLoading />}>
      <DirectoriesPageContent />
    </Suspense>
  );
}
