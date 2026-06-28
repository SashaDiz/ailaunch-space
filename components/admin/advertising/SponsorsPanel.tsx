"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { ExternalLink, Trash2, CheckCircle2, XCircle, Pause, PlusCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SponsorFormDialog } from "@/components/admin/SponsorFormDialog";
import { AdminRowsSkeleton } from "@/components/admin/AdminSkeletons";
import { AdminPageActions } from "@/components/admin/AdminPageHeader";
import { easeOverlay } from "@/lib/motion";
import {
  usePlacementList,
  getStatusBadge,
  StatusFilterCard,
  PanelFade,
} from "@/components/admin/advertising/placements-common";

export function SponsorsPanel({ active }: { active: boolean }) {
  const {
    items: sponsors,
    loading,
    statusFilter,
    setStatusFilter,
    refetch,
    updateStatus,
    deleteItem,
  } = usePlacementList("/api/admin/sponsors", "sponsor");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  return (
    <>
      {active && (
        <AdminPageActions>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={easeOverlay}>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <PlusCircle className="w-4 h-4 mr-2" /> Create Sponsor
            </Button>
          </motion.div>
        </AdminPageActions>
      )}

      <PanelFade>
        <StatusFilterCard
          value={statusFilter}
          onChange={setStatusFilter}
          count={sponsors.length}
          noun="sponsor"
        />

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <AdminRowsSkeleton rows={6} />
            ) : sponsors.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No sponsors found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sponsor</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sponsors.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 rounded-[var(--radius)]">
                            <AvatarImage src={s.logo} alt={s.name} />
                            <AvatarFallback className="text-xs">{s.name?.[0] || "?"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{s.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{s.description}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {s.website_url ? (
                          <a href={s.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            Link
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(s.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditing(s)}
                            aria-label="Edit sponsor"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">Status</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => updateStatus(s.id, "active")}>
                                <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateStatus(s.id, "paused")}>
                                <Pause className="w-4 h-4 mr-2 text-blue-500" /> Pause
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateStatus(s.id, "rejected")}>
                                <XCircle className="w-4 h-4 mr-2 text-red-500" /> Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => deleteItem(s.id)}
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

      <SponsorFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={refetch}
      />

      <SponsorFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        sponsor={editing}
        onSuccess={refetch}
      />
    </>
  );
}
