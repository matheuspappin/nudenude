'use client';
import { useState, useEffect } from 'react';
import Feed, { Post } from '@/components/Feed';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

type Tier = {
  id: string;
  name: string;
  price: number;
  status: string;
};

type PpvOverride = {
  tier_id: string;
  free: boolean;
};

export default function CreatorStudio() {
  const [caption, setCaption] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaInput, setMediaInput] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Collections
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [newCollectionName, setNewCollectionName] = useState('');
  
  // Labels (Etiquetas)
  const [label, setLabel] = useState('');
  const [existingLabels, setExistingLabels] = useState<string[]>([]);
  
  // Tiers (Visibilidade)
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [selectedTierIds, setSelectedTierIds] = useState<string[]>([]);
  
  // PPV overrides per tier
  const [ppvOverrides, setPpvOverrides] = useState<PpvOverride[]>([]);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      // Fetch collections
      const { data: colData } = await supabase
        .from('post_collections')
        .select('*')
        .eq('creator_id', session.user.id)
        .order('created_at', { ascending: false });
      if (colData) setCollections(colData);
      
      // Fetch existing labels from posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('label')
        .eq('creator_id', session.user.id)
        .not('label', 'is', null);
      
      if (postsData) {
        const labels = Array.from(new Set(postsData.map(p => p.label).filter(Boolean)));
        setExistingLabels(labels);
      }
      
      // Fetch active tiers
      const { data: tiersData } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('creator_id', session.user.id)
        .eq('status', 'active')
        .order('price', { ascending: true });
      
      if (tiersData) {
        setTiers(tiersData);
        // Initialize PPV overrides with all tiers set to free=true by default
        setPpvOverrides(tiersData.map(t => ({ tier_id: t.id, free: true })));
      }
    }
    fetchData();
  }, [supabase]);

  const draftPost: Post = {
    id: 'draft',
    creator_id: 'me',
    creator_name: 'Você (Prévia)',
    post_text: caption || 'Escreva algo na legenda para ver a prévia...',
    media_urls: mediaUrls,
    is_unlocked: !isLocked,
    price: isLocked && price ? parseFloat(price) : 0
  };

  const handleAddMedia = () => {
    if (mediaInput.trim()) {
      setMediaUrls([...mediaUrls, mediaInput.trim()]);
      setMediaInput('');
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
  };

  const toggleTierSelection = (tierId: string) => {
    setSelectedTierIds(prev => 
      prev.includes(tierId) 
        ? prev.filter(id => id !== tierId) 
        : [...prev, tierId]
    );
  };

  const togglePpvOverride = (tierId: string) => {
    setPpvOverrides(prev => 
      prev.map(o => o.tier_id === tierId ? { ...o, free: !o.free } : o)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim() && mediaUrls.length === 0) return;

    setIsSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      let finalCollectionId = selectedCollectionId || null;

      // If user typed a new collection name, create it first
      if (newCollectionName.trim()) {
        const { data: newColl, error: collError } = await supabase
          .from('post_collections')
          .insert({ creator_id: session.user.id, name: newCollectionName.trim() })
          .select()
          .single();
          
        if (collError) {
          alert('Erro ao criar coleção: ' + collError.message);
          setIsSubmitting(false);
          return;
        }
        if (newColl) {
          finalCollectionId = newColl.id;
          setCollections([newColl, ...collections]);
        }
      }

      const { error } = await supabase
        .from('posts')
        .insert({
          creator_id: session.user.id,
          post_text: caption,
          media_urls: mediaUrls.length > 0 ? mediaUrls : null,
          is_locked: isLocked,
          price: isLocked && price ? parseFloat(price) : 0,
          collection_id: finalCollectionId,
          label: label.trim() || null,
          visible_tier_ids: selectedTierIds.length > 0 ? selectedTierIds : null,
          ppv_tier_overrides: isLocked && price && parseFloat(price) > 0 ? ppvOverrides : '[]'
        });

      if (!error) {
        alert('Postado com sucesso!');
        setCaption('');
        setMediaUrls([]);
        setIsLocked(false);
        setPrice('');
        setNewCollectionName('');
        setSelectedCollectionId('');
        setLabel('');
        setSelectedTierIds([]);
        // Add new label to existing labels if it's new
        if (label.trim() && !existingLabels.includes(label.trim())) {
          setExistingLabels([...existingLabels, label.trim()]);
        }
      } else {
        alert('Erro ao postar: ' + error.message);
      }
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full">
      {/* COLUNA ESQUERDA: EDITOR */}
      <div className="flex-1 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Criar Nova Postagem</h1>
          <p className="text-zinc-500 text-sm mt-1">Publique conteúdos, defina etiquetas e controle quem tem acesso.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-white/10 rounded-xl p-6 shadow-sm flex flex-col gap-5">
          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Legenda do Post</label>
            <textarea 
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="O que você quer compartilhar hoje?" 
              className="w-full min-h-[120px] bg-background border border-white/10 rounded-lg p-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 resize-y"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Mídias (Fotos/Vídeos)</label>
            
            {/* Lista de mídias anexadas (Pack) */}
            {mediaUrls.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {mediaUrls.map((url, i) => (
                  <div key={i} className="relative w-24 h-24 flex-shrink-0 rounded-lg border border-white/10 overflow-hidden group">
                    {url.includes('.mp4') ? (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">VIDEO</div>
                    ) : (
                      <img src={url} alt="Media" className="w-full h-full object-cover" />
                    )}
                    <button type="button" onClick={() => handleRemoveMedia(i)} className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input 
                type="text" 
                value={mediaInput}
                onChange={e => setMediaInput(e.target.value)}
                placeholder="Cole a URL da imagem ou vídeo (.mp4)" 
                className="flex-1 h-10 bg-background border border-white/10 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
              />
              <button type="button" onClick={handleAddMedia} className="px-4 h-10 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-colors">
                Anexar
              </button>
            </div>
          </div>

          {/* ETIQUETA / LABEL */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              🏷️ Etiqueta (aparece como aba no perfil público)
            </label>
            <div className="flex flex-col gap-2">
              {existingLabels.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {existingLabels.map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLabel(label === l ? '' : l)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        label === l
                          ? 'border-primary/50 bg-primary/10 text-primary'
                          : 'border-white/10 text-zinc-400 hover:bg-white/5'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              )}
              <input 
                type="text" 
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="Ex: Heels, Freestyle, Behind The Scenes, Tutoriais" 
                className="h-10 bg-background border border-white/10 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-primary/50"
              />
              <p className="text-[10px] text-zinc-500">Esta etiqueta será uma aba no seu perfil público. Clientes poderão filtrar por ela.</p>
            </div>
          </div>

          {/* COLEÇÃO / SÉRIE */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Local da Postagem (Série / Coleção)</label>
            <div className="flex flex-col gap-2">
              <select 
                value={selectedCollectionId} 
                onChange={e => {
                  setSelectedCollectionId(e.target.value);
                  if (e.target.value !== 'new') setNewCollectionName('');
                }}
                className="h-11 bg-background border border-white/10 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-primary/50"
              >
                <option value="">Exclusive Feed (Geral)</option>
                {collections.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value="new">+ Criar nova pasta/série...</option>
              </select>
              
              {selectedCollectionId === 'new' && (
                <input 
                  type="text" 
                  value={newCollectionName}
                  onChange={e => setNewCollectionName(e.target.value)}
                  placeholder="Nome do local (ex: Masterclass 1)" 
                  className="h-11 bg-background border border-white/10 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-primary/50"
                  required
                />
              )}
            </div>
          </div>

          {/* VISIBILIDADE POR TIER */}
          {tiers.length > 0 && (
            <div className="flex flex-col gap-3 p-4 bg-white/[0.02] rounded-xl border border-white/5">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                🔒 Visibilidade por Plano VIP
              </label>
              <p className="text-[10px] text-zinc-500 -mt-1">Marque quais planos podem ver este conteúdo. Se nenhum for selecionado, todos os assinantes poderão ver.</p>
              <div className="flex flex-wrap gap-2">
                {tiers.map(tier => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => toggleTierSelection(tier.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border flex items-center gap-2 transition-all ${
                      selectedTierIds.includes(tier.id)
                        ? 'border-primary/50 bg-primary/10 text-primary'
                        : 'border-white/10 text-zinc-400 hover:bg-white/5'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                      selectedTierIds.includes(tier.id) ? 'border-primary bg-primary text-white' : 'border-white/20'
                    }`}>
                      {selectedTierIds.includes(tier.id) && '✓'}
                    </span>
                    {tier.name} (${tier.price}/mês)
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PAYWALL & PPV */}
          <div className="pt-4 border-t border-white/5 flex flex-col gap-4">
             <div className="flex items-center gap-3">
               <input 
                 type="checkbox" 
                 id="lockPost"
                 checked={isLocked}
                 onChange={e => {
                   setIsLocked(e.target.checked);
                   if (!e.target.checked) setPrice('');
                 }}
                 className="w-4 h-4 rounded bg-background border-white/10 text-primary focus:ring-primary/50" 
               />
               <label htmlFor="lockPost" className="text-sm text-zinc-300 font-medium cursor-pointer">
                 Trancar para não-assinantes (Paywall)
               </label>
             </div>

             {isLocked && (
               <div className="flex flex-col gap-4 pl-7 animate-in fade-in slide-in-from-top-2 duration-200">
                 <div className="flex flex-col gap-2">
                   <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Preço de Desbloqueio (PPV)</label>
                   <div className="relative w-48">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                     <input 
                       type="number" step="0.01" min="0"
                       value={price}
                       onChange={e => setPrice(e.target.value)}
                       className="h-11 w-full rounded-lg bg-background border border-white/10 pl-8 pr-4 text-white text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none"
                       placeholder="0.00 (Grátis para VIPs)" 
                     />
                   </div>
                   <p className="text-[10px] text-zinc-500">Deixe zerado para disponibilizar grátis aos seus assinantes VIP. Defina um valor para vender como Pack avulso.</p>
                 </div>

                 {/* PPV GRANULAR POR TIER */}
                 {price && parseFloat(price) > 0 && tiers.length > 0 && (
                   <div className="flex flex-col gap-2 p-3 bg-white/[0.02] rounded-xl border border-white/5 animate-in fade-in duration-200">
                     <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                       💎 Regras de PPV por Plano
                     </label>
                     <p className="text-[10px] text-zinc-500 -mt-1">Defina quais planos têm acesso gratuito a este conteúdo PPV e quais precisam pagar.</p>
                     <div className="flex flex-col gap-2 mt-1">
                       {tiers.map(tier => {
                         const override = ppvOverrides.find(o => o.tier_id === tier.id);
                         const isFree = override?.free ?? true;
                         return (
                           <div key={tier.id} className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-white/5">
                             <div className="flex items-center gap-2">
                               <span className="text-sm font-bold text-white">{tier.name}</span>
                               <span className="text-xs text-zinc-500">(${tier.price}/mês)</span>
                             </div>
                             <button
                               type="button"
                               onClick={() => togglePpvOverride(tier.id)}
                               className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest transition-all ${
                                 isFree
                                   ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                   : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                               }`}
                             >
                               {isFree ? '✓ Incluído' : `$ Cobrar $${price}`}
                             </button>
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 )}
               </div>
             )}
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || (!caption && mediaUrls.length === 0)}
            className="w-full mt-4 h-12 bg-primary text-primary-foreground font-bold rounded-lg shadow-glow hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Publicando...' : 'Publicar no Feed'}
          </button>
        </form>
      </div>

      {/* COLUNA DIREITA: LIVE PREVIEW */}
      <div className="w-full lg:w-[400px] flex-shrink-0 flex flex-col gap-4">
        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-2">Live Preview (Rascunho)</h2>
        
        <div className="pointer-events-none opacity-90 scale-95 origin-top">
           <Feed posts={[draftPost]} isCreatorView={true} />
        </div>
      </div>
    </div>
  );
}
