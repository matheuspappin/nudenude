'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const searchCreators = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      
      setIsSearching(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('role', 'creator')
        .ilike('username', `%${query}%`)
        .limit(5);
        
      if (!error && data) {
        setResults(data);
      }
      setIsSearching(false);
    };

    const debounceTimer = setTimeout(searchCreators, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, supabase]);

  const handleSelect = (username: string) => {
    setQuery('');
    setResults([]);
    router.push(`/${username}`);
  };

  return (
    <div className="relative w-full max-w-sm sm:ml-auto z-50">
      <div className="relative">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search creators (@name)..." 
          className="w-full h-10 bg-zinc-900/50 border border-white/10 rounded-full pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors"
        />
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-3 text-zinc-400">
          <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>

      {query.trim().length >= 2 && (
        <div className="absolute top-12 left-0 w-full bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col">
          {isSearching && (
            <div className="p-4 text-center text-xs text-zinc-500 font-medium">Searching...</div>
          )}
          
          {!isSearching && results.length === 0 && (
            <div className="p-4 text-center text-xs text-zinc-500 font-medium">No creators found.</div>
          )}

          {!isSearching && results.map((creator) => (
            <button 
              key={creator.id}
              onClick={() => handleSelect(creator.username)}
              className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
            >
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-400">
                {creator.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white leading-tight">@{creator.username}</span>
                {creator.display_name && <span className="text-xs text-zinc-500 leading-tight">{creator.display_name}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
