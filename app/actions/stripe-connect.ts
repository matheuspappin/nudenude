'use server';

import { getStripe } from '@/utils/stripe/server';
import { createClient } from '@/utils/supabase/server';

/**
 * Cria a conta Stripe Connect (Express) para o usuário e gera o link de onboarding.
 */
export async function createStripeConnectAccountLink(returnUrl: string) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe não configurado no servidor.");

  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Usuário não autenticado");

  const userId = session.user.id;
  const userEmail = session.user.email;

  // Busca o perfil para ver se já tem conta
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id, display_name')
    .eq('id', userId)
    .single();

  let accountId = profile?.stripe_account_id;

  if (!accountId) {
    // Cria uma nova conta Express no Stripe Master
    const account = await stripe.accounts.create({
      type: "express",
      country: "BR", // O padrão do AkaaiCore é Brasil
      email: userEmail || undefined,
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
      business_type: "individual",
      business_profile: {
        name: profile?.display_name || "Criador de Conteúdo",
      },
    });
    
    accountId = account.id;

    // Salva no banco de dados (ignorando RLS porque a action roda no server, 
    // mas usando o client autenticado do usuario, ele pode dar update no proprio perfil)
    const { error: upErr } = await supabase
      .from("profiles")
      .update({ stripe_account_id: accountId })
      .eq("id", userId);
      
    if (upErr) {
      console.error("Erro ao salvar stripe_account_id:", upErr);
      throw new Error("Falha ao vincular conta Stripe no banco de dados.");
    }
  }

  // Gera o link de onboarding
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${returnUrl}?refresh=true`,
    return_url: returnUrl,
    type: "account_onboarding",
  });

  return accountLink.url;
}

/**
 * Verifica o status da conta Stripe Connect do usuário logado.
 */
export async function getStripeConnectStatus() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { stripe_account_id: null, payouts_enabled: false, details_submitted: false };

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id')
    .eq('id', session.user.id)
    .single();

  if (!profile?.stripe_account_id) {
    return { stripe_account_id: null, payouts_enabled: false, details_submitted: false };
  }

  try {
    const stripe = getStripe();
    if (!stripe) return { stripe_account_id: profile.stripe_account_id, payouts_enabled: false, details_submitted: false };

    const account = await stripe.accounts.retrieve(profile.stripe_account_id);
    
    // Se completou o onboarding, podemos atualizar no banco também
    if (account.details_submitted) {
      await supabase
        .from('profiles')
        .update({ stripe_onboarding_complete: true })
        .eq('id', session.user.id);
    }

    return {
      stripe_account_id: profile.stripe_account_id,
      payouts_enabled: account.payouts_enabled ?? false,
      details_submitted: account.details_submitted ?? false,
    };
  } catch (error) {
    console.error("Erro ao consultar Stripe:", error);
    return { stripe_account_id: profile.stripe_account_id, payouts_enabled: false, details_submitted: false };
  }
}
