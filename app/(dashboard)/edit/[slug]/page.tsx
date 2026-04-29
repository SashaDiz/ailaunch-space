"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from '@/hooks/use-user';
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import CategorySelector from '@/components/directory/CategorySelector';
import ImageUpload from '@/components/forms/ImageUpload';
import ScreenshotUpload from '@/components/forms/ScreenshotUpload';

function FieldError({ message }) {
  if (!message) return null;

  return (
    <div className="text-destructive text-sm mt-2 flex items-center gap-1">
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      {message}
    </div>
  );
}

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useUser();
  const [project, setProject] = useState(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [groupedCategoryOptions, setGroupedCategoryOptions] = useState({});
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user?.id) {
      router.push("/auth/signin?callbackUrl=/dashboard");
      return;
    }

    if (user?.id && params.slug) {
      loadProject();
    }
  }, [user?.id, loading, params.slug, router]);

  useEffect(() => {
    if (loading) return;
    fetchCategories();
  }, [loading]);


  const loadProject = async () => {
    setIsLoading(true);
    try {
      // First, check if the project belongs to the user
      const userProjectsResponse = await fetch("/api/user?type=projects", {
        method: "GET",
        credentials: "include",
      });

      if (userProjectsResponse.ok) {
        const userProjectsData = await userProjectsResponse.json();
        const userProject = userProjectsData.data.projects.find(
          (project) => project.slug === params.slug
        );

        if (!userProject) {
          toast.error(
            "Project not found or you don't have permission to edit it"
          );
          router.push("/dashboard");
          return;
        }

        // Check if editing is allowed (only before launch starts)
        const isScheduled =
          userProject.statusBadge === "scheduled" ||
          (!userProject.statusBadge && userProject.status === "scheduled");

        if (!isScheduled) {
          toast.error("Projects from current or past launches can't be edited");
          router.push("/dashboard");
          return;
        }

        // Load full project data
        const response = await fetch(`/api/projects/${params.slug}`);
        if (response.ok) {
          const result = await response.json();
          const fullProject = result.data.project;

          setProject(fullProject);
          setFormData({
            name: fullProject.name || "",
            website_url: fullProject.website_url || "",
            short_description: fullProject.short_description || "",
            full_description: fullProject.full_description || "",
            categories: fullProject.categories || [],
            pricing: fullProject.pricing || "",
            logo_url: fullProject.logo_url || "",
            screenshots: fullProject.screenshots || ["", "", "", "", ""],
            backlink_url: fullProject.backlink_url || "",
          });

          toast.success("Project loaded successfully");
        } else {
          throw new Error("Failed to load project details");
        }
      } else {
        throw new Error("Failed to verify project ownership");
      }
    } catch (error) {
      console.error("Error loading project:", error);
      toast.error("Failed to load project for editing");
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };


  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Project name is required";
    }

    if (!formData.website_url?.trim()) {
      newErrors.website_url = "Website URL is required";
    } else {
      try {
        new URL(formData.website_url);
      } catch {
        newErrors.website_url = "Please enter a valid URL";
      }
    }

    if (!formData.short_description?.trim()) {
      newErrors.short_description = "Short title is required";
    } else if (formData.short_description.length < 5) {
      newErrors.short_description =
        "Short title must be at least 5 characters";
    }

    if (!formData.full_description?.trim()) {
      newErrors.full_description = "Full description is required";
    } else if (formData.full_description.length < 50) {
      newErrors.full_description =
        "Full description must be at least 50 characters";
    }

    if (!formData.categories?.length) {
      newErrors.categories = "Please select at least one category";
    }

    if (!formData.pricing) {
      newErrors.pricing = "Please select a pricing model";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!project?.id) {
      toast.error("Project is not loaded. Please refresh and try again.");
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // API expects the internal project ID, not the slug
          projectId: project?.id,
          ...formData,
          screenshots: (formData.screenshots || []).filter(Boolean),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Project updated successfully!");
        router.push("/dashboard");
      } else {
        throw new Error(result.error || "Failed to update project");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null; // Redirecting...
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Project not found</h2>
          <p className="text-muted-foreground mb-4">
            The project you're trying to edit doesn't exist or you don't have
            permission to edit it.
          </p>
          <Link href="/dashboard" className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold transition-all hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)]">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          {project.logo_url && (
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl overflow-hidden border border-border bg-background shadow">
              <Image
                src={project.logo_url}
                alt={`${project.name} logo`}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            Edit Your Project
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Update your project information and settings to keep everything aligned with the submission guidelines.
          </p>
          <div className="mt-4 flex justify-center">
            <Link href="/dashboard" className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl bg-background shadow-xl border border-border"
        >
          <div className="p-6 space-y-10">
            {/* Basic Information */}
            <section className="space-y-6">
              <h2 className="text-lg font-semibold pb-3 border-b-2 border-foreground/20 flex items-center gap-2">
                <div className="w-1 h-6 bg-foreground rounded-full"></div>
                Basic Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="space-y-1 w-full">
                  <div className="label">
                    <span className="text-sm font-semibold">
                      Project Name *
                    </span>
                  </div>
                  <input
                    id="project-name"
                    type="text"
                    className={`flex h-10 rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-ring w-full transition-all duration-200 ${
                      errors.name ? "border-destructive" : "border-border"
                    }`}
                    style={{
                      boxShadow: errors.name
                        ? "0 0 0 2px rgba(248, 113, 113, 0.2)"
                        : "none",
                    }}
                    aria-invalid={Boolean(errors.name)}
                    value={formData.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g. Content Generator"
                  />
                  <FieldError message={errors.name} />
                </label>

                <label className="space-y-1 w-full">
                  <div className="label">
                    <span className="text-sm font-semibold">
                      Website URL *
                    </span>
                  </div>
                  <input
                    id="website-url"
                    type="url"
                    className={`flex h-10 rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-ring w-full transition-all duration-200 ${
                      errors.website_url
                        ? "border-destructive"
                        : "border-border"
                    }`}
                    style={{
                      boxShadow: errors.website_url
                        ? "0 0 0 2px rgba(248, 113, 113, 0.2)"
                        : "none",
                    }}
                    aria-invalid={Boolean(errors.website_url)}
                    value={formData.website_url || ""}
                    onChange={(e) =>
                      handleInputChange("website_url", e.target.value)
                    }
                    placeholder="https://your-project.com"
                  />
                  <FieldError message={errors.website_url} />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="space-y-1 w-full">
                  <div className="label">
                    <span className="text-sm font-semibold">Short Title *</span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {formData.short_description?.length || 0}/100
                    </span>
                  </div>
                  <input
                    id="short-title"
                    type="text"
                    className={`flex h-10 rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-ring w-full transition-all duration-200 ${
                      errors.short_description
                        ? "border-destructive"
                        : "border-border"
                    }`}
                    style={{
                      boxShadow: errors.short_description
                        ? "0 0 0 2px rgba(248, 113, 113, 0.2)"
                        : "none",
                    }}
                    aria-invalid={Boolean(errors.short_description)}
                    value={formData.short_description || ""}
                    onChange={(e) =>
                      handleInputChange("short_description", e.target.value)
                    }
                    placeholder="A catchy one-line title for your project"
                    maxLength={100}
                  />
                  <FieldError message={errors.short_description} />
                </label>

                <label className="space-y-1 w-full">
                  <div className="label">
                    <span className="text-sm font-semibold">
                      Full Description *
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {formData.full_description?.length || 0}/3000
                    </span>
                  </div>
                  <textarea
                    id="full-description"
                    className={`flex min-h-[80px] rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-ring h-32 w-full resize-none transition-all duration-200 ${
                      errors.full_description
                        ? "border-destructive"
                        : "border-border"
                    }`}
                    style={{
                      boxShadow: errors.full_description
                        ? "0 0 0 2px rgba(248, 113, 113, 0.2)"
                        : "none",
                    }}
                    aria-invalid={Boolean(errors.full_description)}
                    value={formData.full_description || ""}
                    onChange={(e) =>
                      handleInputChange("full_description", e.target.value)
                    }
                    placeholder="Provide a detailed description of your project, its features, and what makes it unique..."
                    maxLength={3000}
                  />
                  <FieldError message={errors.full_description} />
                </label>
              </div>
            </section>

            {/* Media & Assets */}
            <section className="space-y-6">
              <h2 className="text-lg font-semibold pb-3 border-b-2 border-foreground/20 flex items-center gap-2">
                <div className="w-1 h-6 bg-foreground rounded-full"></div>
                Media & Assets
              </h2>

              <div className="space-y-6">
                <div className="space-y-1">
                  <ImageUpload
                    value={formData.logo_url || ""}
                    onChange={(url) => handleInputChange("logo_url", url)}
                    error={errors.logo_url}
                    label="Logo"
                    maxSize={1}
                    required={false}
                  />
                </div>
                <ScreenshotUpload
                  value={formData.screenshots || []}
                  onChange={(urls) => handleInputChange("screenshots", urls)}
                  error={errors.screenshots}
                />
              </div>
            </section>

            {/* Categories & Pricing */}
            <section className="space-y-6">
              <h2 className="text-lg font-semibold pb-3 border-b-2 border-foreground/20 flex items-center gap-2">
                <div className="w-1 h-6 bg-foreground rounded-full"></div>
                Categories & Pricing
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
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

                <div className="space-y-1 w-full">
                  <div className="label">
                    <span className="text-sm font-semibold">Pricing Model *</span>
                  </div>
                  <div className="relative inline-flex items-center bg-muted rounded-lg p-1 w-full">
                    <div
                      className="absolute top-1 bottom-1 w-1/3 bg-foreground rounded-md shadow-sm transition-transform duration-200 ease-in-out"
                      style={{
                        transform:
                          formData.pricing === "Free"
                            ? "translateX(0)"
                            : formData.pricing === "Freemium"
                            ? "translateX(100%)"
                            : "translateX(200%)",
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
                            handleInputChange("pricing", e.target.value)
                          }
                          className="sr-only"
                        />
                        <span
                          className={`block py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200 ${
                            formData.pricing === option
                              ? "text-primary-foreground"
                              : "text-foreground/80 hover:text-foreground"
                          }`}
                        >
                          {option}
                        </span>
                      </label>
                    ))}
                  </div>
                  <FieldError message={errors.pricing} />
                </div>
              </div>
            </section>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-border">
              <Link href="/dashboard" className="inline-flex items-center justify-center rounded-lg border-2 border-foreground px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors w-full sm:w-auto">
                Cancel
              </Link>

              <button
                type="submit"
                className="bg-background text-foreground border-2 border-foreground rounded-lg px-6 py-3 font-semibold text-sm no-underline transition duration-300 hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2 w-full sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                )}
                <Save className="w-4 h-4" />
                {isSubmitting ? "Updating..." : "Update Project"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
