"use client";

import React, { useState, useEffect } from "react";
import { ExternalLink, Trash2, CheckCircle2, XCircle, Pause, PlusCircle } from "lucide-react";
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
import { SponsorFormDialog } from "@/components/admin/SponsorFormDialog";

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

export default function AdminSponsorsPage() {
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchSponsors();
  }, [statusFilter]);

  const fetchSponsors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/sponsors?${params}`);
      if (res.ok) {
        const json = await res.json();
        setSponsors(json.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch sponsors:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/admin/sponsors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(`Status updated to ${status}`);
      fetchSponsors();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteSponsor = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sponsor?")) return;
    try {
      const res = await fetch(`/api/admin/sponsors?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Sponsor deleted");
      fetchSponsors();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1 text-foreground">Sponsors</h1>
          <p className="text-muted-foreground">Manage sponsor subscriptions and placements.</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusCircle className="w-4 h-4 mr-2" /> Create Sponsor
        </Button>
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
            {sponsors.length} sponsor{sponsors.length !== 1 ? "s" : ""}
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
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
                          onClick={() => deleteSponsor(s.id)}
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

      <SponsorFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchSponsors}
      />
    </>
  );
}
