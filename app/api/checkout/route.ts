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
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Validate Supabase JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    }

    const verifiedUserId = user.id;

    const { courseId, userId } = await req.json();

    if (!courseId || !userId) {
      return NextResponse.json({ error: 'Missing courseId or userId' }, { status: 400 });
    }

    if (userId !== verifiedUserId) {
      return NextResponse.json({ error: 'Unauthorized: User ID mismatch' }, { status: 403 });
    }

    // 1. Busca os detalhes do curso no banco local
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // 2. Verifica se o usuário já comprou
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('status')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .single();

    if (existingPurchase && existingPurchase.status === 'completed') {
      return NextResponse.json({ error: 'User already owns this course' }, { status: 403 });
    }

    const origin = req.headers.get('origin') || 'http://localhost:3005';

    // 3. Chama o Gateway do AkaaiCore
    const response = await fetch(`${AKAAICORE_API_URL}/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AKAAI_BILLING_SECRET}`,
      },
      body: JSON.stringify({
        tenant: 'dancecreator',
        type: 'course',
        userId: userId,
        targetId: courseId,
        price: course.price,
        name: course.title,
        description: course.description,
        successUrl: `${origin}/courses/${courseId}?success=true`,
        cancelUrl: `${origin}/courses/${courseId}?canceled=true`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to communicate with Billing Gateway');
    }

    return NextResponse.json({ url: data.url });
  } catch (err: any) {
    console.error('Error creating checkout session via Gateway:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
