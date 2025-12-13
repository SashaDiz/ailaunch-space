import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET_NAME = "avatars";
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_REQUEST_SIZE = 5 * 1024 * 1024; // 5MB max request size

// Validate file is actually an image by checking magic bytes
function validateImageContent(buffer) {
  if (!buffer || buffer.length < 4) return false;
  
  // Check magic bytes for different image formats
  const bytes = new Uint8Array(buffer);
  
  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;
  
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;
  
  // WebP: Check for "RIFF" and "WEBP"
  if (bytes.length >= 12) {
    const header = String.fromCharCode(...bytes.slice(0, 4));
    const format = String.fromCharCode(...bytes.slice(8, 12));
    if (header === 'RIFF' && format === 'WEBP') return true;
  }
  
  return false;
}

export async function POST(request) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const authSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    const { data: { user } } = await authSupabase.auth.getUser();
    
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check request size
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      return NextResponse.json(
        { success: false, error: "Request too large. Maximum size is 5MB." },
        { status: 413 }
      );
    }

    // Check if request contains form data
    const formData = await request.formData();
    const file = formData.get("file");

    console.log("Upload request received:", {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type
    });

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Only JPEG, PNG, and WebP are allowed.",
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "File too large. Maximum size is 1MB.",
        },
        { status: 400 }
      );
    }

    // Validate file size is not zero
    if (file.size === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "File is empty.",
        },
        { status: 400 }
      );
    }

    // Convert file to buffer for content validation
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate file content (magic bytes) to prevent file type spoofing
    if (!validateImageContent(buffer)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file content. File must be a valid image.",
        },
        { status: 400 }
      );
    }

    // Sanitize filename to prevent path traversal
    const sanitizeFilename = (filename) => {
      // Remove any path components and dangerous characters
      const baseName = filename.split(/[/\\]/).pop() || 'file';
      // Remove any non-alphanumeric characters except dots and hyphens
      return baseName.replace(/[^a-zA-Z0-9.-]/g, '');
    };

    // Generate unique filename
    const sanitizedOriginalName = sanitizeFilename(file.name);
    const fileExtension = sanitizedOriginalName.split(".").pop()?.toLowerCase() || 'jpg';
    
    // Validate extension matches allowed types
    const extensionMap = {
      'jpg': 'jpg',
      'jpeg': 'jpg',
      'png': 'png',
      'webp': 'webp'
    };
    const validExtension = extensionMap[fileExtension] || 'jpg';
    
    const fileName = `${uuidv4()}.${validExtension}`;
    const filePath = `profile-images/${fileName}`;

    // Upload to Supabase Storage (use buffer instead of file object for security)
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      console.error("Supabase Storage upload error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to upload file to storage",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    console.log("Upload successful:", {
      fileName: fileName,
      filePath: filePath,
      publicUrl: publicUrl,
      fileSize: file.size,
      fileType: file.type
    });

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        fileName: fileName,
        filePath: filePath,
        fileSize: file.size,
        fileType: file.type,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    // Don't expose internal error details in production
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : "Failed to upload file. Please try again.";
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload file",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
