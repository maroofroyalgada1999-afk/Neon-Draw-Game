import React, { useState, useEffect } from 'react';
import {
  Send,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  User as UserIcon,
  Mail,
  MapPin,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SupportTicketCategory, SupportTicket } from '../../types/index';
import { BUSINESS_NAME, SUPPORT_EMAIL, BUSINESS_ADDRESS } from '../../data/legalContent';

export const ContactSupportForm: React.FC = () => {
  const { user } = useAuth();

  // Form Fields
  const [name, setName] = useState<string>(user?.name || '');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [accountId, setAccountId] = useState<string>(user?.id || '');
  const [category, setTicketCategory] = useState<SupportTicketCategory>('GAMEPLAY');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  // Status & Feedback
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [createdTicket, setCreatedTicket] = useState<SupportTicket | null>(null);

  // My Tickets
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState<boolean>(false);

  const fetchMyTickets = async () => {
    if (!user) return;
    setLoadingTickets(true);
    try {
      const res = await api.getMySupportTickets();
      setMyTickets(res.tickets || []);
    } catch {
      // Ignored if offline/unauthorized
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAccountId(user.id || '');
      fetchMyTickets();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    if (!subject.trim()) {
      setStatus('error');
      setErrorMessage('Please provide a subject for your ticket.');
      return;
    }

    if (!message.trim() || message.trim().length < 10) {
      setStatus('error');
      setErrorMessage('Please provide a detailed message (minimum 10 characters).');
      return;
    }

    if (!user && (!email.trim() || !email.includes('@'))) {
      setStatus('error');
      setErrorMessage('A valid email address is required so we can reply to you.');
      return;
    }

    try {
      const res = await api.createSupportTicket({
        name: name.trim() || 'Player',
        email: email.trim(),
        accountId: accountId.trim() || (user ? user.id : 'UNREGISTERED'),
        category,
        priority,
        subject: subject.trim(),
        message: message.trim(),
      });

      if (res.ticket) {
        setCreatedTicket(res.ticket);
        setMyTickets((prev) => [res.ticket, ...prev]);
      }

      setStatus('success');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to submit support request. Please try again.');
    }
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Official Business & Direct Contact Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-zinc-900/60 border border-white/5 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
          <Building2 className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
            Official Platform & Support Details
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-white/5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block font-mono">Platform Name</span>
            <p className="text-white font-bold text-sm">{BUSINESS_NAME}</p>
            <p className="text-[11px] text-zinc-400">20-Number Cyber Arena</p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-white/5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block font-mono flex items-center gap-1">
              <Mail className="w-3 h-3 text-cyan-400" /> Direct Support Email
            </span>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-emerald-400 font-bold text-xs font-mono break-all hover:underline block"
            >
              {SUPPORT_EMAIL}
            </a>
            <p className="text-[11px] text-zinc-400">Click to write directly</p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/70 border border-white/5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block font-mono flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-400" /> Business Address
            </span>
            <p className="text-zinc-200 font-medium text-xs leading-snug break-words">
              {BUSINESS_ADDRESS}
            </p>
          </div>
        </div>
      </div>

      {/* Ticket Submission Form */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 rounded-3xl bg-zinc-900/40 border border-white/5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
              Submit a Support Ticket
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            {user ? `Logged in as @${user.username}` : 'Guest Submission'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">
              Your Name / Alias
            </label>
            <div className="relative">
              <UserIcon className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Hunter"
                className="w-full bg-zinc-950/80 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">
              Your Contact Email
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. player@gmail.com"
                className="w-full bg-zinc-950/80 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">
              Inquiry Category
            </label>
            <select
              value={category}
              onChange={(e) => setTicketCategory(e.target.value as SupportTicketCategory)}
              className="w-full bg-zinc-950/80 border border-white/10 rounded-xl py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value="GAMEPLAY">Gameplay & Rounds</option>
              <option value="WALLET">Wallet & Transactions</option>
              <option value="RULES">Rules & Multipliers</option>
              <option value="LOGIN_PROBLEM">Login & Access Problem</option>
              <option value="ACCOUNT_PROBLEM">Account & Profile Problem</option>
              <option value="BETTING_PROBLEM">Betting & Stake Problem</option>
              <option value="HISTORY_PROBLEM">History & Result Query</option>
              <option value="WALLET_PROBLEM">Wallet & Balance Inquiry</option>
              <option value="TECHNICAL_PROBLEM">Technical Bug / Latency</option>
              <option value="OTHER">Other General Questions</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">
              Urgency Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full bg-zinc-950/80 border border-white/10 rounded-xl py-2 px-3 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value="LOW">Low (General question)</option>
              <option value="MEDIUM">Medium (Gameplay inquiry)</option>
              <option value="HIGH">High (Urgent account issue)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">
              Account ID (Optional)
            </label>
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="e.g. usr_xxxx or none"
              className="w-full bg-zinc-950/80 border border-white/10 rounded-xl py-2 px-3 text-zinc-400 text-xs font-mono focus:outline-none focus:border-emerald-500"
            >
            </input>
          </div>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">
            Subject Line
          </label>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Question regarding Round #1042 Draw or Wallet Refill"
            className="w-full bg-zinc-950/80 border border-white/10 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">
            Detailed Description / Report
          </label>
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Please detail your question, round ID, steps to reproduce any issue, or how our team can help you..."
            className="w-full bg-zinc-950/80 border border-white/10 rounded-xl py-2.5 px-3 text-white text-xs leading-relaxed focus:outline-none focus:border-emerald-500"
          />
        </div>

        {status === 'success' && createdTicket && (
          <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 space-y-1.5 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Ticket #{createdTicket.id} Submitted to {BUSINESS_NAME} Support!</span>
            </div>
            <p className="text-xs text-zinc-300">
              Your inquiry has been queued for our support staff ({SUPPORT_EMAIL}). We will review your request and reply shortly.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:translate-y-[-1px] cursor-pointer disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span>{status === 'submitting' ? 'Submitting Ticket...' : 'Submit Support Ticket'}</span>
        </button>
      </form>

      {/* User's Previous Inquiries / Tickets Feed */}
      {user && (
        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-900/40 border border-white/5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                My Support History ({myTickets.length})
              </h3>
            </div>
            <button
              onClick={fetchMyTickets}
              disabled={loadingTickets}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Refresh tickets"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingTickets ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {myTickets.length === 0 ? (
            <p className="text-zinc-500 text-xs py-4 text-center">No previous tickets found for your account.</p>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
              {myTickets.map((t) => (
                <div key={t.id} className="p-3.5 rounded-2xl bg-zinc-950/70 border border-white/5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-emerald-400 font-bold">{t.id}</span>
                      <span className="font-bold text-white">{t.subject}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        t.status === 'RESOLVED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                          : t.status === 'IN_PROGRESS'
                          ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                          : 'bg-zinc-800 text-zinc-300 border border-white/10'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <p className="text-zinc-400 leading-relaxed">{t.message}</p>

                  {t.adminReply && (
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono block">
                        Support Staff Response:
                      </span>
                      <p className="leading-relaxed">{t.adminReply}</p>
                    </div>
                  )}

                  <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-2">
                    <span>{new Date(t.createdAt).toLocaleString()}</span>
                    <span>•</span>
                    <span className="text-zinc-400">Category: {t.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
