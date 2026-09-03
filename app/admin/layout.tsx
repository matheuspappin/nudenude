'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();
        
      if (!profile?.is_admin && session.user.email !== 'vendaslachef@gmail.com') {
        router.push('/');
        return;
      }
      setIsAdmin(true);
      setIsLoading(false);
    };
    checkAdmin();
  }, [router, supabase]);

  const links = [
    { name: 'Global Overview', href: '/admin' },
    { name: 'Transactions', href: '/admin/transactions' },
    { name: 'User Management', href: '/admin/users' },
    { name: 'Content Moderation', href: '/admin/content' },
    { name: 'Platform Settings', href: '/admin/settings' },
    { name: 'Affiliates', href: '/admin/affiliates' }
  ];

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold">Verifying Admin Access...</div>;
  }

  return (
    <div className="flex w-full min-h-[75vh] gap-10 mt-6 bg-red-950/10 p-4 md:p-8 rounded-2xl border border-red-500/10 relative overflow-hidden">
      
      {/* Background Glow para dar a estética de Admin/Perigo */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-red-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Sidebar - Super Admin */}
      <aside className="w-56 flex-shrink-0 flex flex-col gap-2 border-r border-red-500/10 pr-6 hidden md:flex">
        <h2 className="text-xs font-black text-red-500 uppercase tracking-widest mb-4">Super Admin</h2>
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link 
              key={link.href} 
              href={link.href} 
              className={`px-4 py-2.5 rounded-md font-medium text-sm transition-all duration-200 ${
                isActive 
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-sm' 
                  : 'text-zinc-400 hover:bg-red-500/5 hover:text-red-300'
              }`}
            >
              {link.name}
            </Link>
          );
        })}
        <div className="mt-auto px-4 flex flex-col gap-3 pb-8">
          <Link href="/" className="flex items-center gap-2 px-4 py-2.5 rounded-md text-red-500 font-bold bg-white/5 hover:bg-white/10 transition-colors shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            Sair do Admin
          </Link>
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/login');
              router.refresh();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-md text-zinc-500 font-bold hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Deslogar
          </button>
        </div>
      </aside>
      
      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
}
