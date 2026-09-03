'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

type EventType = 'workshop' | 'live' | 'class' | 'tour' | 'meetup';

const EVENT_TYPE_LABELS: Record<EventType, { label: string; emoji: string }> = {
  workshop: { label: 'Workshop', emoji: '🎓' },
  live: { label: 'Live / Aula ao vivo', emoji: '📡' },
  class: { label: 'Aula Presencial', emoji: '💃' },
  tour: { label: 'Tour / Show', emoji: '🌍' },
  meetup: { label: 'Meetup', emoji: '🤝' }
};

type EventFormData = {
  title: string;
  location: string;
  event_date: string;
  event_time: string;
  ticket_url: string;
  description: string;
  event_type: EventType;
  price: string;
  max_spots: string;
  is_online: boolean;
  stream_url: string;
};

const EMPTY_EVENT: EventFormData = {
  title: '', location: '', event_date: '', event_time: '',
  ticket_url: '', description: '', event_type: 'workshop',
  price: '', max_spots: '', is_online: false, stream_url: ''
};

export default function DashboardHome() {
  const router = useRouter();
  const supabase = createClient();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  
  // Dashboard Metrics
  const [balance, setBalance] = useState(0.00);
  const [activeSubscribers, setActiveSubscribers] = useState(0);
  const [mrr, setMrr] = useState(0.00);
  const [totalPosts, setTotalPosts] = useState(0);
  const [dailyStats, setDailyStats] = useState<any>(null);
  
  // Events
  const [events, setEvents] = useState<any[]>([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState<EventFormData>(EMPTY_EVENT);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }
        
        setUserId(session.user.id);

        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!profileData?.is_creator) {
          router.push('/');
          return;
        }
        
        setProfile(profileData);

        // Fetch subscriptions to calculate Real Active Subscribers and MRR
        const { data: subsData } = await supabase
          .from('subscriptions')
          .select(`
             status,
             tier_id,
             subscription_tiers ( price )
          `)
          .eq('creator_id', session.user.id)
          .eq('status', 'active');

        let totalSubscribers = 0;
        let totalMrr = 0;

        if (subsData) {
          totalSubscribers = subsData.length;
          subsData.forEach((sub: any) => {
             const price = sub.subscription_tiers?.price || 0;
             totalMrr += Number(price);
          });
        }

        setActiveSubscribers(totalSubscribers);
        setMrr(totalMrr);
        
        // Calculate Real Balance from Platform Transactions
        const { data: txData } = await supabase
          .from('platform_transactions')
          .select('creator_amount')
          .eq('creator_id', session.user.id);
          
        let realBalance = 0;
        if (txData) {
          txData.forEach((tx: any) => {
            realBalance += Number(tx.creator_amount || 0);
          });
        }
        setBalance(realBalance);

        // Fetch total posts count
        const { count: postsCount } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', session.user.id);
        setTotalPosts(postsCount || 0);

        // Fetch Events
        const { data: eventsData } = await supabase
          .from('creator_events')
          .select('*')
          .eq('creator_id', session.user.id)
          .order('event_date', { ascending: true });
          
        if (eventsData) setEvents(eventsData);

        // Fetch daily stats for the chart
        const { data: stats } = await supabase
          .from('daily_statistics')
          .select('*')
          .order('snapshot_date', { ascending: false })
          .limit(1)
          .single();
          
        if (stats) setDailyStats(stats);

      } catch (err: any) {
        console.error('Error fetching dashboard data:', err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [router, supabase]);

  const handleOpenEventModal = (event?: any) => {
    if (event) {
      setEditingEventId(event.id);
      setEventForm({
        title: event.title || '',
        location: event.location || '',
        event_date: event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '',
        event_time: event.event_time || '',
        ticket_url: event.ticket_url || '',
        description: event.description || '',
        event_type: event.event_type || 'workshop',
        price: event.price?.toString() || '',
        max_spots: event.max_spots?.toString() || '',
        is_online: event.is_online || false,
        stream_url: event.stream_url || ''
      });
    } else {
      setEditingEventId(null);
      setEventForm(EMPTY_EVENT);
    }
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const eventData = {
      creator_id: userId,
      title: eventForm.title,
      location: eventForm.location,
      event_date: eventForm.event_date,
      event_time: eventForm.event_time || null,
      ticket_url: eventForm.ticket_url || null,
      description: eventForm.description || null,
      event_type: eventForm.event_type,
      price: eventForm.price ? parseFloat(eventForm.price) : 0,
      max_spots: eventForm.max_spots ? parseInt(eventForm.max_spots) : null,
      is_online: eventForm.is_online,
      stream_url: eventForm.is_online ? eventForm.stream_url || null : null,
    };

    if (editingEventId) {
      // Update existing
      const { error } = await supabase
        .from('creator_events')
        .update(eventData)
        .eq('id', editingEventId);

      if (error) {
        alert("Erro ao atualizar evento: " + error.message);
      } else {
        setEvents(events.map(ev => ev.id === editingEventId ? { ...ev, ...eventData, id: editingEventId } : ev)
          .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()));
        setIsEventModalOpen(false);
      }
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('creator_events')
        .insert(eventData)
        .select()
        .single();

      if (error) {
        alert("Erro ao criar evento: " + error.message);
      } else if (data) {
        setEvents([...events, data].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()));
        setIsEventModalOpen(false);
      }
    }
  };
  
  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este evento?")) return;
    const { error } = await supabase.from('creator_events').delete().eq('id', id);
    if (!error) {
      setEvents(events.filter(ev => ev.id !== id));
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 relative animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white tracking-tight">Overview</h1>
      </div>
      
      {/* Métricas Financeiras e Assinantes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-card border border-white/10 rounded-xl shadow-sm flex flex-col justify-between group hover:border-primary/20 transition-colors">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Available Balance</p>
          <div className="mt-3">
            <p className="text-2xl font-bold text-white tracking-tighter">${balance.toFixed(2)}</p>
            <button className="text-xs text-primary font-medium mt-2 hover:underline flex items-center gap-1 opacity-50 cursor-not-allowed">
              Request Payout
            </button>
          </div>
        </div>
        
        <div className="p-5 bg-card border border-white/10 rounded-xl shadow-sm flex flex-col justify-between group hover:border-primary/20 transition-colors">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Active Subscribers</p>
          <div className="mt-3">
            <p className="text-2xl font-bold text-white tracking-tighter">{activeSubscribers}</p>
            <p className="text-[10px] text-zinc-500 font-semibold mt-2">Via VIP Tiers</p>
          </div>
        </div>
        
        <div className="p-5 bg-card border border-white/10 rounded-xl shadow-sm flex flex-col justify-between group hover:border-primary/20 transition-colors">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Monthly Revenue (MRR)</p>
          <div className="mt-3">
            <p className="text-2xl font-bold text-white tracking-tighter">${mrr.toFixed(2)}</p>
            <p className="text-[10px] text-zinc-500 font-medium mt-2">Estimated Gross</p>
          </div>
        </div>

        <div className="p-5 bg-card border border-white/10 rounded-xl shadow-sm flex flex-col justify-between group hover:border-primary/20 transition-colors">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Total Posts</p>
          <div className="mt-3">
            <p className="text-2xl font-bold text-white tracking-tighter">{totalPosts}</p>
            <p className="text-[10px] text-zinc-500 font-medium mt-2">Published content</p>
          </div>
        </div>
      </div>
      
      {/* Gráfico de Tendências de Estilos (Daily Statistics) */}
      <div className="p-6 bg-card border border-white/10 rounded-xl flex flex-col gap-6 shadow-sm">
         <div className="flex items-center justify-between">
           <div>
             <h3 className="text-lg font-bold text-white">Platform Trends</h3>
             <p className="text-xs text-zinc-500">Most popular dance styles across all creators today.</p>
           </div>
           <span className="text-[10px] font-bold tracking-widest uppercase bg-primary/10 text-primary px-2 py-1 rounded-full">Updated Daily</span>
         </div>
         
         <div className="flex items-end gap-2 h-48 w-full border-b border-white/10 pb-2 relative mt-4">
           {!dailyStats || !dailyStats.top_styles || dailyStats.top_styles.length === 0 ? (
             <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
               <span className="text-2xl mb-2">📊</span>
               <p className="text-sm">Gathering daily data...</p>
             </div>
           ) : (
             dailyStats.top_styles.map((styleObj: any, idx: number) => {
               const maxCount = Math.max(...dailyStats.top_styles.map((s:any) => s.count));
               const heightPercent = Math.max(10, (styleObj.count / maxCount) * 100);
               return (
                 <div key={idx} className="flex-1 flex flex-col items-center justify-end group relative h-full">
                   <div 
                     className="w-full bg-primary/80 hover:bg-primary transition-all rounded-t-sm"
                     style={{ height: `${heightPercent}%` }}
                   ></div>
                   <div className="absolute -bottom-6 w-full text-center">
                     <span className="text-[10px] font-bold text-zinc-400 truncate block px-1" title={styleObj.style_name}>
                       {styleObj.style_name}
                     </span>
                   </div>
                   <div className="absolute top-0 opacity-0 group-hover:opacity-100 -translate-y-full pb-2 transition-opacity z-10 pointer-events-none">
                     <div className="bg-black text-white text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap">
                       {styleObj.count} creators
                     </div>
                   </div>
                 </div>
               )
             })
           )}
         </div>
         <div className="mt-4 pt-2 flex items-center justify-between text-xs text-zinc-500 font-medium">
           <span>Data from: {dailyStats ? new Date(dailyStats.snapshot_date).toLocaleDateString() : 'N/A'}</span>
           <span>Total Creators: {dailyStats?.total_creators || 0}</span>
         </div>
      </div>

      {/* Gestão de Eventos / Workshops */}
      <div className="p-6 bg-card border border-white/10 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Upcoming Events & Workshops</h2>
            <p className="text-sm text-zinc-400">Gerencie seus eventos presenciais, lives, aulas e tours.</p>
          </div>
          <button onClick={() => handleOpenEventModal()} className="px-4 py-2 bg-primary text-primary-foreground font-bold text-sm rounded-lg hover:bg-primary/90 transition-colors shadow-glow">
            + Novo Evento
          </button>
        </div>
        
        <div className="flex flex-col gap-3">
          {events.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-zinc-500">
              Nenhum evento agendado. Crie workshops, lives ou aulas presenciais!
            </div>
          ) : (
            events.map(ev => {
              const d = new Date(ev.event_date);
              const typeInfo = EVENT_TYPE_LABELS[ev.event_type as EventType] || EVENT_TYPE_LABELS.workshop;
              return (
                <div key={ev.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background border border-white/5 rounded-lg hover:border-white/10 transition-colors gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-lg flex flex-col items-center justify-center text-xs font-bold shrink-0">
                      <span className="text-primary leading-none uppercase">{d.toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-white text-lg">{d.getDate()}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-bold">{ev.title}</h4>
                        <span className="text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded font-bold text-zinc-400 uppercase tracking-wider">
                          {typeInfo.emoji} {typeInfo.label}
                        </span>
                      </div>
                      <p className="text-zinc-500 text-sm">
                        {ev.is_online ? '🌐 Online' : ev.location} • {ev.event_time || d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        {ev.price > 0 && <span className="text-primary ml-2 font-bold">${ev.price}</span>}
                        {ev.max_spots && <span className="ml-2 text-zinc-600">{ev.max_spots} vagas</span>}
                      </p>
                      {ev.description && <p className="text-zinc-600 text-xs mt-1 line-clamp-1">{ev.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 self-end sm:self-center">
                    {ev.ticket_url && (
                      <a href={ev.ticket_url} target="_blank" rel="noreferrer" className="text-xs font-bold px-3 py-1.5 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors">
                        Link
                      </a>
                    )}
                    <button onClick={() => handleOpenEventModal(ev)} className="text-zinc-400 hover:text-primary transition-colors p-2" title="Editar">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </button>
                    <button onClick={() => handleDeleteEvent(ev.id)} className="text-zinc-400 hover:text-red-500 transition-colors p-2" title="Deletar">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL DE EVENTO — TOTALMENTE PERSONALIZÁVEL */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-zinc-950 z-10">
              <h3 className="text-lg font-bold text-white">{editingEventId ? 'Editar Evento' : 'Novo Evento'}</h3>
              <button onClick={() => setIsEventModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleSaveEvent} className="p-6 flex flex-col gap-4">
              {/* Tipo de Evento */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Tipo de Evento</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {(Object.entries(EVENT_TYPE_LABELS) as [EventType, { label: string; emoji: string }][]).map(([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEventForm({ ...eventForm, event_type: key })}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-bold transition-all ${
                        eventForm.event_type === key
                          ? 'border-primary/50 bg-primary/10 text-primary'
                          : 'border-white/10 text-zinc-400 hover:bg-white/5'
                      }`}
                    >
                      <span className="text-base">{val.emoji}</span>
                      <span className="truncate w-full text-center">{val.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Título do Evento</label>
                <input required type="text" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:border-primary/50 outline-none" placeholder="Ex: Workshop Heels" />
              </div>

              {/* Descrição */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Descrição (Opcional)</label>
                <textarea value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} className="min-h-[80px] rounded-lg bg-background border border-white/10 p-4 text-sm text-white focus:border-primary/50 outline-none resize-none" placeholder="Descreva o que os participantes vão aprender..." />
              </div>

              {/* Online Toggle */}
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                <input
                  type="checkbox"
                  id="isOnline"
                  checked={eventForm.is_online}
                  onChange={e => setEventForm({...eventForm, is_online: e.target.checked})}
                  className="w-4 h-4 rounded bg-background border-white/10 text-primary focus:ring-primary/50"
                />
                <label htmlFor="isOnline" className="text-sm text-zinc-300 font-medium cursor-pointer">
                  🌐 Evento Online (Live / Stream)
                </label>
              </div>

              {eventForm.is_online ? (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Link da Live / Stream URL</label>
                  <input type="url" value={eventForm.stream_url} onChange={e => setEventForm({...eventForm, stream_url: e.target.value})} className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:border-primary/50 outline-none" placeholder="https://zoom.us/... ou link do YouTube" />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Local (Cidade / Estúdio)</label>
                  <input required type="text" value={eventForm.location} onChange={e => setEventForm({...eventForm, location: e.target.value})} className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:border-primary/50 outline-none" placeholder="Ex: São Paulo, SP" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Data e Hora</label>
                  <input required type="datetime-local" value={eventForm.event_date} onChange={e => setEventForm({...eventForm, event_date: e.target.value})} className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:border-primary/50 outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Horário (exibição)</label>
                  <input type="text" value={eventForm.event_time} onChange={e => setEventForm({...eventForm, event_time: e.target.value})} className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:border-primary/50 outline-none" placeholder="Ex: 19:00 - 21:00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Preço (Opcional)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                    <input type="number" step="0.01" min="0" value={eventForm.price} onChange={e => setEventForm({...eventForm, price: e.target.value})} className="w-full h-11 rounded-lg bg-background border border-white/10 pl-8 pr-4 text-white focus:border-primary/50 outline-none" placeholder="0.00 (Grátis)" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Max. Vagas (Opcional)</label>
                  <input type="number" min="1" value={eventForm.max_spots} onChange={e => setEventForm({...eventForm, max_spots: e.target.value})} className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:border-primary/50 outline-none" placeholder="Ilimitado" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Link para Ingressos (Opcional)</label>
                <input type="url" value={eventForm.ticket_url} onChange={e => setEventForm({...eventForm, ticket_url: e.target.value})} className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:border-primary/50 outline-none" placeholder="https://..." />
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEventModalOpen(false)} className="px-4 py-2 rounded-lg font-medium text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2 rounded-lg font-bold text-sm bg-primary text-primary-foreground shadow-glow hover:bg-primary/90 transition-all">
                  {editingEventId ? 'Salvar Alterações' : 'Criar Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
