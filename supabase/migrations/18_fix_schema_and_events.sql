-- 18. Schema Corrections & Events/Upload Enhancements
-- This migration fixes critical gaps and adds new features.

-- ============================================================
-- 1. Fix: Add affiliate_fee_percentage to profiles
--    (Referenced by admin/affiliates but never created)
-- ============================================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS affiliate_fee_percentage NUMERIC DEFAULT 10;

-- ============================================================
-- 2. Enhance: Expand creator_events for full customization
--    (workshop, live, class, tour, meetup + pricing/spots/online)
-- ============================================================
ALTER TABLE public.creator_events
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'workshop',
ADD COLUMN IF NOT EXISTS event_time TEXT,
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_spots INTEGER,
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stream_url TEXT;

-- ============================================================
-- 3. Enhance: Add labels and tier-based visibility to posts
-- ============================================================
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS label TEXT;

ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS visible_tier_ids UUID[];

-- PPV tier overrides: [{"tier_id": "uuid", "free": true/false}]
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS ppv_tier_overrides JSONB DEFAULT '[]';

-- ============================================================
-- 4. Fix: Create affiliates table
--    (Referenced by payouts.ts line 54-59 but never created)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.affiliates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    percentage NUMERIC DEFAULT 10,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(affiliate_id, creator_id)
);

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- Admins can manage all affiliate relationships
CREATE POLICY "Admins can manage affiliates"
ON public.affiliates FOR ALL USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- Users can view their own affiliate relationships
CREATE POLICY "Users can view own affiliate relationships"
ON public.affiliates FOR SELECT USING (
    auth.uid() = affiliate_id OR auth.uid() = creator_id
);
