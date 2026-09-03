'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function AffiliateManagement() {
  const [creators, setCreators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [expirationValues, setExpirationValues] = useState<Record<string, string>>({});
  const [affiliateRelations, setAffiliateRelations] = useState<any[]>([]);
  
  const supabase = createClient();

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    setIsLoading(true);
    
    // Fetch all creators with their referral info
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, gamification_points, affiliate_fee_percentage, referred_by, is_creator')
      .eq('is_creator', true)
      .order('gamification_points', { ascending: false });
      
    if (data) {
      setCreators(data);
      const initialEdits: Record<string, string> = {};
      data.forEach(c => {
        initialEdits[c.id] = c.affiliate_fee_percentage?.toString() || '10.00';
      });
      setEditValues(initialEdits);
    }

    // Fetch affiliate relationships for expiration management
    const { data: affiliateData } = await supabase
      .from('affiliates')
      .select('*, affiliate:profiles!affiliate_id(username), creator:profiles!creator_id(username)');
    
    if (affiliateData) {
      setAffiliateRelations(affiliateData);
      const initialExpiry: Record<string, string> = {};
      affiliateData.forEach(a => {
        initialExpiry[a.id] = a.expires_at ? new Date(a.expires_at).toISOString().slice(0, 10) : '';
      });
      setExpirationValues(initialExpiry);
    }

    setIsLoading(false);
  };

  const handleSavePercentage = async (creatorId: string) => {
    setSavingId(creatorId);
    const newValue = parseFloat(editValues[creatorId]);
    
    if (isNaN(newValue) || newValue < 0 || newValue > 90) {
      alert("Invalid percentage. Choose between 0 and 90.");
      setSavingId(null);
      return;
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ affiliate_fee_percentage: newValue })
      .eq('id', creatorId);
      
    if (!error) {
      setCreators(creators.map(c => c.id === creatorId ? { ...c, affiliate_fee_percentage: newValue } : c));
    } else {
      alert("Error saving fee.");
    }
    setSavingId(null);
  };

  const handleSaveExpiration = async (relationId: string) => {
    setSavingId(relationId);
    const dateValue = expirationValues[relationId];
    
    const { error } = await supabase
      .from('affiliates')
      .update({ expires_at: dateValue ? new Date(dateValue).toISOString() : null })
      .eq('id', relationId);
    
    if (!error) {
      setAffiliateRelations(prev => prev.map(a => 
        a.id === relationId ? { ...a, expires_at: dateValue ? new Date(dateValue).toISOString() : null } : a
      ));
    } else {
      alert("Error saving expiration: " + error.message);
    }
    setSavingId(null);
  };

  // Get referrer name for a creator
  const getReferrerName = (referredBy: string | null) => {
    if (!referredBy) return null;
    const referrer = creators.find(c => c.id === referredBy);
    return referrer ? `@${referrer.username}` : referredBy.slice(0, 8) + '...';
  };

  return (
    <div className="flex flex-col w-full h-full gap-8">
      <div className="border-b border-red-500/20 pb-4 mb-2">
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Traffic Engine</h1>
        <p className="text-red-400 text-sm mt-1">Alpha Hierarchy • Affiliate Commission Management by Creator</p>
      </div>

      {/* CREATORS TABLE — Commission per creator */}
      <div className="bg-card/50 border border-red-500/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="px-4 py-3 border-b border-red-500/10">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Comissão por Criador</h2>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-red-950/20 text-red-500/70 uppercase text-[10px] tracking-widest font-black border-b border-red-500/20">
                <th className="p-4">Creator</th>
                <th className="p-4">Indicado por</th>
                <th className="p-4">Gamification</th>
                <th className="p-4 text-center">Affiliate Fee (%)</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-red-500/50 font-bold uppercase text-xs tracking-widest">
                    Pulling financial records...
                  </td>
                </tr>
              )}
              
              {!isLoading && creators.map(creator => (
                <tr key={creator.id} className="border-b border-red-500/5 hover:bg-red-500/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded border-2 border-amber-500/50 bg-amber-900/20 text-amber-500 flex items-center justify-center font-bold text-xs uppercase shadow-glow overflow-hidden">
                        {creator.avatar_url ? (
                          <img src={creator.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                          creator.username.charAt(0)
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold tracking-tight text-zinc-200">
                          @{creator.username}
                        </span>
                        <span className="text-[10px] text-zinc-600 font-mono tracking-tighter truncate w-32">{creator.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {creator.referred_by ? (
                      <span className="text-xs text-amber-400 font-bold">{getReferrerName(creator.referred_by)}</span>
                    ) : (
                      <span className="text-xs text-zinc-600">Orgânico</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-amber-500 font-black text-sm">
                      ★ {creator.gamification_points || 0} pts
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center items-center gap-2">
                       <input 
                         type="number" 
                         value={editValues[creator.id] || ''}
                         onChange={(e) => setEditValues({ ...editValues, [creator.id]: e.target.value })}
                         className="w-20 bg-background border border-red-500/20 rounded p-1 text-center text-white focus:outline-none focus:border-red-500/50"
                         step="0.5"
                         min="0"
                         max="90"
                       />
                       <span className="text-zinc-500 font-bold text-xs">%</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleSavePercentage(creator.id)}
                      disabled={savingId === creator.id || parseFloat(editValues[creator.id]) === creator.affiliate_fee_percentage}
                      className="px-4 py-2 bg-red-950 text-red-500 border border-red-900 rounded font-black text-[10px] uppercase tracking-widest hover:bg-red-900 hover:text-white transition-all disabled:opacity-30"
                    >
                      {savingId === creator.id ? 'Saving...' : 'Apply Fee'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AFFILIATE RELATIONSHIPS — Duration management */}
      <div className="bg-card/50 border border-red-500/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="px-4 py-3 border-b border-red-500/10">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Vínculos de Afiliados (Duração)</h2>
          <p className="text-[10px] text-zinc-500 mt-1">Defina por quanto tempo cada vínculo de afiliado gera comissões. Após expirar, a comissão não é mais paga.</p>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-red-950/20 text-red-500/70 uppercase text-[10px] tracking-widest font-black border-b border-red-500/20">
                <th className="p-4">Afiliado</th>
                <th className="p-4">Criador Indicado</th>
                <th className="p-4 text-center">Comissão (%)</th>
                <th className="p-4 text-center">Expira em</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {affiliateRelations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500 font-medium text-sm">
                    Nenhum vínculo de afiliado registrado. Os vínculos são criados automaticamente quando um criador se cadastra via link de indicação.
                  </td>
                </tr>
              ) : (
                affiliateRelations.map(rel => {
                  const isExpired = rel.expires_at && new Date(rel.expires_at) < new Date();
                  return (
                    <tr key={rel.id} className={`border-b border-red-500/5 hover:bg-red-500/5 transition-colors ${isExpired ? 'opacity-50' : ''}`}>
                      <td className="p-4">
                        <span className="font-bold text-zinc-200 text-sm">
                          @{rel.affiliate?.username || '???'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-zinc-200 text-sm">
                          @{rel.creator?.username || '???'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-amber-400 font-bold">{rel.percentage}%</span>
                      </td>
                      <td className="p-4 text-center">
                        <input
                          type="date"
                          value={expirationValues[rel.id] || ''}
                          onChange={(e) => setExpirationValues({ ...expirationValues, [rel.id]: e.target.value })}
                          className="bg-background border border-red-500/20 rounded p-1 text-center text-white text-xs focus:outline-none focus:border-red-500/50"
                        />
                      </td>
                      <td className="p-4 text-center">
                        {isExpired ? (
                          <span className="px-2 py-1 bg-red-500/10 text-red-400 text-[10px] font-bold uppercase rounded">Expirado</span>
                        ) : rel.expires_at ? (
                          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase rounded">Ativo</span>
                        ) : (
                          <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded">Permanente</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleSaveExpiration(rel.id)}
                          disabled={savingId === rel.id}
                          className="px-3 py-1.5 bg-red-950 text-red-500 border border-red-900 rounded font-black text-[10px] uppercase tracking-widest hover:bg-red-900 hover:text-white transition-all disabled:opacity-30"
                        >
                          {savingId === rel.id ? 'Saving...' : 'Save'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
