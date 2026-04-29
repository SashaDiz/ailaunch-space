"use client";

import React, { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  appId: string;
  initialBookmarked: boolean;
  size?: "sm" | "md";
}

export function BookmarkButton({ appId, initialBookmarked, size = "md" }: BookmarkButtonProps) {
  const { user } = useUser();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Sign in to bookmark projects");
      return;
    }

    const prev = bookmarked;
    setBookmarked(!prev);
    setLoading(true);

    try {
      if (prev) {
        const res = await fetch(`/api/bookmarks?app_id=${appId}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
      } else {
        const res = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ app_id: appId }),
        });
        if (!res.ok) throw new Error();
      }
    } catch {
      setBookmarked(prev);
      toast.error("Failed to update bookmark");
    } finally {
      setLoading(false);
    }
  };

  const Icon = bookmarked ? BookmarkCheck : Bookmark;
  const sizeClasses = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const buttonClasses = size === "sm" ? "p-1" : "p-1.5";

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={bookmarked ? "Remove bookmark" : "Add bookmark"}
      className={cn(
        "rounded-md transition-colors hover:bg-muted disabled:opacity-50",
        buttonClasses,
        bookmarked ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className={cn(sizeClasses, bookmarked && "fill-current")} />
    </button>
  );
}
