-- 14. Multiple VIP Subscription Tiers

-- Criar tabela de planos (tiers)
CREATE TABLE IF NOT EXISTS public.subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 9.99,
  description TEXT,
  status TEXT DEFAULT 'active', -- 'active' ou 'inactive'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Anyone can read active tiers" 
ON public.subscription_tiers FOR SELECT USING (status = 'active');

CREATE POLICY "Creators can manage their own tiers" 
ON public.subscription_tiers FOR ALL USING (auth.uid() = creator_id);

-- Alterar a tabela de assinaturas para suportar o tier_id
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS tier_id UUID REFERENCES public.subscription_tiers(id) ON DELETE SET NULL;

-- Migração de dados legados: 
-- Para cada criador que já tinha um preço na tabela profiles, criar um plano Básico padrão para ele
INSERT INTO public.subscription_tiers (creator_id, name, price, description, status)
SELECT 
  id as creator_id, 
  'VIP Acesso Total' as name, 
  COALESCE(subscription_price, 9.99) as price,
  'Acesso a todo o meu acervo de vídeos bloqueados e conteúdos diários.' as description,
  'active' as status
FROM public.profiles
WHERE is_creator = true 
  AND NOT EXISTS (
    SELECT 1 FROM public.subscription_tiers WHERE subscription_tiers.creator_id = profiles.id
  );
