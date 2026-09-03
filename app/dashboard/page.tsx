'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function DashboardHome() {
  const router = useRouter();
  const supabase = createClient();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  
  // Dashboard Metrics
  const [balance, setBalance] = useState(0.00);
  const [activeSubscribers, setActiveSubscribers] = useState(0);
  const [mrr, setMrr] = useState(0.00);
  const [dailyStats, setDailyStats] = useState<any>(null);
  
  // Events
  const [events, setEvents] = useState<any[]>([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', location: '', event_date: '', ticket_url: '' });

  // Profile Settings
  const [location, setLocation] = useState('');
  const [danceStyles, setDanceStyles] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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
        setLocation(profileData.location || '');
        setDanceStyles(profileData.dance_styles ? profileData.dance_styles.join(', ') : '');

        // Fetch subscriptions to calculate Real Active Subscribers and MRR
        // Join with subscription_tiers to get the price of each subscription
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

  // Profile Settings were moved to /profile

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const { data, error } = await supabase
      .from('creator_events')
      .insert({
        creator_id: userId,
        title: newEvent.title,
        location: newEvent.location,
        event_date: newEvent.event_date,
        ticket_url: newEvent.ticket_url || null
      })
      .select()
      .single();

    if (error) {
      alert("Erro ao criar evento: " + error.message);
    } else if (data) {
      setEvents([...events, data].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()));
      setIsEventModalOpen(false);
      setNewEvent({ title: '', location: '', event_date: '', ticket_url: '' });
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 bg-card border border-white/10 rounded-xl shadow-sm flex flex-col justify-between group hover:border-primary/20 transition-colors">
          <p className="text-sm font-medium text-zinc-400">Available Balance</p>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white tracking-tighter">${balance.toFixed(2)}</p>
            <button className="text-sm text-primary font-medium mt-3 hover:underline flex items-center gap-1 opacity-50 cursor-not-allowed">
              Request Payout (Stripe Connect)
            </button>
          </div>
        </div>
        
        <div className="p-6 bg-card border border-white/10 rounded-xl shadow-sm flex flex-col justify-between group hover:border-primary/20 transition-colors">
          <p className="text-sm font-medium text-zinc-400">Active Subscribers</p>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white tracking-tighter">{activeSubscribers}</p>
            <p className="text-xs text-zinc-500 font-semibold mt-3">Currently subscribed via VIP Tiers</p>
          </div>
        </div>
        
        <div className="p-6 bg-card border border-white/10 rounded-xl shadow-sm flex flex-col justify-between group hover:border-primary/20 transition-colors">
          <p className="text-sm font-medium text-zinc-400">Monthly Recurring Revenue</p>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white tracking-tighter">${mrr.toFixed(2)}</p>
            <p className="text-xs text-zinc-500 font-medium mt-3">Estimated Gross MRR</p>
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
            <p className="text-sm text-zinc-400">Manage your physical events, tour dates, and masterclasses.</p>
          </div>
          <button onClick={() => setIsEventModalOpen(true)} className="px-4 py-2 bg-primary text-primary-foreground font-bold text-sm rounded-lg hover:bg-primary/90 transition-colors shadow-glow">
            + New Event
          </button>
        </div>
        
        <div className="flex flex-col gap-3">
          {events.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-zinc-500">
              No upcoming events scheduled.
            </div>
          ) : (
            events.map(ev => {
              const d = new Date(ev.event_date);
              return (
                <div key={ev.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background border border-white/5 rounded-lg hover:border-white/10 transition-colors gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-lg flex flex-col items-center justify-center text-xs font-bold shrink-0">
                      <span className="text-primary leading-none uppercase">{d.toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-white text-lg">{d.getDate()}</span>
                    </div>
                    <div>
                      <h4 className="text-white font-bold">{ev.title}</h4>
                      <p className="text-zinc-500 text-sm">{ev.location} • {d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 self-end sm:self-center">
                    {ev.ticket_url && (
                      <a href={ev.ticket_url} target="_blank" rel="noreferrer" className="text-xs font-bold px-3 py-1.5 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors">
                        Link
                      </a>
                    )}
                    <button onClick={() => handleDeleteEvent(ev.id)} className="text-zinc-400 hover:text-red-500 transition-colors p-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Removed Profile Settings and Affiliate Program as they belong in their respective menu sections */}

      {/* MODAL DE EVENTO */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-white/10 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Novo Evento</h3>
              <button onClick={() => setIsEventModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors">&times;</button>
            </div>
            
            <form onSubmit={handleCreateEvent} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Título do Evento</label>
                <input required type="text" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:border-primary/50 outline-none" placeholder="Ex: Workshop Heels" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Local (Cidade / Estúdio)</label>
                <input required type="text" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:border-primary/50 outline-none" placeholder="Ex: São Paulo, SP" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Data e Hora</label>
                <input required type="datetime-local" value={newEvent.event_date} onChange={e => setNewEvent({...newEvent, event_date: e.target.value})} className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:border-primary/50 outline-none" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Link para Ingressos (Opcional)</label>
                <input type="url" value={newEvent.ticket_url} onChange={e => setNewEvent({...newEvent, ticket_url: e.target.value})} className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:border-primary/50 outline-none" placeholder="https://..." />
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEventModalOpen(false)} className="px-4 py-2 rounded-lg font-medium text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2 rounded-lg font-bold text-sm bg-primary text-primary-foreground shadow-glow hover:bg-primary/90 transition-all">
                  Criar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
