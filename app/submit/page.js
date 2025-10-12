"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useUser } from "../hooks/useUser";
import { useRouter, useSearchParams } from "next/navigation";
import { NavArrowLeft, NavArrowRight, Xmark, Plus } from "iconoir-react";
import toast from "react-hot-toast";
// Import Zod for validation
import { z } from "zod";

// Validation schemas for each step
const PlanSelectionSchema = z.object({
  plan: z.enum(["standard", "premium"], {
    required_error: "Please select a plan",
  }),
});


// Combined schema for all directory information (steps 2, 3, 4 merged)
const DirectoryInfoSchema = z.object({
  // Basic Info
  name: z
    .string()
    .min(1, "AI project name is required")
    .max(100, "AI project name must be 100 characters or less"),
  website_url: z.string().url("Please enter a valid website URL"),
  short_description: z
    .string()
    .min(1, "Short description is required")
    .max(160, "Short description must be 160 characters or less"),
  contact_email: z.string().email("Please enter a valid email address"),
  maker_name: z.string().nullable().optional(),
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
    .enum(["Free", "Freemium", "Premium", "One-time", "Subscription"])
    .nullable()
    .optional(),
  video_url: z.string().url("Please enter a valid video URL").nullable().optional().or(z.literal("")),
  // Media
  logo_url: z.string().url("Please enter a valid logo URL"),
  screenshots: z.array(z.string().url()).max(5, "Maximum 5 screenshots allowed").nullable().optional(),
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
    name: "Standard Launch",
    price: 0,
    currency: "USD",
    features: [
      "Live on homepage for 7 days",
      "Badge for top 3 ranking products",
      "High authority backlink for top 3 winners",
      "Standard launch queue",
      "15 shared weekly slots",
      "Community voting access",
    ],
    popular: false,
  },
  premium: {
    name: "Premium Launch",
    price: 15,
    currency: "USD",
    features: [
      "Live on homepage for 7 days",
      "Badge for top 3 ranking products",
      "Guaranteed high authority backlink",
      "Skip the queue",
      "25 total slots (15 shared + 10 premium-only)",
      "Premium badge & featured placement",
    ],
    popular: true,
  },
};

