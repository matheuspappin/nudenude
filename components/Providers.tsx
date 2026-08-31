'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={{
        loginMethods: ['email', 'google', 'apple'],
        appearance: {
          theme: 'dark',
          accentColor: '#e11d48', // Tailwind rose-600 / primary
          logo: 'https://your-logo-url',
          walletChainType: 'solana-only'
        },
        embeddedWallets: {
          solana: {
            createOnLogin: 'users-without-wallets'
          }
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
