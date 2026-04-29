"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useUser } from '@/hooks/use-user';
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Star,
  Globe,
  Medal,
  Home,
  Crown,
  Trophy,
  Link as LinkIcon,
  Clock,
  Megaphone,
  Rocket,
  Copy,
  Check,
  Sparkles,
  Wand2,
  Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import { isEnabled } from '@/lib/features';
// Import Zod for validation
import { z } from "zod";
import dynamic from "next/dynamic";

// Use dynamic imports to prevent webpack issues
const CategorySelector = dynamic(
  () => import("@/components/directory/CategorySelector"),
  {
    ssr: false,
    loading: () => <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
  }
);

const ImageUpload = dynamic(
  () => import("@/components/forms/ImageUpload"),
  {
    ssr: false,
    loading: () => <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
  }
);

const ScreenshotUpload = dynamic(
  () => import("@/components/forms/ScreenshotUpload"),
  {
    ssr: false,
    loading: () => <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
  }
);

const FeaturedBadgeEmbed = dynamic(
  () => import("@/components/shared/FeaturedBadgeEmbed"),
  {
    ssr: false,
    loading: () => <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
  }
);

// Validation schemas for each step
const PlanSelectionSchema = z.object({
  plan: z.enum(["standard", "premium"], {
    required_error: "Please select a plan",
  }),
});


