'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Step state
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'student' | 'creator'>('student');

  // Form state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Student state
  const [studentGoal, setStudentGoal] = useState('');

  // Creator state
  const [location, setLocation] = useState('');
  const [danceStyles, setDanceStyles] = useState('');
  const [subscriptionPrice, setSubscriptionPrice] = useState('9.99');
  const [previewVideoUrl, setPreviewVideoUrl] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('role') === 'creator') {
      setRole('creator');
      setStep(2); // Skip role selection if passed in URL
    }
  }, [searchParams]);

  const referralCode = searchParams.get('ref') || null;

  const handleNextStep = () => {
    setError('');
    if (step === 2) {
      if (!name || !username || !email || !password) {
        setError('Please fill in all basic fields.');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation for final step
    if (role === 'creator') {
      if (!previewVideoUrl) {
        setError('A video reel is required to showcase your talent.');
        return;
      }
    }

    setIsLoading(true);

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          username,
          role,
          student_goal: role === 'student' ? studentGoal : null,
          location: role === 'creator' ? location : null,
          dance_styles: role === 'creator' ? danceStyles.split(',').map(s => s.trim()) : null,
          subscription_price: role === 'creator' ? parseFloat(subscriptionPrice) : null,
          preview_video_url: role === 'creator' ? previewVideoUrl : null,
          is_creator: role === 'creator',
          referred_by: referralCode
        }
      }
    });

    setIsLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.push(role === 'creator' ? '/dashboard' : '/');
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
    <div className="flex min-h-[80vh] items-center justify-center w-full px-4 py-12">
      <div className="w-full max-w-md p-8 bg-card border border-white/10 rounded-2xl shadow-2xl flex flex-col items-center">
        
        {/* Progress Bar */}
        <div className="w-full flex gap-2 mb-8">
          <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-white/10'}`}></div>
          <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-white/10'}`}></div>
          <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-white/10'}`}></div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
          {step === 1 ? 'Join the Movement' : step === 2 ? 'Create Account' : role === 'creator' ? 'Creator Setup' : 'Your Goals'}
        </h1>
        <p className="text-muted-foreground text-sm mb-6 text-center">
          {step === 1 ? 'Choose how you want to use CreatorDance.' : step === 2 ? 'Let us get your basic details.' : 'Help us personalize your experience.'}
        </p>

        {error && (
          <div className="w-full p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium text-center">
            {error}
          </div>
        )}

        {/* STEP 1: ROLE SELECTION */}
        {step === 1 && (
          <div className="w-full flex flex-col gap-4">
            <button 
              onClick={() => { setRole('student'); setStep(2); }}
              className="flex flex-col items-start p-4 rounded-xl border border-white/10 bg-white/5 hover:border-primary/50 hover:bg-white/10 transition-all text-left"
            >
              <span className="text-lg font-bold text-white">I'm a Student</span>
              <span className="text-sm text-zinc-400">I want to learn from top choreographers.</span>
            </button>
            <button 
              onClick={() => { setRole('creator'); setStep(2); }}
              className="flex flex-col items-start p-4 rounded-xl border border-white/10 bg-white/5 hover:border-primary/50 hover:bg-white/10 transition-all text-left"
            >
              <span className="text-lg font-bold text-white">I'm a Creator</span>
              <span className="text-sm text-zinc-400">I want to monetize my classes and build a community.</span>
            </button>
          </div>
        )}

        {/* STEP 2: BASIC INFO */}
        {step === 2 && (
          <div className="w-full flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-zinc-300 font-medium">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:border-primary/50 outline-none" placeholder="Your full name" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-zinc-300 font-medium">Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:border-primary/50 outline-none" placeholder="johndoe" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-zinc-300 font-medium">E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:border-primary/50 outline-none" placeholder="you@email.com" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-zinc-300 font-medium">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:border-primary/50 outline-none" placeholder="••••••••" />
            </div>
            
            <div className="flex gap-3 mt-4">
              <button onClick={() => setStep(1)} className="h-11 px-6 rounded-lg bg-white/5 text-white font-medium hover:bg-white/10 transition-colors">Back</button>
              <button onClick={handleNextStep} className="h-11 flex-1 rounded-lg bg-primary text-primary-foreground font-semibold shadow-glow hover:bg-primary/90 transition-all">Next Step</button>
            </div>
          </div>
        )}

        {/* STEP 3: ADVANCED ONBOARDING */}
        {step === 3 && (
          <form className="w-full flex flex-col gap-5" onSubmit={handleSignup}>
            {role === 'student' ? (
              <div className="flex flex-col gap-4">
                <label className="text-sm text-zinc-300 font-medium">What is your primary goal?</label>
                <select 
                  value={studentGoal} 
                  onChange={(e) => setStudentGoal(e.target.value)}
                  className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:border-primary/50 outline-none"
                  required
                >
                  <option value="" disabled>Select a goal</option>
                  <option value="fitness">Fitness & Cardio (Lose weight dancing)</option>
                  <option value="professional">Become a Professional Dancer</option>
                  <option value="fun">Just for Fun & Hobby</option>
                  <option value="battles">Prepare for Battles / Competitions</option>
                </select>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-zinc-300 font-medium">Location</label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:border-primary/50 outline-none" placeholder="e.g. New York, NY" required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-zinc-300 font-medium">Dance Styles</label>
                  <input type="text" value={danceStyles} onChange={(e) => setDanceStyles(e.target.value)} className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:border-primary/50 outline-none" placeholder="e.g. Hip Hop, Vogue, Heels" required />
                  <p className="text-[10px] text-zinc-500">Comma separated</p>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-zinc-300 font-medium">Monthly VIP Subscription Price ($)</label>
                  <input type="number" step="0.01" value={subscriptionPrice} onChange={(e) => setSubscriptionPrice(e.target.value)} className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:border-primary/50 outline-none" placeholder="9.99" required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-zinc-300 font-medium">Dance Reel URL (Required)</label>
                  <input type="url" value={previewVideoUrl} onChange={(e) => setPreviewVideoUrl(e.target.value)} className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:border-primary/50 outline-none" placeholder="https://youtube.com/shorts/..." required />
                  <p className="text-[10px] text-zinc-500">This 15s video will be your business card on the Explore page.</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button type="button" onClick={() => setStep(2)} className="h-11 px-6 rounded-lg bg-white/5 text-white font-medium hover:bg-white/10 transition-colors">Back</button>
              <button 
                type="submit"
                disabled={isLoading}
                className="h-11 flex-1 rounded-lg bg-primary text-primary-foreground font-semibold shadow-glow hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Finishing...' : 'Complete Signup'}
              </button>
            </div>
          </form>
        )}

        {step === 1 && (
          <>
            <div className="w-full flex items-center gap-4 my-8">
              <div className="h-px bg-white/5 flex-1" />
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">or</span>
              <div className="h-px bg-white/5 flex-1" />
            </div>

            <button onClick={handleGoogleSignup} className="h-11 w-full rounded-lg bg-background border border-white/10 text-white font-medium hover:bg-white/5 transition-colors">
              Continue with Google
            </button>

            <p className="text-sm text-muted-foreground mt-8 text-center">
              Already have an account? <Link href="/login" className="text-primary font-medium hover:underline">Log In</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[80vh] items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
      <SignupForm />
    </Suspense>
  );
}
