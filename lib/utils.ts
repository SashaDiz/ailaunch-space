import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLogoDevUrl(websiteUrl?: string | null): string {
  const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;
  if (!token || !websiteUrl) return "";
  try {
    const domain = new URL(websiteUrl).hostname.replace(/^www\./, "");
    return `https://img.logo.dev/${domain}?token=${token}&format=png&size=128`;
  } catch {
    return "";
  }
}
