"use client";

import React from "react";
import Link from "next/link";

export function CategoryBadge({ category, clickable = true, size = "sm" }) {
  // Guard against invalid category values
  if (!category || typeof category !== 'string') {
    return null;
  }

  // Generate color for category badges (same logic as header dropdown)
  const getCategoryColor = (category) => {
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colors = [
      { bg: "bg-blue-100", text: "text-blue-800", hover: "hover:bg-blue-200" },
      { bg: "bg-purple-100", text: "text-purple-800", hover: "hover:bg-purple-200" },
      { bg: "bg-green-100", text: "text-green-800", hover: "hover:bg-green-200" },
      { bg: "bg-pink-100", text: "text-pink-800", hover: "hover:bg-pink-200" },
      { bg: "bg-orange-100", text: "text-orange-800", hover: "hover:bg-orange-200" },
      { bg: "bg-indigo-100", text: "text-indigo-800", hover: "hover:bg-indigo-200" },
      { bg: "bg-cyan-100", text: "text-cyan-800", hover: "hover:bg-cyan-200" },
      { bg: "bg-emerald-100", text: "text-emerald-800", hover: "hover:bg-emerald-200" },
      { bg: "bg-lime-100", text: "text-lime-800", hover: "hover:bg-lime-200" },
      { bg: "bg-violet-100", text: "text-violet-800", hover: "hover:bg-violet-200" },
      { bg: "bg-rose-100", text: "text-rose-800", hover: "hover:bg-rose-200" },
      { bg: "bg-amber-100", text: "text-amber-800", hover: "hover:bg-amber-200" },
      { bg: "bg-teal-100", text: "text-teal-800", hover: "hover:bg-teal-200" },
      { bg: "bg-slate-100", text: "text-slate-800", hover: "hover:bg-slate-200" },
      { bg: "bg-red-100", text: "text-red-800", hover: "hover:bg-red-200" },
      { bg: "bg-yellow-100", text: "text-yellow-800", hover: "hover:bg-yellow-200" },
    ];

    return colors[Math.abs(hash) % colors.length];
  };

  const colorScheme = getCategoryColor(category);
  const baseClasses = `inline-flex items-center px-2 py-1 leading-none text-xs font-normal rounded-lg ${colorScheme.bg} ${colorScheme.text} ${colorScheme.hover} transition-colors`;
  
  const sizeClasses = {
    xs: "px-2 py-1 text-xs",
    sm: "px-2.5 py-1 text-xs", 
    md: "px-3 py-1.5 text-sm"
  };

  const classes = `${baseClasses.replace("px-3 py-1.5 text-xs", sizeClasses[size])}`;

  // Map category names to slugs for consistent filtering
  const categorySlugMap = {
    // Simplified categories
    "AI": "ai",
    "Analytics": "analytics",
    "Animation": "animation",
    "API": "api",
    "Automation": "automation",
    "Chatbots": "chatbots",
    "Computer Vision": "computer-vision",
    "Customer Service": "customer-service",
    "Cybersecurity": "cybersecurity",
    "Data Management": "data-management",
    "Design": "design",
    "Dev Tools": "dev-tools",
    "Document Processing": "document-processing",
    "E-commerce": "e-commerce",
    "Education": "education",
    "Finance": "finance",
    "Gaming": "gaming",
    "Healthcare": "healthcare",
    "HR": "hr",
    "Image Generation": "image-generation",
    "Legal": "legal",
    "Marketing": "marketing",
    "Music": "music",
    "NLP": "nlp",
    "No-Code": "no-code",
    "Personal Assistant": "personal-assistant",
    "Productivity": "productivity",
    "Real Estate": "real-estate",
    "Recommendation": "recommendation",
    "Research": "research",
    "SEO": "seo",
    "Social Media": "social-media",
    "Startup": "startup",
    "Streaming": "streaming",
    "Sustainability": "sustainability",
    "Translation": "translation",
    "Video": "video",
    "Voice": "voice",
    "Writing": "writing",
    
    // Legacy mappings for backward compatibility
    "AI & ML": "ai",
    "AI & Machine Learning": "ai",
    "General AI Tools": "ai",
    "Finance & FinTech": "finance",
    "Business & Finance": "finance",
    "Business Intelligence & Analytics": "analytics",
    "Customer Analytics": "analytics",
    "Healthcare & MedTech": "healthcare",
    "Health & Wellness": "healthcare",
    "HR & Recruitment": "hr",
    "Marketing & SEO": "marketing",
    "Marketing & Sales": "marketing",
    "Customer Service & Support": "customer-service",
    "Legal & Compliance": "legal",
    "Real Estate & PropTech": "real-estate",
    "Research & Academia": "research",
    "Research Tools": "research",
    "Design & Art": "design",
    "Video & Content Creation": "video",
    "Video Analysis": "video",
    "Writing & Copywriting": "writing",
    "Translation & Localization": "translation",
    "Text Analysis & NLP": "nlp",
    "Voice & Speech": "voice",
    "Chatbots & Conversational AI": "chatbots",
    "Chatbots & Virtual Assistants": "chatbots",
    "Computer Vision": "computer-vision",
    "Image Recognition": "computer-vision",
    "OCR & Document Processing": "document-processing",
    "Image Generation": "image-generation",
    "Animation & VFX": "animation",
    "Music & Audio": "music",
    "No-Code/Low-Code": "no-code",
    "API & Integration Tools": "api",
    "Automation Tools": "automation",
    "Developer Tools": "dev-tools",
    "Dev Tools": "dev-tools",
    "E-commerce": "e-commerce",
    "Education & Learning": "education",
    "Gaming": "gaming",
    "Productivity": "productivity",
    "Cybersecurity": "cybersecurity",
    "Data Management": "data-management",
    "Personal Assistant Tools": "personal-assistant",
    "Startup & Small Business": "startup",
    "Streaming & Podcasting": "streaming",
    "Sustainability & Impact": "sustainability",
    "Social Media Tools": "social-media",
    "Recommendation Systems": "recommendation"
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
      href={`/projects?category=${encodeURIComponent(categoryParam)}`}
      className={`${classes} cursor-pointer`}
      onClick={(e) => e.stopPropagation()}
    >
      {category}
    </Link>
  );
}

export function PricingBadge({ pricing, clickable = true, size = "sm" }) {
  const baseClasses = `inline-flex items-center px-2 py-1 text-xs font-normal rounded-lg bg-gray-100 text-gray-900 hover:bg-gray-200 transition-colors`;
  
  const sizeClasses = {
    xs: "px-2 py-1 text-xs",
    sm: "px-2.5 py-1 text-xs", 
    md: "px-3 py-1.5 text-sm"
  };

  const classes = `${baseClasses.replace("px-2 py-1 text-xs", sizeClasses[size])}`;

  // Map pricing values to consistent format
  const pricingMap = {
    "Free": "free",
    "Freemium": "freemium", 
    "Paid": "paid",
    "Premium": "paid", // Legacy support
    "One-time": "paid", // Legacy support
    "Subscription": "paid" // Legacy support
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
      href={`/projects?pricing=${pricingParam}`}
      className={`${classes} cursor-pointer`}
      onClick={(e) => e.stopPropagation()}
    >
      {pricing || "Free"}
    </Link>
  );
}