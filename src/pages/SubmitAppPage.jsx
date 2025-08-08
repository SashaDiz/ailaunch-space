import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import {
  Upload,
  Calendar,
  Info,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import PlanSelectionStep from "@/components/ui/PlanSelectionStep";
import BacklinkBadge from "@/components/ui/BacklinkBadge";
import RichTextEditor from "@/components/ui/RichTextEditor";

export function SubmitAppPage() {
  const [searchParams] = useSearchParams();
  const initialPlan = searchParams.get("plan") || null;
  const editAppId = searchParams.get("edit") || null;
  const isEditing = !!editAppId;
  const { user, isLoaded } = useUser();

  // State for loading existing app data
  const [loadingAppData, setLoadingAppData] = useState(isEditing);

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

  // Multi-step form state - now up to 5 steps (4 for standard/premium, 5 for support)
  const [currentStep, setCurrentStep] = useState(initialPlan ? 2 : 1);
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  // Step definitions - dynamic based on selected plan
  const getSteps = () => {
    const baseSteps = [
      { id: 1, title: "Choose Plan", description: "Select your launch plan" },
      {
        id: 2,
        title: "Launch Details",
        description: "Fill in directory information",
      },
    ];

    if (selectedPlan === "support_launch") {
      return [
        ...baseSteps,
        {
          id: 3,
          title: "Install Badge",
          description: "Add DirectoryHunt badge",
        },
        { id: 4, title: "Choose Week", description: "Select launch week" },
        {
          id: 5,
          title: "Confirm",
          description: "Review and confirm submission",
        },
      ];
    } else {
      return [
        ...baseSteps,
        { id: 3, title: "Choose Week", description: "Select launch week" },
        {
          id: 4,
          title: "Confirm",
          description: "Review and confirm submission",
        },
      ];
    }
  };

  const steps = getSteps();

  // Progress Bar Component
  const ProgressBar = () => (
    <div className="w-full max-w-4xl mx-auto mb-8 md:mb-12">
      <div className="flex items-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  currentStep > step.id
                    ? "bg-green-600 border-green-600 text-white"
                    : currentStep === step.id
                    ? "bg-gray-900 border-gray-900 text-white"
                    : "bg-white border-gray-300 text-gray-500"
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <div
                  className={`text-sm font-medium ${
                    currentStep >= step.id ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {step.title}
                </div>
                <div className="text-xs text-gray-500 hidden md:block">
                  {step.description}
                </div>
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-4 transition-colors ${
                  currentStep > step.id ? "bg-green-600" : "bg-gray-300"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const [formData, setFormData] = useState({
    name: "",
    short_description: "",
    full_description: "",
    website_url: "",
    logo_url: "",
    logo_file: null, // For file upload
    screenshots: ["", "", "", "", ""],
    screenshot_files: [null, null, null, null, null], // For file uploads
    video_url: "",
    launch_week: "",
    contact_email: "",
    backlink_url: "", // For support launch
    categories: [], // Array of selected categories (max 3)
    pricing: "", // Single pricing option
  });

  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [badgeInstalled, setBadgeInstalled] = useState(false); // For support launch badge step

  // Mock available weeks - in real app, fetch from API
  useEffect(() => {
    const weeks = [];
    const currentDate = new Date();
    const startOfYear = new Date(selectedYear, 0, 1);

    // Find the first Monday of the selected year
    let firstMonday = new Date(startOfYear);
    while (firstMonday.getDay() !== 1) {
      firstMonday.setDate(firstMonday.getDate() + 1);
    }

    // Generate weeks for the entire year
    for (let i = 0; i < 52; i++) {
      const weekStart = new Date(firstMonday);
      weekStart.setDate(firstMonday.getDate() + i * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      // Skip weeks that are in the past (for current year)
      if (selectedYear === currentDate.getFullYear() && weekEnd < currentDate) {
        continue;
      }

      // Shared slot system: Standard and Support plans share 15 slots per week
      // Premium plans have unlimited slots
      const standardUsed = Math.floor(Math.random() * 7); // Random standard submissions
      const supportUsed = Math.floor(Math.random() * 6); // Random support submissions
      const totalUsed = standardUsed + supportUsed;
      const availableSlots = Math.max(0, 15 - totalUsed);

      weeks.push({
        start_date: weekStart.toISOString(),
        end_date: weekEnd.toISOString(),
        available_slots: availableSlots,
        is_full: availableSlots === 0,
        month: weekStart.getMonth(), // 0-11
        year: weekStart.getFullYear(),
        // Additional details for shared slot system
        standard_used: standardUsed,
        support_used: supportUsed,
        total_used: totalUsed,
        slot_limit: 15,
      });
    }

    setAvailableWeeks(weeks);
  }, [selectedYear]);

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (formData.logo_url.startsWith("blob:")) {
        URL.revokeObjectURL(formData.logo_url);
      }
      formData.screenshots.forEach((screenshot) => {
        if (screenshot.startsWith("blob:")) {
          URL.revokeObjectURL(screenshot);
        }
      });
    };
  }, [formData.logo_url, formData.screenshots]);

  // Load existing app data when in edit mode
  useEffect(() => {
    if (!isEditing || !editAppId || !user?.id) {
      setLoadingAppData(false);
      return;
    }

    const loadAppData = async () => {
      try {
        const response = await fetch(`/api/apps/${editAppId}`, {
          headers: {
            "x-clerk-user-id": user.id,
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const app = result.data;

            // Pre-populate form with existing app data
            setFormData({
              name: app.name || "",
              short_description: app.short_description || "",
              full_description: app.full_description || "",
              website_url: app.website_url || "",
              logo_url: app.logo_url || "",
              logo_file: null,
              screenshots: [
                app.screenshots?.[0] || "",
                app.screenshots?.[1] || "",
                app.screenshots?.[2] || "",
                app.screenshots?.[3] || "",
                app.screenshots?.[4] || "",
              ],
              screenshot_files: [null, null, null, null, null],
              video_url: app.video_url || "",
              launch_week: app.launch_week || "",
              contact_email: app.contact_email || "",
              backlink_url: app.backlink_url || "",
              categories: app.categories || [],
              pricing: app.pricing || "",
            });

            // Skip plan selection for edit mode
            setCurrentStep(2);
          }
        } else {
          console.error("Failed to load app data for editing");
          // Redirect back to dashboard if app not found
          window.location.href = "/dashboard";
        }
      } catch (error) {
        console.error("Error loading app data:", error);
      } finally {
        setLoadingAppData(false);
      }
    };

    loadAppData();
  }, [isEditing, editAppId, user?.id]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file.");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Logo file size must be less than 5MB.");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        logo_file: file,
        logo_url: URL.createObjectURL(file), // Create preview URL
      }));
    }
  };

  const handleScreenshotFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate each file
    for (let file of files) {
      if (!file.type.startsWith("image/")) {
        alert("Please select only image files.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("Each screenshot file size must be less than 5MB.");
        return;
      }
    }

    // Check if adding these files would exceed the limit
    const currentFiles = formData.screenshot_files.filter((f) => f !== null);
    if (currentFiles.length + files.length > 5) {
      alert(
        `You can only upload up to 5 screenshots. You currently have ${currentFiles.length} and are trying to add ${files.length} more.`
      );
      return;
    }

    const newScreenshotFiles = [...formData.screenshot_files];
    const newScreenshots = [...formData.screenshots];

    // Find empty slots and fill them with the new files
    let fileIndex = 0;
    for (let i = 0; i < 5 && fileIndex < files.length; i++) {
      if (newScreenshotFiles[i] === null) {
        newScreenshotFiles[i] = files[fileIndex];
        newScreenshots[i] = URL.createObjectURL(files[fileIndex]);
        fileIndex++;
      }
    }

    setFormData((prev) => ({
      ...prev,
      screenshot_files: newScreenshotFiles,
      screenshots: newScreenshots,
    }));
  };

  const handleSingleScreenshotReplace = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file.");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Screenshot file size must be less than 5MB.");
        return;
      }

      const newScreenshotFiles = [...formData.screenshot_files];
      const newScreenshots = [...formData.screenshots];

      // Clean up old blob URL
      if (newScreenshots[index].startsWith("blob:")) {
        URL.revokeObjectURL(newScreenshots[index]);
      }

      newScreenshotFiles[index] = file;
      newScreenshots[index] = URL.createObjectURL(file);

      setFormData((prev) => ({
        ...prev,
        screenshot_files: newScreenshotFiles,
        screenshots: newScreenshots,
      }));
    }
  };

  const removeLogoFile = () => {
    if (formData.logo_url.startsWith("blob:")) {
      URL.revokeObjectURL(formData.logo_url);
    }
    setFormData((prev) => ({
      ...prev,
      logo_file: null,
      logo_url: "",
    }));
  };

  const removeScreenshotFile = (index) => {
    const newScreenshotFiles = [...formData.screenshot_files];
    const newScreenshots = [...formData.screenshots];

    if (newScreenshots[index].startsWith("blob:")) {
      URL.revokeObjectURL(newScreenshots[index]);
    }

    newScreenshotFiles[index] = null;
    newScreenshots[index] = "";

    setFormData((prev) => ({
      ...prev,
      screenshot_files: newScreenshotFiles,
      screenshots: newScreenshots,
    }));
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

  // Helper function to get plain text length from HTML content
  const getTextLength = (htmlContent) => {
    if (!htmlContent) return 0;
    // Create a temporary div to strip HTML tags for accurate character count
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    return tempDiv.textContent?.length || 0;
  };

  // Step navigation functions
  const validateStep2 = () => {
    const requiredFields = ["name", "website_url", "short_description"];
    if (!formData.contact_email) requiredFields.push("contact_email");

    // Check regular required fields
    const missingFields = requiredFields.filter(
      (field) => !formData[field]?.trim()
    );

    // Special validation for full_description (HTML content)
    const fullDescriptionTextLength = getTextLength(formData.full_description);
    if (fullDescriptionTextLength === 0) {
      missingFields.push("full_description");
    }

    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(", ")}`);
      return false;
    }

    // Validate full description length
    if (fullDescriptionTextLength > 3000) {
      alert("Full description must be 3000 characters or less.");
      return false;
    }

    if (formData.categories.length === 0) {
      alert("Please select at least one category.");
      return false;
    }

    if (!formData.pricing) {
      alert("Please select a pricing model.");
      return false;
    }

    return true;
  };

  const validateStep3 = () => {
    // For support launch, step 3 is badge installation
    if (selectedPlan === "support_launch") {
      if (!badgeInstalled) {
        alert(
          "Please confirm that you have installed the DirectoryHunt badge on your homepage."
        );
        return false;
      }
      if (!formData.backlink_url) {
        alert(
          "Please provide your homepage URL where you installed the badge."
        );
        return false;
      }
      return true;
    } else {
      // For other plans, step 3 is launch week selection
      if (!formData.launch_week) {
        alert("Please select a launch week.");
        return false;
      }
      return true;
    }
  };

  const validateStep4 = () => {
    // This is only for support launch (launch week selection)
    if (!formData.launch_week) {
      alert("Please select a launch week.");
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    if (
      currentStep === 4 &&
      selectedPlan === "support_launch" &&
      !validateStep4()
    )
      return;

    const maxStep = selectedPlan === "support_launch" ? 5 : 4;
    setCurrentStep((prev) => Math.min(prev + 1, maxStep));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
    if (planId === "premium_launch") {
      // For premium, redirect to payment first
      handlePremiumPayment();
    } else {
      setCurrentStep(2); // Go to launch details form
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

    // Check if user is authenticated
    if (!isLoaded) {
      alert("Please wait for authentication to load.");
      return;
    }

    if (!user) {
      alert("Please sign in to submit your directory.");
      return;
    }

    // Basic validation for tags
    if (formData.categories.length === 0) {
      alert("Please select at least one category.");
      return;
    }

    if (!formData.pricing) {
      alert("Please select a pricing model.");
      return;
    }

    // Validate full description length
    const fullDescriptionTextLength = getTextLength(formData.full_description);
    if (fullDescriptionTextLength > 3000) {
      alert("Full description must be 3000 characters or less.");
      return;
    }

    setLoading(true);

    try {
      // Prepare form data for file upload
      const submissionFormData = new FormData();

      // Add basic form fields
      Object.keys(formData).forEach((key) => {
        if (
          key !== "logo_file" &&
          key !== "screenshot_files" &&
          key !== "screenshots"
        ) {
          if (Array.isArray(formData[key])) {
            submissionFormData.append(key, JSON.stringify(formData[key]));
          } else {
            submissionFormData.append(key, formData[key]);
          }
        }
      });

      // Add logo file
      if (formData.logo_file) {
        submissionFormData.append("logo_file", formData.logo_file);
      }

      // Add screenshot files
      formData.screenshot_files.forEach((file, index) => {
        if (file) {
          submissionFormData.append(`screenshot_${index}`, file);
        }
      });

      // Add additional metadata
      submissionFormData.append("plan", selectedPlan);
      submissionFormData.append("payment_completed", paymentCompleted);
      submissionFormData.append(
        "link_type",
        selectedPlan === "standard_launch" ? "nofollow" : "dofollow"
      );
      submissionFormData.append(
        "requires_backlink",
        selectedPlan === "support_launch"
      );

      // Make API call to submit/update the directory
      const apiUrl = isEditing
        ? `/api/apps/${editAppId}`
        : "/api/submit-directory";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          "x-clerk-user-id": user.id,
        },
        body: submissionFormData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            `Failed to ${isEditing ? "update" : "submit"} directory`
        );
      }

      // Success
      console.log(
        `Directory ${isEditing ? "updated" : "submitted"} successfully:`,
        result
      );
      setLoading(false);
      setSubmitted(true);

      // If editing, redirect to dashboard after success
      if (isEditing) {
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
      }
    } catch (error) {
      console.error("Error submitting directory:", error);
      setLoading(false);
      alert(`Failed to submit directory: ${error.message}`);
    }
  };

  const getPlanDisplayName = (planId) => {
    const planNames = {
      standard_launch: "Standard Launch",
      support_launch: "Support Launch",
      premium_launch: "Premium Launch",
    };
    return planNames[planId] || planId;
  };

  // Helper function to group weeks by month
  const groupWeeksByMonth = (weeks) => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const grouped = {};
    weeks.forEach((week) => {
      const monthKey = `${week.year}-${week.month}`;
      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          monthName: monthNames[week.month],
          year: week.year,
          weeks: [],
        };
      }
      grouped[monthKey].weeks.push(week);
    });

    return grouped;
  };

  // Helper function to format week display
  const formatWeekDisplay = (week) => {
    const startDate = new Date(week.start_date);
    const endDate = new Date(week.end_date);
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();

    // If same month
    if (startDate.getMonth() === endDate.getMonth()) {
      return `${startDay}-${endDay}`;
    } else {
      // Different months
      const startMonth = startDate.toLocaleDateString("en-US", {
        month: "short",
      });
      const endMonth = endDate.toLocaleDateString("en-US", { month: "short" });
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
    }
  };

  // Authentication checks after all hooks
  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!user) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-medium text-gray-900 mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please sign in to submit your directory.
          </p>
          <Link to="/sign-in">
            <Button className="bg-gray-900 text-white hover:bg-gray-800">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Success page
  if (submitted) {
    return (
      <div className="bg-white min-h-screen flex flex-col justify-center">
        <div className="max-w-2xl mx-auto text-center py-12 px-4 md:px-0">
          <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-8">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl md:text-4xl font-medium text-gray-900 mb-6">
            Submission Successful!
          </h2>
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
                  <strong>Next Steps:</strong> We'll verify that the
                  DirectoryHunt badge is installed on your homepage. Once
                  verified, your directory will get dofollow links immediately.
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
              <Button className="text-white bg-gray-900 hover:bg-gray-800 px-8 py-3">
                Back to Home
              </Button>
            </Link>

            <Button
              variant="default"
              className="px-8 py-3"
              onClick={() => {
                // Clean up blob URLs before resetting
                if (formData.logo_url.startsWith("blob:")) {
                  URL.revokeObjectURL(formData.logo_url);
                }
                formData.screenshots.forEach((screenshot) => {
                  if (screenshot.startsWith("blob:")) {
                    URL.revokeObjectURL(screenshot);
                  }
                });

                setSubmitted(false);
                setCurrentStep(1);
                setSelectedPlan(null);
                setPaymentCompleted(false);
                setBadgeInstalled(false);
                setFormData({
                  name: "",
                  short_description: "",
                  full_description: "",
                  website_url: "",
                  logo_url: "",
                  logo_file: null,
                  screenshots: ["", "", "", "", ""],
                  screenshot_files: [null, null, null, null, null],
                  video_url: "",
                  launch_week: "",
                  contact_email: "",
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
        <div className="max-w-6xl mx-auto px-4 md:px-0 py-6 md:py-8">
          <ProgressBar />

          <PlanSelectionStep
            onPlanSelect={handlePlanSelect}
            selectedPlan={selectedPlan}
          />
        </div>
      </div>
    );
  }

  // Step 2: Launch Details Form
  if (currentStep === 2) {
    // Show loading state when fetching app data for editing
    if (isEditing && loadingAppData) {
      return (
        <div className="bg-white min-h-screen flex items-center justify-center">
          <div className="text-lg text-gray-600">Loading app data...</div>
        </div>
      );
    }

    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-4xl mx-auto px-4 md:px-0 py-6 md:py-8">
          <ProgressBar />

          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-medium text-gray-900 mb-2">
              {isEditing ? "Edit Directory" : "Launch Details"}
            </h2>
            {!isEditing && (
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
            )}
          </div>

          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Please provide your contact email to receive updates about your
              submission status.
            </AlertDescription>
          </Alert>

          <div className="space-y-6 md:space-y-8">
            {/* Basic Information */}
            <div className="border border-gray-200 rounded-lg p-6 space-y-6">
              <CardTitle className="text-lg font-medium text-gray-900">
                Basic Information
              </CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium text-gray-900"
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
                    className="text-sm font-medium text-gray-900"
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

              <div className="space-y-2">
                <Label
                  htmlFor="contact_email"
                  className="text-sm font-medium text-gray-900"
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

              <div className="space-y-2">
                <Label
                  htmlFor="short_description"
                  className="text-sm font-medium text-gray-900"
                >
                  Short Description *
                </Label>
                <Input
                  id="short_description"
                  value={formData.short_description}
                  onChange={(e) =>
                    handleInputChange("short_description", e.target.value)
                  }
                  placeholder="Brief description (max 100 characters)"
                  maxLength={100}
                  className="h-10 border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                  required
                />
                <p className="text-sm text-gray-500">
                  {formData.short_description.length}/100 characters
                </p>
              </div>

              <RichTextEditor
                id="full_description"
                value={formData.full_description}
                onChange={(value) =>
                  handleInputChange("full_description", value)
                }
                placeholder="Detailed description of your directory, features, and benefits..."
                rows={18}
                maxLength={3000}
                label="Full Description"
                required
              />
            </div>

            {/* Categories & Pricing */}
            <div className="border border-gray-200 rounded-lg p-6 space-y-6">
              <CardTitle className="text-xl font-medium text-gray-900">
                Categories & Pricing
              </CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-900">
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
                        className="flex items-center pr-4 justify-center w-full h-12 border-1 border-gray-200 hover:border-gray-900 focus:border-gray-900 focus:ring-gray-900"
                        disabled={false}
                      >
                        <ChevronDown
                          className={`h-4 w-4 mr-2 transition-transform duration-200 ${
                            categoryDropdownOpen ? "rotate-180" : "rotate-0"
                          }`}
                        />
                        {formData.categories.length >= 3
                          ? "Maximum categories selected"
                          : formData.categories.length === 0
                          ? "Select categories..."
                          : `${formData.categories.length} selected`}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="center">
                      <Command>
                        <CommandInput placeholder="Search categories..." />
                        <CommandList>
                          <CommandEmpty>No categories found.</CommandEmpty>
                          <CommandGroup>
                            {formData.categories.length >= 3 && (
                              <div className="p-3 text-sm text-gray-700 bg-gray-100 mb-2">
                                Maximum categories selected (3/3). Unselect one
                                to choose a different category.
                              </div>
                            )}
                            {AVAILABLE_CATEGORIES.map((category) => {
                              const isSelected =
                                formData.categories.includes(category);
                              const isDisabled =
                                formData.categories.length >= 3 && !isSelected;

                              return (
                                <CommandItem
                                  key={category}
                                  value={category}
                                  onSelect={() => {
                                    if (!isDisabled) {
                                      handleCategoryChange(category);
                                    }
                                  }}
                                  className={`flex items-center space-x-2 cursor-pointer ${
                                    isDisabled
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }`}
                                  disabled={isDisabled}
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    disabled={isDisabled}
                                    className="pointer-events-none"
                                  />
                                  <span className="text-sm">{category}</span>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  <p className="text-sm text-gray-500">
                    Selected: {formData.categories.length}/3 categories
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-900">
                  Pricing Model *
                </Label>
                <div className="flex gap-3">
                  {PRICING_OPTIONS.map((pricing) => (
                    <button
                      key={pricing}
                      type="button"
                      onClick={() => handlePricingChange(pricing)}
                      className={`cursor-pointer px-6 py-3 text-sm font-medium rounded-lg border transition-all duration-200 ${
                        formData.pricing === pricing
                          ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pricing}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Media */}
            <div className="border border-gray-200 rounded-lg p-6 space-y-6">
              <CardTitle className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                Media
              </CardTitle>
              <div className="space-y-2">
                <Label
                  htmlFor="logo_upload"
                  className="text-sm font-medium text-gray-900"
                >
                  Logo Upload
                </Label>

                {formData.logo_file || formData.logo_url ? (
                  <div className="space-y-3">
                    {/* Preview with replace functionality */}
                    <div className="relative inline-block group">
                      <input
                        type="file"
                        id="logo_upload"
                        accept="image/*"
                        onChange={handleLogoFileChange}
                        className="hidden"
                      />
                      <img
                        src={formData.logo_url}
                        alt="Logo preview"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200 cursor-pointer transition-opacity group-hover:opacity-75"
                        onClick={() =>
                          document.getElementById("logo_upload").click()
                        }
                      />

                      {/* Replace icon overlay - shown on hover */}
                      <div
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg bg-black bg-opacity-30"
                        onClick={() =>
                          document.getElementById("logo_upload").click()
                        }
                      >
                        <Upload className="w-6 h-6 text-white" />
                      </div>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={removeLogoFile}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      id="logo_upload"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("logo_upload").click()
                      }
                      className="h-32 w-32 flex flex-col items-center gap-2 justify-center border-1 border-dashed border-gray-300 hover:border-gray-900 transition-colors rounded-lg"
                    >
                      <Upload className="w-5 h-5 text-gray-700" />
                      <span className="text-sm text-gray-700">Upload Logo</span>
                    </Button>
                  </div>
                )}

                <p className="text-sm text-gray-500">
                  Square logo recommended (minimum 200x200px, max 5MB)
                  {(formData.logo_file || formData.logo_url) && (
                    <span className="block mt-1 text-xs text-gray-400">
                      Click on the logo to replace it
                    </span>
                  )}
                </p>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-900">
                  Screenshots (up to 5)
                </Label>

                {/* Upload Button */}
                <div className="space-y-3">
                  <input
                    type="file"
                    id="screenshots_upload"
                    accept="image/*"
                    multiple
                    onChange={handleScreenshotFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("screenshots_upload").click()
                    }
                    disabled={
                      formData.screenshot_files.filter((f) => f !== null)
                        .length >= 5
                    }
                    className="h-40 w-full flex flex-col items-center justify-center gap-2 border-1 border-dashed border-gray-300 hover:border-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-5 h-5 text-gray-700" />
                    {formData.screenshot_files.filter((f) => f !== null)
                      .length === 0
                      ? "Upload Screenshots (Select Multiple)"
                      : `Add More Screenshots (${
                          formData.screenshot_files.filter((f) => f !== null)
                            .length
                        }/5)`}
                  </Button>
                </div>

                {/* Screenshots Grid */}
                {formData.screenshot_files.some((f) => f !== null) && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {formData.screenshots.map((screenshot, index) => {
                      if (!formData.screenshot_files[index] && !screenshot)
                        return null;

                      return (
                        <div key={index} className="relative group">
                          <img
                            src={screenshot}
                            alt={`Screenshot ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          />

                          {/* Replace overlay on hover */}
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <input
                              type="file"
                              id={`screenshot_replace_${index}`}
                              accept="image/*"
                              onChange={(e) =>
                                handleSingleScreenshotReplace(index, e)
                              }
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                document
                                  .getElementById(`screenshot_replace_${index}`)
                                  .click()
                              }
                              className="text-white hover:bg-white hover:bg-opacity-20 mr-1"
                            >
                              <Upload className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => removeScreenshotFile(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-colors text-xs z-10"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <p className="text-sm text-gray-500">
                  Upload images of your directory. Desktop and mobile views
                  recommended (max 5MB each).
                  {formData.screenshot_files.some((f) => f !== null) && (
                    <span className="block mt-1 text-xs text-gray-400">
                      Hover over screenshots to replace them
                    </span>
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="video_url"
                  className="text-sm font-medium text-gray-900"
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
            </div>

            {/* Navigation */}
            <div className="flex flex-col justify-between sm:flex-row gap-4 pt-2">
              <Button
                variant="outline"
                onClick={prevStep}
                className="inline-flex items-center text-gray-900 border-0 group"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="transition duration-300 group-hover:-translate-x-1">
                  Back to Launch
                </span>
              </Button>
              <Button
                onClick={nextStep}
                className="px-8 py-3 h-12 flex items-center justify-center font-medium"
              >
                Continue to Launch Week
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Badge Installation (Support Launch Only)
  if (currentStep === 3 && selectedPlan === "support_launch") {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-4xl mx-auto px-4 md:px-0 py-6 md:py-8">
          <ProgressBar />

          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-medium text-gray-900 mb-2">
              Install DirectoryHunt Badge
            </h2>
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-gray-600">Plan:</span>
              <Badge variant="secondary" className="font-medium">
                {getPlanDisplayName(selectedPlan)}
              </Badge>
            </div>
            <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
              To qualify for immediate dofollow links, please install the
              DirectoryHunt badge on your website's homepage. This shows your
              support for the directory community and helps other users discover
              DirectoryHunt.
            </p>
          </div>

          {/* Badge Installation Instructions */}
          <div className="space-y-6">
            <BacklinkBadge />

            {/* Confirmation Form */}
            <div className="border border-gray-200 rounded-lg p-6 space-y-6">
              <CardTitle className="text-lg font-medium text-gray-900">
                Confirm Badge Installation
              </CardTitle>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="backlink_url"
                    className="text-sm font-medium text-gray-900"
                  >
                    Homepage URL *
                  </Label>
                  <Input
                    id="backlink_url"
                    type="url"
                    value={formData.backlink_url}
                    onChange={(e) =>
                      handleInputChange("backlink_url", e.target.value)
                    }
                    placeholder="https://your-directory.com (your homepage URL)"
                    className="h-10 border-gray-200 focus:border-gray-900 focus:ring-gray-900"
                    required
                  />
                  <p className="text-sm text-gray-500">
                    URL of your homepage where you installed the DirectoryHunt
                    badge
                  </p>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="badge-confirmation"
                    checked={badgeInstalled}
                    onCheckedChange={setBadgeInstalled}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor="badge-confirmation"
                      className="text-sm font-medium text-gray-900 cursor-pointer"
                    >
                      I confirm that I have installed the DirectoryHunt badge on
                      my website's homepage
                    </Label>
                    <p className="text-sm text-gray-500">
                      We will verify the badge installation on your homepage
                      before activating your dofollow links.
                    </p>
                  </div>
                </div>
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Important:</strong> The badge must remain on your
                  homepage to maintain dofollow link status. Removing the badge
                  from your homepage will result in links being changed to
                  nofollow.
                </AlertDescription>
              </Alert>
            </div>

            {/* Navigation */}
            <div className="flex flex-col justify-between sm:flex-row gap-4 pt-2">
              <Button
                variant="outline"
                onClick={prevStep}
                className="inline-flex items-center text-gray-900 border-0 group"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="transition duration-300 group-hover:-translate-x-1">
                  Back to Details
                </span>
              </Button>
              <Button
                onClick={nextStep}
                disabled={!badgeInstalled || !formData.backlink_url?.trim()}
                className="px-8 py-3 h-12 flex items-center justify-center font-medium disabled:opacity-50"
              >
                Continue to Launch Week
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3/4: Choose Launch Week
  if (
    (currentStep === 3 && selectedPlan !== "support_launch") ||
    (currentStep === 4 && selectedPlan === "support_launch")
  ) {
    const groupedWeeks = groupWeeksByMonth(availableWeeks);
    const currentYear = new Date().getFullYear();
    const yearOptions = [currentYear, currentYear + 1];

    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-6xl mx-auto px-4 md:px-0 py-6 md:py-8">
          <ProgressBar />

          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-medium text-gray-900 mb-2">
              Choose Launch Week
            </h2>
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-gray-600">Plan:</span>
              <Badge variant="secondary" className="font-medium">
                {getPlanDisplayName(selectedPlan)}
              </Badge>
            </div>
          </div>

          {/* Year Selector */}
          <div className="mb-8">
            <div className="max-w-xs mx-auto">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Select Year
              </Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="h-10 border-gray-200 focus:border-gray-900 focus:ring-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Weeks by Month */}
          <div className="space-y-8">
            {Object.keys(groupedWeeks).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  No available weeks for {selectedYear}
                </p>
              </div>
            ) : (
              Object.entries(groupedWeeks).map(([monthKey, monthData]) => (
                <div key={monthKey} className="space-y-4">
                  <h3 className="text-xl font-medium text-gray-900 border-b border-gray-200 pb-2">
                    {monthData.monthName} {monthData.year}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {monthData.weeks.map((week, index) => {
                      const isDisabled =
                        selectedPlan !== "premium_launch" && week.is_full;
                      const isSelected =
                        formData.launch_week === week.start_date;

                      return (
                        <Card
                          key={index}
                          className={`cursor-pointer transition-all duration-200 border-2 ${
                            isSelected
                              ? "border-gray-900 bg-gray-50 shadow-md"
                              : isDisabled
                              ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                              : "border-gray-200 hover:border-gray-400 hover:shadow-sm"
                          }`}
                          onClick={() => {
                            if (!isDisabled) {
                              handleInputChange("launch_week", week.start_date);
                            }
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              {/* Week Display */}
                              <div className="font-medium text-gray-900">
                                {formatWeekDisplay(week)}
                              </div>

                              {/* Full Date Range */}
                              <div className="text-sm text-gray-600">
                                {new Date(week.start_date).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}{" "}
                                -{" "}
                                {new Date(week.end_date).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </div>

                              {/* Availability Status */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  {selectedPlan === "premium_launch" ? (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                                    >
                                      Premium - No limits
                                    </Badge>
                                  ) : isDisabled ? (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-red-50 text-red-700 border-red-200"
                                    >
                                      Full - 0 slots
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-green-50 text-green-700 border-green-200"
                                    >
                                      {week.available_slots} slots left
                                    </Badge>
                                  )}

                                  {isSelected && (
                                    <Check className="w-4 h-4 text-gray-900" />
                                  )}
                                </div>

                                {/* Detailed slot breakdown for non-premium plans */}
                                {selectedPlan !== "premium_launch" && (
                                  <div className="text-xs text-gray-500 space-y-1">
                                    <div className="flex justify-between">
                                      <span>Standard used:</span>
                                      <span>{week.standard_used}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Support used:</span>
                                      <span>{week.support_used}</span>
                                    </div>
                                    <div className="flex justify-between font-medium text-gray-700 border-t border-gray-200 pt-1">
                                      <span>Total used:</span>
                                      <span>
                                        {week.total_used}/{week.slot_limit}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Alerts */}
          <div className="mt-8 space-y-4">
            {selectedPlan !== "premium_launch" && (
              <Alert className="border-amber-200 bg-amber-50">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>Shared Slot System:</strong> Standard and Support
                  plans share a combined limit of 15 submissions per week. Each
                  week has 15 total slots that are shared between both plan
                  types. Premium plans have unlimited slots.
                </AlertDescription>
              </Alert>
            )}

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
                      <div>• Shares 15 weekly slots with Support plans</div>
                      <div>• Standard launch queue</div>
                    </>
                  )}
                  {selectedPlan === "support_launch" && (
                    <>
                      <div>• Free submission with immediate dofollow links</div>
                      <div>
                        • Requires DirectoryHunt badge installation on homepage
                      </div>
                      <div>• Shares 15 weekly slots with Standard plans</div>
                      <div>• Social media promotion included</div>
                    </>
                  )}
                  {selectedPlan === "premium_launch" && (
                    <>
                      <div>
                        • Paid submission ($15) with guaranteed dofollow links
                      </div>
                      <div>• Skip the queue with immediate publication</div>
                      <div>• Unlimited weekly slots (no sharing)</div>
                      <div>• Premium badge and social media promotion</div>
                    </>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </div>

          {/* Navigation */}
          <div className="flex flex-col justify-between sm:flex-row gap-4 pt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              className="inline-flex items-center text-gray-900 border-0 group"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="transition duration-300 group-hover:-translate-x-1">
                Back to Details
              </span>
            </Button>
            <Button
              onClick={nextStep}
              disabled={!formData.launch_week}
              className="px-8 py-3 h-12 flex items-center justify-center font-medium disabled:opacity-50"
            >
              Review & Confirm
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 4/5: Confirm & Submit
  if (
    (currentStep === 4 && selectedPlan !== "support_launch") ||
    (currentStep === 5 && selectedPlan === "support_launch")
  ) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-4xl mx-auto px-4 md:px-0 py-6 md:py-8">
          <ProgressBar />

          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-medium text-gray-900 mb-2">
              Review & Confirm
            </h2>
            <p className="text-gray-600">
              Please review your submission details before confirming
            </p>
          </div>

          <div className="space-y-6">
            {/* Directory Details */}
            <div className="border border-gray-200 rounded-lg p-6 space-y-6">
              <CardTitle className="text-lg font-medium text-gray-900">
                Directory Details
              </CardTitle>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Name
                  </Label>
                  <p className="text-gray-900">{formData.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Website
                  </Label>
                  <p className="text-gray-900 break-all">
                    {formData.website_url}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Pricing Model
                  </Label>
                  <p className="text-gray-900">{formData.pricing}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Launch Week
                  </Label>
                  <p className="text-gray-900">
                    {formData.launch_week
                      ? `${new Date(
                          formData.launch_week
                        ).toLocaleDateString()} - ${new Date(
                          new Date(formData.launch_week).getTime() +
                            6 * 24 * 60 * 60 * 1000
                        ).toLocaleDateString()}`
                      : "Not selected"}
                  </p>
                </div>
              </div>

              {/* Contact Email */}
              {formData.contact_email && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Contact Email
                  </Label>
                  <p className="text-gray-900">{formData.contact_email}</p>
                </div>
              )}

              {/* Backlink URL (for support launch) */}
              {selectedPlan === "support_launch" && formData.backlink_url && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Backlink Page URL
                  </Label>
                  <p className="text-gray-900 break-all">
                    {formData.backlink_url}
                  </p>
                </div>
              )}

              {/* Categories */}
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Categories
                </Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {formData.categories.map((category) => (
                    <Badge key={category} variant="secondary">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Short Description
                </Label>
                <p className="text-gray-900">{formData.short_description}</p>
              </div>

              {formData.full_description && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Full Description
                  </Label>
                  <div
                    className="text-gray-900 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: formData.full_description,
                    }}
                  />
                </div>
              )}

              {/* Media Section */}
              <div className="border-t border-gray-200 pt-6">
                <Label className="text-lg font-medium text-gray-900 mb-4 block">
                  Media
                </Label>

                {/* Logo */}
                {(formData.logo_file || formData.logo_url) && (
                  <div className="mb-6">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Logo
                    </Label>
                    <img
                      src={formData.logo_url}
                      alt="Directory logo"
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}

                {/* Screenshots */}
                {formData.screenshot_files.some((f) => f !== null) && (
                  <div className="mb-6">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Screenshots (
                      {
                        formData.screenshot_files.filter((f) => f !== null)
                          .length
                      }
                      )
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {formData.screenshots.map((screenshot, index) => {
                        if (!formData.screenshot_files[index] && !screenshot)
                          return null;

                        return (
                          <div key={index} className="relative">
                            <img
                              src={screenshot}
                              alt={`Screenshot ${index + 1}`}
                              className="w-full h-20 object-cover rounded-lg border border-gray-200"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Video URL */}
                {formData.video_url && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Demo Video
                    </Label>
                    <p className="text-gray-900 break-all">
                      {formData.video_url}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep(2)}
                >
                  Edit Details
                </Button>
              </div>
            </div>

            {/* Plan Summary */}
            <div className="border border-gray-200 rounded-lg p-6 space-y-6">
              <CardTitle className="text-lg font-medium text-gray-900">
                Selected Plan
              </CardTitle>
              <div className="flex items-center justify-between">
                <div>
                  <Badge
                    variant="secondary"
                    className="font-medium text-base px-3 py-1"
                  >
                    {getPlanDisplayName(selectedPlan)}
                  </Badge>
                  {paymentCompleted && (
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800 border-green-200 ml-2"
                    >
                      ✓ Payment Complete
                    </Badge>
                  )}
                </div>
                {(selectedPlan === "standard_launch" ||
                  selectedPlan === "support_launch") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep(1)}
                  >
                    Change Plan
                  </Button>
                )}
              </div>
            </div>

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

                  <div className="flex flex-col justify-between sm:flex-row gap-4">
                    <Button
                      variant="outline"
                      onClick={prevStep}
                      className="inline-flex items-center text-gray-900 border-0 group"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      <span className="transition duration-300 group-hover:-translate-x-1">
                        Back to Details
                      </span>
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="px-8 py-3 h-12 flex items-center justify-center font-medium disabled:opacity-50"
                    >
                      {loading
                        ? isEditing
                          ? "Updating..."
                          : "Submitting..."
                        : isEditing
                        ? "Update Directory"
                        : selectedPlan === "premium_launch" && paymentCompleted
                        ? "Submit Directory (Paid)"
                        : selectedPlan === "support_launch"
                        ? "Submit Directory (Backlink Required)"
                        : "Submit Directory (Free)"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Default return (should not reach here)
  return null;
}
