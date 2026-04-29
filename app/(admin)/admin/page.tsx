"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Folder,
  Clock,
  Eye,
  MousePointerClick,
  Users,
  Globe,
} from "lucide-react";
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  EnhancedRevenueChart,
  DailyVisitsChart,
  DailyVisitorsChart,
} from '@/components/admin/DashboardCharts';

function StatCard({
  icon: Icon,
  title,
  value,
  description,
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  description?: string;
}) {
  return (
    <Card className="hover:border-foreground transition duration-300 ease-in-out">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{value}</h3>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="w-12 h-12 bg-foreground/10 rounded-xl flex items-center justify-center">
            <Icon className="w-6 h-6 text-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const PERIOD_LABELS: Record<string, string> = {
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "3m": "Last 3 months",
  "6m": "Last 6 months",
  "12m": "Last 12 months",
  "all": "All time",
};

export default function AdminPage() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");

  useEffect(() => {
    fetchAdminStats(timeRange);
  }, [timeRange]);

  const fetchAdminStats = async (range: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin?type=stats&range=${range}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.data || {});
      }
    } catch (error) {
      console.error("Failed to fetch admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1 text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor platform activity and performance.
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PERIOD_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="bg-muted h-4 w-20 mb-2 rounded" />
                    <div className="bg-muted h-8 w-16 mb-2 rounded" />
                    <div className="bg-muted h-3 w-24 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard icon={Folder} title="Total Projects" value={stats.totalProjects || 0} />
            <StatCard icon={Clock} title="Pending" value={stats.pendingProjects || 0} />
            <StatCard icon={Users} title="Users" value={stats.totalUsers || 0} />
            <StatCard icon={Globe} title="Visits" value={(stats.totalVisits || 0).toLocaleString()} />
            <StatCard icon={Eye} title="Views" value={(stats.totalViews || 0).toLocaleString()} />
            <StatCard icon={MousePointerClick} title="Clicks" value={(stats.totalClicks || 0).toLocaleString()} />
          </div>

          {/* Quick Actions */}
          {stats.pendingProjects > 0 && (
            <Card className="border-warning/50 bg-warning/5">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-warning" />
                  <span className="text-sm font-medium">{stats.pendingProjects} project{stats.pendingProjects !== 1 ? "s" : ""} awaiting review</span>
                </div>
                <Link
                  href="/admin/projects?status=pending"
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Review now
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Charts Row — aligned with 6-column stat cards grid */}
          <div className="grid grid-cols-1 xl:grid-cols-6 gap-4 xl:min-h-[650px]">
            <div className="xl:col-span-4">
              <EnhancedRevenueChart
                data={stats.revenueOverTime || []}
                totalRevenue={stats.totalRevenue || 0}
                changePercent={stats.revenueChangePercent ?? null}
                prevTotalRevenue={stats.prevTotalRevenue || 0}
              />
            </div>
            <div className="xl:col-span-2 flex flex-col gap-4">
              <DailyVisitsChart
                data={stats.visitsOverTime || []}
                totalViews={siteViewsTotal(stats.visitsOverTime)}
              />
              <DailyVisitorsChart
                data={stats.visitsOverTime || []}
                totalVisitors={stats.totalVisits || 0}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function siteViewsTotal(visitsOverTime: any[] | undefined): number {
  if (!visitsOverTime) return 0;
  return visitsOverTime.reduce((sum: number, r: any) => sum + (r.views || 0), 0);
}
