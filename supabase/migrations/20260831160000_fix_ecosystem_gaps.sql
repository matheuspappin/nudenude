-- 20260831160000_fix_ecosystem_gaps.sql

-- 1. Anti-Money Laundering (AML) - Separating Purchased vs Earned Balances
-- Rename old column and add new one
ALTER TABLE public.profiles RENAME COLUMN credits_balance TO purchased_credits;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS earned_credits INTEGER DEFAULT 0 NOT NULL;

-- 2. Create Withdrawals Table
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    creator_id UUID REFERENCES public.profiles(id) NOT NULL,
    amount_usdc NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- RLS for Withdrawals
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can view their own withdrawals"
    ON public.withdrawals FOR SELECT
    USING (auth.uid() = creator_id);
CREATE POLICY "Admins can view all withdrawals"
    ON public.withdrawals FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 3. Create Purchased Media Table (Ledger for unlocked posts)
CREATE TABLE IF NOT EXISTS public.purchased_media (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    media_id UUID REFERENCES public.media(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, media_id)
);

-- RLS for Purchased Media
ALTER TABLE public.purchased_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their unlocked media"
    ON public.purchased_media FOR SELECT
    USING (auth.uid() = user_id);

-- 4. Update RPCs to handle the new separated balances
-- When buying credits via Helio, it goes to purchased_credits
CREATE OR REPLACE FUNCTION increment_credits(user_id UUID, amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET purchased_credits = purchased_credits + amount
  WHERE id = user_id;
END;
$$;

-- When spending credits, deduct from purchased_credits and add to earned_credits (net)
CREATE OR REPLACE FUNCTION spend_credits(
    p_buyer_id UUID, 
    p_creator_id UUID, 
    p_amount INTEGER, 
    p_reference_id TEXT, 
    p_type TEXT
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    buyer_balance INTEGER;
    creator_net_amount INTEGER;
BEGIN
    -- 1. Check buyer balance
    SELECT purchased_credits INTO buyer_balance FROM public.profiles WHERE id = p_buyer_id FOR UPDATE;
    
    IF buyer_balance < p_amount THEN
        RETURN FALSE; -- Insufficient funds
    END IF;

    -- 2. Calculate 85% net to creator (15% platform fee)
    creator_net_amount := FLOOR(p_amount * 0.85);

    -- 3. Deduct from buyer
    UPDATE public.profiles
    SET purchased_credits = purchased_credits - p_amount
    WHERE id = p_buyer_id;

    -- 4. Add to creator's EARNED balance (they can only withdraw this)
    UPDATE public.profiles
    SET earned_credits = earned_credits + creator_net_amount
    WHERE id = p_creator_id;

    -- 5. Log the transaction
    INSERT INTO public.transactions (buyer_id, creator_id, amount, type, gateway_reference, status)
    VALUES (p_buyer_id, p_creator_id, p_amount, p_type, p_reference_id, 'completed');

    RETURN TRUE;
END;
$$;
