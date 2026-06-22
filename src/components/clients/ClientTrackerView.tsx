import { useState, useCallback, useEffect } from 'react';
import { dallasMatches, stageLabels } from '@/data/dallas-matches';
import { FlagImg } from '@/components/ui/FlagImg';

interface ClientEntry {
  id: string;
  name: string;
  company: string;
}

interface MatchBooking {
  matchId: string;
  clients: ClientEntry[];
  notes: string;
}

const STORAGE_KEY = 'fifa26-client-tracker';

function loadBookings(): Record<string, MatchBooking> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveBookings(bookings: Record<string, MatchBooking>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

/** Confirmed match team IDs */
const CONFIRMED_IDS: Record<string, [string, string]> = {
  M11: ['netherlands', 'japan'],
  M21: ['england', 'croatia'],
  M43: ['argentina', 'austria'],
  M70: ['argentina', 'jordan'],
};

export function ClientTrackerView() {
  const [bookings, setBookings] = useState<Record<string, MatchBooking>>(loadBookings);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');

  useEffect(() => saveBookings(bookings), [bookings]);

  const totalClients = Object.values(bookings).reduce((s, b) => s + b.clients.length, 0);
  const matchesWithClients = Object.values(bookings).filter((b) => b.clients.length > 0).length;

  const addClient = useCallback((matchId: string) => {
    if (!newName.trim()) return;
    const client: ClientEntry = { id: Date.now().toString(), name: newName.trim(), company: newCompany.trim() };
    setBookings((prev) => {
      const existing = prev[matchId] ?? { matchId, clients: [], notes: '' };
      return { ...prev, [matchId]: { ...existing, clients: [...existing.clients, client] } };
    });
    setNewName('');
    setNewCompany('');
    setAddingTo(null);
  }, [newName, newCompany]);

  const removeClient = useCallback((matchId: string, clientId: string) => {
    setBookings((prev) => {
      const existing = prev[matchId];
      if (!existing) return prev;
      return { ...prev, [matchId]: { ...existing, clients: existing.clients.filter((c) => c.id !== clientId) } };
    });
  }, []);

  const updateNotes = useCallback((matchId: string, notes: string) => {
    setBookings((prev) => {
      const existing = prev[matchId] ?? { matchId, clients: [], notes: '' };
      return { ...prev, [matchId]: { ...existing, notes } };
    });
  }, []);

  const exportICS = useCallback(() => {
    const events = dallasMatches.map((m) => {
      const booking = bookings[m.matchId];
      const clients = booking?.clients.map((c) => `${c.name} (${c.company})`).join(', ') ?? '';
      const start = m.date.replace(/-/g, '') + 'T180000';
      const end = m.date.replace(/-/g, '') + 'T210000';
      return [
        'BEGIN:VEVENT',
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:FIFA 26 - ${m.matchId} - ${m.teams}`,
        `LOCATION:AT&T Stadium, Arlington TX`,
        `DESCRIPTION:${m.teams}${clients ? `\\nClients: ${clients}` : ''}${booking?.notes ? `\\nNotes: ${booking.notes}` : ''}`,
        'END:VEVENT',
      ].join('\r\n');
    });

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//FIFA26 Dallas Predictor//EN',
      ...events,
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fifa26-dallas-matches.ics';
    a.click();
    URL.revokeObjectURL(url);
  }, [bookings]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-t1">Client Tracker</h2>
          <p className="text-xs text-t3 mt-0.5">
            Assign clients to matches, add notes, export to calendar.
          </p>
        </div>
        <button
          onClick={exportICS}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-xs font-bold rounded-lg hover:bg-accent-bright transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Export .ics
        </button>
      </div>

      {/* Summary bar */}
      <div className="flex gap-3">
        <div className="bg-s2 rounded-lg border border-b2 px-4 py-3 flex-1">
          <p className="text-2xl font-extrabold text-accent-bright tabular-nums">{matchesWithClients}</p>
          <p className="text-[10px] text-t3">of 8 matches have clients</p>
        </div>
        <div className="bg-s2 rounded-lg border border-b2 px-4 py-3 flex-1">
          <p className="text-2xl font-extrabold text-t1 tabular-nums">{totalClients}</p>
          <p className="text-[10px] text-t3">total client invites</p>
        </div>
        <div className="bg-s2 rounded-lg border border-b2 px-4 py-3 flex-1">
          <p className="text-2xl font-extrabold text-green tabular-nums">8</p>
          <p className="text-[10px] text-t3">matches booked at AT&T</p>
        </div>
      </div>

      {/* Match cards */}
      <div className="space-y-3">
        {dallasMatches.map((match) => {
          const booking = bookings[match.matchId];
          const clients = booking?.clients ?? [];
          const notes = booking?.notes ?? '';
          const confirmed = CONFIRMED_IDS[match.matchId];
          const isAdding = addingTo === match.matchId;

          return (
            <div key={match.matchId} className="bg-s2 rounded-xl border border-b2 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-b1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-accent tabular-nums">{match.matchId}</span>
                  <span className="text-[9px] font-bold bg-s3 text-t3 px-1.5 py-0.5 rounded">
                    {stageLabels[match.stage]}
                  </span>
                  <span className="text-xs text-t3">{match.displayDate}</span>

                  {confirmed && (
                    <div className="flex items-center gap-1.5 ml-2">
                      <FlagImg teamId={confirmed[0]} size="xs" />
                      <FlagImg teamId={confirmed[1]} size="xs" />
                    </div>
                  )}

                  <span className="text-sm font-bold text-t1">{match.teams}</span>
                </div>

                <div className="flex items-center gap-2">
                  {clients.length > 0 && (
                    <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full tabular-nums">
                      {clients.length} client{clients.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  <button
                    onClick={() => setAddingTo(isAdding ? null : match.matchId)}
                    className="text-[10px] font-bold text-accent hover:text-accent-bright transition-colors"
                  >
                    {isAdding ? 'Cancel' : '+ Add Client'}
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-4 py-3">
                {/* Client list */}
                {clients.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {clients.map((c) => (
                      <div key={c.id} className="flex items-center justify-between bg-s3 rounded-lg px-3 py-1.5">
                        <div>
                          <span className="text-xs font-semibold text-t1">{c.name}</span>
                          {c.company && <span className="text-[10px] text-t3 ml-2">{c.company}</span>}
                        </div>
                        <button
                          onClick={() => removeClient(match.matchId, c.id)}
                          className="text-[9px] text-t3 hover:text-red transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add client form */}
                {isAdding && (
                  <div className="flex gap-2 mb-3">
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Client name"
                      className="flex-1 bg-s3 border border-b2 rounded-lg px-3 py-1.5 text-xs text-t1 placeholder:text-t3 focus:outline-none focus:ring-1 focus:ring-accent"
                      onKeyDown={(e) => e.key === 'Enter' && addClient(match.matchId)}
                    />
                    <input
                      value={newCompany}
                      onChange={(e) => setNewCompany(e.target.value)}
                      placeholder="Company"
                      className="w-32 bg-s3 border border-b2 rounded-lg px-3 py-1.5 text-xs text-t1 placeholder:text-t3 focus:outline-none focus:ring-1 focus:ring-accent"
                      onKeyDown={(e) => e.key === 'Enter' && addClient(match.matchId)}
                    />
                    <button
                      onClick={() => addClient(match.matchId)}
                      className="px-3 py-1.5 bg-accent text-white text-xs font-bold rounded-lg hover:bg-accent-bright"
                    >
                      Add
                    </button>
                  </div>
                )}

                {/* Notes */}
                <textarea
                  value={notes}
                  onChange={(e) => updateNotes(match.matchId, e.target.value)}
                  placeholder="Notes (e.g., VIP box, dietary requirements, client interests...)"
                  rows={1}
                  className="w-full bg-s3/50 border border-b1 rounded-lg px-3 py-2 text-[11px] text-t2 placeholder:text-t3 focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
