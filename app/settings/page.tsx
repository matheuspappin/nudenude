'use client';
import { useState } from 'react';

type Card = {
  id: string;
  brand: string;
  last4: string;
};

type Subscription = {
  id: string;
  creatorUsername: string;
  creatorInitial: string;
  renewDate: string;
  status: 'active' | 'canceled';
};

export default function UserSettings() {
  const [cards, setCards] = useState<Card[]>([
    { id: '1', brand: 'Visa', last4: '1234' }
  ]);
  const [subs, setSubs] = useState<Subscription[]>([
    { id: '1', creatorUsername: '@isabella', creatorInitial: 'I', renewDate: 'Sep 30', status: 'active' }
  ]);

  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [newCard, setNewCard] = useState({ number: '', exp: '', cvv: '', name: '' });
  const [isSubmittingCard, setIsSubmittingCard] = useState(false);

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCard(true);
    // Simula a ida ao Gateway de Pagamento (ex: Stripe)
    setTimeout(() => {
      const last4 = newCard.number.slice(-4) || '0000';
      setCards([...cards, { id: Date.now().toString(), brand: 'Mastercard', last4 }]);
      setIsSubmittingCard(false);
      setIsCardModalOpen(false);
      setNewCard({ number: '', exp: '', cvv: '', name: '' });
    }, 1000);
  };

  const removeCard = (id: string) => {
    setCards(cards.filter(c => c.id !== id));
  };

  const toggleSub = (id: string) => {
    setSubs(subs.map(sub => {
      if (sub.id === id) {
        return { ...sub, status: sub.status === 'active' ? 'canceled' : 'active' };
      }
      return sub;
    }));
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-8 mt-4 px-4 sm:px-0 relative">
      <h1 className="text-3xl font-bold text-white tracking-tight">Payment Methods</h1>
      
      {/* Assinaturas Ativas */}
      <div className="bg-card border border-white/10 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-white mb-6">Active Subscriptions</h2>
        <div className="flex flex-col gap-3">
          {subs.length === 0 && <p className="text-sm text-zinc-500">No active subscriptions.</p>}
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
                      {sub.status === 'active' ? `Renews on ${sub.renewDate}` : `Cancels on ${sub.renewDate}`}
                    </p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => toggleSub(sub.id)}
                className={`text-sm font-medium px-4 py-2 border rounded-md transition-colors ${sub.status === 'active' ? 'text-zinc-300 border-white/10 hover:bg-white/5 hover:text-white' : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'}`}
              >
                {sub.status === 'active' ? 'Cancel Renewal' : 'Reactivate'}
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Métodos de Pagamento */}
      <div className="bg-card border border-white/10 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Billing & Cards</h2>
          <button 
            onClick={() => setIsCardModalOpen(true)}
            className="text-xs font-bold text-primary hover:underline px-3 py-1.5 bg-primary/10 rounded-md transition-colors hover:bg-primary/20"
          >
            + Add Card
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {cards.length === 0 && <p className="text-sm text-zinc-500">No cards registered.</p>}
          {cards.map(card => (
            <div key={card.id} className="flex items-center gap-4 p-4 bg-background rounded-lg border border-white/5 text-zinc-300">
               <div className="bg-zinc-800 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider text-white">{card.brand}</div>
               <span className="font-mono tracking-widest">•••• {card.last4}</span>
               <button onClick={() => removeCard(card.id)} className="ml-auto text-sm text-zinc-400 font-medium hover:text-white hover:text-red-400 transition-colors">Remove</button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Adicionar Cartão */}
      {isCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Add New Card</h3>
              <button onClick={() => setIsCardModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors">&times;</button>
            </div>
            
            <form onSubmit={handleAddCard} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Name on Card</label>
                <input 
                  type="text" required
                  value={newCard.name} onChange={e => setNewCard({...newCard, name: e.target.value})}
                  className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none"
                  placeholder="EX: JOHN D DOE" 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Card Number</label>
                <input 
                  type="text" required maxLength={19}
                  value={newCard.number} onChange={e => setNewCard({...newCard, number: e.target.value})}
                  className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white font-mono tracking-widest focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none"
                  placeholder="0000 0000 0000 0000" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Expiry</label>
                  <input 
                    type="text" required maxLength={5}
                    value={newCard.exp} onChange={e => setNewCard({...newCard, exp: e.target.value})}
                    className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white font-mono focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none"
                    placeholder="MM/YY" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">CVV</label>
                  <input 
                    type="text" required maxLength={4}
                    value={newCard.cvv} onChange={e => setNewCard({...newCard, cvv: e.target.value})}
                    className="h-11 rounded-lg bg-background border border-white/10 px-4 text-white font-mono focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none"
                    placeholder="123" 
                  />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 flex justify-end gap-3">
                <button type="button" onClick={() => setIsCardModalOpen(false)} className="px-4 py-2 rounded-lg font-medium text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmittingCard} className="px-6 py-2 rounded-lg font-bold text-sm bg-primary text-primary-foreground shadow-glow hover:bg-primary/90 transition-all disabled:opacity-50">
                  {isSubmittingCard ? 'Saving...' : 'Save Card Securely'}
                </button>
              </div>
              <div className="flex items-center justify-center gap-2 mt-2 text-xs text-zinc-500">
                <svg className="w-4 h-4 text-green-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Information is end-to-end encrypted
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
