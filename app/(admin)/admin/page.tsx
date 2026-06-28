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
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const reduce = useReducedMotion();

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
            <StatCard icon={Globe} title="Visits" value={(stats.totalVisits || 0).toLocaleString()} reduce={reduce} />
            <StatCard icon={Eye} title="Views" value={(stats.totalViews || 0).toLocaleString()} reduce={reduce} />
            <StatCard icon={MousePointerClick} title="Clicks" value={(stats.totalClicks || 0).toLocaleString()} reduce={reduce} />
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
              <DailyVisitsChart
                data={stats.visitsOverTime || []}
                totalViews={siteViewsTotal(stats.visitsOverTime)}
              />
              <DailyVisitorsChart
                data={stats.visitsOverTime || []}
                totalVisitors={stats.totalVisits || 0}
              />
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
