"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from '@/hooks/use-user';
import { useSupabase } from "@/components/shared/SupabaseProvider";
import { Menu, Megaphone, PlusCircle, X, Search, BarChart3 } from "lucide-react";
import { SearchPalette, useSearchShortcut, useShortcutLabel } from "@/components/layout/SearchPalette";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { siteConfig } from '@/config/site.config';
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import { ThemeAwareLogo } from "@/components/shared/ThemeAwareLogo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

export function Header() {
  const { user, loading } = useUser();
  const { supabase } = useSupabase();
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [groupedCategories, setGroupedCategories] = useState({});
  const [isScrolled, setIsScrolled] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [avatarError, setAvatarError] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBrowseOpen, setIsBrowseOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const browseRef = useRef(null);
  const browsePanelRef = useRef<HTMLDivElement | null>(null);
  const headerBoxRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // Hover intent for the browse menu: open at once, close after a short delay
  // so the pointer can travel from the icon down into the panel.
  const browseCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openBrowse = React.useCallback(() => {
    if (browseCloseTimer.current) clearTimeout(browseCloseTimer.current);
    setIsBrowseOpen(true);
  }, []);
  const closeBrowseSoon = React.useCallback(() => {
    if (browseCloseTimer.current) clearTimeout(browseCloseTimer.current);
    browseCloseTimer.current = setTimeout(() => setIsBrowseOpen(false), 180);
  }, []);
  const openSearch = React.useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = React.useCallback(() => setIsSearchOpen(false), []);
  useSearchShortcut(openSearch);
  const shortcut = useShortcutLabel();

  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch user profile data when user is available
  useEffect(() => {
    if (user?.id && !loading && isClient) {
      fetchUserProfile();
      checkAdminStatus();
    } else if (!user?.id && !loading && isClient) {
      setUserProfile(null);
      setIsAdmin(false);
    }
  }, [user?.id, loading, isClient]);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      if (user && !loading) {
        setTimeout(() => { fetchUserProfile(); }, 200);
        setTimeout(() => { fetchUserProfile(); }, 500);
        setTimeout(() => { fetchUserProfile(); }, 1000);
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => { window.removeEventListener('profileUpdated', handleProfileUpdate); };
  }, [user?.id, loading]);

  // Reset avatar error when the avatar URL changes
  const avatarUrl = userProfile?.avatar_url || user?.user_metadata?.avatar_url;
  const displayName = userProfile?.full_name || user?.user_metadata?.full_name || "";
  const avatarInitial =
    (displayName?.[0] || user?.email?.[0] || "U").toUpperCase();

  useEffect(() => {
    setAvatarError(false);
  }, [avatarUrl]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        browseRef.current && !browseRef.current.contains(event.target) &&
        !browsePanelRef.current?.contains(event.target)
      ) {
        setIsBrowseOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/user?type=profile&t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUserProfile(result.data);
        }
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      setUserProfile(null);
    }
  };

  const checkAdminStatus = async () => {
    if (!user?.id) { setIsAdmin(false); return; }
    try {
      const response = await fetch("/api/admin");
      setIsAdmin(response.ok);
    } catch (error) {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
    const handleScroll = () => { setIsScrolled(window.scrollY > 0); };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => { setIsMobileMenuOpen(!isMobileMenuOpen); };
  const closeMobileMenu = () => { setIsMobileMenuOpen(false); };

  const handleSignOut = async (onAfterSignOut?: () => void) => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("Supabase client sign-out error:", error);
    } catch (error) {
      console.error("Supabase client sign-out exception:", error);
    }

    try {
      const response = await fetch("/api/auth/signout", { method: "POST", cache: "no-store" });
      if (!response.ok) console.error("Supabase server sign-out failed:", await response.text());
    } catch (error) {
      console.error("Supabase server sign-out request error:", error);
    }

    if (onAfterSignOut) onAfterSignOut();
    setUserProfile(null);
    router.push("/");
    router.refresh();
  };

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories?includeCount=true");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data.categories || []);
        setGroupedCategories(data.data.groupedCategories || {});
      }
    } catch (error) {}
  };

  return (
    <header className={cn(
      // Sticks below the mobile ad ticker when one is showing.
      "sticky top-[var(--ad-ticker-offset,0px)] z-50 transition-all duration-300",
      isClient && isScrolled
        ? 'bg-background/80 backdrop-blur-md'
        : 'bg-transparent backdrop-blur-none'
    )}>
      <div ref={headerBoxRef} className="container-classic relative py-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
            <Link href="/">
              <ThemeAwareLogo
                height={44}
                width={140}
                priority
                className="h-11 w-auto"
              />
            </Link>

          {/* Right side - Navigation, CTA and Auth */}
          <div className="flex items-center space-x-3">
            {/* Search: a field-like trigger on desktop, an icon on mobile; ⌘K / Ctrl+K anywhere */}
            <button
              type="button"
              onClick={openSearch}
              aria-label={`Search AI tools (${shortcut})`}
              className="group hidden h-9 w-40 items-center gap-2 rounded-[var(--radius)] border border-border bg-background/40 pl-3 pr-1.5 text-left text-[13px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground lg:flex xl:w-52"
            >
              <Search className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              <span className="flex-1 truncate">Search</span>
              <kbd className="shrink-0 rounded-[calc(var(--radius)*0.75)] border border-border bg-muted/60 px-1.5 py-0.5 font-sans text-[10px] leading-none text-muted-foreground transition-colors group-hover:text-foreground">
                {shortcut}
              </kbd>
            </button>
            <button
              type="button"
              onClick={openSearch}
              aria-label="Search AI tools"
              className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {/* Browse: full-width mega menu on hover (click and Esc work too) */}
              <div
                ref={browseRef}
                onMouseEnter={openBrowse}
                onMouseLeave={closeBrowseSoon}
                onKeyDown={(e) => { if (e.key === "Escape") setIsBrowseOpen(false); }}
              >
                <button
                  type="button"
                  aria-label="Browse categories"
                  aria-expanded={isBrowseOpen}
                  aria-haspopup="true"
                  title="Browse categories"
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-[var(--radius)] transition-colors hover:bg-muted hover:text-foreground",
                    isBrowseOpen ? "bg-muted text-foreground" : "text-muted-foreground"
                  )}
                  onClick={() => setIsBrowseOpen(!isBrowseOpen)}
                >
                  <Menu className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </button>
                <BrowseMenu
                  open={isBrowseOpen}
                  anchorRef={headerBoxRef}
                  panelRef={browsePanelRef}
                  groupedCategories={groupedCategories}
                  total={categories.length}
                  onEnter={openBrowse}
                  onLeave={closeBrowseSoon}
                  onNavigate={() => setIsBrowseOpen(false)}
                />
              </div>

              <Link href="/stats" aria-label="Stats" title="Stats" className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <BarChart3 className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Admin
                </Link>
              )}

              <Link
                href="/promote"
                className="px-3 py-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
              >
                Advertise
              </Link>
            </nav>

            <Link
              href="/pricing"
              className="hidden lg:inline-flex items-center rounded-full bg-foreground px-4 py-1.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Submit
            </Link>

            <ThemeSwitcher />
            <LanguageSwitcher />

            {/* Authentication */}
            {!isClient || loading ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse"></div>
            ) : user ? (
              <div className="relative" ref={userMenuRef}>
                <div
                  role="button"
                  className="cursor-pointer"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <div className="w-12 h-12 rounded-full border-2 border-border transition-all duration-200 hover:border-foreground hover:scale-105 overflow-hidden">
                    {avatarUrl && !avatarError ? (
                      <Image
                        src={avatarUrl}
                        alt={displayName || user.email || "User"}
                        width={48}
                        height={48}
                        className="rounded-full w-full h-full object-cover"
                        key={`avatar-${avatarUrl}-${userProfile?.updated_at || ""}`}
                        unoptimized={true}
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <div className="bg-foreground text-background w-full h-full flex items-center justify-center text-xs font-medium">
                        {avatarInitial}
                      </div>
                    )}
                  </div>
                </div>
                {isUserMenuOpen && (
                  <div className="absolute right-0 z-50 bg-background rounded-[var(--radius)] w-56 border border-border mt-2 py-2" style={{ boxShadow: "var(--card-shadow)" }}>
                    {/* User Info */}
                    <div className="px-4 py-2 text-xs">
                      <p className="font-medium text-foreground">{userProfile?.full_name || user.user_metadata?.full_name || "User"}</p>
                      <p className="text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <Separator className="my-1" />
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Account Settings
                    </Link>
                    {isAdmin && (
                      <>
                        <Separator className="my-1" />
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Admin
                        </Link>
                      </>
                    )}
                    <Separator className="my-1" />
                    <button
                      onClick={() => { setIsUserMenuOpen(false); handleSignOut(); }}
                      className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/signin" className="font-medium">
                    Sign in
                  </Link>
                </Button>
                <div className="w-px h-4 bg-border"></div>
                <span className="text-muted-foreground text-sm">✕</span>
              </div>
            )}

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="p-2"
                aria-label="Open mobile menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <SearchPalette open={isSearchOpen} onClose={closeSearch} />

      {/* Full-Screen Mobile Menu Overlay. Portalled to <body>: the header and the
          page card use backdrop-filter, which would otherwise make this
          `fixed` overlay position against them instead of the viewport. */}
      {isMobileMenuOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeMobileMenu}
          />

          {/* Menu Content */}
          <div className="fixed inset-0 bg-background overflow-y-auto">
            {/* Header with Close Button */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center">
                <ThemeAwareLogo
                  height={40}
                  width={140}
                  className="h-10 w-auto"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeMobileMenu}
                className="p-2"
                aria-label="Close mobile menu"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Navigation Content */}
            <div className="p-6">
              {/* Navigation Links */}
              <div className="space-y-4 mb-8">
                <Link
                  href="/promote"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2 text-lg font-medium text-foreground hover:text-foreground transition-colors"
                >
                  <Megaphone className="h-5 w-5" aria-hidden />
                  Advertise
                </Link>

                <Link
                  href="/#projects-section"
                  onClick={closeMobileMenu}
                  className="block text-lg font-medium text-foreground hover:text-foreground transition-colors"
                >
                  Browse
                </Link>
                <Link
                  href="/categories"
                  onClick={closeMobileMenu}
                  className="block text-lg font-medium text-foreground hover:text-foreground transition-colors"
                >
                  Categories
                </Link>
                <Link
                  href="/stats"
                  onClick={closeMobileMenu}
                  className="block text-lg font-medium text-foreground hover:text-foreground transition-colors"
                >
                  Stats
                </Link>
                <button
                  type="button"
                  onClick={() => { closeMobileMenu(); openSearch(); }}
                  className="flex items-center gap-2 text-lg font-medium text-foreground"
                >
                  <Search className="h-5 w-5" aria-hidden />
                  Search
                </button>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={closeMobileMenu}
                    className="block text-lg font-medium text-foreground hover:text-foreground transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <div className="pt-2">
                  <ThemeSwitcher />
                </div>
              </div>

              {/* Submit Button */}
              <div className="mb-8">
                <Link
                  href="/pricing"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-center w-full bg-background text-foreground border-2 border-foreground rounded-lg px-6 py-4 font-semibold text-sm no-underline transition duration-300 hover:-translate-y-1 hover:shadow-[0_4px_0_rgba(0,0,0,1)]"
                >
                  <PlusCircle className="h-6 w-6 mr-2" strokeWidth={2} />
                  Submit
                </Link>
              </div>

              {/* User Section */}
              {!loading && user && (
                <div className="border-t border-border pt-6">
                  <div className="flex items-center mb-4">
                    <div className="mr-3">
                      <div className="w-12 h-12 rounded-full border-2 border-border overflow-hidden">
                        {avatarUrl && !avatarError ? (
                          <Image
                            src={avatarUrl}
                            alt={displayName || user.email || "User"}
                            width={48}
                            height={48}
                            className="rounded-full w-full h-full object-cover"
                            key={`mobile-avatar-${avatarUrl}-${userProfile?.updated_at || ""}`}
                            unoptimized={true}
                            onError={() => setAvatarError(true)}
                          />
                        ) : (
                          <div className="bg-foreground text-background w-full h-full flex items-center justify-center text-lg font-medium">
                            {avatarInitial}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {userProfile?.full_name || user.user_metadata?.full_name || "User"}
                      </p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Link
                      href="/profile"
                      onClick={closeMobileMenu}
                      className="block py-2 text-base text-muted-foreground hover:text-foreground transition-colors"
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={closeMobileMenu}
                      className="block py-2 text-base text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/settings"
                      onClick={closeMobileMenu}
                      className="block py-2 text-base text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Account Settings
                    </Link>
                    <button
                      onClick={() => handleSignOut(closeMobileMenu)}
                      className="block py-2 text-base text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}

              {!loading && !user && (
                <div className="border-t border-border pt-6">
                  <div className="space-y-4">
                    <Link
                      href="/auth/signin"
                      onClick={closeMobileMenu}
                      className="block w-full text-center py-3 px-6 border border-border rounded-lg text-base font-medium text-muted-foreground hover:bg-muted transition-colors"
                    >
                      Sign in
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}

const numberFormat = new Intl.NumberFormat("en-US");

/**
 * Full-width category menu. Portalled to <body> and positioned against the
 * header container: an ancestor with backdrop-filter would otherwise trap both
 * its `fixed` positioning and its own backdrop blur.
 */
function BrowseMenu({
  open, anchorRef, panelRef, groupedCategories, total, onEnter, onLeave, onNavigate,
}: {
  open: boolean;
  anchorRef: React.RefObject<HTMLDivElement | null>;
  panelRef: React.MutableRefObject<HTMLDivElement | null>;
  groupedCategories: Record<string, any[]>;
  total: number;
  onEnter: () => void;
  onLeave: () => void;
  onNavigate: () => void;
}) {
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const measure = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (rect) setBox({ top: rect.bottom - 14, left: rect.left, width: rect.width });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, [open, anchorRef]);

  if (!open || !box || typeof document === "undefined") return null;
  const spheres = Object.entries(groupedCategories) as [string, any[]][];

  return createPortal(
    <div
      ref={panelRef}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onKeyDown={(e) => { if (e.key === "Escape") onNavigate(); }}
      className="fixed z-[60] pt-2 animate-in fade-in-0 slide-in-from-top-1 duration-150"
      style={{ top: box.top, left: box.left, width: box.width }}
    >
      <div
        className="relative overflow-hidden rounded-[calc(var(--radius)*3)] bg-background/70 px-6 pb-6 pt-5 backdrop-blur-2xl backdrop-saturate-150"
        style={{ boxShadow: "0 24px 60px -24px rgb(0 0 0 / 0.45)" }}
      >
        {/* Pixel grain: a faint dot grid that ties the glass to the site's dithered backdrop. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(hsl(var(--foreground)) 0.6px, transparent 0.6px)",
            backgroundSize: "6px 6px",
          }}
        />

        <div className="relative flex items-center gap-4">
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Browse AI tools
          </span>
          <span aria-hidden className="h-px flex-1 bg-foreground/10" />
          <Link href="/stats" onClick={onNavigate} className="shrink-0 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
            Stats
          </Link>
          <Link href="/categories" onClick={onNavigate} className="shrink-0 text-[11px] font-semibold text-primary hover:underline">
            All {total} categories →
          </Link>
        </div>

        <div className="relative mt-5 grid grid-cols-4 gap-x-8 gap-y-6 xl:grid-cols-5">
          {spheres.map(([sphere, items]) => (
            <section key={sphere} className="min-w-0">
              <h3 className="mb-2 truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/90">
                {sphere}
              </h3>
              <ul className="space-y-px">
                {items.map((category) => (
                  <li key={category.id || category.name}>
                    <Link
                      href={`/categories/${category.slug || category.name}`}
                      onClick={onNavigate}
                      className="group -mx-1.5 flex items-baseline gap-2 rounded-[var(--radius)] px-1.5 py-[3px] text-[12.5px] transition-colors hover:bg-foreground/[0.06]"
                    >
                      <span className="min-w-0 truncate text-foreground/75 transition-colors group-hover:text-foreground">
                        {category.name}
                      </span>
                      <span aria-hidden className="mb-[3px] min-w-2 flex-1 border-b border-dotted border-foreground/15" />
                      <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground transition-colors group-hover:text-primary">
                        {numberFormat.format(category.app_count || 0)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
