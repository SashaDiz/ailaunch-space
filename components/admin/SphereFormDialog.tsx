"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface SphereFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingSpheres: string[];
  onCreated: (name: string) => void;
}

export function SphereFormDialog({ open, onOpenChange, existingSpheres, onCreated }: SphereFormDialogProps) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setName("");
  }, [open]);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Sphere name is required");
      return;
    }
    if (existingSpheres.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("A sphere with this name already exists");
      return;
    }
    setSaving(true);
    try {
      onCreated(trimmed);
      onOpenChange(false);
      toast.success(`Sphere "${trimmed}" created`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New Sphere</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Software, Creative, Business"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
