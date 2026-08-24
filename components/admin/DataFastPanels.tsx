"use client";

import React from "react";
import Image from "next/image";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { DataFastInterval } from "@/lib/datafast";

export interface TrafficPoint {
  date: string;
  visitors: number;
  newVisitors: number;
  returningVisitors: number;
  pageviews: number;
  sessions: number;
  revenue: number;
  payments: number;
}

export interface BreakdownRow {
  label: string;
  image?: string;
  visitors: number;
  revenue: number;
  payments: number;
}

const chartTooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--foreground))",
  fontSize: "12px",
};

/** Bucket size decides whether a tick reads as a time, a day, or a month. */
export function formatBucket(value: string, interval: DataFastInterval) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  if (interval === "hour") {
    return d.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
  }
  if (interval === "month") {
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function TrafficChart({
  data,
  interval,
  title = "Traffic",
  description,
}: {
  data: TrafficPoint[];
  interval: DataFastInterval;
  title?: string;
  description?: string;
}) {
  const totalVisitors = data.reduce((sum, p) => sum + p.visitors, 0);
  const totalPageviews = data.reduce((sum, p) => sum + p.pageviews, 0);

  return (
    <Card className="h-full flex flex-col min-h-[350px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
          <span className="text-3xl font-bold tabular-nums text-foreground">
            {totalVisitors.toLocaleString()}
            <span className="ml-2 text-sm font-medium text-muted-foreground">visitors</span>
          </span>
          <span className="text-lg font-semibold tabular-nums text-muted-foreground">
            {totalPageviews.toLocaleString()}
            <span className="ml-2 text-sm font-medium">pageviews</span>
          </span>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <div className="h-full min-h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="dfVisitorsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="dfPageviewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => formatBucket(v, interval)}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={chartTooltipStyle}
                labelFormatter={(v) => formatBucket(String(v), interval)}
                formatter={(value: number, name: string) => [
                  value.toLocaleString(),
                  name === "pageviews" ? "Pageviews" : "Visitors",
                ]}
              />
              <Legend
                formatter={(name) => (name === "pageviews" ? "Pageviews" : "Visitors")}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="pageviews"
                stroke="hsl(var(--chart-2))"
                fill="url(#dfPageviewsGrad)"
                strokeWidth={1.5}
              />
              <Area
                type="monotone"
                dataKey="visitors"
                stroke="hsl(var(--primary))"
                fill="url(#dfVisitorsGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Ranked list with a proportional bar behind each row — the standard shape for
 * DataFast breakdowns (pages, referrers, countries, devices).
 */
export function BreakdownCard({
  title,
  description,
  rows,
  emptyLabel = "No data for this period",
  showRevenue = true,
  formatLabel,
}: {
  title: string;
  description?: string;
  rows: BreakdownRow[];
  emptyLabel?: string;
  showRevenue?: boolean;
  formatLabel?: (label: string) => string;
}) {
  const max = rows.reduce((m, r) => Math.max(m, r.visitors), 0) || 1;
  const hasRevenue = showRevenue && rows.some((r) => r.revenue > 0);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{emptyLabel}</p>
        ) : (
          <ul className="space-y-1">
            {rows.map((row, index) => (
              <li key={`${row.label}-${index}`} className="relative">
                <div
                  className="absolute inset-y-0 left-0 rounded-[var(--radius)] bg-muted"
                  style={{ width: `${Math.max((row.visitors / max) * 100, 2)}%` }}
                  aria-hidden="true"
                />
                <div className="relative flex items-center justify-between gap-3 px-2 py-1.5 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    {row.image && (
                      <Image
                        src={row.image}
                        alt=""
                        width={16}
                        height={12}
                        className="h-3 w-4 flex-shrink-0 rounded-[2px] object-cover"
                        unoptimized
                      />
                    )}
                    <span className="truncate text-foreground" title={row.label}>
                      {formatLabel ? formatLabel(row.label) : row.label}
                    </span>
                  </span>
                  <span className="flex flex-shrink-0 items-center gap-4 tabular-nums">
                    {hasRevenue && (
                      <span className="text-xs text-muted-foreground">
                        ${row.revenue.toLocaleString()}
                      </span>
                    )}
                    <span className="font-medium text-foreground">
                      {row.visitors.toLocaleString()}
                    </span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** DataFast reports direct traffic with an empty referrer. */
export function formatReferrer(label: string) {
  return label && label.trim() !== "" ? label : "Direct / None";
}
