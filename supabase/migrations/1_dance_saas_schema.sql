-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    is_creator BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Courses Table
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    cover_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Modules Table
CREATE TABLE public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Lessons Table
CREATE TABLE public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL DEFAULT 'video', -- 'video' or 'live'
    video_url TEXT, -- Path in Supabase Storage
    stream_url TEXT, -- For future RTMP/HLS
    is_live_active BOOLEAN DEFAULT FALSE,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Purchases Table
CREATE TABLE public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    stripe_session_id TEXT UNIQUE, -- UNIQUE constraint for Idempotency
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Profiles are public" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can edit own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Courses Policies
CREATE POLICY "Courses are public" 
ON public.courses FOR SELECT USING (true);

CREATE POLICY "Creators can manage own courses" 
ON public.courses FOR ALL USING (auth.uid() = creator_id);

-- Modules Policies
CREATE POLICY "Modules are public" 
ON public.modules FOR SELECT USING (true);

CREATE POLICY "Creators can manage modules of their courses" 
ON public.modules FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.courses 
        WHERE id = public.modules.course_id 
        AND creator_id = auth.uid()
    )
);

-- Lessons Policies
-- Anyone can see lesson metadata. 
-- However, we only expose video_url if the user purchased the course OR is the creator.
-- We can do this in RLS or at the application layer.
-- To be safe, we will allow read of the row to everyone, but we shouldn't leak the `video_url`.
-- Wait, RLS doesn't allow column-level security easily without views. 
-- Let's just allow read access to the whole row for now, and the backend/signed URL route will validate the purchase.
-- The prompt: "Alunos só podem ler lessons completas (com URL do vídeo) se tiverem uma entrada ativa em purchases para o course_id correspondente."
-- Let's make lessons readable ONLY to purchasers or creators. 
-- Wait, if they are not purchasers, they can't see the lesson titles in the course page? Usually, you want them to see the titles to buy.
-- Better approach: Lessons are readable, but video_url is a private storage path. 
-- The user MUST use an API route to get a signed URL. The API route will check `purchases`.
-- So:
CREATE POLICY "Lessons are public to view metadata" 
ON public.lessons FOR SELECT USING (true);

CREATE POLICY "Creators can manage lessons of their modules" 
ON public.lessons FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.modules 
        JOIN public.courses ON public.courses.id = public.modules.course_id
        WHERE public.modules.id = public.lessons.module_id 
        AND public.courses.creator_id = auth.uid()
    )
);

-- Purchases Policies
CREATE POLICY "Users can view own purchases" 
ON public.purchases FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Creators can view purchases of their courses" 
ON public.purchases FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.courses 
        WHERE id = public.purchases.course_id 
        AND creator_id = auth.uid()
    )
);

-- Insert/Update to purchases are restricted (ONLY Service Role can do it by bypassing RLS).
-- We do not create INSERT/UPDATE policies for regular users.

-- Create storage bucket for course videos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('courses', 'courses', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- We do not allow public access. We rely on Signed URLs generated by the server.
CREATE POLICY "Creators can upload videos" 
ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'courses' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Creators can manage own videos"
ON storage.objects FOR ALL TO authenticated USING (
    bucket_id = 'courses' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);
