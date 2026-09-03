'use client';

import React, { useEffect, useState, useRef } from 'react';

interface CustomVideoPlayerProps {
  lessonId: string;
  userId: string;
}

export default function CustomVideoPlayer({ lessonId, userId }: CustomVideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function fetchSignedUrl() {
      try {
        const res = await fetch('/api/videos/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, lessonId }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to fetch video');
        }

        const data = await res.json();
        setVideoUrl(data.signedUrl);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSignedUrl();
  }, [lessonId, userId]);

  // Prevenir clique direito para dificultar o download da URL assinada (embora expire rápido)
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-64 bg-gray-900 rounded-lg text-white">
        <p>Carregando vídeo protegido...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-64 bg-gray-900 rounded-lg text-red-500">
        <p>Erro ao carregar vídeo:</p>
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-lg overflow-hidden bg-black shadow-lg">
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          controlsList="nodownload" // Remove o botão nativo de download no Chrome/Edge
          onContextMenu={handleContextMenu}
          className="w-full h-auto"
          autoPlay={false}
        >
          Seu navegador não suporta a tag de vídeo.
        </video>
      ) : (
        <div className="flex items-center justify-center w-full h-64 text-white">
          <p>Vídeo indisponível</p>
        </div>
      )}
    </div>
  );
}
