import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Search, ShieldCheck, Zap, Users, LockKeyhole, Star, PlayCircle, CheckCircle2, ChevronRight, Camera, Dumbbell, Gamepad2, Heart, Music, Sparkles, Building2 } from 'lucide-react';
export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    redirect('/explore');
  }

  const { data: topCreators } = await supabase
    .from('profiles')
    .select('id, username, display_name, gamification_points')
    .eq('role', 'creator')
    .order('gamification_points', { ascending: false, nullsFirst: false })
    .limit(4);

  // Fetch mature dynamic niches and immutable base niches
  const { data: activeNiches, error: nichesError } = await supabase
    .rpc('get_active_niches', { threshold: 5 });
    
  if (nichesError) {
    console.error("Error fetching niches:", nichesError);
  }
  console.log("Fetched niches:", activeNiches);

  // Map icon names to Lucide components dynamically if possible, or fallback to a default
  // In a real scenario you'd map the strings to actual icon components.
  // We'll use a mapping object or just render a default icon.


  return (
    <div className="w-full flex flex-col min-h-screen bg-[#0A0A0A] text-white selection:bg-primary/30 font-sans">
      
      {/* Landing Page Navbar */}
      <header className="fixed top-0 left-0 w-full z-50 bg-black/50 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 select-none">
            <span className="text-2xl font-black tracking-tighter text-white">
              CreatorDance<span className="text-primary">.</span>
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/agencies" className="text-sm font-bold text-zinc-300 hover:text-white transition-colors">
              Afiliados & Agências
            </Link>
            <Link href="/login" className="text-sm font-bold text-zinc-300 hover:text-white transition-colors">
              Log in
            </Link>
            <Link href="/signup?role=creator" className="px-5 py-2.5 bg-white text-black text-sm font-black rounded-full hover:bg-zinc-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              Become a Creator
            </Link>
          </nav>
          
          {/* Mobile Menu Button (simplified) */}
          <div className="md:hidden flex items-center">
             <Link href="/login" className="text-sm font-bold text-white mr-4">Log in</Link>
             <Link href="/signup?role=creator" className="px-4 py-2 bg-primary text-white text-xs font-black rounded-full">
               Creator
             </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden flex flex-col items-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-primary/20 blur-[150px] rounded-full pointer-events-none -z-10" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left z-10">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.1]">
              Unlock <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-rose-500 to-primary bg-300% animate-gradient">Exclusive Content</span> <br className="hidden sm:block"/> from Top Creators.
            </h1>
            
            <p className="text-lg sm:text-xl text-zinc-400 mb-10 max-w-xl font-medium leading-relaxed">
              Support your favorite creators, bypass the noise, and get direct access to premium, uncensored content in a secure and private environment.
            </p>

            <div className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-2 flex items-center shadow-2xl">
              <div className="pl-4 pr-2 text-zinc-400">
                <Search className="w-5 h-5" />
              </div>
              <input 
                type="text" 
                placeholder="Search by creator or niche..." 
                className="w-full bg-transparent border-none outline-none text-white placeholder:text-zinc-500 focus:ring-0 px-2"
              />
              <Link href="/explore" className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-glow hover:shadow-glow-lg whitespace-nowrap">
                Explore
              </Link>
            </div>
          </div>

          <div className="relative w-full h-full min-h-[400px] lg:min-h-[600px] flex items-center justify-center lg:justify-end">
             <div className="relative w-full max-w-md aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-zinc-900 group">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />
                
                <div className="absolute bottom-0 left-0 w-full p-8 z-20 transform transition-transform duration-500 group-hover:-translate-y-2">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-rose-500 p-[2px]">
                       <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center font-bold text-lg">A</div>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">@anacreator</h3>
                      <p className="text-sm text-zinc-400">Top 1% Creator</p>
                    </div>
                  </div>
                  <div className="glass-panel p-4 rounded-xl border border-white/10 backdrop-blur-md bg-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white">VIP Subscription</span>
                      <span className="text-primary font-black">$14.99/mo</span>
                    </div>
                    <button className="w-full py-2 bg-white text-black font-bold rounded-lg text-sm hover:bg-zinc-200 transition-colors">
                      Subscribe Now
                    </button>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Explore by Niche (Inspired by Preply "Tutors by language") */}
      <section className="w-full py-16 bg-zinc-950 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-black mb-8">Explore by niche</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {activeNiches && activeNiches.length > 0 ? (
              activeNiches.map((niche: any, idx: number) => {
                // Determine icon
                let IconComponent = Sparkles;
                if (niche.icon_name === 'Heart') IconComponent = Heart;
                if (niche.icon_name === 'Music') IconComponent = Music;
                if (niche.icon_name === 'Star') IconComponent = Star;
                if (niche.icon_name === 'Camera') IconComponent = Camera;
                if (niche.icon_name === 'Dumbbell') IconComponent = Dumbbell;

                return (
                  <Link key={niche.id} href={`/explore?niche=${niche.name}`} className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-white/10 transition-colors group">
                    <div className="flex items-center gap-4">
                      <IconComponent className="w-8 h-8 text-zinc-400 group-hover:text-primary transition-colors" />
                      <div>
                        <h3 className="font-bold text-lg">{niche.name}</h3>
                        <p className="text-sm text-zinc-500">{niche.course_count || 0} creators/courses</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-primary transition-colors" />
                  </Link>
                );
              })
            ) : (
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center text-zinc-500 py-10">
                Nenhum nicho disponível no momento.
              </div>
            )}

          </div>
          
          <div className="mt-8 flex justify-start">
             <Link href="/explore" className="font-bold text-primary hover:text-primary/80 flex items-center gap-2">
               + Show more niches
             </Link>
          </div>
        </div>
      </section>

      {/* Guaranteed Banner & Become a Creator (Inspired by Preply) */}
      <section className="w-full">
        {/* Solid Color Banner */}
        <div className="bg-rose-500 text-white py-16 px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
            Content you'll love. Guaranteed.
          </h2>
          <p className="text-lg md:text-xl font-medium opacity-90">
            Cancel anytime if it's not exactly what you're looking for.
          </p>
        </div>
        
        {/* Become a Creator block */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="rounded-[2.5rem] overflow-hidden bg-primary grid grid-cols-1 md:grid-cols-2">
             <div className="relative h-64 md:h-auto bg-zinc-900 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-primary/20" />
                <Users className="w-32 h-32 text-primary opacity-20 absolute" />
                <div className="z-10 text-center">
                   <div className="w-24 h-24 rounded-full bg-white text-primary flex items-center justify-center font-black text-3xl mx-auto mb-4 border-4 border-primary/20 shadow-2xl">
                     $$
                   </div>
                </div>
             </div>
             <div className="p-12 md:p-16 lg:p-24 flex flex-col justify-center text-primary-foreground">
               <h3 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
                 Become a creator
               </h3>
               <p className="text-lg mb-8 font-medium opacity-90 leading-relaxed">
                 Earn money sharing your exclusive content. Set your own prices, keep up to 90% of your earnings, and grow an audience that supports your work directly.
               </p>
               <Link href="/signup?role=creator" className="self-start px-8 py-4 bg-white text-primary font-black rounded-xl hover:bg-zinc-100 transition-colors shadow-xl">
                 Start Earning
               </Link>
             </div>
          </div>
        </div>
      </section>

      {/* How it works (Horizontal 3-column layout) */}
      <section className="w-full py-24 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-5xl font-black mb-16 tracking-tight">
            How CreatorDance works:
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 flex flex-col">
              <div className="w-10 h-10 rounded bg-primary/20 text-primary font-black flex items-center justify-center text-xl mb-6">
                1
              </div>
              <h3 className="text-2xl font-bold mb-4">Find your creator.</h3>
              <p className="text-zinc-400 mb-8 flex-grow">
                We'll connect you with creators who match your specific tastes—from cosplay to exclusive VIP content.
              </p>
              
              <div className="rounded-xl bg-zinc-900 border border-white/10 p-4 shadow-lg">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-zinc-800" />
                   <div>
                     <div className="h-4 w-24 bg-white/20 rounded mb-2" />
                     <div className="h-3 w-16 bg-white/10 rounded" />
                   </div>
                   <div className="ml-auto text-sm font-bold flex items-center gap-1">
                     <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> 4.9
                   </div>
                 </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 flex flex-col">
              <div className="w-10 h-10 rounded bg-amber-500/20 text-amber-500 font-black flex items-center justify-center text-xl mb-6">
                2
              </div>
              <h3 className="text-2xl font-bold mb-4">Subscribe securely.</h3>
              <p className="text-zinc-400 mb-8 flex-grow">
                Choose a subscription tier. Your payments are processed by high-risk gateways with discreet billing.
              </p>
              
              <div className="rounded-xl bg-zinc-900 border border-white/10 p-4 shadow-lg overflow-hidden relative">
                 <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl" />
                 <ShieldCheck className="w-10 h-10 text-emerald-500 mb-2" />
                 <div className="h-3 w-full bg-white/10 rounded mb-2" />
                 <div className="h-3 w-3/4 bg-white/10 rounded" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 flex flex-col">
              <div className="w-10 h-10 rounded bg-rose-500/20 text-rose-500 font-black flex items-center justify-center text-xl mb-6">
                3
              </div>
              <h3 className="text-2xl font-bold mb-4">Unlock the feed.</h3>
              <p className="text-zinc-400 mb-8 flex-grow">
                Get instant access to a premium feed of exclusive videos, images, and direct messages. No limits.
              </p>
              
              <div className="rounded-xl bg-zinc-900 border border-white/10 shadow-lg overflow-hidden flex">
                 <div className="w-1/3 h-24 bg-zinc-800 border-r border-white/10 flex items-center justify-center">
                   <LockKeyhole className="w-5 h-5 text-zinc-600" />
                 </div>
                 <div className="w-1/3 h-24 bg-zinc-700 border-r border-white/10 flex items-center justify-center">
                   <PlayCircle className="w-5 h-5 text-white/50" />
                 </div>
                 <div className="w-1/3 h-24 bg-primary/20 flex items-center justify-center">
                   <Sparkles className="w-5 h-5 text-primary" />
                 </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Agency / Business Section (Inspired by Preply Corporate) */}
      <section className="w-full py-24 bg-white text-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            <div className="w-full lg:w-1/2">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-[1.1]">
                Agency management<br/>for creator networks
              </h2>
              <p className="text-lg md:text-xl text-zinc-600 mb-8 leading-relaxed">
                CreatorDance Agencies is designed for studios and managers handling multiple creator accounts. Centralize your payouts, track performance across your roster, and assign operator permissions.
              </p>
              <p className="text-sm font-bold mb-6">
                Are you an agency managing high-volume creators?<br/>
                Apply for an Agency account now!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/agencies" className="px-8 py-4 bg-black text-white font-bold rounded-xl text-center hover:bg-zinc-800 transition-colors">
                  Book a demo
                </Link>
                <Link href="/agencies/apply" className="px-8 py-4 bg-transparent border-2 border-black text-black font-bold rounded-xl text-center hover:bg-zinc-100 transition-colors">
                  Apply as Agency
                </Link>
              </div>
            </div>
            
            <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
               {/* Illustration Placeholder for Agency */}
               <div className="flex gap-4 items-end">
                 <div className="w-24 h-48 bg-zinc-200 rounded-2xl relative shadow-lg">
                    <div className="absolute -top-3 -left-3 bg-primary text-white text-xs font-bold px-2 py-1 rounded">Creator A</div>
                 </div>
                 <div className="w-32 h-64 bg-zinc-300 rounded-2xl relative shadow-lg">
                    <div className="absolute -top-3 -left-3 bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded">Creator B</div>
                 </div>
                 <div className="w-24 h-56 bg-zinc-200 rounded-2xl relative shadow-lg">
                    <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded">Creator C</div>
                 </div>
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer Minimal */}
      <footer className="w-full py-12 border-t border-white/5 bg-black text-center text-zinc-500 text-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} CreatorDance. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/help" className="hover:text-white transition-colors">Help Center</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
