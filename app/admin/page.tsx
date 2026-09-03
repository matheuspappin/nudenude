'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getPlatformFinancialStats } from '@/app/actions/stripe-analytics';
import { Activity, DollarSign, TrendingUp, Clock, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const supabase = createClient();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCreators: 0,
    totalCourses: 0,
  });
  
  const [finance, setFinance] = useState({
    available: 0,
    pending: 0,
    currency: 'BRL',
    error: null as string | null
  });
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      // Fetch DB Stats
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: creatorsCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_creator', true);
      const { count: coursesCount } = await supabase.from('courses').select('*', { count: 'exact', head: true });
      
      setStats({
        totalUsers: usersCount || 0,
        totalCreators: creatorsCount || 0,
        totalCourses: coursesCount || 0,
      });

      // Fetch Real Stripe Stats
      try {
        const financialData = await getPlatformFinancialStats();
        setFinance({
          available: financialData.available,
          pending: financialData.pending,
          currency: financialData.currency,
          error: financialData.error
        });
      } catch (err: any) {
        setFinance(f => ({ ...f, error: err.message || 'Erro ao carregar dados financeiros' }));
      }

      setIsLoading(false);
    };

    fetchData();
  }, [supabase]);

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency }).format(value);
  };

  if (isLoading) return <div className="text-zinc-400 p-8 animate-pulse">Carregando painel de controle...</div>;

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="border-b border-red-500/20 pb-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">Main Vault</h1>
        <p className="text-red-400 text-sm mt-1">Global Oversight and Financial Metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-red-500/10 rounded-xl p-6 shadow-sm">
           <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Total Users</h3>
           <p className="text-3xl font-black text-white mb-1">{stats.totalUsers}</p>
           <span className="text-xs text-green-500 font-bold">Registered platform accounts</span>
        </div>
        <div className="bg-card border border-red-500/20 rounded-xl p-6 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/20 blur-2xl rounded-full pointer-events-none" />
           <h3 className="text-xs font-bold text-red-400/80 uppercase tracking-widest mb-2">Total Creators</h3>
           <p className="text-3xl font-black text-red-500 mb-1">{stats.totalCreators}</p>
           <span className="text-xs text-red-400/70 font-bold">Approved content creators</span>
        </div>
        <div className="bg-card border border-red-500/10 rounded-xl p-6 shadow-sm">
           <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Total Courses</h3>
           <p className="text-3xl font-black text-white mb-1">{stats.totalCourses}</p>
           <span className="text-xs text-zinc-500 font-bold">Published courses on platform</span>
        </div>
      </div>

      <div className="mt-4">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-500" />
          Live Financial Growth (Stripe)
        </h2>

        {finance.error ? (
           <div className="p-6 bg-red-950/20 border border-red-500/30 rounded-2xl flex flex-col items-center justify-center gap-2">
              <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
              <p className="text-red-400 font-bold">Conexão com Stripe indisponível</p>
              <p className="text-zinc-500 text-sm max-w-md text-center">{finance.error}</p>
              <p className="text-xs text-zinc-600 mt-2">Verifique se as variáveis STRIPE_SECRET_KEY estão configuradas no .env.local.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Available Balance */}
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-2xl p-8 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700" />
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-zinc-400 font-bold text-sm tracking-wide">Saldo Disponível</h3>
                  <p className="text-xs text-emerald-500/80 font-medium">Pronto para saque</p>
                </div>
              </div>
              <p className="text-4xl font-black text-white tracking-tight relative z-10 mt-6">
                {formatCurrency(finance.available, finance.currency)}
              </p>
            </div>

            {/* Pending Balance */}
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-2xl p-8 relative overflow-hidden group hover:border-amber-500/30 transition-all">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-amber-500/20 transition-all duration-700" />
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-zinc-400 font-bold text-sm tracking-wide">Saldo Pendente</h3>
                  <p className="text-xs text-amber-500/80 font-medium">Em processamento pelo banco</p>
                </div>
              </div>
              <p className="text-4xl font-black text-white tracking-tight relative z-10 mt-6">
                {formatCurrency(finance.pending, finance.currency)}
              </p>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
