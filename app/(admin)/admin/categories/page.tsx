"use client";

import React, { useState, useEffect } from "react";
import { Plus, FolderPlus } from "lucide-react";
import toast from "react-hot-toast";
import { CategoryFormDialog } from '@/components/admin/CategoryFormDialog';
import { SphereFormDialog } from '@/components/admin/SphereFormDialog';
import { SphereList } from '@/components/admin/SphereList';
import { Button } from '@/components/ui/button';
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

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [sphereOrder, setSphereOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Category form
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [defaultSphere, setDefaultSphere] = useState<string | undefined>();

  // Sphere form
  const [sphereFormOpen, setSphereFormOpen] = useState(false);

  // Delete dialogs
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteSphereTarget, setDeleteSphereTarget] = useState<string | null>(null);
  const [deletingSphere, setDeletingSphere] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/categories");
      if (response.ok) {
        const data = await response.json();
        const cats = data.data.categories || [];
        const serverSpheres: string[] = data.data.spheres || [];

        setCategories(cats);
        // Preserve locally-added empty spheres that are not yet on the server
        setSphereOrder((prev) => {
          const merged = [...serverSpheres];
          for (const s of prev) {
            if (!merged.includes(s)) {
              // Only keep local sphere if it was explicitly created (not from server)
              // Check if it has no categories on server — if so, it's a locally-created empty sphere
              const hasCats = cats.some((c: any) => c.sphere === s);
              if (!hasCats) merged.push(s);
            }
          }
          return merged;
        });
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/categories?id=${deleteTarget.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      toast.success("Category deleted");
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete category");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleDeleteSphere = async () => {
    if (!deleteSphereTarget) return;
    const count = categories.filter((c) => c.sphere === deleteSphereTarget).length;
    if (count > 0) {
      toast.error("Cannot delete sphere with categories. Remove all categories first.");
      setDeleteSphereTarget(null);
      return;
    }

    setDeletingSphere(true);
    try {
      const response = await fetch(`/api/admin/categories/spheres?name=${encodeURIComponent(deleteSphereTarget)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete sphere");
      }
      // Remove from local state
      setSphereOrder((prev) => prev.filter((s) => s !== deleteSphereTarget));
      toast.success("Sphere deleted");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeletingSphere(false);
      setDeleteSphereTarget(null);
    }
  };

  const handleAddCategory = (sphere: string) => {
    setEditingCategory(null);
    setDefaultSphere(sphere);
    setFormOpen(true);
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setDefaultSphere(undefined);
    setFormOpen(true);
  };

  const handleSphereCreated = (name: string) => {
    setSphereOrder((prev) => [...prev, name]);
  };

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1 text-foreground">Categories</h1>
          <p className="text-muted-foreground">Manage directory spheres and categories.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setSphereFormOpen(true)} className="gap-2">
            <FolderPlus className="w-4 h-4" /> Add Sphere
          </Button>
          <Button onClick={() => { setEditingCategory(null); setDefaultSphere(undefined); setFormOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Add Category
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Loading...</div>
      ) : (
        <SphereList
          categories={categories}
          sphereOrder={sphereOrder}
          onEditCategory={handleEditCategory}
          onDeleteCategory={setDeleteTarget}
          onAddCategory={handleAddCategory}
          onDeleteSphere={setDeleteSphereTarget}
          onReorderComplete={fetchCategories}
          onSetSphereOrder={setSphereOrder}
          onSetCategories={setCategories}
        />
      )}

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editingCategory}
        spheres={sphereOrder}
        defaultSphere={defaultSphere}
        onSuccess={fetchCategories}
      />

      <SphereFormDialog
        open={sphereFormOpen}
        onOpenChange={setSphereFormOpen}
        existingSpheres={sphereOrder}
        onCreated={handleSphereCreated}
      />

      {/* Delete category dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deleteTarget?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Categories with assigned projects cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete sphere dialog */}
      <AlertDialog open={!!deleteSphereTarget} onOpenChange={() => setDeleteSphereTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete sphere &quot;{deleteSphereTarget}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the sphere grouping. Only empty spheres can be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingSphere}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSphere} disabled={deletingSphere} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deletingSphere ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
