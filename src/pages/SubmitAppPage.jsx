import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Upload,
  Calendar,
  DollarSign,
  Info,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Check,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/hooks/useSession";
import PlanSelectionStep from "@/components/ui/PlanSelectionStep";
import BacklinkBadge from "@/components/ui/BacklinkBadge";

export function SubmitAppPage() {
  const { session } = useSession() || {};
  const [searchParams] = useSearchParams();
  const initialPlan = searchParams.get("plan") || null;

  // Constants for tags
  const AVAILABLE_CATEGORIES = [
    "Directory of Directories",
    "AI & LLM",
    "Developer Tools & Platforms",
    "UI/UX",
    "Design",
    "APIs & Integrations",
    "SaaS Tools",
    "E-commerce",
    "Marketing & SEO",
    "Analytics & Data",
    "Social Media",
    "Content Management",
    "Productivity",
    "Finance & Business",
    "Health & Wellness",
    "Education & Learning",
    "Entertainment",
    "News & Media",
    "Travel & Lifestyle",
    "Real Estate",
    "Job Boards",
    "Community & Forums",
    "Marketplaces",
    "Security & Privacy",
    "Mobile Apps",
    "Web Apps",
    "Chrome Extensions",
    "WordPress Plugins",
    "Template Libraries",
    "Stock Resources",
  ];

  const PRICING_OPTIONS = ["Free", "Freemium", "Paid"];

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(initialPlan ? 2 : 1);
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    short_description: "",
    full_description: "",
    website_url: "",
    logo_url: "",
    screenshots: ["", "", "", "", ""],
    video_url: "",
    launch_week: "",
    contact_email: session?.user?.email || "",
    backlink_url: "", // For support launch
    categories: [], // Array of selected categories (max 3)
    pricing: "", // Single pricing option
  });

  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  // Mock available weeks - in real app, fetch from API
  useEffect(() => {
    const weeks = [];
    const now = new Date();

    for (let i = 0; i < 8; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + i * 7);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      // For free/support plans, limit to 15 slots
      const usedSlots = Math.floor(Math.random() * 12);
      const availableSlots = Math.max(0, 15 - usedSlots);

      weeks.push({
        start_date: weekStart.toISOString(),
        end_date: weekEnd.toISOString(),
        available_slots: availableSlots,
        is_full: availableSlots === 0,
      });
    }

    setAvailableWeeks(weeks);
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleScreenshotChange = (index, value) => {
    const newScreenshots = [...formData.screenshots];
    newScreenshots[index] = value;
    setFormData((prev) => ({ ...prev, screenshots: newScreenshots }));
  };

  const handleCategoryChange = (category) => {
    setFormData((prev) => {
      const currentCategories = prev.categories;
      if (currentCategories.includes(category)) {
        // Remove category
        return {
          ...prev,
          categories: currentCategories.filter((c) => c !== category),
        };
      } else if (currentCategories.length < 3) {
        // Add category if under limit
        return {
          ...prev,
          categories: [...currentCategories, category],
        };
      }
      return prev; // Don't add if already at max (3)
    });
  };

  const handlePricingChange = (pricing) => {
    setFormData((prev) => ({ ...prev, pricing }));
  };

  const removeCategoryFromSelection = (categoryToRemove) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((cat) => cat !== categoryToRemove),
    }));
  };

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
    if (planId === "premium_launch") {
      // For premium, redirect to payment first
      handlePremiumPayment();
    } else {
      setCurrentStep(2); // Go to form
    }
  };

  const handlePremiumPayment = () => {
    // In a real app, redirect to Stripe/LemonSqueezy
    // For demo, we'll simulate payment completion
    // Simulate payment redirect
    if (
      window.confirm(
        "Redirect to payment page? (This is a demo - will simulate successful payment)"
      )
    ) {
      // In real app: window.location.href = paymentUrl;
      // For demo, simulate return from payment:
      setTimeout(() => {
        setPaymentCompleted(true);
        setCurrentStep(2);
        alert("Payment successful! You can now submit your directory.");
      }, 1000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation for tags
    if (formData.categories.length === 0) {
      alert("Please select at least one category.");
      return;
    }

    if (!formData.pricing) {
      alert("Please select a pricing model.");
      return;
    }

    setLoading(true);

    const submissionData = {
      ...formData,
      plan: selectedPlan,
      payment_completed: paymentCompleted,
      link_type: selectedPlan === "standard_launch" ? "nofollow" : "dofollow",
      requires_backlink: selectedPlan === "support_launch",
    };

    // Simulate API call
    console.log("Submitting:", submissionData);

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 2000);
  };

  const getPlanDisplayName = (planId) => {
    const planNames = {
      standard_launch: "Standard Launch",
      support_launch: "Support Launch",
      premium_launch: "Premium Launch",
    };
    return planNames[planId] || planId;
  };

  // Success page
  if (submitted) {
    return (
      <div className="bg-white min-h-screen flex flex-col justify-center">
        <div className="max-w-2xl mx-auto text-center py-12 px-4 md:px-0">
          <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-8">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-medium text-gray-900 mb-6">
            Submission Successful!
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Your directory has been submitted with the{" "}
            <Badge variant="secondary" className="mx-1">
              {getPlanDisplayName(selectedPlan)}
            </Badge>
            plan.
          </p>

          <div className="space-y-4 mb-8">
            {selectedPlan === "support_launch" && (
              <Alert className="text-left border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Next Steps:</strong> We'll verify that the backlink
                  badge is installed on your website. Once verified, your
                  directory will get dofollow links immediately.
                </AlertDescription>
              </Alert>
            )}

            {selectedPlan === "standard_launch" && (
              <Alert className="text-left border-gray-200 bg-gray-50">
                <Info className="h-4 w-4 text-gray-600" />
                <AlertDescription className="text-gray-700">
                  <strong>Launch Details:</strong> Your directory will
                  participate in the weekly launch. Top 3 directories will
                  receive dofollow links, others will have nofollow links.
                </AlertDescription>
              </Alert>
            )}

            {selectedPlan === "premium_launch" && (
              <Alert className="text-left border-amber-200 bg-amber-50">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>Premium Benefits:</strong> Your directory will be
                  featured prominently and receive guaranteed dofollow links
                  immediately.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <p className="text-gray-600 mb-8">
            You'll receive an email confirmation shortly with next steps.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button className="bg-gray-900 hover:bg-gray-800 px-8 py-3">
                Back to Home
              </Button>
            </Link>

            <Button
              variant="outline"
              className="border-gray-200 hover:bg-gray-50 px-8 py-3"
              onClick={() => {
                setSubmitted(false);
                setCurrentStep(1);
                setSelectedPlan(null);
                setPaymentCompleted(false);
                setFormData({
                  name: "",
                  short_description: "",
                  full_description: "",
                  website_url: "",
                  logo_url: "",
                  screenshots: ["", "", "", "", ""],
                  video_url: "",
                  launch_week: "",
                  contact_email: session?.user?.email || "",
                  backlink_url: "",
                  categories: [],
                  pricing: "",
                });
                setCategoryDropdownOpen(false);
              }}
            >
              Submit Another Directory
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Plan Selection
  if (currentStep === 1) {
    return (
      <div className="bg-white min-h-screen flex flex-col">
        <div className="max-w-6xl mx-auto px-4 md:px-0">
          <section className="py-8 md:py-12 flex flex-col items-center text-center">
            <span className="flex items-center border border-gray-200 px-4 py-2 rounded-lg mb-6 text-sm font-medium bg-gray-50">
              <Upload className="inline w-4 h-4 mr-2" />
              Submit your directory
            </span>
            <h1 className="text-4xl md:text-5xl font-medium mb-4 text-gray-900">
              Submit Your Directory
            </h1>
            <p className="text-gray-600 text-center text-lg mb-2 max-w-2xl">
              First, choose the launch plan that works best for you
            </p>
            <p className="text-gray-500 text-center text-sm mb-8">
              All launches take place at 12:00 AM PST.
            </p>
          </section>

          <PlanSelectionStep
            onPlanSelect={handlePlanSelect}
            selectedPlan={selectedPlan}
          />
        </div>
      </div>
    );
  }

  // Step 2: Directory Submission Form
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 md:px-0 py-6 md:py-8">
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-8 md:mb-12">
          <button
            onClick={() => setCurrentStep(1)}
            className="inline-flex items-center text-gray-900 group cursor-pointer hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="transition duration-300 group-hover:-translate-x-1">
              Back to Plans
            </span>
          </button>

          <div className="text-center flex-1 max-w-md mx-4">
            <h1 className="text-2xl md:text-3xl font-medium text-gray-900 mb-2">
              Submit Your Directory
            </h1>
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-gray-600">Plan:</span>
              <Badge variant="secondary" className="font-medium">
                {getPlanDisplayName(selectedPlan)}
              </Badge>
              {paymentCompleted && (
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800 border-green-200"
                >
                  ✓ Payment Complete
                </Badge>
              )}
            </div>
          </div>

          <div className="w-32 md:w-auto"> {/* Spacer for alignment */}</div>
        </div>
        {!session && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              You can submit your directory without an account. However,
              creating an account will help you track your submission status and
              receive updates.{" "}
              <Link
                to="/signin"
                className="text-blue-600 hover:underline font-medium"
              >
                Sign in
              </Link>{" "}
              or{" "}
              <Link
                to="/signup"
                className="text-blue-600 hover:underline font-medium"
              >
                create an account
              </Link>{" "}
              for the best experience.
            </AlertDescription>
          </Alert>
        )}{" "}
        {/* Backlink Badge Component for Support Launch */}
        {selectedPlan === "support_launch" && <BacklinkBadge />}
        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          {/* Basic Information */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50">
              <CardTitle className="text-lg font-medium text-gray-900">
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium text-gray-700"
                  >
                    Directory Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., Travel Directory Hub"
                    className="h-10 border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="website_url"
                    className="text-sm font-medium text-gray-700"
                  >
                    Website URL *
                  </Label>
                  <Input
                    id="website_url"
                    type="url"
                    value={formData.website_url}
                    onChange={(e) =>
                      handleInputChange("website_url", e.target.value)
                    }
                    placeholder="https://your-directory.com"
                    className="h-10 border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                    required
                  />
                </div>
              </div>

              {!session && (
                <div className="space-y-2">
                  <Label
                    htmlFor="contact_email"
                    className="text-sm font-medium text-gray-700"
                  >
                    Contact Email *
                  </Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) =>
                      handleInputChange("contact_email", e.target.value)
                    }
                    placeholder="your-email@example.com"
                    className="h-10 border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                    required
                  />
                  <p className="text-sm text-gray-500">
                    We'll use this email to contact you about your submission
                    status
                  </p>
                </div>
              )}

              {selectedPlan === "support_launch" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="backlink_url"
                    className="text-sm font-medium text-gray-700"
                  >
                    Backlink Page URL *
                  </Label>
                  <Input
                    id="backlink_url"
                    type="url"
                    value={formData.backlink_url}
                    onChange={(e) =>
                      handleInputChange("backlink_url", e.target.value)
                    }
                    placeholder="https://your-directory.com/about (page where you added the badge)"
                    className="h-10 border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                    required
                  />
                  <p className="text-sm text-gray-500">
                    URL of the page where you installed the DirectoryHunt badge
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="short_description"
                  className="text-sm font-medium text-gray-700"
                >
                  Short Description *
                </Label>
                <Input
                  id="short_description"
                  value={formData.short_description}
                  onChange={(e) =>
                    handleInputChange("short_description", e.target.value)
                  }
                  placeholder="Brief description (max 200 characters)"
                  maxLength={200}
                  className="h-10 border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                  required
                />
                <p className="text-sm text-gray-500">
                  {formData.short_description.length}/200 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="full_description"
                  className="text-sm font-medium text-gray-700"
                >
                  Full Description *
                </Label>
                <Textarea
                  id="full_description"
                  value={formData.full_description}
                  onChange={(e) =>
                    handleInputChange("full_description", e.target.value)
                  }
                  placeholder="Detailed description of your directory, features, and benefits..."
                  rows={6}
                  className="border-gray-200 focus:border-gray-900 focus:ring-gray-900 resize-none"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Categories & Pricing */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50">
              <CardTitle className="text-lg font-medium text-gray-900">
                Categories & Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Categories (Select up to 3) *
                  </Label>

                  {/* Selected Categories Display */}
                  {formData.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      {formData.categories.map((category) => (
                        <Badge
                          key={category}
                          variant="secondary"
                          className="flex items-center gap-1 pr-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                        >
                          <span>{category}</span>
                          <button
                            type="button"
                            className="ml-1 rounded-full hover:bg-gray-300 p-0.5 transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              removeCategoryFromSelection(category);
                            }}
                          >
                            <X className="h-3 w-3 cursor-pointer hover:text-red-500" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Category Dropdown */}
                  <Popover
                    open={categoryDropdownOpen}
                    onOpenChange={setCategoryDropdownOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between h-10 border-gray-200 hover:border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                        disabled={false} // Always enable the button so users can reopen dropdown
                      >
                        {formData.categories.length >= 3
                          ? "Maximum categories selected - click to modify"
                          : "Select categories..."}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <div className="max-h-60 overflow-auto">
                        {formData.categories.length >= 3 && (
                          <div className="p-3 text-sm text-gray-500 border-b bg-gray-50">
                            You've selected the maximum number of categories.
                            Remove one to add a different category.
                          </div>
                        )}
                        {AVAILABLE_CATEGORIES.filter(
                          (category) => !formData.categories.includes(category)
                        ).map((category) => (
                          <div
                            key={category}
                            className={`flex items-center space-x-2 p-3 hover:bg-gray-100 cursor-pointer transition-colors ${
                              formData.categories.length >= 3
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                            onClick={() => {
                              if (formData.categories.length < 3) {
                                handleCategoryChange(category);
                                // Only close dropdown if we've reached the maximum (3 categories)
                                if (formData.categories.length >= 2) {
                                  setCategoryDropdownOpen(false);
                                }
                              }
                            }}
                          >
                            <span className="text-sm">{category}</span>
                          </div>
                        ))}
                        {AVAILABLE_CATEGORIES.filter(
                          (category) => !formData.categories.includes(category)
                        ).length === 0 && (
                          <div className="p-3 text-sm text-gray-500">
                            All available categories selected
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <p className="text-sm text-gray-500">
                    Selected: {formData.categories.length}/3 categories
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Pricing Model *
                  </Label>
                  <RadioGroup
                    value={formData.pricing}
                    onValueChange={handlePricingChange}
                    className="flex flex-row space-x-8"
                  >
                    {PRICING_OPTIONS.map((pricing) => (
                      <div
                        key={pricing}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={pricing}
                          id={`pricing-${pricing}`}
                          className="border-gray-300 text-gray-900"
                        />
                        <Label
                          htmlFor={`pricing-${pricing}`}
                          className="text-sm font-normal text-gray-700 cursor-pointer"
                        >
                          {pricing}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50">
              <CardTitle className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Media</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="logo_url"
                  className="text-sm font-medium text-gray-700"
                >
                  Logo URL
                </Label>
                <Input
                  id="logo_url"
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) =>
                    handleInputChange("logo_url", e.target.value)
                  }
                  placeholder="https://your-directory.com/logo.png"
                  className="h-10 border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                />
                <p className="text-sm text-gray-500">
                  Square logo recommended (minimum 200x200px)
                </p>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700">
                  Screenshots (up to 5)
                </Label>
                <div className="space-y-3">
                  {formData.screenshots.map((screenshot, index) => (
                    <Input
                      key={index}
                      type="url"
                      value={screenshot}
                      onChange={(e) =>
                        handleScreenshotChange(index, e.target.value)
                      }
                      placeholder={`Screenshot ${index + 1} URL`}
                      className="h-10 border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  Add URLs to your directory screenshots. Desktop and mobile
                  views recommended.
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="video_url"
                  className="text-sm font-medium text-gray-700"
                >
                  Video URL (Optional)
                </Label>
                <Input
                  id="video_url"
                  type="url"
                  value={formData.video_url}
                  onChange={(e) =>
                    handleInputChange("video_url", e.target.value)
                  }
                  placeholder="https://youtube.com/embed/your-video or https://vimeo.com/your-video"
                  className="h-10 border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                />
                <p className="text-sm text-gray-500">
                  YouTube or Vimeo embed URL for directory demo video
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Launch Settings */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50">
              <CardTitle className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Launch Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <Label
                  htmlFor="launch_week"
                  className="text-sm font-medium text-gray-700"
                >
                  Launch Week *
                </Label>
                <Select
                  value={formData.launch_week}
                  onValueChange={(value) =>
                    handleInputChange("launch_week", value)
                  }
                  required
                >
                  <SelectTrigger className="h-10 border-gray-200 focus:border-gray-900 focus:ring-gray-900">
                    <SelectValue placeholder="Select a launch week" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWeeks.map((week, index) => {
                      const isDisabled =
                        selectedPlan !== "premium_launch" && week.is_full;
                      return (
                        <SelectItem
                          key={index}
                          value={week.start_date}
                          disabled={isDisabled}
                        >
                          {new Date(week.start_date).toLocaleDateString()} -{" "}
                          {new Date(week.end_date).toLocaleDateString()}
                          {selectedPlan === "premium_launch"
                            ? " (Premium - No limits)"
                            : isDisabled
                            ? " (Full - 0 slots left)"
                            : ` (${week.available_slots} slots left)`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {selectedPlan !== "premium_launch" && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      Free and Support plans are limited to 15 submissions per
                      week. Premium plans have no weekly limits.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Plan Summary */}
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong className="block mb-2">
                    Selected Plan: {getPlanDisplayName(selectedPlan)}
                  </strong>
                  <div className="space-y-1 text-sm">
                    {selectedPlan === "standard_launch" && (
                      <>
                        <div>• Free submission with nofollow links</div>
                        <div>• Top 3 weekly winners get dofollow links</div>
                        <div>• Standard launch queue</div>
                      </>
                    )}
                    {selectedPlan === "support_launch" && (
                      <>
                        <div>
                          • Free submission with immediate dofollow links
                        </div>
                        <div>• Requires backlink badge installation</div>
                        <div>• Social media promotion included</div>
                      </>
                    )}
                    {selectedPlan === "premium_launch" && (
                      <>
                        <div>
                          • Paid submission ($15) with guaranteed dofollow links
                        </div>
                        <div>• Skip the queue with immediate publication</div>
                        <div>• Premium badge and social media promotion</div>
                      </>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Terms & Submit */}
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-6">
                <p className="text-sm text-gray-600 leading-relaxed">
                  By submitting your directory, you agree to our{" "}
                  <Link
                    to="/terms"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Terms & Conditions
                  </Link>
                  . Your directory will be reviewed before being published.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Button
                    type="submit"
                    disabled={
                      loading ||
                      formData.categories.length === 0 ||
                      !formData.pricing
                    }
                    className="bg-gray-900 hover:bg-gray-800 text-white border-gray-900 px-8 py-3 h-12 flex-1 font-medium transition-colors"
                  >
                    {loading
                      ? "Submitting..."
                      : selectedPlan === "premium_launch" && paymentCompleted
                      ? "Submit Directory (Paid)"
                      : selectedPlan === "support_launch"
                      ? "Submit Directory (Backlink Required)"
                      : "Submit Directory (Free)"}
                  </Button>

                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 h-12 border-gray-200 hover:bg-gray-50 font-medium transition-colors"
                  >
                    Change Plan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
