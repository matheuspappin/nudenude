'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

type Tier = {
  id: string;
  name: string;
  price: number;
  description: string;
  status: string;
};

export default function ManageTiers() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function fetchTiers() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);
      
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('creator_id', session.user.id)
        .order('price', { ascending: true });
        
      if (!error && data) {
        setTiers(data);
      }
      setIsLoading(false);
    }
    fetchTiers();
  }, [supabase]);

  const handleOpenModal = (tier?: Tier) => {
    if (tier) {
      setEditingTierId(tier.id);
      setName(tier.name);
      setPrice(tier.price.toString());
      setDescription(tier.description || '');
    } else {
      setEditingTierId(null);
      setName('');
      setPrice('');
      setDescription('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTierId(null);
  };

  const handleSaveTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      alert("Por favor, insira um valor válido maior que zero.");
      return;
    }

    setIsSaving(true);
    
    const tierData = {
      creator_id: userId,
      name,
      price: parsedPrice,
      description,
      status: 'active'
    };

    if (editingTierId) {
      // Update
      const { error } = await supabase
        .from('subscription_tiers')
        .update(tierData)
        .eq('id', editingTierId);
        
      if (!error) {
        setTiers(tiers.map(t => t.id === editingTierId ? { ...t, ...tierData } as Tier : t));
        handleCloseModal();
      } else {
        alert("Erro ao atualizar: " + error.message);
      }
    } else {
      // Insert
      const { data, error } = await supabase
        .from('subscription_tiers')
        .insert(tierData)
        .select()
        .single();
        
      if (!error && data) {
        setTiers([...tiers, data]);
        handleCloseModal();
      } else if (error) {
        alert("Erro ao criar: " + error.message);
      }
    }
    setIsSaving(false);
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    // Check if this is the last active tier
    if (newStatus === 'inactive') {
      const activeTiers = tiers.filter(t => t.status === 'active');
      if (activeTiers.length <= 1) {
        alert("Você precisa ter pelo menos um plano ativo.");
        return;
      }
    }

    const { error } = await supabase
      .from('subscription_tiers')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setTiers(tiers.map(t => t.id === id ? { ...t, status: newStatus } : t));
    }
  };

  if (isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
           <h1 className="text-2xl font-bold text-white tracking-tight">Meus Planos VIP</h1>
           <p className="text-sm text-muted-foreground mt-1">Gerencie os diferentes níveis de assinatura para seus fãs.</p>
         </div>
         <button onClick={() => handleOpenModal()} className="h-10 px-5 rounded-lg bg-primary text-primary-foreground font-bold shadow-glow hover:bg-primary/90 transition-colors">
           + Novo Plano
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <div key={tier.id} className={`bg-card border ${tier.status === 'active' ? 'border-primary/30 hover:border-primary/60' : 'border-white/10 opacity-70'} rounded-xl p-6 shadow-sm relative flex flex-col transition-all`}>
             <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-bl-lg border-b border-l ${tier.status === 'active' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-white/5 text-zinc-500 border-white/10'}`}>
               {tier.status === 'active' ? 'Ativo' : 'Inativo'}
             </div>
             
             <h3 className="text-xl font-bold text-white tracking-tight">{tier.name}</h3>
             
             <div className="flex items-end mt-4">
               <p className="text-4xl font-black text-white tracking-tighter">${tier.price}</p>
               <span className="text-sm text-zinc-500 font-bold mb-1 ml-1 uppercase tracking-widest">/ mês</span>
             </div>
             
             <p className="text-sm text-zinc-400 mt-4 leading-relaxed flex-1">
                {tier.description || 'Sem descrição.'}
             </p>
             
             <div className="flex gap-2 mt-6 pt-4 border-t border-white/5">
                <button onClick={() => handleOpenModal(tier)} className="flex-1 py-2.5 rounded-lg bg-background border border-white/10 text-sm font-bold text-white hover:bg-white/5 transition-colors">Editar</button>
                <button onClick={() => handleToggleStatus(tier.id, tier.status)} className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${tier.status === 'active' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}`}>
                  {tier.status === 'active' ? 'Desativar' : 'Ativar'}
                </button>
             </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
           <div className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-6 animate-in zoom-in-95 duration-200">
             <div>
               <h2 className="text-xl font-bold text-white">{editingTierId ? 'Editar Plano' : 'Novo Plano VIP'}</h2>
               <p className="text-sm text-zinc-500 mt-1">Defina o nome, valor e os benefícios oferecidos.</p>
             </div>

             <form onSubmit={handleSaveTier} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Nome do Plano</label>
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Premium VIP" className="h-11 bg-background border border-white/10 rounded-lg px-4 text-white focus:border-primary/50 outline-none" />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Valor Mensal (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
                    <input required type="number" step="0.01" min="0.99" value={price} onChange={e => setPrice(e.target.value)} placeholder="9.99" className="w-full h-11 bg-background border border-white/10 rounded-lg pl-8 pr-4 text-white focus:border-primary/50 outline-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Benefícios (Descrição)</label>
                  <textarea required value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva o que o assinante recebe..." className="min-h-[100px] bg-background border border-white/10 rounded-lg p-4 text-sm text-white focus:border-primary/50 outline-none resize-none" />
                </div>

                <div className="flex gap-3 mt-4 pt-4 border-t border-white/5">
                  <button type="button" onClick={handleCloseModal} className="flex-1 py-3 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors">Cancelar</button>
                  <button type="submit" disabled={isSaving} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-glow hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {isSaving ? 'Salvando...' : 'Salvar Plano'}
                  </button>
                </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
}
