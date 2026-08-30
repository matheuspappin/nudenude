'use client';
import Link from 'next/link';

export default function BecomeCreatorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center max-w-2xl mx-auto px-4 mt-10">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20 shadow-glow">
         <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
      </div>
      
      <h1 className="text-4xl font-bold text-white tracking-tight mb-4">Monetize Your Audience</h1>
      <p className="text-zinc-400 mb-10 text-lg max-w-xl mx-auto">
        Join thousands of creators earning money with premium content. You keep 85% of everything you generate.
      </p>
      
      <div className="bg-card border border-white/10 rounded-2xl p-6 sm:p-8 w-full shadow-sm text-left mb-8">
         <h2 className="text-xl font-bold text-white mb-6 tracking-tight">Creator Registration</h2>
         
         <div className="flex flex-col gap-5 mb-6">
           <div className="flex flex-col gap-1.5">
             <label className="text-sm font-medium text-zinc-400">Professional E-mail</label>
             <input type="email" placeholder="contact@example.com" className="h-11 px-4 rounded-lg bg-background border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-colors" />
           </div>

           <div className="flex flex-col gap-1.5">
             <label className="text-sm font-medium text-zinc-400">Display Name</label>
             <input type="text" placeholder="What should we call you?" className="h-11 px-4 rounded-lg bg-background border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-colors" />
           </div>
           
           <div className="flex flex-col gap-1.5">
             <label className="text-sm font-medium text-zinc-400">Your Exclusive Link</label>
             <div className="flex items-center">
                <span className="h-11 px-4 bg-white/5 border border-r-0 border-white/10 rounded-l-lg flex items-center text-zinc-500 font-medium text-sm">nudenude.com/</span>
                <input type="text" placeholder="username" className="h-11 px-4 rounded-r-lg bg-background border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-colors w-full" />
             </div>
           </div>

           {/* Campos Necessários para KYC / Idade / LGPD */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <div className="flex flex-col gap-1.5">
               <label className="text-sm font-medium text-zinc-400">Date of Birth</label>
               <input type="date" className="h-11 px-4 rounded-lg bg-background border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-colors [color-scheme:dark]" />
             </div>
             
             <div className="flex flex-col gap-1.5">
               <label className="text-sm font-medium text-zinc-400">ID / Document Number</label>
               <input type="text" placeholder="000.000.000-00" maxLength={14} className="h-11 px-4 rounded-lg bg-background border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-colors" />
             </div>
           </div>
         </div>

         {/* Área de Conformidade Legal e LGPD */}
         <div className="flex flex-col gap-4 mb-8 p-5 bg-background/50 rounded-xl border border-white/5">
           <label className="flex items-start gap-3 cursor-pointer group">
             <div className="relative flex items-center justify-center mt-0.5 shrink-0">
               <input type="checkbox" className="peer appearance-none w-5 h-5 border border-white/20 rounded bg-background checked:bg-primary checked:border-primary transition-colors cursor-pointer" />
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="absolute text-background opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"><polyline points="20 6 9 17 4 12"></polyline></svg>
             </div>
             <span className="text-xs text-zinc-400 leading-relaxed font-medium group-hover:text-zinc-300 transition-colors">
               I declare that I am over 18 years old and have the legal capacity to produce and sell content on this platform.
             </span>
           </label>
           
           <label className="flex items-start gap-3 cursor-pointer group">
             <div className="relative flex items-center justify-center mt-0.5 shrink-0">
               <input type="checkbox" className="peer appearance-none w-5 h-5 border border-white/20 rounded bg-background checked:bg-primary checked:border-primary transition-colors cursor-pointer" />
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="absolute text-background opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"><polyline points="20 6 9 17 4 12"></polyline></svg>
             </div>
             <span className="text-xs text-zinc-400 leading-relaxed font-medium group-hover:text-zinc-300 transition-colors">
               <strong>Consent & Privacy Policy:</strong> I agree that the platform may collect and process my personal data (including future biometrics for KYC and bank details) strictly for identity verification and payout purposes.
             </span>
           </label>
         </div>
         
         {/* Botão simula a criação da conta e redireciona direto para o Dashboard */}
         {/* Lá no Dashboard, o sistema vai exigir que a pessoa faça o KYC antes de sacar */}
         <Link href="/dashboard" className="w-full flex items-center justify-center h-12 rounded-lg bg-primary text-primary-foreground font-bold shadow-glow hover:bg-primary/90 hover:shadow-glow-lg transition-all text-sm">
           Create Creator Account
         </Link>
      </div>
      
      <p className="text-xs text-zinc-500 font-medium">
        By continuing, you agree to our Terms of Service for Creators.
      </p>
    </div>
  );
}
