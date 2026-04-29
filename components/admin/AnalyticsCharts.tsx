"use client";

import React from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface TimeSeriesPoint {
  date: string;
  count: number;
}

interface RevenuePoint {
  date: string;
  count: number;
  revenue: number;
}

interface CategoryPoint {
  name: string;
  count: number;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--foreground))",
  fontSize: "12px",
};

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-1))",
  "hsl(var(--accent))",
  "hsl(var(--muted-foreground))",
];

export function ProjectsAreaChart({ data }: { data: TimeSeriesPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Projects Submitted</CardTitle>
        <CardDescription>New project submissions over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="aProjectsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(l) => `Date: ${l}`} />
              <Area type="monotone" dataKey="count" name="Projects" stroke="hsl(var(--primary))" fill="url(#aProjectsGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function UserGrowthChart({ data }: { data: TimeSeriesPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">User Growth</CardTitle>
        <CardDescription>New user registrations over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(l) => `Date: ${l}`} />
              <Line type="monotone" dataKey="count" name="Users" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function RevenueBarChart({ data }: { data: RevenuePoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Revenue</CardTitle>
        <CardDescription>Payment revenue over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(l) => `Date: ${l}`} formatter={(value: number) => [`$${value}`, "Revenue"]} />
              <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function CategoryPieChart({ data }: { data: CategoryPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Category Distribution</CardTitle>
        <CardDescription>Projects by category (top 10)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function ViewsClicksChart({ data }: { data: { totalViews: number; totalClicks: number } }) {
  const chartData = [
    { name: "Views", value: data.totalViews },
    { name: "Clicks", value: data.totalClicks },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Engagement</CardTitle>
        <CardDescription>Total views and clicks across all projects</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold">{data.totalViews.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Views</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{data.totalClicks.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Clicks</p>
          </div>
          {data.totalViews > 0 && (
            <div className="col-span-2 text-center">
              <p className="text-lg font-semibold">{((data.totalClicks / data.totalViews) * 100).toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Click-through Rate</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
