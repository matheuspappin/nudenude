'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function submitKYC(frontUrl: string, backUrl: string, selfieUrl: string) {
  const supabase = createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Unauthorized')
  }

  // Insert submission
  const { error: insertError } = await supabase
    .from('kyc_submissions')
    .insert({
      creator_id: user.id,
      document_front_url: frontUrl,
      document_back_url: backUrl,
      selfie_url: selfieUrl,
      status: 'pending'
    })

  if (insertError) {
    throw new Error(`Failed to submit KYC: ${insertError.message}`)
  }

  // Update profile status
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ kyc_status: 'pending' })
    .eq('id', user.id)

  if (profileError) {
    throw new Error(`Failed to update profile status: ${profileError.message}`)
  }

  revalidatePath('/dashboard/kyc')
  return { success: true }
}

export async function approveKYC(submissionId: string, creatorId: string) {
  const supabaseAdmin = createAdminClient()

  // Approve submission
  const { error: subError } = await supabaseAdmin
    .from('kyc_submissions')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', submissionId)

  if (subError) {
    throw new Error(`Failed to approve submission: ${subError.message}`)
  }

  // Update profile
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ 
      kyc_status: 'approved',
      is_creator: true 
    })
    .eq('id', creatorId)

  if (profileError) {
    throw new Error(`Failed to update profile: ${profileError.message}`)
  }

  revalidatePath('/admin/kyc-queue')
  return { success: true }
}

export async function rejectKYC(submissionId: string, creatorId: string, reason: string) {
  const supabaseAdmin = createAdminClient()

  // Reject submission
  const { error: subError } = await supabaseAdmin
    .from('kyc_submissions')
    .update({ 
      status: 'rejected', 
      rejection_reason: reason,
      updated_at: new Date().toISOString() 
    })
    .eq('id', submissionId)

  if (subError) {
    throw new Error(`Failed to reject submission: ${subError.message}`)
  }

  // Update profile
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ kyc_status: 'rejected' })
    .eq('id', creatorId)

  if (profileError) {
    throw new Error(`Failed to update profile: ${profileError.message}`)
  }

  revalidatePath('/admin/kyc-queue')
  return { success: true }
}

export async function getSignedUrl(path: string) {
  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin
    .storage
    .from('kyc-documents')
    .createSignedUrl(path, 60 * 60) // 1 hour expiry

  if (error) {
    throw new Error(`Failed to get signed URL: ${error.message}`)
  }
  return data.signedUrl
}
