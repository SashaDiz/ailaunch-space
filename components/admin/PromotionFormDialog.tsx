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
import ImageUpload from "@/components/forms/ImageUpload";
import toast from "react-hot-toast";
import { Loader2, Monitor, LayoutGrid, FileText } from "lucide-react";
import { advertisingConfig } from "@/config/advertising.config";

interface PromotionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const placementOptions = [
  {
    key: "placement_banner" as const,
    label: "Top Banner",
    icon: Monitor,
  },
  {
    key: "placement_catalog" as const,
    label: "Catalog",
    icon: LayoutGrid,
  },
  {
    key: "placement_detail_page" as const,
    label: "Detail Page",
    icon: FileText,
  },
];

export function PromotionFormDialog({ open, onOpenChange, onSuccess }: PromotionFormDialogProps) {
  const [form, setForm] = useState({
    name: "",
    short_description: "",
    logo_url: "",
    website_url: "",
    cta_text: "",
    placement_banner: false,
    placement_catalog: false,
    placement_detail_page: false,
  });
  const [saving, setSaving] = useState(false);

  const ctaMaxLength = advertisingConfig.promotions.ctaMaxLength;

  useEffect(() => {
    if (open) {
      setForm({
        name: "",
        short_description: "",
        logo_url: "",
        website_url: "",
        cta_text: "",
        placement_banner: false,
        placement_catalog: false,
        placement_detail_page: false,
      });
    }
  }, [open]);

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const hasAnyPlacement = form.placement_banner || form.placement_catalog || form.placement_detail_page;

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (!form.short_description.trim()) { toast.error("Description is required"); return; }
    if (!form.logo_url.trim()) { toast.error("Logo is required"); return; }
    if (!form.website_url.trim()) { toast.error("Website URL is required"); return; }
    if (!hasAnyPlacement) { toast.error("Select at least one placement"); return; }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Failed to create");
      toast.success("Promotion created");
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Promotion</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Project name"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label>Website URL *</Label>
              <Input
                type="url"
                value={form.website_url}
                onChange={(e) => handleChange("website_url", e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Short Description *</Label>
            <Textarea
              value={form.short_description}
              onChange={(e) => handleChange("short_description", e.target.value)}
              placeholder="A short pitch for your project..."
              rows={2}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">
              {form.short_description.length}/200
            </p>
          </div>

          <div className="space-y-2">
            <Label>Logo *</Label>
            <ImageUpload
              value={form.logo_url}
              onChange={(url) => handleChange("logo_url", url)}
              error={null}
            />
          </div>

          <div className="space-y-2">
            <Label>CTA Button Text</Label>
            <Input
              value={form.cta_text}
              onChange={(e) => {
                if (e.target.value.length <= ctaMaxLength) {
                  handleChange("cta_text", e.target.value);
                }
              }}
              placeholder={`Visit ${form.name || "Project"}`}
              maxLength={ctaMaxLength}
            />
            <p className="text-xs text-muted-foreground text-right">
              {form.cta_text.length}/{ctaMaxLength}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Placements *</Label>
            <div className="flex flex-wrap gap-4 pt-1">
              {placementOptions.map((opt) => {
                const Icon = opt.icon;
                const checked = form[opt.key];
                return (
                  <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      onClick={() => handleChange(opt.key, !checked)}
                      className={`h-4 w-4 shrink-0 rounded-[3px] border flex items-center justify-center transition-colors ${
                        checked
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/40 bg-background"
                      }`}
                    >
                      {checked && (
                        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
