"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useUser } from "../hooks/useUser";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  NavArrowLeft, 
  NavArrowRight, 
  Xmark,
  Star,
  Globe,
  Medal,
  Home,
  Crown,
  Trophy,
  Link as LinkIcon,
  Clock,
  Megaphone,
  Rocket
} from "iconoir-react";
import toast from "react-hot-toast";
// Import Zod for validation
import { z } from "zod";
import dynamic from "next/dynamic";

// Use dynamic imports to prevent webpack issues
const CategorySelector = dynamic(
  () => import("../components/CategorySelector"),
  {
    ssr: false,
    loading: () => <div className="loading loading-spinner loading-sm"></div>
  }
);

const ImageUpload = dynamic(
  () => import("../components/ImageUpload"),
  {
    ssr: false,
    loading: () => <div className="loading loading-spinner loading-sm"></div>
  }
);

// Validation schemas for each step
const PlanSelectionSchema = z.object({
  plan: z.enum(["standard", "premium"], {
    required_error: "Please select a plan",
  }),
});


// Combined schema for all AI project information (steps 2, 3, 4 merged)
const ProjectInfoSchema = z.object({
  // Basic Info
  name: z
    .string()
    .min(1, "AI project name is required")
    .max(100, "AI project name must be 100 characters or less"),
  website_url: z.string().url("Please enter a valid website URL"),
  short_description: z
    .string()
    .min(1, "Short title is required")
    .max(100, "Short title must be 100 characters or less"),
  maker_twitter: z
    .string()
    .regex(/^@?[A-Za-z0-9_]*$/, "Invalid Twitter handle")
    .nullable()
    .optional()
    .or(z.literal("")),
  // Details
  full_description: z.string().nullable().optional(),
  categories: z
    .array(z.string())
    .min(1, "Please select at least one category")
    .max(3, "You can select up to 3 categories"),
  pricing: z
    .enum(["Free", "Freemium", "Paid"])
    .nullable()
    .optional(),
  // Media
  logo_url: z.string().url("Please enter a valid logo URL"),
});

const LaunchWeekSchema = z.object({
  launch_week: z.string().min(1, "Please select a launch week"),
});

// Multi-step form for AI project submission
const STEPS = [
  {
    id: 1,
    title: "Plan & Payment",
    description: "Choose your submission plan",
  },
  { 
    id: 2, 
    title: "AI Project Information", 
    description: "Tell us about your AI project" 
  },
  {
    id: 3,
    title: "Launch Week",
    description: "Select your launch week",
  },
];

const PLANS = {
  standard: {
    id: "standard",
    name: "Standard Launch",
    price: 0,
    currency: "USD",
    description: "Perfect for new AI projects and startups",
    icon: Globe,
    features: [
      { text: "Live on homepage for 7 days", icon: Home },
      { text: "15 slots weekly (limited availability)", icon: Crown },
      { text: "Badge for top 3 ranking products", icon: Trophy },
      { text: "High authority lifetime backlink (only for Top 3 rankings)", icon: LinkIcon },
      { text: "Standard launch queue", icon: Clock },
    ],
    limitations: [],
    popular: true, // Make standard popular since it's the only visible option
  },
  // Premium plan temporarily hidden - keeping for future use
  // premium: {
  //   id: "premium",
  //   name: "Premium Launch",
  //   price: 15,
  //   currency: "USD",
  //   description: "Maximum exposure for established AI projects",
  //   icon: Medal,
  //   features: [
  //     { text: "Live on homepage for a week", icon: Home },
  //     { text: "10 extra premium slots weekly", icon: Crown },
  //     { text: "Badge for top 3 ranking products", icon: Trophy },
  //     { text: "3+ Guaranteed high authority lifetime backlink", icon: LinkIcon },
  //     { text: "Skip the queue", icon: Clock },
  //     { text: "Social media promotion", icon: Megaphone },
  //     { text: "Premium badge", icon: Star },
  //   ],
  //   limitations: [],
  //   popular: true,
  // },
};

