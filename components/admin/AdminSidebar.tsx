"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Folder,
  Tags,
  Users,
  Palette,
  ExternalLink,
  PanelLeftClose,
  PanelLeft,
  Handshake,
  Megaphone,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site.config";
import { ThemeAwareLogo } from "@/components/shared/ThemeAwareLogo";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: BarChart3, exact: true },
  { name: "Listings", href: "/admin/projects", icon: Folder, exact: false },
  { name: "Categories", href: "/admin/categories", icon: Tags, exact: false },
  { name: "Sponsors", href: "/admin/sponsors", icon: Handshake, exact: false },
  { name: "Promotions", href: "/admin/promotions", icon: Megaphone, exact: false },
  { name: "Marketing", href: "/admin/marketing", icon: Sparkles, exact: false },
  { name: "Users", href: "/admin/users", icon: Users, exact: false },
  { name: "Theme", href: "/admin/theme", icon: Palette, exact: false },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarContent({
  collapsed,
  onCollapsedChange,
  onLinkClick,
}: {
  collapsed: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onLinkClick?: () => void;
}) {
  const pathname = usePathname();

  const isActive = (item: (typeof navItems)[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn("flex items-center border-b border-border", collapsed ? "justify-center px-2 py-5" : "px-5 py-5")}>
        <Link href="/admin" className="flex items-center gap-3" onClick={onLinkClick}>
          <ThemeAwareLogo
            height={32}
            width={100}
            className="h-8 w-auto flex-shrink-0"
            iconOnly={collapsed}
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <TooltipProvider delayDuration={0}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    onClick={onLinkClick}
                    className={cn(
                      "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted",
                      collapsed && "justify-center px-2"
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">
                    <p>{item.name}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border px-3 py-4 space-y-1">
        <Link
          href="/"
          onClick={onLinkClick}
          className={cn(
            "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
            collapsed && "justify-center px-2"
          )}
        >
          <ExternalLink className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>View Site</span>}
        </Link>
        {onCollapsedChange && (
          <button
            onClick={() => onCollapsedChange(!collapsed)}
            className={cn(
              "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full",
              collapsed && "justify-center px-2"
            )}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4 flex-shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4 flex-shrink-0" />
                <span>Collapse</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export function AdminSidebar({ collapsed, onCollapsedChange, mobileOpen, onMobileClose }: AdminSidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col lg:fixed lg:left-0 lg:z-40 bg-card border-r border-border transition-all duration-200",
          collapsed ? "lg:w-16" : "lg:w-64"
        )}
        style={{ top: "var(--demo-banner-h, 0px)", bottom: 0 }}
      >
        <SidebarContent
          collapsed={collapsed}
          onCollapsedChange={onCollapsedChange}
        />
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={(open) => !open && onMobileClose()}>
        <SheetContent side="left" className="p-0 w-64 [&>button]:hidden">
          <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
          <SidebarContent
            collapsed={false}
            onLinkClick={onMobileClose}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
