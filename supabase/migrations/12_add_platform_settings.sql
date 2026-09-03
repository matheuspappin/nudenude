-- 12. Add Platform Settings for Stripe Split

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_fee_percent NUMERIC NOT NULL DEFAULT 10,
  affiliate_fee_percent NUMERIC NOT NULL DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilita RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
-- Apenas super admins podem inserir/editar. Todos podem ler (para que o backend leia).
CREATE POLICY "Anyone can read platform settings" 
ON public.platform_settings FOR SELECT USING (true);

CREATE POLICY "Admins can insert platform settings" 
ON public.platform_settings FOR INSERT WITH CHECK (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

CREATE POLICY "Admins can update platform settings" 
ON public.platform_settings FOR UPDATE USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);

-- Inserir configuração padrão única (se não existir)
INSERT INTO public.platform_settings (id, platform_fee_percent, affiliate_fee_percent)
SELECT '00000000-0000-0000-0000-000000000001'::uuid, 10, 15
WHERE NOT EXISTS (SELECT 1 FROM public.platform_settings);
