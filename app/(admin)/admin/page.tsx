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
import { motion, useReducedMotion } from "motion/react";
import { staggerContainer, fadeInUpItem, springSnappy } from "@/lib/motion";
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
import { AdminStatsSkeleton } from '@/components/admin/AdminSkeletons';
import { AdminPageActions } from '@/components/admin/AdminPageHeader';

function StatCard({
  icon: Icon,
  title,
  value,
  description,
  reduce,
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  description?: string;
  reduce?: boolean | null;
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
              <h3 className="text-2xl font-bold tabular-nums text-foreground mt-1">{value}</h3>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
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
  const [traffic, setTraffic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const reduce = useReducedMotion();

  useEffect(() => {
    fetchDashboard(timeRange);
  }, [timeRange]);

  const fetchDashboard = async (range: string) => {
    try {
      setLoading(true);
      // Platform counts + revenue come from our own DB/Dodo; site traffic comes
      // live from DataFast. Fetch both together so the page paints once.
      const [statsRes, trafficRes] = await Promise.all([
        fetch(`/api/admin?type=stats&range=${range}`),
        fetch(`/api/admin/analytics?range=${range}`),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data || {});
      }

      if (trafficRes.ok) {
        const data = await trafficRes.json();
        setTraffic(data.configured ? data : null);
      } else {
        setTraffic(null);
      }
    } catch (error) {
      console.error("Failed to fetch admin dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // DataFast is the source of truth for site traffic when connected; otherwise
  // fall back to the visits recorded in our own analytics table.
  const visitorSeries = traffic
    ? (traffic.timeseries || []).map((p: any) => ({
        date: p.date,
        views: p.pageviews,
        uniqueVisitors: p.visitors,
      }))
    : stats.visitsOverTime || [];

  const totalVisitors = traffic
    ? traffic.overview?.visitors ?? 0
    : stats.totalVisits || 0;
  const totalPageviews = traffic
    ? traffic.overview?.pageviews ?? 0
    : siteViewsTotal(stats.visitsOverTime);

  return (
    <>
      <AdminPageActions>
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
      </AdminPageActions>

      {loading ? (
        <AdminStatsSkeleton />
      ) : (
        <div className="space-y-8">
          {/* Stat Cards */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <StatCard icon={Folder} title="Total Projects" value={stats.totalProjects || 0} reduce={reduce} />
            <StatCard icon={Clock} title="Pending" value={stats.pendingProjects || 0} reduce={reduce} />
            <StatCard icon={Users} title="Users" value={stats.totalUsers || 0} reduce={reduce} />
            <StatCard
              icon={Globe}
              title="Visitors"
              value={totalVisitors.toLocaleString()}
              description={traffic ? "Live from DataFast" : undefined}
              reduce={reduce}
            />
            <StatCard
              icon={Eye}
              title="Pageviews"
              value={totalPageviews.toLocaleString()}
              description={traffic ? "Live from DataFast" : undefined}
              reduce={reduce}
            />
            <StatCard icon={MousePointerClick} title="Listing Clicks" value={(stats.totalClicks || 0).toLocaleString()} reduce={reduce} />
          </motion.div>

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
          <motion.div
            className="grid grid-cols-1 xl:grid-cols-6 gap-4 xl:min-h-[650px]"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="xl:col-span-4">
              <EnhancedRevenueChart
                data={stats.revenueOverTime || []}
                totalRevenue={stats.totalRevenue || 0}
                changePercent={stats.revenueChangePercent ?? null}
                prevTotalRevenue={stats.prevTotalRevenue || 0}
              />
            </div>
            <div className="xl:col-span-2 flex flex-col gap-4">
              <DailyVisitsChart data={visitorSeries} totalViews={totalPageviews} />
              <DailyVisitorsChart data={visitorSeries} totalVisitors={totalVisitors} />
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

function siteViewsTotal(visitsOverTime: any[] | undefined): number {
  if (!visitsOverTime) return 0;
  return visitsOverTime.reduce((sum: number, r: any) => sum + (r.views || 0), 0);
}
