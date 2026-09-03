import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(req: Request) {
  const supabase = createAdminClient();
  try {
    const payload = await req.json();
    
    // 2.1 e 2.2: IDEMPOTÊNCIA NO NÍVEL DE BANCO
    // Identificador único (Idempotency Key) vindo do Gateway (Ex: CCBill / Segpay)
    const idempotencyKey = payload.transaction_id || payload.event_id; 
    const eventType = payload.event_type; // ex: 'new_sub', 'rebill', 'cancel'
    
    if (!idempotencyKey) {
      return NextResponse.json({ error: 'Faltando Idempotency Key' }, { status: 400 });
    }

    // A constraint UNIQUE na tabela 'webhook_events' é nossa trava inquebrável.
    // Se o webhook disparar 2 vezes simultaneamente, a segunda falhará aqui.
    const { error: webhookError } = await supabase
      .from('webhook_events')
      .insert({
        idempotency_key: idempotencyKey,
        event_type: eventType,
        payload: payload
      });

    if (webhookError) {
      // Erro 23505 é Unique Violation no PostgreSQL (Conflito de PK/Unique)
      if (webhookError.code === '23505') {
        console.warn(`[Webhook Idempotency] Evento duplicado evitado: ${idempotencyKey}`);
        return NextResponse.json({ status: 'ignored_duplicate' }, { status: 200 });
      }
      throw webhookError;
    }

    // 2.3: LÓGICA TRANSACIONAL BLINDADA
    const { subscriber_id, creator_id, tier_id, expires_at } = payload;
    
    if (eventType === 'new_sub' || eventType === 'rebill') {
      // Chama o RPC criado na Fase 2 para aplicar SELECT ... FOR UPDATE e previnir Race Conditions
      const { error: subError } = await supabase.rpc('process_subscription_event', {
        p_subscriber_id: subscriber_id,
        p_creator_id: creator_id,
        p_tier_id: tier_id,
        p_expires_at: expires_at
      });
      
      if (subError) throw subError;

      // 2.4: Execute Stripe Transfer for the subscription payout
      const { data: tier } = await supabase
        .from('subscription_tiers')
        .select('price')
        .eq('id', tier_id)
        .single();
        
      if (tier && tier.price > 0) {
        const { processSplitAndPayout } = await import('@/app/actions/payouts');
        await processSplitAndPayout({
          buyerId: subscriber_id,
          creatorId: creator_id,
          amountTotal: tier.price,
          transactionType: 'subscription',
          stripeSessionId: idempotencyKey,
        });
      }
    } else if (eventType === 'cancel') {
        // Logica para cancelamento (apenas revoga o status no banco)
        const { error: cancelError } = await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .match({ subscriber_id, creator_id });
          
        if (cancelError) throw cancelError;
    }

    // Sincronizando com a Fase 1: Recalcular a JWT claim para que o usuário
    // tenha acesso instantâneo ao diretório de mídias sem precisar deslogar.
    await supabase.rpc('update_user_subscription_claims', { target_user_id: subscriber_id });

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (err: any) {
    console.error('[Webhook Fatal]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
