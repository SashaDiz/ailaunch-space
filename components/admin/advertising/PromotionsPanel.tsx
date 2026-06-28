"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { ExternalLink, Trash2, CheckCircle2, XCircle, Pause, Monitor, LayoutGrid, FileText, PlusCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PromotionFormDialog } from "@/components/admin/PromotionFormDialog";
import { AdminRowsSkeleton } from "@/components/admin/AdminSkeletons";
import { AdminPageActions } from "@/components/admin/AdminPageHeader";
import { easeOverlay } from "@/lib/motion";
import {
  usePlacementList,
  getStatusBadge,
  StatusFilterCard,
  PanelFade,
} from "@/components/admin/advertising/placements-common";

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

export function PromotionsPanel({ active }: { active: boolean }) {
  const {
    items: promotions,
    loading,
    statusFilter,
    setStatusFilter,
    refetch,
    updateStatus,
    deleteItem,
  } = usePlacementList("/api/admin/promotions", "promotion");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  // Summary stats
  const activeCount = promotions.filter((p) => p.status === "active").length;
  const totalClicks = promotions.reduce((sum, p) => sum + (p.clicks || 0), 0);
  const totalImpressions = promotions.reduce((sum, p) => sum + (p.impressions || 0), 0);

  return (
    <>
      {active && (
        <AdminPageActions>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={easeOverlay}>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <PlusCircle className="w-4 h-4 mr-2" /> Create Promotion
            </Button>
          </motion.div>
        </AdminPageActions>
      )}

      <PanelFade>
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

        <StatusFilterCard
          value={statusFilter}
          onChange={setStatusFilter}
          count={promotions.length}
          noun="promotion"
        />

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <AdminRowsSkeleton rows={6} />
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditing(p)}
                            aria-label="Edit promotion"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
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
                            onClick={() => deleteItem(p.id)}
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
      </PanelFade>

      <PromotionFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={refetch}
      />

      <PromotionFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        promotion={editing}
        onSuccess={refetch}
      />
    </>
  );
}
