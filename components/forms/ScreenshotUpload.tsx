"use client";

import React, { useState, useRef } from "react";
import { X, UploadCloud, Loader2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const MAX_SCREENSHOTS = 5;
const MAX_FILE_SIZE_MB = 2;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function ScreenshotUpload({
  value = [],
  onChange,
  error,
}: {
  value?: string[];
  onChange: (urls: string[]) => void;
  error?: string;
}) {
  const urls = Array.isArray(value) ? value : [];
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFull = urls.length >= MAX_SCREENSHOTS;
  const remaining = MAX_SCREENSHOTS - urls.length;

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(`"${file.name}" — invalid type. Use JPEG, PNG, or WebP.`);
      return false;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`"${file.name}" — too large. Max ${MAX_FILE_SIZE_MB}MB.`);
      return false;
    }
    return true;
  };

  const uploadFiles = async (files: File[]) => {
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_SCREENSHOTS} screenshots allowed.`);
      return;
    }

    const batch = files.slice(0, remaining);
    if (files.length > remaining) {
      toast(`Only uploading ${remaining} of ${files.length} files (limit: ${MAX_SCREENSHOTS}).`);
    }

    const valid = batch.filter(validateFile);
    if (valid.length === 0) return;

    setUploading(true);
    const toastId = toast.loading(
      `Uploading ${valid.length} screenshot${valid.length > 1 ? "s" : ""}...`
    );

    try {
      const uploaded: string[] = [];

      for (const file of valid) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload-supabase", {
          method: "POST",
          body: formData,
        });
        const result = await res.json();

        if (res.ok && result.success) {
          uploaded.push(result.data.url);
        } else {
          throw new Error(result.error || `Failed to upload ${file.name}`);
        }
      }

      onChange([...urls, ...uploaded]);
      toast.success(
        `${uploaded.length} screenshot${uploaded.length > 1 ? "s" : ""} uploaded!`,
        { id: toastId }
      );
    } catch (err: any) {
      toast.error(err.message || "Upload failed", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) {
      await uploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      await uploadFiles(Array.from(e.target.files));
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = (index: number) => {
    onChange(urls.filter((_, i) => i !== index));
  };

  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      toast.error("Invalid URL.");
      return;
    }
    if (isFull) {
      toast.error(`Maximum ${MAX_SCREENSHOTS} screenshots allowed.`);
      return;
    }
    onChange([...urls, url]);
    setUrlInput("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="font-semibold text-foreground">Screenshots</Label>
        <span className="text-xs text-muted-foreground font-medium">
          {urls.length}/{MAX_SCREENSHOTS} &bull; Max {MAX_FILE_SIZE_MB}MB each
        </span>
      </div>

      {/* Thumbnails */}
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, index) => (
            <div key={`${url}-${index}`} className="relative group">
              <div className="w-28 h-20 border border-border rounded-lg overflow-hidden bg-muted">
                <img
                  src={url}
                  alt={`Screenshot ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
              <button
                type="button"
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(index)}
                disabled={uploading}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {!isFull && (
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg transition-all",
            dragActive
              ? "border-foreground bg-foreground/5"
              : "border-border hover:border-foreground/50",
            uploading ? "opacity-50 pointer-events-none" : "cursor-pointer"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleFileChange}
            disabled={uploading}
          />

          <div className="flex flex-col items-center justify-center p-6 text-center">
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <>
                <UploadCloud
                  className={cn(
                    "w-7 h-7 mb-2",
                    dragActive ? "text-foreground" : "text-muted-foreground/40"
                  )}
                />
                <p className="text-sm font-medium mb-1">
                  {dragActive ? "Drop screenshots here" : "Drag & drop screenshots here"}
                </p>
                <p className="text-xs text-muted-foreground mb-2">or</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Browse Files
                </Button>
                <p className="text-xs text-muted-foreground/60 mt-2">
                  PNG, JPG, WebP &bull; up to {remaining} more
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add by URL */}
      {!isFull && (
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="Or paste screenshot URL"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddUrl();
              }
            }}
            disabled={uploading}
            className="text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAddUrl}
            disabled={uploading || !urlInput.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}

      {error && (
        <p className="text-destructive text-sm">{error}</p>
      )}
    </div>
  );
}
