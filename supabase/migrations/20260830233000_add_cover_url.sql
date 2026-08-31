-- Adiciona a coluna cover_url caso não exista
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_url TEXT;
