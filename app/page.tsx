import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function LandingPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  // Se estiver logado, cai direto pro Feed, pulando a vitrine pública
  if (session) {
    redirect('/feed');
  }

  // Puxa as Maiores Estrelas (Gamificação de Receita) para a vitrine
  const { data: topCreators } = await supabase
    .from('profiles')
    .select('id, username, display_name, gamification_points')
    .eq('role', 'creator')
    .order('gamification_points', { ascending: false, nullsFirst: false })
    .limit(3);

  return (
    <div className="w-full flex flex-col items-center justify-center -mt-12">
      
      {/* Hero Section */}
      <section className="w-full max-w-4xl flex flex-col items-center text-center py-24 sm:py-32 px-4 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tighter mb-6 leading-tight">
          Where Desire <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-rose-500 drop-shadow-[0_0_15px_rgba(225,29,72,0.5)]">
            Meets Exclusivity
          </span>
        </h1>
        
        <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl font-medium mb-10 leading-relaxed">
          For those seeking unforgettable experiences. For those not afraid to profit from their audacity. The ultimate meeting point between pleasure and absolute freedom.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground font-black uppercase tracking-widest text-sm rounded-full shadow-glow hover:shadow-glow-lg transition-all hover:scale-105 active:scale-95">
            Join the Club
          </Link>
          <Link href="/become-creator" className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white font-bold text-sm rounded-full hover:bg-white/10 transition-all">
            Become a Creator
          </Link>
        </div>
      </section>

      {/* Vitrine de Creators (Aesthetic Glassmorphism) */}
      <section className="w-full max-w-5xl py-24 flex flex-col items-center px-4">
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter mb-4 text-center">
          Our <span className="text-amber-500">Stars</span>
        </h2>
        <p className="text-zinc-500 mb-12 text-center text-sm font-medium">The top-earning creators on the platform right now.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {topCreators?.map((creator, index) => (
            <div key={creator.id} className="relative group p-6 rounded-2xl bg-card border border-white/5 overflow-hidden hover:border-primary/50 transition-colors flex flex-col items-center text-center">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="w-20 h-20 rounded-full border-4 border-background bg-zinc-800 shadow-xl z-10 flex items-center justify-center font-bold text-2xl text-zinc-400 mb-4 uppercase">
                 {creator.username.charAt(0)}
              </div>
              
              <h3 className="font-bold text-white text-lg tracking-tight z-10">@{creator.username}</h3>
              <p className="text-xs text-muted-foreground mb-4 z-10">{creator.display_name || 'Official Creator'}</p>
              
              <div className="mt-auto z-10 flex items-center gap-2 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                 <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest">
                   Rank #{index + 1}
                 </span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
