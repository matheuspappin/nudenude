import React from 'react';
import Link from 'next/link';

interface CreatorEvent {
  id: string;
  title: string;
  location: string;
  event_date: string;
  ticket_url?: string;
}

interface UpcomingEventsProps {
  events: CreatorEvent[];
  creatorName?: string;
}

export default function UpcomingEvents({ events, creatorName = 'Creator' }: UpcomingEventsProps) {
  if (!events || events.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-12 py-8 border-t border-white/10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight">Tour Dates & Workshops</h3>
          <p className="text-zinc-400 text-sm mt-1">Catch {creatorName} live in a city near you.</p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
        {events.map((event) => {
          const dateObj = new Date(event.event_date);
          const month = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
          const day = dateObj.getDate();
          const year = dateObj.getFullYear();
          const time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

          return (
            <div 
              key={event.id} 
              className="flex-none w-[300px] snap-center bg-card border border-white/10 rounded-xl overflow-hidden hover:border-primary/50 transition-colors group flex flex-col"
            >
              <div className="flex items-start p-5 gap-4">
                <div className="flex flex-col items-center justify-center min-w-[50px]">
                  <span className="text-primary font-bold text-sm leading-none">{month}</span>
                  <span className="text-white font-black text-2xl tracking-tighter">{day}</span>
                  <span className="text-zinc-500 text-xs font-semibold">{year}</span>
                </div>
                
                <div className="flex flex-col border-l border-white/10 pl-4">
                  <h4 className="text-white font-bold truncate" title={event.title}>{event.title}</h4>
                  <p className="text-zinc-400 text-sm truncate flex items-center gap-1 mt-1" title={event.location}>
                    <svg className="w-3 h-3 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    {event.location}
                  </p>
                  <p className="text-zinc-500 text-xs mt-1">{time}</p>
                </div>
              </div>
              
              <div className="p-4 mt-auto border-t border-white/5 bg-white/[0.02]">
                {event.ticket_url ? (
                  <Link 
                    href={event.ticket_url} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full block text-center py-2 bg-primary/10 text-primary font-bold text-sm rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    Get Tickets
                  </Link>
                ) : (
                  <button disabled className="w-full text-center py-2 bg-white/5 text-zinc-500 font-bold text-sm rounded-lg cursor-not-allowed">
                    Tickets Unavailable
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
