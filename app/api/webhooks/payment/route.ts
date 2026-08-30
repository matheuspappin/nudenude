import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usamos a Service Role Key para garantir permissões totais no backend, 
// pois essa rota processa pagamentos e ignora RLS publicamente.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
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
