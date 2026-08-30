import { createClient } from '@supabase/supabase-js';

// Cliente Supabase que ignora RLS (Para uso EXCLUSIVO em rotas de backend seguro como Webhooks)
export const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Fallback para dev local
  );
};
