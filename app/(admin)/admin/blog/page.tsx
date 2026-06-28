"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import toast from "react-hot-toast";
import { Plus, Pencil, Copy, Trash2, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Pagination from "@/components/shared/Pagination";
import { AdminRowsSkeleton } from "@/components/admin/AdminSkeletons";
import { AdminPageActions } from "@/components/admin/AdminPageHeader";
import { BlogPostFormDialog } from "@/components/admin/BlogPostFormDialog";
import { staggerContainer, fadeInUpItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface BlogPostRow {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "scheduled" | "published";
  category?: string | null;
  published_at?: string | null;
  reading_time?: number;
  created_at?: string;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  published: "default",
  scheduled: "secondary",
  draft: "outline",
};

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPostRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (status !== "all") params.set("status", status);
      const res = await fetch(`/api/admin/blog?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load posts");
      setPosts(data.data.posts || []);
      setTotalPages(data.data.totalPages || 1);
      setSelected(new Set());
    } catch (error: any) {
      toast.error(error.message);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const allSelected = posts.length > 0 && selected.size === posts.length;

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(posts.map((p) => p.id)));
  };
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (row: BlogPostRow) => {
    // The list GET returns full rows (content included), so edit directly.
    setEditing(row);
    setFormOpen(true);
  };

  const duplicate = async (row: BlogPostRow) => {
    const t = toast.loading("Duplicating…");
    try {
      const res = await fetch(`/api/admin/blog?action=duplicate&id=${row.id}`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to duplicate");
      toast.success("Post duplicated", { id: t });
      fetchPosts();
    } catch (error: any) {
      toast.error(error.message, { id: t });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const single = deleteTarget.ids.length === 1;
      const res = await fetch(
        single ? `/api/admin/blog?id=${deleteTarget.ids[0]}` : "/api/admin/blog",
        single
          ? { method: "DELETE" }
          : {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ids: deleteTarget.ids }),
            }
      );
      if (!res.ok) throw new Error((await res.json()).error || "Failed to delete");
      toast.success(single ? "Post deleted" : `${deleteTarget.ids.length} posts deleted`);
      setDeleteTarget(null);
      fetchPosts();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  const selectedRows = useMemo(() => posts.filter((p) => selected.has(p.id)), [posts, selected]);

  return (
    <div>
      <AdminPageActions>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts…"
            className="w-44 pl-8"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> New Post
        </Button>
      </AdminPageActions>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <motion.div
          variants={fadeInUpItem}
          initial="hidden"
          animate="visible"
          className="mb-4 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5"
        >
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() =>
              setDeleteTarget({
                ids: selectedRows.map((r) => r.id),
                label: `${selectedRows.length} posts`,
              })
            }
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </motion.div>
      )}

      {loading ? (
        <AdminRowsSkeleton rows={6} />
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <FileText className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="mb-4 text-muted-foreground">No posts yet. Create your first article.</p>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> New Post
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-border lg:block">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Published</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Read</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <motion.tbody
                className="divide-y divide-border"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {posts.map((post) => (
                  <motion.tr
                    key={post.id}
                    variants={fadeInUpItem}
                    className={cn("transition-colors hover:bg-muted/50", selected.has(post.id) && "bg-muted/40")}
                  >
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selected.has(post.id)}
                        onCheckedChange={() => toggleOne(post.id)}
                        aria-label={`Select ${post.title}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{post.title}</span>
                      <span className="block text-xs text-muted-foreground">/{post.slug}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[post.status]} className="capitalize">
                        {post.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{post.category || "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(post.published_at)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{post.reading_time || 1} min</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(post)} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicate(post)} aria-label="Duplicate">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteTarget({ ids: [post.id], label: post.title })}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <motion.div
            className="space-y-3 lg:hidden"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {posts.map((post) => (
              <motion.div
                key={post.id}
                variants={fadeInUpItem}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={selected.has(post.id)} onCheckedChange={() => toggleOne(post.id)} />
                      <span className="truncate font-medium">{post.title}</span>
                    </div>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">/{post.slug}</span>
                  </div>
                  <Badge variant={STATUS_VARIANT[post.status]} className="shrink-0 capitalize">
                    {post.status}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{post.category || "Uncategorized"}</span>
                  <span>{formatDate(post.published_at)} · {post.reading_time || 1} min</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(post)}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => duplicate(post)}>
                    <Copy className="mr-1.5 h-3.5 w-3.5" /> Duplicate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setDeleteTarget({ ids: [post.id], label: post.title })}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      <BlogPostFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        post={editing}
        onSuccess={fetchPosts}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.ids.length === 1 ? "post" : "posts"}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.ids.length === 1
                ? `“${deleteTarget?.label}” will be permanently removed.`
                : `${deleteTarget?.label} will be permanently removed.`}{" "}
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
