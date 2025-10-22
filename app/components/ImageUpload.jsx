"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Xmark, CloudUpload } from "iconoir-react";
import toast from "react-hot-toast";

export default function ImageUpload({ 
  value, 
  onChange, 
  error,
  label = "Logo",
  maxSize = 1, // in MB
  required = false 
}) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(value || "");
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef(null);

  // Sync preview with value prop changes
  useEffect(() => {
    setPreview(value || "");
    setImageError(false); // Reset error state when preview changes
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
    // Check file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload JPEG, PNG, or WebP image.");
      return false;
    }

    // Check file size
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

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const imageUrl = result.data.url;
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
    <div className="form-control w-full">
      <div className="label">
        <span className="label-text font-semibold text-base-content">
          {label} {required && <span className="text-error">*</span>}
        </span>
        <span className="label-text-alt text-base-content/60 font-medium">
          Max {maxSize}MB • PNG, JPG, WebP
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {/* Preview */}
        {preview && (
          <div className="relative inline-block">
            <div className="w-32 h-32 border-2 border-base-300 rounded-lg overflow-hidden bg-base-100 flex items-center justify-center">
              {!imageError ? (
                <Image
                  src={preview}
                  alt="Logo preview"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error("Image preview error:", e);
                    console.error("Failed URL:", preview);
                    setImageError(true);
                    toast.error("Failed to load image preview. Check if the URL is correct.");
                  }}
                  onLoad={() => {
                    // Image loaded successfully
                    console.log("Image preview loaded successfully:", preview);
                    setImageError(false);
                  }}
                  unoptimized={true} // Always unoptimize for external URLs
                  priority={false}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-2">
                  <div className="text-4xl text-base-content/40 mb-1">🖼️</div>
                  <div className="text-xs text-base-content/60">Image failed to load</div>
                  <button
                    type="button"
                    onClick={() => {
                      setImageError(false);
                      // Force reload by updating the src
                      const currentSrc = preview;
                      setPreview("");
                      setTimeout(() => setPreview(currentSrc), 100);
                    }}
                    className="btn btn-xs btn-outline mt-1"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 btn btn-circle btn-sm btn-error"
              disabled={uploading}
              title="Remove image"
            >
              <Xmark className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg transition-all ${
            dragActive
              ? "border-[#ED0D79] bg-[#ED0D79]/5"
              : error
              ? "border-error"
              : "border-base-300 hover:border-[#ED0D79]/50"
          } ${uploading ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
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
            <CloudUpload
              className={`w-8 h-8 mb-4 ${
                dragActive ? "text-[#ED0D79]" : "text-base-content/40"
              }`}
            />

            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <span className="loading loading-spinner loading-md"></span>
                <p className="text-sm text-base-content/70">Uploading...</p>
              </div>
            ) : (
              <>
                <p className="text-base font-medium mb-1">
                  {dragActive
                    ? "Drop your image here"
                    : "Drag & drop your image here"}
                </p>
                <p className="text-sm text-base-content/60 mb-3">or</p>
                <button
                  type="button"
                  className="btn btn-sm text-white transition-all duration-200 hover:opacity-90"
                  style={{ backgroundColor: '#ED0D79', boxShadow: 'none' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick();
                  }}
                >
                  Browse Files
                </button>
                <p className="text-xs text-base-content/50 mt-3">
                  Recommended: 256x256px or larger, square format
                </p>
              </>
            )}
          </div>
        </div>

        {/* URL Input Option */}
        <div className="divider text-sm text-base-content/50">OR</div>
        
        <div>
          <label className="label">
            <span className="label-text font-semibold text-base-content">Paste image URL</span>
          </label>
          <input
            type="url"
            placeholder="https://example.com/logo.png"
            className={`input input-bordered w-full transition-all duration-200 focus-visible:border-[#ED0D79] focus-visible:ring-2 focus-visible:ring-[#ED0D79]/20 focus-visible:outline-none ${
              error ? "input-error border-error" : "border-base-300"
            }`}
            style={{
              boxShadow: error ? '0 0 0 2px rgba(248, 113, 113, 0.2)' : 'none'
            }}
            value={preview}
            onChange={(e) => {
              const url = e.target.value;
              setPreview(url);
              onChange(url);
            }}
            onBlur={(e) => {
              // Validate URL format on blur
              const url = e.target.value;
              if (url && url.trim() !== "") {
                try {
                  new URL(url);
                  // URL is valid, keep it
                  setImageError(false); // Reset error state for valid URLs
                } catch (error) {
                  // Invalid URL, but don't clear it - let the parent component handle validation
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
        <div className="text-error text-sm mt-2 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}

