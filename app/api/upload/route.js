import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

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

export async function POST(request) {
  try {
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

    // Generate unique filename
    const fileExtension = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = fileName; // Don't include bucket name here since it's already in BUCKET_NAME

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

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

