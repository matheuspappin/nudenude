'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const links = [
    { name: 'Visão Geral', href: '/dashboard' },
    { name: 'Nova Postagem', href: '/dashboard/upload' },
    { name: 'Planos VIP', href: '/dashboard/tiers' },
    { name: 'KYC / Identidade', href: '/dashboard/kyc' },
  ];

  return (
    <div className="flex w-full min-h-[75vh] gap-10 mt-6">
      <aside className="w-64 flex-shrink-0 flex flex-col gap-2 border-r border-white/10 pr-6 hidden md:flex">
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Creator Studio</h2>
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link 
              key={link.href} 
              href={link.href} 
              className={`px-4 py-2.5 rounded-md font-medium text-sm transition-all duration-200 ${
                isActive 
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                  : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
              }`}
            >
              {link.name}
            </Link>
          );
        })}
        
        {/* Botão extra para conectar o dashboard ao perfil público (Lógica OnlyFans) */}
        <div className="mt-8 border-t border-white/10 pt-6">
          <Link href="/abc" className="flex items-center gap-2 px-4 py-2.5 rounded-md text-zinc-300 font-bold bg-white/5 hover:bg-white/10 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            Ver Meu Perfil Público
          </Link>
        </div>
      </aside>
      
      <main className="flex-1 max-w-4xl">
        {children}
      </main>
    </div>
  );
}
