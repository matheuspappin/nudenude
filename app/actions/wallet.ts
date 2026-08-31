'use server';

import { createClient } from '@/utils/supabase/server';

export async function unlockMedia(mediaId: string, creatorId: string, amount: number) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return { error: 'Not authenticated' };
  }

  // Check if already unlocked in some purchased_media table (simplified for now)
  // Proceed to spend credits
  const { data: success, error } = await supabase.rpc('spend_credits', {
    p_buyer_id: session.user.id,
    p_creator_id: creatorId,
    p_amount: amount,
    p_reference_id: mediaId,
    p_type: 'unlock_post'
  });

  if (error || !success) {
    console.error('Failed to unlock media:', error);
    return { error: 'Insufficient NudeCoins or transaction failed' };
  }

  // Log this purchase in purchased_media table to grant permanent access
  await supabase.from('purchased_media').insert({ user_id: session.user.id, media_id: mediaId });

  return { success: true };
}

export async function requestWithdrawal(amountUsdc: number) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return { error: 'Not authenticated' };
  }

  // A withdrawal request would typically exchange NudeCoins for USDC
  // E.g., 100 NudeCoins = $10 USDC. 
  // For simplicity, we just log the request in a withdrawals table
  const { error } = await supabase.from('withdrawals').insert({
    creator_id: session.user.id,
    amount_usdc: amountUsdc,
    status: 'pending'
  });

  if (error) {
    return { error: 'Failed to request withdrawal' };
  }

  return { success: true };
}
