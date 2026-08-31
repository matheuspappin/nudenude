'use client';

import { useEffect, useState } from 'react';
// Assuming @heliofi/checkout-react is installed, or we use an iframe/embedded approach
// We will mock the wrapper for demonstration and integration purposes

interface HelioPaywallProps {
  purchaseType: 'credit_package' | 'vip_pass';
  packageId?: string; 
  buyerId: string; // REQUIRED for webhook logic
  creatorWallet?: string; 
  creatorName?: string;
  amount: number; 
  creditsAmount?: number; 
  currency?: 'USDC' | 'SOL';
  onSuccess: (paymentId: string) => void;
  onError?: (error: any) => void;
}

export default function HelioPaywall({
  purchaseType,
  packageId,
  buyerId,
  creatorWallet,
  creatorName,
  amount,
  creditsAmount,
  currency = 'USDC',
  onSuccess,
  onError
}: HelioPaywallProps) {
  const [loading, setLoading] = useState(false);

  const title = purchaseType === 'credit_package' 
    ? `Buy ${creditsAmount} Credits` 
    : `VIP Pass - ${creatorName || 'Creator'}`;
    
  const description = purchaseType === 'credit_package'
    ? 'Purchase NudeNude Credits to unlock exclusive posts and tip your favorite creators.'
    : 'Subscribe for exclusive access. Billed via secure Crypto or Apple Pay.';

  const handleCheckout = async () => {
    setLoading(true);
    try {
      console.log(`Initiating Helio Pay for ${amount} ${currency} - ${title}`);
      
      if (purchaseType === 'credit_package') {
         console.log(`Routing 100% to Platform Treasury (Credits Purchase)`);
      } else {
         console.log(`Routing 85% to ${creatorWallet} and 15% to Treasury (VIP Pass)`);
      }
      
      const payload = {
        userId: buyerId,
        type: purchaseType,
        targetId: creatorWallet, // Or a database ID for the creator
        creditsAmount
      };
      
      console.log('Sending metadata to Helio:', payload);

      // Simulate network request to Helio SDK
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate successful payment webhook trigger locally
      const mockPaymentId = `helio_${Date.now()}`;
      onSuccess(mockPaymentId);
    } catch (err) {
      console.error('Helio Checkout Error:', err);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border border-white/10 rounded-xl bg-card flex flex-col items-center justify-center shadow-lg gap-4">
      <div className="flex items-center gap-2 mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 18V6"></path></svg>
        <h3 className="text-xl font-bold text-white">{title}</h3>
      </div>
      
      <p className="text-sm text-zinc-400 text-center mb-4 max-w-[250px]">
        {description}
      </p>

      <button
        onClick={handleCheckout}
        disabled={loading}
        className="h-12 w-full max-w-sm rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-glow"
      >
        {loading ? (
          <span className="animate-pulse">Processing...</span>
        ) : (
          `Pay ${amount} ${currency}`
        )}
      </button>

      <p className="text-xs text-zinc-500 mt-2">Powered by Helio. Zero chargebacks.</p>
    </div>
  );
}
