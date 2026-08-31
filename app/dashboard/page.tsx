'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function DashboardHome() {
  const router = useRouter();
  const supabase = createClient();
  
  const [balance, setBalance] = useState(0.00);
  const [activeSubscribers, setActiveSubscribers] = useState(0);
  const [mrr, setMrr] = useState(0.00);
  const [isLoading, setIsLoading] = useState(true);

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }

        // Validate if user is actually a creator
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile?.role !== 'creator') {
          router.push('/');
          return;
        }

        // Fetch subscriptions to calculate Active Subscribers and MRR
        // We need to join with tiers to get the price
        const { data: subsData, error: subsError } = await supabase
          .from('subscriptions')
          .select(`
            status,
            tiers ( price )
          `)
          .eq('creator_id', session.user.id)
          .eq('status', 'active');

        if (subsError) throw subsError;

        let totalMrr = 0;
        let totalSubs = 0;

        if (subsData) {
          totalSubs = subsData.length;
          totalMrr = subsData.reduce((acc, sub: any) => {
             return acc + (sub.tiers?.price || 0);
          }, 0);
        }

        setActiveSubscribers(totalSubs);
        setMrr(totalMrr);
        // Note: Balance is mocked to 0.00 until payout ledger is implemented
        setBalance(0.00);

      } catch (err: any) {
        console.error('Error fetching dashboard data:', err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [router, supabase]);

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    
    if (isNaN(amount) || amount <= 0 || amount > balance) return;

    setIsProcessing(true);
    // Simula API de Payout
    setTimeout(() => {
      setBalance(prev => prev - amount);
      setIsProcessing(false);
      setIsWithdrawModalOpen(false);
      setWithdrawAmount('');
    }, 1500);
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
        {/* Futuro botão de configurações de Tiers */}
        <button className="text-sm font-medium bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2 rounded-lg transition-colors shadow-sm">
          Configure Prices
        </button>
      </div>
      
      {/* Métricas Financeiras e Assinantes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 bg-card border border-white/10 rounded-xl shadow-sm flex flex-col justify-between group hover:border-primary/20 transition-colors">
          <p className="text-sm font-medium text-zinc-400">Available Balance</p>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white tracking-tighter">${balance.toFixed(2)}</p>
            <button 
              onClick={() => setIsWithdrawModalOpen(true)}
              className="text-sm text-primary font-medium mt-3 hover:underline flex items-center gap-1"
            >
              Request Payout &rarr;
            </button>
          </div>
        </div>
        
        <div className="p-6 bg-card border border-white/10 rounded-xl shadow-sm flex flex-col justify-between group hover:border-primary/20 transition-colors">
          <p className="text-sm font-medium text-zinc-400">Active Subscribers</p>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white tracking-tighter">{activeSubscribers}</p>
            <p className="text-xs text-zinc-500 font-semibold mt-3">Live updated</p>
          </div>
        </div>
        
        <div className="p-6 bg-card border border-white/10 rounded-xl shadow-sm flex flex-col justify-between group hover:border-primary/20 transition-colors">
          <p className="text-sm font-medium text-zinc-400">Gross MRR (Monthly)</p>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white tracking-tighter">${mrr.toFixed(2)}</p>
            <p className="text-xs text-zinc-500 font-medium mt-3">Based on active tiers</p>
          </div>
        </div>
      </div>
      
      {/* Placeholder para gráfico de retenção/churn */}
      <div className="p-6 bg-card border border-white/10 rounded-xl h-72 flex flex-col items-center justify-center border-dashed text-zinc-500">
         <span className="mb-2 text-2xl">📊</span>
         <p className="text-sm font-medium">Subscriber Retention Chart</p>
         <p className="text-xs text-zinc-600 mt-1 max-w-xs text-center">Charts will populate automatically once you process your first subscriptions.</p>
      </div>

      {/* MODAL DE SAQUE (PAYOUT) */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-white/10 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Withdraw Funds</h3>
              <button onClick={() => setIsWithdrawModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors">&times;</button>
            </div>
            
            <form onSubmit={handleWithdraw} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                   <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Withdraw Amount</label>
                   <span className="text-xs text-zinc-500">Max: ${balance.toFixed(2)}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                  <input 
                    type="number" step="0.01" max={balance} required
                    value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                    className="h-14 w-full rounded-lg bg-background border border-white/10 pl-8 pr-4 text-white text-lg font-bold focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none"
                    placeholder="0.00" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Destination Method</label>
                <select className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none appearance-none">
                  <option>International Wire Transfer</option>
                  <option>Paxum</option>
                  <option>Skrill</option>
                </select>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 flex justify-end gap-3">
                <button type="button" onClick={() => setIsWithdrawModalOpen(false)} className="px-4 py-2 rounded-lg font-medium text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isProcessing || !withdrawAmount || parseFloat(withdrawAmount) > balance || balance <= 0} className="px-6 py-2 rounded-lg font-bold text-sm bg-primary text-primary-foreground shadow-glow hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center">
                  {isProcessing ? (
                    <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></span>
                  ) : (
                    'Confirm Payout'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
