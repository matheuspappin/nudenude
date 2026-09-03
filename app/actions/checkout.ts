'use server';

export async function createHelioCharge({
  userId,
  purchaseType,
  amount,
  creditsAmount,
  creatorWallet
}: {
  userId: string;
  purchaseType: string;
  amount: number;
  creditsAmount?: number;
  creatorWallet?: string;
}) {
  const secretKey = process.env.HELIO_SECRET_KEY;
  const paylinkId = process.env.NEXT_PUBLIC_HELIO_PAYLINK_ID;

  if (!secretKey || !paylinkId) {
    console.warn('Helio API keys or Paylink ID missing. Returning simulation token.');
    // Se não tivermos as chaves, retornamos um token simulado para o front não quebrar
    return { success: true, chargeToken: null, isMock: true };
  }

  try {
    // Chamada oficial para gerar a Sessão Dinâmica na Helio 
    // Isso blinda os metadados (userId, amount) no servidor.
    const res = await fetch(`https://api.hel.io/v1/paylink/${paylinkId}/charge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secretKey}`
      },
      body: JSON.stringify({
        amount: amount.toString(),
        // Custom metadata that will be sent to the webhook on PAYMENT_SUCCESS
        metadata: {
          userId,
          type: purchaseType,
          creditsAmount,
          targetId: creatorWallet
        }
      })
    });

    if (!res.ok) {
      throw new Error(`Helio API error: ${res.statusText}`);
    }

    const data = await res.json();
    // Supondo que a Helio retorna o ID da transação criada como `data.id` ou `data.token`
    return { success: true, chargeToken: data.id || data.token, isMock: false };
  } catch (error) {
    console.error('Failed to create Helio charge', error);
    return { success: false, error: 'Failed to initialize payment session' };
  }
}
