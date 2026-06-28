"use client";

import { useContext } from "react";
import { DisplaySettingsContext } from "@/components/shared/DisplaySettingsProvider";
import type { DisplaySettings } from "@/lib/display-settings";

/** Read the site-wide display settings (logo/image toggles for cards & detail). */
export function useDisplaySettings(): DisplaySettings {
  return useContext(DisplaySettingsContext);
}
