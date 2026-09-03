'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function MobileHeaderAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();
  }, [supabase]);

  if (isLoggedIn === null) {
    return <div className="h-9 w-20 bg-white/5 animate-pulse rounded-md"></div>;
  }

  if (isLoggedIn) {
    return (
      <Link href="/explore" className="h-9 px-5 flex items-center justify-center rounded-md bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-all">
        Meu Painel
      </Link>
    );
  }

  return (
    <Link href="/login" className="h-9 px-5 flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-glow hover:bg-primary/90 transition-all">
      Entrar
    </Link>
  );
}
