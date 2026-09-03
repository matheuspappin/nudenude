'use client';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function AdminTransactions() {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState('all');
  const [filterCreator, setFilterCreator] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

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

  // Filter logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (filterType !== 'all' && tx.transaction_type !== filterType) return false;
      if (filterCreator && tx.creator?.username && !tx.creator.username.toLowerCase().includes(filterCreator.toLowerCase())) return false;
      if (filterDateFrom) {
        const from = new Date(filterDateFrom);
        if (new Date(tx.created_at) < from) return false;
      }
      if (filterDateTo) {
        const to = new Date(filterDateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(tx.created_at) > to) return false;
      }
      return true;
    });
  }, [transactions, filterType, filterCreator, filterDateFrom, filterDateTo]);

  // Aggregate totals for filtered data
  const totals = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => ({
      total: acc.total + Number(tx.amount_total || 0),
      platform: acc.platform + Number(tx.platform_fee || 0),
      creator: acc.creator + Number(tx.creator_amount || 0),
      affiliate: acc.affiliate + Number(tx.affiliate_amount || 0)
    }), { total: 0, platform: 0, creator: 0, affiliate: 0 });
  }, [filteredTransactions]);

  const handleExportCSV = () => {
    const headers = ['Data', 'Tipo', 'Comprador', 'Criador', 'Afiliado', 'Total Pago', 'Platform Fee', 'Creator Amount', 'Affiliate Amount'];
    const rows = filteredTransactions.map(tx => [
      new Date(tx.created_at).toLocaleDateString(),
      tx.transaction_type,
      tx.buyer?.username || 'N/A',
      tx.creator?.username || 'N/A',
      tx.affiliate?.username || '-',
      tx.amount_total.toFixed(2),
      tx.platform_fee.toFixed(2),
      tx.creator_amount.toFixed(2),
      tx.affiliate_amount.toFixed(2)
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <div className="text-zinc-400 p-8 animate-pulse">Carregando transações...</div>;

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="border-b border-red-500/20 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Financial Transactions</h1>
          <p className="text-red-400 text-sm mt-1">Live ledger of all platform payments and splits</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-zinc-300 hover:bg-white/10 transition-colors"
        >
          📥 Export CSV
        </button>
      </div>

      {/* Totals Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-card border border-white/10 rounded-xl">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Bruto</p>
          <p className="text-xl font-black text-white mt-1">${totals.total.toFixed(2)}</p>
        </div>
        <div className="p-4 bg-card border border-emerald-500/10 rounded-xl">
          <p className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest">Platform Fees</p>
          <p className="text-xl font-black text-emerald-400 mt-1">+${totals.platform.toFixed(2)}</p>
        </div>
        <div className="p-4 bg-card border border-white/10 rounded-xl">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Pago aos Criadores</p>
          <p className="text-xl font-black text-white mt-1">${totals.creator.toFixed(2)}</p>
        </div>
        <div className="p-4 bg-card border border-amber-500/10 rounded-xl">
          <p className="text-[10px] font-bold text-amber-500/70 uppercase tracking-widest">Comissões Afiliados</p>
          <p className="text-xl font-black text-amber-400 mt-1">${totals.affiliate.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 bg-card border border-white/5 rounded-xl">
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="h-9 bg-background border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/50"
        >
          <option value="all">Todos os Tipos</option>
          <option value="subscription">Subscription</option>
          <option value="ppv">PPV</option>
          <option value="dropin">Drop-in</option>
        </select>

        <input
          type="text"
          value={filterCreator}
          onChange={e => setFilterCreator(e.target.value)}
          placeholder="Filtrar por criador..."
          className="h-9 bg-background border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/50 w-48"
        />

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">De:</span>
          <input
            type="date"
            value={filterDateFrom}
            onChange={e => setFilterDateFrom(e.target.value)}
            className="h-9 bg-background border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Até:</span>
          <input
            type="date"
            value={filterDateTo}
            onChange={e => setFilterDateTo(e.target.value)}
            className="h-9 bg-background border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-red-500/50"
          />
        </div>

        {(filterType !== 'all' || filterCreator || filterDateFrom || filterDateTo) && (
          <button
            onClick={() => { setFilterType('all'); setFilterCreator(''); setFilterDateFrom(''); setFilterDateTo(''); }}
            className="h-9 px-3 text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
          >
            ✕ Limpar filtros
          </button>
        )}

        <span className="ml-auto text-xs text-zinc-500 self-center">
          {filteredTransactions.length} de {transactions.length} transações
        </span>
      </div>

      {/* Table */}
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
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 font-medium">
                    Nenhuma transação encontrada com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-zinc-400 whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleDateString()} <span className="text-xs">{new Date(tx.created_at).toLocaleTimeString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${
                        tx.transaction_type === 'subscription' ? 'bg-primary/10 text-primary' :
                        tx.transaction_type === 'ppv' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-white/10 text-white'
                      }`}>
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
