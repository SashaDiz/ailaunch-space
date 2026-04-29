"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user?.id) {
      router.push("/auth/signin?callbackUrl=/admin");
      return;
    }
    checkAdminAccess();
  }, [user?.id, loading]);

  const checkAdminAccess = async () => {
    try {
      const res = await fetch("/api/admin");
      if (res.ok) {
        setIsAdmin(true);
      } else {
        toast.error("Access denied. Admin privileges required.");
        router.push("/dashboard");
      }
    } catch {
      router.push("/dashboard");
    } finally {
      setChecking(false);
    }
  };

  if (loading || checking || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className={cn("transition-all duration-200", collapsed ? "lg:pl-16" : "lg:pl-64")}>
        <AdminHeader onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
