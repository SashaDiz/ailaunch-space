import {
  BarChart3,
  Folder,
  Tags,
  Users,
  Palette,
  Megaphone,
  FileText,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  /** Short label shown in the sidebar. */
  name: string;
  href: string;
  icon: LucideIcon;
  /** Match the route exactly (vs. startsWith). */
  exact: boolean;
  /** Large heading rendered by the centralized AdminPageHeader. */
  title: string;
  /** Optional supporting line under the heading. */
  subtitle?: string;
}

/**
 * Single source of truth for admin navigation: consumed by both the sidebar
 * (links + sliding active indicator) and the centralized page header (title
 * derived from the current route). Keep this list ordered as it should appear
 * in the sidebar.
 */
export const adminNavItems: AdminNavItem[] = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: BarChart3,
    exact: true,
    title: "Dashboard",
    subtitle: "Monitor platform activity and performance.",
  },
  {
    name: "Listings",
    href: "/admin/projects",
    icon: Folder,
    exact: false,
    title: "Listings Management",
    subtitle: "Review, approve, and manage project submissions.",
  },
  {
    name: "Categories",
    href: "/admin/categories",
    icon: Tags,
    exact: false,
    title: "Categories",
    subtitle: "Manage directory spheres and categories.",
  },
  {
    name: "Blog",
    href: "/admin/blog",
    icon: FileText,
    exact: false,
    title: "Blog Posts",
    subtitle: "Create, schedule, and manage blog articles.",
  },
  {
    name: "Advertising",
    href: "/admin/advertising",
    icon: Megaphone,
    exact: false,
    title: "Advertising",
    subtitle: "Manage sponsors, paid promotions, and the site banner.",
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
    exact: false,
    title: "Users",
    subtitle: "Manage platform users, roles, and access.",
  },
  {
    name: "Design",
    href: "/admin/design",
    icon: Palette,
    exact: false,
    title: "Design",
    subtitle:
      "Colors, typography, layout, and which elements appear on cards and pages.",
  },
];

/** Resolve the nav item that owns the given pathname, or null. */
export function getActiveNavItem(pathname: string): AdminNavItem | null {
  return (
    adminNavItems.find((item) =>
      item.exact ? pathname === item.href : pathname.startsWith(item.href)
    ) ?? null
  );
}

/** `href` of the active item — used as the layoutId match key for the indicator. */
export function getActiveNavHref(pathname: string): string | null {
  return getActiveNavItem(pathname)?.href ?? null;
}

/**
 * Heading meta for the centralized AdminPageHeader. Returns null for admin
 * routes not present in the nav (e.g. /admin/changelog), so those pages keep
 * their own heading.
 */
export function getAdminPageMeta(
  pathname: string
): { title: string; subtitle?: string } | null {
  const item = getActiveNavItem(pathname);
  if (!item) return null;
  return { title: item.title, subtitle: item.subtitle };
}