// Combined schema for all project information (steps 2, 3, 4 merged)
const ProjectInfoSchema = z.object({
  // Basic Info
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be 100 characters or less"),
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

// Multi-step form for project submission
const ALL_STEPS = [
  {
    id: 1,
    title: "Plan & Payment",
    description: "Choose your submission plan",
  },
  {
    id: 2,
    title: "Project Information",
    description: "Tell us about your project"
  },
];
const STEPS = ALL_STEPS;

const PLANS = {
  standard: {
    id: "standard",
    name: "Standard Launch",
    price: 0,
    currency: "USD",
    description: "Free dofollow backlink in exchange for our badge",
    icon: Globe,
    features: [
      { text: "Free dofollow backlink — install our badge on your site, we verify automatically", icon: LinkIcon },
      { text: "Admin review (24–48h)", icon: Clock },
      { text: "Listed in the directory alongside paid projects", icon: Megaphone },
    ],
    limitations: [],
    popular: false,
  },
  premium: {
    id: "premium",
    name: "Premium Launch",
    price: 4.99,
    currency: "USD",
    description: "Pay once, no badge required, featured at the top",
    icon: Medal,
    features: [
      { text: "Guaranteed dofollow backlink — no badge required", icon: LinkIcon },
      { text: "Featured placement above free listings", icon: Crown },
      { text: "Priority review (skip the standard queue)", icon: Clock },
      { text: "Premium badge for credibility", icon: Star },
      { text: "Featured in newsletter to subscribers", icon: Rocket },
    ],
    limitations: [],
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
          // Adjust the active check based on whether we're showing all steps or filtered steps
          const isActive = steps.length === STEPS.length 
            ? step.id <= currentStep 
            : (step.id === 2 && currentStep >= 2) || (step.id === 3 && currentStep >= 3);

          return (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isActive
                    ? "text-background"
                    : "border-border text-muted-foreground"
                }`}
                style={isActive ? { backgroundColor: 'hsl(var(--foreground))', borderColor: 'hsl(var(--foreground))' } : {}}
              >
                {displayStepNumber}
              </div>
              <div className="ml-3 hidden sm:block">
                <h3
                  className={`text-sm font-medium ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </h3>
                <p className="text-xs text-muted-foreground">
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
                      : "bg-muted"
                  }`}
                  style={
                    steps.length === STEPS.length 
                      ? step.id < currentStep 
                        ? { backgroundColor: 'hsl(var(--foreground))' }
                        : {}
                      : (step.id === 2 && currentStep > 2) || (step.id === 3 && currentStep > 3)
                        ? { backgroundColor: 'hsl(var(--foreground))' }
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
function ProjectInfoStep({
  formData,
  setFormData,
  errors,
  checkingDuplicate,
  checkingName,
  categoryOptions,
  groupedCategoryOptions,
  isLoadingCategories,
}) {
  const [aiGeneratingDesc, setAiGeneratingDesc] = useState(false);
  const [aiSuggestingCategories, setAiSuggestingCategories] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const aiEnabled = isEnabled('ai');

  const handleAutoFillFromUrl = useCallback(async () => {
    const websiteUrl = (formData.website_url || '').trim();
    if (!websiteUrl) {
      toast.error('Add a website URL first.');
      return;
    }
    try {
      new URL(websiteUrl);
    } catch {
      toast.error('That URL doesn’t look right.');
      return;
    }

    setIsAutoFilling(true);
    const toastId = toast.loading('Reading your site…');
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'from-url', url: websiteUrl }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'AI auto-fill failed');
      }
      const data = json.data || {};
      setFormData((prev) => ({
        ...prev,
        name: prev.name || data.name || '',
        short_description: prev.short_description || data.short_description || '',
        full_description: prev.full_description || data.full_description || '',
        categories:
          prev.categories && prev.categories.length > 0
            ? prev.categories
            : data.suggested_categories || [],
        tags: prev.tags && prev.tags.length > 0 ? prev.tags : data.tags || [],
        logo_url: prev.logo_url || data.logo_url || '',
      }));
      toast.success('Filled in what we could find — review and tweak.', { id: toastId });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI auto-fill failed';
      toast.error(message, { id: toastId });
    } finally {
      setIsAutoFilling(false);
    }
  }, [formData.website_url, setFormData]);

  const handleGenerateDescription = async () => {
    if (!formData.name || !formData.short_description) {
      toast.error('Please fill in the project name and short title first');
      return;
    }
    setAiGeneratingDesc(true);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'description',
          name: formData.name,
          shortDesc: formData.short_description,
          category: formData.categories?.[0] || '',
        }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setFormData({ ...formData, full_description: result.data.description });
        toast.success('Description generated successfully');
      } else {
        toast.error(result.error || 'Failed to generate description');
      }
    } catch (error) {
      console.error('AI description error:', error);
      toast.error('Failed to generate description. Please try again.');
    } finally {
      setAiGeneratingDesc(false);
    }
  };

  const handleSuggestCategories = async () => {
    if (!formData.name) {
      toast.error('Please fill in the project name first');
      return;
    }
    const desc = formData.full_description || formData.short_description;
    if (!desc) {
      toast.error('Please fill in a description or short title first');
      return;
    }
    setAiSuggestingCategories(true);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'categories',
          name: formData.name,
          description: desc,
        }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        const suggested = result.data.categories;
        if (suggested.length > 0) {
          // Map category names back to the format used by CategorySelector
          const matchedCategories = categoryOptions
            .filter((cat: any) => suggested.includes(cat.name))
            .map((cat: any) => cat.name)
            .slice(0, 3);
          if (matchedCategories.length > 0) {
            setFormData({ ...formData, categories: matchedCategories });
            toast.success(`Suggested ${matchedCategories.length} categories`);
          } else {
            toast.error('No matching categories found. Try adjusting your description.');
          }
        } else {
          toast.error('No category suggestions available. Try adding more detail.');
        }
      } else {
        toast.error(result.error || 'Failed to suggest categories');
      }
    } catch (error) {
      console.error('AI category suggestion error:', error);
      toast.error('Failed to suggest categories. Please try again.');
    } finally {
      setAiSuggestingCategories(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Basic Information Section */}
      <div>
        <h3 className="text-lg font-semibold mb-6 pb-3 border-b-2 border-foreground/20 text-foreground flex items-center gap-2">
          <div className="w-1 h-6 bg-foreground rounded-full"></div>
          Basic Information
        </h3>
        <div className="space-y-6">
          <div>
            <label className="space-y-1 w-full">
              <div className="label">
                <span className="text-sm font-semibold text-foreground">Project Name *</span>
                {checkingName && (
                  <span className="text-xs text-info">
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-1"></span>
                    Checking...
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="e.g. Content Generator"
                className={`flex h-10 rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-full transition-all duration-200 focus-visible:border-ring ${
                  errors.name ? "border-destructive" : "border-border"
                }`}
                style={{
                  boxShadow: errors.name ? '0 0 0 2px rgba(248, 113, 113, 0.2)' : 'none'
                }}
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {errors.name && (
                <div className="text-destructive text-sm mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.name}
                </div>
              )}
            </label>
          </div>

          <div>
            <label className="space-y-1 w-full">
              <div className="label">
                <span className="text-sm font-semibold text-foreground">Website URL *</span>
                {checkingDuplicate && (
                  <span className="text-xs text-info">
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-1"></span>
                    Checking...
                  </span>
                )}
              </div>
              <div className="flex gap-2 items-stretch">
                <input
                  type="url"
                  placeholder="https://your-project.com"
                  className={`flex h-10 rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex-1 min-w-0 transition-all duration-200 focus-visible:border-ring ${
                    errors.website_url ? "border-destructive" : "border-border"
                  }`}
                  style={{
                    boxShadow: errors.website_url ? '0 0 0 2px rgba(248, 113, 113, 0.2)' : 'none'
                  }}
                  value={formData.website_url || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, website_url: e.target.value })
                  }
                />
                {aiEnabled && (
                  <button
                    type="button"
                    onClick={handleAutoFillFromUrl}
                    disabled={isAutoFilling || !formData.website_url}
                    title="Read your website and pre-fill the listing fields"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 text-sm font-medium text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    {isAutoFilling ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                    <span>Auto-fill</span>
                  </button>
                )}
              </div>
              {errors.website_url && (
                <div className="text-destructive text-sm mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.website_url}
                </div>
              )}
            </label>
          </div>

          <div>
            <label className="space-y-1 w-full">
              <div className="label">
                <span className="text-sm font-semibold text-foreground">Short Title *</span>
                <span className="text-xs text-muted-foreground font-medium">
                  {formData.short_description?.length || 0}/100
                </span>
              </div>
              <input
                type="text"
                className={`flex h-10 rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-full transition-all duration-200 focus-visible:border-ring ${
                  errors.short_description ? "border-destructive" : "border-border"
                }`}
                style={{
                  boxShadow: errors.short_description ? '0 0 0 2px rgba(248, 113, 113, 0.2)' : 'none'
                }}
                placeholder="A catchy one-line title for your project"
                maxLength={100}
                value={formData.short_description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, short_description: e.target.value })
                }
              />
              {errors.short_description && (
                <div className="text-destructive text-sm mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.short_description}
                </div>
              )}
            </label>
          </div>


          <div>
            <label className="space-y-1 w-full">
              <div className="label">
                <span className="text-sm font-semibold text-foreground">Twitter/X Handle</span>
              </div>
              <div className="flex">
                <span className="flex items-center px-4 bg-muted border border-r-0 border-border rounded-l-lg text-muted-foreground font-medium">
                  @
                </span>
                <input
                  type="text"
                  placeholder="username"
                  className="flex h-10 rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-full rounded-l-none transition-all duration-200 focus-visible:border-ring border-border"
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
        <h3 className="text-lg font-semibold mb-6 pb-3 border-b-2 border-foreground/20 text-foreground flex items-center gap-2">
          <div className="w-1 h-6 bg-foreground rounded-full"></div>
          Additional Details
        </h3>
        <div className="space-y-6">
          <div>
            <label className="space-y-1 w-full">
              <div className="label flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Full Description</span>
                {aiEnabled && (
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={aiGeneratingDesc}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {aiGeneratingDesc ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Wand2 className="w-3 h-3" />
                    )}
                    {aiGeneratingDesc ? 'Generating...' : 'Generate with AI'}
                  </button>
                )}
              </div>
              <textarea
                className="flex min-h-[80px] rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-32 w-full resize-none transition-all duration-200 focus-visible:border-ring border-border"
                placeholder="Provide a detailed description of your project, its features, and what makes it unique..."
                value={formData.full_description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, full_description: e.target.value })
                }
              />
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <div></div>
              {aiEnabled && (
                <button
                  type="button"
                  onClick={handleSuggestCategories}
                  disabled={aiSuggestingCategories}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {aiSuggestingCategories ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  {aiSuggestingCategories ? 'Suggesting...' : 'Suggest categories'}
                </button>
              )}
            </div>
            <CategorySelector
              selectedCategories={formData.categories || []}
              onCategoriesChange={(newCategories) => 
                setFormData({ ...formData, categories: newCategories })
              }
              categories={categoryOptions}
              groupedCategories={groupedCategoryOptions}
              loading={isLoadingCategories}
              maxSelections={3}
              error={errors.categories}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="space-y-1 w-full">
                <div className="label">
                  <span className="text-sm font-medium">Pricing Model</span>
                </div>
                <div className="relative inline-flex items-center bg-muted rounded-lg p-1 w-full">
                  <div
                    className="absolute top-1 bottom-1 w-[calc((100%-0.5rem)/3)] bg-primary rounded-md shadow-sm transition-transform duration-200 ease-in-out"
                    style={{
                      transform: formData.pricing === "Free"
                        ? "translateX(0)"
                        : formData.pricing === "Freemium"
                        ? "translateX(100%)"
                        : "translateX(200%)",
                    }}
                  />
                  {["Free", "Freemium", "Paid"].map((option) => (
                    <label
                      key={option}
                      className="relative flex-1 text-center cursor-pointer"
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
                            ? "text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
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
        <h3 className="text-lg font-semibold mb-6 pb-3 border-b-2 border-foreground/20 text-foreground flex items-center gap-2">
          <div className="w-1 h-6 bg-foreground rounded-full"></div>
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
          <ScreenshotUpload
            value={formData.screenshots || []}
            onChange={(urls) => setFormData({ ...formData, screenshots: urls })}
            error={errors.screenshots}
          />
        </div>
      </div>
    </div>
  );
}


function PlanStep({ formData, setFormData, errors = {}, isEditingDraft = false }) {
  const [waitingTime, setWaitingTime] = useState(null);
  const [loadingWaitingTime, setLoadingWaitingTime] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const discountCode = "NY2026";
  const discountPercentage = "40";
  // January 14, 2026 at end of day (23:59:59 UTC)
  const endDate = new Date("2026-01-14T23:59:59Z");

  // Calculate time remaining until January 14
  const calculateTimeLeft = () => {
    const now = new Date().getTime();
    const difference = endDate.getTime() - now;

    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  // Format countdown for display
  const formatCountdown = () => {
    if (timeLeft.days > 0) {
      return `${timeLeft.days}d ${timeLeft.hours}h`;
    } else if (timeLeft.hours > 0) {
      return `${timeLeft.hours}h ${timeLeft.minutes}m`;
    } else if (timeLeft.minutes > 0) {
      return `${timeLeft.minutes}m ${timeLeft.seconds}s`;
    } else {
      return `${timeLeft.seconds}s`;
    }
  };

  // Update countdown every second
  useEffect(() => {
    const initial = calculateTimeLeft();
    setTimeLeft(initial);

    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCopyDiscountCode = async () => {
    try {
      await navigator.clipboard.writeText(discountCode);
      setCopiedCode(true);
      toast.success("Discount code copied to clipboard!", {
        icon: "🎉",
        duration: 3000,
      });
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
      toast.error("Failed to copy code. Please try again.");
    }
  };

  useEffect(() => {
    setWaitingTime(null);
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Choose Your Launch Plan</h2>
        <p className="text-muted-foreground">
          Select the plan that best fits your project launch goals
        </p>
        {isEditingDraft && (
          <div className="flex items-center gap-3 rounded-lg border border-info/30 bg-info/10 p-4 text-info mt-4 max-w-2xl mx-auto">
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

      {/* New Year Promo Banner */}
      {/* <div className="mb-6 rounded-xl border-2 border-primary/50 bg-primary/10 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground flex-shrink-0">
              <Sparkles className="w-6 h-6" strokeWidth={2} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-bold text-sm text-foreground mb-1">
                🎉 New Year Promo: {discountPercentage}% OFF Premium Launch <span className="font-semibold text-muted-foreground">(ends in: {formatCountdown()})</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Use code <strong className="font-bold text-primary">{discountCode}</strong> at checkout to save {discountPercentage}% on your Premium submission
              </p>
            </div>
          </div>
          <button
            onClick={handleCopyDiscountCode}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 whitespace-nowrap"
            aria-label={`Copy discount code ${discountCode} to clipboard`}
          >
            <span className="tracking-wider font-mono text-sm">{discountCode}</span>
            {copiedCode ? (
              <Check className="w-5 h-5" strokeWidth={2.5} />
            ) : (
              <Copy className="w-5 h-5" strokeWidth={2} />
            )}
            <span className="hidden sm:inline">Copy</span>
          </button>
        </div>
      </div> */}

      <div className="flex justify-center">
        <div className="w-full max-w-5xl grid gap-6 md:grid-cols-2">
          {Object.entries(PLANS).map(([planKey, plan]) => (
          <div
            key={planKey}
            className={`rounded-xl border cursor-pointer transition-all h-full ${
              formData.plan === planKey
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            } ${plan.popular ? "relative" : ""}`}
            onClick={() => setFormData({ ...formData, plan: planKey })}
          >
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center mb-4">
                <input
                  type="radio"
                  name="plan"
                  className="h-4 w-4 mr-3 accent-primary"
                  checked={formData.plan === planKey}
                  onChange={() => setFormData({ ...formData, plan: planKey })}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    {plan.popular && (
                      <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-foreground text-background">
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
                    <span>
                      {feature.text}
                      {planKey === "standard" && feature.text === "Standard launch queue" && (
                        <span className="ml-2 text-xs font-medium text-muted-foreground">
                          {loadingWaitingTime ? (
                            <span className="opacity-60">(calculating...)</span>
                          ) : waitingTime ? (
                            <span>({waitingTime})</span>
                          ) : (
                            <span className="opacity-60">(checking availability...)</span>
                          )}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg border p-4" style={{ backgroundColor: 'rgba(255, 148, 42, 0.1)', color: 'black', boxShadow: 'none', border: 'none' }}>
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
            • SEO benefits from our DR36+ domain
            <br />
            • Access to our engaged community
            <br />• Community listing and exposure
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
  const [formData, setFormData] = useState<Record<string, any>>({
    plan: "standard", // Default to standard plan
    pricing: "Free", // Default to Free pricing
    categories: [], // Initialize categories as empty array
    screenshots: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [groupedCategoryOptions, setGroupedCategoryOptions] = useState({});
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentPolling, setPaymentPolling] = useState(null); // Track payment polling state
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDraftMode, setIsDraftMode] = useState(false); // Distinguish draft from edit
  const [editProjectId, setEditProjectId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [checkingName, setCheckingName] = useState(false);
  const [badgeVerified, setBadgeVerified] = useState(false);

  // Reset badge verification when plan changes
  useEffect(() => {
    if (formData.plan === "premium") {
      // Premium doesn't need badge verification
      setBadgeVerified(false);
    }
  }, [formData.plan]);


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
        name: "Project name is required",
      }));
    } else if (name.length > 100) {
      setErrors(prev => ({
        ...prev,
        name: "Project name must be 100 characters or less",
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
            name: `A project with this name already exists: "${result.existing_project}"`,
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
    if (isLoaded && !user?.id) {
      // Store the current URL to redirect back after sign in
      const currentPath = window.location.pathname + window.location.search;
      sessionStorage.setItem('redirectAfterSignIn', currentPath);
      router.push('/auth/signin');
    }
  }, [user?.id, isLoaded, router]);

  // Payment polling for automatic redirect if checkout window is blocked
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
              "🎉 Payment successful! Welcome back to complete your project submission.",
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
  const cleanDraftData = (data: Record<string, any>): Record<string, any> => {
    const cleaned: Record<string, any> = {};
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
                "🎉 Welcome back! Your premium payment was successful. Please complete your project submission."
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
          "🎉 Payment successful! Your premium project has been submitted and is under review."
        );

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/dashboard?submitted=1");
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
      setIsLoadingCategories(true);
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategoryOptions(data.data?.categories || []);
        setGroupedCategoryOptions(data.data?.groupedCategories || {});
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};


    // Check if we're still checking for duplicates
    if (step === 2 && (checkingDuplicate || checkingName)) {
      toast.error("Please wait while we verify your project details");
      return false;
    }

    // Check if there's a duplicate name error
    if (step === 2 && errors.name) {
      toast.error("Please fix the project name error before continuing");
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
          !formData.logo_url) {
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

      let projectId = (isDraftMode && editProjectId) ? editProjectId : null; // Use existing draft ID if available

      // If we have a draft ID, the project was already updated via PUT in handleSubmit
      // Otherwise, create a new project
      if (!projectId) {
        // Create the full project with all information
        const projectData = {
          ...formData,
          screenshots: (formData.screenshots || []).filter(Boolean),
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
          projectId = result.data.id;
        } else {
          throw new Error(result.error || "Failed to create project");
        }
      }

      if (projectId) {
        // Generate slug from name (consistent with API)
        const slug = formData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

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
              slug: slug,
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

          // Open Stripe checkout in new window
          const paymentWindow = window.open(
            checkoutResult.data.checkoutUrl,
            "stripe-payment",
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
                    background: "hsl(142, 71%, 45%)",
                    color: "#ffffff",
                    border: "1px solid hsl(142, 76%, 36%)",
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
                  style: {
                    cursor: "pointer",
                    background: "hsl(var(--foreground))",
                    color: "#ffffff",
                  },
                } as any
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
        throw new Error("Failed to create project");
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
      if ((isEditMode || isDraftMode) && editProjectId) {
        // Edit mode or draft mode - update existing project
        const updateData = {
          projectId: editProjectId,
          ...formData,
          screenshots: (formData.screenshots || []).filter(Boolean),
          // Preserve existing approval status (don't override) unless it's a draft
          ...(isDraftMode ? {} : { backlink_verified: null }),
        };

        const response = await fetch("/api/projects", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        const result = await response.json();

        if (response.ok) {
          if (isDraftMode && formData.plan === "premium") {
            // For premium drafts, trigger payment flow after update
            // The draft is now updated, proceed to payment
            await handlePremiumPayment();
            return;
          } else if (isDraftMode && formData.plan === "standard") {
            // Standard draft updated - now it should be pending
            toast.success("🎉 Draft submitted successfully! Your submission is now under review by our admin team.");
            router.push(`/dashboard`);
          } else {
            toast.success("Project updated successfully! Your changes will be reviewed by our admin team.");
            router.push(`/dashboard`);
          }
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
          screenshots: (formData.screenshots || []).filter(Boolean),
          approved: false, // Default to unapproved as per spec
          backlink_verified: badgeVerified,
          payment_status: false, // Standard plans don't require payment
          dofollow_status: false, // Granted by admin on approval if backlink_verified is true
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
            result.data.message || "🎉 Project submitted successfully! Your submission is now under review by our admin team and you'll be notified via email once approved."
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
            setErrors({ name: "A project with this name already exists" });
          } else {
            toast.error(result.error || "Failed to submit project");
          }

          if (result.fields) {
            // Handle field-specific errors
            const fieldErrors: Record<string, string> = {};
            result.fields.forEach((field: string) => {
              fieldErrors[field] = `${field} is required or invalid`;
            });
            setErrors(fieldErrors);
          }
        }
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit project. Please try again.");
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
            categoryOptions={categoryOptions}
            groupedCategoryOptions={groupedCategoryOptions}
            isLoadingCategories={isLoadingCategories}
          />
        );
      default:
        return null;
    }
  };


  // Don't render the form if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }


  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            {isEditMode ? "Edit Your Project" : "Submit Your Project"}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {isEditMode
              ? "Update your project information and settings."
              : "Launch your project to our community of makers and get valuable backlinks."}
          </p>
        </div>

        {/* Payment Polling Indicator */}
        {paymentPolling && (
          <div className="mb-6 p-4 bg-info/10 border-2 border-info/30 rounded-lg animate-pulse">
            <div className="flex items-center gap-3 flex-1">
              <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent text-info"></div>
              <div className="flex-1">
                <h3 className="font-bold text-info">
                  💳 Waiting for Payment Confirmation
                </h3>
                <p className="text-sm text-info">
                  <strong>After completing payment:</strong>
                  <br />
                  1. Click the "✅ Complete Your Submission" button on the receipt page
                  <br />
                  2. Or close the payment window - this page will automatically update
                </p>
                <p className="text-xs text-info mt-2">
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
                    className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold transition-all hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
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
                    className="inline-flex items-center justify-center rounded-lg border-2 border-destructive px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
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
                <p className="text-sm text-muted-foreground">
                  You've chosen the {formData.plan === "premium" ? "Premium" : "Standard"} launch plan. 
                  {formData.plan === "premium" ? " You'll get guaranteed backlinks and skip the queue." : " You'll get standard launch benefits."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="rounded-xl bg-background shadow-xl border border-border">
          <div className="p-6">
            {renderStepContent()}

            {/* Badge verification — required for Standard plan to earn dofollow */}
            {currentStep === STEPS.length && formData.plan === "standard" && !isEditMode && (
              <div className="mt-8 pt-6 border-t border-border">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Embed our badge on your site
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Standard listings get a free dofollow backlink in exchange for displaying our badge on your website. Paste the code below on your homepage, then click Verify. Submit unlocks once verification passes.
                  </p>
                </div>
                <FeaturedBadgeEmbed
                  websiteUrl={formData.website_url}
                  onVerificationComplete={(ok: boolean) => setBadgeVerified(ok)}
                />
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
              <div>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className="inline-flex items-center justify-center rounded-lg border-2 border-foreground px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors mr-3"
                  >
                    Cancel
                  </button>
                )}
                {currentStep > (isEditMode ? 2 : 1) && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    {searchParams?.get("plan") && currentStep === 2 ? "Back to Pricing" : "Previous"}
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-sm text-muted-foreground">
                  Step {searchParams?.get("plan") ? currentStep - 1 : currentStep} of {searchParams?.get("plan") ? STEPS.length - 1 : STEPS.length}
                </span>

                {currentStep < STEPS.length ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="bg-card text-foreground border-2 border-foreground rounded-lg px-6 py-3 font-semibold text-sm no-underline transition duration-300 hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    {isSubmitting && (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    )}
                    {isSubmitting ? "Processing..." : "Next"}
                    {!isSubmitting && <ChevronRight className="w-4 h-4" />}
                  </button>
                ) : (
                  <div className="flex flex-col items-end gap-2">
                    {formData.plan === "standard" && !badgeVerified && !isEditMode && (
                      <p className="text-sm text-primary font-medium">
                        Please verify badge placement to submit
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting || (formData.plan === "standard" && !badgeVerified && !isEditMode)}
                      className="bg-foreground text-background border-2 border-foreground rounded-lg px-6 py-3 font-semibold text-sm no-underline transition duration-300 hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
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
                        ? "Update Project"
                        : formData.plan === "premium"
                        ? "Proceed to Payment ($4.99)"
                        : "Submit Project"}
                    </button>
                  </div>
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
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Submit page error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-transparent flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive mb-4">
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
              className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold transition-all hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
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
      fallback={null}
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
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive mb-4">
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
            className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold transition-all hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
}
