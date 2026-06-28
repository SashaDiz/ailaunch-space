"use client";

import React, { useState, useEffect, useCallback, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { easeOverlay } from "@/lib/motion";

/** Status values shared by sponsors and promotions (both back onto status filtering). */
export const PLACEMENT_STATUS_OPTIONS = [
  "all",
  "pending",
  "active",
  "cancelled",
  "past_due",
  "paused",
  "rejected",
];

const STATUS_BADGE: Record<string, { className: string; label: string }> = {
  active: { className: "bg-green-500/20 text-green-600", label: "Active" },
  pending: { className: "bg-yellow-500/20 text-yellow-600", label: "Pending" },
  cancelled: { className: "bg-muted text-muted-foreground", label: "Cancelled" },
  past_due: { className: "bg-red-500/20 text-red-600", label: "Past Due" },
  paused: { className: "bg-blue-500/20 text-blue-600", label: "Paused" },
  rejected: { className: "bg-red-500/20 text-red-600", label: "Rejected" },
};

export function getStatusBadge(status: string) {
  const s = STATUS_BADGE[status] || {
    className: "bg-muted text-muted-foreground",
    label: status,
  };
  return <Badge className={s.className}>{s.label}</Badge>;
}

function formatStatusLabel(s: string) {
  return s === "all"
    ? "All Statuses"
    : s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ");
}

/** Status dropdown + item count, shared by the sponsors and promotions panels. */
export function StatusFilterCard({
  value,
  onChange,
  count,
  noun,
}: {
  value: string;
  onChange: (value: string) => void;
  count: number;
  noun: string;
}) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {PLACEMENT_STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {formatStatusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {count} {noun}
          {count !== 1 ? "s" : ""}
        </span>
      </CardContent>
    </Card>
  );
}

/** Soft fade + lift used when a tab panel mounts; disabled under reduced motion. */
export function PanelFade({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={easeOverlay}
    >
      {children}
    </motion.div>
  );
}

/**
 * Shared list logic for status-filtered placement collections (sponsors,
 * promotions). Both endpoints return `{ data: [...] }`, accept `PUT { id, status }`,
 * and `DELETE ?id=`. Columns/badges stay per-panel.
 */
export function usePlacementList(endpoint: string, label: string) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`${endpoint}?${params}`);
      if (res.ok) {
        const json = await res.json();
        setItems(json.data || []);
      }
    } catch (error) {
      console.error(`Failed to fetch ${label}s:`, error);
    } finally {
      setLoading(false);
    }
  }, [endpoint, label, statusFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(`Status updated to ${status}`);
      fetchItems();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm(`Are you sure you want to delete this ${label}?`)) return;
    try {
      const res = await fetch(`${endpoint}?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success(`${label.charAt(0).toUpperCase()}${label.slice(1)} deleted`);
      fetchItems();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return {
    items,
    loading,
    statusFilter,
    setStatusFilter,
    refetch: fetchItems,
    updateStatus,
    deleteItem,
  };
}
