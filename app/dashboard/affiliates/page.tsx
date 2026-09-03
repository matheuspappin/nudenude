'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function AffiliatesDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [referredCreators, setReferredCreators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteUrl, setInviteUrl] = useState('');

  const supabase = createClient();

  useEffect(() => {
    async function fetchAffiliateData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const uid = session.user.id;
      setUserId(uid);
      setInviteUrl(`${window.location.origin}/signup?role=creator&ref=${uid}`);

      // Fetch all creators referred by this user
      const { data: referrals } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, created_at')
        .eq('referred_by', uid);

      // Fetch all earnings for this user
      const { data: earningsData } = await supabase
        .from('affiliate_earnings')
        .select('referred_creator_id, amount')
        .eq('affiliate_id', uid);

      let total = 0;
      const earningsByCreator: Record<string, number> = {};

      if (earningsData) {
        earningsData.forEach(e => {
          total += Number(e.amount);
          if (!earningsByCreator[e.referred_creator_id]) {
            earningsByCreator[e.referred_creator_id] = 0;
          }
          earningsByCreator[e.referred_creator_id] += Number(e.amount);
        });
      }

      setTotalEarnings(total);

      if (referrals) {
        const enrichedReferrals = referrals.map(ref => ({
          ...ref,
          total_generated: earningsByCreator[ref.id] || 0
        })).sort((a, b) => b.total_generated - a.total_generated); // Sort by highest earning
        
        setReferredCreators(enrichedReferrals);
      }

      setIsLoading(false);
    }
    fetchAffiliateData();
  }, [supabase]);

  const copyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    alert('Link de convite copiado!');
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Afiliados</h1>
        <p className="text-sm text-zinc-400 mt-1">Gerencie seus links de indicação e acompanhe seus ganhos automáticos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 p-6 bg-card border border-white/10 rounded-xl shadow-sm flex flex-col justify-center">
          <label className="text-sm font-bold text-white mb-4">Seu Link Exclusivo</label>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input 
              type="text" 
              readOnly 
              value={inviteUrl} 
              className="w-full h-12 rounded-lg bg-background border border-white/10 px-4 text-zinc-400 focus:outline-none"
            />
            <button 
              onClick={copyLink}
              className="w-full sm:w-auto h-12 px-6 bg-primary text-primary-foreground font-bold shadow-glow text-sm rounded-lg hover:bg-primary/90 transition-colors shrink-0"
            >
              Copiar Link
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-4">Qualquer criador que se cadastrar usando este link ficará permanentemente vinculado à sua conta, gerando comissões automáticas em cada venda.</p>
        </div>

        <div className="p-6 bg-card border border-white/10 rounded-xl shadow-sm flex flex-col justify-between group hover:border-primary/20 transition-colors">
          <p className="text-sm font-medium text-zinc-400">Total Ganho (Indicações)</p>
          <div className="mt-4">
            <p className="text-4xl font-black text-white tracking-tighter text-primary">${totalEarnings.toFixed(2)}</p>
            <p className="text-xs text-zinc-500 font-semibold mt-3">Depositado via Stripe Connect</p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-card border border-white/10 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold text-white mb-6">Criadores Indicados por você</h2>
        
        {referredCreators.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 border border-dashed border-white/10 rounded-xl bg-white/5">
            Você ainda não indicou nenhum criador. Compartilhe seu link!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-400 uppercase bg-black/20 border-y border-white/10">
                <tr>
                  <th className="px-4 py-3 font-medium">Criador</th>
                  <th className="px-4 py-3 font-medium">Data de Cadastro</th>
                  <th className="px-4 py-3 font-medium text-right">Comissões Geradas</th>
                </tr>
              </thead>
              <tbody>
                {referredCreators.map((creator) => (
                  <tr key={creator.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0">
                          {creator.avatar_url ? (
                            <img src={creator.avatar_url} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-zinc-500">{creator.username.charAt(0).toUpperCase()}</div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white">{creator.display_name || creator.username}</p>
                          <p className="text-xs text-zinc-500">@{creator.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-zinc-400">
                      {new Date(creator.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-bold text-primary">${creator.total_generated.toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
