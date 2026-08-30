'use client';
import { useState, useEffect } from 'react';
import Feed, { Post } from '@/components/Feed';
import { createClient } from '@/utils/supabase/client';
import { notFound, useSearchParams } from 'next/navigation';

export default function CreatorProfile({ params }: { params: { username: string } }) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('posts');
  const [creator, setCreator] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isCreatorView, setIsCreatorView] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // 0. Captura Rastreio de Afiliado (?ref=)
    const refId = searchParams.get('ref');
    if (refId) {
       // Salva o cookie válido por 30 dias
       document.cookie = `nudenude_ref_${params.username}=${refId}; max-age=${30 * 24 * 60 * 60}; path=/`;
    }

    async function fetchData() {
      // 1. Pega usuário logado
      const { data: { session } } = await supabase.auth.getSession();
      
      // 2. Busca perfil do criador
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', params.username)
        .eq('role', 'creator')
        .single();
        
      if (profileError || !profileData) {
        setIsLoading(false);
        return; // handle 404 later
      }
      setCreator(profileData);

      if (session) {
        setIsCreatorView(session.user.id === profileData.id);
        
        // Verifica se assina (Lendo a tabela de subscriptions)
        if (session.user.id !== profileData.id) {
          const { data: subData } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('subscriber_id', session.user.id)
            .eq('creator_id', profileData.id)
            .eq('status', 'active')
            .maybeSingle();
            
          if (subData) setIsSubscribed(true);
        } else {
          setIsSubscribed(true); // Dono assina a si mesmo logicamente
        }
      }

      // 3. Busca Posts (O RLS filtrará automaticamente os travados se não for assinante)
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('creator_id', profileData.id)
        .order('created_at', { ascending: false });

      let finalPosts: Post[] = [];
      if (postsData) {
        finalPosts = postsData.map(p => ({
          id: p.id,
          creator_id: p.creator_id,
          creator_name: profileData.username,
          post_text: p.content_text || '',
          media_urls: p.media_urls || [],
          is_unlocked: true // Se o RLS retornou, é porque tá desbloqueado pra ele
        }));
      }

      // 4. PAYWALL SINTÉTICO (A MÁGICA DA FASE 4)
      // Se não for assinante, nós geramos N "Cadeados" para dar a sensação de que há muito conteúdo bloqueado
      // Sem de fato retornar o conteúdo do banco de dados (que está protegido pelo RLS).
      if (!isSubscribed && session?.user.id !== profileData.id) {
         // Mock de 5 posts cadeados para marketing
         const fakeLockedPosts = Array.from({ length: 5 }).map((_, i) => ({
           id: `locked_${i}`,
           creator_id: profileData.id,
           creator_name: profileData.username,
           post_text: 'Conteúdo exclusivo para assinantes VIP. Desbloqueie agora para ver.',
           media_urls: ['', '', ''], // Mock de um combo de 3 mídias bloqueadas
           is_unlocked: false
         }));
         finalPosts = [...finalPosts, ...fakeLockedPosts];
      }

      setPosts(finalPosts);
      setIsLoading(false);
    }
    
    fetchData();
  }, [params.username, supabase, isSubscribed]);

  if (isLoading) {
    return <div className="w-full py-20 text-center text-zinc-500">Carregando perfil...</div>;
  }
  
  if (!creator) {
    return <div className="w-full py-20 text-center text-red-500 font-bold">Criador não encontrado.</div>;
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      <div className="w-full h-48 sm:h-56 rounded-b-2xl bg-zinc-900 border-b border-x border-white/10 mb-20 relative overflow-visible">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-zinc-900 rounded-b-2xl opacity-50" />
        
        <div className="absolute -bottom-16 left-6 flex items-end gap-5">
          <div className="w-32 h-32 rounded-full border-4 border-background bg-zinc-800 flex items-center justify-center shadow-2xl overflow-hidden">
             {creator.avatar_url ? (
                <img src={creator.avatar_url} alt={creator.username} className="w-full h-full object-cover" />
             ) : (
                <span className="text-4xl font-bold text-zinc-400 uppercase">{creator.username.charAt(0)}</span>
             )}
          </div>
          <div className="mb-4">
             <h1 className="text-2xl font-bold text-white tracking-tight">@{creator.username}</h1>
             <div className="flex items-center gap-3 mt-1">
               <p className="text-muted-foreground text-xs font-medium">
                 {creator.display_name || 'Criador Oficial'}
               </p>
               {creator.gamification_points > 0 && (
                 <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded shadow-glow">
                   ★ {creator.gamification_points} pt
                 </span>
               )}
             </div>
          </div>
        </div>
        
        {/* Se for apenas um consumidor vendo e não for assinante, mostramos botão */}
        {!isCreatorView && !isSubscribed && (
          <div className="absolute -bottom-6 right-6 hidden sm:block">
             <button className="h-11 px-8 rounded-full bg-primary text-primary-foreground font-bold shadow-glow hover:shadow-glow-lg transition-all duration-300">
               Assinar VIP - $9.99/mês
             </button>
          </div>
        )}
      </div>

      <div className="w-full px-4 mb-6">
        <p className="text-sm text-zinc-300 leading-relaxed">
          {creator.bio || 'Bem-vindo ao meu VIP! 🖤 Postagens exclusivas diárias, ensaios e prioridade nas mensagens.'}
        </p>
      </div>

      {/* TABS DE NAVEGAÇÃO: Dinâmica pura do OnlyFans */}
      <div className="w-full border-b border-white/10 flex mb-8">
        <button 
          onClick={() => setActiveTab('posts')}
          className={`flex-1 pb-4 text-sm font-bold transition-colors ${activeTab === 'posts' ? 'text-primary border-b-2 border-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          120 POSTS
        </button>
        <button 
          onClick={() => setActiveTab('media')}
          className={`flex-1 pb-4 text-sm font-bold transition-colors ${activeTab === 'media' ? 'text-primary border-b-2 border-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          85 MÍDIAS
        </button>
        <button 
          onClick={() => setActiveTab('likes')}
          className={`flex-1 pb-4 text-sm font-bold transition-colors ${activeTab === 'likes' ? 'text-primary border-b-2 border-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          1.2M LIKES
        </button>
      </div>

      <div className="w-full">
        {activeTab === 'posts' && <Feed isCreatorView={isCreatorView} posts={posts} isSubscribed={isSubscribed} />}
        {activeTab !== 'posts' && (
          <div className="py-20 text-center text-sm text-zinc-500 font-medium">
            (Exibindo conteúdo de {activeTab} filtrado)
          </div>
        )}
      </div>
    </div>
  );
}
