ALTER TABLE public.media ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0.00;

-- Migra dados existentes (caso haja posts criados)
UPDATE public.media 
SET media_urls = jsonb_build_array(media_url)
WHERE media_url IS NOT NULL AND media_url != '' AND jsonb_array_length(media_urls) = 0;
