import type { ColorTheme, FullThemeConfig } from "@/config/themes.config";
import { colorThemes } from "@/config/themes.config";

const PRESET_THEME_STYLE_ID = "preset-theme-style";

/** Build CSS string for a preset theme. Scoped to html[data-color-theme="id"] so theme vars (including fonts) override base layer. */
export function buildPresetThemeStyle(theme: ColorTheme): string {
  const toRule = (vars: Record<string, string>) =>
    Object.entries(vars)
      .map(([key, value]) => {
        const name = key.startsWith("--") ? key : `--${key}`;
        return `${name}: ${value};`;
      })
      .join("\n  ");
  const sel = `html[data-color-theme="${theme.id}"]`;
  const light = Object.keys(theme.light).length ? `${sel} {\n  ${toRule(theme.light)}\n}\n` : "";
  const dark = Object.keys(theme.dark).length ? `${sel}.dark {\n  ${toRule(theme.dark)}\n}` : "";
  return light + dark;
}

/** Apply or clear preset theme by id (inject style and set/remove data-color-theme). */
export function applyPresetThemeById(themeId: string): void {
  const root = document.documentElement;
  const existing = document.getElementById(PRESET_THEME_STYLE_ID);
  if (existing) existing.remove();

  if (themeId === "default" || !themeId) {
    root.removeAttribute("data-color-theme");
    return;
  }

  const theme = colorThemes.find((t) => t.id === themeId);
  if (!theme || (Object.keys(theme.light).length === 0 && Object.keys(theme.dark).length === 0)) {
    root.removeAttribute("data-color-theme");
    return;
  }

  const style = document.createElement("style");
  style.id = PRESET_THEME_STYLE_ID;
  style.textContent = buildPresetThemeStyle(theme);
  document.head.appendChild(style);
  root.setAttribute("data-color-theme", themeId);
}

/**
 * Theme editor helpers: HSL (e.g. "0 100% 60%") <-> hex for color inputs.
 */

export function hslStringToHex(hsl: string): string {
  const parts = hsl.trim().split(/\s+/);
  if (parts.length < 3) return "#000000";
  const h = parseFloat(parts[0]) / 360;
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (x: number) => {
    const hex = Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return "#" + toHex(r) + toHex(g) + toHex(b);
}

export function hexToHslString(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0 0% 0%";
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Build inline CSS for server-side theme injection (no DOM references).
 * Used in layout.tsx to prevent FOUC by rendering a <style> tag in <head>.
 */
export function buildThemeInlineCSS(themeData: { activeThemeId: string; customTheme?: FullThemeConfig }): string {
  const toRule = (vars: Record<string, string>) =>
    Object.entries(vars)
      .map(([key, value]) => {
        const name = key.startsWith("--") ? key : `--${key}`;
        return `${name}: ${value};`;
      })
      .join(" ");

  if (themeData.customTheme) {
    const lightRules = Object.keys(themeData.customTheme.light).length
      ? `:root { ${toRule(themeData.customTheme.light)} }`
      : "";
    const darkRules = Object.keys(themeData.customTheme.dark).length
      ? `.dark { ${toRule(themeData.customTheme.dark)} }`
      : "";
    return [lightRules, darkRules].filter(Boolean).join("\n");
  }

  if (themeData.activeThemeId && themeData.activeThemeId !== "default") {
    const theme = colorThemes.find((t) => t.id === themeData.activeThemeId);
    if (theme && (Object.keys(theme.light).length > 0 || Object.keys(theme.dark).length > 0)) {
      const lightRules = Object.keys(theme.light).length
        ? `:root { ${toRule(theme.light)} }`
        : "";
      const darkRules = Object.keys(theme.dark).length
        ? `.dark { ${toRule(theme.dark)} }`
        : "";
      return [lightRules, darkRules].filter(Boolean).join("\n");
    }
  }

  return "";
}
