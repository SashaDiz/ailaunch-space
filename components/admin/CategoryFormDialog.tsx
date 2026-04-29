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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: any;
  spheres: string[];
  defaultSphere?: string;
  onSuccess: () => void;
}

export function CategoryFormDialog({ open, onOpenChange, category, spheres, defaultSphere, onSuccess }: CategoryFormDialogProps) {
  const isEdit = !!category;

  const [form, setForm] = useState({
    name: "",
    slug: "",
    sphere: "",
    description: "",
    color: "#6366f1",
    icon: "",
    sort_order: 999,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && category) {
      setForm({
        name: category.name || "",
        slug: category.slug || "",
        sphere: category.sphere || "",
        description: category.description || "",
        color: category.color || "#6366f1",
        icon: category.icon || "",
        sort_order: category.sort_order ?? 999,
      });
    } else if (open) {
      setForm({
        name: "",
        slug: "",
        sphere: defaultSphere || "",
        description: "",
        color: "#6366f1",
        icon: "",
        sort_order: 999,
      });
    }
  }, [open, category, spheres, defaultSphere]);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === "name" && !isEdit) {
      setForm(prev => ({
        ...prev, [field]: value,
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      }));
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.sphere) {
      toast.error("Sphere is required");
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        const response = await fetch(`/api/admin/categories?id=${category.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!response.ok) throw new Error((await response.json()).error || "Failed to update");
        toast.success("Category updated");
      } else {
        const response = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!response.ok) throw new Error((await response.json()).error || "Failed to create");
        toast.success("Category created");
      }

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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Category" : "Add Category"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => handleChange("name", e.target.value)} placeholder="Category name" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={e => handleChange("slug", e.target.value)} placeholder="category-slug" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sphere (Group) *</Label>
            <Select value={form.sphere} onValueChange={v => handleChange("sphere", v)}>
              <SelectTrigger><SelectValue placeholder="Select sphere..." /></SelectTrigger>
              <SelectContent>
                {spheres.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => handleChange("description", e.target.value)} placeholder="Category description" rows={2} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 items-center">
                <input type="color" value={form.color} onChange={e => handleChange("color", e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                <Input value={form.color} onChange={e => handleChange("color", e.target.value)} className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <Input value={form.icon} onChange={e => handleChange("icon", e.target.value)} placeholder="emoji or name" />
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input type="number" value={form.sort_order} onChange={e => handleChange("sort_order", parseInt(e.target.value) || 0)} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? "Save" : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
