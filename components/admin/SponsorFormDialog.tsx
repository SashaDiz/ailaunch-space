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
import { Loader2 } from "lucide-react";

interface SponsorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SponsorFormDialog({ open, onOpenChange, onSuccess }: SponsorFormDialogProps) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    logo: "",
    website_url: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ name: "", description: "", logo: "", website_url: "" });
    }
  }, [open]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (!form.description.trim()) { toast.error("Description is required"); return; }
    if (!form.logo.trim()) { toast.error("Logo is required"); return; }
    if (!form.website_url.trim()) { toast.error("Website URL is required"); return; }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/sponsors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Failed to create");
      toast.success("Sponsor created");
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
          <DialogTitle>Create Sponsor</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Sponsor name"
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
            <Label>Description *</Label>
            <Textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Short description of the sponsor..."
              rows={2}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">
              {form.description.length}/200
            </p>
          </div>

          <div className="space-y-2">
            <Label>Logo *</Label>
            <ImageUpload
              value={form.logo}
              onChange={(url) => handleChange("logo", url)}
              error={null}
            />
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
