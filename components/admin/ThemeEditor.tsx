"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { colorThemes, type FullThemeConfig } from "@/config/themes.config";
import { hslStringToHex, hexToHslString } from "@/lib/theme-utils";
import type { SiteTheme } from "@/components/shared/SiteThemeProvider";
import { Check, ChevronDown, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";


function getPresetTheme(presetId: string): FullThemeConfig {
  const preset = colorThemes.find((t) => t.id === presetId);
  if (!preset || presetId === "default")
    return { light: {}, dark: {} };
  return {
    light: { ...preset.light },
    dark: { ...preset.dark },
  };
}

function themeEquals(a: FullThemeConfig, b: FullThemeConfig): boolean {
  const keysLight = new Set([...Object.keys(a.light), ...Object.keys(b.light)]);
  const keysDark = new Set([...Object.keys(a.dark), ...Object.keys(b.dark)]);
  for (const k of keysLight) {
    if (a.light[k] !== b.light[k]) return false;
  }
  for (const k of keysDark) {
    if (a.dark[k] !== b.dark[k]) return false;
  }
  return true;
}

const COLOR_GROUPS: { label: string; keys: readonly string[] }[] = [
  { label: "Primary", keys: ["primary", "primary-foreground"] },
  { label: "Secondary", keys: ["secondary", "secondary-foreground"] },
  { label: "Background & Foreground", keys: ["background", "foreground"] },
  { label: "Card", keys: ["card", "card-foreground"] },
  { label: "Popover", keys: ["popover", "popover-foreground"] },
  { label: "Muted", keys: ["muted", "muted-foreground"] },
  { label: "Accent", keys: ["accent", "accent-foreground"] },
  { label: "Destructive", keys: ["destructive", "destructive-foreground"] },
  { label: "Border & Input", keys: ["border", "input", "ring"] },
  { label: "Charts", keys: ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"] },
  { label: "Sidebar", keys: ["sidebar", "sidebar-foreground", "sidebar-primary", "sidebar-primary-foreground", "sidebar-accent", "sidebar-accent-foreground", "sidebar-border", "sidebar-ring"] },
];

export function ThemeEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [siteTheme, setSiteTheme] = useState<SiteTheme | null>(null);
  const [presetId, setPresetId] = useState("default");
  const [theme, setTheme] = useState<FullThemeConfig>({ light: {}, dark: {} });
  const [presetDropdownOpen, setPresetDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("colors");
  const presetDropdownRef = useRef<HTMLDivElement>(null);

  const loadTheme = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/theme");
      const data = await res.json();
      setSiteTheme({
        activeThemeId: data.activeThemeId ?? "default",
        customTheme: data.customTheme,
      });
      const id = data.activeThemeId ?? "default";
      setPresetId(id);
      if (data.customTheme) {
        setTheme(data.customTheme);
      } else {
        setTheme(getPresetTheme(id));
      }
    } catch (e) {
      toast.error("Failed to load theme");
      setTheme({ light: {}, dark: {} });
      setPresetId("default");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (presetDropdownRef.current && !presetDropdownRef.current.contains(e.target as Node)) {
        setPresetDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const setVar = useCallback(
    (mode: "light" | "dark", key: string, value: string) => {
      const cssKey = key.startsWith("--") ? key : `--${key}`;
      setTheme((prev) => ({
        ...prev,
        [mode]: { ...prev[mode], [cssKey]: value },
      }));
    },
    []
  );

  const getVar = (mode: "light" | "dark", key: string): string => {
    const cssKey = key.startsWith("--") ? key : `--${key}`;
    return theme[mode][cssKey] ?? "";
  };

  const handlePresetChange = (newPresetId: string) => {
    setPresetId(newPresetId);
    setTheme(getPresetTheme(newPresetId));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const presetTheme = getPresetTheme(presetId);
      const hasOverrides = !themeEquals(theme, presetTheme);
      const res = await fetch("/api/admin/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeThemeId: presetId,
          customTheme: hasOverrides ? theme : undefined,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSiteTheme({
        activeThemeId: presetId,
        customTheme: hasOverrides ? theme : undefined,
      });
      toast.success("Theme saved");
      window.dispatchEvent(new CustomEvent("theme-updated", {
        detail: {
          activeThemeId: presetId,
          customTheme: hasOverrides ? theme : undefined,
        },
      }));
    } catch {
      toast.error("Failed to save theme");
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-card p-8 text-center text-muted-foreground">
        Loading theme…
      </div>
    );
  }

  const activePreset = colorThemes.find((t) => t.id === presetId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius)] border border-border bg-card p-4"
      style={{
        boxShadow: "var(--card-shadow)",
      }}
      >
        <div ref={presetDropdownRef} className="relative">
          <Label className="text-xs text-muted-foreground">Preset</Label>
          <button
            type="button"
            onClick={() => setPresetDropdownOpen(!presetDropdownOpen)}
            className="mt-0.5 flex items-center gap-2 w-56 rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <div className="flex -space-x-1 flex-shrink-0">
              {(activePreset?.preview ?? ["#000", "#555", "#999", "#fff"]).map((color, i) => (
                <div
                  key={i}
                  className="h-4 w-4 rounded-full border-2 border-background"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="flex-1 text-left truncate">{activePreset?.name ?? "Default"}</span>
            <ChevronDown className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
          </button>
          {presetDropdownOpen && (
            <div className="absolute left-0 top-full mt-1 w-72 rounded-[var(--radius)] border border-border bg-background shadow-lg z-50 py-2"
            style={{
              boxShadow: "var(--card-shadow)",
            }}
            >
              <div className="space-y-1 max-h-[280px] overflow-y-auto p-1">
                {colorThemes.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { handlePresetChange(t.id); setPresetDropdownOpen(false); }}
                    className={`w-full flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium transition-colors ${
                      presetId === t.id
                        ? "bg-primary/10 text-foreground ring-1 ring-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <div className="flex -space-x-1 flex-shrink-0">
                      {t.preview.map((color, i) => (
                        <div
                          key={i}
                          className="h-4 w-4 rounded-full border-2 border-background"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <span className="flex-1 text-left">{t.name}</span>
                    {presetId === t.id && <Check className="h-4 w-4 ml-auto flex-shrink-0 text-primary" />}
                  </button>
                ))}
              </div>
              <div className="pt-2 mt-1 border-t border-border mx-3">
                <a
                  href="https://tweakcn.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary py-1.5"
                >
                  <ExternalLink className="h-3 w-3" />
                  Browse more themes at tweakcn.com
                </a>
              </div>
            </div>
          )}
        </div>
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save theme"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start border-b border-border bg-transparent p-0">
          <TabsTrigger
            value="colors"
            className="rounded-[var(--radius)] bg-transparent data-[state=active]:bg-primary data-[state=active]:text-background"
            style={activeTab === "colors" ? { boxShadow: "var(--card-shadow)" } : undefined}
          >
            Colors
          </TabsTrigger>
          <TabsTrigger
            value="typography"
            className="rounded-[var(--radius)] bg-transparent data-[state=active]:bg-primary data-[state=active]:text-background"
            style={activeTab === "typography" ? { boxShadow: "var(--card-shadow)" } : undefined}
          >
            Typography
          </TabsTrigger>
          <TabsTrigger
            value="other"
            className="rounded-[var(--radius)] bg-transparent data-[state=active]:bg-primary data-[state=active]:text-background"
            style={activeTab === "other" ? { boxShadow: "var(--card-shadow)" } : undefined}
          >
            Other
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="mt-4 space-y-6">
          {COLOR_GROUPS.map((group) => (
            <div key={group.label} className="rounded-[var(--radius)] border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{group.label}</h3>
              <ul className="space-y-3">
                {group.keys.map((key) => {
                  const label = key.replace(/-/g, " ");
                  const lightVal = getVar("light", key);
                  const darkVal = getVar("dark", key);
                  const lightHex = lightVal ? hslStringToHex(lightVal) : "";
                  const darkHex = darkVal ? hslStringToHex(darkVal) : "";
                  return (
                    <li key={key} className="flex flex-wrap items-center gap-3">
                      <Label className="w-40 text-xs capitalize">{label}</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Light</span>
                        <input
                          type="color"
                          value={lightHex || "#000000"}
                          onChange={(e) => setVar("light", key, hexToHslString(e.target.value))}
                          className="h-8 w-12 cursor-pointer rounded border border-input"
                        />
                        <Input
                          value={lightVal}
                          onChange={(e) => setVar("light", key, e.target.value)}
                          placeholder="e.g. 0 100% 60%"
                          className="font-mono text-xs w-32"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Dark</span>
                        <input
                          type="color"
                          value={darkHex || "#000000"}
                          onChange={(e) => setVar("dark", key, hexToHslString(e.target.value))}
                          className="h-8 w-12 cursor-pointer rounded border border-input"
                        />
                        <Input
                          value={darkVal}
                          onChange={(e) => setVar("dark", key, e.target.value)}
                          placeholder="e.g. 0 100% 70%"
                          className="font-mono text-xs w-32"
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="typography" className="mt-4 space-y-6">
          <div className="rounded-[var(--radius)] border border-border bg-card p-4">
            <p className="mb-3 text-xs text-muted-foreground">
              To use custom fonts, embed them in your project. See Tailwind docs for details.
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="font-sans" className="text-sm">Sans-serif font</Label>
                <Input
                  id="font-sans"
                  value={getVar("light", "font-sans")}
                  onChange={(e) => {
                    const v = e.target.value;
                    setVar("light", "font-sans", v);
                    setVar("dark", "font-sans", v);
                  }}
                  placeholder="e.g. DM Sans, sans-serif"
                  className="mt-1 max-w-md font-mono text-sm"
                />
              </div>
              <div>
                <Label htmlFor="font-serif" className="text-sm">Serif font</Label>
                <Input
                  id="font-serif"
                  value={getVar("light", "font-serif")}
                  onChange={(e) => {
                    const v = e.target.value;
                    setVar("light", "font-serif", v);
                    setVar("dark", "font-serif", v);
                  }}
                  placeholder="e.g. Georgia, serif"
                  className="mt-1 max-w-md font-mono text-sm"
                />
              </div>
              <div>
                <Label htmlFor="font-mono" className="text-sm">Monospace font</Label>
                <Input
                  id="font-mono"
                  value={getVar("light", "font-mono")}
                  onChange={(e) => {
                    const v = e.target.value;
                    setVar("light", "font-mono", v);
                    setVar("dark", "font-mono", v);
                  }}
                  placeholder="e.g. Space Mono, monospace"
                  className="mt-1 max-w-md font-mono text-sm"
                />
              </div>
              <div>
                <Label htmlFor="tracking" className="text-sm">Letter spacing (e.g. 0em)</Label>
                <Input
                  id="tracking"
                  value={getVar("light", "tracking-normal")}
                  onChange={(e) => {
                    const v = e.target.value;
                    setVar("light", "tracking-normal", v);
                    setVar("dark", "tracking-normal", v);
                  }}
                  placeholder="0em"
                  className="mt-1 w-32 font-mono"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="other" className="mt-4 space-y-6">
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            <div>
              <Label htmlFor="radius" className="text-sm">Radius (e.g. 0.75rem or 0)</Label>
              <Input
                id="radius"
                value={getVar("light", "radius")}
                onChange={(e) => {
                  const v = e.target.value;
                  setVar("light", "radius", v);
                  setVar("dark", "radius", v);
                }}
                placeholder="0.75rem"
                className="mt-1 w-32 font-mono"
              />
            </div>
            <div>
              <Label htmlFor="spacing" className="text-sm">Spacing (e.g. 0.25rem)</Label>
              <Input
                id="spacing"
                value={getVar("light", "spacing")}
                onChange={(e) => {
                  const v = e.target.value;
                  setVar("light", "spacing", v);
                  setVar("dark", "spacing", v);
                }}
                placeholder="0.25rem"
                className="mt-1 w-32 font-mono"
              />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Shadows</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {(["shadow-x", "shadow-y", "shadow-blur", "shadow-spread"] as const).map((key) => (
                  <div key={key}>
                    <Label htmlFor={key} className="text-xs">{key.replace("shadow-", "")}</Label>
                    <Input
                      id={key}
                      value={getVar("light", key)}
                      onChange={(e) => {
                        const v = e.target.value;
                        setVar("light", key, v);
                        setVar("dark", key, v);
                      }}
                      placeholder={key === "shadow-blur" ? "0px" : "4px"}
                      className="mt-0.5 w-full font-mono text-sm"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2">
                <Label htmlFor="shadow-color" className="text-xs">Shadow color (HSL)</Label>
                <Input
                  id="shadow-color"
                  value={getVar("light", "shadow-color")}
                  onChange={(e) => {
                    const v = e.target.value;
                    setVar("light", "shadow-color", v);
                    setVar("dark", "shadow-color", v);
                  }}
                  placeholder="0 0% 0%"
                  className="mt-0.5 w-32 font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
