'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content_text: string;
  media_url: string;
  is_ppv: boolean;
  ppv_price: number;
  created_at: string;
};

export default function ChatWindow({ params }: { params: { creator: string } }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [me, setMe] = useState<any>(null);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    let subscription: any;

    async function loadChat() {
      // Pega meu usuario
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setMe(session.user);

      // Pega ID do criador da URL
      const { data: cData } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', params.creator)
        .single();
      
      if (!cData) return;
      setCreatorProfile(cData);

      // Busca historico
      const { data: msgData } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${cData.id}),and(sender_id.eq.${cData.id},receiver_id.eq.${session.user.id})`)
        .order('created_at', { ascending: true });

      if (msgData) setMessages(msgData);
      setIsLoading(false);

      // Assina WebSockets para mensagens novas
      subscription = supabase
        .channel('chat-channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${session.user.id}`, // Escuta mensagens enviadas PRA MIM
          },
          (payload) => {
             // Se for do criador atual da tela, adiciona na lista
             if (payload.new.sender_id === cData.id) {
               setMessages(prev => [...prev, payload.new as Message]);
             }
          }
        )
        .on(
          'postgres_changes',
          {
             event: 'INSERT',
             schema: 'public',
             table: 'messages',
             filter: `sender_id=eq.${session.user.id}`, // Escuta mensagens que EU enviei (sincronismo entre abas)
          },
          (payload) => {
             if (payload.new.receiver_id === cData.id) {
                // Se nao estiver na lista, adiciona (evita duplicar do state local)
                setMessages(prev => {
                   if (prev.find(m => m.id === payload.new.id)) return prev;
                   return [...prev, payload.new as Message];
                });
             }
          }
        )
        .subscribe();
    }

    loadChat();

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [params.creator, supabase]);

  useEffect(() => {
    // Scroll para baixo quando chega msg nova
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !me || !creatorProfile) return;

    const msgText = newMessage;
    setNewMessage(''); // optimistic clear

    // Insere no banco
    const { data } = await supabase
      .from('messages')
      .insert({
        sender_id: me.id,
        receiver_id: creatorProfile.id,
        content_text: msgText,
        is_ppv: false // Usuario comum so manda msg de texto normal
      })
      .select()
      .single();
      
    if (data) {
      setMessages(prev => [...prev, data]);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-zinc-500">Conectando ao chat...</div>;

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header do Chat */}
      <div className="h-16 border-b border-white/10 flex items-center px-6 bg-card/90 backdrop-blur-md sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center font-bold text-zinc-400 uppercase">
            {params.creator.charAt(0)}
          </div>
          <div>
            <h3 className="text-white font-bold capitalize tracking-tight">{params.creator}</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Online agora</p>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico de Mensagens */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {messages.length === 0 && (
          <div className="text-center text-zinc-500 text-sm mt-10">Envie uma mensagem para começar a conversa.</div>
        )}
        
        {messages.map(msg => {
          const isMine = msg.sender_id === me?.id;
          
          return (
            <div key={msg.id} className={`flex gap-4 ${isMine ? 'flex-row-reverse' : ''}`}>
              {!isMine && (
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-400 uppercase flex-shrink-0 mt-auto">
                  {params.creator.charAt(0)}
                </div>
              )}
              
              {/* Mensagem Normal */}
              {!msg.is_ppv ? (
                <div className={`border rounded-2xl p-4 max-w-[85%] sm:max-w-[70%] shadow-sm ${isMine ? 'bg-primary text-primary-foreground border-primary/50 rounded-br-sm' : 'bg-card border-white/5 text-zinc-200 rounded-bl-sm'}`}>
                  <p className="text-sm leading-relaxed">{msg.content_text}</p>
                  <span className={`text-[10px] mt-2 block font-medium ${isMine ? 'text-primary-foreground/70 text-right' : 'text-zinc-500'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ) : (
                /* Mensagem PPV (O Ouro da Monetização) */
                <div className="bg-card border border-primary/20 rounded-2xl rounded-bl-sm p-1.5 max-w-[85%] sm:max-w-[70%] shadow-sm relative overflow-hidden group">
                  <div className="relative w-full aspect-square sm:aspect-[4/5] bg-zinc-950 rounded-xl overflow-hidden select-none">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-xl z-10 flex flex-col items-center justify-center p-6 text-center transition-all">
                      <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary shadow-glow">
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      </div>
                      <h4 className="text-white font-bold text-lg tracking-tight mb-1">Mídia Oculta</h4>
                      <p className="text-xs text-zinc-400 mb-6 font-medium">Conteúdo Privado</p>
                      <button className="h-11 px-8 rounded-md bg-primary text-primary-foreground font-bold shadow-glow hover:bg-primary/90 hover:shadow-glow-lg transition-all w-full text-sm">
                        Desbloquear - ${msg.ppv_price}
                      </button>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-zinc-800 to-zinc-900 opacity-60" />
                  </div>
                  <div className="p-3">
                     <p className="text-sm text-zinc-200">{msg.content_text}</p>
                     <span className="text-[10px] text-zinc-500 mt-1 block font-medium">
                       {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input / Área de Digitação */}
      <form onSubmit={handleSendMessage} className="p-4 bg-card/90 backdrop-blur-md border-t border-white/10">
        <div className="relative flex items-center">
           <button type="button" className="absolute left-4 text-zinc-400 hover:text-white transition-colors" title="Enviar Gorjeta (Tip)">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
           </button>
           <input 
             type="text" 
             value={newMessage}
             onChange={e => setNewMessage(e.target.value)}
             placeholder="Envie uma mensagem (Ou dê uma gorjeta)..." 
             className="w-full h-12 bg-background border border-white/10 rounded-full pl-12 pr-12 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
           />
           <button type="submit" disabled={!newMessage.trim()} className="absolute right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary/90 transition-colors shadow-glow disabled:opacity-50">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
           </button>
        </div>
      </form>
    </div>
  );
}
