'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function AffiliateManagement() {
  const [creators, setCreators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  
  const supabase = createClient();

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'creator')
      .order('gamification_points', { ascending: false });
      
    if (data) {
      setCreators(data);
      const initialEdits: Record<string, string> = {};
      data.forEach(c => {
        initialEdits[c.id] = c.affiliate_fee_percentage?.toString() || '10.00';
      });
      setEditValues(initialEdits);
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

  return (
    <div className="flex flex-col w-full h-full">
      <div className="border-b border-red-500/20 pb-4 mb-6">
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Traffic Engine</h1>
        <p className="text-red-400 text-sm mt-1">Alpha Hierarchy • Affiliate Commission Management by Creator</p>
      </div>

      <div className="bg-card/50 border border-red-500/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-red-950/20 text-red-500/70 uppercase text-[10px] tracking-widest font-black border-b border-red-500/20">
                <th className="p-4">Creator</th>
                <th className="p-4">Gamification Status</th>
                <th className="p-4 text-center">Affiliate Fee (%)</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-red-500/50 font-bold uppercase text-xs tracking-widest">
                    Pulling financial records...
                  </td>
                </tr>
              )}
              
              {!isLoading && creators.map(creator => (
                <tr key={creator.id} className="border-b border-red-500/5 hover:bg-red-500/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded border-2 border-amber-500/50 bg-amber-900/20 text-amber-500 flex items-center justify-center font-bold text-xs uppercase shadow-glow">
                        {creator.username.charAt(0)}
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
    </div>
  );
}
