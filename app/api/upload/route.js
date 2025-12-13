import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Initialize S3 client for Supabase Storage
const s3Client = new S3Client({
  endpoint: process.env.SUPABASE_S3_ENDPOINT,
  region: process.env.SUPABASE_S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // Required for Supabase S3
});

const BUCKET_NAME = process.env.SUPABASE_S3_BUCKET || "logos";
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
    const supabase = createServerClient(
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
    
    const { data: { user } } = await supabase.auth.getUser();
    
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
    const filePath = fileName; // Don't include bucket name here since it's already in BUCKET_NAME

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
      Body: buffer,
      ContentType: file.type,
      CacheControl: "public, max-age=31536000",
    });

    await s3Client.send(command);

    // Construct public URL - fix the URL format for Supabase Storage
    const baseUrl = process.env.SUPABASE_S3_ENDPOINT.replace('/storage/v1/s3', '');
    const publicUrl = `${baseUrl}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;

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

