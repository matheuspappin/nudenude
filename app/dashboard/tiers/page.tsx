'use client';

export default function ManageTiers() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
         <div>
           <h1 className="text-2xl font-bold text-white tracking-tight">Meus Planos VIP</h1>
           <p className="text-sm text-muted-foreground mt-1">Defina o valor da sua assinatura mensal.</p>
         </div>
         <button className="h-10 px-5 rounded-lg bg-primary text-primary-foreground font-semibold shadow-glow hover:bg-primary/90 hover:shadow-glow-lg transition-all">
           + Novo Plano
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-primary/30 rounded-xl p-6 shadow-sm relative overflow-hidden group hover:border-primary/60 transition-colors">
           {/* Badge de ativo */}
           <div className="absolute top-0 right-0 bg-primary/10 text-primary px-3 py-1 text-xs font-bold rounded-bl-lg border-b border-l border-primary/20">
             ATIVO
           </div>
           
           <h3 className="text-xl font-bold text-white tracking-tight">VIP Acesso Total</h3>
           <div className="flex items-end mt-4">
             <p className="text-4xl font-bold text-white tracking-tighter">$9.99</p>
             <span className="text-sm text-zinc-500 font-medium mb-1 ml-1">/ mês</span>
           </div>
           
           <p className="text-sm text-zinc-400 mt-4 leading-relaxed h-16">
              Acesso a todo o meu acervo de vídeos bloqueados, conteúdos diários e prioridade nas DMs.
           </p>
           
           <div className="flex gap-3 mt-6">
             <button className="flex-1 py-2.5 rounded-lg bg-background border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors">Editar Valor</button>
             <button className="px-4 py-2.5 rounded-lg bg-red-500/10 text-red-500 text-sm font-medium hover:bg-red-500/20 transition-colors">Desativar</button>
           </div>
        </div>
      </div>
    </div>
  );
}
