import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import HelioPaywall from '@/components/checkout/HelioPaywall';

export default async function WalletPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, purchased_credits, earned_credits')
    .eq('id', session.user.id)
    .single();

  const isCreator = profile?.role === 'creator';
  const purchasedBalance = profile?.purchased_credits || 0;
  const earnedBalance = profile?.earned_credits || 0;

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-black text-white mb-8">My Wallet</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Balance Card */}
        <div className="bg-card border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center shadow-lg">
          <p className="text-sm text-zinc-400 font-bold uppercase tracking-widest mb-2">Purchased NudeCoins</p>
          <div className="flex items-center gap-3">
             <span className="text-5xl font-black text-amber-500">{purchasedBalance}</span>
             <span className="text-xl font-bold text-amber-500/50">Coins</span>
          </div>
          
          {isCreator && (
            <div className="mt-8 w-full pt-6 border-t border-white/10">
              <p className="text-sm text-zinc-400 font-bold uppercase tracking-widest mb-2 text-center">Earned from Fans</p>
              <div className="flex justify-center items-center gap-2 mb-4">
                 <span className="text-3xl font-black text-emerald-400">{earnedBalance}</span>
                 <span className="text-lg font-bold text-emerald-400/50">Coins</span>
              </div>
              <button className="w-full h-12 bg-zinc-100 hover:bg-white text-zinc-900 font-bold rounded-lg transition-colors">
                Request Withdrawal
              </button>
              <p className="text-xs text-center text-zinc-500 mt-3">
                Minimum withdrawal: 500 NudeCoins ($50 USDC)
              </p>
            </div>
          )}
        </div>

        {/* Buy Credits Card */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white mb-2">Buy NudeCoins</h2>
          <HelioPaywall 
            buyerId={session.user.id}
            purchaseType="credit_package"
            amount={10} 
            creditsAmount={100}
            onSuccess={() => console.log('Bought 100 NudeCoins')}
          />
          <p className="text-xs text-zinc-500 text-center mt-2">
            100 NudeCoins = $10.00 USDC
          </p>
        </div>
      </div>
    </div>
  );
}
