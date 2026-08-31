import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import KYCClient from './KYCClient'

export default async function KYCVerification() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile to get kyc_status
  const { data: profile } = await supabase
    .from('profiles')
    .select('kyc_status')
    .eq('id', user.id)
    .single()

  const kycStatus = profile?.kyc_status || 'none'

  // Fetch latest submission if not none
  let rejectionReason = null
  if (kycStatus === 'rejected') {
    const { data: submission } = await supabase
      .from('kyc_submissions')
      .select('rejection_reason')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      
    if (submission) {
      rejectionReason = submission.rejection_reason
    }
  }

  return (
    <KYCClient 
      userId={user.id} 
      kycStatus={kycStatus} 
      rejectionReason={rejectionReason} 
    />
  )
}
