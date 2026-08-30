export default function AdminDashboard() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl">
      <div className="border-b border-red-500/20 pb-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">Main Vault</h1>
        <p className="text-red-400 text-sm mt-1">Global Oversight and Cash Flow</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-red-500/10 rounded-xl p-6 shadow-sm">
           <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Transaction Volume</h3>
           <p className="text-3xl font-black text-white mb-1">$ 124,500.00</p>
           <span className="text-xs text-green-500 font-bold">+18% vs last month</span>
        </div>
        <div className="bg-card border border-red-500/20 rounded-xl p-6 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/20 blur-2xl rounded-full pointer-events-none" />
           <h3 className="text-xs font-bold text-red-400/80 uppercase tracking-widest mb-2">Net Profit (15%)</h3>
           <p className="text-3xl font-black text-red-500 mb-1">$ 18,675.00</p>
           <span className="text-xs text-red-400/70 font-bold">Platform flat fee</span>
        </div>
        <div className="bg-card border border-red-500/10 rounded-xl p-6 shadow-sm">
           <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Active Users</h3>
           <p className="text-3xl font-black text-white mb-1">12.4K</p>
           <span className="text-xs text-zinc-500 font-bold">Consumers and Creators</span>
        </div>
      </div>

      <div className="bg-card border border-red-500/10 rounded-xl p-8 shadow-sm min-h-[300px] flex items-center justify-center">
         <p className="text-red-500/50 text-sm font-medium">Financial Growth Chart (Waiting Stripe/Supabase Integration)</p>
      </div>
    </div>
  );
}
