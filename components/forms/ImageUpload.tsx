"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, UploadCloud, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  error: string | null;
  label?: string;
  maxSize?: number;
  required?: boolean;
  formatHint?: string;
}

export default function ImageUpload({
  value,
  onChange,
  error,
  label = "Logo",
  maxSize = 1, // in MB
  required = false,
  formatHint,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(value || "");
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef(null);

  const sanitizeUrl = (url) => (typeof url === "string" ? url.trim() : "");
  const isValidUrl = (url) => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Sync preview with value prop changes
  useEffect(() => {
    setPreview(sanitizeUrl(value));
    setImageError(false);
  }, [value]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload JPEG, PNG, or WebP image.");
      return false;
    }

    const maxSizeInBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      toast.error(`File too large. Maximum size is ${maxSize}MB.`);
      return false;
    }

    return true;
  };

  const uploadFile = async (file) => {
    if (!validateFile(file)) {
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Uploading image...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload-supabase", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const imageUrl = sanitizeUrl(result.data.url);
        setPreview(imageUrl);
        onChange(imageUrl);
        toast.success("Image uploaded successfully!", { id: toastId });
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload image", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await uploadFile(file);
    }
  };

  const handleChange = async (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await uploadFile(file);
    }
  };

  const handleRemove = () => {
    setPreview("");
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <Label className="font-semibold text-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        <span className="text-xs text-muted-foreground font-medium">
          Max {maxSize}MB &bull; PNG, JPG, WebP
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {/* Preview */}
        {preview && (
          <div className="relative inline-block">
            <div className="w-32 h-32 border-2 border-border rounded-lg overflow-hidden bg-background flex items-center justify-center">
              {!imageError && isValidUrl(preview) ? (
                <img
                  src={preview}
                  alt="Logo preview"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const failedSrc = e?.currentTarget?.src || preview;
                    console.warn("Image preview failed to load", { src: failedSrc });
                    setImageError(true);
                    toast.error("Failed to load image preview. Check if the URL is correct.");
                  }}
                  onLoad={() => {
                    setImageError(false);
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-2">
                  <div className="text-4xl text-muted-foreground/40 mb-1">🖼️</div>
                  <div className="text-xs text-muted-foreground">Image failed to load</div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-1 h-6 text-xs"
                    onClick={() => {
                      setImageError(false);
                      const currentSrc = preview;
                      setPreview("");
                      setTimeout(() => setPreview(currentSrc), 100);
                    }}
                  >
                    Retry
                  </Button>
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={handleRemove}
              disabled={uploading}
              title="Remove image"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Upload Area */}
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg transition-all",
            dragActive
              ? "border-foreground bg-foreground/5"
              : error
              ? "border-destructive"
              : "border-border hover:border-foreground/50",
            uploading ? "opacity-50 pointer-events-none" : "cursor-pointer"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleChange}
            disabled={uploading}
          />

          <div className="flex flex-col items-center justify-center p-8 text-center">
            <UploadCloud
              className={cn(
                "w-8 h-8 mb-4",
                dragActive ? "text-foreground" : "text-muted-foreground/40"
              )}
            />

            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <>
                <p className="text-base font-medium mb-1">
                  {dragActive
                    ? "Drop your image here"
                    : "Drag & drop your image here"}
                </p>
                <p className="text-sm text-muted-foreground mb-3">or</p>
                <Button
                  type="button"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick();
                  }}
                >
                  Browse Files
                </Button>
                <p className="text-xs text-muted-foreground/70 mt-3">
                  {formatHint ?? "Recommended: 256x256px or larger, square format"}
                </p>
              </>
            )}
          </div>
        </div>

        {/* URL Input Option */}
        <div className="flex items-center gap-4">
          <Separator className="flex-1" />
          <span className="text-sm text-muted-foreground">OR</span>
          <Separator className="flex-1" />
        </div>

        <div className="space-y-2">
          <Label className="font-semibold text-foreground">Paste image URL</Label>
          <Input
            type="url"
            placeholder="https://example.com/logo.png"
            className={cn(
              "transition-all duration-200",
              error && "border-destructive focus-visible:ring-destructive"
            )}
            value={preview}
            onChange={(e) => {
              const url = e.target.value;
              const cleanedUrl = sanitizeUrl(url);
              setPreview(cleanedUrl);
              onChange(cleanedUrl);
            }}
            onBlur={(e) => {
              const url = e.target.value;
              if (url && url.trim() !== "") {
                try {
                  new URL(url);
                  setImageError(false);
                } catch (error) {
                  console.warn("Invalid URL format:", url);
                  setImageError(true);
                }
              }
            }}
            disabled={uploading}
          />
        </div>
      </div>

      {error && (
        <div className="text-destructive text-sm mt-2 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
