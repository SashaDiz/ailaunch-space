import * as React from "react"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Bridges the legacy Radix `asChild` API onto Base UI's `render` prop so
 * existing call sites like `<DialogTrigger asChild><Button/></DialogTrigger>`
 * keep working after the Base UI migration. When `asChild` is set and the
 * single child is a valid element, that element is passed to Base UI's `render`
 * prop; otherwise children render normally.
 */
export function resolveAsChild(
  asChild: boolean | undefined,
  children: React.ReactNode,
  render?: React.ReactElement
): { render?: React.ReactElement; children?: React.ReactNode } {
  if (asChild && React.isValidElement(children)) {
    return { render: children as React.ReactElement }
  }
  if (render) {
    return { render, children }
  }
  return { children }
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
