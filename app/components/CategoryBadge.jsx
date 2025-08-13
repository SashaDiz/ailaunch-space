"use client";

import React from "react";
import Link from "next/link";

export function CategoryBadge({ category, clickable = true, size = "sm" }) {
  // Guard against invalid category values
  if (!category || typeof category !== 'string') {
    return null;
  }

  const baseClasses = `inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-900 hover:bg-gray-200 transition-colors`;
  
  const sizeClasses = {
    xs: "px-1.5 py-0.5 text-xs",
    sm: "px-2 py-1 text-xs", 
    md: "px-3 py-1.5 text-sm"
  };

  const classes = `${baseClasses.replace("px-2 py-1 text-xs", sizeClasses[size])}`;

  // Map category names to slugs for consistent filtering
  const categorySlugMap = {
    "AI & LLM": "ai-ml",
    "AI & ML": "ai-ml", 
    "Business & Finance": "business-finance",
    "Finance & Business": "business-finance",
    "Marketing & SEO": "marketing-seo",
    "Dev Tools": "dev-tools",
    "Developer Tools": "dev-tools",
    "Developer Tools & Platforms": "dev-tools",
    "Productivity": "productivity",
    "Design": "design",
    "SaaS": "saas",
    "SaaS Tools": "saas"
  };

  const categoryParam = categorySlugMap[category] || category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  if (!clickable) {
    return (
      <span className={classes}>
        {category}
      </span>
    );
  }

  return (
    <Link 
      href={`/directories?category=${encodeURIComponent(categoryParam)}`}
      className={`${classes} cursor-pointer`}
      onClick={(e) => e.stopPropagation()}
    >
      {category}
    </Link>
  );
}

export function PricingBadge({ pricing, clickable = true, size = "sm" }) {
  const baseClasses = `inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-900 hover:bg-gray-200 transition-colors`;
  
  const sizeClasses = {
    xs: "px-1.5 py-0.5 text-xs",
    sm: "px-2 py-1 text-xs", 
    md: "px-3 py-1.5 text-sm"
  };

  const classes = `${baseClasses.replace("px-2 py-1 text-xs", sizeClasses[size])}`;

  // Map pricing values to consistent format
  const pricingMap = {
    "Free": "free",
    "Freemium": "freemium", 
    "Premium": "paid",
    "Paid": "paid"
  };

  const pricingParam = pricingMap[pricing] || pricing?.toLowerCase() || "free";

  if (!clickable) {
    return (
      <span className={classes}>
        {pricing || "Free"}
      </span>
    );
  }

  return (
    <Link 
      href={`/directories?pricing=${pricingParam}`}
      className={`${classes} cursor-pointer`}
      onClick={(e) => e.stopPropagation()}
    >
      {pricing || "Free"}
    </Link>
  );
}