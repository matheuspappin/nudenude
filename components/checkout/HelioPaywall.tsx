'use client';

import { useEffect, useState, useMemo } from 'react';
import { HelioCheckout } from '@heliofi/checkout-react';
import { createHelioCharge } from '@/app/actions/checkout';

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
  const [chargeToken, setChargeToken] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const title = purchaseType === 'credit_package' 
    ? `Buy ${creditsAmount} Credits` 
    : `VIP Pass - ${creatorName || 'Creator'}`;
    
  const description = purchaseType === 'credit_package'
    ? 'Purchase CreatorDance Credits to unlock exclusive posts and tip your favorite creators.'
    : 'Subscribe for exclusive access. Billed via secure Crypto or Apple Pay.';

  const handleInitCheckout = async () => {
    setLoading(true);
    try {
      // Create a secure charge session on the backend
      const result = await createHelioCharge({
        userId: buyerId,
        purchaseType,
        amount,
        creditsAmount,
        creatorWallet
      });

      if (result.success) {
        setIsMock(result.isMock || false);
        setChargeToken(result.chargeToken || 'mock_token');
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Failed to init Helio charge:', err);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  // If we have a chargeToken and it's a real integration, render Helio Checkout
  const helioConfig = useMemo(() => {
    return {
      paylinkId: process.env.NEXT_PUBLIC_HELIO_PAYLINK_ID || "MOCK_PAYLINK",
      paymentType: "paylink",
      chargeToken: chargeToken === 'mock_token' ? undefined : chargeToken,
      amount: amount.toString(), // Dynamic amount override
      onSuccess: (event: any) => {
        console.log('Helio payment success', event);
        onSuccess(event?.transactionSignature || 'success');
      },
      onError: (err: any) => {
        console.error('Helio checkout error', err);
        if (onError) onError(err);
      }
    };
  }, [chargeToken, amount, onSuccess, onError]);

  if (chargeToken) {
    if (isMock) {
      // Falha gracefully para simulação local se não houver chaves de API
      return (
        <div className="p-6 border border-white/10 rounded-xl bg-card flex flex-col items-center justify-center shadow-lg gap-4">
          <p className="text-amber-500 font-bold">Simulated Checkout</p>
          <button
            onClick={() => onSuccess(`mock_success_${Date.now()}`)}
            className="h-12 w-full max-w-sm rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all shadow-glow"
          >
            Confirm Mock Payment
          </button>
        </div>
      );
    }

    // Renderiza o componente oficial da Helio se for produção / tiver chave
    return (
      <div className="w-full">
         <HelioCheckout config={helioConfig as any} />
      </div>
    );
  }

  // Tela Inicial (Antes de gerar o token)
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
        onClick={handleInitCheckout}
        disabled={loading}
        className="h-12 w-full max-w-sm rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-glow"
      >
        {loading ? (
          <span className="animate-pulse">Loading secure checkout...</span>
        ) : (
          `Pay ${amount} ${currency}`
        )}
      </button>

      <p className="text-xs text-zinc-500 mt-2">Powered by Helio. Zero chargebacks.</p>
    </div>
  );
}
