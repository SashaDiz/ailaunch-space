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
  const baseClasses = `inline-flex items-center px-2 py-1.5 leading-none text-xs font-normal rounded-lg ${colorScheme.bg} ${colorScheme.text} ${colorScheme.hover} transition-colors`;
  
  const sizeClasses = {
    xs: "px-2 py-1.5 text-xs",
    sm: "px-2.5 py-1.5 text-xs", 
    md: "px-3 py-2 text-sm"
  };

  const classes = `${baseClasses.replace("px-3 py-2 text-xs", sizeClasses[size])}`;

  // Map category names to slugs for consistent filtering
  const categorySlugMap = {
    // Business & Finance
    "Finance & FinTech": "finance-fintech",
    "HR & Recruitment": "hr-recruitment",
    "Marketing & Sales": "marketing-sales",
    "Startup & Small Business": "startup-small-business",
    "Business Intelligence & Analytics": "business-intelligence-analytics",
    "Customer Service & Support": "customer-service-support",
    
    // Consumer & Lifestyle
    "Education & Learning": "education-learning",
    "Health & Wellness": "health-wellness",
    "Productivity": "productivity",
    "Personal Assistant Tools": "personal-assistant-tools",
    
    // Content & Creativity
    "Design & Art": "design-art",
    "Video & Content Creation": "video-content-creation",
    "Music & Audio": "music-audio",
    "Writing & Copywriting": "writing-copywriting",
    "Image Generation": "image-generation",
    "Animation & VFX": "animation-vfx",
    
    // Developer & Tech
    "Developer Tools": "developer-tools",
    "AI & Machine Learning": "ai-machine-learning",
    "Data Management": "data-management",
    "API & Integration Tools": "api-integration-tools",
    "No-Code/Low-Code": "no-code-low-code",
    "Automation Tools": "automation-tools",
    
    // E-commerce & Retail
    "E-commerce": "ecommerce",
    "Customer Analytics": "customer-analytics",
    "Recommendation Systems": "recommendation-systems",
    "Chatbots & Virtual Assistants": "chatbots-virtual-assistants",
    
    // Entertainment & Media
    "Gaming": "gaming",
    "Social Media Tools": "social-media-tools",
    "Streaming & Podcasting": "streaming-podcasting",
    
    // Industry-Specific
    "Healthcare & MedTech": "healthcare-medtech",
    "Legal & Compliance": "legal-compliance",
    "Real Estate & PropTech": "real-estate-proptech",
    "Research & Academia": "research-academia",
    
    // Language & Communication
    "Translation & Localization": "translation-localization",
    "Text Analysis & NLP": "text-analysis-nlp",
    "Voice & Speech": "voice-speech",
    "Chatbots & Conversational AI": "chatbots-conversational-ai",
    
    // Vision & Recognition
    "Computer Vision": "computer-vision",
    "Image Recognition": "image-recognition",
    "Video Analysis": "video-analysis",
    "OCR & Document Processing": "ocr-document-processing",
    
    // Other
    "Cybersecurity": "cybersecurity",
    "Sustainability & Impact": "sustainability-impact",
    "Research Tools": "research-tools",
    "General AI Tools": "general-ai-tools",
    
    // Legacy mappings for backward compatibility
    "AI & LLM": "ai-machine-learning",
    "AI & ML": "ai-machine-learning", 
    "Business & Finance": "finance-fintech",
    "Finance & Business": "finance-fintech",
    "Marketing & SEO": "marketing-sales",
    "Dev Tools": "developer-tools",
    "Developer Tools & Platforms": "developer-tools",
    "Design": "design-art",
    "SaaS": "general-ai-tools",
    "SaaS Tools": "general-ai-tools"
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
  const baseClasses = `inline-flex items-center px-2 py-1.5 text-xs font-normal rounded-lg bg-gray-100 text-gray-900 hover:bg-gray-200 transition-colors`;
  
  const sizeClasses = {
    xs: "px-2 py-1.5 text-xs",
    sm: "px-2.5 py-1.5 text-xs", 
    md: "px-3 py-2 text-sm"
  };

  const classes = `${baseClasses.replace("px-2 py-1.5 text-xs", sizeClasses[size])}`;

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
      href={`/directories?pricing=${pricingParam}`}
      className={`${classes} cursor-pointer`}
      onClick={(e) => e.stopPropagation()}
    >
      {pricing || "Free"}
    </Link>
  );
}