"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";

export function CategorySelector({ 
  selectedCategories = [], 
  onCategoriesChange,
  categories = [],
  groupedCategories = null,
  loading = false,
  maxSelections = 3,
  error = null 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Normalize categories to ensure we always have { name, sphere, sort_order }
  const normalizedCategories = useMemo(() => {
    // Flatten grouped categories if provided
    if (groupedCategories && typeof groupedCategories === "object") {
      const flattened = Object.entries(groupedCategories).flatMap(([sphere, cats]: [string, any[]]) =>
        ((cats || []) as any[]).map((cat: any) => ({
          name: cat.name || "",
          slug: cat.slug,
          sphere: sphere || cat.sphere || "Other",
          sort_order: typeof cat.sort_order === "number" ? cat.sort_order : 9999,
        }))
      );

      return dedupeAndSort(flattened);
    }

    // Otherwise use plain categories array
    const flattened = (categories || []).map((cat) => {
      if (typeof cat === "string") {
        return {
          name: cat,
          sphere: "Other",
          sort_order: 9999,
        };
      }
      return {
        name: cat.name || "",
        slug: cat.slug,
        sphere: cat.sphere || "Other",
        sort_order: typeof cat.sort_order === "number" ? cat.sort_order : 9999,
      };
    });

    return dedupeAndSort(flattened);
  }, [categories, groupedCategories]);

  // Filter categories based on search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return normalizedCategories;
    return normalizedCategories.filter((category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [normalizedCategories, searchTerm]);

  // Get filtered categories organized by sphere
  const filteredCategoriesBySphere = useMemo(() => {
    return filteredCategories.reduce((acc: Record<string, any[]>, category: any) => {
      const sphereKey = category.sphere || "Other";
      if (!acc[sphereKey]) {
        acc[sphereKey] = [];
      }
      acc[sphereKey].push(category);
      return acc;
    }, {} as Record<string, any[]>);
  }, [filteredCategories]);

  const handleCategoryToggle = (category) => {
    if (selectedCategories.includes(category.name)) {
      // Remove category
      onCategoriesChange(selectedCategories.filter(cat => cat !== category.name));
    } else if (selectedCategories.length < maxSelections) {
      // Add category
      onCategoriesChange([...selectedCategories, category.name]);
    }
  };

  const removeCategory = (category) => {
    onCategoriesChange(selectedCategories.filter(cat => cat !== category));
  };

  const canSelectMore = selectedCategories.length < maxSelections;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground">
        Categories <span className="text-destructive">*</span>
        <span className="text-sm text-muted-foreground ml-2">
          Select up to {maxSelections} categories
        </span>
      </label>

      {/* Selected Categories */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedCategories.map((category) => (
            <span
              key={category}
              className="inline-flex items-center gap-1 px-3 py-1 text-primary-foreground text-sm rounded-full transition-all duration-200 hover:opacity-90"
              style={{ backgroundColor: 'hsl(var(--primary))' }}
            >
              {category}
              <button
                type="button"
                onClick={() => removeCategory(category)}
                className="hover:bg-background/20 rounded-full p-0.5 transition-colors duration-200"
                aria-label={`Remove ${category}`}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-4 py-3 text-left border rounded-lg bg-background hover:bg-muted transition-colors ${
            error ? "border-destructive" : "border-border"
          } ${isOpen ? "border-foreground ring-2 ring-black/20" : ""}`}
        >
          <span className={selectedCategories.length === 0 ? "text-muted-foreground" : ""}>
            {selectedCategories.length === 0 
              ? "✓ Select a category..." 
              : `${selectedCategories.length}/${maxSelections} selected`
            }
          </span>
          <svg
            className={`w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-96 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-border">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:border-foreground"
              />
            </div>

            {/* Categories List */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading categories...
                </div>
              ) : Object.keys(filteredCategoriesBySphere).length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No categories found
                </div>
              ) : (
                (Object.entries(filteredCategoriesBySphere) as [string, any[]][]).map(([sphere, categoriesInSphere]) => (
                  <div key={sphere} className="border-b border-border last:border-b-0">
                    {/* Sphere Header */}
                    <div className="px-3 py-2 bg-muted text-sm font-medium text-foreground/80 sticky top-0">
                      {sphere}
                    </div>
                    
                    {/* Categories in Sphere */}
                    <div className="py-1">
                      {categoriesInSphere.map((category) => {
                        const isSelected = selectedCategories.includes(category.name);
                        const isDisabled = !isSelected && !canSelectMore;
                        
                        return (
                          <button
                            key={category.slug || category.name}
                            type="button"
                            onClick={() => handleCategoryToggle(category)}
                            disabled={isDisabled}
                            className={`w-full px-6 py-2 text-left text-sm hover:bg-muted transition-colors ${
                              isSelected 
                                ? "bg-primary/10 text-primary font-medium" 
                                : isDisabled 
                                  ? "text-muted-foreground/60 cursor-not-allowed"
                                  : "text-foreground hover:text-foreground"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{category.name}</span>
                              {isSelected && (
                                <svg className="w-4 h-4 text-foreground" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border bg-muted text-xs text-muted-foreground">
              {selectedCategories.length}/{maxSelections} categories selected
              {!canSelectMore && (
                <span className="block text-yellow-600 mt-1">
                  Maximum {maxSelections} categories allowed. Remove one to add another.
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-destructive flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}

export default CategorySelector;

function dedupeAndSort(categories) {
  const seen = new Map();
  categories.forEach((cat) => {
    const key = (cat.slug || cat.name || "").toLowerCase();
    if (!key) return;
    if (!seen.has(key)) {
      seen.set(key, cat);
    }
  });

  return Array.from(seen.values()).sort((a, b) => {
    const sortA = typeof a.sort_order === "number" ? a.sort_order : 9999;
    const sortB = typeof b.sort_order === "number" ? b.sort_order : 9999;
    if (sortA !== sortB) {
      return sortA - sortB;
    }
    return (a.name || "").localeCompare(b.name || "");
  });
}
