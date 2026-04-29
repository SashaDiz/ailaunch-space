"use client";

import { useEffect, useRef } from "react";
import type { FullThemeConfig } from "@/config/themes.config";
import { applyPresetThemeById } from "@/lib/theme-utils";

export type SiteTheme = {
  activeThemeId: string;
  customTheme?: FullThemeConfig;
};

function buildCustomThemeStyle(customTheme: FullThemeConfig): string {
  const toRule = (vars: Record<string, string>) =>
    Object.entries(vars)
      .map(([key, value]) => {
        const name = key.startsWith("--") ? key : `--${key}`;
        return `${name}: ${value};`;
      })
      .join("\n  ");
  return `:root {\n  ${toRule(customTheme.light)}\n}\n.dark {\n  ${toRule(customTheme.dark)}\n}`;
}

function applyTheme(theme: SiteTheme) {
  // Remove any previously injected client-side theme styles
  const existingCustom = document.getElementById("custom-theme-style");
  if (existingCustom) existingCustom.remove();

  // Remove server-rendered theme style (replaced by client-side)
  const serverStyle = document.getElementById("server-theme-style");
  if (serverStyle) serverStyle.remove();

  if (theme.customTheme) {
    const style = document.createElement("style");
    style.id = "custom-theme-style";
    style.textContent = buildCustomThemeStyle(theme.customTheme);
    document.head.appendChild(style);
    document.documentElement.removeAttribute("data-color-theme");
    applyPresetThemeById("default");
  } else {
    applyPresetThemeById(theme.activeThemeId ?? "default");
  }
}

export function SiteThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme?: SiteTheme | null;
  children: React.ReactNode;
}) {
  const applied = useRef(false);

  useEffect(() => {
    if (initialTheme) {
      // Server already rendered the correct CSS; apply client-side state
      applyTheme({
        activeThemeId: initialTheme.activeThemeId ?? "default",
        customTheme: initialTheme.customTheme,
      });
    } else {
      // Fallback: fetch from API if no initialTheme provided
      fetch("/api/admin/theme")
        .then((r) => r.json())
        .then((data) =>
          applyTheme({
            activeThemeId: data.activeThemeId ?? "default",
            customTheme: data.customTheme,
          })
        )
        .catch(() => applyTheme({ activeThemeId: "default" }));
    }
    applied.current = true;

    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent<SiteTheme>).detail;
      if (detail?.activeThemeId) {
        applyTheme({
          activeThemeId: detail.activeThemeId,
          customTheme: detail.customTheme,
        });
        return;
      }
      fetch("/api/admin/theme")
        .then((r) => r.json())
        .then((data) =>
          applyTheme({
            activeThemeId: data.activeThemeId ?? "default",
            customTheme: data.customTheme,
          })
        )
        .catch(() => {});
    };
    window.addEventListener("theme-updated", onUpdate);
    return () => window.removeEventListener("theme-updated", onUpdate);
  }, [initialTheme]);

  return <>{children}</>;
}
