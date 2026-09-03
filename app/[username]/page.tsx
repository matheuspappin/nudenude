'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { notFound, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function CreatorProfile({ params }: { params: { username: string } }) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>('feed');
  const [creator, setCreator] = useState<any>(null);
  
  const [posts, setPosts] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [ppvCourses, setPpvCourses] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isCreatorView, setIsCreatorView] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user || null);
      
      // 1. Busca perfil do criador
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', params.username)
        .eq('is_creator', true)
        .single();
        
      if (profileError || !profileData) {
        setIsLoading(false);
        return;
      }
      setCreator(profileData);

      if (session) {
        setIsCreatorView(session.user.id === profileData.id);
        
        // Verifica se assina
        if (session.user.id !== profileData.id) {
          const { data: subData } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('student_id', session.user.id)
            .eq('creator_id', profileData.id)
            .eq('status', 'active')
            .maybeSingle();
            
          if (subData) setIsSubscribed(true);
        } else {
          setIsSubscribed(true); // Dono assina a si mesmo logicamente
        }
      }

      // Posts (Feed)
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('creator_id', profileData.id)
        .order('created_at', { ascending: false });
      
      setPosts(postsData || []);

      // Collections
      const { data: colsData } = await supabase
        .from('post_collections')
        .select('*')
        .eq('creator_id', profileData.id)
        .order('created_at', { ascending: false });
      
      setCollections(colsData || []);

      // PPV Courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('creator_id', profileData.id)
        .eq('is_ppv', true)
        .order('created_at', { ascending: false });
      
      setPpvCourses(coursesData || []);

      // Events (Drop-in classes)
      const { data: eventsData } = await supabase
        .from('creator_events')
        .select('*')
        .eq('creator_id', profileData.id)
        .order('event_date', { ascending: true });
        
      setEvents(eventsData || []);

      // Subscription Tiers
      const { data: tiersData } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('creator_id', profileData.id)
        .eq('status', 'active')
        .order('price', { ascending: true });
        
      setTiers(tiersData || []);

      setIsLoading(false);
    }
    
    fetchData();
  }, [params.username, supabase]);

  if (isLoading) {
    return <div className="w-full min-h-[50vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }
  
  if (!creator) {
    return <div className="w-full py-20 text-center text-red-500 font-bold text-xl">Criador não encontrado.</div>;
  }

  const handleSubscribe = async (tierId: string) => {
     if (!currentUser) {
        alert("Please log in to subscribe.");
        return;
     }
     
     try {
       const res = await fetch('/api/checkout-subscription', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ creatorId: creator.id, userId: currentUser.id, tierId }),
       });
       const data = await res.json();
       if (data.url) {
         window.location.href = data.url;
       } else {
         alert("Checkout Error: " + (data.error || "Unknown error"));
       }
     } catch (e: any) {
       alert("Error initiating checkout: " + e.message);
     }
  };

  const handleDropIn = async (eventId: string) => {
     if (!currentUser) {
        alert("Please log in to book a drop-in class.");
        return;
     }

     try {
       const res = await fetch('/api/checkout-dropin', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ eventId, userId: currentUser.id }),
       });
       const data = await res.json();
       if (data.url) {
         window.location.href = data.url;
       } else {
         alert("Checkout Error: " + (data.error || "Unknown error"));
       }
     } catch (e: any) {
       alert("Error initiating checkout: " + e.message);
     }
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center animate-in fade-in duration-500">
      
      {/* HEADER: Híbrido MasterClass / Patreon */}
      <div className="w-full relative mb-24">
        {/* Cover */}
        <div 
          className="w-full h-48 sm:h-72 rounded-b-3xl bg-zinc-900 border-b border-x border-white/5 relative overflow-hidden bg-cover bg-center"
          style={creator.cover_url ? { backgroundImage: `url(${creator.cover_url})` } : {}}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>
        
        {/* Profile Info Overlay */}
        <div className="absolute -bottom-16 left-0 w-full px-6 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 w-full">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl border-4 border-background bg-zinc-800 flex items-center justify-center shadow-2xl overflow-hidden shrink-0">
               {creator.avatar_url ? (
                  <img src={creator.avatar_url} alt={creator.username} className="w-full h-full object-cover" />
               ) : (
                  <span className="text-5xl font-bold text-zinc-400 uppercase">{creator.username.charAt(0)}</span>
               )}
            </div>
            
            <div className="flex flex-col items-center sm:items-start flex-1 mb-2">
               <h1 className="text-3xl font-black text-white tracking-tight text-center sm:text-left">{creator.full_name || creator.display_name || creator.username}</h1>
               <p className="text-primary font-bold text-sm tracking-widest uppercase mt-1">@{creator.username}</p>
               
               <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                 {/* TRUST BADGES */}
                 {creator.gamification_points > 100 && (
                   <span className="px-2 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded shadow-glow flex items-center gap-1">
                     <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"></path></svg>
                     Master Creator
                   </span>
                 )}
                 {creator.location && (
                   <span className="px-2 py-1 bg-white/10 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded flex items-center gap-1">
                     📍 {creator.location}
                   </span>
                 )}
               </div>
            </div>

            {/* CALL TO ACTION (Subscribe) */}
            {!isCreatorView && (
              <div className="shrink-0 sm:mb-2 w-full sm:w-auto flex flex-col items-center gap-3">
                 {isSubscribed ? (
                   <button className="w-full sm:w-auto h-12 px-8 rounded-xl bg-white/10 text-white font-bold border border-white/20 opacity-80 cursor-default">
                     ✓ Subscribed VIP
                   </button>
                 ) : (
                   tiers.map(tier => (
                     <button key={tier.id} onClick={() => handleSubscribe(tier.id)} className="w-full sm:w-auto h-12 px-6 rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-sm shadow-glow hover:shadow-glow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-between gap-6 border border-primary/20">
                       <div className="flex flex-col items-start text-left">
                         <span>{tier.name}</span>
                         {tier.description && <span className="text-[9px] opacity-80 normal-case font-medium">{tier.description.substring(0, 30)}...</span>}
                       </div>
                       <span className="text-lg">${tier.price}<span className="text-[10px]">/mo</span></span>
                     </button>
                   ))
                 )}
                 {!isSubscribed && tiers.length === 0 && (
                   <p className="text-sm text-zinc-500 font-medium">No VIP plans available.</p>
                 )}
                 {!isSubscribed && tiers.length > 0 && <p className="text-[10px] text-zinc-500 mt-1 font-medium uppercase tracking-wider">Unlock exclusive feed & perks</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full px-6 mb-10 max-w-3xl text-center sm:text-left">
        <p className="text-zinc-300 leading-relaxed text-sm">
          {creator.bio || 'Join my VIP community to get access to exclusive daily dance tips, behind-the-scenes, and early access to my physical workshops!'}
        </p>
      </div>

      {/* TABS DE NAVEGAÇÃO */}
      <div className="w-full px-6 mb-8 max-w-3xl flex gap-2 overflow-x-auto custom-scrollbar pb-2">
        <button 
          onClick={() => setActiveTab('feed')}
          className={`flex-1 min-w-[120px] py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'feed' ? 'bg-primary text-primary-foreground shadow-glow' : 'bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/5'}`}
        >
          EXCLUSIVE FEED
        </button>
        
        {collections.map(c => (
          <button 
            key={c.id}
            onClick={() => setActiveTab(c.id)}
            className={`flex-1 min-w-[120px] py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === c.id ? 'bg-primary text-primary-foreground shadow-glow' : 'bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/5'}`}
          >
            {c.name}
          </button>
        ))}

        <button 
          onClick={() => setActiveTab('ppv')}
          className={`flex-1 min-w-[120px] py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'ppv' ? 'bg-primary text-primary-foreground shadow-glow' : 'bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/5'}`}
        >
          Masterclasses
        </button>
        <button 
          onClick={() => setActiveTab('events')}
          className={`flex-1 min-w-[120px] py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'events' ? 'bg-primary text-primary-foreground shadow-glow' : 'bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/5'}`}
        >
          Live Workshops
        </button>
      </div>

      <div className="w-full px-6 max-w-3xl">
        {/* TAB: FEED (Patreon Style) - Filters by Collection if a collection tab is active */}
        {(activeTab === 'feed' || collections.some(c => c.id === activeTab)) && (
          <div className="flex flex-col gap-6">
            {posts.filter(p => activeTab === 'feed' || p.collection_id === activeTab).length === 0 ? (
              <div className="p-8 text-center bg-card border border-white/5 rounded-2xl text-zinc-500 text-sm">
                Nenhum conteúdo encontrado.
              </div>
            ) : (
              posts.filter(p => activeTab === 'feed' || p.collection_id === activeTab).map(post => {
                const canView = isSubscribed || isCreatorView || !post.is_locked;
                return (
                  <div key={post.id} className="p-5 bg-card border border-white/5 rounded-2xl flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden">
                        {creator.avatar_url && <img src={creator.avatar_url} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white text-sm">{creator.username}</p>
                        <p className="text-xs text-zinc-500">{new Date(post.created_at).toLocaleDateString()}</p>
                      </div>
                      {post.label && (
                        <span className="px-2 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest rounded">
                          {post.label}
                        </span>
                      )}
                    </div>
                    
                    {canView ? (
                      <div className="text-zinc-300 text-sm leading-relaxed">
                        {post.post_text}
                        {post.media_urls && post.media_urls.length > 0 && (
                          <div className="mt-4 flex flex-col gap-2">
                            {post.media_urls.map((url: string, idx: number) => (
                              <div key={idx} className="rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                                {url.includes('.mp4') || url.includes('.mov') || url.includes('.m3u8') ? (
                                  <video src={url} controls className="w-full h-full object-cover" />
                                ) : (
                                  <img src={url} alt="Media" className="w-full h-full object-cover" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative rounded-xl overflow-hidden bg-zinc-900 aspect-video flex flex-col items-center justify-center border border-white/5">
                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/80 to-black/90" />
                        <svg className="w-12 h-12 text-zinc-600 mb-3 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        <h4 className="text-white font-bold z-10">Subscriber Only Post</h4>
                        <p className="text-xs text-zinc-400 z-10 mt-1">
                          {post.price && post.price > 0 ? `Unlock for $${post.price}` : 'Unlock this and more by subscribing.'}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* TAB: PPV Masterclasses (Storefront) */}
        {activeTab === 'ppv' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {ppvCourses.length === 0 ? (
               <div className="col-span-full p-8 text-center bg-card border border-white/5 rounded-2xl text-zinc-500 text-sm">
                 No masterclasses available.
               </div>
            ) : (
              ppvCourses.map(course => (
                <div key={course.id} className="bg-card border border-white/10 rounded-2xl overflow-hidden group hover:border-primary/50 transition-all flex flex-col">
                  <div className="h-40 bg-zinc-800 relative bg-cover bg-center" style={course.thumbnail_url ? { backgroundImage: `url(${course.thumbnail_url})` } : {}}>
                     {/* BADGE PPV */}
                     <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-black text-amber-400 uppercase tracking-widest border border-amber-500/20">
                       Premium PPV
                     </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-white text-lg leading-tight mb-2">{course.title}</h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 mb-4 flex-1">{course.description}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                         {isSubscribed && <span className="text-[10px] text-primary font-bold uppercase">20% VIP Discount applied</span>}
                         <span className="text-xl font-black text-white">
                           ${isSubscribed ? (course.price * 0.8).toFixed(2) : course.price}
                         </span>
                      </div>
                      <Link href={`/courses/${course.id}`} className="px-4 py-2 bg-white/10 hover:bg-primary hover:text-primary-foreground text-white font-bold text-xs rounded-lg transition-colors border border-white/5">
                        Buy Access
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: LIVE EVENTS (Drop-in Class Widget) */}
        {activeTab === 'events' && (
          <div className="flex flex-col gap-4">
            {events.length === 0 ? (
               <div className="p-8 text-center bg-card border border-white/5 rounded-2xl text-zinc-500 text-sm">
                 No upcoming live workshops.
               </div>
            ) : (
              events.map(ev => (
                <div key={ev.id} className="p-5 bg-card border border-white/10 rounded-2xl flex flex-col sm:flex-row items-center gap-6 group hover:border-primary/50 transition-all">
                  <div className="w-full sm:w-24 h-24 bg-white/5 rounded-xl flex flex-col items-center justify-center border border-white/5 shrink-0">
                     <span className="text-primary text-xs font-black uppercase tracking-widest">{new Date(ev.event_date).toLocaleString('default', { month: 'short' })}</span>
                     <span className="text-white text-3xl font-black">{new Date(ev.event_date).getDate()}</span>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-bold text-white text-lg">{ev.title}</h3>
                    <p className="text-sm text-zinc-400 mt-1">{ev.location} • {ev.event_time}</p>
                    {ev.description && <p className="text-xs text-zinc-500 mt-2 line-clamp-1">{ev.description}</p>}
                  </div>
                  <div className="w-full sm:w-auto shrink-0 flex flex-col gap-2">
                     <button onClick={() => handleDropIn(ev.id)} className="w-full sm:w-auto px-6 py-3 bg-white text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-zinc-200 transition-colors shadow-glow-sm">
                       Book Drop-in
                     </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}
