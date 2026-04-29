"use client";

import React, { useState, useEffect } from "react";
import { Search, XCircle, ShieldCheck, Ban, ExternalLink, UsersRound } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Pagination from '@/components/shared/Pagination';
import Link from "next/link";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [socialProofSelectedIds, setSocialProofSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, totalCount: 0 });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchUsers(1);
  }, [debouncedSearch, roleFilter]);

  const fetchUsers = async (page: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString(), limit: "25" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (roleFilter !== "all") params.set("role", roleFilter);

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users || []);
        setSocialProofSelectedIds(data.data.socialProofSelectedUserIds || []);
        setPagination(data.data.pagination || { page: 1, totalPages: 0, totalCount: 0 });
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!response.ok) throw new Error("Failed to update role");
      toast.success(`Role updated to ${newRole}`);
      fetchUsers(pagination.page);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSocialProofToggle = async (userId: string) => {
    const hasAvatar = users.find((u) => u.id === userId)?.avatar_url;
    if (!hasAvatar) return;
    const next = socialProofSelectedIds.includes(userId)
      ? socialProofSelectedIds.filter((id) => id !== userId)
      : [...socialProofSelectedIds, userId];
    setSocialProofSelectedIds(next);
    try {
      const res = await fetch("/api/admin/social-proof-avatars", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: next }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Social proof updated");
    } catch (e: any) {
      setSocialProofSelectedIds(socialProofSelectedIds);
      toast.error(e.message || "Failed to save");
    }
  };

  const handleBanToggle = async (userId: string, isBanned: boolean) => {
    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_banned: !isBanned }),
      });
      if (!response.ok) throw new Error("Failed to update ban status");
      toast.success(isBanned ? "User unbanned" : "User banned");
      fetchUsers(pagination.page);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getRoleBadge = (u: any) => {
    if (u.is_admin) return <Badge className="bg-primary/20 text-primary">Admin</Badge>;
    if (u.role === "moderator") return <Badge className="bg-chart-2/20 text-chart-2">Moderator</Badge>;
    return <Badge variant="secondary">User</Badge>;
  };

  const getInitials = (u: any) => {
    const name = u.full_name || u.first_name || u.last_name || "";
    return name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1 text-foreground">Users</h1>
        <p className="text-muted-foreground">Manage platform users, roles, and access.</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full pl-9 pr-8 py-2 text-sm border border-border rounded-lg focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/20 focus-visible:outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                <XCircle className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
          </Select>
          {pagination.totalCount > 0 && (
            <span className="text-sm text-muted-foreground whitespace-nowrap">{pagination.totalCount} user{pagination.totalCount !== 1 ? "s" : ""}</span>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No users found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-center">Projects</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">
                    <span className="inline-flex items-center justify-center gap-1.5" title="Show avatar on homepage">
                      <UsersRound className="w-4 h-4 shrink-0" aria-hidden />
                      <span>Homepage</span>
                    </span>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={u.avatar_url} alt={u.full_name || "User"} />
                          <AvatarFallback className="text-xs">{getInitials(u)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{u.full_name || u.first_name || "—"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(u)}</TableCell>
                    <TableCell className="text-center">{u.total_submissions || 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      {u.is_banned
                        ? <Badge variant="destructive">Banned</Badge>
                        : <Badge variant="secondary" className="bg-green-500/20 text-green-600">Active</Badge>
                      }
                    </TableCell>
                    <TableCell className="text-center">
                      {u.avatar_url ? (
                        <button
                          type="button"
                          onClick={() => handleSocialProofToggle(u.id)}
                          role="checkbox"
                          aria-checked={socialProofSelectedIds.includes(u.id)}
                          aria-label={`${socialProofSelectedIds.includes(u.id) ? "Remove" : "Add"} ${u.full_name || u.first_name || "user"} from homepage avatars`}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded border-2 transition-colors ${
                            socialProofSelectedIds.includes(u.id)
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-muted-foreground/50"
                          }`}
                        >
                          {socialProofSelectedIds.includes(u.id) ? (
                            <span className="text-sm font-bold" aria-hidden>✓</span>
                          ) : null}
                        </button>
                      ) : (
                        <span className="text-muted-foreground/50 text-xs" title="No avatar">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-1">
                              <ShieldCheck className="w-4 h-4" /> Role
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRoleChange(u.id, "user")}>User</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(u.id, "moderator")}>Moderator</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(u.id, "admin")}>Admin</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={u.is_banned ? "text-green-600" : "text-destructive"}
                          onClick={() => handleBanToggle(u.id, u.is_banned)}
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          {u.is_banned ? "Unban" : "Ban"}
                        </Button>
                        <Link href={`/user/${u.id}`} target="_blank">
                          <Button variant="ghost" size="sm"><ExternalLink className="w-4 h-4" /></Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {pagination.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(p) => fetchUsers(p)}
          />
        </div>
      )}
    </>
  );
}