function StepIndicator({ currentStep, steps }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          // Calculate display step number based on position in filtered array
          const displayStepNumber = index + 1;
          // Adjust the active check based on whether we're showing all steps or filtered steps
          const isActive = steps.length === STEPS.length 
            ? step.id <= currentStep 
            : (step.id === 2 && currentStep >= 2) || (step.id === 3 && currentStep >= 3);

          return (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isActive
                    ? "text-white"
                    : "border-base-300 text-base-content/60"
                }`}
                style={isActive ? { backgroundColor: '#ED0D79', borderColor: '#ED0D79' } : {}}
              >
                {displayStepNumber}
              </div>
              <div className="ml-3 hidden sm:block">
                <h3
                  className={`text-sm font-medium ${
                    isActive ? "text-base-content" : "text-base-content/60"
                  }`}
                >
                  {step.title}
                </h3>
                <p className="text-xs text-base-content/60">
                  {step.description}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`hidden sm:block w-16 h-0.5 mx-4 ${
                    steps.length === STEPS.length 
                      ? step.id < currentStep 
                      : (step.id === 2 && currentStep > 2) || (step.id === 3 && currentStep > 3)
                      ? "" 
                      : "bg-base-300"
                  }`}
                  style={
                    steps.length === STEPS.length 
                      ? step.id < currentStep 
                        ? { backgroundColor: '#ED0D79' }
                        : {}
                      : (step.id === 2 && currentStep > 2) || (step.id === 3 && currentStep > 3)
                        ? { backgroundColor: '#ED0D79' }
                        : {}
                  }
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Merged step combining Basic Info, Details, and Media
function ProjectInfoStep({ formData, setFormData, errors, checkingDuplicate, checkingName }) {
  return (
    <div className="space-y-8">
      {/* Basic Information Section */}
      <div>
        <h3 className="text-lg font-semibold mb-6 pb-3 border-b-2 border-[#ED0D79]/20 text-base-content flex items-center gap-2">
          <div className="w-1 h-6 bg-[#ED0D79] rounded-full"></div>
          Basic Information
        </h3>
        <div className="space-y-6">
          <div>
            <label className="form-control w-full">
              <div className="label">
                <span className="label-text font-semibold text-base-content">AI Project Name *</span>
                {checkingName && (
                  <span className="label-text-alt text-info">
                    <span className="loading loading-spinner loading-xs mr-1"></span>
                    Checking...
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="e.g. AI Content Generator"
                className={`input input-bordered w-full transition-all duration-200 focus-visible:border-[#ED0D79] focus-visible:ring-2 focus-visible:ring-[#ED0D79]/20 focus-visible:outline-none ${
                  errors.name ? "input-error border-error" : "border-base-300"
                }`}
                style={{
                  boxShadow: errors.name ? '0 0 0 2px rgba(248, 113, 113, 0.2)' : 'none'
                }}
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {errors.name && (
                <div className="text-error text-sm mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.name}
                </div>
              )}
            </label>
          </div>

          <div>
            <label className="form-control w-full">
              <div className="label">
                <span className="label-text font-semibold text-base-content">Website URL *</span>
                {checkingDuplicate && (
                  <span className="label-text-alt text-info">
                    <span className="loading loading-spinner loading-xs mr-1"></span>
                    Checking...
                  </span>
                )}
              </div>
              <input
                type="url"
                placeholder="https://your-ai-project.com"
                className={`input input-bordered w-full transition-all duration-200 focus-visible:border-[#ED0D79] focus-visible:ring-2 focus-visible:ring-[#ED0D79]/20 focus-visible:outline-none ${
                  errors.website_url ? "input-error border-error" : "border-base-300"
                }`}
                style={{
                  boxShadow: errors.website_url ? '0 0 0 2px rgba(248, 113, 113, 0.2)' : 'none'
                }}
                value={formData.website_url || ""}
                onChange={(e) =>
                  setFormData({ ...formData, website_url: e.target.value })
                }
              />
              {errors.website_url && (
                <div className="text-error text-sm mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.website_url}
                </div>
              )}
            </label>
          </div>

          <div>
            <label className="form-control w-full">
              <div className="label">
                <span className="label-text font-semibold text-base-content">Short Title *</span>
                <span className="label-text-alt text-base-content/60 font-medium">
                  {formData.short_description?.length || 0}/100
                </span>
              </div>
              <input
                type="text"
                className={`input input-bordered w-full transition-all duration-200 focus-visible:border-[#ED0D79] focus-visible:ring-2 focus-visible:ring-[#ED0D79]/20 focus-visible:outline-none ${
                  errors.short_description ? "input-error border-error" : "border-base-300"
                }`}
                style={{
                  boxShadow: errors.short_description ? '0 0 0 2px rgba(248, 113, 113, 0.2)' : 'none'
                }}
                placeholder="A catchy one-line title for your AI project"
                maxLength={100}
                value={formData.short_description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, short_description: e.target.value })
                }
              />
              {errors.short_description && (
                <div className="text-error text-sm mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.short_description}
                </div>
              )}
            </label>
          </div>


          <div>
            <label className="form-control w-full">
              <div className="label">
                <span className="label-text font-semibold text-base-content">Twitter/X Handle</span>
              </div>
              <div className="flex">
                <span className="flex items-center px-4 bg-base-200 border border-r-0 border-base-300 rounded-l-lg text-base-content/70 font-medium">
                  @
                </span>
                <input
                  type="text"
                  placeholder="username"
                  className="input input-bordered w-full rounded-l-none transition-all duration-200 focus-visible:border-[#ED0D79] focus-visible:ring-2 focus-visible:ring-[#ED0D79]/20 focus-visible:outline-none border-base-300"
                  value={formData.maker_twitter?.replace("@", "") || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maker_twitter: `@${e.target.value.replace("@", "")}`,
                    })
                  }
                />
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div>
        <h3 className="text-lg font-semibold mb-6 pb-3 border-b-2 border-[#ED0D79]/20 text-base-content flex items-center gap-2">
          <div className="w-1 h-6 bg-[#ED0D79] rounded-full"></div>
          Additional Details
        </h3>
        <div className="space-y-6">
          <div>
            <label className="form-control w-full">
              <div className="label">
                <span className="label-text font-semibold text-base-content">Full Description</span>
              </div>
              <textarea
                className="textarea textarea-bordered h-32 w-full resize-none transition-all duration-200 focus-visible:border-[#ED0D79] focus-visible:ring-2 focus-visible:ring-[#ED0D79]/20 focus-visible:outline-none border-base-300"
                placeholder="Provide a detailed description of your AI project, its features, and what makes it unique..."
                value={formData.full_description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, full_description: e.target.value })
                }
              />
            </label>
          </div>

          <div>
            <CategorySelector
              selectedCategories={formData.categories || []}
              onCategoriesChange={(newCategories) => 
                setFormData({ ...formData, categories: newCategories })
              }
              maxSelections={3}
              error={errors.categories}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="form-control w-full">
                <div className="label">
                  <span className="label-text">Pricing Model</span>
                </div>
                <div className="relative inline-flex items-center bg-gray-100 rounded-lg p-1 w-full">
                  <div 
                    className="absolute top-1 bottom-1 w-1/3 bg-white rounded-md shadow-sm transition-transform duration-200 ease-in-out"
                    style={{
                      transform: formData.pricing === "Free" 
                        ? "translateX(0)" 
                        : formData.pricing === "Freemium" 
                        ? "translateX(100%)" 
                        : "translateX(200%)",
                      backgroundColor: formData.pricing ? "#ED0D79" : "#ED0D79"
                    }}
                  />
                  {["Free", "Freemium", "Paid"].map((option) => (
                    <label
                      key={option}
                      className="relative flex-1 text-center cursor-pointer transition-colors duration-200"
                    >
                      <input
                        type="radio"
                        name="pricing"
                        value={option}
                        checked={formData.pricing === option}
                        onChange={(e) =>
                          setFormData({ ...formData, pricing: e.target.value })
                        }
                        className="sr-only"
                      />
                      <span
                        className={`block py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200 ${
                          formData.pricing === option
                            ? "text-white"
                            : "text-gray-700 hover:text-gray-900"
                        }`}
                        style={{
                          color: formData.pricing === option ? "#ffffff" : undefined
                        }}
                      >
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Media Section */}
      <div>
        <h3 className="text-lg font-semibold mb-6 pb-3 border-b-2 border-[#ED0D79]/20 text-base-content flex items-center gap-2">
          <div className="w-1 h-6 bg-[#ED0D79] rounded-full"></div>
          Media & Assets
        </h3>
        <div className="space-y-6">
          <ImageUpload
            value={formData.logo_url || ""}
            onChange={(url) => setFormData({ ...formData, logo_url: url })}
            error={errors.logo_url}
            label="Logo"
            maxSize={1}
            required={true}
          />
        </div>
      </div>
    </div>
  );
}


function PlanStep({ formData, setFormData, errors = {}, isEditingDraft = false }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Choose Your Launch Plan</h2>
        <p className="text-base-content/70">
          Select the plan that best fits your AI project launch goals
        </p>
        {isEditingDraft && (
          <div className="alert alert-info mt-4 max-w-2xl mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm">
              You're editing a draft. You can change your plan before submitting.
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <div className="max-w-md w-full">
          {Object.entries(PLANS).map(([planKey, plan]) => (
          <div
            key={planKey}
            className={`card card-bordered cursor-pointer transition-all ${
              formData.plan === planKey
                ? "border-primary bg-primary/5"
                : "border-base-300 hover:border-primary/50"
            } ${plan.popular ? "relative" : ""}`}
            onClick={() => setFormData({ ...formData, plan: planKey })}
          >
            <div className="card-body">
              <div className="flex items-center mb-4">
                <input
                  type="radio"
                  name="plan"
                  className="radio radio-primary mr-3"
                  style={{ accentColor: '#ED0D79' }}
                  checked={formData.plan === planKey}
                  onChange={() => setFormData({ ...formData, plan: planKey })}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    {plan.popular && (
                      <span className="badge text-xs px-2 py-1" style={{ backgroundColor: '#ED0D79', color: 'white' }}>
                        Most Popular
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold">
                    {plan.price === 0 ? "Free" : `$${plan.price}`}
                    {plan.price > 0 && (
                      <span className="text-sm font-normal">
                        {" "}
                        {plan.currency}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <ul className="space-y-2 text-sm">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    {React.createElement(feature.icon, { 
                      className: "w-4 h-4 text-primary mt-0.5 mr-2 flex-shrink-0",
                      strokeWidth: 1.5
                    })}
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
        </div>
      </div>

      <div className="alert" style={{ backgroundColor: 'rgba(255, 148, 42, 0.1)', color: 'black', boxShadow: 'none', border: 'none' }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="stroke-current shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <h3 className="font-bold">All plans include:</h3>
          <div className="text-sm">
            • Permanent listing on our platform
            <br />
            • SEO benefits from our DR22+ domain
            <br />
            • Access to our engaged community
            <br />• Competition entry for weekly contests
          </div>
        </div>
      </div>
    </div>
  );
}

function WeekSelectionStep({ formData, setFormData, errors }) {
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableWeeks();
  }, [formData.plan]);

  const fetchAvailableWeeks = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/competitions?available=true&plan=${formData.plan}`
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableWeeks(data.data.weeks || []);
      } else {
        console.error("Failed to fetch available weeks");
        setAvailableWeeks([]);
      }
    } catch (error) {
      console.error("Error fetching weeks:", error);
      setAvailableWeeks([]);
    } finally {
      setLoading(false);
    }
  };

  const formatWeekDate = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startMonth = start.toLocaleDateString("en-US", { month: "short" });
    const endMonth = end.toLocaleDateString("en-US", { month: "short" });
    const startDay = start.getDate();
    const endDay = end.getDate();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
    }
  };

  const getAvailabilityText = (week) => {
    const totalUsed = week.total_submissions || 0;
    
    if (formData.plan === "premium") {
      // Premium has access to 25 slots total (15 shared + 10 extra)
      const totalSlots = 25;
      const availableSlots = totalSlots - totalUsed;

      if (availableSlots <= 0) {
        return "Full";
      }
      
      // Show which slots are being used
      if (totalUsed < 15) {
        return `${availableSlots}/${totalSlots} spots`;
      } else {
        return `${availableSlots}/${totalSlots} spots (premium only)`;
      }
    }

    // Standard plan only has access to first 15 slots (shared)
    const totalSlots = 15;
    const availableSlots = totalSlots - totalUsed;

    if (availableSlots <= 0) {
      return "Full (upgrade to Premium for 10 extra slots)";
    }

    return `${availableSlots}/${totalSlots} spots`;
  };

  const isWeekAvailable = (week) => {
    const totalUsed = week.total_submissions || 0;
    
    if (formData.plan === "premium") {
      // Premium can submit if total submissions < 25
      return totalUsed < 25;
    }

    // Standard can only submit if total submissions < 15
    return totalUsed < 15;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="text-base-content/60 mt-2">
            Loading available weeks...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-3 flex items-center justify-center gap-3">
          <div className="w-2 h-8 bg-[#ED0D79] rounded-full"></div>
          Choose Your Launch Week
        </h2>
        <p className="text-base-content/70 text-lg mb-4">
          {formData.plan === "premium"
            ? "Premium plans have access to all 25 weekly slots (15 shared + 10 premium-only)"
            : "Standard plans have access to 15 shared weekly slots"}
        </p>
        {formData.plan === "premium" && (
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 bg-[#ED0D79] rounded"></div>
              <span className="text-base-content/70 font-medium">Shared slots (0-15)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 bg-success rounded"></div>
              <span className="text-base-content/70 font-medium">Premium-only (15-25)</span>
            </div>
          </div>
        )}
      </div>

      {errors.launch_week && (
        <div className="alert alert-error border-2 border-error bg-error/10">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">{errors.launch_week}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableWeeks.map((week) => {
          const available = isWeekAvailable(week);
          const isSelected = formData.launch_week === week.competition_id;

          return (
            <div
              key={week.competition_id}
              className={`card cursor-pointer transition-all duration-200 border-2 ${
                isSelected
                  ? "border-[#ED0D79] bg-[#ED0D79]/5 shadow-lg shadow-[#ED0D79]/10"
                  : available
                  ? "border-base-300 hover:border-[#ED0D79]/50 hover:shadow-md hover:shadow-[#ED0D79]/5"
                  : "border-base-300 opacity-50 cursor-not-allowed"
              }`}
              onClick={() => {
                if (available) {
                  setFormData({
                    ...formData,
                    launch_week: week.competition_id,
                  });
                }
              }}
            >
              <div className="card-body p-6">
                <div className="flex items-center mb-3">
                  <input
                    type="radio"
                    name="launch_week"
                    className="radio mr-3"
                    style={{
                      accentColor: '#ED0D79'
                    }}
                    checked={isSelected}
                    disabled={!available}
                    onChange={() => {
                      if (available) {
                        setFormData({
                          ...formData,
                          launch_week: week.competition_id,
                        });
                      }
                    }}
                  />
                  <div>
                    <h3 className="font-bold text-lg">
                      Week {week.competition_id}
                    </h3>
                    <p className="text-sm text-base-content/70 font-medium">
                      {formatWeekDate(week.start_date, week.end_date)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-base-content/70">
                      Availability:
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        available
                          ? formData.plan === "premium"
                            ? "text-success"
                            : "text-[#ED0D79]"
                          : "text-error"
                      }`}
                    >
                      {getAvailabilityText(week)}
                    </span>
                  </div>

                  {/* Progress bar for both Standard and Premium */}
                  <div className="w-full">
                    {formData.plan === "premium" ? (
                      // Premium: Show progress out of 25 total slots
                      <div className="relative w-full h-2 bg-base-300 rounded-full overflow-hidden">
                        {/* Shared slots portion (0-15) */}
                        <div
                          className="absolute left-0 top-0 h-full transition-all"
                          style={{
                            width: `${Math.min(60, (week.total_submissions || 0) / 25 * 100)}%`, // 15/25 = 60%
                            backgroundColor: '#ED0D79'
                          }}
                        ></div>
                        {/* Premium-only portion (15-25) */}
                        {(week.total_submissions || 0) > 15 && (
                          <div
                            className="absolute h-full bg-success transition-all"
                            style={{
                              left: '60%',
                              width: `${Math.min(40, ((week.total_submissions || 0) - 15) / 10 * 40)}%`,
                            }}
                          ></div>
                        )}
                      </div>
                    ) : (
                      // Standard: Show progress out of 15 shared slots
                      <div className="relative w-full h-2 bg-base-300 rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full transition-all"
                          style={{
                            width: `${Math.min(100, (week.total_submissions || 0) / 15 * 100)}%`,
                            backgroundColor: '#ED0D79'
                          }}
                        ></div>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-base-content/50">
                    Launch:{" "}
                    {new Date(week.start_date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      timeZoneName: "short",
                    })}
                  </div>
                </div>

                {!available && (
                  <div className="mt-3">
                    <span className="badge badge-error badge-sm font-medium">
                      Week Full
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {availableWeeks.length === 0 && (
        <div className="text-center py-8">
          <div className="text-base-content/60 mb-4">
            <div className="w-12 h-12 mx-auto mb-2 opacity-50 flex items-center justify-center">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p>No launch weeks available at the moment.</p>
          </div>
        </div>
      )}

      <div className="alert border-2 border-[#ED0D79]/20 bg-[#ED0D79]/5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="stroke-[#ED0D79] shrink-0 w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
            <div>
              <h3 className="font-bold text-[#ED0D79]">Launch Schedule</h3>
              <div className="text-sm text-base-content/80">
                • AI projects launch every Monday at 12:00 AM PST
                <br />
                • Competition runs for the full week (Monday-Sunday)
                <br />
                • Winners are announced and receive dofollow backlinks
                <br />•{" "}
                <span className="font-medium">
                  {formData.plan === "premium"
                    ? "Premium: Get dofollow backlink by default upon approval"
                    : "Standard: Get nofollow backlink at launch, dofollow if you win (top 3)"}
                </span>
              </div>
            </div>
      </div>
    </div>
  );
}

function SubmitPageContent() {
  const { user, loading } = useUser();
  const isLoaded = !loading;

  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    plan: "standard", // Default to standard plan
    pricing: "Free", // Default to Free pricing
    categories: [], // Initialize categories as empty array
  });
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentPolling, setPaymentPolling] = useState(null); // Track payment polling state
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDraftMode, setIsDraftMode] = useState(false); // Distinguish draft from edit
  const [editProjectId, setEditProjectId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [checkingName, setCheckingName] = useState(false);


  // Validate logo URL
  const validateLogoUrl = (url) => {
    if (!url || url.trim() === "") {
      setErrors(prev => ({
        ...prev,
        logo_url: "Logo URL is required",
      }));
      return;
    }

    try {
      new URL(url);
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.logo_url;
        return newErrors;
      });
    } catch (e) {
      setErrors(prev => ({
        ...prev,
        logo_url: "Please enter a valid URL (e.g., https://example.com/logo.png)",
      }));
    }
  };



  // Validate short title
  const validateShortTitle = (title) => {
    if (!title || title.trim() === "") {
      setErrors(prev => ({
        ...prev,
        short_description: "Short title is required",
      }));
    } else if (title.length > 100) {
      setErrors(prev => ({
        ...prev,
        short_description: "Short title must be 100 characters or less",
      }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.short_description;
        return newErrors;
      });
    }
  };

  // Validate project name
  const validateProjectName = (name) => {
    if (!name || name.trim() === "") {
      setErrors(prev => ({
        ...prev,
        name: "AI Project name is required",
      }));
    } else if (name.length > 100) {
      setErrors(prev => ({
        ...prev,
        name: "AI Project name must be 100 characters or less",
      }));
    } else {
      // Don't clear the error if there's a duplicate check error
      // The duplicate check will handle clearing the error
      setErrors(prev => {
        const newErrors = { ...prev };
        // Only clear if the error is not about duplicates
        if (newErrors.name && !newErrors.name.includes("already exists")) {
          delete newErrors.name;
        }
        return newErrors;
      });
    }
  };

  // Check for duplicate name/slug
  const checkDuplicateName = async (name) => {
    if (!name || name.trim() === "" || name.length < 3) {
      return;
    }

    setCheckingName(true);
    
    try {
      // Generate the slug that would be created
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch(
        `/api/projects?check_duplicate=true&slug=${encodeURIComponent(slug)}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.exists) {
          setErrors(prev => ({
            ...prev,
            name: `An AI project with this name already exists: "${result.existing_project}"`,
          }));
        } else {
          // Clear the name error if it exists
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.name;
            return newErrors;
          });
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn("Name duplicate check timed out - allowing to proceed");
      } else {
        console.error("Name duplicate check error:", error);
      }
      // On error, clear the name error to allow user to proceed
      setErrors(prev => {
        const newErrors = { ...prev };
        // Only clear if the error is about duplicates, keep validation errors
        if (newErrors.name && newErrors.name.includes("already exists")) {
          delete newErrors.name;
        }
        return newErrors;
      });
    } finally {
      setCheckingName(false);
    }
  };

  // Check for duplicate website URL (assumes URL is already validated)
  const checkDuplicateWebsite = async (websiteUrl) => {
    if (!websiteUrl || websiteUrl.trim() === "") {
      return;
    }

    setCheckingDuplicate(true);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch(
        `/api/projects?check_duplicate=true&website_url=${encodeURIComponent(websiteUrl)}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.exists) {
          setErrors(prev => ({
            ...prev,
            website_url: `This website has already been submitted as "${result.existing_project}"`,
          }));
        } else {
          // Clear the website_url error if it exists (but only duplicate errors)
          setErrors(prev => {
            const newErrors = { ...prev };
            if (newErrors.website_url && newErrors.website_url.includes("already been submitted")) {
              delete newErrors.website_url;
            }
            return newErrors;
          });
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn("Website duplicate check timed out - allowing to proceed");
      } else {
        console.error("Duplicate check error:", error);
      }
      // On error, clear the duplicate error to allow user to proceed
      setErrors(prev => {
        const newErrors = { ...prev };
        // Only clear if the error is about duplicates, keep validation errors
        if (newErrors.website_url && newErrors.website_url.includes("already been submitted")) {
          delete newErrors.website_url;
        }
        return newErrors;
      });
    } finally {
      setCheckingDuplicate(false);
    }
  };

  // Debounce the name validation and duplicate check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.name) {
        validateProjectName(formData.name);
        if (formData.name.length > 2) {
          checkDuplicateName(formData.name);
        }
      }
    }, 800); // Wait 800ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [formData.name]);

  // Debounce the website URL validation and duplicate check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.website_url && formData.website_url.trim() !== "") {
        // First validate the URL format
        try {
          new URL(formData.website_url);
          // If valid, clear any format errors and check for duplicates
          setErrors(prev => {
            const newErrors = { ...prev };
            // Only clear if the error is about format, not duplicates
            if (newErrors.website_url && !newErrors.website_url.includes("already been submitted")) {
              delete newErrors.website_url;
            }
            return newErrors;
          });
          // Only check for duplicates if URL is valid
          checkDuplicateWebsite(formData.website_url);
        } catch (e) {
          // Invalid URL format - show error immediately
          setErrors(prev => ({
            ...prev,
            website_url: "Please enter a valid website URL (e.g., https://example.com)",
          }));
        }
      } else if (formData.website_url === "") {
        // Clear error if field is empty
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.website_url;
          return newErrors;
        });
      }
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [formData.website_url]);


  // Debounce logo URL validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.logo_url) {
        validateLogoUrl(formData.logo_url);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.logo_url]);


  // Debounce short title validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.short_description) {
        validateShortTitle(formData.short_description);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.short_description]);

  // Clear category errors when categories are selected
  useEffect(() => {
    if (formData.categories && formData.categories.length > 0) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.categories;
        return newErrors;
      });
    }
  }, [formData.categories]);


  // Handle plan selection from URL parameters
  useEffect(() => {
    if (!searchParams) return;
    
    const planParam = searchParams.get("plan");
    if (planParam && (planParam === "standard" || planParam === "premium")) {
      // Set the plan and skip to step 2 (project details)
      setFormData(prev => ({
        ...prev,
        plan: planParam
      }));
      setCurrentStep(2); // Skip plan selection step
      
      // Show a toast to inform the user about the pre-selected plan
      if (planParam === "premium") {
        toast.success(`Selected Premium plan. Please fill in your project details.`, {
          duration: 4000,
        });
      } else {
        toast.success(`Selected Standard plan. Please fill in your project details.`, {
          duration: 4000,
        });
      }
    }
  }, [searchParams]);

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      // Store the current URL to redirect back after sign in
      const currentPath = window.location.pathname + window.location.search;
      sessionStorage.setItem('redirectAfterSignIn', currentPath);
      router.push('/auth/signin');
    }
  }, [user, isLoaded, router]);

  // Payment polling for automatic redirect when LemonJS fails
  const startPaymentPolling = (projectId) => {
    setPaymentPolling({ projectId: projectId, startTime: Date.now() });

    // Store polling info in localStorage so it persists across page navigation
    localStorage.setItem(
      "payment_polling",
      JSON.stringify({
        projectId,
        startTime: Date.now(),
      })
    );

    // Check payment status every 5 seconds for up to 10 minutes
    let pollCount = 0;
    const maxPolls = 120; // 10 minutes

    const pollInterval = setInterval(async () => {
      pollCount++;

      try {
        const response = await fetch(
          `/api/payments?type=status&projectId=${projectId}`
        );
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.paymentStatus === "paid") {
            clearInterval(pollInterval);
            localStorage.removeItem("payment_polling");
            setPaymentPolling(null);

            // Show success message and proceed to form completion
            toast.success(
              "🎉 Payment successful! Welcome back to complete your AI project submission.",
              {
                duration: 6000,
              }
            );

            // Instead of redirecting, trigger the success flow directly
            setTimeout(() => {
              const successUrl = `${window.location.origin}/submit?payment=success&projectId=${projectId}`;
              window.location.href = successUrl;
            }, 2000);
          }
        }
      } catch (error) {
        console.error("Payment polling error:", error);
      }

      // Stop polling after max attempts
      if (pollCount >= maxPolls) {
        clearInterval(pollInterval);
        localStorage.removeItem("payment_polling");
        setPaymentPolling(null);
      }
    }, 5000);
  };

  // Helper function to clean null values from draft data
  const cleanDraftData = (data) => {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      // Convert null to undefined for optional fields
      if (value === null) {
        cleaned[key] = undefined;
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  };

  // Handle edit mode
  useEffect(() => {
    if (!searchParams) return;
    
    const edit = searchParams.get("edit");
    const draft = searchParams.get("draft");
    const id = searchParams.get("id");

    if (edit === "true" && id) {
      setIsEditMode(true);
      setEditProjectId(id);
      loadProjectForEdit(id);
    } else if (draft) {
      // Handle resuming a draft
      loadDraftForEdit(draft);
    }
  }, [searchParams]);

  const loadDraftForEdit = async (draftId) => {
    setIsLoading(true);
    
    // Clear any stale payment polling state when resuming a draft
    localStorage.removeItem("payment_polling");
    localStorage.removeItem("premium_form_data");
    localStorage.removeItem("premium_project_id");
    setPaymentPolling(null);
    
    try {
      // First try to get draft data from sessionStorage
      const savedDraft = sessionStorage.getItem("resumeDraft");
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        sessionStorage.removeItem("resumeDraft");
        
        
        // Clean and populate form with draft data
        const cleanedData = cleanDraftData(draftData);
        setFormData({
          ...cleanedData,
          plan: cleanedData.plan || "standard",
        });
        
        // Set draft mode (not edit mode - this is a new submission from draft)
        setIsDraftMode(true);
        setEditProjectId(draftData.id);
        
        // Start at step 1 to allow plan change
        setCurrentStep(1);
        setIsLoading(false);
        
        toast.success("Draft loaded! You can modify and resubmit.");
        return;
      }
      
      // If no session storage, fetch from API
      const response = await fetch(`/api/projects/${draftId}`);
      if (response.ok) {
        const result = await response.json();
        const draft = result.data.project;
        
        
        // Clean and populate form with draft data
        const cleanedData = cleanDraftData(draft);
        setFormData({
          ...cleanedData,
          plan: cleanedData.plan || "standard",
        });
        
        setIsDraftMode(true);
        setEditProjectId(draft.id);
        setCurrentStep(1);
        
        toast.success("Draft loaded! You can modify and resubmit.");
      } else {
        toast.error("Failed to load draft");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error loading draft:", error);
      toast.error("Failed to load draft");
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectForEdit = async (projectId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const result = await response.json();
        const project = result.data.project; // Fixed: accessing the nested project object


        // Check if project can be edited
        if (project.status !== "scheduled") {
          toast.error("Editing is only allowed for scheduled projects");
          router.push("/dashboard");
          return;
        }

        // Populate form data with all available fields
        setFormData({
          plan: project.plan || "standard",
          name: project.name || "",
          website_url: project.website_url || "",
          short_description: project.short_description || "",
          full_description: project.full_description || "",
          categories: project.categories || [],
          pricing: project.pricing || "",
          logo_url: project.logo_url || "",
          screenshots: project.screenshots || ["", "", "", "", ""],
          video_url: project.video_url || "",
          launch_week: project.launch_week || "",
          backlink_url: project.backlink_url || "",
        });

        // Skip to step 2 (Basic Info) for editing
        setCurrentStep(2);

        toast.success("Project loaded for editing");
      } else {
        throw new Error("Failed to load project");
      }
    } catch (error) {
      console.error("Error loading project for edit:", error);
      toast.error("Failed to load project for editing");
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle URL parameters for payment status
  useEffect(() => {
    const handlePaymentCheck = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const payment = urlParams.get("payment");
      const step = urlParams.get("step");
      const projectId = urlParams.get("projectId");


      // Check for pending premium payment in localStorage even without URL params
      const savedFormData = localStorage.getItem("premium_form_data");
      const savedProjectId = localStorage.getItem("premium_project_id");

      // Check if there's active payment polling that should be resumed
      const paymentPolling = localStorage.getItem("payment_polling");
      if (paymentPolling && !payment) {
        try {
          const pollingData = JSON.parse(paymentPolling);
          const timeSinceStart = Date.now() - pollingData.startTime;

          // If polling started less than 10 minutes ago, check payment status immediately
          if (timeSinceStart < 10 * 60 * 1000) {
            
            // Immediately check payment status with timeout
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
              
              const statusResponse = await fetch(
                `/api/payments?type=status&projectId=${pollingData.projectId}`,
                { signal: controller.signal }
              );
              
              clearTimeout(timeoutId);
              
              if (statusResponse.ok) {
                const statusResult = await statusResponse.json();
                if (statusResult.success && statusResult.paymentStatus) {
                  localStorage.removeItem("payment_polling");
                  localStorage.removeItem("premium_form_data");
                  localStorage.removeItem("premium_project_id");
                  
                  toast.success("🎉 Payment confirmed! Your project has been submitted.");
                  setTimeout(() => {
                    window.location.href = `/submit?payment=success&projectId=${pollingData.projectId}`;
                  }, 1500);
                  return; // Stop further processing
                }
              }
            } catch (statusError) {
              if (statusError.name === 'AbortError') {
                console.warn("Payment status check timed out - clearing stale payment polling");
                toast.error("Previous payment session expired. Please start a new submission.");
                localStorage.removeItem("payment_polling");
                localStorage.removeItem("premium_form_data");
                localStorage.removeItem("premium_project_id");
              } else {
                console.error("Error checking payment status:", statusError);
                // Clear stale data on error
                localStorage.removeItem("payment_polling");
                localStorage.removeItem("premium_form_data");
                localStorage.removeItem("premium_project_id");
              }
              return; // Don't resume polling on error
            }
            
            // If payment not confirmed yet, resume polling only if no error
            startPaymentPolling(pollingData.projectId);
          } else {
            localStorage.removeItem("payment_polling");
            localStorage.removeItem("premium_form_data");
            localStorage.removeItem("premium_project_id");
          }
        } catch (error) {
          console.error("Error parsing payment polling data:", error);
          localStorage.removeItem("payment_polling");
          localStorage.removeItem("premium_form_data");
          localStorage.removeItem("premium_project_id");
        }
      }

      if (savedFormData && savedProjectId && !payment && user) {

        // Verify this saved data belongs to the current user by checking if the project exists and belongs to them
        try {
          const verifyResponse = await fetch(
            `/api/projects/${savedProjectId}`
          );
          if (verifyResponse.ok) {
            const verifyResult = await verifyResponse.json();
            const project = verifyResult.data;

            // Check if this project belongs to the current user and is actually premium
            if (
              project &&
              project.maker_email === user.email &&
              project.plan === "premium"
            ) {
              toast.success(
                "🎉 Welcome back! Your premium payment was successful. Please complete your AI project submission."
              );
              const parsedFormData = JSON.parse(savedFormData);
              setFormData(parsedFormData);
              setCurrentStep(2); // Start from Basic Info after payment
              return;
            } else {
              // Clear invalid localStorage data
              localStorage.removeItem("premium_form_data");
              localStorage.removeItem("premium_project_id");
            }
          } else {
            // Project doesn't exist, clear localStorage
            localStorage.removeItem("premium_form_data");
            localStorage.removeItem("premium_project_id");
          }
        } catch (error) {
          console.error("Error verifying premium session:", error);
          // Clear localStorage on error
          localStorage.removeItem("premium_form_data");
          localStorage.removeItem("premium_project_id");
        }
      }

      if (payment === "success" && projectId) {
        // Payment successful - project already created, just show success and redirect
        
        // Clean up localStorage
        localStorage.removeItem("premium_form_data");
        localStorage.removeItem("premium_project_id");
        localStorage.removeItem("payment_polling");

        toast.success(
          "🎉 Payment successful! Your premium AI project has been submitted and is under review."
        );

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else if (payment === "cancelled") {
        toast.error("Payment was cancelled. You can try again.");
        if (step) {
          setCurrentStep(parseInt(step));
        }

        // Clean up localStorage on cancellation
        localStorage.removeItem("premium_form_data");
        localStorage.removeItem("premium_project_id");
      }

      fetchCategories();
    };

    if (user && isLoaded) {
      handlePaymentCheck();
    }
  }, [user, isLoaded]);

  // Clear old premium session data for regular users (safety net)
  useEffect(() => {
    if (user && isLoaded) {
      const urlParams = new URLSearchParams(window.location.search);
      const hasPaymentParams =
        urlParams.get("payment") || urlParams.get("projectId");

      // If user visits without payment params, clear any old premium data after a delay
      if (!hasPaymentParams) {
        const timer = setTimeout(() => {
          const savedData = localStorage.getItem("premium_form_data");
          const savedId = localStorage.getItem("premium_project_id");

          if (savedData || savedId) {
            localStorage.removeItem("premium_form_data");
            localStorage.removeItem("premium_project_id");
            localStorage.removeItem("payment_polling");
          }
        }, 2000); // Wait 2 seconds to allow proper payment verification

        return () => clearTimeout(timer);
      }
    }
  }, [user, isLoaded]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data.categories || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};


    // Check if we're still checking for duplicates
    if (step === 2 && (checkingDuplicate || checkingName)) {
      toast.error("Please wait while we verify your AI project details");
      return false;
    }

    // Check if there's a duplicate name error
    if (step === 2 && errors.name) {
      toast.error("Please fix the AI project name error before continuing");
      return false;
    }

    // Check if there's a duplicate website error
    if (step === 2 && errors.website_url) {
      toast.error("Please fix the website URL error before continuing");
      return false;
    }

    try {
      switch (step) {
        case 1:
          PlanSelectionSchema.parse(formData);
          break;

        case 2:
          ProjectInfoSchema.parse(formData);
          break;

        case 3:
          LaunchWeekSchema.parse(formData);
          break;
      }
    } catch (error) {
      console.error("Zod validation error:", error);
      if (error.errors) {
        // Handle Zod validation errors
        error.errors.forEach((err) => {
          const field = err.path[0];
          newErrors[field] = err.message;
          console.error(`Validation error for field ${field}:`, err.message);
        });
        
        // Show the first error to the user
        const firstError = error.errors[0];
        toast.error(`${firstError.path[0]}: ${firstError.message}`);
      } else {
        console.error("Validation error:", error);
        newErrors.general = "Validation failed";
        toast.error("Validation failed. Please check all required fields.");
      }
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    return isValid;
  };

  const handlePremiumPayment = async () => {
    setIsSubmitting(true);
    try {
      // Validate that we have all required data before proceeding
      if (!formData.name || !formData.short_description || !formData.website_url || 
          !formData.categories || formData.categories.length === 0 ||
          !formData.logo_url || !formData.launch_week) {
        toast.error("Please fill in all required fields before proceeding to payment");
        setIsSubmitting(false);
        return;
      }

      // Store the current form data for recovery if needed
      localStorage.setItem(
        "premium_form_data",
        JSON.stringify({
          ...formData,
          step: currentStep,
        })
      );

      // Create the full project with all information
      const projectData = {
        ...formData,
        plan: "premium",
      };

      // Create the project with complete data
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });

      const result = await response.json();

      if (response.ok) {
        const projectId = result.data.id;

        // Store project ID for recovery
        localStorage.setItem("premium_project_id", projectId);

        // Create checkout session
        const checkoutResponse = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planType: "premium",
            projectId: projectId,
            projectData: {
              name: formData.name,
              slug: result.data.slug,
              description: formData.short_description,
              website_url: formData.website_url,
            },
            customerEmail: user.email,
          }),
        });

        const checkoutResult = await checkoutResponse.json();

        if (
          checkoutResponse.ok &&
          checkoutResult.success &&
          checkoutResult.data?.checkoutUrl
        ) {
          // The success URL is now handled by the API - user will be redirected back to submit page
          const successUrl = `${window.location.origin}/submit?payment=success&projectId=${projectId}`;

          // Start payment polling and open payment in new window
          startPaymentPolling(projectId);

          toast.success("💳 Opening payment page in new window...", {
            duration: 5000,
          });

          // Open Lemonsqueezy checkout in new window
          const paymentWindow = window.open(
            checkoutResult.data.checkoutUrl,
            "lemonsqueezy-payment",
            "width=800,height=900,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no"
          );

          // Focus the payment window
          if (paymentWindow) {
            paymentWindow.focus();

            // Show user instructions
            setTimeout(() => {
              toast(
                "👀 Complete your payment in the new window. This page will update automatically when payment is successful!",
                {
                  icon: "💡",
                  duration: 8000,
                  style: {
                    background: "#10b981",
                    color: "#ffffff",
                    border: "1px solid #059669",
                  },
                }
              );
            }, 2000);
          } else {
            // Fallback if popup is blocked
            toast.error(
              "❌ Popup blocked! Please allow popups and try again, or click the link below:",
              {
                duration: 10000,
              }
            );

            // Add fallback link
            setTimeout(() => {
              toast(
                "🔗 Click here to open payment: " +
                  checkoutResult.data.checkoutUrl,
                {
                  duration: 15000,
                  onClick: () =>
                    window.open(checkoutResult.data.checkoutUrl, "_blank"),
                  style: {
                    cursor: "pointer",
                    background: "#ED0D79",
                    color: "#ffffff",
                  },
                }
              );
            }, 1000);
          }
          return;
        } else {
          // Handle API errors with detailed error messages
          if (checkoutResult.error) {
            console.error("Payment API Error:", checkoutResult);
            if (checkoutResult.details) {
              console.error("Error details:", checkoutResult.details);
            }
            throw new Error(checkoutResult.error);
          } else {
            throw new Error("Failed to create checkout session");
          }
        }
      } else {
        throw new Error(result.error || "Failed to create project");
      }
    } catch (error) {
      console.error("Premium payment error:", error);
      toast.error("Payment setup failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    // For both standard and premium plans, go through all steps
    // Payment will be handled at the final submission for premium plans
    setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    const minStep = isEditMode ? 2 : 1;
    const planPreSelected = searchParams?.get("plan");
    
    // If plan was pre-selected from URL, don't allow going back to step 1
    if (planPreSelected && currentStep === 2) {
      // Redirect back to pricing page instead of going to step 1
      router.push("/pricing");
      return;
    }
    
    // If on basic info step (2) and came from standard/premium plan, go back to step 1
    if (currentStep === 2 && (formData.plan === "standard" || formData.plan === "premium") && !planPreSelected) {
      setCurrentStep(1);
      return;
    }
    
    if (currentStep > minStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      if (isEditMode && editProjectId) {
        // Edit mode - update existing project (scheduled/published)
        const updateData = {
          projectId: editProjectId,
          ...formData,
          // Preserve existing approval status (don't override)
          backlink_verified: null,
        };

        const response = await fetch("/api/projects", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        const result = await response.json();

        if (response.ok) {
          toast.success("Project updated successfully! Your changes will be reviewed by our admin team.");
          router.push(`/dashboard`);
        } else {
          throw new Error(result.error || "Failed to update project");
        }
      } else if (formData.plan === "premium") {
        // Premium plan - trigger payment flow after filling all information
        await handlePremiumPayment();
      } else {
        // Standard plan - create new project directly
        const submissionData = {
          ...formData,
          approved: false, // Default to unapproved as per spec
          backlink_verified: null,
          payment_status: false, // Standard plans don't require payment
          dofollow_status: false, // Will be set to true after approval for Premium plans or top 3 winners
        };

        const response = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submissionData),
        });

        const result = await response.json();

        if (response.ok) {
          const slug = result.data.slug;
          toast.success(
            result.data.message || "🎉 AI project submitted successfully! Your submission is now under review by our admin team and you'll be notified via email once approved."
          );
          router.push(`/project/${slug}?submitted=true&pending_approval=true`);
        } else {
          // Handle specific error types with better messaging
          if (result.code === "WEBSITE_EXISTS") {
            toast.error(result.error);
            setErrors({
              website_url: `Website already exists: ${result.existing_project}`,
            });
          } else if (result.code === "SLUG_EXISTS") {
            toast.error(result.error);
            setErrors({ name: "An AI project with this name already exists" });
          } else {
            toast.error(result.error || "Failed to submit AI project");
          }

          if (result.fields) {
            // Handle field-specific errors
            const fieldErrors = {};
            result.fields.forEach((field) => {
              fieldErrors[field] = `${field} is required or invalid`;
            });
            setErrors(fieldErrors);
          }
        }
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit AI project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <PlanStep 
            formData={formData} 
            setFormData={setFormData} 
            errors={errors}
            isEditingDraft={isDraftMode}
          />
        );
      case 2:
        return (
          <ProjectInfoStep
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            checkingDuplicate={checkingDuplicate}
            checkingName={checkingName}
          />
        );
      case 3:
        return (
          <WeekSelectionStep
            formData={formData}
            setFormData={setFormData}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };

  // Show loading state when checking authentication or loading project for edit
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 text-base-content/70">
            {isLoading ? "Loading project for editing..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  // Don't render the form if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }


  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            {isEditMode ? "Edit Your AI Project" : "Submit Your AI Project"}
          </h1>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            {isEditMode
              ? "Update your AI project information and settings."
              : "Launch your AI project to our community of makers, get valuable backlinks, and compete for weekly recognition."}
          </p>
        </div>

        {/* Payment Polling Indicator */}
        {paymentPolling && (
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg animate-pulse">
            <div className="flex items-center gap-3 flex-1">
              <div className="loading loading-spinner loading-sm text-blue-600"></div>
              <div className="flex-1">
                <h3 className="font-bold text-blue-800">
                  💳 Waiting for Payment Confirmation
                </h3>
                <p className="text-sm text-blue-700">
                  <strong>After completing payment:</strong>
                  <br />
                  1. Click the "✅ Complete Your Submission" button on the receipt page
                  <br />
                  2. Or close the payment window - this page will automatically update
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Project ID: {paymentPolling.projectId} • Polling since:{" "}
                  {new Date(paymentPolling.startTime).toLocaleTimeString()}
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={async () => {
                      try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 5000);
                        
                        const response = await fetch(
                          `/api/payments?type=status&projectId=${paymentPolling.projectId}`,
                          { signal: controller.signal }
                        );
                        
                        clearTimeout(timeoutId);
                        
                        if (response.ok) {
                          const result = await response.json();
                          if (result.success && result.paymentStatus) {
                            toast.success("✅ Payment confirmed! Redirecting...");
                            localStorage.removeItem("payment_polling");
                            setTimeout(() => {
                              window.location.href = `/submit?payment=success&projectId=${paymentPolling.projectId}`;
                            }, 1000);
                          } else {
                            toast.error("Payment not yet confirmed. Please wait or try again.");
                          }
                        }
                      } catch (error) {
                        if (error.name === 'AbortError') {
                          toast.error("Request timed out. Please try again or clear the payment state.");
                        } else {
                          console.error("Payment check error:", error);
                          toast.error("Failed to check payment status");
                        }
                      }
                    }}
                    className="btn btn-sm btn-primary"
                  >
                    ✅ I've Completed Payment - Check Status
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to clear the payment polling state and start fresh? This won't cancel any completed payment.")) {
                        localStorage.removeItem("payment_polling");
                        localStorage.removeItem("premium_form_data");
                        localStorage.removeItem("premium_project_id");
                        setPaymentPolling(null);
                        setFormData({ plan: "standard" });
                        setCurrentStep(1);
                        toast.success("Payment state cleared. You can start a new submission.");
                      }
                    }}
                    className="btn btn-sm btn-error btn-outline"
                  >
                    🔄 Clear & Start Fresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        <StepIndicator
          currentStep={currentStep}
          steps={
            isEditMode 
              ? STEPS.filter((step) => step.id !== 1)
              : searchParams?.get("plan") 
                ? STEPS.filter((step) => step.id !== 1) // Skip plan selection when plan is pre-selected
                : STEPS
          }
        />

        {/* Pre-selected Plan Indicator */}
        {searchParams?.get("plan") && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary text-primary-content rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-primary">
                  {formData.plan === "premium" ? "Premium" : "Standard"} Plan Selected
                </h3>
                <p className="text-sm text-base-content/70">
                  You've chosen the {formData.plan === "premium" ? "Premium" : "Standard"} launch plan. 
                  {formData.plan === "premium" ? " You'll get guaranteed backlinks and skip the queue." : " You'll get standard launch benefits."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-base-300">
              <div>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className="btn btn-outline mr-3"
                  >
                    Cancel
                  </button>
                )}
                {currentStep > (isEditMode ? 2 : 1) && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="btn btn-ghost"
                  >
                    <NavArrowLeft className="w-4 h-4 mr-1" />
                    {searchParams?.get("plan") && currentStep === 2 ? "Back to Pricing" : "Previous"}
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-sm text-base-content/60">
                  Step {searchParams?.get("plan") ? currentStep - 1 : currentStep} of {searchParams?.get("plan") ? STEPS.length - 1 : STEPS.length}
                </span>

                {currentStep < STEPS.length ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="bg-[#ED0D79] text-white rounded-lg px-6 py-3 font-semibold text-sm no-underline transition duration-300 hover:scale-105 flex items-center justify-center gap-2 disabled:hover:scale-100 disabled:opacity-70"
                  >
                    {isSubmitting && (
                      <span className="loading loading-spinner loading-sm"></span>
                    )}
                    {isSubmitting ? "Processing..." : "Next"}
                    {!isSubmitting && <NavArrowRight className="w-4 h-4" />}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-[#ED0D79] text-white rounded-lg px-6 py-3 font-semibold text-sm no-underline transition duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      <Rocket 
                        className="h-[18px] w-[18px]"
                        strokeWidth={2}
                      />
                    )}
                    {isSubmitting
                      ? isEditMode
                        ? "Updating..."
                        : formData.plan === "premium"
                        ? "Processing payment..."
                        : "Submitting..."
                      : isEditMode
                      ? "Update AI Project"
                      : formData.plan === "premium"
                      ? "Proceed to Payment ($15)"
                      : "Submit AI Project"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Submit page error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-base-100 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="alert alert-error mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="font-bold">Something went wrong!</h3>
                <div className="text-sm">
                  There was an error loading the submission form. Please try refreshing the page.
                </div>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component for useSearchParams
function SubmitPageWithSearchParams() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-base-100 flex items-center justify-center">
          <div className="text-center">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="mt-4 text-base-content/70">Loading submission form...</p>
          </div>
        </div>
      }
    >
      <ErrorBoundary>
        <SubmitPageContent />
      </ErrorBoundary>
    </Suspense>
  );
}

export default function SubmitPage() {
  try {
    return (
      <ErrorBoundary>
        <SubmitPageWithSearchParams />
      </ErrorBoundary>
    );
  } catch (error) {
    console.error("Submit page error:", error);
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="alert alert-error mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-bold">Page Loading Error</h3>
              <div className="text-sm">
                There was an error loading the submission form. Please refresh the page.
              </div>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
}
