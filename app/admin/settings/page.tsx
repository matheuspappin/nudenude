'use client';
import React, { useState, useEffect } from 'react';
import { Settings, CreditCard, Shield, Server, Coins, Zap, ExternalLink } from 'lucide-react';
import { getStripeConnectStatus, createStripeConnectAccountLink } from '@/app/actions/stripe-connect';
import { createClient } from '@/utils/supabase/client';

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [platformFee, setPlatformFee] = useState(10);
  const [affiliateFee, setAffiliateFee] = useState(15);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  const [connectStatus, setConnectStatus] = useState<{ stripe_account_id: string | null, payouts_enabled: boolean, details_submitted: boolean } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const fetchStatus = async () => {
      const data = await getStripeConnectStatus();
      setConnectStatus(data);
    };
    
    const fetchSettings = async () => {
      const { data, error } = await supabase.from('platform_settings').select('*').limit(1).single();
      if (data && !error) {
        setPlatformFee(Number(data.platform_fee_percent));
        setAffiliateFee(Number(data.affiliate_fee_percent));
        setSettingsId(data.id);
      }
    };

    fetchStatus();
    fetchSettings();
  }, [supabase]);

  const handleConnectStripe = async () => {
    setIsConnecting(true);
    try {
      const url = await createStripeConnectAccountLink(`${window.location.origin}/admin/settings`);
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setIsConnecting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    if (settingsId) {
       const { error } = await supabase
         .from('platform_settings')
         .update({ 
            platform_fee_percent: platformFee, 
            affiliate_fee_percent: affiliateFee 
         })
         .eq('id', settingsId);
         
       if (error) {
         alert("Erro ao salvar configurações: " + error.message);
       } else {
         // visual feedback success
       }
    }
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col w-full h-full p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-red-500" />
            Platform Settings
          </h1>
          <p className="text-zinc-400 mt-1">Configure core infrastructure, payments, and global platform rules.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold shadow-glow-sm transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Payment Infrastructure (Stripe) */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700" />
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Payment Infrastructure</h2>
          </div>
          
          <div className="space-y-5 relative z-10">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-400">Stripe Publishable Key</label>
              <input 
                type="text" 
                value={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? `${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 12)}... (Ativa)` : 'Não configurada no .env.local'} 
                disabled
                className="bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-zinc-500 font-mono text-sm cursor-not-allowed"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-400">Stripe Secret Key</label>
              <input 
                type="password" 
                value="sk_test_..._mascarada_por_seguranca" 
                disabled
                className="bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-zinc-500 font-mono text-sm cursor-not-allowed"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-400">Stripe Webhook Secret</label>
              <input 
                type="password" 
                value="Ainda não configurado (opcional no momento)" 
                disabled
                className="bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-zinc-500 font-mono text-sm cursor-not-allowed"
              />
            </div>
            <div className="flex flex-col gap-1.5 pt-4 border-t border-white/10 mt-4">
              <label className="text-sm font-bold text-white mb-2">Sua Conta Stripe Connect (Recebimentos)</label>
              <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                <div>
                  <h3 className="text-sm font-bold text-zinc-300">
                    {connectStatus?.payouts_enabled ? 'Conta Conectada e Ativa' : connectStatus?.stripe_account_id ? 'Onboarding Pendente' : 'Não Conectada'}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">ID: {connectStatus?.stripe_account_id || '---'}</p>
                </div>
                
                <button 
                  onClick={handleConnectStripe}
                  disabled={isConnecting}
                  className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 ${
                    connectStatus?.payouts_enabled 
                      ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                      : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-sm'
                  }`}
                >
                  {isConnecting ? 'Gerando link...' : connectStatus?.payouts_enabled ? 'Acessar Painel Express' : 'Conectar Via OAuth'}
                  {connectStatus?.payouts_enabled && <ExternalLink className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-xs text-zinc-500 mt-4">As chaves Master do Stripe são gerenciadas de forma segura via variáveis de ambiente (.env).</p>
          </div>
        </div>

        {/* Global Financial Rules */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700" />
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Coins className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Global Financials</h2>
          </div>
          
          <div className="space-y-6 relative z-10">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-zinc-300">Base Platform Fee (%)</label>
                <span className="text-emerald-400 font-mono">{platformFee}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="50" 
                value={platformFee}
                onChange={(e) => setPlatformFee(Number(e.target.value))}
                className="w-full accent-emerald-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-zinc-500 mt-1">Taxa padrão cobrada sobre todas as vendas na plataforma.</p>
            </div>

            <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-zinc-300">Base Affiliate Commission (%)</label>
                <span className="text-emerald-400 font-mono">{affiliateFee}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={affiliateFee}
                onChange={(e) => setAffiliateFee(Number(e.target.value))}
                className="w-full accent-emerald-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-zinc-500 mt-1">Comissão base que os afiliados recebem por indicação.</p>
            </div>
          </div>
        </div>

        {/* Web3 / Crypto Treasury */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-purple-500/20 transition-all duration-700" />
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Web3 & Treasury (Solana)</h2>
          </div>
          
          <div className="space-y-5 relative z-10">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-400">Platform Treasury Wallet Address</label>
              <input 
                type="text" 
                value="HdgD8VBNXn8FdiGNy7bpSwoFtjZDSAr18G1AwjXQFHdx" 
                disabled
                className="bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-zinc-500 font-mono text-sm cursor-not-allowed"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-400">Akaai Billing Secret</label>
              <input 
                type="password" 
                value="ak_live_a1b2c3d4e5f6g7h8i9j0" 
                disabled
                className="bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-zinc-500 font-mono text-sm cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* System & Security */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-orange-500/20 transition-all duration-700" />
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">System Operations</h2>
          </div>
          
          <div className="space-y-6 relative z-10">
            <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
              <div>
                <h3 className="text-sm font-bold text-white">Maintenance Mode</h3>
                <p className="text-xs text-zinc-500 mt-1">Desativa o acesso de usuários normais. Apenas Super Admins podem entrar.</p>
              </div>
              <button 
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`w-12 h-6 rounded-full transition-colors relative ${maintenanceMode ? 'bg-orange-500' : 'bg-zinc-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${maintenanceMode ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
              <div>
                <h3 className="text-sm font-bold text-white">Clear Global Cache</h3>
                <p className="text-xs text-zinc-500 mt-1">Limpa o cache de CDN e do Next.js. Útil após atualizações de banco de dados.</p>
              </div>
              <button className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-xs font-semibold text-white transition-colors">
                Purge Cache
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
