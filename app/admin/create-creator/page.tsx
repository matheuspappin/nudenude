'use client';
import React from 'react';

export default function AdminCreateCreator() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl">
      <div className="border-b border-red-500/20 pb-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">Onboarding Manual (VIP)</h1>
        <p className="text-red-400 text-sm mt-1">Gere contas de criador ignorando a fila pública e ajustando taxas.</p>
      </div>

      <div className="bg-card border border-red-500/10 rounded-2xl p-6 sm:p-8 shadow-sm">
        
        <form className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-zinc-300">E-mail do Criador</label>
              <input type="email" placeholder="email@agencia.com" className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-zinc-300">Senha Temporária</label>
              <input type="text" defaultValue="MudeIsso123" className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50" />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-zinc-300">Nome de Exibição / Artístico</label>
              <input type="text" placeholder="Nome Artístico" className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50" />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-zinc-300">Link Personalizado (@username)</label>
              <div className="flex items-center">
                 <span className="h-11 px-4 bg-white/5 border border-r-0 border-white/10 rounded-l-lg flex items-center text-zinc-500 font-medium text-sm">/</span>
                 <input type="text" placeholder="username" className="h-11 px-4 rounded-r-lg bg-background border border-white/10 text-white focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 w-full" />
              </div>
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-bold text-red-400">Taxa de Retenção da Plataforma (%)</label>
              <input type="number" defaultValue="15" className="h-11 rounded-lg bg-red-950/20 border border-red-500/30 px-4 text-red-400 font-bold focus:outline-none focus:border-red-500/80 focus:ring-1 focus:ring-red-500/80" />
              <p className="text-xs text-zinc-500 mt-1">Dica: Reduza a taxa (Ex: 10%) para negociar com criadores muito famosos.</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 mt-4 p-4 bg-red-950/10 rounded-lg border border-red-500/10">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-red-500 cursor-pointer" />
              <span className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">Aprovar KYC Automaticamente (Bypass)</span>
            </label>
            <p className="text-xs text-zinc-500 ml-8">Ao marcar isso, o criador não precisará enviar documentos na fila de KYC. Use apenas para agenciamentos de confiança.</p>
          </div>

          <div className="flex justify-end mt-4">
             <button type="button" className="h-12 px-8 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-glow transition-all">
               Criar Conta e Enviar Credenciais
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
