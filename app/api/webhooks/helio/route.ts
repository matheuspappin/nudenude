import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/utils/supabase/admin';

// Validates the HMAC signature sent by Helio
function verifyHelioSignature(payload: string, signature: string) {
  const secret = process.env.HELIO_WEBHOOK_SECRET;
  if (!secret) return false;

  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return digest === signature;
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-helio-signature');

    if (!signature || !verifyHelioSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const { event, data } = payload;
    const supabaseAdmin = createAdminClient();

    if (event === 'PAYMENT_SUCCESS') {
      const { userId, type, targetId, creditsAmount, paymentId } = data.metadata || {};

      if (userId) {
        if (type === 'credit_package' && creditsAmount) {
          // 1. Grant credits (this will add to purchased_credits via RPC)
          await supabaseAdmin.rpc('increment_credits', { user_id: userId, amount: Number(creditsAmount) });
          // 2. Log transaction
          await supabaseAdmin.from('transactions').insert({
            buyer_id: userId,
            amount: Number(creditsAmount),
            type: 'credit_purchase',
            gateway_reference: paymentId,
            status: 'completed'
          });
        } 
        else if (type === 'vip_pass' && targetId) {
          // Grant VIP Pass (subscription)
          await supabaseAdmin.from('subscriptions').insert({
            subscriber_id: userId,
            creator_id: targetId,
            status: 'active',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
          });
        }
      }
    } else if (event === 'PAYMENT_FAILED') {
      const { userId, targetId, type } = data.metadata || {};
      if (userId && targetId && type === 'vip_pass') {
        // Revoke access on chargeback/failure
        await supabaseAdmin.from('subscriptions')
          .update({ status: 'canceled' })
          .eq('subscriber_id', userId)
          .eq('creator_id', targetId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Helio Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
