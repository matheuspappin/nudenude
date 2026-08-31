'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          username,
          date_of_birth: dateOfBirth,
        }
      }
    });

    setIsLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    // Após cadastro, envia para a home (onde fica o feed/conteúdo do usuário)
    router.push('/');
  };

  const handleGoogleSignup = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center w-full px-4">
      <div className="w-full max-w-md p-8 bg-card border border-white/10 rounded-2xl shadow-2xl flex flex-col items-center">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Create Account</h1>
        <p className="text-muted-foreground text-sm mb-6 text-center">
          Join <span className="font-medium text-zinc-300">NudeNude</span> to enjoy premium content from your favorite creators.
        </p>

        {error && (
          <div className="w-full p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form className="w-full flex flex-col gap-5" onSubmit={handleSignup}>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-300 font-medium">Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
              placeholder="Your full name"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-300 font-medium">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
              placeholder="username"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-300 font-medium">E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-300 font-medium">Date of Birth</label>
            <input 
              type="date" 
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all [color-scheme:dark]"
              required
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-300 font-medium">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="h-11 mt-4 rounded-lg bg-primary text-primary-foreground font-semibold shadow-glow hover:bg-primary/90 hover:shadow-glow-lg transition-all duration-300 disabled:opacity-50"
          >
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="w-full flex items-center gap-4 my-8">
          <div className="h-px bg-white/5 flex-1" />
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">or</span>
          <div className="h-px bg-white/5 flex-1" />
        </div>

        <button onClick={handleGoogleSignup} className="h-11 w-full rounded-lg bg-background border border-white/10 text-white font-medium hover:bg-white/5 transition-colors">
          Continue with Google
        </button>

        <p className="text-sm text-muted-foreground mt-8">
          Already have an account? <Link href="/login" className="text-primary font-medium hover:underline">Log In</Link>
        </p>

        <p className="text-sm text-muted-foreground mt-2">
          Want to monetize your audience? <Link href="/become-creator" className="text-primary font-medium hover:underline">Become a Creator</Link>
        </p>
      </div>
    </div>
  );
}
