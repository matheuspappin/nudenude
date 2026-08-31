'use client';
import React, { useState } from 'react';
import VideoPlayer from './VideoPlayer';

const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
const UnlockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>;
const MoreHorizontalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>;
const ChevronLeft = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>;
const ChevronRight = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;

export type Post = {
  id: string;
  creator_id: string;
  creator_name: string;
  post_text: string;
  media_urls: string[]; 
  is_unlocked: boolean;
  price?: number;
};

type FeedProps = {
  isCreatorView?: boolean;
  posts: Post[];
  isSubscribed?: boolean;
};

function PostCarousel({ urls, effectivelyUnlocked, price }: { urls: string[], effectivelyUnlocked: boolean, price?: number }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!urls || urls.length === 0) return null;

  const handlePrev = () => setCurrentIndex(prev => prev > 0 ? prev - 1 : urls.length - 1);
  const handleNext = () => setCurrentIndex(prev => prev < urls.length - 1 ? prev + 1 : 0);

  const renderMedia = (url: string) => {
    // Para simplificar, se tiver extensões de vídeo renderiza VideoPlayer, se não, assume imagem
    if (url.includes('.mp4') || url.includes('.m3u8') || url.includes('.mov')) {
      return <VideoPlayer src={url} />;
    }
    return <img src={url} alt="Media" className="w-full h-full object-cover rounded-lg" />;
  };

  return (
    <div className="relative w-full rounded-lg overflow-hidden mt-1 border border-white/10 group select-none bg-zinc-950 min-h-[300px]">
      {/* Mídia Atual */}
      <div className="w-full h-full flex items-center justify-center relative">
        {effectivelyUnlocked ? (
          renderMedia(urls[currentIndex])
        ) : (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xl z-10 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mb-6 text-primary shadow-glow">
              <LockIcon />
            </div>
            <h4 className="text-zinc-100 font-bold text-xl mb-2 tracking-tight">Locked Content</h4>
            <p className="text-muted-foreground text-sm mb-8 max-w-[250px]">
              {price && price > 0 
                ? `This is an exclusive PPV pack (${urls.length} media).` 
                : `Subscribe to VIP to unlock this pack (${urls.length} media).`}
            </p>
            <button className="h-11 px-8 rounded-md bg-primary text-primary-foreground font-bold shadow-glow hover:bg-primary/90 hover:shadow-glow-lg transition-all duration-300 w-full sm:w-auto">
              {price && price > 0 ? `Unlock for $${price.toFixed(2)}` : 'Unlock VIP ($9.99)'}
            </button>
          </div>
        )}
      </div>

      {/* Controles do Carrossel */}
      {urls.length > 1 && (
        <>
          <button onClick={handlePrev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white backdrop-blur-sm transition-all z-20">
            <ChevronLeft />
          </button>
          <button onClick={handleNext} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white backdrop-blur-sm transition-all z-20">
            <ChevronRight />
          </button>

          {/* Indicadores de Pontos (Dots) */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {urls.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentIndex ? 'w-4 bg-primary shadow-glow' : 'w-1.5 bg-white/30'}`} />
            ))}
          </div>
          
          {/* Badge de Combos (Pack) no topo direito */}
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white z-20 tracking-widest border border-white/10 uppercase">
            {currentIndex + 1} / {urls.length}
          </div>
        </>
      )}
    </div>
  );
}

export default function Feed({ isCreatorView = false, posts, isSubscribed = true }: FeedProps) {
  if (!posts || posts.length === 0) {
    return (
      <div className="w-full py-12 text-center text-zinc-500 font-medium bg-card border border-white/5 rounded-xl">
        No posts found.
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-8 pb-20">
      {posts.map((post) => {
        const effectivelyUnlocked = isCreatorView || post.is_unlocked;
        
        return (
        <article key={post.id} className="bg-card border border-white/5 rounded-xl p-5 flex flex-col gap-4 shadow-sm transition-all hover:border-white/10">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-bold text-zinc-400">
                {post.creator_name.charAt(0)}
              </div>
              <div>
                <h3 className="text-zinc-100 font-bold text-sm tracking-tight">{post.creator_name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {effectivelyUnlocked ? (
                <div className="text-primary"><UnlockIcon /></div>
              ) : (
                <div className="text-zinc-500"><LockIcon /></div>
              )}
              
              {/* Botão extra disponível apenas para o Criador */}
              {isCreatorView && (
                <button className="text-zinc-500 hover:text-white transition-colors" title="Edit Post">
                  <MoreHorizontalIcon />
                </button>
              )}
            </div>
          </div>

          <p className="text-sm text-zinc-200 leading-relaxed font-medium">{post.post_text}</p>

          <PostCarousel urls={post.media_urls || []} effectivelyUnlocked={effectivelyUnlocked} price={post.price} />
        </article>
      )})}
    </div>
  );
}
