"use client";

import { createContext, useEffect, useState } from "react";
import {
  DEFAULT_DISPLAY_SETTINGS,
  DISPLAY_SETTINGS_EVENT,
  normalizeDisplaySettings,
  type DisplaySettings,
} from "@/lib/display-settings";

export const DisplaySettingsContext = createContext<DisplaySettings>(
  DEFAULT_DISPLAY_SETTINGS
);

/**
 * Provides site-wide display settings (which elements appear on cards / detail).
 * Seeded from the server to avoid a flash, and re-fetched live when the admin
 * saves changes (via the `display-settings-updated` window event).
 */
export function DisplaySettingsProvider({
  initialSettings,
  children,
}: {
  initialSettings?: DisplaySettings | null;
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<DisplaySettings>(
    () => initialSettings ?? DEFAULT_DISPLAY_SETTINGS
  );

  useEffect(() => {
    // If the server did not seed settings, fetch them on mount.
    if (!initialSettings) {
      fetch("/api/admin/layout")
        .then((r) => r.json())
        .then((data) => setSettings(normalizeDisplaySettings(data)))
        .catch(() => {});
    }

    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent<DisplaySettings>).detail;
      if (detail && typeof detail === "object") {
        setSettings(normalizeDisplaySettings(detail));
        return;
      }
      fetch("/api/admin/layout")
        .then((r) => r.json())
        .then((data) => setSettings(normalizeDisplaySettings(data)))
        .catch(() => {});
    };

    window.addEventListener(DISPLAY_SETTINGS_EVENT, onUpdate);
    return () => window.removeEventListener(DISPLAY_SETTINGS_EVENT, onUpdate);
  }, [initialSettings]);

  return (
    <DisplaySettingsContext.Provider value={settings}>
      {children}
    </DisplaySettingsContext.Provider>
  );
}
