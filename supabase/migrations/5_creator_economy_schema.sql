-- Phase 1: Creator Economy Expansion Migration

-- 1. Profile Updates (Onboarding Fields & Subscription Setup)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preview_video_url TEXT,
ADD COLUMN IF NOT EXISTS subscription_price DECIMAL(10,2) DEFAULT 9.99,
ADD COLUMN IF NOT EXISTS student_goal TEXT;

-- 2. Course Updates (PPV Flag)
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS is_ppv BOOLEAN DEFAULT true;

-- 3. Subscriptions Table (Patreon/OnlyFans Logic)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'past_due'
    current_period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, creator_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own subscriptions" 
ON public.subscriptions FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Creators can view their subscribers" 
ON public.subscriptions FOR SELECT USING (auth.uid() = creator_id);

-- 4. Posts Table (Exclusive Feed Logic)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content_text TEXT,
    media_url TEXT,
    is_locked BOOLEAN DEFAULT true, -- If true, only subscribers can view media
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view posts, media visibility handled by UI" 
ON public.posts FOR SELECT USING (true);

CREATE POLICY "Creators can insert own posts" 
ON public.posts FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own posts" 
ON public.posts FOR DELETE USING (auth.uid() = creator_id);

-- 5. Reviews Table (Student Showcase with Video Proof)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    video_proof_url TEXT, -- Video showing student dancing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are public" 
ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Students can review purchased courses" 
ON public.reviews FOR INSERT WITH CHECK (
    auth.uid() = student_id AND
    EXISTS (
        SELECT 1 FROM public.purchases 
        WHERE user_id = auth.uid() AND course_id = public.reviews.course_id AND status = 'completed'
    )
);
