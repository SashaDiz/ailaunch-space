import {
  Bot,
  Rocket,
  Sparkles,
  Send,
  Zap,
  Megaphone,
  Star,
  Globe,
  Wand2,
  PlusCircle,
  Upload,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

/**
 * Curated set of icons selectable for the Auto-Submit trigger button.
 * The config stores the icon by NAME (string); both the admin picker and the
 * homepage button resolve it through this map. Unknown/empty → Bot.
 */
export const AUTOSUBMIT_ICONS: Record<string, LucideIcon> = {
  Bot,
  Rocket,
  Sparkles,
  Send,
  Zap,
  Megaphone,
  Star,
  Globe,
  Wand2,
  PlusCircle,
  Upload,
  TrendingUp,
};

export const AUTOSUBMIT_ICON_NAMES = Object.keys(AUTOSUBMIT_ICONS);

/** Sentinel value for the "no icon" option in the picker/config. */
export const AUTOSUBMIT_ICON_NONE = "none";

/**
 * Resolve a stored icon name to a component.
 * Returns `null` for the explicit "none" option (render no icon);
 * unknown/empty names fall back to Bot.
 */
export function getAutoSubmitIcon(name?: string | null): LucideIcon | null {
  if (name === AUTOSUBMIT_ICON_NONE) return null;
  return (name && AUTOSUBMIT_ICONS[name]) || Bot;
}
