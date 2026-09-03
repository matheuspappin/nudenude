'use server';

import { getStripe } from '@/utils/stripe/server';
import { createClient } from '@/utils/supabase/server';

export async function getPlatformFinancialStats() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error("Não autorizado");
  }

  // Verificar se é admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single();

  if (!profile?.is_admin && session.user.email !== 'vendaslachef@gmail.com') {
    throw new Error("Permissão negada");
  }

  const stripe = getStripe();
  
  if (!stripe) {
    return {
      available: 0,
      pending: 0,
      currency: 'BRL',
      error: 'Stripe não configurado no servidor'
    };
  }

  try {
    const balance = await stripe.balance.retrieve();
    
    // Stripe balance pode ter múltiplas moedas. Pegamos a primeira ou BRL.
    const availableObj = balance.available.find(b => b.currency === 'brl') || balance.available[0];
    const pendingObj = balance.pending.find(b => b.currency === 'brl') || balance.pending[0];

    return {
      available: availableObj ? availableObj.amount / 100 : 0, // Stripe manda em centavos
      pending: pendingObj ? pendingObj.amount / 100 : 0,
      currency: availableObj ? availableObj.currency.toUpperCase() : 'BRL',
      error: null
    };
  } catch (err: any) {
    console.error("Erro ao buscar Stripe Balance:", err);
    return {
      available: 0,
      pending: 0,
      currency: 'BRL',
      error: err.message
    };
  }
}
