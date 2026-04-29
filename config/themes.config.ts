/**
 * Theme Configuration — Color themes for AI Launch Space
 *
 * Single shipped theme: `default` — pulls every CSS variable from
 * `app/globals.css` (cyber palette ported from authority-hunt).
 *
 * Light/dark mode is handled by next-themes (class="dark" on <html>).
 * The admin ThemeEditor still works — it can override individual variables
 * on top of the default theme via the site_settings DB row.
 */

/** Full theme config for admin custom theme (colors, typography, shadows, radius, spacing) */
export interface FullThemeConfig {
  light: Record<string, string>;
  dark: Record<string, string>;
}

export interface ColorTheme {
  id: string;
  name: string;
  /** Preview colors: [primary, secondary, accent, background] */
  preview: [string, string, string, string];
  /** CSS variable overrides for light mode (HSL values without hsl() wrapper; fonts as full value) */
  light: Record<string, string>;
  /** CSS variable overrides for dark mode */
  dark: Record<string, string>;
}

/** All CSS variable keys that can be customized (for editor and validation) */
export const THEME_VAR_KEYS = {
  colors: [
    "background",
    "foreground",
    "card",
    "card-foreground",
    "popover",
    "popover-foreground",
    "primary",
    "primary-foreground",
    "secondary",
    "secondary-foreground",
    "muted",
    "muted-foreground",
    "accent",
    "accent-foreground",
    "destructive",
    "destructive-foreground",
    "border",
    "input",
    "ring",
    "chart-1",
    "chart-2",
    "chart-3",
    "chart-4",
    "chart-5",
    "sidebar",
    "sidebar-foreground",
    "sidebar-primary",
    "sidebar-primary-foreground",
    "sidebar-accent",
    "sidebar-accent-foreground",
    "sidebar-border",
    "sidebar-ring",
  ] as const,
  typography: ["font-sans", "font-serif", "font-mono", "tracking-normal"] as const,
  other: [
    "radius",
    "spacing",
    "shadow-x",
    "shadow-y",
    "shadow-blur",
    "shadow-spread",
    "shadow-opacity",
    "shadow-color",
  ] as const,
} as const;

export const colorThemes: ColorTheme[] = [
  {
    id: "default",
    name: "Default",
    // [primary (light), accent (light), primary (dark), background (dark)]
    preview: ["#7C2EE6", "#0F1B2D", "#FF8533", "#0a0e14"],
    light: {},
    dark: {},
  },
];

/**
 * Default color theme ID.
 * Change this to set a different default for your site.
 */
export const defaultColorTheme = "default";
