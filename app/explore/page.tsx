'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function ExplorePage() {
  const supabase = createClient();
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [searchLocation, setSearchLocation] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');

  useEffect(() => {
    fetchCreators();
  }, [selectedStyle, searchLocation, selectedLevel]);

  const fetchCreators = async () => {
    setLoading(true);
    let query = supabase
      .from('profiles')
      .select('id, username, display_name, location, dance_styles, gamification_points, total_sales, preview_video_url')
      .eq('is_creator', true)
      .order('gamification_points', { ascending: false, nullsFirst: false });
      
    if (selectedStyle) {
      // Postgres array contains operator
      query = query.contains('dance_styles', [selectedStyle]);
    }
    
    if (searchLocation) {
      query = query.ilike('location', `%${searchLocation}%`);
    }

    if (selectedLevel) {
      query = query.eq('teaching_level', selectedLevel);
    }

    const { data, error } = await query;
    if (!error && data) {
      setCreators(data);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto py-10 px-4 w-full animate-in fade-in duration-500">
      {/* Sidebar Filters */}
      <div className="w-full lg:w-64 flex flex-col gap-6 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Explore Creators</h2>
          <p className="text-zinc-400 text-sm">Find your next instructor by style or city.</p>
        </div>

        <div className="bg-card border border-white/10 rounded-xl p-5 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-white">Location</label>
            <input 
              type="text" 
              placeholder="e.g. São Paulo" 
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="h-10 rounded-lg bg-background border border-white/10 px-3 text-white text-sm focus:border-primary/50 outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-white">Dance Style</label>
            <input 
              type="text" 
              placeholder="e.g. Hip Hop, Heels..." 
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="h-10 rounded-lg bg-background border border-white/10 px-3 text-white text-sm focus:border-primary/50 outline-none"
            />
            <p className="text-xs text-zinc-500">Search by any style tag.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-white">Difficulty Level</label>
            <select 
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="h-10 rounded-lg bg-background border border-white/10 px-3 text-white text-sm focus:border-primary/50 outline-none"
            >
              <option value="">All Levels</option>
              <option value="Beginner">Beginner (Zero to Hero)</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced (Pro/Choreo)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 className="text-lg font-medium text-zinc-300">
            {loading ? 'Searching...' : `Found ${creators.length} creators`}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Sort By</span>
            <select className="bg-transparent text-white text-sm font-bold outline-none cursor-pointer">
              <option>Community Points</option>
              <option>Total Sales</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="w-full flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {creators.map((creator, index) => (
              <Link href={`/${creator.username}`} key={creator.id} className="bg-card border border-white/10 rounded-xl overflow-hidden hover:border-primary/50 transition-colors group flex flex-col">
                <div className="h-56 bg-zinc-900 relative flex items-center justify-center overflow-hidden">
                  
                  {/* HOVER VIDEO PREVIEW (Choreo Preview Card) */}
                  {creator.preview_video_url ? (
                    <>
                       <div className="absolute inset-0 bg-black z-0" />
                       <video 
                         src={creator.preview_video_url} 
                         className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                         autoPlay muted loop playsInline
                       />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />

                  {/* Banner Mock */}
                  <div className="absolute -bottom-6 left-6 w-16 h-16 rounded-xl border-4 border-card bg-zinc-800 flex items-center justify-center text-2xl font-black text-white shadow-xl group-hover:scale-105 transition-transform z-20">
                    {creator.display_name?.charAt(0) || creator.username.charAt(0).toUpperCase()}
                  </div>
                  {index < 3 && !selectedStyle && !searchLocation && (
                    <div className="absolute top-4 right-4 bg-amber-500 text-amber-950 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full shadow-lg z-20">
                      Top #{index + 1}
                    </div>
                  )}
                </div>
                
                <div className="pt-12 px-6 pb-6 flex flex-col gap-2">
                  <div>
                    <h4 className="text-lg font-bold text-white leading-tight">{creator.display_name || creator.username}</h4>
                    <p className="text-sm text-zinc-500">@{creator.username}</p>
                  </div>
                  
                  {creator.location && (
                    <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      {creator.location}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1 mt-2">
                    {creator.dance_styles?.slice(0, 3).map((style: string) => (
                      <span key={style} className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-md">
                        {style}
                      </span>
                    ))}
                    {creator.dance_styles?.length > 3 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-white/5 px-2 py-1 rounded-md">
                        +{creator.dance_styles.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-medium text-zinc-500">
                    <span className="flex items-center gap-1">
                      <span className="text-amber-500">★</span> {creator.gamification_points || 0} pts
                    </span>
                    <span className="flex items-center gap-1">
                       {creator.total_sales > 100 ? '💎 Bestseller' : `${creator.total_sales || 0} sales`}
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {creators.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                <span className="text-4xl mb-4">🕵️‍♀️</span>
                <h4 className="text-lg font-bold text-white mb-2">No creators found</h4>
                <p className="text-sm text-zinc-500 max-w-sm">Try adjusting your filters to find choreographers in other locations or styles.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
