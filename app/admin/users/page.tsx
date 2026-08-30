'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function AdminUsersModeration() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    // Para simplificar, busca todos os usuarios
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (data) setUsers(data);
    setIsLoading(false);
  };

  const handleBanToggle = async (userId: string, currentBanStatus: boolean) => {
    setActionLoading(`ban_${userId}`);
    
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: !currentBanStatus })
      .eq('id', userId);
      
    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, is_banned: !currentBanStatus } : u));
    } else {
      alert("Error applying punishment.");
    }
    setActionLoading(null);
  };

  const handleAddPoints = async (userId: string, currentPoints: number, amount: number) => {
    setActionLoading(`points_${userId}`);
    const newPoints = (currentPoints || 0) + amount;
    
    const { error } = await supabase
      .from('profiles')
      .update({ gamification_points: newPoints })
      .eq('id', userId);
      
    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, gamification_points: newPoints } : u));
    } else {
      alert("Error altering points.");
    }
    setActionLoading(null);
  };

  return (
    <div className="flex flex-col w-full h-full">
      <div className="border-b border-red-500/20 pb-4 mb-6">
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Global Moderation</h1>
        <p className="text-red-400 text-sm mt-1">Alpha Hierarchy • User & Gamification Management</p>
      </div>

      <div className="bg-card/50 border border-red-500/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm">
        {/* Tabela AkaaiCore */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-red-950/20 text-red-500/70 uppercase text-[10px] tracking-widest font-black border-b border-red-500/20">
                <th className="p-4">User / ID</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Gamification</th>
                <th className="p-4 text-right">Risk Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-red-500/50 font-bold uppercase text-xs tracking-widest">
                    Establishing secure connection...
                  </td>
                </tr>
              )}
              
              {!isLoading && users.map(user => (
                <tr key={user.id} className="border-b border-red-500/5 hover:bg-red-500/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded border-2 flex items-center justify-center font-bold text-xs uppercase shadow-glow ${user.is_banned ? 'border-red-600 bg-red-900/50 text-red-500' : 'border-zinc-700 bg-zinc-800 text-zinc-300'}`}>
                        {user.username.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className={`font-bold tracking-tight ${user.is_banned ? 'text-red-500 line-through' : 'text-zinc-200'}`}>
                          @{user.username}
                        </span>
                        <span className="text-[10px] text-zinc-600 font-mono tracking-tighter truncate w-32">{user.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${user.role === 'creator' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {user.is_banned ? (
                      <span className="text-red-500 font-black text-xs uppercase tracking-widest animate-pulse">BANNED</span>
                    ) : (
                      <span className="text-emerald-500 font-bold text-xs uppercase tracking-widest">ACTIVE</span>
                    )}
                  </td>
                  <td className="p-4">
                    {user.role === 'creator' ? (
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-amber-400 font-black text-sm w-12 text-center">
                          {user.gamification_points || 0} pt
                        </span>
                        <div className="flex flex-col gap-1">
                          <button 
                            disabled={actionLoading !== null}
                            onClick={() => handleAddPoints(user.id, user.gamification_points, 100)}
                            className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded text-[10px] font-bold transition-colors"
                          >
                            +100
                          </button>
                          <button 
                            disabled={actionLoading !== null}
                            onClick={() => handleAddPoints(user.id, user.gamification_points, -50)}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-white/5 px-2 py-0.5 rounded text-[10px] font-bold transition-colors"
                          >
                            -50
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-zinc-600 text-xs font-bold uppercase block text-center">-</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleBanToggle(user.id, user.is_banned)}
                      disabled={actionLoading !== null}
                      className={`px-4 py-2 rounded font-black text-[10px] uppercase tracking-widest transition-all ${
                        user.is_banned 
                          ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-white/10'
                          : 'bg-red-600 text-white shadow-glow hover:bg-red-500 hover:shadow-glow-lg border-2 border-red-950'
                      }`}
                    >
                      {actionLoading === `ban_${user.id}` 
                        ? '...' 
                        : user.is_banned ? 'Remove Ban' : 'Execute Ban'}
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
