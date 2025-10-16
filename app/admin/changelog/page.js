"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "../../hooks/useUser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, EditPencil, Trash, Eye, EyeOff, Star, Calendar } from "iconoir-react";
import toast from "react-hot-toast";

export default function AdminChangelogPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const [changelogEntries, setChangelogEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    version: "",
    description: "",
    content: "",
    type: "feature",
    published: false,
    featured: false,
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/auth/signin?callbackUrl=/admin/changelog");
      return;
    }

    checkAdminAccess();
  }, [user, authLoading, router]);

  const checkAdminAccess = async () => {
    try {
      const response = await fetch("/api/admin");
      if (response.ok) {
        setIsAdmin(true);
        fetchChangelogEntries();
      } else {
        toast.error("Access denied. Admin privileges required.");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Admin check failed:", error);
      toast.error("Access denied. Admin privileges required.");
      router.push("/dashboard");
    }
  };

  const fetchChangelogEntries = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/changelog");
      if (response.ok) {
        const data = await response.json();
        setChangelogEntries(data.data || []);
      } else {
        console.error("Failed to load changelog entries");
        setChangelogEntries([]);
      }
    } catch (error) {
      console.error("Failed to fetch changelog entries:", error);
      setChangelogEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingEntry 
        ? `/api/changelog/${editingEntry.id}`
        : "/api/changelog";
      
      const method = editingEntry ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingEntry ? "Changelog entry updated!" : "Changelog entry created!");
        setShowForm(false);
        setEditingEntry(null);
        setFormData({
          title: "",
          version: "",
          description: "",
          content: "",
          type: "feature",
          published: false,
          featured: false,
        });
        fetchChangelogEntries();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save changelog entry");
      }
    } catch (error) {
      console.error("Error saving changelog entry:", error);
      toast.error("Failed to save changelog entry");
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      version: entry.version || "",
      description: entry.description || "",
      content: entry.content,
      type: entry.type,
      published: entry.published,
      featured: entry.featured,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this changelog entry?")) {
      return;
    }

    try {
      const response = await fetch(`/api/changelog/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Changelog entry deleted!");
        fetchChangelogEntries();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete changelog entry");
      }
    } catch (error) {
      console.error("Error deleting changelog entry:", error);
      toast.error("Failed to delete changelog entry");
    }
  };

  const handleTogglePublished = async (entry) => {
    try {
      const response = await fetch(`/api/changelog/${entry.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...entry,
          published: !entry.published,
          published_at: !entry.published ? new Date().toISOString() : entry.published_at,
        }),
      });

      if (response.ok) {
        toast.success(`Entry ${!entry.published ? 'published' : 'unpublished'}!`);
        fetchChangelogEntries();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update entry");
      }
    } catch (error) {
      console.error("Error updating entry:", error);
      toast.error("Failed to update entry");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeColor = (type) => {
    const colors = {
      feature: "badge-primary",
      bugfix: "badge-error",
      improvement: "badge-info",
      breaking: "badge-warning",
      announcement: "badge-success",
    };
    return colors[type] || "badge-ghost";
  };

  if (authLoading || (user && !isAdmin && loading)) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!user || (!isAdmin && !loading)) {
    return null; // Redirecting or access denied...
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Changelog Management</h1>
              <p className="text-base-content/70">
                Create and manage changelog entries for your platform updates.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-2">
              <Link href="/admin" className="btn btn-ghost btn-sm">
                ← Back to Admin
              </Link>
              <button
                onClick={() => setShowForm(!showForm)}
                className="btn btn-primary btn-sm"
              >
                <Plus className="w-4 h-4" />
                New Entry
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="card bg-base-100 shadow-sm border border-base-300 mb-8">
            <div className="card-body">
              <h2 className="card-title mb-4">
                {editingEntry ? "Edit Changelog Entry" : "Create New Changelog Entry"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Title *</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="input input-bordered"
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Version</span>
                    </label>
                    <input
                      type="text"
                      name="version"
                      value={formData.version}
                      onChange={handleInputChange}
                      className="input input-bordered"
                      placeholder="e.g., 1.2.0"
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Description</span>
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="input input-bordered"
                    placeholder="Brief description of the update"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Type</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="select select-bordered"
                  >
                    <option value="feature">Feature</option>
                    <option value="bugfix">Bug Fix</option>
                    <option value="improvement">Improvement</option>
                    <option value="breaking">Breaking Change</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Content *</span>
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    className="textarea textarea-bordered h-32"
                    placeholder="Detailed description of the changes..."
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <label className="label cursor-pointer">
                    <input
                      type="checkbox"
                      name="published"
                      checked={formData.published}
                      onChange={handleInputChange}
                      className="checkbox checkbox-primary"
                    />
                    <span className="label-text ml-2">Published</span>
                  </label>
                  <label className="label cursor-pointer">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={formData.featured}
                      onChange={handleInputChange}
                      className="checkbox checkbox-secondary"
                    />
                    <span className="label-text ml-2">Featured</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary">
                    {editingEntry ? "Update Entry" : "Create Entry"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingEntry(null);
                      setFormData({
                        title: "",
                        version: "",
                        description: "",
                        content: "",
                        type: "feature",
                        published: false,
                        featured: false,
                      });
                    }}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Changelog Entries List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : changelogEntries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-base-content/60">No changelog entries found.</p>
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary btn-sm mt-4"
              >
                Create First Entry
              </button>
            </div>
          ) : (
            changelogEntries.map((entry) => (
              <div key={entry.id} className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{entry.title}</h3>
                        <span className={`badge ${getTypeColor(entry.type)}`}>
                          {entry.type}
                        </span>
                        {entry.featured && (
                          <span className="badge badge-secondary">
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </span>
                        )}
                        {entry.published ? (
                          <span className="badge badge-success">
                            <Eye className="w-3 h-3 mr-1" />
                            Published
                          </span>
                        ) : (
                          <span className="badge badge-warning">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Draft
                          </span>
                        )}
                      </div>
                      
                      {entry.version && (
                        <p className="text-sm text-base-content/60 mb-2">
                          Version: {entry.version}
                        </p>
                      )}
                      
                      {entry.description && (
                        <p className="text-base-content/70 mb-2">{entry.description}</p>
                      )}
                      
                      <p className="text-sm text-base-content/60 mb-2">
                        {entry.content}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-base-content/50">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Created: {formatDate(entry.created_at)}
                        </span>
                        {entry.published_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Published: {formatDate(entry.published_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="btn btn-ghost btn-sm"
                        title="Edit"
                      >
                        <EditPencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTogglePublished(entry)}
                        className={`btn btn-sm ${
                          entry.published ? "btn-warning" : "btn-success"
                        }`}
                        title={entry.published ? "Unpublish" : "Publish"}
                      >
                        {entry.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="btn btn-error btn-sm"
                        title="Delete"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
