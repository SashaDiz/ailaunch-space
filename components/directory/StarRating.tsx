"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  appId: string;
  averageRating: number;
  ratingsCount: number;
  userRating: number | null;
  readonly?: boolean;
  size?: "sm" | "md";
}

export function StarRating({
  appId,
  averageRating,
  ratingsCount,
  userRating,
  readonly = false,
  size = "md",
}: StarRatingProps) {
  const { user } = useUser();
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [currentUserRating, setCurrentUserRating] = useState<number | null>(userRating);
  const [avgRating, setAvgRating] = useState(averageRating);
  const [count, setCount] = useState(ratingsCount);
  const [loading, setLoading] = useState(false);

  const displayRating = readonly ? avgRating : (hoveredStar ?? currentUserRating ?? avgRating);
  const starSize = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  const handleClick = async (star: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (readonly || loading) return;

    if (!user) {
      toast.error("Sign in to rate projects");
      return;
    }

    setLoading(true);
    const prevRating = currentUserRating;
    const prevAvg = avgRating;
    const prevCount = count;
    setCurrentUserRating(star);

    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_id: appId, rating: star }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to rate");
      }

      const data = await res.json();
      setAvgRating(data.data.average_rating);
      setCount(data.data.ratings_count);
    } catch (err: any) {
      setCurrentUserRating(prevRating);
      setAvgRating(prevAvg);
      setCount(prevCount);
      toast.error(err.message || "Failed to submit rating");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={() => !readonly && setHoveredStar(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.round(displayRating);
          return (
            <button
              key={star}
              type="button"
              disabled={readonly || loading}
              onClick={(e) => handleClick(star, e)}
              onMouseEnter={() => !readonly && setHoveredStar(star)}
              className={cn(
                "transition-colors disabled:cursor-default",
                !readonly && "cursor-pointer hover:scale-110"
              )}
            >
              <Star
                className={cn(
                  starSize,
                  filled
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/40"
                )}
              />
            </button>
          );
        })}
      </div>
      <span className={cn(
        "text-muted-foreground",
        size === "sm" ? "text-xs" : "text-sm"
      )}>
        {avgRating > 0 ? (
          <>
            {avgRating.toFixed(1)}
            <span className="ml-0.5">({count})</span>
          </>
        ) : (
          <span className="italic">No ratings</span>
        )}
      </span>
    </div>
  );
}
