'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setUsers(data);
    }
    setIsLoading(false);
  };

  const toggleCreator = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_creator: !currentStatus })
      .eq('id', userId);
      
    if (!error) fetchUsers();
  };

  const toggleSuspension = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_suspended: !currentStatus })
      .eq('id', userId);
      
    if (!error) fetchUsers();
  };

  if (isLoading) return <div className="text-zinc-400">Loading users...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-red-500/20 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">User Management</h1>
          <p className="text-red-400 text-sm mt-1">Total Users: {users.length}</p>
        </div>
        <button onClick={fetchUsers} className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded">
          Refresh Data
        </button>
      </div>

      <div className="bg-card border border-red-500/10 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-red-950/20 text-xs uppercase font-bold text-red-400 border-b border-red-500/20">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-red-500/10 hover:bg-red-500/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">{user.display_name}</div>
                    <div className="text-zinc-500 text-xs">@{user.username}</div>
                    <div className="text-zinc-600 text-[10px] mt-1">{user.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      {user.is_admin ? (
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-[10px] font-bold rounded">SUPER ADMIN</span>
                      ) : null}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${user.is_creator ? 'bg-primary/20 text-primary' : 'bg-zinc-800 text-zinc-400'}`}>
                        {user.is_creator ? 'CREATOR' : 'STUDENT'}
                      </span>
                      {user.is_suspended && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-[10px] font-bold rounded mt-1">SUSPENDED</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => toggleCreator(user.id, user.is_creator)}
                        className="px-3 py-1.5 text-xs font-bold rounded bg-white/5 hover:bg-white/10 text-white transition-colors"
                      >
                        {user.is_creator ? 'Remove Creator' : 'Make Creator'}
                      </button>
                      <button 
                        onClick={() => toggleSuspension(user.id, user.is_suspended)}
                        className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${user.is_suspended ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}
                      >
                        {user.is_suspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                    </div>
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
