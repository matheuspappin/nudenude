-- 13. Update Posts Table for Frontend Compatibility

-- Rename content_text to post_text
ALTER TABLE public.posts RENAME COLUMN content_text TO post_text;

-- Replace media_url (TEXT) with media_urls (TEXT[])
ALTER TABLE public.posts DROP COLUMN IF EXISTS media_url;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS media_urls TEXT[];

-- Add price column for PPV packs
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0;
