"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import ImageUpload from "@/components/forms/ImageUpload";
import ScreenshotUpload from "@/components/forms/ScreenshotUpload";
import { CategorySelector } from "@/components/directory/CategorySelector";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: any; // null for create, populated for edit
  onSuccess: () => void;
}

export function ProjectFormDialog({ open, onOpenChange, project, onSuccess }: ProjectFormDialogProps) {
  const isEdit = !!project;

  const [form, setForm] = useState({
    name: "",
    slug: "",
    website_url: "",
    short_description: "",
    full_description: "",
    categories: [] as string[],
    pricing: "Free",
    logo_url: "",
    screenshots: [] as string[],
    video_url: "",
    tags: "",
    link_type: "nofollow",
    plan: "standard",
    status: "live",
    featured: false,
    meta_title: "",
    meta_description: "",
    contact_email: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && project) {
      setForm({
        name: project.name || "",
        slug: project.slug || "",
        website_url: project.website_url || "",
        short_description: project.short_description || "",
        full_description: project.full_description || "",
        categories: project.categories || [],
        pricing: project.pricing || "Free",
        logo_url: project.logo_url || "",
        screenshots: project.screenshots || [],
        video_url: project.video_url || "",
        tags: (project.tags || []).join(", "),
        link_type: project.link_type || "nofollow",
        plan: project.plan || "standard",
        status: project.status || "live",
        featured: project.featured || false,
        meta_title: project.meta_title || "",
        meta_description: project.meta_description || "",
        contact_email: project.contact_email || "",
      });
    } else if (open && !project) {
      setForm({
        name: "", slug: "", website_url: "", short_description: "", full_description: "",
        categories: [], pricing: "Free", logo_url: "", screenshots: [], video_url: "",
        tags: "", link_type: "nofollow", plan: "standard", status: "live",
        featured: false, meta_title: "", meta_description: "", contact_email: "",
      });
    }
  }, [open, project]);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Auto-generate slug from name when creating
    if (field === "name" && !isEdit) {
      setForm(prev => ({
        ...prev,
        [field]: value,
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      }));
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.website_url.trim()) {
      toast.error("Name and website URL are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      };

      if (isEdit) {
        const response = await fetch(`/api/admin?type=projects&id=${project.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to update project");
        }
        toast.success("Project updated");
      } else {
        const response = await fetch("/api/admin?action=create-project", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to create project");
        }
        toast.success("Project created");
      }

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>{isEdit ? "Edit Listing" : "Add Listing"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-120px)] px-6 pb-6">
          <div className="space-y-5 pt-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => handleChange("name", e.target.value)} placeholder="Project name" />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={form.slug} onChange={e => handleChange("slug", e.target.value)} placeholder="project-slug" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Website URL *</Label>
              <Input value={form.website_url} onChange={e => handleChange("website_url", e.target.value)} placeholder="https://example.com" />
            </div>

            <div className="space-y-2">
              <Label>Short Description</Label>
              <Input value={form.short_description} onChange={e => handleChange("short_description", e.target.value)} placeholder="Brief description (max 100 chars)" maxLength={100} />
            </div>

            <div className="space-y-2">
              <Label>Full Description</Label>
              <Textarea value={form.full_description} onChange={e => handleChange("full_description", e.target.value)} placeholder="Detailed description..." rows={4} />
            </div>

            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input type="email" value={form.contact_email} onChange={e => handleChange("contact_email", e.target.value)} placeholder="email@example.com" />
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <Label>Categories</Label>
              <CategorySelector
                selectedCategories={form.categories}
                onCategoriesChange={(cats: string[]) => handleChange("categories", cats)}
                maxSelections={3}
              />
            </div>

            {/* Dropdowns row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Pricing</Label>
                <Select value={form.pricing} onValueChange={v => handleChange("pricing", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Free">Free</SelectItem>
                    <SelectItem value="Freemium">Freemium</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={form.plan} onValueChange={v => handleChange("plan", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => handleChange("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Link type + Featured */}
            <div className="grid grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label>Link Type</Label>
                <Select value={form.link_type} onValueChange={v => handleChange("link_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nofollow">Nofollow</SelectItem>
                    <SelectItem value="dofollow">Dofollow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pb-1">
                <Switch checked={form.featured} onCheckedChange={v => handleChange("featured", v)} />
                <Label className="cursor-pointer">Featured</Label>
              </div>
            </div>

            {/* Media */}
            <div className="space-y-2">
              <Label>Logo</Label>
              <ImageUpload
                value={form.logo_url}
                onChange={(url: string) => handleChange("logo_url", url)}
                label="Logo"
                error={null}
              />
            </div>

            <div className="space-y-2">
              <Label>Video URL</Label>
              <Input value={form.video_url} onChange={e => handleChange("video_url", e.target.value)} placeholder="https://youtube.com/..." />
            </div>

            <ScreenshotUpload
              value={form.screenshots}
              onChange={(urls) => handleChange("screenshots", urls)}
            />

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input value={form.tags} onChange={e => handleChange("tags", e.target.value)} placeholder="saas, ai, productivity" />
            </div>

            {/* SEO */}
            <div className="space-y-2">
              <Label>Meta Title</Label>
              <Input value={form.meta_title} onChange={e => handleChange("meta_title", e.target.value)} placeholder="SEO title (max 60 chars)" maxLength={60} />
            </div>
            <div className="space-y-2">
              <Label>Meta Description</Label>
              <Textarea value={form.meta_description} onChange={e => handleChange("meta_description", e.target.value)} placeholder="SEO description (max 160 chars)" maxLength={160} rows={2} />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEdit ? "Save Changes" : "Create Listing"}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
