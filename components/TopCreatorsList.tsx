import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';

export default async function TopCreatorsList() {
  const supabase = createClient();
  
  const { data: topCreators } = await supabase
    .from('profiles')
    .select('id, username, display_name, gamification_points')
    .eq('role', 'creator')
    .order('gamification_points', { ascending: false, nullsFirst: false })
    .limit(5);

  if (!topCreators || topCreators.length === 0) {
    return <div className="text-sm text-zinc-500">No creators ranked yet.</div>;
  }

  return (
    <>
      {topCreators.map((creator, index) => (
        <div key={creator.id} className="flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-bold text-zinc-400 uppercase">
                {creator.username.charAt(0)}
              </div>
              {/* Medalha para o Top 3 */}
              {index < 3 && (
                <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black shadow-glow ${
                  index === 0 ? 'bg-yellow-500 text-yellow-950' : 
                  index === 1 ? 'bg-zinc-300 text-zinc-800' : 
                  'bg-amber-700 text-amber-100'
                }`}>
                  {index + 1}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-tight group-hover:text-primary transition-colors">@{creator.username}</span>
              <span className="text-xs text-amber-500/80 font-bold">★ {creator.gamification_points || 0} pts</span>
            </div>
          </div>
          <Link href={`/${creator.username}`} className="text-xs text-primary font-bold hover:underline bg-primary/10 px-2 py-1 rounded">
            View
          </Link>
        </div>
      ))}
    </>
  );
}
