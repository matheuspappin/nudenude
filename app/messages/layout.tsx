'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const [contacts, setContacts] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function loadContacts() {
      // Por simplicidade, vamos buscar todos os criadores para popular a barra.
      // Num ambiente de prod, buscaríamos as conversas ativas.
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'creator')
        .limit(10);
        
      if (data) setContacts(data);
    }
    loadContacts();
  }, [supabase]);

  return (
    <div className="flex w-full h-[calc(100vh-120px)] border border-white/10 rounded-2xl overflow-hidden bg-card/50 shadow-sm mt-4">
      {/* Lista de Contatos (Sidebar Esquerda do Chat) */}
      <aside className="w-80 border-r border-white/10 flex flex-col bg-card hidden md:flex">
        <div className="p-5 border-b border-white/10">
          <h2 className="text-xl font-bold text-white tracking-tight">Mensagens</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
           {contacts.map(contact => (
             <Link key={contact.id} href={`/messages/${contact.username}`} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors border-b border-white/5">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-400 uppercase">
                    {contact.username.charAt(0)}
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                   <div className="flex justify-between items-center mb-1">
                     <h4 className="text-white font-bold text-sm truncate tracking-tight capitalize">{contact.username}</h4>
                   </div>
                   <p className="text-xs text-zinc-400 truncate">Toque para conversar...</p>
                </div>
             </Link>
           ))}
           
           {contacts.length === 0 && (
             <div className="p-5 text-center text-zinc-500 text-sm">Nenhum criador disponível.</div>
           )}
        </div>
      </aside>
      
      {/* Área do Chat */}
      <main className="flex-1 flex flex-col bg-background/50 relative">
        {children}
      </main>
    </div>
  );
}
