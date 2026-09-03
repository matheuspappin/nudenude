import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // Para um app real, o userId viria de um token JWT (ex: do @supabase/ssr ou @privy-io)
    // Aqui estamos simulando via corpo da requisição para facilitar o teste local
    const { userId, lessonId } = await req.json();

    if (!userId || !lessonId) {
      return NextResponse.json({ error: 'Missing userId or lessonId' }, { status: 400 });
    }

    // 1. Obter a lesson para saber qual o courseId e video_url
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('video_url, modules!inner(courses!inner(id, creator_id))')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson || !lesson.video_url) {
      return NextResponse.json({ error: 'Lesson or video not found' }, { status: 404 });
    }

    const courseId = (lesson.modules as any).courses.id;
    const creatorId = (lesson.modules as any).courses.creator_id;

    // 2. Verificar permissão: é o criador ou comprou o curso?
    let hasAccess = false;

    if (userId === creatorId) {
      hasAccess = true;
    } else {
      const { data: purchase } = await supabase
        .from('purchases')
        .select('status')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

      if (purchase && purchase.status === 'completed') {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized to view this lesson' }, { status: 403 });
    }

    // 3. Gerar Signed URL para o bucket 'courses'
    // video_url é o path relativo, ex: "creator_id/video.mp4"
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from('courses')
      .createSignedUrl(lesson.video_url, 300); // 300 segundos = 5 minutos

    if (signedUrlError || !signedUrlData) {
      console.error('Error generating signed URL:', signedUrlError);
      return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: signedUrlData.signedUrl });
  } catch (err: any) {
    console.error('Error in video token route:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
