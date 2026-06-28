"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { ExternalLink, PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminNavItems as navItems, getActiveNavItem } from "@/lib/admin-nav";
import { springSnappy } from "@/lib/motion";
import { ThemeAwareLogo } from "@/components/shared/ThemeAwareLogo";
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
  instanceId,
}: {
  collapsed: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onLinkClick?: () => void;
  /** Namespaces the layoutId so the desktop and mobile sidebars don't share an indicator. */
  instanceId: string;
}) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const activeHref = getActiveNavItem(pathname)?.href ?? null;

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
            const active = item.href === activeHref;
            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    onClick={onLinkClick}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "text-background"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted",
                      collapsed && "justify-center px-2"
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId={`admin-nav-active-${instanceId}`}
                        className="absolute inset-0 rounded-[var(--radius)] bg-foreground"
                        transition={reduce ? { duration: 0 } : springSnappy}
                      />
                    )}
                    <span className={cn("relative flex items-center gap-3", collapsed && "justify-center")}>
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span>{item.name}</span>}
                    </span>
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
          instanceId="desktop"
        />
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={(open) => !open && onMobileClose()}>
        <SheetContent side="left" className="p-0 w-64 [&>button]:hidden">
          <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
          <SidebarContent
            collapsed={false}
            onLinkClick={onMobileClose}
            instanceId="mobile"
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
