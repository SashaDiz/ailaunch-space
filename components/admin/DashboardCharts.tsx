"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RevenueTimeSeriesPoint {
  date: string;
  revenue: number;
  prevRevenue: number;
}

interface VisitsTimeSeriesPoint {
  date: string;
  views: number;
  uniqueVisitors: number;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const chartTooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--foreground))",
  fontSize: "12px",
};

export function EnhancedRevenueChart({
  data,
  totalRevenue,
  changePercent,
  prevTotalRevenue,
}: {
  data: RevenueTimeSeriesPoint[];
  totalRevenue: number;
  changePercent: number | null;
  prevTotalRevenue: number;
}) {
  if (data.length === 0 && totalRevenue === 0) return null;

  return (
    <Card className="h-full flex flex-col min-h-[350px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-foreground">
            ${totalRevenue.toLocaleString()}
          </span>
          {changePercent !== null && (
            <span className={`text-sm font-medium ${changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {changePercent >= 0 ? '↑' : '↓'}{Math.abs(changePercent)}% vs. prev period
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={chartTooltipStyle}
                labelFormatter={(l) => `Date: ${l}`}
                formatter={(value: number, name: string) => [
                  `$${value.toLocaleString()}`,
                  name === "revenue" ? "Current Period" : "Previous Period"
                ]}
              />
              <Area
                type="monotone"
                dataKey="prevRevenue"
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                fill="none"
                strokeWidth={1.5}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--chart-3))"
                fill="url(#revenueGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <div className="px-6 pb-4 pt-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0 text-blue-500" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.2 5.3l-3.5 3.5a.7.7 0 01-1 0L5.3 8.4a.7.7 0 011-1l1 1 3-3a.7.7 0 011 0 .7.7 0 010 1z"/></svg>
          Revenue is verified with the
          <span className="font-medium text-foreground">Dodo Payments API.</span>
        </span>
        <span>Last updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
      </div>
    </Card>
  );
}

export function DailyVisitsChart({ data, totalViews }: { data: VisitsTimeSeriesPoint[]; totalViews: number }) {
  return (
    <Card className="flex-1 flex flex-col min-h-[200px] xl:min-h-0">
      <CardHeader className="pb-1 pt-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">Daily Visits</CardTitle>
        <div className="text-xl font-bold text-foreground">
          {totalViews.toLocaleString()}
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 pb-4">
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="visitsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
              <Tooltip contentStyle={chartTooltipStyle} labelFormatter={(l) => `Date: ${l}`} />
              <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fill="url(#visitsGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function DailyVisitorsChart({ data, totalVisitors }: { data: VisitsTimeSeriesPoint[]; totalVisitors: number }) {
  return (
    <Card className="flex-1 flex flex-col min-h-[200px] xl:min-h-0">
      <CardHeader className="pb-1 pt-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">Daily Visitors</CardTitle>
        <div className="text-xl font-bold text-foreground">
          {totalVisitors.toLocaleString()}
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 pb-4">
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="visitorsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
              <Tooltip contentStyle={chartTooltipStyle} labelFormatter={(l) => `Date: ${l}`} />
              <Area type="monotone" dataKey="uniqueVisitors" stroke="hsl(var(--chart-2))" fill="url(#visitorsGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
