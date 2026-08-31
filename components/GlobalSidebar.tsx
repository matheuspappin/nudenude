'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function GlobalSidebar() {
  const pathname = usePathname();
  const supabase = createClient();
  const [role, setRole] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
        
      if (profile) {
        setRole(profile.role);
      }
    };
    
    fetchRole();
  }, [supabase]);

  // Ocultar a sidebar global em rotas que têm sua própria navegação, como Dashboard, Admin ou páginas de tela cheia
  if (
    pathname === '/' ||
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/login') || 
    pathname.startsWith('/become-creator')
  ) {
    return null;
  }

  return (
    <nav className="w-16 lg:w-64 flex-shrink-0 border-r border-white/10 hidden md:flex flex-col sticky top-0 h-screen overflow-y-auto bg-background/50 z-40">
       <div className="h-16 flex items-center px-4 lg:px-6 mb-4">
         <span className="text-xl font-bold tracking-tighter text-white hidden lg:block">NudeNude<span className="text-primary">.</span></span>
         <span className="text-xl font-bold tracking-tighter text-white lg:hidden">N<span className="text-primary">.</span></span>
       </div>

       <div className="flex flex-col gap-2 px-3 lg:px-4">
          <Link href="/" className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group">
             <svg className="w-6 h-6 text-zinc-400 group-hover:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
             <span className="font-bold text-zinc-200 hidden lg:block text-[15px]">Home</span>
          </Link>
          <Link href="/messages" className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group">
             <svg className="w-6 h-6 text-zinc-400 group-hover:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
             <span className="font-bold text-zinc-200 hidden lg:block text-[15px]">Messages</span>
          </Link>
          <Link href="/settings" className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group">
             <svg className="w-6 h-6 text-zinc-400 group-hover:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
             <span className="font-bold text-zinc-200 hidden lg:block text-[15px]">Payment Methods</span>
          </Link>
          <Link href="/profile" className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group">
             <svg className="w-6 h-6 text-zinc-400 group-hover:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
             <span className="font-bold text-zinc-200 hidden lg:block text-[15px]">My Profile</span>
          </Link>
       </div>
       
       <div className="mt-auto px-4 lg:px-6 mb-8 hidden lg:flex flex-col gap-4">
          {role === 'creator' ? (
            <Link href="/dashboard" className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-zinc-800 text-white text-sm font-bold border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 transition-colors shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
              Creator Dashboard
            </Link>
          ) : (
            <Link href="/become-creator" className="w-full text-center py-2.5 rounded-full bg-white/5 text-primary text-sm font-bold hover:bg-white/10 transition-colors">
              Become a Creator
            </Link>
          )}
       </div>
    </nav>
  );
}
