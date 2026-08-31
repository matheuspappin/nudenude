export default function TermsPage() {
  return (
    <div className="w-full max-w-4xl mx-auto py-24 px-6 flex flex-col items-center">
      <div className="w-full bg-card border border-white/10 rounded-2xl p-8 sm:p-12 shadow-lg">
        <h1 className="text-3xl font-black text-white mb-6">Terms of Service</h1>
        <p className="text-sm text-zinc-500 mb-8">Last updated: August 2026</p>
        
        <div className="prose prose-invert max-w-none text-zinc-400">
          <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Welcome to NudeNude</h2>
          <p className="mb-4">
            NudeNude is a premium creator ecosystem and monetization software platform. 
            We provide creators with the tools to manage their communities, sell exclusive digital content, 
            and offer VIP subscriptions to their superfans.
          </p>
          
          <h2 className="text-xl font-bold text-white mt-8 mb-4">2. Digital Goods and Subscriptions</h2>
          <p className="mb-4">
            Users may purchase digital credits ("Credits") or VIP subscriptions via our integrated payment 
            gateways. All purchases are final and grant immediate access to the specified digital content 
            or membership tier provided by the creator.
          </p>

          <h2 className="text-xl font-bold text-white mt-8 mb-4">3. Content Guidelines</h2>
          <p className="mb-4">
            Creators are strictly responsible for the content they publish. All content must comply with our 
            Acceptable Use Policy. The platform acts solely as a technological intermediary and does not produce 
            content.
          </p>
          
          <h2 className="text-xl font-bold text-white mt-8 mb-4">4. Compliance and Payments</h2>
          <p className="mb-4">
            Payment processing is handled by third-party services (e.g., Helio, MoonPay, Transak). 
            By initiating a transaction, you agree to their respective terms and conditions. 
            Chargebacks or fraudulent activities will result in immediate account termination.
          </p>
        </div>
      </div>
    </div>
  );
}
