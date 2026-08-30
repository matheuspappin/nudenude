export default function AdminSupport() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl">
      <div className="border-b border-red-500/20 pb-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">Suporte & Tickets</h1>
        <p className="text-red-400 text-sm mt-1">Central de Atendimento e Resolução de Disputas</p>
      </div>

      <div className="bg-card border border-red-500/10 rounded-xl overflow-hidden shadow-sm">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-red-950/20 border-b border-red-500/10 text-xs font-bold text-red-400 uppercase tracking-widest">
                <th className="p-4">Ticket</th>
                <th className="p-4">Usuário</th>
                <th className="p-4">Assunto</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              
              <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 font-mono text-xs text-zinc-500">#TK-9021</td>
                <td className="p-4">
                  <p className="text-white font-bold">@isabella</p>
                  <p className="text-zinc-500 text-xs mt-0.5">Criador</p>
                </td>
                <td className="p-4 text-zinc-300 font-medium">Problema com Saque Internacional</td>
                <td className="p-4">
                  <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-500 text-xs font-bold rounded-md border border-yellow-500/20">Em Aberto</span>
                </td>
                <td className="p-4 text-right">
                  <button className="text-xs font-bold text-white bg-red-500/10 hover:bg-red-500/20 transition-colors border border-red-500/30 px-4 py-2 rounded-md">Tratar Chamado</button>
                </td>
              </tr>

              <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 font-mono text-xs text-zinc-500">#TK-8834</td>
                <td className="p-4">
                  <p className="text-white font-bold">@usuario_99</p>
                  <p className="text-zinc-500 text-xs mt-0.5">Consumidor</p>
                </td>
                <td className="p-4 text-zinc-300 font-medium">Cobrança duplicada no cartão</td>
                <td className="p-4">
                  <span className="px-2.5 py-1 bg-zinc-500/10 text-zinc-400 text-xs font-bold rounded-md border border-zinc-500/20">Resolvido</span>
                </td>
                <td className="p-4 text-right">
                  <button className="text-xs font-bold text-zinc-500 hover:text-white transition-colors border border-zinc-700 px-4 py-2 rounded-md">Ver Histórico</button>
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
