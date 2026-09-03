'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getPlatformFinancialStats } from '@/app/actions/stripe-analytics';
import { Activity, DollarSign, TrendingUp, Clock, AlertCircle, Users, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';

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

  // Real DB financial aggregates
  const [dbFinance, setDbFinance] = useState({
    totalRevenue: 0,
    totalPlatformFees: 0,
    totalCreatorPayouts: 0,
    totalAffiliatePayouts: 0,
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
    totalTransactions: 0
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

      // Fetch all platform_transactions for real aggregates
      const { data: allTx } = await supabase
        .from('platform_transactions')
        .select('amount_total, platform_fee, creator_amount, affiliate_amount, created_at');

      if (allTx) {
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        let totalRevenue = 0, totalPlatformFees = 0, totalCreatorPayouts = 0, totalAffiliatePayouts = 0;
        let thisMonthRevenue = 0, lastMonthRevenue = 0;

        allTx.forEach(tx => {
          totalRevenue += Number(tx.amount_total || 0);
          totalPlatformFees += Number(tx.platform_fee || 0);
          totalCreatorPayouts += Number(tx.creator_amount || 0);
          totalAffiliatePayouts += Number(tx.affiliate_amount || 0);

          const txDate = new Date(tx.created_at);
          if (txDate >= thisMonthStart) {
            thisMonthRevenue += Number(tx.amount_total || 0);
          } else if (txDate >= lastMonthStart && txDate < thisMonthStart) {
            lastMonthRevenue += Number(tx.amount_total || 0);
          }
        });

        setDbFinance({
          totalRevenue,
          totalPlatformFees,
          totalCreatorPayouts,
          totalAffiliatePayouts,
          thisMonthRevenue,
          lastMonthRevenue,
          totalTransactions: allTx.length
        });
      }

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

  const formatCurrency = (value: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency }).format(value);
  };

  const revenueChange = dbFinance.lastMonthRevenue > 0 
    ? ((dbFinance.thisMonthRevenue - dbFinance.lastMonthRevenue) / dbFinance.lastMonthRevenue * 100).toFixed(1)
    : dbFinance.thisMonthRevenue > 0 ? '+100' : '0';

  if (isLoading) return <div className="text-zinc-400 p-8 animate-pulse">Carregando painel de controle...</div>;

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="border-b border-red-500/20 pb-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">Main Vault</h1>
        <p className="text-red-400 text-sm mt-1">Global Oversight and Financial Metrics</p>
      </div>

      {/* Platform Stats */}
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

      {/* Real Financial Aggregates from platform_transactions */}
      <div className="mt-2">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-500" />
          Revenue Breakdown (Database)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-emerald-950/30 to-black border border-emerald-500/10 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none" />
            <p className="text-xs font-bold text-emerald-400/80 uppercase tracking-widest mb-1">Total Revenue</p>
            <p className="text-2xl font-black text-white">{formatCurrency(dbFinance.totalRevenue)}</p>
            <p className="text-[10px] text-zinc-500 mt-1">{dbFinance.totalTransactions} transações</p>
          </div>

          <div className="bg-card border border-white/10 rounded-xl p-5">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Platform Fees</p>
            <p className="text-2xl font-black text-emerald-400">{formatCurrency(dbFinance.totalPlatformFees)}</p>
            <p className="text-[10px] text-zinc-500 mt-1">Lucro da plataforma</p>
          </div>

          <div className="bg-card border border-white/10 rounded-xl p-5">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Creator Payouts</p>
            <p className="text-2xl font-black text-white">{formatCurrency(dbFinance.totalCreatorPayouts)}</p>
            <p className="text-[10px] text-zinc-500 mt-1">Pago aos criadores</p>
          </div>

          <div className="bg-card border border-white/10 rounded-xl p-5">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Affiliate Payouts</p>
            <p className="text-2xl font-black text-amber-400">{formatCurrency(dbFinance.totalAffiliatePayouts)}</p>
            <p className="text-[10px] text-zinc-500 mt-1">Comissões de afiliados</p>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="mt-4 p-4 bg-card border border-white/10 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Este Mês vs. Anterior</p>
            <p className="text-lg font-black text-white mt-1">{formatCurrency(dbFinance.thisMonthRevenue)}</p>
          </div>
          <div className="flex items-center gap-1">
            {Number(revenueChange) >= 0 ? (
              <ArrowUpRight className="w-5 h-5 text-emerald-500" />
            ) : (
              <ArrowDownRight className="w-5 h-5 text-red-500" />
            )}
            <span className={`text-lg font-black ${Number(revenueChange) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {revenueChange}%
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">Mês anterior</p>
            <p className="text-sm font-bold text-zinc-400">{formatCurrency(dbFinance.lastMonthRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Stripe Live Balance */}
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
