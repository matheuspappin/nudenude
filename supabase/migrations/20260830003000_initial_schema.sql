-- Habilita a extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Profiles
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    is_creator BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Tiers (Planos de Assinatura)
CREATE TABLE public.tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Subscriptions (Assinaturas Ativas)
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscriber_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    tier_id UUID REFERENCES public.tiers(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active', -- active, past_due, canceled
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(subscriber_id, creator_id)
);

-- 4. Tabela de Media (Posts)
CREATE TABLE public.media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_text TEXT,
    media_url TEXT, -- Caminho referenciando o Cloudflare R2
    status TEXT DEFAULT 'pending', -- pending, active (após moderação)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Webhook Events (Garantia de Idempotência - Preparação Fase 2)
CREATE TABLE public.webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idempotency_key TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- OTIMIZAÇÃO DE RLS: Injeção de Claims no JWT via RPC (Zero JOINs no RLS)
-- =========================================================================

-- Função para atualizar os claims de um usuário sempre que uma assinatura muda
CREATE OR REPLACE FUNCTION public.update_user_subscription_claims(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Roda com privilégios de bypass RLS para atualizar auth.users
SET search_path = public
AS $$
DECLARE
    subscribed_creators TEXT[];
BEGIN
    -- Busca todos os IDs dos criadores nos quais o usuário possui assinatura válida
    SELECT array_agg(creator_id::TEXT) INTO subscribed_creators
    FROM public.subscriptions
    WHERE subscriber_id = target_user_id AND status = 'active' AND expires_at > NOW();

    -- Atualiza os metadados brutos do usuário injetando no token JWT
    UPDATE auth.users
    SET raw_app_meta_data = 
      coalesce(raw_app_meta_data, '{}'::jsonb) || 
      json_build_object('subscribed_creators', coalesce(subscribed_creators, '{}'::TEXT[]))::jsonb
    WHERE id = target_user_id;
END;
$$;

-- RLS: Leitura da tabela Media EXTREMAMENTE RÁPIDA baseada puramente na sessão (O(1))
CREATE POLICY "Leitura de Media via Token JWT"
ON public.media
FOR SELECT
USING (
    status = 'active' AND (
        -- O próprio criador pode ver seus posts
        auth.uid() = creator_id OR
        -- Assinantes com o claim atualizado têm permissão de visualização sem JOINs pesados
        (auth.jwt() -> 'app_metadata' -> 'subscribed_creators')::jsonb ? creator_id::text
    )
);

-- =========================================================================
-- Políticas Básicas de RLS (Profiles, Tiers e Subscriptions)
-- =========================================================================

CREATE POLICY "Profiles são públicos para visualização"
ON public.profiles
FOR SELECT USING (true);

CREATE POLICY "Usuário edita próprio profile"
ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Tiers (Planos) são públicos"
ON public.tiers
FOR SELECT USING (true);

CREATE POLICY "Criador gerencia próprios tiers"
ON public.tiers
FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Usuário e criador veem a assinatura correspondente"
ON public.subscriptions
FOR SELECT USING (auth.uid() = subscriber_id OR auth.uid() = creator_id);

-- Para "webhook_events", nenhuma política de SELECT ou INSERT é liberada para usuários anônimos ou autenticados.
-- Ela só será manipulada pela chave Service Role do backend (Bypass RLS).
