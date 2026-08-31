'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function UserProfile() {
  const router = useRouter();
  const supabase = createClient();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    id: '',
    email: '',
    display_name: '',
    username: '',
    bio: '',
    avatar_url: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

        setProfile({
          id: session.user.id,
          email: session.user.email || '',
          display_name: profileData?.display_name || '',
          username: profileData?.username || '',
          bio: profileData?.bio || '',
          avatar_url: profileData?.avatar_url || ''
        });
      } catch (err: any) {
        console.error('Error fetching profile:', err.message);
        setError('Failed to load profile data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: profile.display_name,
          username: profile.username,
          bio: profile.bio
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;
      
      setSuccess('Profile updated successfully!');
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err.message);
      setError('Failed to save changes. Make sure your username is unique.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = () => {
    // A ser implementado com Supabase Storage posteriormente
    alert('Avatar upload will be available soon!');
  };

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-8 mt-4 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white tracking-tight">My Profile</h1>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Log Out
        </button>
      </div>
      
      {error && (
        <div className="w-full p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 font-medium text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="w-full p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 font-medium text-sm">
          {success}
        </div>
      )}
      
      <div className="bg-card border border-white/10 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-white mb-6">Public Information</h2>
        
        <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center mb-6">
          {/* Avatar Upload */}
          <div className="relative group cursor-pointer" onClick={handleAvatarUpload}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-white/20 group-hover:border-primary/50 transition-colors" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-zinc-500 group-hover:border-primary/50 group-hover:text-primary transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                 <span className="text-xs font-bold">Photo</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 w-full flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-400">Display Name</label>
              <input 
                type="text" 
                value={profile.display_name} 
                onChange={(e) => setProfile({...profile, display_name: e.target.value})}
                className="h-11 px-4 rounded-lg bg-background border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-colors" 
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-400">@username</label>
                <input 
                  type="text" 
                  value={profile.username} 
                  onChange={(e) => setProfile({...profile, username: e.target.value})}
                  className="h-11 px-4 rounded-lg bg-background border border-white/10 text-white focus:border-primary/50 focus:outline-none transition-colors" 
                />
              </div>
              
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-400">Contact E-mail</label>
                <input 
                  type="email" 
                  value={profile.email} 
                  disabled
                  className="h-11 px-4 rounded-lg bg-background/50 border border-white/5 text-zinc-500 cursor-not-allowed focus:outline-none" 
                />
                <p className="text-[10px] text-zinc-500">Contact support to change your email.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-1.5 mb-8">
           <label className="text-sm font-medium text-zinc-400">Bio (Optional)</label>
           <textarea 
             value={profile.bio || ''}
             onChange={(e) => setProfile({...profile, bio: e.target.value})}
             className="h-24 p-4 rounded-lg bg-background border border-white/10 text-white focus:border-primary/50 focus:outline-none resize-none transition-colors" 
             placeholder="Say something about yourself..."
           ></textarea>
        </div>

        {/* Área de Privacidade e LGPD para o Consumidor */}
        <div className="flex flex-col gap-4 mb-8 p-5 bg-background/50 rounded-xl border border-white/5">
           <label className="flex items-start gap-3 cursor-pointer group">
             <div className="relative flex items-center justify-center mt-0.5 shrink-0">
               <input type="checkbox" defaultChecked disabled className="peer appearance-none w-5 h-5 border border-white/20 rounded bg-background checked:bg-primary checked:border-primary transition-colors cursor-not-allowed" />
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="absolute text-background opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"><polyline points="20 6 9 17 4 12"></polyline></svg>
             </div>
             <span className="text-xs text-zinc-500 leading-relaxed font-medium">
               I confirm that I am <strong>over 18 years old</strong> and have legal permission to access restricted adult content.
             </span>
           </label>
           
           <label className="flex items-start gap-3 cursor-pointer group">
             <div className="relative flex items-center justify-center mt-0.5 shrink-0">
               <input type="checkbox" defaultChecked disabled className="peer appearance-none w-5 h-5 border border-white/20 rounded bg-background checked:bg-primary checked:border-primary transition-colors cursor-not-allowed" />
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="absolute text-background opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity"><polyline points="20 6 9 17 4 12"></polyline></svg>
             </div>
             <span className="text-xs text-zinc-500 leading-relaxed font-medium">
               <strong>Consent & Privacy:</strong> I agree with the processing of my e-mail, profile information and encrypted payment data exclusively to enable subscriptions and interactions within the NudeNude platform.
             </span>
           </label>
        </div>

        <div className="flex justify-end">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="h-11 px-8 rounded-lg bg-primary text-primary-foreground font-bold shadow-glow hover:bg-primary/90 hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving && <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
