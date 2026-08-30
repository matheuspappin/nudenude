'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const links = [
    { name: 'Global Overview', href: '/admin' },
    { name: 'KYC Queue', href: '/admin/kyc-queue' },
    { name: 'Moderation & Bans', href: '/admin/users' },
    { name: 'New Creator (Manual)', href: '/admin/create-creator' },
    { name: 'Affiliates / Commissions', href: '/admin/affiliates' },
    { name: 'Support & Tickets', href: '/admin/support' },
  ];

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
      </aside>
      
      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
}
