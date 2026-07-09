"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductCard } from "@/components/directory/ProductCard";
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
import { serializeCatalog, type CatalogState } from "@/lib/catalog-url";

const SORT_OPTIONS = directoryConfig.sortOptions;

interface CategoryDetailClientProps {
  slug: string;
  category: {
    name: string;
    description?: string;
    sphere?: string;
    color?: string;
  };
  initialProjects: any[];
  initialTotalCount: number;
  initialState: CatalogState;
}

export function CategoryDetailClient({
  slug,
  category,
  initialProjects,
  initialTotalCount,
  initialState,
}: CategoryDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // The grid is driven by server props (per-URL SSR). A category is a single
  // facet, so it always shows all items — no pagination.
  const projects = initialProjects;
  const totalCount = initialTotalCount;
  const loading = isPending;

  const basePath = `/categories/${slug}`;

  const [searchQuery, setSearchQuery] = useState(initialState.q);
  const [sortBy, setSortBy] = useState(initialState.sort);

  // Keep the controls in sync with the URL/server state (back/forward nav).
  const stateKey = serializeCatalog(
    { pricing: initialState.pricing, sort: initialState.sort, q: initialState.q },
    basePath
  );
  useEffect(() => {
    setSortBy(initialState.sort);
    setSearchQuery(initialState.q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateKey]);

  const navigate = (override: Partial<CatalogState>) => {
    const next = {
      pricing: initialState.pricing,
      sort: sortBy,
      q: searchQuery.trim(),
      page: 1,
      ...override,
    };
    startTransition(() => {
      router.push(serializeCatalog(next, basePath));
    });
  };

  // Debounced search → writes `q` into the URL (server re-renders the grid).
  useEffect(() => {
    const q = searchQuery.trim();
    if (q === initialState.q) return;
    const timer = setTimeout(() => navigate({ q }), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleSortChange = (v: string) => {
    setSortBy(v);
    navigate({ sort: v });
  };

  return (
    <main className="min-h-screen bg-transparent">
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
          <Select value={sortBy} onValueChange={handleSortChange}>
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
        {!loading && (
          <p className="text-sm text-muted-foreground mb-4">
            {totalCount} project{totalCount !== 1 ? "s" : ""} found
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project: any) => (
              <ProductCard key={project.id} project={project} viewMode="grid" />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
