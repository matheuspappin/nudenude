-- 15. Affiliate and Events Tracking

-- Table for tracking affiliate earnings
CREATE TABLE IF NOT EXISTS public.affiliate_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    stripe_transfer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.affiliate_earnings ENABLE ROW LEVEL SECURITY;

-- Policies for affiliate earnings
CREATE POLICY "Affiliates can view their own earnings" 
ON public.affiliate_earnings FOR SELECT 
USING (auth.uid() = affiliate_id);

CREATE POLICY "Service Role can insert earnings" 
ON public.affiliate_earnings FOR INSERT 
WITH CHECK (true); -- Usually restricted by RLS on API, but webhooks use service_role so it bypasses anyway

