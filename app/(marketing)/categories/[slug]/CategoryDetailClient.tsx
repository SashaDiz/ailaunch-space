"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/directory/ProductCard";
import Pagination from "@/components/shared/Pagination";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Home } from "lucide-react";
import { directoryConfig } from "@/config/directory.config";

const SORT_OPTIONS = directoryConfig.sortOptions;
const PAGE_SIZE = directoryConfig.pageSize;

interface CategoryDetailClientProps {
  slug: string;
  category: {
    name: string;
    description?: string;
    sphere?: string;
    color?: string;
  };
}

export function CategoryDetailClient({ slug, category }: CategoryDetailClientProps) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState(directoryConfig.defaultSort);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{
    page?: number;
    totalPages?: number;
    totalCount?: number;
  }>({});

  useEffect(() => {
    fetchProjects();
  }, [slug, sortBy, page]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchProjects();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        categories: slug,
        sort: sortBy,
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      const response = await fetch(`/api/projects?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data.data?.projects || []);
        setPagination(data.data?.pagination || {});
      } else {
        setProjects([]);
        setPagination({});
      }
    } catch (error) {
      console.error("Failed to fetch projects for category:", error);
      setProjects([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container-classic py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground transition-colors">
            <Home className="w-4 h-4" />
          </Link>
          <span>/</span>
          <Link
            href="/categories"
            className="hover:text-foreground transition-colors"
          >
            Categories
          </Link>
          {category.sphere && (
            <>
              <span>/</span>
              <span>{category.sphere}</span>
            </>
          )}
          <span>/</span>
          <span className="text-foreground">{category.name}</span>
        </nav>

        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">{category.name}</h1>
          {category.description && (
            <p className="text-lg text-muted-foreground max-w-3xl">
              {category.description}
            </p>
          )}
        </div>

        {/* Controls: Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${category.name}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={sortBy}
            onValueChange={(v) => {
              setSortBy(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
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

        {/* Results count */}
        {!loading && pagination.totalCount != null && (
          <p className="text-sm text-muted-foreground mb-4">
            {pagination.totalCount} project
            {pagination.totalCount !== 1 ? "s" : ""} found
          </p>
        )}

        {/* Project grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-48 bg-muted rounded-[var(--radius)] animate-pulse"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "No projects match your search."
                : "No projects found in this category yet."}
            </p>
            <Link
              href="/categories"
              className="inline-flex items-center justify-center rounded-[var(--radius)] border-2 border-foreground px-6 py-3 text-sm font-semibold text-foreground transition-all hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)]"
            >
              Browse Categories
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project: any) => (
                <ProductCard
                  key={project.id}
                  project={project}
                  viewMode="grid"
                />
              ))}
            </div>
            <div className="mt-8">
              <Pagination
                page={pagination.page ?? page}
                totalPages={pagination.totalPages ?? 1}
                onPageChange={handlePageChange}
                ariaLabel={`${category.name} projects pagination`}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
