import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { v4 as uuidv4 } from "uuid";

const BUCKET_NAME = process.env.SUPABASE_S3_BUCKET || "storage";
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// Magic number signatures for image validation (first bytes of file)
const IMAGE_SIGNATURES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header
};

// Validate file content by checking magic numbers
async function validateFileContent(file, expectedType) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  if (expectedType === 'image/jpeg' || expectedType === 'image/jpg') {
    return bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
  }
  
  if (expectedType === 'image/png') {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
  }
  
  if (expectedType === 'image/webp') {
    // WebP files start with RIFF header
    return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
  }
  
  return false;
}

export async function POST(request) {
  try {
    // Check rate limiting first
    const rateLimitResult = await checkRateLimit(request, 'upload');
    if (!rateLimitResult.allowed) {
      const rateLimitResponse = createRateLimitResponse(rateLimitResult);
      return new NextResponse(rateLimitResponse.body, {
        status: rateLimitResponse.status,
        headers: rateLimitResponse.headers,
      });
    }

    // Check authentication - file uploads require authentication
    const cookieStore = await cookies();
    const supabase = createServerClient(
      getSupabaseUrl(),
      getSupabasePublishableKey(),
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user?.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Authentication required. Please sign in to upload files.",
          code: "UNAUTHORIZED"
        },
        { status: 401 }
      );
    }

    // Check if request contains form data
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type by MIME type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Only JPEG, PNG, and WebP are allowed.",
          code: "INVALID_FILE_TYPE"
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
          code: "FILE_TOO_LARGE"
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
          code: "EMPTY_FILE"
        },
        { status: 400 }
      );
    }

    // Validate file content by checking magic numbers (prevents MIME type spoofing)
    const isValidContent = await validateFileContent(file, file.type);
    if (!isValidContent) {
      return NextResponse.json(
        {
          success: false,
          error: "File content does not match the declared file type. Please upload a valid image file.",
          code: "INVALID_FILE_CONTENT"
        },
        { status: 400 }
      );
    }

    // Sanitize filename - remove any path traversal attempts
    const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileExtension = sanitizedOriginalName.split(".").pop()?.toLowerCase();
    
    // Validate extension matches allowed types
    const extensionMap = {
      'jpeg': 'image/jpeg',
      'jpg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp'
    };
    
    if (!fileExtension || extensionMap[fileExtension] !== file.type) {
      return NextResponse.json(
        {
          success: false,
          error: "File extension does not match file type.",
          code: "INVALID_EXTENSION"
        },
        { status: 400 }
      );
    }

    // Generate unique filename with safe extension
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `logos/${fileName}`;

    // Use admin client for storage operations (server-side only)
    const supabaseAdmin = getSupabaseAdmin();

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
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

    // Get public URL using admin client
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

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
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload file",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
