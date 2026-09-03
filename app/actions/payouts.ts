'use server';

import { getStripe } from '@/utils/stripe/server';
import { createAdminClient } from '@/utils/supabase/admin';

type ProcessPayoutArgs = {
  buyerId: string;
  creatorId: string;
  amountTotal: number; // In BRL or USD, e.g. 99.90
  transactionType: 'subscription' | 'ppv' | 'dropin';
  stripeSessionId?: string;
};

export async function processSplitAndPayout({
  buyerId,
  creatorId,
  amountTotal,
  transactionType,
  stripeSessionId
}: ProcessPayoutArgs) {
  const stripe = getStripe();
  const supabase = createAdminClient();

  try {
    // 1. Fetch Creator and Buyer Data
    const { data: creator } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', creatorId)
      .single();

    const { data: buyer } = await supabase
      .from('profiles')
      .select('referred_by')
      .eq('id', buyerId)
      .single();

    const affiliateId = buyer?.referred_by;

    let affiliateStripeId: string | null = null;
    let affiliatePercentage = 0;

    // 2. Fetch Affiliate Data if applicable
    if (affiliateId) {
      const { data: affiliate } = await supabase
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', affiliateId)
        .single();
      
      if (affiliate?.stripe_account_id) {
        affiliateStripeId = affiliate.stripe_account_id;
        // Check if there is a custom override for this creator-affiliate combo
        const { data: customAffiliate } = await supabase
          .from('affiliates')
          .select('percentage')
          .eq('affiliate_id', affiliateId)
          .eq('creator_id', creatorId)
          .single();
          
        affiliatePercentage = customAffiliate?.percentage || 10; // Default 10%
      }
    }

    // 3. Calculate Splits
    const PLATFORM_FEE_PERCENTAGE = 20; // 20% platform fee
    const platformAmount = amountTotal * (PLATFORM_FEE_PERCENTAGE / 100);
    const affiliateAmount = affiliateStripeId ? amountTotal * (affiliatePercentage / 100) : 0;
    const creatorAmount = amountTotal - platformAmount - affiliateAmount;

    // 4. Execute Stripe Transfers (if stripe is configured and creator has an account)
    if (stripe && creator?.stripe_account_id) {
      // Transfer to Creator
      try {
        await stripe.transfers.create({
          amount: Math.round(creatorAmount * 100), // Convert to cents
          currency: 'brl',
          destination: creator.stripe_account_id,
          description: `Payout for ${transactionType}`,
        });
      } catch (err: any) {
        console.error('Failed to transfer to creator:', err.message);
      }

      // Transfer to Affiliate
      if (affiliateStripeId && affiliateAmount > 0) {
        try {
          await stripe.transfers.create({
            amount: Math.round(affiliateAmount * 100),
            currency: 'brl',
            destination: affiliateStripeId,
            description: `Affiliate commission for ${transactionType}`,
          });
        } catch (err: any) {
          console.error('Failed to transfer to affiliate:', err.message);
        }
      }
    } else {
      console.warn('Stripe not configured or Creator lacks stripe_account_id. Funds remain in platform balance.');
    }

    // 5. Log Transaction
    await supabase.from('platform_transactions').insert({
      stripe_session_id: stripeSessionId, // Could be null if from AkaaiCore
      amount_total: amountTotal,
      platform_fee: platformAmount,
      creator_amount: creatorAmount,
      affiliate_amount: affiliateAmount,
      buyer_id: buyerId,
      creator_id: creatorId,
      affiliate_id: affiliateId || null,
      transaction_type: transactionType,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Payout processing error:', error);
    return { success: false, error: error.message };
  }
}
