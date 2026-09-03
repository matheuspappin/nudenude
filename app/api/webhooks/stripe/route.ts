import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-08-26.dahlia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Processar os eventos suportados
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const courseId = session.metadata?.courseId;
      const userId = session.metadata?.userId || session.client_reference_id;
      const stripeSessionId = session.id;

      if (!courseId || !userId) {
        console.error('Missing metadata in session', session);
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      // 1. Tentar inserir a compra. Usamos upsert ou onConflict para Idempotência.
      // Se a sessão do Stripe já foi processada, o stripe_session_id vai conflitar e ignoramos.
      const { error } = await supabase
        .from('purchases')
        .upsert({
          user_id: userId,
          course_id: courseId,
          stripe_session_id: stripeSessionId,
          status: 'completed',
        }, {
          onConflict: 'stripe_session_id',
          ignoreDuplicates: false // Podemos atualizar o status se quisermos, mas como é completed, basta upsert.
        });

      if (error) {
        console.error('Error inserting purchase:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      console.log(`Purchase completed for user ${userId}, course ${courseId}`);
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`Payment failed: ${paymentIntent.last_payment_error?.message}`);
      // Lógica de falha de pagamento pode ser expandida aqui
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Unhandled Webhook Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
