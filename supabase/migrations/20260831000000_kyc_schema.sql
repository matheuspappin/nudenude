-- 1. Create KYC Status Enum
CREATE TYPE public.kyc_status_enum AS ENUM ('none', 'pending', 'approved', 'rejected');

-- 2. Add kyc_status to profiles
ALTER TABLE public.profiles 
ADD COLUMN kyc_status public.kyc_status_enum DEFAULT 'none'::public.kyc_status_enum NOT NULL;

-- 3. Create kyc_submissions table
CREATE TABLE public.kyc_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status public.kyc_status_enum DEFAULT 'pending'::public.kyc_status_enum NOT NULL,
    document_front_url TEXT NOT NULL,
    document_back_url TEXT NOT NULL,
    selfie_url TEXT NOT NULL,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Enable RLS for kyc_submissions
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Creators can insert their own KYC
CREATE POLICY "Creators can insert their own KYC"
ON public.kyc_submissions
FOR INSERT
WITH CHECK (auth.uid() = creator_id);

-- Creators can read their own KYC
CREATE POLICY "Creators can read their own KYC"
ON public.kyc_submissions
FOR SELECT
USING (auth.uid() = creator_id);

-- 5. Storage Bucket for KYC Documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents', 
  'kyc-documents', 
  false, -- PRIVATE BUCKET! Very important for ID documents
  10485760, -- 10MB limit
  '{"image/jpeg","image/png","image/webp"}'
) ON CONFLICT (id) DO NOTHING;

-- 6. Storage Policies
-- Users can upload to kyc-documents (we assume any authenticated user might want to become a creator)
CREATE POLICY "Users can upload kyc documents"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read their own uploaded kyc documents
CREATE POLICY "Users can view own kyc documents"
ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text
);
