import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2026-08-26.dahlia' as any,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { creatorId, userId, tierId } = await req.json();

    if (!creatorId || !userId || !tierId) {
      return NextResponse.json({ error: 'Missing creatorId, userId, or tierId' }, { status: 400 });
    }

    // Busca dados do criador (para conta Stripe)
    const { data: creator, error: creatorError } = await supabase
      .from('profiles')
      .select('username, display_name, stripe_account_id, stripe_onboarding_complete')
      .eq('id', creatorId)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }
    
    // Busca os dados do plano (Tier) escolhido
    const { data: tier, error: tierError } = await supabase
      .from('subscription_tiers')
      .select('id, name, price')
      .eq('id', tierId)
      .eq('creator_id', creatorId)
      .single();
      
    if (tierError || !tier) {
      return NextResponse.json({ error: 'Subscription tier not found' }, { status: 404 });
    }

    const priceAmount = parseFloat(tier.price) || 9.99;
    const origin = req.headers.get('origin') || 'http://localhost:3005';

    // Se quisermos criar um transfer_group, podemos gerar um ID unico
    const transferGroup = `sub_${Date.now()}_${userId}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment', // Pode ser subscription se você quiser que o Stripe cobre recorrente, mas aqui usamos payment como MVP
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Assinatura ${tier.name} - @${creator.username}`,
              description: `Acesso VIP a conteúdos exclusivos de ${creator.display_name || creator.username}.`,
            },
            unit_amount: Math.round(priceAmount * 100),
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        transfer_group: transferGroup,
      },
      metadata: {
        type: 'subscription',
        userId: userId,
        creatorId: creatorId,
        tierId: tier.id,
        transfer_group: transferGroup,
      },
      success_url: `${origin}/${creator.username}?success=true`,
      cancel_url: `${origin}/${creator.username}?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe Checkout Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
