# DanceCreator

Plataforma de criadores para o mundo da dança. Professores e criadores publicam aulas, cursos e eventos e vendem acesso por assinatura ou por conteúdo avulso.

<!-- Adicione aqui 2–3 prints (feed, perfil do criador, dashboard) ou um GIF curto. Use apenas dados fictícios. -->

## O problema

Professores de dança vendem aulas online espalhados entre Instagram, WhatsApp, Hotmart e links de pagamento soltos. O DanceCreator junta perfil público, conteúdo protegido, cobrança recorrente e repasse em um só lugar.

## Funcionalidades

- **Perfis de criador** com capa, estatísticas reais e página pública em `/[username]`
- **Assinaturas com vários planos** e **conteúdo pago avulso (PPV)**; o feed bloqueia ou libera posts conforme o acesso do usuário
- **Cursos, eventos e coleções** de posts
- **Repasse automático** para criadores e afiliados via Stripe Connect
- **Programa de afiliados** com rastreamento de indicações
- **Vídeo protegido**: streaming HLS e um Cloudflare Worker (`cloudflare-workers/media-auth`) que valida o acesso antes de liberar a mídia
- **Painel administrativo** com suspensão de contas e configurações da plataforma
- **Gamificação e estatísticas diárias** para criadores

## Arquitetura

```
app/                  → Next.js App Router (páginas, rotas de API e server actions)
  api/checkout*       → criação de checkout e assinaturas no Stripe
  api/webhooks/       → webhooks de pagamento (Stripe, billing)
  api/videos/token    → token de acesso a vídeo
components/           → feed, player de vídeo, sidebar, checkout
cloudflare-workers/   → autorização de mídia na borda
supabase/migrations/  → schema versionado (18 migrations)
docs/architecture/    → decisões de arquitetura
```

### Decisões técnicas

- **Row Level Security no Postgres**: o controle de acesso fica no banco, não só na API.
- **Webhooks idempotentes**: eventos de pagamento duplicados não geram cobrança nem liberação em dobro.
- **Mídia na borda**: o Worker da Cloudflare checa a permissão sem passar pelo servidor Next.js.

## Stack

Next.js 14 · React 18 · TypeScript · Tailwind CSS · Supabase (Postgres, Auth, RLS) · Stripe e Stripe Connect · Cloudflare Workers · hls.js

## Como rodar

Pré-requisitos: Node.js 20+, um projeto Supabase e uma conta Stripe em modo de teste.

```bash
git clone https://github.com/matheuspappin/dancecreator.git
cd dancecreator
npm install
cp .env.example .env.local   # preencha as chaves do Supabase e do Stripe
npm run dev                  # http://localhost:3005
```

Aplique as migrations de `supabase/migrations/` em ordem numérica no seu projeto Supabase.

## Status

Em desenvolvimento ativo. <!-- Liste aqui o que funciona hoje e o que vem a seguir. -->

## Autor

Desenvolvido por [Matheus Pappin](https://github.com/matheuspappin).
