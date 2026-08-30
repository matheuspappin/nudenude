import { SignJWT, jwtVerify } from 'jose'; // Biblioteca leve para JWT no Edge

export interface Env {
  MEDIA_BUCKET: R2Bucket;
  SUPABASE_JWT_SECRET: string;
  COOKIE_SECRET: string; // Segredo para assinar o Cookie da CDN
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // =========================================================================
    // ROTA 1: Emissão do Signed Cookie (3.2)
    // Chamada pelo Frontend/Next.js logo após o login no Supabase
    // =========================================================================
    if (url.pathname === '/api/generate-cookie' && request.method === 'POST') {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader) return new Response('Missing Auth', { status: 401 });
      
      const token = authHeader.replace('Bearer ', '');
      
      try {
        // 1. Valida de forma STATLESS o JWT do Supabase no Edge do Cloudflare
        const secret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        
        // 2. Extrai os creator_ids que foram injetados na Fase 1
        const subscribedCreators = payload.app_metadata?.subscribed_creators || [];
        const userId = payload.sub;

        // 3. Cria um Signed Cookie amarrando as permissões à CDN
        const cookiePayload = { sub: userId, allowed_creators: subscribedCreators };
        const cookieSecret = new TextEncoder().encode(env.COOKIE_SECRET);
        const signedCookie = await new SignJWT(cookiePayload)
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('24h') // Cookie válido por 24h
            .sign(cookieSecret);

        // 4. Retorna o Cookie assinado com HttpOnly e Secure
        const response = new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': `cf_media_auth=${signedCookie}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=86400`
          }
        });
        
        // Configuração de CORS rígida
        response.headers.set('Access-Control-Allow-Origin', 'https://seu-saas.com');
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        return response;

      } catch (err) {
        return new Response('Invalid Supabase Token', { status: 403 });
      }
    }

    // =========================================================================
    // ROTA 2: Servir Mídia Segura via R2 (3.1 e 3.2)
    // Intercepta pedidos como: https://cdn.seu-saas.com/{creator_id}/{post_id}/video.m3u8
    // =========================================================================
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length >= 2) {
      const creatorId = pathParts[0]; // A pasta raiz no R2 é o ID do criador (Zero Egress architecture)

      // Pega o Signed Cookie gerado anteriormente
      const cookieHeader = request.headers.get('Cookie') || '';
      const match = cookieHeader.match(/cf_media_auth=([^;]+)/);
      const mediaAuthCookie = match ? match[1] : null;

      if (!mediaAuthCookie) {
         return new Response('Unauthorized - Missing Signed Cookie', { status: 401 });
      }

      try {
        // Valida criptograficamente se o cookie foi forjado
        const cookieSecret = new TextEncoder().encode(env.COOKIE_SECRET);
        const { payload } = await jwtVerify(mediaAuthCookie, cookieSecret);
        
        const allowedCreators = (payload.allowed_creators as string[]) || [];

        // Verifica se o usuário é o DONO do conteúdo ou se PAGOU (assinado) por ele
        if (!allowedCreators.includes(creatorId) && payload.sub !== creatorId) {
           return new Response('Forbidden - Active Subscription Required', { status: 403 });
        }

        // Tudo OK! Busca os segmentos (.ts e .m3u8) diretamente do Cloudflare R2
        const object = await env.MEDIA_BUCKET.get(url.pathname.substring(1));
        if (!object) {
          return new Response('Not Found', { status: 404 });
        }

        // Monta a resposta de mídia otimizada
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        
        // Fundamental para Players de Vídeo (HLS) consumirem a CDN
        headers.set('Access-Control-Allow-Origin', 'https://seu-saas.com');
        headers.set('Access-Control-Allow-Credentials', 'true');

        return new Response(object.body, { headers });
      } catch (err) {
        return new Response('Invalid or Expired Signed Cookie', { status: 403 });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};
