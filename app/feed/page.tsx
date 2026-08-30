import Feed from '@/components/Feed';
import SearchBar from '@/components/SearchBar';
import TopCreatorsList from '@/components/TopCreatorsList';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';

export default async function HomePage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  let feedPosts: any[] = [];
  
  // Como o RLS está ativo, essa query vai retornar automaticamente apenas os posts
  // que o usuário atual tem permissão de ver (Os que ele assina ou os públicos)
  if (session) {
    const { data } = await supabase
      .from('posts')
      .select(`
        id, creator_id, content_text, media_urls, is_locked, created_at,
        profiles ( username, display_name )
      `)
      .order('created_at', { ascending: false });
      
    if (data) {
      feedPosts = data.map((p: any) => ({
        id: p.id,
        creator_id: p.creator_id,
        creator_name: p.profiles?.username || 'Unknown',
        post_text: p.content_text,
        media_urls: p.media_urls || [],
        is_unlocked: !p.is_locked
      }));
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex gap-10 items-start mt-4 px-4 sm:px-0">
      
      {/* Coluna Central: Home Timeline infinita (Apenas Assinaturas) */}
      <div className="flex-1 w-full flex flex-col">
        <div className="w-full flex items-center justify-between mb-6 border-b border-white/10 pb-4 gap-4">
          <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block shrink-0">
            Exclusive Feed
          </h1>
          
          {/* Barra de Pesquisa Reativa */}
          <SearchBar />
        </div>
        
        <p className="text-xs text-zinc-500 font-medium mb-4 -mt-2">
          Showing the latest updates from creators you subscribe to.
        </p>

        {session ? (
          <Feed posts={feedPosts} />
        ) : (
          <div className="p-8 text-center bg-card border border-white/5 rounded-xl text-zinc-400 text-sm">
            Please <Link href="/login" className="text-primary hover:underline">Log in</Link> to view your Exclusive Feed.
          </div>
        )}
      </div>

      {/* Coluna Direita: Mural de Líderes (Top Creators) */}
      <aside className="w-80 flex-shrink-0 hidden lg:flex flex-col gap-6 sticky top-24">
        <div className="bg-card border border-white/10 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
             <h2 className="text-xs font-bold text-amber-500 uppercase tracking-widest">Top Creators</h2>
             <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20">Trending</span>
          </div>
          
          <div className="flex flex-col gap-5">
            {/* Buscando dinamicamente do banco de dados abaixo */}
            <TopCreatorsList />
          </div>
          
          <Link href="/explore" className="block text-center w-full mt-6 py-2.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors text-xs font-bold text-zinc-300">
            Explore Full Ranking
          </Link>
        </div>
        
        {/* Footer */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 px-2 text-[11px] text-zinc-600 font-medium">
          <a href="#" className="hover:underline">Privacy</a>
          <a href="#" className="hover:underline">Terms</a>
          <a href="#" className="hover:underline">Support</a>
          <span>© 2026 NudeNude</span>
        </div>
      </aside>
      
    </div>
  );
}
