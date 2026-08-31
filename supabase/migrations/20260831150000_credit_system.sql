-- 20260831150000_credit_system.sql
-- Add credit balance to profiles

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS credits_balance INTEGER DEFAULT 0 NOT NULL;

-- transactions table already exists in production schema
-- (buyer_id, creator_id, amount, type, status, gateway_reference, created_at, affiliate_id, affiliate_cut)

-- RPC to atomically increment credits
CREATE OR REPLACE FUNCTION increment_credits(user_id UUID, amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET credits_balance = credits_balance + amount
  WHERE id = user_id;
END;
$$;

-- RPC to atomically spend credits and transfer to creator (with 15% platform fee)
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
    SELECT credits_balance INTO buyer_balance FROM public.profiles WHERE id = p_buyer_id FOR UPDATE;
    
    IF buyer_balance < p_amount THEN
        RETURN FALSE; -- Insufficient funds
    END IF;

    -- 2. Calculate 85% net to creator (15% platform fee)
    creator_net_amount := FLOOR(p_amount * 0.85);

    -- 3. Deduct from buyer
    UPDATE public.profiles
    SET credits_balance = credits_balance - p_amount
    WHERE id = p_buyer_id;

    -- 4. Add to creator
    UPDATE public.profiles
    SET credits_balance = credits_balance + creator_net_amount
    WHERE id = p_creator_id;

    -- 5. Log the transaction
    INSERT INTO public.transactions (buyer_id, creator_id, amount, type, gateway_reference, status)
    VALUES (p_buyer_id, p_creator_id, p_amount, p_type, p_reference_id, 'completed');

    RETURN TRUE;
END;
$$;
