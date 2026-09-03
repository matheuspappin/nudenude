import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2026-08-26.dahlia' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
      }
    } else {
      event = JSON.parse(body);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { type, userId, creatorId, tierId, transfer_group } = session.metadata || {};

      if (!userId || !creatorId) {
        throw new Error('Missing userId or creatorId in session metadata');
      }

      if (type === 'subscription') {
         // 1. Marca a assinatura no DB
         const { error: subError } = await supabase
           .from('subscriptions')
           .upsert({
             student_id: userId,
             creator_id: creatorId,
             tier_id: tierId || null,
             status: 'active',
             current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
           }, { onConflict: 'student_id, creator_id' });
         if (subError) throw subError;

         // 2. Lógica de Split (Stripe Connect)
         if (session.payment_status === 'paid' && transfer_group) {
           // Busca o valor pago e subtrai a taxa do stripe para ser exato, ou usa o amount_total bruto
           const amountTotal = session.amount_total || 0;
           if (amountTotal <= 0) return NextResponse.json({ received: true });

           // Busca as taxas globais
           const { data: settings } = await supabase.from('platform_settings').select('*').limit(1).single();
           const platformFeePercent = settings?.platform_fee_percent || 10;
           const affiliateFeePercent = settings?.affiliate_fee_percent || 15;

           // Busca os dados do Criador Vendido
           const { data: creator } = await supabase
             .from('profiles')
             .select('stripe_account_id, stripe_onboarding_complete, referred_by')
             .eq('id', creatorId)
             .single();

           if (creator && creator.stripe_account_id && creator.stripe_onboarding_complete) {
             let affiliateAccountId = null;
             
             // Verifica se o Criador foi indicado por outro Criador (Afiliado)
             if (creator.referred_by) {
               const { data: affiliate } = await supabase
                 .from('profiles')
                 .select('stripe_account_id, stripe_onboarding_complete')
                 .eq('id', creator.referred_by)
                 .single();
                 
               if (affiliate && affiliate.stripe_account_id && affiliate.stripe_onboarding_complete) {
                 affiliateAccountId = affiliate.stripe_account_id;
               }
             }

             // Calcula os valores (em centavos)
             let creatorSharePercent = 100 - platformFeePercent;
             let affiliateAmount = 0;

             if (affiliateAccountId) {
                creatorSharePercent = creatorSharePercent - affiliateFeePercent;
                affiliateAmount = Math.floor(amountTotal * (affiliateFeePercent / 100));
             }

             const creatorAmount = Math.floor(amountTotal * (creatorSharePercent / 100));

             // Dispara Transfer para o Criador principal
             if (creatorAmount > 0) {
               await stripe.transfers.create({
                 amount: creatorAmount,
                 currency: 'usd',
                 destination: creator.stripe_account_id,
                 transfer_group: transfer_group,
                 metadata: { type: 'creator_earnings', creatorId }
               });
             }

             // Dispara Transfer para o Afiliado (Criador que indicou)
             if (affiliateAccountId && affiliateAmount > 0) {
               const affiliateTransfer = await stripe.transfers.create({
                 amount: affiliateAmount,
                 currency: 'usd',
                 destination: affiliateAccountId,
                 transfer_group: transfer_group,
                 metadata: { type: 'affiliate_earnings', referredCreatorId: creatorId }
               });
               
               // Registra a comissão na nossa tabela para o Dashboard do Afiliado
               await supabase.from('affiliate_earnings').insert({
                 affiliate_id: creator.referred_by,
                 referred_creator_id: creatorId,
                 amount: affiliateAmount / 100, // Converte de centavos para dólares/reais
                 stripe_transfer_id: affiliateTransfer.id
               });
             }

             // Registra a transação no Platform Transactions para o Super Admin
             const platformFeeAmount = amountTotal - creatorAmount - affiliateAmount;
             await supabase.from('platform_transactions').insert({
                stripe_session_id: session.id,
                amount_total: amountTotal / 100,
                platform_fee: platformFeeAmount / 100,
                creator_amount: creatorAmount / 100,
                affiliate_amount: affiliateAmount / 100,
                buyer_id: userId,
                creator_id: creatorId,
                affiliate_id: affiliateAccountId ? creator.referred_by : null,
                transaction_type: type
             });
           }
         }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Error processing webhook:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
