'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function AdminTransactions() {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from('platform_transactions')
        .select(`
          *,
          buyer:profiles!buyer_id(username, email),
          creator:profiles!creator_id(username),
          affiliate:profiles!affiliate_id(username)
        `)
        .order('created_at', { ascending: false });

      if (data) {
        setTransactions(data);
      }
      setIsLoading(false);
    };

    fetchTransactions();
  }, [supabase]);

  if (isLoading) return <div className="text-zinc-400 p-8 animate-pulse">Carregando transações...</div>;

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="border-b border-red-500/20 pb-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">Financial Transactions</h1>
        <p className="text-red-400 text-sm mt-1">Live ledger of all platform payments and splits</p>
      </div>

      <div className="bg-card border border-red-500/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-red-950/20 text-red-400 uppercase text-[10px] font-black tracking-widest border-b border-red-500/20">
              <tr>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Comprador</th>
                <th className="px-6 py-4">Criador</th>
                <th className="px-6 py-4">Afiliado</th>
                <th className="px-6 py-4 text-right">Total Pago</th>
                <th className="px-6 py-4 text-right text-emerald-500">Lucro (Platform)</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 font-medium">
                    Nenhuma transação registrada ainda.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-zinc-400 whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleDateString()} <span className="text-xs">{new Date(tx.created_at).toLocaleTimeString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-white/10 rounded text-[10px] uppercase font-bold text-white">
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      {tx.buyer ? `@${tx.buyer.username}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      {tx.creator ? `@${tx.creator.username}` : 'N/A'}
                      <div className="text-[10px] text-zinc-500 mt-1">${tx.creator_amount.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-400">
                      {tx.affiliate ? (
                        <>
                          @{tx.affiliate.username}
                          <div className="text-[10px] text-zinc-500 mt-1">${tx.affiliate_amount.toFixed(2)}</div>
                        </>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-white">
                      ${tx.amount_total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-emerald-500">
                      +${tx.platform_fee.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
