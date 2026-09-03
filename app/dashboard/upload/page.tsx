'use client';
import { useState, useEffect } from 'react';
import Feed, { Post } from '@/components/Feed';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function CreatorStudio() {
  const [caption, setCaption] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaInput, setMediaInput] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [newCollectionName, setNewCollectionName] = useState('');
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchCollections() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from('post_collections').select('*').eq('creator_id', session.user.id).order('created_at', { ascending: false });
      if (data) setCollections(data);
    }
    fetchCollections();
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
          collection_id: finalCollectionId
        });

      if (!error) {
        alert('Postado com sucesso!');
        setCaption('');
        setMediaUrls([]);
        setIsLocked(false);
        setPrice('');
        setNewCollectionName('');
        setSelectedCollectionId('');
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
          <p className="text-zinc-500 text-sm mt-1">Publique conteúdos ou crie Packs exclusivos.</p>
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

            {/* Input para adicionar nova mídia (Mockando upload real por URL por enquanto) */}
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
                <option value="">Feed Principal Geral</option>
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
            <p className="text-[10px] text-zinc-500 mt-1">Organize seus vídeos em pastas para facilitar a navegação no seu perfil.</p>
          </div>

          <div className="pt-4 border-t border-white/5 flex flex-col gap-4">
             <div className="flex items-center gap-3">
               <input 
                 type="checkbox" 
                 id="lockPost"
                 checked={isLocked}
                 onChange={e => {
                   setIsLocked(e.target.checked);
                   if (!e.target.checked) setPrice(''); // Reset price if unlocked
                 }}
                 className="w-4 h-4 rounded bg-background border-white/10 text-primary focus:ring-primary/50" 
               />
               <label htmlFor="lockPost" className="text-sm text-zinc-300 font-medium cursor-pointer">
                 Trancar para não-assinantes (Paywall)
               </label>
             </div>

             {isLocked && (
               <div className="flex flex-col gap-2 pl-7 animate-in fade-in slide-in-from-top-2 duration-200">
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
                 <p className="text-[10px] text-zinc-500">Deixe zerado para disponibilizar grátis aos seus assinantes VIP mensais. Defina um valor para vender como Pack avulso.</p>
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
        
        {/* Usamos o próprio componente Feed para garantir 100% de fidelidade visual */}
        {/* Passamos isCreatorView=true para que o dono sempre consiga ver o preview, 
            mesmo se marcar como "Locked" */}
        <div className="pointer-events-none opacity-90 scale-95 origin-top">
           <Feed posts={[draftPost]} isCreatorView={true} />
        </div>
      </div>
    </div>
  );
}
