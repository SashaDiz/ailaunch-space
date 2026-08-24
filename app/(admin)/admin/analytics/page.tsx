"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Users,
  Eye,
  MousePointerClick,
  Timer,
  DollarSign,
  Radio,
  AlertTriangle,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { staggerContainer, fadeInUpItem, springSnappy } from "@/lib/motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminStatsSkeleton } from "@/components/admin/AdminSkeletons";
import { AdminPageActions } from "@/components/admin/AdminPageHeader";
import {
  TrafficChart,
  BreakdownCard,
  formatReferrer,
  type TrafficPoint,
  type BreakdownRow,
} from "@/components/admin/DataFastPanels";
import type { DataFastInterval } from "@/lib/datafast";

const PERIOD_LABELS: Record<string, string> = {
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "3m": "Last 3 months",
  "6m": "Last 6 months",
  "12m": "Last 12 months",
  all: "All time",
};

/** Realtime visitor count refresh cadence. */
const REALTIME_POLL_MS = 30_000;

interface AnalyticsResponse {
  configured: boolean;
  message?: string;
  interval?: DataFastInterval;
  fetchedAt?: string;
  overview?: {
    visitors: number;
    new_visitors: number;
    returning_visitors: number;
    pageviews: number;
    sessions: number;
    bounce_rate: number;
    avg_session_duration: number;
    currency: string;
    revenue: number;
    payments: number;
    revenue_per_visitor: number;
    conversion_rate: number;
  } | null;
  timeseries?: TrafficPoint[];
  breakdowns?: {
    pages: BreakdownRow[];
    referrers: BreakdownRow[];
    countries: BreakdownRow[];
    devices: BreakdownRow[];
  };
  realtime?: number;
  errors?: string[];
}

function StatCard({
  icon: Icon,
  title,
  value,
  description,
  reduce,
  accent,
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  description?: string;
  reduce?: boolean | null;
  accent?: boolean;
}) {
  return (
    <motion.div
      variants={fadeInUpItem}
      whileHover={reduce ? undefined : { y: -2 }}
      transition={springSnappy}
    >
      <Card className="group transition-colors duration-200 hover:border-foreground">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-muted-foreground text-sm font-medium">{title}</p>
              <h3 className="mt-1 flex items-center gap-2 text-2xl font-bold tabular-nums text-foreground">
                {accent && (
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                  </span>
                )}
                {value}
              </h3>
              {description && (
                <p className="mt-1 text-xs text-muted-foreground">{description}</p>
              )}
            </div>
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
              <Icon className="h-[18px] w-[18px]" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function formatDuration(seconds: number) {
  if (!seconds) return "0s";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d");
  const reduce = useReducedMotion();

  const fetchAnalytics = useCallback(async (selected: string, showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      const response = await fetch(`/api/admin/analytics?range=${selected}`);
      if (response.ok) {
        setData(await response.json());
      } else {
        console.error("Failed to fetch DataFast analytics:", response.status);
      }
    } catch (error) {
      console.error("Failed to fetch DataFast analytics:", error);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(range);
  }, [range, fetchAnalytics]);

  // Keep the "live now" figure current without flashing the whole page.
  useEffect(() => {
    const id = setInterval(() => fetchAnalytics(range, false), REALTIME_POLL_MS);
    return () => clearInterval(id);
  }, [range, fetchAnalytics]);

  const overview = data?.overview ?? null;
  const breakdowns = data?.breakdowns;
  const currency = overview?.currency ?? "USD";

  return (
    <>
      <AdminPageActions>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PERIOD_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </AdminPageActions>

      {loading ? (
        <AdminStatsSkeleton />
      ) : data && !data.configured ? (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="flex items-start gap-3 p-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" />
            <div className="space-y-1">
              <p className="text-sm font-medium">DataFast is not connected</p>
              <p className="text-sm text-muted-foreground">{data.message}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {data?.errors?.length ? (
            <Card className="border-warning/50 bg-warning/5">
              <CardContent className="flex items-center gap-3 p-4">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-warning" />
                <p className="text-sm text-muted-foreground">
                  Some DataFast panels could not be loaded ({data.errors.join(", ")}). The
                  rest of the data is current.
                </p>
              </CardContent>
            </Card>
          ) : null}

          <motion.div
            className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <StatCard
              icon={Radio}
              title="Live now"
              value={(data?.realtime ?? 0).toLocaleString()}
              description="Active in last 10 min"
              accent={(data?.realtime ?? 0) > 0}
              reduce={reduce}
            />
            <StatCard
              icon={Users}
              title="Visitors"
              value={(overview?.visitors ?? 0).toLocaleString()}
              description={`${(overview?.new_visitors ?? 0).toLocaleString()} new`}
              reduce={reduce}
            />
            <StatCard
              icon={Eye}
              title="Pageviews"
              value={(overview?.pageviews ?? 0).toLocaleString()}
              description={`${(overview?.sessions ?? 0).toLocaleString()} sessions`}
              reduce={reduce}
            />
            <StatCard
              icon={MousePointerClick}
              title="Bounce Rate"
              value={`${(overview?.bounce_rate ?? 0).toFixed(1)}%`}
              reduce={reduce}
            />
            <StatCard
              icon={Timer}
              title="Avg. Session"
              value={formatDuration(overview?.avg_session_duration ?? 0)}
              reduce={reduce}
            />
            <StatCard
              icon={DollarSign}
              title="Attributed Revenue"
              value={`$${(overview?.revenue ?? 0).toLocaleString()}`}
              description={`${(overview?.payments ?? 0).toLocaleString()} payments · ${currency}`}
              reduce={reduce}
            />
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <TrafficChart
              data={data?.timeseries ?? []}
              interval={data?.interval ?? "day"}
              description={`${PERIOD_LABELS[range]} · conversion rate ${(overview?.conversion_rate ?? 0).toFixed(2)}% · $${(overview?.revenue_per_visitor ?? 0).toFixed(2)} per visitor`}
            />
          </motion.div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BreakdownCard
              title="Top Pages"
              description="Most visited pages, with revenue attributed to each"
              rows={breakdowns?.pages ?? []}
            />
            <BreakdownCard
              title="Traffic Sources"
              description="Where visitors came from, and what they were worth"
              rows={breakdowns?.referrers ?? []}
              formatLabel={formatReferrer}
            />
            <BreakdownCard
              title="Countries"
              description="Top countries by visitors"
              rows={breakdowns?.countries ?? []}
            />
            <BreakdownCard
              title="Devices"
              description="Desktop, mobile, and tablet split"
              rows={breakdowns?.devices ?? []}
            />
          </div>

          {data?.fetchedAt && (
            <p className="text-xs text-muted-foreground">
              Live from the DataFast API · updated{" "}
              {new Date(data.fetchedAt).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      )}
    </>
  );
}
