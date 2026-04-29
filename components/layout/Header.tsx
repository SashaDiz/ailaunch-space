"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from '@/hooks/use-user';
import { useSupabase } from "@/components/shared/SupabaseProvider";
import { Menu, ChevronDown, Megaphone, PlusCircle, X } from "lucide-react";
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
  const userMenuRef = useRef(null);

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
      if (browseRef.current && !browseRef.current.contains(event.target)) {
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
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data.categories || []);
        setGroupedCategories(data.data.groupedCategories || {});
      }
    } catch (error) {}
  };

  const getCategoryDotColor = (category) => {
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"];
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 transition-all duration-300",
      isClient && isScrolled
        ? 'bg-background/80 backdrop-blur-md'
        : 'bg-transparent backdrop-blur-none'
    )}>
      <div className="container-classic py-4">
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
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              <Link
                href="/pricing"
                className="px-3 py-2 text-sm font-medium text-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </Link>

              {/* Browse Dropdown */}
              <div className="relative" ref={browseRef}>
                <div
                  className="flex items-center px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
                  onClick={() => setIsBrowseOpen(!isBrowseOpen)}
                  onMouseEnter={() => setIsBrowseOpen(true)}
                >
                  Browse
                  <ChevronDown className="ml-1 h-3 w-3" />
                </div>
                {isBrowseOpen && (
                  <div
                    className="absolute left-0 z-50 bg-background rounded-[var(--radius)] w-80 border border-border max-h-96 overflow-hidden mt-1"
                    style={{ boxShadow: "var(--card-shadow)" }}
                    onMouseLeave={() => setIsBrowseOpen(false)}
                  >
                    {/* Header */}
                    <div className="p-3 border-b border-border">
                      <Link
                        href="/categories"
                        className="flex items-center font-medium text-sm text-foreground hover:text-foreground/80"
                        onClick={() => setIsBrowseOpen(false)}
                      >
                        <span className="w-2 h-2 bg-foreground rounded-full mr-2"></span>
                        All categories
                      </Link>
                    </div>

                    {/* Scrollable Categories */}
                    <div className="max-h-80 overflow-y-auto">
                      {(Object.entries(groupedCategories) as [string, any[]][]).map(([sphere, sphereCategories]) => (
                        <div key={sphere} className="border-b border-border last:border-b-0">
                          {/* Sphere Header */}
                          <div className="px-3 py-2 bg-muted text-sm font-medium text-foreground/80 sticky top-0">
                            {sphere}
                          </div>

                          {/* Categories in Sphere */}
                          <div className="py-1">
                            {sphereCategories.map((category) => (
                              <Link
                                key={category.id || category.name}
                                href={`/categories/${category.slug || category.name}`}
                                className="flex items-center px-6 py-2 text-sm text-foreground hover:bg-muted hover:text-foreground transition-colors"
                                onClick={() => setIsBrowseOpen(false)}
                              >
                                <span
                                  className={`w-2 h-2 ${getCategoryDotColor(
                                    category.name
                                  )} rounded-full mr-3 flex-shrink-0`}
                                ></span>
                                <span className="truncate">{category.name}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isAdmin && (
                <Link
                  href="/admin"
                  className="px-3 py-2 text-sm font-medium text-foreground hover:text-foreground transition-colors"
                >
                  Admin
                </Link>
              )}
            </nav>

            <Button variant="default" size="sm" asChild className="hidden lg:inline-flex">
              <Link href="/promote" className="gap-2">
                <Megaphone className="h-4 w-4" aria-hidden />
                Advertise
              </Link>
            </Button>

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

      {/* Full-Screen Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-foreground/50 backdrop-blur-sm"
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
                  href="/pricing"
                  onClick={closeMobileMenu}
                  className="block text-lg font-medium text-foreground hover:text-foreground transition-colors"
                >
                  Pricing
                </Link>
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
                  href="/submit"
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
        </div>
      )}
    </header>
  );
}
