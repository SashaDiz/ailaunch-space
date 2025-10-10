"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "../../hooks/useUser";
import Link from "next/link";
import Image from "next/image";
import { NavArrowLeft, FloppyDisk, Xmark } from "iconoir-react";
import toast from "react-hot-toast";

export default function EditDirectoryPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useUser();
  const [directory, setDirectory] = useState(null);
  const [formData, setFormData] = useState({});
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/auth/signin?callbackUrl=/dashboard");
      return;
    }

    if (user && params.id) {
      loadDirectory();
      fetchCategories();
    }
  }, [user, loading, params.id, router]);

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

  const loadDirectory = async () => {
    setIsLoading(true);
    try {
      // First, check if the directory belongs to the user
      const userDirsResponse = await fetch("/api/user?type=directories", {
        method: "GET",
        credentials: "include",
      });

      if (userDirsResponse.ok) {
        const userDirsData = await userDirsResponse.json();
        const userDirectory = userDirsData.data.directories.find(
          (dir) => dir.id === params.id
        );

        if (!userDirectory) {
          toast.error(
            "Directory not found or you don't have permission to edit it"
          );
          router.push("/dashboard");
          return;
        }

        // Check if editing is allowed
        if (userDirectory.status !== "scheduled") {
          toast.error("Editing is only allowed for scheduled directories");
          router.push("/dashboard");
          return;
        }

        // Load full directory data
        const response = await fetch(`/api/directories/${params.id}`);
        if (response.ok) {
          const result = await response.json();
          const fullDirectory = result.data.directory;

          setDirectory(fullDirectory);
          setFormData({
            name: fullDirectory.name || "",
            website_url: fullDirectory.website_url || "",
            short_description: fullDirectory.short_description || "",
            full_description: fullDirectory.full_description || "",
            categories: fullDirectory.categories || [],
            pricing: fullDirectory.pricing || "",
            logo_url: fullDirectory.logo_url || "",
            screenshots: fullDirectory.screenshots || ["", "", "", "", ""],
            video_url: fullDirectory.video_url || "",
            contact_email: fullDirectory.contact_email || "",
            backlink_url: fullDirectory.backlink_url || "",
          });

          console.log("AI project loaded for editing:", fullDirectory);
          toast.success("AI project loaded successfully");
        } else {
          throw new Error("Failed to load directory details");
        }
      } else {
        throw new Error("Failed to verify directory ownership");
      }
    } catch (error) {
      console.error("Error loading AI project:", error);
      toast.error("Failed to load AI project for editing");
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
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

  const handleCategoryChange = (category) => {
    setFormData((prev) => {
      const currentCategories = prev.categories || [];
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
      return prev;
    });
  };

  const removeCategory = (categoryToRemove) => {
    setFormData((prev) => ({
      ...prev,
      categories: (prev.categories || []).filter((c) => c !== categoryToRemove),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Directory name is required";
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
      newErrors.short_description = "Short description is required";
    } else if (formData.short_description.length < 10) {
      newErrors.short_description =
        "Short description must be at least 10 characters";
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

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/directories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directoryId: params.id,
          ...formData,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("AI project updated successfully!");
        router.push("/dashboard");
      } else {
        throw new Error(result.error || "Failed to update AI project");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update AI project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 text-base-content/70">Loading directory...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirecting...
  }

  if (!directory) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Directory not found</h2>
          <p className="text-base-content/70 mb-4">
            The directory you're trying to edit doesn't exist or you don't have
            permission to edit it.
          </p>
          <Link href="/dashboard" className="btn btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link href="/dashboard" className="btn btn-ghost btn-sm mr-4">
              <NavArrowLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Link>
          </div>
          <div className="flex items-center space-x-4 mb-4">
            {directory.logo_url && (
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200">
                <Image
                  src={directory.logo_url}
                  alt={`${directory.name} logo`}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">Edit AI Project</h1>
              <p className="text-base-content/70">
                Update your AI project information and settings
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <h2 className="card-title mb-6">Basic Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Directory Name *</span>
                  </label>
                  <input
                    type="text"
                    className={`input input-bordered ${
                      errors.name ? "input-error" : ""
                    }`}
                    value={formData.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g. AI Tools Directory"
                  />
                  {errors.name && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.name}
                      </span>
                    </label>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Website URL *</span>
                  </label>
                  <input
                    type="url"
                    className={`input input-bordered ${
                      errors.website_url ? "input-error" : ""
                    }`}
                    value={formData.website_url || ""}
                    onChange={(e) =>
                      handleInputChange("website_url", e.target.value)
                    }
                    placeholder="https://your-directory.com"
                  />
                  {errors.website_url && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.website_url}
                      </span>
                    </label>
                  )}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Short Description *</span>
                  <span className="label-text-alt">
                    {formData.short_description?.length || 0}/200
                  </span>
                </label>
                <input
                  type="text"
                  className={`input input-bordered ${
                    errors.short_description ? "input-error" : ""
                  }`}
                  value={formData.short_description || ""}
                  onChange={(e) =>
                    handleInputChange("short_description", e.target.value)
                  }
                  placeholder="Brief description of your AI project"
                  maxLength={200}
                />
                {errors.short_description && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.short_description}
                    </span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Full Description *</span>
                  <span className="label-text-alt">
                    {formData.full_description?.length || 0}/3000
                  </span>
                </label>
                <textarea
                  className={`textarea textarea-bordered h-32 ${
                    errors.full_description ? "textarea-error" : ""
                  }`}
                  value={formData.full_description || ""}
                  onChange={(e) =>
                    handleInputChange("full_description", e.target.value)
                  }
                  placeholder="Detailed description of your AI project, its features, and what makes it unique..."
                  maxLength={3000}
                />
                {errors.full_description && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {errors.full_description}
                    </span>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Categories & Pricing */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <h2 className="card-title mb-6">Categories & Pricing</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">
                      Categories * (Select up to 3)
                    </span>
                  </label>

                  {/* Selected Categories */}
                  {formData.categories?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {formData.categories.map((category) => (
                        <span
                          key={category}
                          className="badge badge-primary gap-2"
                        >
                          {category}
                          <button
                            type="button"
                            className="text-primary-content hover:bg-primary-focus rounded-full"
                            onClick={() => removeCategory(category)}
                          >
                            <Xmark className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Available Categories */}
                  <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((category) => (
                        <label
                          key={category.id || category.name}
                          className="label cursor-pointer justify-start"
                        >
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm mr-2"
                            checked={
                              formData.categories?.includes(category.name) ||
                              false
                            }
                            onChange={() => handleCategoryChange(category.name)}
                            disabled={
                              !formData.categories?.includes(category.name) &&
                              formData.categories?.length >= 3
                            }
                          />
                          <span className="label-text text-sm">
                            {category.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {errors.categories && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.categories}
                      </span>
                    </label>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Pricing Model *</span>
                  </label>
                  <div className="space-y-2">
                    {["Free", "Freemium", "Paid"].map((option) => (
                      <label
                        key={option}
                        className="label cursor-pointer justify-start"
                      >
                        <input
                          type="radio"
                          name="pricing"
                          className="radio radio-primary mr-3"
                          value={option}
                          checked={formData.pricing === option}
                          onChange={(e) =>
                            handleInputChange("pricing", e.target.value)
                          }
                        />
                        <span className="label-text">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.pricing && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.pricing}
                      </span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <h2 className="card-title mb-6">Contact Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Contact Email</span>
                  </label>
                  <input
                    type="email"
                    className="input input-bordered"
                    value={formData.contact_email || ""}
                    onChange={(e) =>
                      handleInputChange("contact_email", e.target.value)
                    }
                    placeholder="contact@your-directory.com"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Video URL (optional)</span>
                  </label>
                  <input
                    type="url"
                    className="input input-bordered"
                    value={formData.video_url || ""}
                    onChange={(e) =>
                      handleInputChange("video_url", e.target.value)
                    }
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-base-300">
            <Link href="/dashboard" className="btn btn-ghost">
              Cancel
            </Link>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <span className="loading loading-spinner loading-sm mr-2"></span>
              )}
              <FloppyDisk className="w-4 h-4 mr-2" />
              {isSubmitting ? "Updating..." : "Update AI Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
