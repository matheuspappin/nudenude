'use client';
import React, { useEffect, useState } from 'react';
import { getStripeConnectStatus, createStripeConnectAccountLink } from '@/app/actions/stripe-connect';
import { DollarSign, ExternalLink, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

export default function MonetizationPage() {
  const [status, setStatus] = useState<{ stripe_account_id: string | null, payouts_enabled: boolean, details_submitted: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getStripeConnectStatus();
        setStatus(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar status de monetização');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');
    try {
      const returnUrl = `${window.location.origin}/dashboard/monetization`;
      const url = await createStripeConnectAccountLink(returnUrl);
      window.location.href = url;
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar link do Stripe');
      setIsConnecting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-zinc-400 animate-pulse">Carregando painel de monetização...</div>;
  }

  const isFullyConnected = status?.payouts_enabled && status?.details_submitted;
  const isPending = status?.stripe_account_id && !isFullyConnected;

  return (
    <div className="flex flex-col w-full h-full p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-emerald-500" />
          Monetization
        </h1>
        <p className="text-zinc-400 mt-1">Conecte sua conta Stripe para receber automaticamente pelos seus cursos.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="max-w-2xl bg-zinc-900/50 border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full pointer-events-none transition-all duration-1000 ${isFullyConnected ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' : 'bg-primary/10 group-hover:bg-primary/20'}`} />
        
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Conta de Recebimento</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Nós utilizamos o Stripe Connect para garantir pagamentos rápidos e seguros. Ao conectar sua conta, seus ganhos serão repassados automaticamente.
              </p>
            </div>
            {isFullyConnected && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <CheckCircle className="w-4 h-4" /> Ativo
              </div>
            )}
            {isPending && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <AlertCircle className="w-4 h-4" /> Pendente
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-4">
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <span className="text-sm font-medium text-zinc-500">Status da Conta</span>
              <span className={`text-sm font-bold ${isFullyConnected ? 'text-emerald-400' : isPending ? 'text-amber-400' : 'text-zinc-300'}`}>
                {isFullyConnected ? 'Recebimentos Habilitados' : isPending ? 'Revisão Pendente' : 'Não Conectada'}
              </span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <span className="text-sm font-medium text-zinc-500">Stripe ID</span>
              <span className="text-sm font-mono text-zinc-300">
                {status?.stripe_account_id || '---'}
              </span>
            </div>
          </div>

          {!isFullyConnected && (
            <button 
              onClick={handleConnect}
              disabled={isConnecting}
              className="mt-2 w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-3 shadow-glow transition-all disabled:opacity-50"
            >
              {isConnecting ? 'Gerando link seguro...' : isPending ? 'Continuar Onboarding no Stripe' : 'Conectar Conta Stripe'}
              {!isConnecting && <ArrowRight className="w-5 h-5" />}
            </button>
          )}

          {isFullyConnected && (
            <button 
              onClick={handleConnect}
              disabled={isConnecting}
              className="mt-2 w-full h-12 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50"
            >
              <ExternalLink className="w-5 h-5" />
              Acessar Painel do Stripe Express
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
