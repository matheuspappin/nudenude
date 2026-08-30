export default function MessagesHome() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 bg-background/30">
       <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
         <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
       </div>
       <h2 className="text-white font-bold tracking-tight mb-1">Your Direct Messages</h2>
       <p className="text-sm font-medium">Select a conversation to send messages or purchase PPV.</p>
    </div>
  );
}
