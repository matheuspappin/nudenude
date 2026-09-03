'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { CreditCard, AlertCircle } from 'lucide-react';

type Subscription = {
  id: string;
  creatorUsername: string;
  creatorInitial: string;
  renewDate: string;
  status: 'active' | 'canceled' | 'past_due' | string;
};

export default function UserSettings() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const supabase = createClient();

  useEffect(() => {
    async function fetchSubs() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data } = await supabase
        .from('subscriptions')
        .select(`
          id, 
          status, 
          current_period_end,
          creator:creator_id(username)
        `)
        .eq('student_id', session.user.id);

      if (data) {
        const formattedSubs = data.map((sub: any) => {
          const username = sub.creator?.username || 'Unknown';
          const date = new Date(sub.current_period_end || Date.now());
          
          return {
            id: sub.id,
            creatorUsername: `@${username}`,
            creatorInitial: username.charAt(0).toUpperCase(),
            renewDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            status: sub.status,
          };
        });
        setSubs(formattedSubs);
      }
      setIsLoading(false);
    }
    fetchSubs();
  }, [supabase]);

  const toggleSub = (id: string) => {
    alert('Para gerenciar ou cancelar sua assinatura, por favor, acesse o painel do Stripe.');
    // Idealmente redirecionar para o Stripe Customer Portal aqui
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-8 mt-4 px-4 sm:px-0 relative animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold text-white tracking-tight">Assinaturas e Pagamentos</h1>
      
      {/* Aviso sobre Stripe */}
      <div className="flex gap-3 p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary items-start">
        <CreditCard className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p className="text-sm">
          <strong>Segurança em primeiro lugar:</strong> Nós não salvamos os dados do seu cartão de crédito em nossos servidores. 
          Todos os seus pagamentos e métodos de pagamento são processados e armazenados com segurança pelo <strong>Stripe</strong>.
        </p>
      </div>
      
      {/* Assinaturas Ativas */}
      <div className="bg-card border border-white/10 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-white mb-6">Assinaturas VIP Ativas</h2>
        
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {subs.length === 0 && <p className="text-sm text-zinc-500">Você não possui assinaturas ativas no momento.</p>}
            {subs.map(sub => (
              <div key={sub.id} className="flex items-center justify-between p-4 bg-background rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-400">
                    {sub.creatorInitial}
                  </div>
                  <div>
                    <p className="text-white font-medium tracking-tight">{sub.creatorUsername}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${sub.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                      <p className="text-xs font-semibold text-muted-foreground">
                        {sub.status === 'active' ? `Renovação em ${sub.renewDate}` : `Status: ${sub.status}`}
                      </p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => toggleSub(sub.id)}
                  className={`text-sm font-medium px-4 py-2 border rounded-md transition-colors text-zinc-300 border-white/10 hover:bg-white/5 hover:text-white`}
                >
                  Gerenciar no Stripe
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
