-- 17. Platform Transactions (Centralized financial logging for Super Admin)

CREATE TABLE IF NOT EXISTS public.platform_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_session_id TEXT UNIQUE,
    amount_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    creator_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    affiliate_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    affiliate_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL DEFAULT 'subscription', -- 'subscription', 'ppv', 'dropin'
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS policies
ALTER TABLE public.platform_transactions ENABLE ROW LEVEL SECURITY;

-- Super Admin can read all transactions
CREATE POLICY "Super Admins can view all transactions"
ON public.platform_transactions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_admin = true
    )
);

-- Users can view transactions where they are buyer, creator, or affiliate
CREATE POLICY "Users can view related transactions"
ON public.platform_transactions FOR SELECT
USING (
    auth.uid() = buyer_id OR
    auth.uid() = creator_id OR
    auth.uid() = affiliate_id
);
