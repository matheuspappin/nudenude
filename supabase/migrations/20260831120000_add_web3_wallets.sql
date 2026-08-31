-- Add Privy User ID and Solana Wallet Address to Profiles

ALTER TABLE public.profiles 
ADD COLUMN privy_user_id TEXT UNIQUE,
ADD COLUMN solana_wallet_address TEXT UNIQUE;

-- Create an index to quickly lookup users by their embedded wallet address
CREATE INDEX IF NOT EXISTS idx_profiles_solana_wallet ON public.profiles(solana_wallet_address);
