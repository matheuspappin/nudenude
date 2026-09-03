import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const AKAAI_BILLING_SECRET = process.env.AKAAI_BILLING_SECRET || 'ak_live_a1b2c3d4e5f6g7h8i9j0';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    
    // Autenticação Server-to-Server com timing-safe comparison
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const expectedTokenBuffer = Buffer.from(AKAAI_BILLING_SECRET);
    const providedTokenBuffer = Buffer.from(token);

    if (expectedTokenBuffer.length !== providedTokenBuffer.length || 
        !crypto.timingSafeEqual(expectedTokenBuffer, providedTokenBuffer)) {
      return NextResponse.json({ error: 'Unauthorized Relay' }, { status: 401 });
    }

    const event = await req.json();

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { type, userId, courseId, creatorId, targetId, eventId } = session.metadata || {};

      if (!userId) {
        throw new Error('User ID is missing in relayed session metadata');
      }

      const paymentType = type || (courseId ? 'course' : null);
      
      switch (paymentType) {
        case 'course':
          const cid = courseId || targetId;
          if (cid) {
             const { error: purchaseError } = await supabase
               .from('purchases')
               .upsert({
                 user_id: userId,
                 course_id: cid,
                 status: 'completed',
               });
             if (purchaseError) throw purchaseError;
          }
          break;

        case 'subscription':
          const crId = creatorId || targetId;
          if (crId) {
             const { error: subError } = await supabase
               .from('subscriptions')
               .upsert({
                 student_id: userId,
                 creator_id: crId,
                 status: 'active',
               }, { onConflict: 'student_id, creator_id' }); 
             if (subError) throw subError;
          }
          break;

        case 'dropin':
          const evId = eventId || targetId;
          if (evId) {
             console.log(`[Relay Received] Dropin confirmed for user ${userId} event ${evId}`);
             // Futuramente inserir em tabela 'bookings'
          }
          break;
          
        default:
          console.log(`[Relay Received] Unhandled metadata type: ${paymentType}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Error processing billing relay:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
