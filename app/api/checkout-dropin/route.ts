import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const AKAAICORE_API_URL = process.env.AKAAICORE_API_URL || 'http://localhost:3000/api/billing';
const AKAAI_BILLING_SECRET = process.env.AKAAI_BILLING_SECRET || 'ak_live_a1b2c3d4e5f6g7h8i9j0';

export async function POST(req: Request) {
  try {
    const { eventId, userId } = await req.json();

    if (!eventId || !userId) {
      return NextResponse.json({ error: 'Missing eventId or userId' }, { status: 400 });
    }

    const { data: event, error: eventError } = await supabase
      .from('creator_events')
      .select('*, profiles(username)')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const price = event.ticket_price || 20.00;
    const origin = req.headers.get('origin') || 'http://localhost:3005';
    const creatorUsername = event.profiles?.username || 'creator';

    // Chama o Gateway do AkaaiCore
    const response = await fetch(`${AKAAICORE_API_URL}/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AKAAI_BILLING_SECRET}`,
      },
      body: JSON.stringify({
        tenant: 'dancecreator',
        type: 'dropin',
        userId: userId,
        targetId: eventId,
        price: price,
        name: `Drop-in Class: ${event.title}`,
        description: `${new Date(event.event_date).toLocaleString()} at ${event.location}`,
        successUrl: `${origin}/${creatorUsername}?success=true`,
        cancelUrl: `${origin}/${creatorUsername}?canceled=true`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to communicate with Billing Gateway');
    }

    return NextResponse.json({ url: data.url });
  } catch (err: any) {
    console.error('Error creating drop-in checkout via Gateway:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
