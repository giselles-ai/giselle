-- Description: Add storage policies for avatar management in public-assets bucket
-- Version: 1.0.0
-- Created: 2025-04-22

BEGIN;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Create public bucket for avatars (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-assets', 'public-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create new policies
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-assets');

-- Allow authenticated users to upload avatars
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'public-assets'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.filename(name)) LIKE (SELECT id FROM auth.users WHERE id = auth.uid()) || '.%'
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'public-assets'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.filename(name)) LIKE (SELECT id FROM auth.users WHERE id = auth.uid()) || '.%'
)
WITH CHECK (
    bucket_id = 'public-assets'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.filename(name)) LIKE (SELECT id FROM auth.users WHERE id = auth.uid()) || '.%'
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'public-assets'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.filename(name)) LIKE (SELECT id FROM auth.users WHERE id = auth.uid()) || '.%'
);

COMMIT;
