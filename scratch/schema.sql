-- 1. Create Enums
CREATE TYPE user_role AS ENUM ('creator', 'consumer', 'admin');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due');

-- 2. Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role user_role DEFAULT 'consumer'::user_role NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create tiers table
CREATE TABLE public.tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES public.profiles(id) NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID REFERENCES public.profiles(id) NOT NULL,
  creator_id UUID REFERENCES public.profiles(id) NOT NULL,
  tier_id UUID REFERENCES public.tiers(id),
  status subscription_status DEFAULT 'active'::subscription_status NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create posts table
CREATE TABLE public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES public.profiles(id) NOT NULL,
  content_text TEXT,
  media_urls TEXT[],
  is_locked BOOLEAN DEFAULT true NOT NULL,
  tier_id UUID REFERENCES public.tiers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create webhook_events table
CREATE TABLE public.webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  idempotency_key TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- 7. Create Custom Claims Hook (Supabase Auth Hook format)
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
  DECLARE
    claims jsonb;
    user_role text;
    active_subs uuid[];
  BEGIN
    claims := event->'claims';
    
    -- Check if profile exists, get role
    SELECT role::text INTO user_role FROM public.profiles WHERE id = (event->>'user_id')::uuid;
    
    IF user_role IS NULL THEN
      user_role := 'consumer';
    END IF;

    -- If user is a consumer, get all creator_ids they are actively subscribed to
    IF user_role = 'consumer' THEN
      SELECT array_agg(creator_id) INTO active_subs
      FROM public.subscriptions
      WHERE subscriber_id = (event->>'user_id')::uuid AND status = 'active' AND expires_at > now();
    END IF;

    -- Inject into app_metadata
    claims := jsonb_set(claims, '{app_metadata, user_role}', to_jsonb(user_role));
    
    IF active_subs IS NOT NULL THEN
      claims := jsonb_set(claims, '{app_metadata, active_subs}', to_jsonb(active_subs));
    ELSE
      claims := jsonb_set(claims, '{app_metadata, active_subs}', '[]'::jsonb);
    END IF;

    event := jsonb_set(event, '{claims}', claims);
    RETURN event;
  END;
$$;

-- Grant permissions for Supabase Auth to execute the hook
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- 8. Basic RLS Policies
-- Profiles: everyone can read, owners can update
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Tiers: everyone can read
CREATE POLICY "Tiers are viewable by everyone." ON public.tiers FOR SELECT USING (true);
CREATE POLICY "Creators can manage own tiers." ON public.tiers FOR ALL USING (auth.uid() = creator_id);

-- Subscriptions: users can read their own
CREATE POLICY "Users can view own subscriptions." ON public.subscriptions FOR SELECT USING (auth.uid() = subscriber_id OR auth.uid() = creator_id);

-- Posts: Creators can manage their own. Consumers can view if it's unlocked OR if they are subscribed
CREATE POLICY "Creators can manage own posts." ON public.posts FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Consumers can view unlocked posts or if subscribed." ON public.posts FOR SELECT 
USING (
  is_locked = false 
  OR auth.uid() = creator_id 
  OR (auth.jwt() -> 'app_metadata' -> 'active_subs') @> jsonb_build_array(creator_id)
);
