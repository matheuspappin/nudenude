import { createAdminClient } from '@/utils/supabase/admin'
import AdminKYCClient from './AdminKYCClient'

// Force dynamic since it needs to always fetch the latest queue
export const dynamic = 'force-dynamic'

export default async function AdminKYC() {
  const supabaseAdmin = createAdminClient()

  // Fetch pending submissions along with profile details
  const { data: queue, error } = await supabaseAdmin
    .from('kyc_submissions')
    .select(`
      id,
      creator_id,
      status,
      document_front_url,
      document_back_url,
      selfie_url,
      created_at,
      profiles (
        username,
        display_name
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching KYC queue:', error)
  }

  const submissions = queue || []

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl">
      <div className="border-b border-red-500/20 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Fila de Moderação (KYC)</h1>
          <p className="text-red-400 text-sm mt-1">Aprovação de Identidade de Criadores</p>
        </div>
        <span className="px-3 py-1 bg-red-500/10 text-red-500 text-xs font-bold rounded-full border border-red-500/20">
          {submissions.length} {submissions.length === 1 ? 'Pendente' : 'Pendentes'}
        </span>
      </div>

      <div className="flex flex-col gap-6">
        {submissions.length === 0 ? (
          <div className="bg-card border border-white/5 rounded-xl p-12 flex flex-col items-center justify-center text-zinc-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4l3 3"></path></svg>
            <p>Nenhuma submissão pendente no momento.</p>
          </div>
        ) : (
          submissions.map((sub: any) => (
            <AdminKYCClient key={sub.id} submission={sub} />
          ))
        )}
      </div>
    </div>
  )
}
