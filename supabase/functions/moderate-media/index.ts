import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// 3.3 - Moderação Assíncrona via Supabase Edge Functions
// Esta função é chamada nativamente por um Database Webhook sempre que 
// há um `INSERT` na tabela `public.media` (onde o status entra como 'pending')
serve(async (req) => {
  try {
    const payload = await req.json()
    const { record } = payload // A nova linha na tabela media

    // Ignora se não for uma inserção pendente
    if (!record || record.status !== 'pending') {
      return new Response("Not a pending media", { status: 200 })
    }

    // Inicializa Service Role Key para poder atualizar a tabela
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Caminho da mídia no Cloudflare R2
    const mediaUrl = `https://cdn.seu-saas.com/${record.media_url}` 
    
    // Como é um SaaS de conteúdo adulto, o compliance (Sightengine/AWS Rekognition)
    // foca em detectar CSAM (Child Sexual Abuse Material), violência extrema ou drogas.
    
    console.log(`[Moderação] Iniciando scan para a mídia: ${mediaUrl}`)
    
    /* 
    // Exemplo de integração com API externa (Sightengine):
    const moderationResponse = await fetch('https://api.sightengine.com/1.0/check.json', {
       method: 'POST',
       body: JSON.stringify({
          media: mediaUrl,
          models: 'wad,gore', // Weapons, Drugs, Gore
          api_user: Deno.env.get('SIGHTENGINE_USER'),
          api_secret: Deno.env.get('SIGHTENGINE_SECRET')
       })
    })
    const modData = await moderationResponse.json()
    // Aprova se não tiver gore, armas ou drogas (conforme regra de compliance)
    const isApproved = modData.weapon.prob < 0.5 && modData.gore.prob < 0.5
    */

    // Simulação da aprovação para o exemplo
    const isApproved = true; 

    if (isApproved) {
      // Atualiza o post para 'active'. A partir de agora, o RLS da Fase 1 permite leitura.
      await supabase
        .from('media')
        .update({ status: 'active' })
        .eq('id', record.id)
        
      console.log(`[Moderação] APROVADA: ${record.id}`)
    } else {
      // Rejeita a mídia (permanece invisível devido ao status = 'rejected')
      await supabase
        .from('media')
        .update({ status: 'rejected' })
        .eq('id', record.id)
        
      console.log(`[Moderação] REJEITADA: ${record.id}`)
    }

    return new Response(JSON.stringify({ success: true }), { 
      headers: { "Content-Type": "application/json" } 
    })

  } catch (error: any) {
    console.error('Erro na pipeline de moderação:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
