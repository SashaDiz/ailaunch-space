"use client";

import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { GripVertical, ChevronDown, ChevronRight, Pencil, Trash2, Plus, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SortableCategoryRow } from "./SortableCategoryRow";

interface SphereCardProps {
  sphere: string;
  categories: any[];
  onEditCategory: (category: any) => void;
  onDeleteCategory: (category: any) => void;
  onAddCategory: (sphere: string) => void;
  onDeleteSphere: (sphere: string) => void;
  onRenameSphere: () => void;
}

export function SphereCard({
  sphere,
  categories,
  onEditCategory,
  onDeleteCategory,
  onAddCategory,
  onDeleteSphere,
  onRenameSphere,
}: SphereCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(sphere);
  const [saving, setSaving] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `sphere::${sphere}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const categoryIds = categories.map((c) => `category::${c.id}`);

  const handleStartEdit = () => {
    setEditName(sphere);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(sphere);
  };

  const handleSaveEdit = async () => {
    const trimmed = editName.trim();
    if (!trimmed) {
      toast.error("Sphere name cannot be empty");
      return;
    }
    if (trimmed === sphere) {
      handleCancelEdit();
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/admin/categories/spheres", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName: sphere, newName: trimmed }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to rename sphere");
      }
      toast.success(`Sphere renamed to "${trimmed}"`);
      setIsEditing(false);
      onRenameSphere();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-[var(--radius)] border border-border bg-card overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/50">
          <button
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4" />
          </button>

          <CollapsibleTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground">
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </CollapsibleTrigger>

          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8 w-48"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit();
                  if (e.key === "Escape") handleCancelEdit();
                }}
              />
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-600" onClick={handleSaveEdit} disabled={saving}>
                <Check className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleCancelEdit} disabled={saving}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <span className="font-semibold text-sm flex-1">{sphere}</span>
          )}

          <Badge variant="secondary" className="text-xs">
            {categories.length} {categories.length === 1 ? "category" : "categories"}
          </Badge>

          {!isEditing && (
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleStartEdit}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                disabled={categories.length > 0}
                onClick={() => onDeleteSphere(sphere)}
                title={categories.length > 0 ? "Remove all categories first" : "Delete sphere"}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        <CollapsibleContent>
          <div className="p-3 space-y-2">
            <SortableContext items={categoryIds} strategy={verticalListSortingStrategy}>
              {categories.map((cat) => (
                <SortableCategoryRow
                  key={cat.id}
                  category={cat}
                  onEdit={onEditCategory}
                  onDelete={onDeleteCategory}
                />
              ))}
            </SortableContext>

            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No categories yet. Add a category to save this sphere.
              </p>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground hover:text-foreground gap-1.5"
              onClick={() => onAddCategory(sphere)}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Category
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
