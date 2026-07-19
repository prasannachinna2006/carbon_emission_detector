// ==================================================
// BlueChain MRV — Storage Utilities
// src/lib/storage.ts
// ==================================================
// Provides type-safe, validated helpers for uploading
// and accessing images in the monitoring-images bucket.
//
// Security:
// - Only authenticated users can upload
// - Path is always {user_id}/{report_id}/{uuid}.ext
//   so RLS ensures users can only write to their folder
// - File type checked before upload
// - File size checked before upload
// ==================================================

import { supabase } from "@/integrations/supabase/client";

// --------------------------------------------------
// Constants
// --------------------------------------------------

export const STORAGE_BUCKET = "monitoring-images";

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_FILE_SIZE_LABEL = "10 MB";

// --------------------------------------------------
// Validation
// --------------------------------------------------

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): FileValidationResult {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type || "unknown"}. Please upload a JPEG, PNG, or WebP image.`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeMB} MB). Maximum allowed size is ${MAX_FILE_SIZE_LABEL}.`,
    };
  }

  // Check that file is not empty
  if (file.size === 0) {
    return {
      valid: false,
      error: "File appears to be empty. Please select a valid image.",
    };
  }

  return { valid: true };
}

// --------------------------------------------------
// Path Generation
// --------------------------------------------------

/**
 * Generates a deterministic storage path for an image.
 * Pattern: {user_id}/{report_id}/{uuid}.{ext}
 *
 * This pattern ensures:
 * - Storage RLS folder check passes (first segment = user_id)
 * - Images are grouped by report
 * - Unique filenames prevent collisions
 */
export function generateStoragePath(
  userId: string,
  reportId: string,
  file: File
): string {
  const ext = getFileExtension(file);
  const uuid = crypto.randomUUID();
  return `${userId}/${reportId}/${uuid}.${ext}`;
}

function getFileExtension(file: File): string {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return mimeToExt[file.type] ?? "jpg";
}

// --------------------------------------------------
// Upload
// --------------------------------------------------

export interface UploadResult {
  success: boolean;
  storagePath?: string;
  error?: string;
}

/**
 * Validates and uploads an image to the monitoring-images bucket.
 * Returns the storage path on success.
 *
 * Called during Phase 4 report submission workflow.
 */
export async function uploadMonitoringImage(
  file: File,
  userId: string,
  reportId: string
): Promise<UploadResult> {
  // 1. Validate before attempting upload
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // 2. Generate storage path
  const storagePath = generateStoragePath(userId, reportId, file);

  // 3. Upload to Supabase Storage
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false, // Never overwrite — UUIDs guarantee uniqueness
    });

  if (error) {
    console.error("[storage] Upload failed:", error.message);
    return {
      success: false,
      error: `Upload failed: ${error.message}`,
    };
  }

  return { success: true, storagePath };
}

// --------------------------------------------------
// Signed URL (for displaying images)
// --------------------------------------------------

/**
 * Creates a short-lived signed URL for viewing a private image.
 * Default expiry: 60 seconds (enough for AI verification display).
 */
export async function getSignedImageUrl(
  storagePath: string,
  expiresInSeconds = 60
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    console.error("[storage] Failed to create signed URL:", error?.message);
    return null;
  }

  return data.signedUrl;
}

// --------------------------------------------------
// Delete (for cleanup of failed/draft uploads)
// --------------------------------------------------

export async function deleteMonitoringImage(
  storagePath: string
): Promise<boolean> {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([storagePath]);

  if (error) {
    console.error("[storage] Delete failed:", error.message);
    return false;
  }

  return true;
}
