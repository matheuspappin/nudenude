import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createAdminClient();

    // Mockando recebimento de Webhook do Stripe ou CCBill
    // Em prod, checaríamos crypto headers: const sig = req.headers.get('stripe-signature')
    
    const { type, data } = body;

    // Se o pagamento for bem-sucedido
    if (type === 'payment_intent.succeeded' || type === 'checkout.session.completed') {
      const { metadata, amount_total } = data.object;
      
      // Converte centavos para dólar (Padrão Stripe)
      const amountUSD = amount_total / 100;
      
      const buyerId = metadata.buyer_id;
      const creatorId = metadata.creator_id;
      const transactionType = metadata.transaction_type; // 'subscription', 'ppv', ou 'tip'
      const affiliateId = metadata.affiliate_id; // Passado pelo frontend durante o checkout baseado no cookie

      let affiliateCut = 0;

      // Se houver um afiliado, calcula a fatia de comissão dele
      if (affiliateId) {
        const { data: creatorProfile } = await supabase
          .from('profiles')
          .select('affiliate_fee_percentage')
          .eq('id', creatorId)
          .single();

        if (creatorProfile?.affiliate_fee_percentage) {
           affiliateCut = amountUSD * (creatorProfile.affiliate_fee_percentage / 100);
        }
      }

      // 1. Registra no Livro-Caixa com Split de Afiliado
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          buyer_id: buyerId,
          creator_id: creatorId,
          amount: amountUSD,
          type: transactionType,
          status: 'completed',
          gateway_reference: data.object.id,
          affiliate_id: affiliateId || null,
          affiliate_cut: affiliateCut
        });

      if (txError) throw txError;
      
      // OBS: A inserção como 'completed' vai disparar o TRIGGER 'process_gamification_points' 
      // diretamente no banco de dados, injetando pontos no creatorId!

      // 2. Se for Assinatura, ativa o acesso
      if (transactionType === 'subscription') {
        await supabase
          .from('subscriptions')
          .upsert({
            subscriber_id: buyerId,
            creator_id: creatorId,
            status: 'active',
            tier_id: metadata.tier_id || 'default',
            // Mock de 30 dias de validade
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook Error:', error.message);
    return NextResponse.json({ error: 'Webhook Handler Failed' }, { status: 400 });
  }
}
