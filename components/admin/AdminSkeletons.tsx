"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { staggerContainer, fadeInUpItem } from "@/lib/motion";

/**
 * List-row placeholder shared across admin tables (Listings, Categories,
 * Users, Sponsors, Promotions). Replaces the old "Loading..." text and the
 * one-off `animate-pulse` blocks with a single, consistent shape.
 */
export function AdminRowsSkeleton({
  rows = 6,
  withAvatar = true,
  className,
}: {
  rows?: number;
  withAvatar?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className ?? "p-6 space-y-4"}
      variants={reduce ? undefined : staggerContainer}
      initial={reduce ? undefined : "hidden"}
      animate={reduce ? undefined : "visible"}
      aria-hidden
    >
      {Array.from({ length: rows }).map((_, i) => (
        <motion.div
          key={i}
          variants={reduce ? undefined : fadeInUpItem}
          className="flex items-center gap-4"
        >
          {withAvatar && (
            <Skeleton className="w-10 h-10 rounded-[var(--radius)] shrink-0" />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-8 w-20 rounded-md shrink-0 hidden sm:block" />
        </motion.div>
      ))}
    </motion.div>
  );
}

/** Six metric-card placeholders matching the dashboard stat grid. */
export function AdminStatsSkeleton({ count = 6 }: { count?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
      variants={reduce ? undefined : staggerContainer}
      initial={reduce ? undefined : "hidden"}
      animate={reduce ? undefined : "visible"}
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div key={i} variants={reduce ? undefined : fadeInUpItem}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-7 w-12" />
                </div>
                <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
