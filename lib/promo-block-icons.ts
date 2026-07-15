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
 * Curated set of icons selectable for the Promo Block trigger button.
 * The config stores the icon by NAME (string); both the admin picker and the
 * homepage button resolve it through this map. Unknown/empty → Bot.
 */
export const PROMO_BLOCK_ICONS: Record<string, LucideIcon> = {
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

export const PROMO_BLOCK_ICON_NAMES = Object.keys(PROMO_BLOCK_ICONS);

/** Sentinel value for the "no icon" option in the picker/config. */
export const PROMO_BLOCK_ICON_NONE = "none";

/**
 * Resolve a stored icon name to a component.
 * Returns `null` for the explicit "none" option (render no icon);
 * unknown/empty names fall back to Bot.
 */
export function getPromoBlockIcon(name?: string | null): LucideIcon | null {
  if (name === PROMO_BLOCK_ICON_NONE) return null;
  return (name && PROMO_BLOCK_ICONS[name]) || Bot;
}
