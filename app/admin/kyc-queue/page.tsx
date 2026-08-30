export default function AdminKYC() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl">
      <div className="border-b border-red-500/20 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Fila de Moderação (KYC)</h1>
          <p className="text-red-400 text-sm mt-1">Aprovação de Identidade de Criadores</p>
        </div>
        <span className="px-3 py-1 bg-red-500/10 text-red-500 text-xs font-bold rounded-full border border-red-500/20">
          1 Pendente
        </span>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* Card KYC */}
        <div className="bg-card border border-red-500/10 rounded-xl p-6 flex flex-col md:flex-row gap-8">
           <div className="flex-1 flex flex-col gap-4">
              <div>
                <h3 className="text-white font-bold text-lg">Julia Silva</h3>
                <p className="text-zinc-400 text-sm">@julia_vip</p>
                <p className="text-zinc-500 text-xs mt-1">Enviado há 2 horas</p>
              </div>
              
              <div className="flex flex-wrap gap-4 mt-2">
                 <div className="w-40 h-24 bg-zinc-900 border border-white/5 rounded-md flex flex-col items-center justify-center text-xs text-zinc-600 font-medium">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                   Foto RG Frente
                 </div>
                 <div className="w-40 h-24 bg-zinc-900 border border-white/5 rounded-md flex flex-col items-center justify-center text-xs text-zinc-600 font-medium">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><circle cx="12" cy="12" r="10"></circle><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"></path><path d="M18.8 19.2a8 8 0 0 0-13.6 0"></path></svg>
                   Selfie c/ Doc
                 </div>
              </div>
           </div>
           
           <div className="flex md:flex-col gap-3 justify-center mt-4 md:mt-0">
              <button className="h-11 px-8 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-500 font-bold rounded-lg transition-colors text-sm shadow-sm">
                Aprovar Criador
              </button>
              <button className="h-11 px-8 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 font-bold rounded-lg transition-colors text-sm shadow-sm">
                Rejeitar Documentos
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}
