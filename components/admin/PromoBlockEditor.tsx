"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PROMO_BLOCK_ICON_NAMES,
  PROMO_BLOCK_ICON_NONE,
  getPromoBlockIcon,
} from "@/lib/promo-block-icons";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import ImageUpload from "@/components/forms/ImageUpload";
import type { PromoBlockConfig } from "@/types/config";
import { DEFAULT_PROMO_BLOCK_CONFIG } from "@/config/promo-block.config";

export function PromoBlockEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<PromoBlockConfig>(
    DEFAULT_PROMO_BLOCK_CONFIG
  );
  const [newBenefit, setNewBenefit] = useState("");

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/promo-block");
      if (res.ok) {
        const data = await res.json();
        setConfig({ ...DEFAULT_PROMO_BLOCK_CONFIG, ...data });
      }
    } catch {
      // keep defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const updateField = <K extends keyof PromoBlockConfig>(
    field: K,
    value: PromoBlockConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const addBenefit = () => {
    const text = newBenefit.trim();
    if (!text) return;
    updateField("benefits", [...config.benefits, text]);
    setNewBenefit("");
  };

  const removeBenefit = (index: number) => {
    updateField(
      "benefits",
      config.benefits.filter((_, i) => i !== index)
    );
  };

  const moveBenefit = (index: number, direction: "up" | "down") => {
    const arr = [...config.benefits];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    updateField("benefits", arr);
  };

  const handleSave = async () => {
    if (!config.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!config.ctaUrl.trim()) {
      toast.error("Checkout URL is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/settings/promo-block", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }
      toast.success("Auto-submit banner settings saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_PROMO_BLOCK_CONFIG);
    toast.success("Reset to defaults (unsaved)");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enable/Disable */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Promo Block
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Shows on homepage (popup), user dashboard (inline), and after
                project submission.
              </p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => updateField("enabled", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* General Content */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-base font-semibold text-foreground">
            General Content
          </h3>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={config.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Submit your product to 100+ directories..."
            />
          </div>

          <div className="space-y-2">
            <Label>Image (optional)</Label>
            <p className="text-sm text-muted-foreground">
              Shown above the title in the popup modal. Leave empty to hide it.
            </p>
            <ImageUpload
              value={config.imageUrl}
              onChange={(url) => updateField("imageUrl", url)}
              error={null}
              label="Banner image"
              maxSize={2}
              formatHint="PNG, JPG or WebP up to 2MB"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={config.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Boost your Domain Rating..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (display)</Label>
              <Input
                id="price"
                value={config.price}
                onChange={(e) => updateField("price", e.target.value)}
                placeholder="$499"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaUrl">Checkout URL</Label>
              <Input
                id="ctaUrl"
                value={config.ctaUrl}
                onChange={(e) => updateField("ctaUrl", e.target.value)}
                placeholder="https://your-link.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="learnMoreUrl">Learn More URL</Label>
              <Input
                id="learnMoreUrl"
                value={config.learnMoreUrl}
                onChange={(e) => updateField("learnMoreUrl", e.target.value)}
                placeholder="https://your-site.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="learnMoreText">Learn More Text</Label>
              <Input
                id="learnMoreText"
                value={config.learnMoreText}
                onChange={(e) => updateField("learnMoreText", e.target.value)}
                placeholder="Learn more"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trigger Button (homepage hero) */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-base font-semibold text-foreground">
            Trigger Button
          </h3>
          <p className="text-sm text-muted-foreground">
            The button on the homepage hero that opens this banner.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="triggerButtonText">Button Text</Label>
              <Input
                id="triggerButtonText"
                value={config.triggerButtonText}
                onChange={(e) => updateField("triggerButtonText", e.target.value)}
                placeholder="Promo Block"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="triggerButtonIcon">Button Icon</Label>
              <Select
                value={config.triggerButtonIcon || "Bot"}
                onValueChange={(v) => updateField("triggerButtonIcon", v)}
              >
                <SelectTrigger id="triggerButtonIcon">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PROMO_BLOCK_ICON_NONE}>
                    <span className="text-muted-foreground">No icon</span>
                  </SelectItem>
                  {PROMO_BLOCK_ICON_NAMES.map((name) => {
                    const Icon = getPromoBlockIcon(name);
                    return (
                      <SelectItem key={name} value={name}>
                        <span className="flex items-center gap-2">
                          {Icon && <Icon className="h-4 w-4" />}
                          {name}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Live preview of the trigger button */}
          <div className="pt-1">
            <span className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-[var(--radius)] font-semibold text-sm uppercase">
              {(() => {
                const Icon = getPromoBlockIcon(config.triggerButtonIcon);
                return Icon ? <Icon className="h-4 w-4" /> : null;
              })()}
              {config.triggerButtonText || "Promo Block"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-base font-semibold text-foreground">Benefits</h3>
          <p className="text-sm text-muted-foreground">
            Bullet points shown in the popup modal.
          </p>

          <div className="space-y-2">
            {config.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  value={benefit}
                  onChange={(e) => {
                    const updated = [...config.benefits];
                    updated[index] = e.target.value;
                    updateField("benefits", updated);
                  }}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => moveBenefit(index, "up")}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => moveBenefit(index, "down")}
                  disabled={index === config.benefits.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0 text-destructive hover:text-destructive"
                  onClick={() => removeBenefit(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={newBenefit}
              onChange={(e) => setNewBenefit(e.target.value)}
              placeholder="Add a new benefit..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addBenefit();
                }
              }}
            />
            <Button variant="outline" onClick={addBenefit} disabled={!newBenefit.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CTA Texts */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-base font-semibold text-foreground">
            Call-to-Action Texts
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ctaText">Modal CTA Button</Label>
              <Input
                id="ctaText"
                value={config.ctaText}
                onChange={(e) => updateField("ctaText", e.target.value)}
                placeholder="Get started"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dismissText">Modal Dismiss Text</Label>
              <Input
                id="dismissText"
                value={config.dismissText}
                onChange={(e) => updateField("dismissText", e.target.value)}
                placeholder="No, I'll do it myself."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ctaButtonIcon">Modal CTA Icon</Label>
            <Select
              value={config.ctaButtonIcon || "Bot"}
              onValueChange={(v) => updateField("ctaButtonIcon", v)}
            >
              <SelectTrigger id="ctaButtonIcon">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PROMO_BLOCK_ICON_NONE}>
                  <span className="text-muted-foreground">No icon</span>
                </SelectItem>
                {PROMO_BLOCK_ICON_NAMES.map((name) => {
                  const Icon = getPromoBlockIcon(name);
                  return (
                    <SelectItem key={name} value={name}>
                      <span className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4" />}
                        {name}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dashboardCtaText">Dashboard Banner CTA</Label>
            <Input
              id="dashboardCtaText"
              value={config.dashboardCtaText}
              onChange={(e) => updateField("dashboardCtaText", e.target.value)}
              placeholder="Submit to 100+ directories"
            />
          </div>
        </CardContent>
      </Card>

      {/* Project Detail Modal */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-base font-semibold text-foreground">
            Post-Submission Modal
          </h3>
          <p className="text-sm text-muted-foreground">
            Shown after a user submits a project (upsell section).
          </p>

          <div className="space-y-2">
            <Label htmlFor="projectDetailHeading">Heading</Label>
            <Input
              id="projectDetailHeading"
              value={config.projectDetailHeading}
              onChange={(e) =>
                updateField("projectDetailHeading", e.target.value)
              }
              placeholder="Max out your visibility with Promo Block"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectDetailDescription">Description</Label>
            <Textarea
              id="projectDetailDescription"
              value={config.projectDetailDescription}
              onChange={(e) =>
                updateField("projectDetailDescription", e.target.value)
              }
              placeholder="Submit your project to 100+ hand-picked directories..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectDetailCtaText">CTA Button</Label>
              <Input
                id="projectDetailCtaText"
                value={config.projectDetailCtaText}
                onChange={(e) =>
                  updateField("projectDetailCtaText", e.target.value)
                }
                placeholder="Auto-submit to 100+ directories"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectDetailDismissText">Dismiss Text</Label>
              <Input
                id="projectDetailDismissText"
                value={config.projectDetailDismissText}
                onChange={(e) =>
                  updateField("projectDetailDismissText", e.target.value)
                }
                placeholder="No thanks"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-base font-semibold text-foreground">Preview</h3>
          <p className="text-sm text-muted-foreground">
            Approximate preview of the popup modal content.
          </p>

          <div className="border border-border rounded-[var(--radius)] overflow-hidden bg-card max-w-md">
            {config.imageUrl && (
              <img
                src={config.imageUrl}
                alt=""
                className="w-full h-auto object-cover"
              />
            )}
            <div className="p-6">
              <h4 className="text-lg font-bold text-foreground mb-2">
                {config.title || "Title"}
              </h4>
              <p className="text-sm text-foreground mb-3">
                {config.description || "Description"}
              </p>
              <a
                href={config.learnMoreUrl || "#"}
                className="text-sm text-muted-foreground underline mb-4 block"
                target="_blank"
                rel="noopener noreferrer"
              >
                {config.learnMoreText || "Learn more"}
              </a>
              {config.benefits.length > 0 && (
                <ul className="space-y-1.5 mb-4">
                  {config.benefits.map((b, i) => (
                    <li key={i} className="flex items-start text-sm">
                      <CheckCircle2 className="h-4 w-4 text-foreground mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{b}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-col gap-2 items-center">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-[var(--radius)] font-semibold text-sm uppercase">
                  {(() => {
                    const Icon = getPromoBlockIcon(config.ctaButtonIcon);
                    return Icon ? <Icon className="h-4 w-4" /> : null;
                  })()}
                  {config.ctaText || "CTA"}
                </span>
                <span className="text-sm text-muted-foreground underline">
                  {config.dismissText || "Dismiss"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
        <Button variant="outline" onClick={handleReset} disabled={saving}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}
