'use client';

import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  src: string; // URL da CDN, ex: https://cdn.dancecreator.com/creator_123/post_456/video.m3u8
  poster?: string;
}

export default function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // FASE 4.3: HLS.js é essencial para Chrome/Edge/Firefox que não suportam HLS nativo.
    if (Hls.isSupported()) {
      const hls = new Hls({
        // CRÍTICO: Exigimos o envio do cookie 'cf_media_auth' (criado na Fase 3)
        // para que o Worker da Cloudflare valide e libere o acesso aos blocos .ts
        xhrSetup: (xhr) => {
          xhr.withCredentials = true; 
        }
      });
      
      hls.loadSource(src);
      hls.attachMedia(video);
      
      return () => hls.destroy();
    } 
    // Safari e iOS suportam nativamente o HLS
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    }
  }, [src]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-white/10 shadow-lg group">
      <video
        ref={videoRef}
        poster={poster}
        controls
        className="w-full h-full object-cover"
        // crossOrigin garante que cookies sejam anexados no Safari
        crossOrigin="use-credentials" 
      />
    </div>
  );
}
