"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { useSupabase } from "@/components/shared/SupabaseProvider";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Menu, ExternalLink } from "lucide-react";

interface AdminHeaderProps {
  onMobileMenuToggle: () => void;
}

export function AdminHeader({ onMobileMenuToggle }: AdminHeaderProps) {
  const { user, loading } = useUser();
  const { supabase } = useSupabase();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id && !loading) {
      fetchUserProfile();
    }
  }, [user?.id, loading]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/user?type=profile&t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) setUserProfile(result.data);
      }
    } catch {}
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    try {
      await fetch("/api/auth/signout", { method: "POST", cache: "no-store" });
    } catch {}
    setIsUserMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const avatarUrl = userProfile?.avatar_url || user?.user_metadata?.avatar_url;
  const displayName = userProfile?.full_name || user?.user_metadata?.full_name || "";
  const avatarInitial = (displayName?.[0] || user?.email?.[0] || "U").toUpperCase();

  return (
    <header className="sticky z-30 bg-background/95 backdrop-blur-sm border-b border-border" style={{ top: "var(--demo-banner-h, 0px)" }}>
      <div className="flex items-center justify-between h-14 px-4 sm:px-6">
        {/* Left: Mobile menu + title */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden p-2"
            onClick={onMobileMenuToggle}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium text-muted-foreground hidden sm:block">
            Admin Panel
          </span>
        </div>

        {/* Right: View site + theme + user */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
            <Link href="/" target="_blank">
              <ExternalLink className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline text-xs">View Site</span>
            </Link>
          </Button>

          <ThemeSwitcher />

          {/* User avatar */}
          {user && (
            <div className="relative" ref={userMenuRef}>
              <button
                className="cursor-pointer"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <div className="w-8 h-8 rounded-full border border-border overflow-hidden transition-all hover:border-foreground">
                  {avatarUrl && !avatarError ? (
                    <img
                      src={avatarUrl}
                      alt={displayName || "User"}
                      className="w-full h-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div className="bg-foreground text-background w-full h-full flex items-center justify-center text-xs font-medium">
                      {avatarInitial}
                    </div>
                  )}
                </div>
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 z-50 bg-background rounded-xl w-48 border border-border shadow-lg mt-2 py-2">
                  <div className="px-4 py-2 text-xs">
                    <p className="font-medium text-foreground truncate">
                      {displayName || "User"}
                    </p>
                    <p className="text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Separator className="my-1" />
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
                    Settings
                  </Link>
                  <Separator className="my-1" />
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