function StepIndicator({ currentStep, steps }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          // Calculate display step number based on position in filtered array
          const displayStepNumber = index + 1;
          const isActive = step.id <= currentStep;

          return (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isActive
                    ? "bg-primary border-primary text-primary-content"
                    : "border-base-300 text-base-content/60"
                }`}
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
                    step.id < currentStep ? "bg-primary" : "bg-base-300"
                  }`}
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
function DirectoryInfoStep({ formData, setFormData, errors, categories, checkingDuplicate, checkingName }) {
  const [customCategory, setCustomCategory] = useState("");
  const [logoPreview, setLogoPreview] = useState(formData.logo_url || "");
  const [screenshots, setScreenshots] = useState(formData.screenshots || []);

  const handleLogoUrlChange = (url) => {
    try {
      if (url && url.trim()) {
        new URL(url);
        setLogoPreview(url);
      } else {
        setLogoPreview("");
      }
    } catch {
      setLogoPreview("");
    }
    setFormData({ ...formData, logo_url: url });
  };

  const addScreenshot = (url) => {
    if (!url || url.trim() === "") {
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      toast.error("Please enter a valid screenshot URL");
      return;
    }

    if (!screenshots.includes(url)) {
      const newScreenshots = [...screenshots, url];
      setScreenshots(newScreenshots);
      setFormData({ ...formData, screenshots: newScreenshots });
      toast.success("Screenshot added successfully");
    } else {
      toast.error("This screenshot URL is already added");
    }
  };

  const removeScreenshot = (index) => {
    const newScreenshots = screenshots.filter((_, i) => i !== index);
    setScreenshots(newScreenshots);
    setFormData({ ...formData, screenshots: newScreenshots });
  };

  const addCustomCategory = () => {
    if (
      customCategory.trim() &&
      !formData.categories?.includes(customCategory.trim())
    ) {
      const newCategories = [
        ...(formData.categories || []),
        customCategory.trim(),
      ];
      setFormData({ ...formData, categories: newCategories });
      setCustomCategory("");
    }
  };

  const removeCategory = (categoryToRemove) => {
    const newCategories =
      formData.categories?.filter((cat) => cat !== categoryToRemove) || [];
    setFormData({ ...formData, categories: newCategories });
  };

  return (
    <div className="space-y-8">
      {/* Basic Information Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-base-300">
          Basic Information
        </h3>
        <div className="space-y-6">
          <div>
            <label className="form-control w-full">
              <div className="label">
                <span className="label-text">AI Project Name *</span>
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
                className={`input input-bordered w-full ${
                  errors.name ? "input-error" : ""
                }`}
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {errors.name && (
                <div className="text-error text-sm mt-1">{errors.name}</div>
              )}
            </label>
          </div>

          <div>
            <label className="form-control w-full">
              <div className="label">
                <span className="label-text">Website URL *</span>
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
                className={`input input-bordered w-full ${
                  errors.website_url ? "input-error" : ""
                }`}
                value={formData.website_url || ""}
                onChange={(e) =>
                  setFormData({ ...formData, website_url: e.target.value })
                }
              />
              {errors.website_url && (
                <div className="text-error text-sm mt-1">{errors.website_url}</div>
              )}
            </label>
          </div>

          <div>
            <label className="form-control w-full">
              <div className="label">
                <span className="label-text">Short Description *</span>
                <span className="label-text-alt text-base-content/60">
                  {formData.short_description?.length || 0}/160
                </span>
              </div>
              <textarea
                className={`textarea textarea-bordered h-24 w-full resize-none ${
                  errors.short_description ? "textarea-error" : ""
                }`}
                placeholder="A brief description of your AI project (max 160 characters)"
                maxLength={160}
                value={formData.short_description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, short_description: e.target.value })
                }
              />
              {errors.short_description && (
                <div className="text-error text-sm mt-1">
                  {errors.short_description}
                </div>
              )}
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">Contact Email *</span>
                </div>
                <input
                  type="email"
                  placeholder="contact@your-project.com"
                  className={`input input-bordered w-full ${
                    errors.contact_email ? "input-error" : ""
                  }`}
                  value={formData.contact_email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_email: e.target.value })
                  }
                />
                {errors.contact_email && (
                  <div className="text-error text-sm mt-1">
                    {errors.contact_email}
                  </div>
                )}
              </label>
            </div>

            <div>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">Maker Name</span>
                </div>
                <input
                  type="text"
                  placeholder="Your name"
                  className="input input-bordered w-full"
                  value={formData.maker_name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, maker_name: e.target.value })
                  }
                />
              </label>
            </div>
          </div>

          <div>
            <label className="form-control w-full">
              <div className="label">
                <span className="label-text">Twitter/X Handle</span>
              </div>
              <div className="flex">
                <span className="flex items-center px-3 bg-base-200 border border-r-0 border-base-300 rounded-l-lg text-base-content/60">
                  @
                </span>
                <input
                  type="text"
                  placeholder="username"
                  className="input input-bordered w-full rounded-l-none"
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
        <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-base-300">
          Additional Details
        </h3>
        <div className="space-y-6">
          <div>
            <label className="form-control w-full">
              <div className="label">
                <span className="label-text">Full Description</span>
              </div>
              <textarea
                className="textarea textarea-bordered h-32 w-full resize-none"
                placeholder="Provide a detailed description of your AI project, its features, and what makes it unique..."
                value={formData.full_description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, full_description: e.target.value })
                }
              />
            </label>
          </div>

          <div>
            <label className="form-control w-full">
              <div className="label">
                <span className="label-text">Categories *</span>
                <span className="label-text-alt text-base-content/60">
                  Select up to 3 categories
                </span>
              </div>
            </label>

            {/* Category Selection */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {categories.map((category) => (
                <label key={category.name} className="cursor-pointer">
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={formData.categories?.includes(category.name) || false}
                    onChange={(e) => {
                      const currentCategories = formData.categories || [];
                      if (e.target.checked) {
                        if (currentCategories.length < 3) {
                          setFormData({
                            ...formData,
                            categories: [...currentCategories, category.name],
                          });
                        } else {
                          toast.error("You can select up to 3 categories");
                        }
                      } else {
                        removeCategory(category.name);
                      }
                    }}
                  />
                  <div
                    className={`p-3 border rounded-lg text-sm transition-all ${
                      formData.categories?.includes(category.name)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-base-300 hover:border-primary/50"
                    }`}
                  >
                    {category.name}
                  </div>
                </label>
              ))}
            </div>

            {/* Custom Category Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add custom category"
                className="input input-bordered input-sm flex-1"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addCustomCategory()}
              />
              <button
                type="button"
                onClick={addCustomCategory}
                className="btn btn-sm btn-outline"
                disabled={
                  !customCategory.trim() || (formData.categories?.length || 0) >= 3
                }
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Selected Categories */}
            {formData.categories?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.categories.map((category) => (
                  <div key={category} className="badge badge-primary gap-2">
                    {category}
                    <button
                      type="button"
                      onClick={() => removeCategory(category)}
                      className="btn btn-xs btn-circle btn-ghost"
                    >
                      <Xmark className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {errors.categories && (
              <div className="text-error text-sm mt-1">{errors.categories}</div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">Pricing Model</span>
                </div>
                <select
                  className="select select-bordered w-full"
                  value={formData.pricing || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, pricing: e.target.value })
                  }
                >
                  <option value="">Select pricing model</option>
                  <option value="Free">Free</option>
                  <option value="Freemium">Freemium</option>
                  <option value="Premium">Premium</option>
                  <option value="One-time">One-time Purchase</option>
                  <option value="Subscription">Subscription</option>
                </select>
              </label>
            </div>

            <div>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">Video URL (optional)</span>
                </div>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  className={`input input-bordered w-full ${
                    errors.video_url ? "input-error" : ""
                  }`}
                  value={formData.video_url || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, video_url: e.target.value })
                  }
                />
                {errors.video_url && (
                  <div className="text-error text-sm mt-1">{errors.video_url}</div>
                )}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Media Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-base-300">
          Media & Assets
        </h3>
        <div className="space-y-6">
          <div>
            <label className="form-control w-full">
              <div className="label">
                <span className="label-text">Logo URL *</span>
                <span className="label-text-alt text-base-content/60">
                  Direct link to your logo image
                </span>
              </div>
              <input
                type="url"
                placeholder="https://example.com/logo.png"
                className={`input input-bordered w-full ${
                  errors.logo_url ? "input-error" : ""
                }`}
                value={formData.logo_url || ""}
                onChange={(e) => handleLogoUrlChange(e.target.value)}
              />
              {errors.logo_url && (
                <div className="text-error text-sm mt-1">{errors.logo_url}</div>
              )}
            </label>

            {/* Logo Preview */}
            {logoPreview && (
              <div className="mt-3">
                <div className="text-sm font-medium mb-2">Logo Preview:</div>
                <div className="w-16 h-16 border border-base-300 rounded-lg overflow-hidden bg-base-100">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-full object-cover"
                    onError={() => setLogoPreview("")}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="form-control w-full">
              <div className="label">
                <span className="label-text">Screenshots (optional)</span>
                <span className="label-text-alt text-base-content/60">
                  Up to 5 screenshots
                </span>
              </div>
            </label>

            {/* Add Screenshot */}
            <div className="flex gap-2 mb-4">
              <input
                type="url"
                placeholder="https://example.com/screenshot.png"
                className="input input-bordered input-sm flex-1"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    addScreenshot(e.target.value);
                    e.target.value = "";
                  }
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  const input = e.target.parentElement.querySelector("input");
                  addScreenshot(input.value);
                  input.value = "";
                }}
                className="btn btn-sm btn-outline"
                disabled={screenshots.length >= 5}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Screenshots Preview */}
            {screenshots.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {screenshots.map((screenshot, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-video border border-base-300 rounded-lg overflow-hidden bg-base-100">
                      <img
                        src={screenshot}
                        alt={`Screenshot ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={() => removeScreenshot(index)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeScreenshot(index)}
                      className="absolute -top-2 -right-2 btn btn-xs btn-circle btn-error opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Xmark className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="alert alert-info">
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
              ></path>
            </svg>
            <div>
              <h3 className="font-bold">Image Guidelines</h3>
              <div className="text-sm">
                • Logo: 256x256px minimum, square format preferred
                <br />
                • Screenshots: 1200x800px minimum, 16:9 or 4:3 aspect ratio
                <br />• Use direct image URLs (ending in .png, .jpg, or .webp)
              </div>
            </div>
          </div>
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

      <div className="grid md:grid-cols-3 gap-6">
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
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="badge badge-primary">Most Popular</span>
              </div>
            )}

            <div className="card-body">
              <div className="flex items-center mb-4">
                <input
                  type="radio"
                  name="plan"
                  className="radio radio-primary mr-3"
                  checked={formData.plan === planKey}
                  onChange={() => setFormData({ ...formData, plan: planKey })}
                />
                <div>
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
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
                    <svg
                      className="w-4 h-4 text-primary mt-0.5 mr-2 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="alert alert-success">
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
        return `${availableSlots}/${totalSlots} spots (${15 - totalUsed} shared + 10 premium)`;
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

    return `${availableSlots}/${totalSlots} spots (shared)`;
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
        <h2 className="text-2xl font-bold mb-2">Choose Your Launch Week</h2>
        <p className="text-base-content/70">
          {formData.plan === "premium"
            ? "Premium plans have access to all 25 weekly slots (15 shared + 10 premium-only)"
            : "Standard plans have access to 15 shared weekly slots"}
        </p>
        {formData.plan === "premium" && (
          <div className="flex items-center justify-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-primary rounded"></div>
              <span className="text-base-content/60">Shared slots (0-15)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-success rounded"></div>
              <span className="text-base-content/60">Premium-only (15-25)</span>
            </div>
          </div>
        )}
      </div>

      {errors.launch_week && (
        <div className="alert alert-error">
          <span>{errors.launch_week}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableWeeks.map((week) => {
          const available = isWeekAvailable(week);
          const isSelected = formData.launch_week === week.competition_id;

          return (
            <div
              key={week.competition_id}
              className={`card cursor-pointer transition-all border-2 ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : available
                  ? "border-base-300 hover:border-primary/50"
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
                    className="radio radio-primary mr-3"
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
                    <h3 className="font-semibold">
                      Week {week.competition_id}
                    </h3>
                    <p className="text-sm text-base-content/60">
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
                      className={`text-sm font-medium ${
                        available
                          ? formData.plan === "premium"
                            ? "text-success"
                            : "text-info"
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
                          className="absolute left-0 top-0 h-full bg-primary transition-all"
                          style={{
                            width: `${Math.min(60, (week.total_submissions || 0) / 25 * 100)}%`, // 15/25 = 60%
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
                          className="absolute left-0 top-0 h-full bg-primary transition-all"
                          style={{
                            width: `${Math.min(100, (week.total_submissions || 0) / 15 * 100)}%`,
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
                    <span className="badge badge-error badge-sm">
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

      <div className="alert alert-info">
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
          ></path>
        </svg>
            <div>
              <h3 className="font-bold">Launch Schedule</h3>
              <div className="text-sm">
                • AI projects launch every Monday at 12:00 AM PST
                <br />
                • Competition runs for the full week (Monday-Sunday)
                <br />
                • Winners are announced and receive dofollow backlinks
                <br />•{" "}
                {formData.plan === "premium"
                  ? "Premium: Get dofollow backlink by default upon approval"
                  : "Standard: Get nofollow backlink at launch, dofollow if you win (top 3)"}
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
  });
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentPolling, setPaymentPolling] = useState(null); // Track payment polling state
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDraftMode, setIsDraftMode] = useState(false); // Distinguish draft from edit
  const [editDirectoryId, setEditDirectoryId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [checkingName, setCheckingName] = useState(false);

  // Validate email format
  const validateEmail = (email) => {
    if (!email || email.trim() === "") {
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrors(prev => ({
        ...prev,
        contact_email: "Please enter a valid email address",
      }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.contact_email;
        return newErrors;
      });
    }
  };

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

  // Validate video URL (optional)
  const validateVideoUrl = (url) => {
    if (!url || url.trim() === "") {
      // Clear error if field is empty (it's optional)
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.video_url;
        return newErrors;
      });
      return;
    }

    try {
      new URL(url);
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.video_url;
        return newErrors;
      });
    } catch (e) {
      setErrors(prev => ({
        ...prev,
        video_url: "Please enter a valid URL or leave it empty",
      }));
    }
  };


  // Validate short description
  const validateShortDescription = (description) => {
    if (!description || description.trim() === "") {
      setErrors(prev => ({
        ...prev,
        short_description: "Short description is required",
      }));
    } else if (description.length > 160) {
      setErrors(prev => ({
        ...prev,
        short_description: "Short description must be 160 characters or less",
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
        `/api/directories?check_duplicate=true&slug=${encodeURIComponent(slug)}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.exists) {
          setErrors(prev => ({
            ...prev,
            name: `An AI project with this name already exists: "${result.existing_directory}"`,
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
        `/api/directories?check_duplicate=true&website_url=${encodeURIComponent(websiteUrl)}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.exists) {
          setErrors(prev => ({
            ...prev,
            website_url: `This website has already been submitted as "${result.existing_directory}"`,
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

  // Debounce email validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.contact_email) {
        validateEmail(formData.contact_email);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.contact_email]);

  // Debounce logo URL validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.logo_url) {
        validateLogoUrl(formData.logo_url);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.logo_url]);

  // Debounce video URL validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateVideoUrl(formData.video_url);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.video_url]);

  // Debounce short description validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.short_description) {
        validateShortDescription(formData.short_description);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.short_description]);

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
  const startPaymentPolling = (directoryId) => {
    console.log("Starting payment polling for directory:", directoryId);
    setPaymentPolling({ directoryId, startTime: Date.now() });

    // Store polling info in localStorage so it persists across page navigation
    localStorage.setItem(
      "payment_polling",
      JSON.stringify({
        directoryId,
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
          `/api/payments?type=status&directoryId=${directoryId}`
        );
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.paymentStatus === "paid") {
            console.log("Payment detected via polling! Processing success...");
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
              const successUrl = `${window.location.origin}/submit?payment=success&directoryId=${directoryId}`;
              window.location.href = successUrl;
            }, 2000);
          }
        }
      } catch (error) {
        console.error("Payment polling error:", error);
      }

      // Stop polling after max attempts
      if (pollCount >= maxPolls) {
        console.log("Payment polling timed out");
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
    const edit = searchParams.get("edit");
    const draft = searchParams.get("draft");
    const id = searchParams.get("id");

    if (edit === "true" && id) {
      setIsEditMode(true);
      setEditDirectoryId(id);
      loadDirectoryForEdit(id);
    } else if (draft) {
      // Handle resuming a draft
      loadDraftForEdit(draft);
    }
  }, [searchParams]);

  const loadDraftForEdit = async (draftId) => {
    setIsLoading(true);
    
    // Clear any stale payment polling state when resuming a draft
    console.log("Clearing any stale payment polling state...");
    localStorage.removeItem("payment_polling");
    localStorage.removeItem("premium_form_data");
    localStorage.removeItem("premium_directory_id");
    setPaymentPolling(null);
    
    try {
      // First try to get draft data from sessionStorage
      const savedDraft = sessionStorage.getItem("resumeDraft");
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        sessionStorage.removeItem("resumeDraft");
        
        console.log("Loading draft from session storage:", draftData);
        
        // Clean and populate form with draft data
        const cleanedData = cleanDraftData(draftData);
        setFormData({
          ...cleanedData,
          plan: cleanedData.plan || "standard",
        });
        
        // Set draft mode (not edit mode - this is a new submission from draft)
        setIsDraftMode(true);
        setEditDirectoryId(draftData.id);
        
        // Start at step 1 to allow plan change
        setCurrentStep(1);
        setIsLoading(false);
        
        toast.success("Draft loaded! You can modify and resubmit.");
        return;
      }
      
      // If no session storage, fetch from API
      const response = await fetch(`/api/directories/${draftId}`);
      if (response.ok) {
        const result = await response.json();
        const draft = result.data.directory;
        
        console.log("Draft loaded from API:", draft);
        
        // Clean and populate form with draft data
        const cleanedData = cleanDraftData(draft);
        setFormData({
          ...cleanedData,
          plan: cleanedData.plan || "standard",
        });
        
        setIsDraftMode(true);
        setEditDirectoryId(draft.id);
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

  const loadDirectoryForEdit = async (directoryId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/directories/${directoryId}`);
      if (response.ok) {
        const result = await response.json();
        const directory = result.data.directory; // Fixed: accessing the nested directory object

        console.log("Directory data loaded for edit:", directory);

        // Check if directory can be edited
        if (directory.status !== "scheduled") {
          toast.error("Editing is only allowed for scheduled directories");
          router.push("/dashboard");
          return;
        }

        // Populate form data with all available fields
        setFormData({
          plan: directory.plan || "standard",
          name: directory.name || "",
          website_url: directory.website_url || "",
          short_description: directory.short_description || "",
          full_description: directory.full_description || "",
          categories: directory.categories || [],
          pricing: directory.pricing || "",
          logo_url: directory.logo_url || "",
          screenshots: directory.screenshots || ["", "", "", "", ""],
          video_url: directory.video_url || "",
          launch_week: directory.launch_week || "",
          contact_email: directory.contact_email || "",
          backlink_url: directory.backlink_url || "",
        });

        // Skip to step 2 (Basic Info) for editing
        setCurrentStep(2);

        toast.success("Directory loaded for editing");
      } else {
        throw new Error("Failed to load directory");
      }
    } catch (error) {
      console.error("Error loading directory for edit:", error);
      toast.error("Failed to load directory for editing");
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
      const directoryId = urlParams.get("directoryId");

      console.log("URL params on load:", { payment, step, directoryId });

      // Check for pending premium payment in localStorage even without URL params
      const savedFormData = localStorage.getItem("premium_form_data");
      const savedDirectoryId = localStorage.getItem("premium_directory_id");

      // Check if there's active payment polling that should be resumed
      const paymentPolling = localStorage.getItem("payment_polling");
      if (paymentPolling && !payment) {
        try {
          const pollingData = JSON.parse(paymentPolling);
          const timeSinceStart = Date.now() - pollingData.startTime;

          // If polling started less than 10 minutes ago, check payment status immediately
          if (timeSinceStart < 10 * 60 * 1000) {
            console.log("Checking payment status on page load...", pollingData);
            
            // Immediately check payment status with timeout
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
              
              const statusResponse = await fetch(
                `/api/payments?type=status&directoryId=${pollingData.directoryId}`,
                { signal: controller.signal }
              );
              
              clearTimeout(timeoutId);
              
              if (statusResponse.ok) {
                const statusResult = await statusResponse.json();
                if (statusResult.success && statusResult.paymentStatus) {
                  console.log("✅ Payment already completed! Redirecting...");
                  localStorage.removeItem("payment_polling");
                  localStorage.removeItem("premium_form_data");
                  localStorage.removeItem("premium_directory_id");
                  
                  toast.success("🎉 Payment confirmed! Your project has been submitted.");
                  setTimeout(() => {
                    window.location.href = `/submit?payment=success&directoryId=${pollingData.directoryId}`;
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
                localStorage.removeItem("premium_directory_id");
              } else {
                console.error("Error checking payment status:", statusError);
                // Clear stale data on error
                localStorage.removeItem("payment_polling");
                localStorage.removeItem("premium_form_data");
                localStorage.removeItem("premium_directory_id");
              }
              return; // Don't resume polling on error
            }
            
            // If payment not confirmed yet, resume polling only if no error
            console.log("Payment not confirmed yet, resuming polling...");
            startPaymentPolling(pollingData.directoryId);
          } else {
            console.log("Payment polling expired (>10 minutes), clearing state");
            localStorage.removeItem("payment_polling");
            localStorage.removeItem("premium_form_data");
            localStorage.removeItem("premium_directory_id");
          }
        } catch (error) {
          console.error("Error parsing payment polling data:", error);
          localStorage.removeItem("payment_polling");
          localStorage.removeItem("premium_form_data");
          localStorage.removeItem("premium_directory_id");
        }
      }

      if (savedFormData && savedDirectoryId && !payment && user) {
        console.log("Found pending premium session:", { savedDirectoryId });

        // Verify this saved data belongs to the current user by checking if the directory exists and belongs to them
        try {
          const verifyResponse = await fetch(
            `/api/directories/${savedDirectoryId}`
          );
          if (verifyResponse.ok) {
            const verifyResult = await verifyResponse.json();
            const directory = verifyResult.data;

            // Check if this directory belongs to the current user and is actually premium
            if (
              directory &&
              directory.maker_email === user.email &&
              directory.plan === "premium"
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
              console.log("Clearing invalid premium session data");
              localStorage.removeItem("premium_form_data");
              localStorage.removeItem("premium_directory_id");
            }
          } else {
            // Directory doesn't exist, clear localStorage
            localStorage.removeItem("premium_form_data");
            localStorage.removeItem("premium_directory_id");
          }
        } catch (error) {
          console.error("Error verifying premium session:", error);
          // Clear localStorage on error
          localStorage.removeItem("premium_form_data");
          localStorage.removeItem("premium_directory_id");
        }
      }

      if (payment === "success" && directoryId) {
        // Payment successful - directory already created, just show success and redirect
        console.log("Processing successful payment return");
        
        // Clean up localStorage
        localStorage.removeItem("premium_form_data");
        localStorage.removeItem("premium_directory_id");
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
        localStorage.removeItem("premium_directory_id");
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
        urlParams.get("payment") || urlParams.get("directoryId");

      // If user visits without payment params, clear any old premium data after a delay
      if (!hasPaymentParams) {
        const timer = setTimeout(() => {
          const savedData = localStorage.getItem("premium_form_data");
          const savedId = localStorage.getItem("premium_directory_id");

          if (savedData || savedId) {
            console.log("Clearing old premium session data");
            localStorage.removeItem("premium_form_data");
            localStorage.removeItem("premium_directory_id");
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

    console.log("Validating step:", step, "with formData:", formData);
    console.log("Current errors:", errors);
    console.log("Checking states:", { checkingDuplicate, checkingName });

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

    // Check for any other existing errors
    if (step === 2 && Object.keys(errors).length > 0) {
      console.error("Existing errors found:", errors);
      const errorMessages = Object.entries(errors)
        .map(([field, message]) => `${field}: ${message}`)
        .join(", ");
      toast.error(`Please fix the following errors: ${errorMessages}`);
      return false;
    }

    try {
      switch (step) {
        case 1:
          PlanSelectionSchema.parse(formData);
          console.log("✅ Step 1 validation passed");
          break;

        case 2:
          console.log("Validating step 2 with schema...");
          DirectoryInfoSchema.parse(formData);
          console.log("✅ Step 2 validation passed");
          break;

        case 3:
          LaunchWeekSchema.parse(formData);
          console.log("✅ Step 3 validation passed");
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
    console.log("Validation result:", isValid ? "✅ PASSED" : "❌ FAILED", newErrors);
    return isValid;
  };

  const handlePremiumPayment = async () => {
    setIsSubmitting(true);
    try {
      // Validate that we have all required data before proceeding
      if (!formData.name || !formData.short_description || !formData.website_url || 
          !formData.contact_email || !formData.categories || formData.categories.length === 0 ||
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

      // Create the full directory with all information
      const directoryData = {
        ...formData,
        plan: "premium",
      };

      // Create the directory with complete data
      const response = await fetch("/api/directories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(directoryData),
      });

      const result = await response.json();

      if (response.ok) {
        const directoryId = result.data.id;

        // Store directory ID for recovery
        localStorage.setItem("premium_directory_id", directoryId);

        // Create checkout session
        const checkoutResponse = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planType: "premium",
            directoryId: directoryId,
            directoryData: {
              name: formData.name,
              slug: result.data.slug,
              description: formData.short_description,
              website_url: formData.website_url,
            },
            customerEmail: formData.contact_email,
          }),
        });

        const checkoutResult = await checkoutResponse.json();

        if (
          checkoutResponse.ok &&
          checkoutResult.success &&
          checkoutResult.data?.checkoutUrl
        ) {
          // The success URL is now handled by the API - user will be redirected back to submit page
          const successUrl = `${window.location.origin}/submit?payment=success&directoryId=${directoryId}`;
          console.log(
            "Payment checkout created successfully:",
            checkoutResult.data
          );
          console.log("Success URL configured:", successUrl);
          console.log("Checkout URL:", checkoutResult.data.checkoutUrl);

          // Start payment polling and open payment in new window
          console.log(
            "Starting payment polling and opening payment in new window..."
          );
          startPaymentPolling(directoryId);

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
                    background: "#3b82f6",
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
        throw new Error(result.error || "Failed to create directory");
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
    
    // If on basic info step (2) and came from standard/premium plan, go back to step 1
    if (currentStep === 2 && (formData.plan === "standard" || formData.plan === "premium")) {
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
      if (isEditMode && editDirectoryId) {
        // Edit mode - update existing directory (scheduled/published)
        const updateData = {
          directoryId: editDirectoryId,
          ...formData,
          // Preserve existing approval status (don't override)
          backlink_verified: null,
        };

        const response = await fetch("/api/directories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        const result = await response.json();

        if (response.ok) {
          toast.success("Directory updated successfully! Your changes will be reviewed by our admin team.");
          router.push(`/dashboard`);
        } else {
          throw new Error(result.error || "Failed to update directory");
        }
      } else if (formData.plan === "premium") {
        // Premium plan - trigger payment flow after filling all information
        await handlePremiumPayment();
      } else {
        // Standard plan - create new directory directly
        const submissionData = {
          ...formData,
          approved: false, // Default to unapproved as per spec
          backlink_verified: null,
          payment_status: false, // Standard plans don't require payment
          dofollow_status: false, // Will be set to true after approval for Premium plans or top 3 winners
        };

        const response = await fetch("/api/directories", {
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
          router.push(`/directory/${slug}?submitted=true&pending_approval=true`);
        } else {
          // Handle specific error types with better messaging
          if (result.code === "WEBSITE_EXISTS") {
            toast.error(result.error);
            setErrors({
              website_url: `Website already exists: ${result.existing_directory}`,
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
          <DirectoryInfoStep
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            categories={categories}
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

  // Show loading state when checking authentication or loading directory for edit
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 text-base-content/70">
            {isLoading ? "Loading directory for editing..." : "Loading..."}
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
                  Directory ID: {paymentPolling.directoryId} • Polling since:{" "}
                  {new Date(paymentPolling.startTime).toLocaleTimeString()}
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={async () => {
                      try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 5000);
                        
                        const response = await fetch(
                          `/api/payments?type=status&directoryId=${paymentPolling.directoryId}`,
                          { signal: controller.signal }
                        );
                        
                        clearTimeout(timeoutId);
                        
                        if (response.ok) {
                          const result = await response.json();
                          if (result.success && result.paymentStatus) {
                            toast.success("✅ Payment confirmed! Redirecting...");
                            localStorage.removeItem("payment_polling");
                            setTimeout(() => {
                              window.location.href = `/submit?payment=success&directoryId=${paymentPolling.directoryId}`;
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
                        localStorage.removeItem("premium_directory_id");
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
              : STEPS
          }
        />

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
                    Previous
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-sm text-base-content/60">
                  Step {currentStep} of {STEPS.length}
                </span>

                {currentStep < STEPS.length ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="btn btn-primary"
                  >
                    {isSubmitting && (
                      <span className="loading loading-spinner loading-sm"></span>
                    )}
                    {isSubmitting ? "Processing..." : "Next"}
                    {!isSubmitting &&
                      (currentStep !== 1 || formData.plan !== "premium") && (
                        <NavArrowRight className="w-4 h-4 ml-1" />
                      )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="btn btn-primary"
                  >
                    {isSubmitting && (
                      <span className="loading loading-spinner loading-sm"></span>
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

        {/* Approval Process Info */}
        <div className="mt-8">
          <div className="alert alert-info">
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
              ></path>
            </svg>
            <div>
              <h3 className="font-bold">Manual Approval Process</h3>
              <div className="text-sm">
                All AI project submissions require manual review and approval by our admin team.
                <br />
                • You'll receive an email notification once your project is approved
                <br />
                • Approval typically takes 24-48 hours during business days
                <br />
                • Premium plan benefits apply only after approval
                <br />
                • Approved projects will appear in the selected launch week
              </div>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center mt-8">
          <p className="text-sm text-base-content/60">
            Need help? Check out our{" "}
            <a href="/guidelines" className="link link-primary">
              submission guidelines
            </a>{" "}
            or{" "}
            <a href="/contact" className="link link-primary">
              contact our team
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SubmitPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-base-100 flex items-center justify-center">
          <div className="text-center">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="mt-4 text-base-content/70">Loading...</p>
          </div>
        </div>
      }
    >
      <SubmitPageContent />
    </Suspense>
  );
}
