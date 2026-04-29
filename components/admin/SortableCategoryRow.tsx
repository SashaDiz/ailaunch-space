"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SortableCategoryRowProps {
  category: any;
  onEdit: (category: any) => void;
  onDelete: (category: any) => void;
}

export function SortableCategoryRow({ category, onEdit, onDelete }: SortableCategoryRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `category::${category.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-4 py-2.5 bg-background border border-border rounded-[var(--radius)] group"
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {category.color && (
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: category.color }}
        />
      )}

      <span className="font-medium text-sm flex-1">{category.name}</span>
      <span className="text-xs text-muted-foreground hidden sm:inline">{category.slug}</span>
      <span className="text-xs text-muted-foreground tabular-nums">{category.app_count || 0} projects</span>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEdit(category)}>
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          onClick={() => onDelete(category)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
