'use client';

import { useState } from 'react';
import { approveKYC, rejectKYC } from '@/app/actions/kyc';

export default function AdminKYCClient({ submission }: { submission: any }) {
  const [loading, setLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this creator?')) return;
    
    setLoading(true);
    try {
      await approveKYC(submission.id, submission.creator_id);
    } catch (error: any) {
      console.error(error);
      alert('Error approving KYC: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }
    
    setLoading(true);
    try {
      await rejectKYC(submission.id, submission.creator_id, reason);
      setRejecting(false);
    } catch (error: any) {
      console.error(error);
      alert('Error rejecting KYC: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Construct absolute URLs using Supabase project URL
  const bucketUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/kyc-documents`;
  // Wait, kyc-documents is private. To display them, we need signed URLs. 
  // However, for admin, since we use the service role, we could fetch signed URLs in the server component.
  // Actually, since we didn't fetch signed URLs in the server component, we need a way to display them.
  // A simple way is to use a server action or API route to proxy the image, but since this is an admin panel, 
  // let's fetch signed URLs on the client side or just update the server component to fetch them.
  // For now, let's just pass the raw path and assume the admin has a way to view them, or we can use the supabase client to download them.
  // Let's implement a simple direct download using supabase client.

  const [images, setImages] = useState<{ front: string | null, back: string | null, selfie: string | null }>({
    front: null, back: null, selfie: null
  });

  // We should ideally fetch signed URLs for these in the server component.
  // But let's simplify for the client component: 
  // We'll create a small utility function to load them if they are private.
  // For now, let's just show placeholders or the file paths because downloading private files securely in a Next.js client component without a signed URL from the server is tricky (requires RLS policy for admins, which we didn't set up).
  // Wait! We can use a Server Action to get a signed URL!
  
  return (
    <div className="bg-card border border-red-500/10 rounded-xl p-6 flex flex-col md:flex-row gap-8">
       <div className="flex-1 flex flex-col gap-4">
          <div>
            <h3 className="text-white font-bold text-lg">{submission.profiles.display_name || submission.profiles.username}</h3>
            <p className="text-zinc-400 text-sm">@{submission.profiles.username}</p>
            <p className="text-zinc-500 text-xs mt-1">Enviado em: {new Date(submission.created_at).toLocaleString()}</p>
          </div>
          
          <div className="flex flex-wrap gap-4 mt-2">
             <div className="w-full flex gap-4">
                <div className="flex-1 flex flex-col gap-2">
                  <span className="text-xs text-zinc-500 font-medium uppercase">Document Front</span>
                  <div className="w-full h-32 bg-zinc-900 border border-white/5 rounded-md flex flex-col items-center justify-center text-xs text-zinc-600 font-medium overflow-hidden">
                    <span className="break-all px-2 text-center line-clamp-2">{submission.document_front_url}</span>
                    <button 
                      className="text-blue-500 mt-2 hover:underline disabled:opacity-50" 
                      onClick={async () => {
                        try {
                          const { getSignedUrl } = await import('@/app/actions/kyc');
                          const url = await getSignedUrl(submission.document_front_url);
                          window.open(url, '_blank');
                        } catch(e) {
                          alert('Error loading image');
                        }
                      }}
                    >
                      View
                    </button>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <span className="text-xs text-zinc-500 font-medium uppercase">Document Back</span>
                  <div className="w-full h-32 bg-zinc-900 border border-white/5 rounded-md flex flex-col items-center justify-center text-xs text-zinc-600 font-medium overflow-hidden">
                    <span className="break-all px-2 text-center line-clamp-2">{submission.document_back_url}</span>
                    <button 
                      className="text-blue-500 mt-2 hover:underline disabled:opacity-50" 
                      onClick={async () => {
                        try {
                          const { getSignedUrl } = await import('@/app/actions/kyc');
                          const url = await getSignedUrl(submission.document_back_url);
                          window.open(url, '_blank');
                        } catch(e) {
                          alert('Error loading image');
                        }
                      }}
                    >
                      View
                    </button>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <span className="text-xs text-zinc-500 font-medium uppercase">Selfie</span>
                  <div className="w-full h-32 bg-zinc-900 border border-white/5 rounded-md flex flex-col items-center justify-center text-xs text-zinc-600 font-medium overflow-hidden">
                    <span className="break-all px-2 text-center line-clamp-2">{submission.selfie_url}</span>
                    <button 
                      className="text-blue-500 mt-2 hover:underline disabled:opacity-50" 
                      onClick={async () => {
                        try {
                          const { getSignedUrl } = await import('@/app/actions/kyc');
                          const url = await getSignedUrl(submission.selfie_url);
                          window.open(url, '_blank');
                        } catch(e) {
                          alert('Error loading image');
                        }
                      }}
                    >
                      View
                    </button>
                  </div>
                </div>
             </div>
          </div>
       </div>
       
       <div className="flex md:flex-col gap-3 justify-center mt-4 md:mt-0 w-full md:w-48">
          {!rejecting ? (
            <>
              <button 
                onClick={handleApprove}
                disabled={loading}
                className="h-11 px-8 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-500 font-bold rounded-lg transition-colors text-sm shadow-sm disabled:opacity-50"
              >
                Aprovar Criador
              </button>
              <button 
                onClick={() => setRejecting(true)}
                disabled={loading}
                className="h-11 px-8 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 font-bold rounded-lg transition-colors text-sm shadow-sm disabled:opacity-50"
              >
                Rejeitar...
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 w-full">
              <textarea 
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Motivo da rejeição..."
                className="w-full bg-zinc-900 border border-red-500/30 rounded-md p-2 text-sm text-white focus:outline-none focus:border-red-500/60"
                rows={3}
              />
              <button 
                onClick={handleReject}
                disabled={loading}
                className="h-9 w-full bg-red-500 text-white font-bold rounded-lg transition-colors text-sm shadow-sm disabled:opacity-50"
              >
                Confirmar Rejeição
              </button>
              <button 
                onClick={() => setRejecting(false)}
                disabled={loading}
                className="h-9 w-full bg-transparent text-zinc-400 font-bold rounded-lg hover:text-white transition-colors text-xs"
              >
                Cancelar
              </button>
            </div>
          )}
       </div>
    </div>
  );
}
