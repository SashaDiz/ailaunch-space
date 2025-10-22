"use client";

import React, { useState, useRef, useEffect } from "react";

// Categories organized by spheres
const CATEGORIES_BY_SPHERE = {
  "Business & Finance": [
    "Analytics",
    "Customer Service",
    "Finance",
    "HR", 
    "Marketing",
    "SEO",
    "Startup"
  ],
  "Consumer & Lifestyle": [
    "Education",
    "Healthcare",
    "Productivity",
    "Personal Assistant"
  ],
  "Content & Creativity": [
    "Design",
    "Video",
    "Music",
    "Writing",
    "Image Generation",
    "Animation"
  ],
  "Developer & Tech": [
    "Dev Tools",
    "AI",
    "Data Management",
    "API",
    "No-Code",
    "Automation"
  ],
  "E-commerce & Retail": [
    "E-commerce",
    "Analytics",
    "Recommendation",
    "Chatbots"
  ],
  "Entertainment & Media": [
    "Gaming",
    "Social Media",
    "Streaming"
  ],
  "Industry-Specific": [
    "Healthcare",
    "Legal",
    "Real Estate",
    "Research"
  ],
  "Language & Communication": [
    "Translation",
    "NLP",
    "Voice",
    "Chatbots"
  ],
  "Vision & Recognition": [
    "Computer Vision",
    "Document Processing"
  ],
  "Other": [
    "Cybersecurity",
    "Sustainability"
  ]
};

export function CategorySelector({ 
  selectedCategories = [], 
  onCategoriesChange, 
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

  // Get all categories as flat array
  const allCategories = Object.values(CATEGORIES_BY_SPHERE).flat();

  // Filter categories based on search term
  const filteredCategories = searchTerm
    ? allCategories.filter(category =>
        category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allCategories;

  // Get filtered categories organized by sphere
  const filteredCategoriesBySphere = Object.keys(CATEGORIES_BY_SPHERE).reduce((acc, sphere) => {
    const sphereCategories = CATEGORIES_BY_SPHERE[sphere].filter(category =>
      filteredCategories.includes(category)
    );
    if (sphereCategories.length > 0) {
      acc[sphere] = sphereCategories;
    }
    return acc;
  }, {});

  const handleCategoryToggle = (category) => {
    if (selectedCategories.includes(category)) {
      // Remove category
      onCategoriesChange(selectedCategories.filter(cat => cat !== category));
    } else if (selectedCategories.length < maxSelections) {
      // Add category
      onCategoriesChange([...selectedCategories, category]);
    }
  };

  const removeCategory = (category) => {
    onCategoriesChange(selectedCategories.filter(cat => cat !== category));
  };

  const canSelectMore = selectedCategories.length < maxSelections;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-base-content">
        Categories <span className="text-error">*</span>
        <span className="text-sm text-base-content/60 ml-2">
          Select up to {maxSelections} categories
        </span>
      </label>

      {/* Selected Categories */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedCategories.map((category) => (
            <span
              key={category}
              className="inline-flex items-center gap-1 px-3 py-1 text-white text-sm rounded-full transition-all duration-200 hover:opacity-90"
              style={{ backgroundColor: '#ED0D79' }}
            >
              {category}
              <button
                type="button"
                onClick={() => removeCategory(category)}
                className="hover:bg-white/20 rounded-full p-0.5 transition-colors duration-200"
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
          className={`w-full px-4 py-3 text-left border rounded-lg bg-base-100 hover:bg-base-200 transition-colors ${
            error ? "border-error" : "border-base-300"
          } ${isOpen ? "border-[#ED0D79] ring-2 ring-[#ED0D79]/20" : ""}`}
        >
          <span className={selectedCategories.length === 0 ? "text-base-content/60" : ""}>
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
          <div className="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-base-300">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-base-300 rounded-md bg-base-100 text-base-content placeholder-base-content/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED0D79]/20 focus-visible:border-[#ED0D79]"
              />
            </div>

            {/* Categories List */}
            <div className="max-h-80 overflow-y-auto">
              {Object.keys(filteredCategoriesBySphere).length === 0 ? (
                <div className="p-4 text-center text-base-content/60">
                  No categories found
                </div>
              ) : (
                Object.entries(filteredCategoriesBySphere).map(([sphere, categories]) => (
                  <div key={sphere} className="border-b border-base-300 last:border-b-0">
                    {/* Sphere Header */}
                    <div className="px-3 py-2 bg-base-200 text-sm font-medium text-base-content/80 sticky top-0">
                      {sphere}
                    </div>
                    
                    {/* Categories in Sphere */}
                    <div className="py-1">
                      {categories.map((category) => {
                        const isSelected = selectedCategories.includes(category);
                        const isDisabled = !isSelected && !canSelectMore;
                        
                        return (
                          <button
                            key={category}
                            type="button"
                            onClick={() => handleCategoryToggle(category)}
                            disabled={isDisabled}
                            className={`w-full px-6 py-2 text-left text-sm hover:bg-base-200 transition-colors ${
                              isSelected 
                                ? "bg-[#ED0D79]/10 text-[#ED0D79] font-medium" 
                                : isDisabled 
                                  ? "text-base-content/40 cursor-not-allowed"
                                  : "text-base-content hover:text-[#ED0D79]"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{category}</span>
                              {isSelected && (
                                <svg className="w-4 h-4 text-[#ED0D79]" fill="currentColor" viewBox="0 0 20 20">
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
            <div className="p-3 border-t border-base-300 bg-base-200 text-xs text-base-content/60">
              {selectedCategories.length}/{maxSelections} categories selected
              {!canSelectMore && (
                <span className="block text-warning mt-1">
                  Maximum {maxSelections} categories allowed. Remove one to add another.
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-error flex items-center gap-1">
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
