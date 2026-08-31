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

      let finalPosts: Post[] = [];
      let totalPostsCount = 0;
      let totalMediaCount = 0;

      let purchasedMediaIds = new Set();
      if (session && !isCreatorView) {
        // Fetch purchased media for this user
        const { data: purchases } = await supabase
          .from('purchased_media')
          .select('media_id')
          .eq('user_id', session.user.id);
        
        if (purchases) {
          purchases.forEach(p => purchasedMediaIds.add(p.media_id));
        }
      }

      if (session && (isSubscribed || isCreatorView)) {
        // 3. Busca Posts APENAS se o usuário estiver logado e tiver permissão (assinante ou dono)
        const { data: postsData } = await supabase
          .from('media')
          .select('*')
          .eq('creator_id', profileData.id)
          .order('created_at', { ascending: false });

        if (postsData) {
          totalPostsCount = postsData.length;
          totalMediaCount = postsData.filter(p => p.media_url).length;

          finalPosts = postsData.map(p => {
            let mediaArr = [];
            if (p.media_urls && Array.isArray(p.media_urls)) {
              mediaArr = p.media_urls;
            } else if (p.media_url) {
              mediaArr = [p.media_url];
            }

            const isUnlocked = (p.price && p.price > 0 && !purchasedMediaIds.has(p.id)) ? false : true;

            return {
              id: p.id,
              creator_id: p.creator_id,
              creator_name: profileData.username,
              post_text: p.post_text || '',
              media_urls: mediaArr,
              is_unlocked: isUnlocked,
              price: p.price
            };
          });
        }
      } else {
        // 4. PAYWALL ESTrito (Compliance MoonPay)
        // Se não for assinante ou não estiver logado, NENHUM conteúdo real vaza para o frontend.
        // Apenas geramos N "Cadeados" genéricos.
        totalPostsCount = creator?.totalPostsCount || 15; // Fake count
        totalMediaCount = creator?.totalMediaCount || 24; // Fake count
        
        const fakeLockedPosts = Array.from({ length: 5 }).map((_, i) => ({
          id: `locked_${i}`,
          creator_id: profileData.id,
          creator_name: profileData.username,
          post_text: 'Premium Creator Content. Subscribe or login to unlock.',
          media_urls: ['', '', ''], // Mock media
          is_unlocked: false,
          price: 0
        }));
        finalPosts = fakeLockedPosts;
      }

      setPosts(finalPosts);
      setCreator({ ...profileData, totalPostsCount, totalMediaCount });
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
      <div 
        className="w-full h-48 sm:h-56 rounded-b-2xl bg-zinc-900 border-b border-x border-white/10 mb-20 relative overflow-visible bg-cover bg-center"
        style={creator.cover_url ? { backgroundImage: `url(${creator.cover_url})` } : {}}
      >
        {!creator.cover_url && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-zinc-900 rounded-b-2xl opacity-50" />
        )}
        
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
          {creator.totalPostsCount || 0} POSTS
        </button>
        <button 
          onClick={() => setActiveTab('media')}
          className={`flex-1 pb-4 text-sm font-bold transition-colors ${activeTab === 'media' ? 'text-primary border-b-2 border-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          {creator.totalMediaCount || 0} MÍDIAS
        </button>
        <button 
          onClick={() => setActiveTab('likes')}
          className={`flex-1 pb-4 text-sm font-bold transition-colors ${activeTab === 'likes' ? 'text-primary border-b-2 border-primary' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          {(creator.gamification_points || 0).toLocaleString()} LIKES
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
