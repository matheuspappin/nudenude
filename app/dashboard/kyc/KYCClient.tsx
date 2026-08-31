'use client';

import { useState, useRef } from 'react';
import { submitKYC } from '@/app/actions/kyc';
import { createClient } from '@/utils/supabase/client';

// Helper to generate a client supabase instance
// Make sure you have a client supabase utility. If not, we could just import createClient from '@supabase/supabase-js' 
// but it's better to assume @/utils/supabase/client exists.

export default function KYCClient({ 
  userId, 
  kycStatus, 
  rejectionReason 
}: { 
  userId: string, 
  kycStatus: string, 
  rejectionReason: string | null 
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File, prefix: string) => {
    const ext = file.name.split('.').pop();
    const fileName = `${userId}/${prefix}-${Date.now()}.${ext}`;
    
    const { data, error } = await supabase.storage
      .from('kyc-documents')
      .upload(fileName, file);

    if (error) {
      throw error;
    }
    
    // We return the path to the file.
    return data.path;
  };

  const handleSubmit = async () => {
    if (!frontFile || !backFile || !selfieFile) {
      alert('Please upload all 3 photos.');
      return;
    }
    
    setLoading(true);
    try {
      const frontUrl = await uploadFile(frontFile, 'front');
      const backUrl = await uploadFile(backFile, 'back');
      const selfieUrl = await uploadFile(selfieFile, 'selfie');

      await submitKYC(frontUrl, backUrl, selfieUrl);
      alert('KYC submitted successfully!');
      // Page will revalidate and show 'pending' state
    } catch (error: any) {
      console.error(error);
      alert('Error submitting KYC: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (kycStatus === 'approved') {
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Identity Verification (KYC)</h1>
        </div>
        <div className="bg-card border border-green-500/20 rounded-xl p-6 shadow-sm flex flex-col gap-4 items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          <h2 className="text-xl font-bold text-green-500">Identity Verified</h2>
          <p className="text-zinc-400 text-center">Your identity has been successfully verified. You are now a creator!</p>
        </div>
      </div>
    );
  }

  if (kycStatus === 'pending') {
    return (
      <div className="flex flex-col gap-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Identity Verification (KYC)</h1>
        </div>
        <div className="bg-card border border-white/10 rounded-xl p-6 shadow-sm flex flex-col gap-4 items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <h2 className="text-xl font-bold text-amber-500">Under Review</h2>
          <p className="text-zinc-400 text-center">Your submission is currently being reviewed by our team. This usually takes 24-48 hours.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Identity Verification (KYC)</h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          To receive payouts legally, verifying your official document is mandatory.
        </p>
      </div>

      <div className="bg-card border border-white/10 rounded-xl p-6 shadow-sm flex flex-col gap-8">
        
        {kycStatus === 'rejected' ? (
          <div className="flex flex-col gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
             <div className="flex items-center gap-2 font-bold">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
               <span>Your previous submission was rejected.</span>
             </div>
             {rejectionReason && <p className="text-sm">Reason: {rejectionReason}</p>}
             <p className="text-sm font-medium mt-1">Please submit your documents again carefully.</p>
          </div>
        ) : (
          <div className="flex items-center gap-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
             <span className="text-sm font-medium">Your registration is pending submission. Upload the photos below for review.</span>
          </div>
        )}

        {/* Hidden File Inputs */}
        <input type="file" className="hidden" accept="image/*" ref={frontRef} onChange={(e) => setFrontFile(e.target.files?.[0] || null)} />
        <input type="file" className="hidden" accept="image/*" ref={backRef} onChange={(e) => setBackFile(e.target.files?.[0] || null)} />
        <input type="file" className="hidden" accept="image/*" capture="user" ref={selfieRef} onChange={(e) => setSelfieFile(e.target.files?.[0] || null)} />

        <div className="flex flex-col gap-3">
          <h3 className="text-white font-semibold">1. Official ID Document (ID, Driver's License, Passport)</h3>
          <div className="flex gap-4">
             <div 
               onClick={() => frontRef.current?.click()}
               className={`flex-1 h-36 border-2 border-dashed ${frontFile ? 'border-primary/50' : 'border-white/10'} rounded-xl flex flex-col items-center justify-center bg-background/50 hover:border-primary/50 cursor-pointer transition-colors group`}
             >
                <span className={`text-sm font-medium transition-colors ${frontFile ? 'text-primary' : 'text-zinc-400 group-hover:text-primary'}`}>
                  {frontFile ? '✓ Front Selected' : '+ Front'}
                </span>
             </div>
             <div 
               onClick={() => backRef.current?.click()}
               className={`flex-1 h-36 border-2 border-dashed ${backFile ? 'border-primary/50' : 'border-white/10'} rounded-xl flex flex-col items-center justify-center bg-background/50 hover:border-primary/50 cursor-pointer transition-colors group`}
             >
                <span className={`text-sm font-medium transition-colors ${backFile ? 'text-primary' : 'text-zinc-400 group-hover:text-primary'}`}>
                  {backFile ? '✓ Back Selected' : '+ Back'}
                </span>
             </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-white font-semibold">2. Verification Selfie</h3>
          <p className="text-sm text-zinc-500">Take a clear selfie holding the same document next to your face.</p>
          <div 
             onClick={() => selfieRef.current?.click()}
             className={`w-full h-48 border-2 border-dashed ${selfieFile ? 'border-primary/50' : 'border-white/10'} rounded-xl flex flex-col items-center justify-center bg-background/50 hover:border-primary/50 cursor-pointer transition-colors group`}
          >
            <span className={`text-sm font-medium transition-colors ${selfieFile ? 'text-primary' : 'text-zinc-400 group-hover:text-primary'}`}>
              {selfieFile ? '✓ Selfie Selected' : '+ Upload Selfie'}
            </span>
          </div>
        </div>

        <button 
          onClick={handleSubmit} 
          disabled={loading || !frontFile || !backFile || !selfieFile}
          className="h-12 mt-2 rounded-lg bg-primary text-primary-foreground font-bold shadow-glow hover:bg-primary/90 hover:shadow-glow-lg transition-all w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit KYC for Approval'}
        </button>
      </div>
    </div>
  );
}
