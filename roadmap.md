Documento de Planejamento: Ecossistema de Assinaturas (Adult/Creator SaaS)
Instrução para a IA: Este é o nosso roadmap de implementação. Não gere todo o código de uma vez. Aguarde meu comando para iniciar cada Fase. Ao final de cada etapa, valide se os requisitos de mitigação de gargalos (JWT Claims, Idempotência, Cloudflare R2) foram rigorosamente seguidos.

Fase 1: Infraestrutura de Dados e Segurança (Supabase)
1.1 Migrations Iniciais: Criar tabelas profiles (criadores e assinantes), tiers (planos), subscriptions (assinaturas ativas) e media/posts.

1.2 Otimização de RLS: Implementar a função RPC no PostgreSQL para injetar os IDs dos criadores nos Custom Claims do JWT (auth.jwt()) durante o login ou atualização de token.

1.3 Políticas de Acesso: Configurar o Row Level Security (RLS) para que a leitura de media seja validada exclusivamente pelos claims do JWT, sem queries de JOIN na tabela subscriptions.

Fase 2: Motor de Pagamentos e Idempotência (Webhooks)
2.1 Schema de Transações: Criar tabela webhook_events com idempotency_key (UNIQUE) para rastrear o que já foi processado.

2.2 Rota de Webhook (Edge/Node): Desenvolver o endpoint que receberá os postbacks do gateway de alto risco.

2.3 Lógica Transacional: Implementar o parser de eventos (new_sub, rebill, cancel) usando SELECT ... FOR UPDATE para evitar condições de corrida (race conditions) em webhooks duplicados.

Fase 3: CDN, Proteção de Mídia e Streaming (Cloudflare)
3.1 Estrutura de Storage: Definir a lógica de pastas no Cloudflare R2 (ex: /{creator_id}/{post_id}/).

3.2 Cloudflare Worker (Signed Cookies): Criar o Worker que valida o JWT do usuário e emite um Signed Cookie válido por 24 horas, liberando o acesso ao diretório do criador correspondente.

3.3 Moderação Assíncrona: Criar o trigger de upload. Mídias novas recebem status = pending e disparam um evento para a API de moderação (Sightengine/Rekognition) antes de se tornarem públicas.

Fase 4: Integração de Frontend e Consumo de Mídia (Next.js)
4.1 Autenticação e Sincronização: Lógica de login atualizando o JWT com as permissões mais recentes.

4.2 Feed de Conteúdo: UI de rolagem infinita. Posts bloqueados mostram um paywall ou versão borrada; posts liberados carregam a mídia.

4.3 Player de Vídeo: Integração de um player (como Video.js) configurado para ler manifestos HLS (.m3u8) e arquivos .ts diretamente da CDN utilizando o Signed Cookie.

Fase 5: Dashboard e KYC do Criador
5.1 Fluxo de KYC: Formulário seguro para envio de documentação (Frente, Verso, Selfie).

5.2 Gestão de Planos: Interface para o criador definir valores de assinatura e criar pacotes promocionais.

5.3 Métricas Financeiras: Dashboard de ganhos lendo as consolidações da tabela subscriptions.
