"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ImageIcon, Type, Loader2, Layout, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ProductCard } from "@/components/directory/ProductCard";
import { DisplaySettingsContext } from "@/components/shared/DisplaySettingsProvider";
import {
  DEFAULT_DISPLAY_SETTINGS,
  DISPLAY_SETTINGS_EVENT,
  normalizeDisplaySettings,
  type DisplaySettings,
  type ElementToggles,
} from "@/lib/display-settings";
import { springSnappy } from "@/lib/motion";

/** Fallback project for the live card preview when the catalog is empty. */
const SAMPLE_PROJECT = {
  id: "preview",
  name: "Aurora Labs",
  slug: "aurora-labs",
  website_url: "https://example.com",
  logo_url: "",
  short_description:
    "An AI workspace that turns scattered notes into shippable plans.",
  full_description: "",
  categories: ["Productivity", "AI"],
  pricing: "Freemium",
  plan: "premium",
  views: 1280,
  screenshots: [
    "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=900&q=70",
  ],
  link_type: "dofollow",
  average_rating: 0,
  ratings_count: 0,
} as const;

type Surface = "card" | "detail";

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background px-4 py-3 cursor-pointer transition-colors hover:border-foreground/20">
      <span className="flex items-start gap-3 min-w-0">
        <span className="mt-0.5 text-muted-foreground">{icon}</span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-foreground">
            {label}
          </span>
          <span className="block text-xs text-muted-foreground">
            {description}
          </span>
        </span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function SurfaceCard({
  title,
  subtitle,
  icon,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  value: ElementToggles;
  onChange: (next: ElementToggles) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-foreground">{icon}</span>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-2.5">
        <ToggleRow
          icon={<Type className="w-4 h-4" />}
          label="Logo"
          description="Show the project logo."
          checked={value.showLogo}
          onChange={(showLogo) => onChange({ ...value, showLogo })}
        />
        <ToggleRow
          icon={<ImageIcon className="w-4 h-4" />}
          label="Image"
          description="Show a cover image (the project's first screenshot)."
          checked={value.showImage}
          onChange={(showImage) => onChange({ ...value, showImage })}
        />
      </div>
    </div>
  );
}

export function DisplaySettingsEditor({ sampleProject }: { sampleProject?: any }) {
  const previewProject = sampleProject ?? SAMPLE_PROJECT;
  const [settings, setSettings] = useState<DisplaySettings>(
    DEFAULT_DISPLAY_SETTINGS
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/layout")
      .then((r) => r.json())
      .then((data) => setSettings(normalizeDisplaySettings(data)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateSurface = (surface: Surface, next: ElementToggles) =>
    setSettings((prev) => ({ ...prev, [surface]: next }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save");
      }
      const saved = normalizeDisplaySettings(await res.json());
      setSettings(saved);
      // Re-apply live across the app (cards, detail, submit form).
      window.dispatchEvent(
        new CustomEvent(DISPLAY_SETTINGS_EVENT, { detail: saved })
      );
      toast.success("Layout settings saved");
    } catch (e: any) {
      toast.error(e.message || "Failed to save layout settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-6">
      {/* Controls */}
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground max-w-prose">
          Choose which elements appear across the site. Submitters are only asked
          to upload the media you enable here.
        </p>

        <SurfaceCard
          title="Catalog cards"
          subtitle="How listings appear in the directory grid."
          icon={<Layout className="w-4 h-4" />}
          value={settings.card}
          onChange={(next) => updateSurface("card", next)}
        />

        <SurfaceCard
          title="Item page"
          subtitle="The individual project detail page."
          icon={<FileText className="w-4 h-4" />}
          value={settings.detail}
          onChange={(next) => updateSurface("detail", next)}
        />

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save changes
          </Button>
        </div>
      </div>

      {/* Live preview */}
      <div className="lg:sticky lg:top-6 self-start">
        <div className="rounded-xl border border-border bg-muted/30 p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Card preview
            </span>
            <span className="text-[11px] text-muted-foreground">
              {settings.card.showImage ? "Image layout" : "Compact layout"}
            </span>
          </div>
          <motion.div
            key={`${settings.card.showLogo}-${settings.card.showImage}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springSnappy}
            className="mx-auto max-w-[340px]"
          >
            {/* Local override so the preview reflects unsaved toggles.
                The catalog always renders the grid variant, so the preview
                uses viewMode="grid" to match the live site exactly. */}
            <DisplaySettingsContext.Provider value={settings}>
              <ProductCard
                project={previewProject as any}
                viewMode="grid"
                inactiveCta
              />
            </DisplaySettingsContext.Provider>
          </motion.div>
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            The item page mirrors these element choices independently.
          </p>
        </div>
      </div>
    </div>
  );
}
