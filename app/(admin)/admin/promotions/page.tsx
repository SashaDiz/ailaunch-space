"use client";

import React, { useState, useEffect } from "react";
import { ExternalLink, Trash2, CheckCircle2, XCircle, Pause, Monitor, LayoutGrid, FileText, PlusCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PromotionFormDialog } from "@/components/admin/PromotionFormDialog";

const STATUS_OPTIONS = ["all", "pending", "active", "cancelled", "past_due", "paused", "rejected"];

function getStatusBadge(status: string) {
  const map: Record<string, { className: string; label: string }> = {
    active: { className: "bg-green-500/20 text-green-600", label: "Active" },
    pending: { className: "bg-yellow-500/20 text-yellow-600", label: "Pending" },
    cancelled: { className: "bg-muted text-muted-foreground", label: "Cancelled" },
    past_due: { className: "bg-red-500/20 text-red-600", label: "Past Due" },
    paused: { className: "bg-blue-500/20 text-blue-600", label: "Paused" },
    rejected: { className: "bg-red-500/20 text-red-600", label: "Rejected" },
  };
  const s = map[status] || { className: "bg-muted text-muted-foreground", label: status };
  return <Badge className={s.className}>{s.label}</Badge>;
}

function PlacementBadges({ promo }: { promo: any }) {
  return (
    <div className="flex flex-wrap gap-1">
      {promo.placement_banner && (
        <Badge variant="outline" className="text-xs gap-1">
          <Monitor className="w-3 h-3" /> Banner
        </Badge>
      )}
      {promo.placement_catalog && (
        <Badge variant="outline" className="text-xs gap-1">
          <LayoutGrid className="w-3 h-3" /> Catalog
        </Badge>
      )}
      {promo.placement_detail_page && (
        <Badge variant="outline" className="text-xs gap-1">
          <FileText className="w-3 h-3" /> Detail
        </Badge>
      )}
    </div>
  );
}

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchPromotions();
  }, [statusFilter]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/promotions?${params}`);
      if (res.ok) {
        const json = await res.json();
        setPromotions(json.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch promotions:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/admin/promotions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(`Status updated to ${status}`);
      fetchPromotions();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deletePromotion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promotion?")) return;
    try {
      const res = await fetch(`/api/admin/promotions?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Promotion deleted");
      fetchPromotions();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Summary stats
  const activeCount = promotions.filter((p) => p.status === "active").length;
  const totalClicks = promotions.reduce((sum, p) => sum + (p.clicks || 0), 0);
  const totalImpressions = promotions.reduce((sum, p) => sum + (p.impressions || 0), 0);

  return (
    <>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1 text-foreground">Promotions</h1>
          <p className="text-muted-foreground">Manage paid ad placements and promotion campaigns.</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusCircle className="w-4 h-4 mr-2" /> Create Promotion
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active Promotions</p>
            <p className="text-2xl font-bold text-foreground">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Impressions</p>
            <p className="text-2xl font-bold text-foreground">{totalImpressions.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Clicks</p>
            <p className="text-2xl font-bold text-foreground">{totalClicks.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {promotions.length} promotion{promotions.length !== 1 ? "s" : ""}
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : promotions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No promotions found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Promotion</TableHead>
                  <TableHead>Placements</TableHead>
                  <TableHead>CTA</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Clicks</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 rounded-[var(--radius)]">
                          <AvatarImage src={p.logo_url} alt={p.name} />
                          <AvatarFallback className="text-xs">{p.name?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{p.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 max-w-[180px]">{p.short_description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><PlacementBadges promo={p} /></TableCell>
                    <TableCell className="text-sm">{p.cta_text || <span className="text-muted-foreground">Default</span>}</TableCell>
                    <TableCell>{getStatusBadge(p.status)}</TableCell>
                    <TableCell className="text-center text-sm">{p.clicks || 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {p.website_url && (
                          <a href={p.website_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm"><ExternalLink className="w-4 h-4" /></Button>
                          </a>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">Status</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateStatus(p.id, "active")}>
                              <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(p.id, "paused")}>
                              <Pause className="w-4 h-4 mr-2 text-blue-500" /> Pause
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(p.id, "rejected")}>
                              <XCircle className="w-4 h-4 mr-2 text-red-500" /> Reject
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => deletePromotion(p.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PromotionFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchPromotions}
      />
    </>
  );
}
