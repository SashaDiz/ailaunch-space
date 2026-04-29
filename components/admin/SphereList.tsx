"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import toast from "react-hot-toast";
import { SphereCard } from "./SphereCard";

interface SphereListProps {
  categories: any[];
  sphereOrder: string[];
  onEditCategory: (category: any) => void;
  onDeleteCategory: (category: any) => void;
  onAddCategory: (sphere: string) => void;
  onDeleteSphere: (sphere: string) => void;
  onReorderComplete: () => void;
  onSetSphereOrder: (order: string[]) => void;
  onSetCategories: (categories: any[]) => void;
}

export function SphereList({
  categories,
  sphereOrder,
  onEditCategory,
  onDeleteCategory,
  onAddCategory,
  onDeleteSphere,
  onReorderComplete,
  onSetSphereOrder,
  onSetCategories,
}: SphereListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const categoriesBySphere = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const sphere of sphereOrder) {
      map[sphere] = [];
    }
    for (const cat of categories) {
      const s = cat.sphere || "";
      if (!map[s]) map[s] = [];
      map[s].push(cat);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a: any, b: any) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
    }
    return map;
  }, [categories, sphereOrder]);

  const sphereIds = sphereOrder.map((s) => `sphere::${s}`);

  // Helper: find which sphere a category ID belongs to
  const findCategorySphere = useCallback(
    (categoryId: string) => {
      const cat = categories.find((c) => c.id === categoryId);
      return cat?.sphere || "";
    },
    [categories]
  );

  const persistOrder = async (newSphereOrder: string[], newCategories: any[]) => {
    const catsBySphere: Record<string, any[]> = {};
    for (const s of newSphereOrder) {
      catsBySphere[s] = [];
    }
    for (const cat of newCategories) {
      const s = cat.sphere || "";
      if (!catsBySphere[s]) catsBySphere[s] = [];
      catsBySphere[s].push(cat);
    }
    for (const key of Object.keys(catsBySphere)) {
      catsBySphere[key].sort((a: any, b: any) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
    }

    const order = newSphereOrder.map((sphere) => ({
      sphere,
      categoryIds: (catsBySphere[sphere] || []).map((c: any) => c.id),
    }));

    try {
      const res = await fetch("/api/admin/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
      if (!res.ok) {
        throw new Error((await res.json()).error || "Failed to save order");
      }
    } catch (error: any) {
      toast.error(error.message);
      onReorderComplete(); // Refresh from server to revert
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  // Handle cross-sphere moves during drag (before drop)
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!active || !over) return;

    const activeStr = String(active.id);
    const overStr = String(over.id);

    // Only handle category drags
    if (!activeStr.startsWith("category::")) return;

    const activeCatId = activeStr.replace("category::", "");
    const activeSphere = findCategorySphere(activeCatId);

    let targetSphere: string | null = null;

    if (overStr.startsWith("category::")) {
      const overCatId = overStr.replace("category::", "");
      const overSphere = findCategorySphere(overCatId);
      if (activeSphere === overSphere) return; // same sphere, handled by onDragEnd
      targetSphere = overSphere;
    } else if (overStr.startsWith("sphere::")) {
      targetSphere = overStr.replace("sphere::", "");
      if (activeSphere === targetSphere) return;
    }

    if (!targetSphere) return;

    // Move category to the target sphere in local state
    const newCategories = categories.map((c) =>
      c.id === activeCatId ? { ...c, sphere: targetSphere } : c
    );
    onSetCategories(newCategories);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!active || !over) return;

    const activeStr = String(active.id);
    const overStr = String(over.id);

    // Sphere reorder
    if (activeStr.startsWith("sphere::") && overStr.startsWith("sphere::")) {
      if (active.id === over.id) return;
      const activeSphere = activeStr.replace("sphere::", "");
      const overSphere = overStr.replace("sphere::", "");
      const oldIndex = sphereOrder.indexOf(activeSphere);
      const newIndex = sphereOrder.indexOf(overSphere);
      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove(sphereOrder, oldIndex, newIndex);
      onSetSphereOrder(newOrder);
      persistOrder(newOrder, categories);
      return;
    }

    // Category reorder / cross-sphere move finalization
    if (activeStr.startsWith("category::")) {
      const activeCatId = activeStr.replace("category::", "");

      if (overStr.startsWith("category::")) {
        const overCatId = overStr.replace("category::", "");
        if (activeCatId === overCatId) {
          // Dropped on itself — might have been moved cross-sphere by onDragOver, persist that
          persistOrder(sphereOrder, categories);
          return;
        }

        // Both categories should now be in the same sphere (onDragOver moved it if needed)
        const activeCat = categories.find((c) => c.id === activeCatId);
        const overCat = categories.find((c) => c.id === overCatId);
        if (!activeCat || !overCat) return;

        const sphere = activeCat.sphere || "";
        const sphereCats = (categoriesBySphere[sphere] || []).slice();
        const oldIdx = sphereCats.findIndex((c: any) => c.id === activeCatId);
        const newIdx = sphereCats.findIndex((c: any) => c.id === overCatId);
        if (oldIdx === -1 || newIdx === -1) {
          // Category was just moved to this sphere, append it
          persistOrder(sphereOrder, categories);
          return;
        }

        const reordered = arrayMove(sphereCats, oldIdx, newIdx);

        const newCategories = categories.map((c) => {
          const idx = reordered.findIndex((r: any) => r.id === c.id);
          if (idx !== -1) {
            const sphereIdx = sphereOrder.indexOf(sphere);
            return { ...c, sort_order: sphereIdx * 1000 + idx };
          }
          return c;
        });

        onSetCategories(newCategories);
        persistOrder(sphereOrder, newCategories);
      } else if (overStr.startsWith("sphere::")) {
        // Dropped on a sphere header — category already moved by onDragOver, just persist
        persistOrder(sphereOrder, categories);
      }
    }
  };

  const activeDragItem = useMemo(() => {
    if (!activeId) return null;
    if (activeId.startsWith("sphere::")) {
      return { type: "sphere" as const, name: activeId.replace("sphere::", "") };
    }
    if (activeId.startsWith("category::")) {
      const cat = categories.find((c) => c.id === activeId.replace("category::", ""));
      return cat ? { type: "category" as const, category: cat } : null;
    }
    return null;
  }, [activeId, categories]);

  if (sphereOrder.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-[var(--radius)] p-12 text-center text-muted-foreground">
        No spheres yet. Create your first sphere to organize categories.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sphereIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {sphereOrder.map((sphere) => (
            <SphereCard
              key={sphere}
              sphere={sphere}
              categories={categoriesBySphere[sphere] || []}
              onEditCategory={onEditCategory}
              onDeleteCategory={onDeleteCategory}
              onAddCategory={onAddCategory}
              onDeleteSphere={onDeleteSphere}
              onRenameSphere={onReorderComplete}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeDragItem?.type === "sphere" && (
          <div className="rounded-[var(--radius)] border border-primary/50 bg-card px-4 py-3 shadow-lg opacity-90">
            <span className="font-semibold text-sm">{activeDragItem.name}</span>
          </div>
        )}
        {activeDragItem?.type === "category" && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-card border border-primary/50 rounded-[var(--radius)] shadow-lg opacity-90">
            {activeDragItem.category.color && (
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: activeDragItem.category.color }} />
            )}
            <span className="font-medium text-sm">{activeDragItem.category.name}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
