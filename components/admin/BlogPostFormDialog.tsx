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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ImageUpload from "@/components/forms/ImageUpload";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

interface BlogPostFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post?: any; // edit mode when present
  onSuccess: () => void;
}

const EMPTY = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  featured_image: "",
  category: "",
  tags: "", // comma-separated in the UI
  status: "draft" as "draft" | "scheduled" | "published",
  published_at: "", // ISO string
  meta_keywords: "",
};

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** ISO → value for <input type="datetime-local"> (local time, no seconds). */
function isoToLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/** datetime-local value → ISO string. */
function localInputToIso(local: string): string {
  if (!local) return "";
  const d = new Date(local);
  return isNaN(d.getTime()) ? "" : d.toISOString();
}

export function BlogPostFormDialog({
  open,
  onOpenChange,
  post,
  onSuccess,
}: BlogPostFormDialogProps) {
  const isEdit = !!post;
  const [tab, setTab] = useState("content");
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTab("content");
    if (post) {
      setForm({
        title: post.title || "",
        slug: post.slug || "",
        excerpt: post.excerpt || "",
        content: post.content || "",
        featured_image: post.featured_image || "",
        category: post.category || "",
        tags: Array.isArray(post.tags) ? post.tags.join(", ") : "",
        status: post.status || "draft",
        published_at: post.published_at || "",
        meta_keywords: post.meta_keywords || "",
      });
    } else {
      setForm({ ...EMPTY });
    }
  }, [open, post]);

  const handleChange = (field: string, value: any) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-fill slug from title on create until the user edits the slug.
      if (field === "title" && !isEdit && (!prev.slug || prev.slug === slugify(prev.title))) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      setTab("content");
      return;
    }
    if (form.status === "scheduled" && !form.published_at) {
      toast.error("Pick a publish date for scheduled posts");
      setTab("settings");
      return;
    }

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      excerpt: form.excerpt.trim(),
      content: form.content,
      featured_image: form.featured_image,
      category: form.category.trim(),
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      status: form.status,
      published_at: form.published_at || undefined,
      meta_keywords: form.meta_keywords.trim(),
    };

    setSaving(true);
    try {
      const url = isEdit ? `/api/admin/blog?id=${post.id}` : "/api/admin/blog";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save post");
      toast.success(isEdit ? "Post updated" : "Post created");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Post" : "New Post"}</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="pt-2">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* ── Content ───────────────────────────────────────────────────── */}
          <TabsContent value="content" className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Post title"
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <RichTextEditor
                value={form.content}
                onChange={(html) => handleChange("content", html)}
                placeholder="Write your post…"
              />
            </div>
          </TabsContent>

          {/* ── Settings ──────────────────────────────────────────────────── */}
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => handleChange("slug", slugify(e.target.value))}
                placeholder="post-slug"
              />
            </div>

            <div className="space-y-2">
              <Label>Excerpt</Label>
              <Textarea
                value={form.excerpt}
                onChange={(e) => handleChange("excerpt", e.target.value)}
                placeholder="Short summary shown on cards and meta description"
                rows={2}
                maxLength={300}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={form.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  placeholder="e.g. Guides"
                />
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <Input
                  value={form.tags}
                  onChange={(e) => handleChange("tags", e.target.value)}
                  placeholder="comma, separated, tags"
                />
              </div>
            </div>

            <ImageUpload
              value={form.featured_image}
              onChange={(url) => handleChange("featured_image", url)}
              error={null}
              label="Featured Image"
              maxSize={4}
              formatHint="JPEG, PNG, or WebP · up to 4MB"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => handleChange("status", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  Publish date {form.status === "scheduled" && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  type="datetime-local"
                  value={isoToLocalInput(form.published_at)}
                  onChange={(e) =>
                    handleChange("published_at", localInputToIso(e.target.value))
                  }
                  disabled={form.status === "draft"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Meta keywords</Label>
              <Input
                value={form.meta_keywords}
                onChange={(e) => handleChange("meta_keywords", e.target.value)}
                placeholder="seo, keywords, comma separated"
                maxLength={300}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save" : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BlogPostFormDialog;
