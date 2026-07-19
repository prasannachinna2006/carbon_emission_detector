-- ==================================================
-- BlueChain MRV — Supabase Storage Configuration
-- Migration: storage
-- Created: 2026-07-19
-- ==================================================
-- Creates the monitoring-images bucket and RLS policies.
--
-- Bucket: monitoring-images
--   - Private (not publicly accessible)
--   - Allowed types: image/jpeg, image/png, image/webp
--   - Max file size: 10 MB (10,485,760 bytes)
--
-- Storage path convention:
--   {user_id}/{report_id}/{uuid}.{ext}
--
-- This path structure ensures:
--   1. Each user's images are in their own folder
--   2. Images are grouped by report
--   3. Filenames are unique (UUID) to prevent collisions
-- ==================================================

-- --------------------------------------------------
-- Create the monitoring-images bucket
-- --------------------------------------------------

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'monitoring-images',
  'monitoring-images',
  FALSE,                          -- Private: no anonymous public access
  10485760,                       -- 10 MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET
    public             = EXCLUDED.public,
    file_size_limit    = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- --------------------------------------------------
-- Storage RLS Policies on storage.objects
--
-- Path convention: {user_id}/{report_id}/{filename}
-- (storage.foldername(name))[1] = first path segment = user_id
-- --------------------------------------------------

-- Policy 1: Authenticated users can UPLOAD images to their own folder
CREATE POLICY "Users can upload images to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'monitoring-images'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- Policy 2: Authenticated users can READ images from their own folder
CREATE POLICY "Users can read own images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'monitoring-images'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- Policy 3: Authenticated users can DELETE images from their own folder
-- (allows cleanup of draft uploads)
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'monitoring-images'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- Policy 4: Service role (Edge Functions) can read ALL images for AI verification
-- This is implicit because service_role bypasses RLS.
-- No explicit policy needed — service_role always has full access.

-- --------------------------------------------------
-- Notes
-- --------------------------------------------------
-- File type validation (JPEG/PNG/WebP) is enforced at two levels:
--   1. Bucket level: allowed_mime_types above
--   2. Frontend level: accept="image/jpeg,image/png,image/webp" on input
--   3. Edge Function level: MIME type check before calling Gemini
--
-- File size validation (10 MB) is enforced at two levels:
--   1. Bucket level: file_size_limit above
--   2. Frontend level: file.size check before upload attempt
--
-- Images are NOT publicly accessible by default.
-- Signed URLs are used to give temporary access when needed.
-- ==================================================
