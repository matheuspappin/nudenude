'use client';

export default function KYCVerification() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Identity Verification (KYC)</h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          To receive payouts via High-Risk gateways (like CCBill or Segpay) legally, verifying your official document is mandatory.
        </p>
      </div>

      <div className="bg-card border border-white/10 rounded-xl p-6 shadow-sm flex flex-col gap-8">
        
        {/* Status Tracker */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
           <span className="text-sm font-medium">Your registration is pending submission. Upload the photos below for review.</span>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-white font-semibold">1. Official ID Document (ID, Driver's License, Passport)</h3>
          <div className="flex gap-4">
             <div className="flex-1 h-36 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center bg-background/50 hover:border-primary/50 cursor-pointer transition-colors group">
                <span className="text-sm text-zinc-400 font-medium group-hover:text-primary transition-colors">+ Front</span>
             </div>
             <div className="flex-1 h-36 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center bg-background/50 hover:border-primary/50 cursor-pointer transition-colors group">
                <span className="text-sm text-zinc-400 font-medium group-hover:text-primary transition-colors">+ Back</span>
             </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-white font-semibold">2. Verification Selfie</h3>
          <p className="text-sm text-zinc-500">Take a clear selfie holding the same document next to your face.</p>
          <div className="w-full h-48 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center bg-background/50 hover:border-primary/50 cursor-pointer transition-colors group">
            <span className="text-sm text-zinc-400 font-medium group-hover:text-primary transition-colors">+ Upload Selfie</span>
          </div>
        </div>

        <button className="h-12 mt-2 rounded-lg bg-primary text-primary-foreground font-bold shadow-glow hover:bg-primary/90 hover:shadow-glow-lg transition-all w-full">
          Submit KYC for Approval
        </button>
      </div>
    </div>
  );
}
