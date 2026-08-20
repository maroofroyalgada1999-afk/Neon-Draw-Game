import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flame,
  Coins,
  History,
  Wallet,
  Mail,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Sparkles,
  Send,
  LifeBuoy,
  BookOpen,
  Layers,
} from 'lucide-react';

import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BUSINESS_NAME, SUPPORT_EMAIL, BUSINESS_ADDRESS } from '../../data/legalContent';

export const HelpSupport: React.FC = () => {
  const { user } = useAuth();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [ticketSubject, setTicketSubject] = useState<string>('');
  const [ticketCategory, setTicketCategory] = useState<'GAMEPLAY' | 'WALLET' | 'ACCOUNT' | 'RULES' | 'OTHER'>('GAMEPLAY');
  const [ticketMessage, setTicketMessage] = useState<string>('');
  const [ticketStatus, setTicketStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const supportEmail = SUPPORT_EMAIL;

  const faqItems = [
    {
      q: 'What is the 01–20 game?',
      a: 'NEON DRAW-99 is a fast-paced game featuring a grid of 20 numbers (01 through 20). In each round, players select up to 20 numbers with variable multipliers (2x to 20x), followed by a cryptographically secured server draw that reveals a single winning number.',
    },
    {
      q: 'How long is one round?',
      a: 'Each round operates on a strict server-authoritative 60-second cycle divided into three distinct phases: 15s Result Display, 30s Observation, and 15s Betting.',
    },
    {
      q: 'How many numbers can I select?',
      a: 'A player can select and place wagers on a maximum of 20 different numbers in any single round (up to all 20 numbers on the board).',
    },
    {
      q: 'When can I place a bet?',
      a: 'Bets can ONLY be placed during Phase 3 (the 15-second Betting phase). During Phase 2 (Observation), you can pre-select numbers on your board, which will be ready for submission as soon as betting opens.',
    },
    {
      q: 'What happens when betting closes?',
      a: 'When the 15-second betting timer expires, betting immediately closes. The server draw animation executes, calculates all winning payouts instantly, and transitions to Phase 1 (Result Display).',
    },
    {
      q: 'Where can I see my previous bets?',
      a: 'You can review all previous bets in the "Bets & Draws" History tab or inside the Account modal. All entries include the original round ID, selected numbers, winning number, multiplier, status, and payout.',
    },
    {
      q: 'Where can I see my balance?',
      a: 'Your balance is permanently displayed in the top header and in the "Wallet Ledger" tab. You can also view balance logs and use the instant refill faucet from your Account section.',
    },
    {
      q: 'How do multipliers work?',
      a: 'Each round randomly distributes mixed multipliers between 2x and 20x across the 20 numbers, with glowing high multipliers offering 11x–20x. If the winning number matches your bet, your wager is multiplied by that number’s allocated multiplier.',
    },
    {
      q: 'Why cannot I select another number after reaching 20?',
      a: 'The game enforces a hard limit of 20 numbers per round to preserve balanced risk and platform integrity. Attempting to select a 21st number will trigger a notification and prevent further selections until you deselect an existing number.',
    },
    {
      q: 'What should I do if a bet does not appear in History?',
      a: 'All confirmed bets are recorded in atomic database ledgers. Try clicking the refresh button in History. If an issue persists, submit a report using the Contact Support section below with your round number.',
    },
  ];

  const [myTickets, setMyTickets] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      api.getMySupportTickets()
        .then((res) => setMyTickets(res.tickets || []))
        .catch(() => {});
    }
  }, [user]);

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketMessage.trim() || !ticketSubject.trim()) return;
    setTicketStatus('submitting');
    setErrorMessage('');
    try {
      const res = await api.createSupportTicket({
        subject: ticketSubject.trim(),
        category: ticketCategory,
        message: ticketMessage.trim(),
      });
      if (res.ticket) {
        setMyTickets((prev) => [res.ticket, ...prev]);
      }
      setTicketStatus('success');
      setTicketSubject('');
      setTicketMessage('');
      setTimeout(() => setTicketStatus('idle'), 5000);
    } catch (err: any) {
      setTicketStatus('error');
      setErrorMessage(err.message || 'Failed to submit support request.');
    }
  };

  return (
    <div id="help-support-page" className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-zinc-950 to-zinc-950 border border-emerald-500/30 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] shrink-0">
            <LifeBuoy className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              HELP & SUPPORT
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Everything you need to understand and use the game.
            </p>
          </div>
        </div>
      </div>

      {/* 1. How to Play Section */}
      <div className="p-5 sm:p-7 rounded-3xl bg-zinc-950/60 border border-white/5 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
            How to Play
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            'Open the Arena.',
            'Observe the current round.',
            'Select numbers during the betting phase.',
            'A player can select a maximum of 20 different numbers per round.',
            'Enter the desired bet amount.',
            'Place the bet before the betting timer reaches zero.',
            'Betting automatically closes.',
            'The draw takes place.',
            'The winning number is displayed.',
            'The result is added to History and the balance is updated according to the game\'s configured rules.',
          ].map((step, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5 flex items-start gap-3 hover:border-emerald-500/30 transition-colors"
            >
              <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-black text-xs flex items-center justify-center shrink-0 border border-emerald-500/30">
                {idx + 1}
              </span>
              <p className="text-zinc-300 font-medium leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Round Timing Section */}
      <div className="p-5 sm:p-7 rounded-3xl bg-zinc-950/60 border border-white/5 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
          <Clock className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
            60-Second Round
          </h2>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          The game runs continuously on a synchronized 60-second cycle divided into three authoritative phases:
        </p>

        {/* Visual Timeline Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-purple-300 uppercase tracking-wider">
                PHASE 1 — RESULT
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-purple-500/20 text-purple-300">
                15s
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Settlement review and display of previous winning number & payouts.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider">
                PHASE 2 — OBSERVATION
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-amber-500/20 text-amber-300">
                30s
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Study the 20-number grid and dynamic high-multiplier tiles. Pre-select up to 20 numbers.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-emerald-300 uppercase tracking-wider">
                PHASE 3 — BETTING
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-300">
                15s
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Live betting window is open. Confirm and submit your wagers before time expires.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/5 text-center text-xs font-mono text-zinc-400">
          Total Round Duration: <span className="text-white font-bold">60 Seconds</span> • Repeats Continuously
        </div>
      </div>

      {/* 3. 20-Number Rule & Multipliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 20-Number Rule */}
        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950/60 border border-white/5 shadow-xl space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
              Maximum 20 Numbers
            </h2>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            A player can select a maximum of <strong className="text-white">20 different numbers</strong> in one round.
          </p>

          <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/5">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-2 font-mono">
              Selection Example (01 to 20):
            </span>
            <div className="flex flex-wrap gap-1.5 font-mono text-[11px] font-bold">
              {[
                '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
                '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
              ].map((n) => (
                <span
                  key={n}
                  className="px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                >
                  {n}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              If you attempt to select more than 20 numbers, the system displays:{' '}
              <strong className="text-white">"Maximum 20 numbers allowed in this round."</strong>
            </span>
          </div>
        </div>

        {/* Multipliers Explained */}
        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-950/60 border border-white/5 shadow-xl space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <Flame className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
              Multipliers
            </h2>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Every round allocates dynamic multipliers (2x–20x) across all 20 numbers:
          </p>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/5 flex items-center justify-between">
              <div>
                <p className="font-bold text-white">Standard Numbers</p>
                <p className="text-[11px] text-zinc-500">Regular reward tier</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-200 font-mono font-bold">
                2x – 10x
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between">
              <div>
                <p className="font-bold text-amber-300 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  High-Multiplier Numbers
                </p>
                <p className="text-[11px] text-zinc-400">High-yield bonus tier</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-black">
                11x – 20x
              </span>
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 italic">
            High-multiplier positions change from round to round according to the game's secure random generation system.
          </p>
        </div>
      </div>

      {/* 4. Betting Rules & Results & Wallet */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Betting Rules */}
        <div className="p-5 rounded-3xl bg-zinc-950/60 border border-white/5 space-y-2.5">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <Coins className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Betting Rules</h3>
          </div>
          <ul className="text-[11px] text-zinc-400 space-y-2 list-disc list-inside">
            <li>Betting is available only during the 15-second Betting phase.</li>
            <li>Bets cannot be placed after betting closes.</li>
            <li>Maximum 20 different numbers per round.</li>
            <li>Min/Max stakes are governed by game configuration.</li>
            <li>Balance must be sufficient to place bets.</li>
            <li>Every accepted bet is permanently recorded.</li>
          </ul>
        </div>

        {/* Results & History */}
        <div className="p-5 rounded-3xl bg-zinc-950/60 border border-white/5 space-y-2.5">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <History className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Results & History</h3>
          </div>
          <ul className="text-[11px] text-zinc-400 space-y-2 list-disc list-inside">
            <li>Winning number is revealed at the draw.</li>
            <li>Player's selections, stakes, and payouts are logged.</li>
            <li>Won bets receive: Stake × Number Multiplier.</li>
            <li>Historical records retain original round IDs.</li>
            <li>New rounds never overwrite past history.</li>
          </ul>
        </div>

        {/* Balance & Wallet */}
        <div className="p-5 rounded-3xl bg-zinc-950/60 border border-white/5 space-y-2.5">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <Wallet className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Balance & Wallet</h3>
          </div>
          <ul className="text-[11px] text-zinc-400 space-y-2 list-disc list-inside">
            <li>Displays test/virtual coins balance.</li>
            <li>Instant balance reload faucet (+1,000 Coins).</li>
            <li>Automatic bet debits & win payouts.</li>
            <li>Full audit trail of credits & debits.</li>
            <li>Zero monetary value / demo play.</li>
          </ul>
        </div>
      </div>

      {/* 5. Frequently Asked Questions (FAQ Accordion) */}
      <div className="p-5 sm:p-7 rounded-3xl bg-zinc-950/60 border border-white/5 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
          <HelpCircle className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-2.5">
          {faqItems.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-white/5 bg-zinc-900/50 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-white hover:text-emerald-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-zinc-400 leading-relaxed border-t border-white/5">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Contact Support Section */}
      <div className="p-5 sm:p-7 rounded-3xl bg-zinc-950/60 border border-white/5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
              {BUSINESS_NAME} Support
            </h2>
          </div>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-[11px] font-mono font-bold text-emerald-400 hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500 block font-mono">Support Email</span>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-emerald-400 font-mono font-bold hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500 block font-mono">Business Address</span>
            <p className="text-zinc-300 font-medium">{BUSINESS_ADDRESS}</p>
          </div>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Need assistance or encountered a technical issue? Submit a ticket below or write directly to our support desk.
        </p>

        <form onSubmit={handleTicketSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">
                Category
              </label>
              <select
                value={ticketCategory}
                onChange={(e: any) => setTicketCategory(e.target.value)}
                className="w-full bg-zinc-900/80 border border-white/10 rounded-xl py-2.5 px-3.5 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
              >
                <option value="GAMEPLAY">Gameplay & Rounds</option>
                <option value="WALLET">Wallet & Transactions</option>
                <option value="RULES">Rules & Multipliers</option>
                <option value="ACCOUNT">Account & Security</option>
                <option value="OTHER">Other Inquiries</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">
                Subject
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Question about Round Draw or Wallet Ledger"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                className="w-full bg-zinc-900/80 border border-white/10 rounded-xl py-2.5 px-3.5 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">
              Message / Report Technical Problem
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe your question or the problem you experienced..."
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              className="w-full bg-zinc-900/80 border border-white/10 rounded-xl py-2.5 px-3.5 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          {ticketStatus === 'success' && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Your support request has been submitted. Our team will review your inquiry shortly.</span>
            </div>
          )}

          {ticketStatus === 'error' && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage || 'Failed to submit ticket.'}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={ticketStatus === 'submitting'}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{ticketStatus === 'submitting' ? 'Submitting...' : 'Submit Support Request'}</span>
          </button>
        </form>

        {/* My Submitted Tickets List */}
        {myTickets.length > 0 && (
          <div className="mt-6 pt-5 border-t border-white/5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              My Recent Support Inquiries ({myTickets.length})
            </h3>
            <div className="space-y-2">
              {myTickets.map((t) => (
                <div key={t.id} className="p-3 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{t.subject}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      t.status === 'RESOLVED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                      t.status === 'IN_PROGRESS' ? 'bg-amber-950 text-amber-400 border border-amber-500/30' :
                      'bg-zinc-800 text-zinc-300 border border-white/10'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">{t.message}</p>
                  {t.adminReply && (
                    <div className="mt-2 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-xs text-emerald-300">
                      <span className="font-bold text-emerald-400">Support Desk Response: </span>
                      {t.adminReply}
                    </div>
                  )}
                  <div className="text-[10px] text-zinc-500 font-mono">
                    {new Date(t.createdAt).toLocaleString()} • Category: {t.category}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
