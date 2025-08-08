import React, { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "./button";

/**
 * ImageUpload component for handling image uploads
 * For now, this creates a placeholder/preview system
 * In production, you'd integrate with a service like Cloudinary, AWS S3, etc.
 */
export function ImageUpload({
  value,
  onChange,
  className = "",
  placeholder = "Upload image",
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB
}) {
  const [preview, setPreview] = useState(value || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      setError(
        `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
      );
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // For production, you would upload to a service here
      // For now, we'll simulate an upload and use a placeholder
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Generate a placeholder URL (in production, this would be the actual uploaded URL)
      const uploadedUrl = `/api/placeholder/400/300?text=${encodeURIComponent(
        file.name
      )}`;

      onChange?.(uploadedUrl);
    } catch (err) {
      setError("Failed to upload image");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border border-gray-200"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleRemove}
              className="bg-white text-gray-900 hover:bg-gray-100"
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-sm text-gray-600">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-1">{placeholder}</p>
              <p className="text-xs text-gray-400">
                PNG, JPG, WebP up to {Math.round(maxSize / 1024 / 1024)}MB
              </p>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default ImageUpload;
