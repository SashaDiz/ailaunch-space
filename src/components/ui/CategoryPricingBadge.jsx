import React from "react";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";

// Category color mappings
const categoryColors = {
  "Directory of Directories": "bg-blue-100 text-blue-800",
  "AI & LLM": "bg-purple-100 text-purple-800",
  "Developer Tools & Platforms": "bg-green-100 text-green-800",
  "UI/UX": "bg-pink-100 text-pink-800",
  Design: "bg-orange-100 text-orange-800",
  "APIs & Integrations": "bg-indigo-100 text-indigo-800",
  "SaaS Tools": "bg-cyan-100 text-cyan-800",
  "E-commerce": "bg-emerald-100 text-emerald-800",
  "Marketing & SEO": "bg-lime-100 text-lime-800",
  "Analytics & Data": "bg-violet-100 text-violet-800",
  "Social Media": "bg-rose-100 text-rose-800",
  "Content Management": "bg-amber-100 text-amber-800",
  Productivity: "bg-teal-100 text-teal-800",
  "Finance & Business": "bg-slate-100 text-slate-800",
  "Health & Wellness": "bg-green-100 text-green-800",
  "Education & Learning": "bg-blue-100 text-blue-800",
  Entertainment: "bg-purple-100 text-purple-800",
  "News & Media": "bg-gray-100 text-gray-800",
  "Travel & Lifestyle": "bg-orange-100 text-orange-800",
  "Real Estate": "bg-red-100 text-red-800",
  "Job Boards": "bg-yellow-100 text-yellow-800",
  "Community & Forums": "bg-pink-100 text-pink-800",
  Marketplaces: "bg-indigo-100 text-indigo-800",
  "Security & Privacy": "bg-gray-100 text-gray-800",
  "Mobile Apps": "bg-blue-100 text-blue-800",
  "Web Apps": "bg-green-100 text-green-800",
  "Chrome Extensions": "bg-yellow-100 text-yellow-800",
  "WordPress Plugins": "bg-blue-100 text-blue-800",
  "Template Libraries": "bg-purple-100 text-purple-800",
  "Stock Resources": "bg-orange-100 text-orange-800",
};

// Pricing color mappings
const pricingColors = {
  Free: "bg-green-100 text-green-800",
  Freemium: "bg-yellow-100 text-yellow-800",
  Paid: "bg-red-100 text-red-800",
};

/**
 * CategoryPricingBadge component for displaying category or pricing badges
 * with consistent styling across the application
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Badge content/text
 * @param {"category"|"pricing"} props.variant - Badge variant type (default: "category")
 * @param {string} props.className - Additional CSS classes
 *
 * @example
 * // Category badge
 * <CategoryPricingBadge variant="category">AI & LLM</CategoryPricingBadge>
 *
 * @example
 * // Pricing badge
 * <CategoryPricingBadge variant="pricing">Free</CategoryPricingBadge>
 *
 * @example
 * // With custom className
 * <CategoryPricingBadge variant="category" className="my-custom-class">
 *   Developer Tools & Platforms
 * </CategoryPricingBadge>
 */
export function CategoryPricingBadge({
  children,
  variant = "category",
  className,
  ...props
}) {
  const getColorClass = (label, type) => {
    if (type === "category") {
      return categoryColors[label] || "bg-gray-100 text-gray-800";
    } else if (type === "pricing") {
      return pricingColors[label] || "bg-gray-100 text-gray-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  const colorClass = getColorClass(children, variant);

  return (
    <Badge className={cn(colorClass, className)} {...props}>
      {children}
    </Badge>
  );
}

export default CategoryPricingBadge;
