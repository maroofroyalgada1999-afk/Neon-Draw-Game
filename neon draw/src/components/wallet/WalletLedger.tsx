import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { api } from '../../services/api';
import { WalletTransaction } from '../../types/index';
import { useAuth } from '../../context/AuthContext';

export const WalletLedger: React.FC = () => {
  const { user, claimFaucet, openAuthModal } = useAuth();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);

  const fetchLedger = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api.getLedger();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Failed to load ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [user]);

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      await claimFaucet();
      await fetchLedger();
    } finally {
      setIsClaiming(false);
    }
  };

  const totalCredits = transactions
    .filter((t) => t.amount > 0)
    .reduce((acc, t) => acc + t.amount, 0);

  const totalDebits = transactions
    .filter((t) => t.amount < 0)
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  return (
    <div id="wallet-ledger-panel" className="flex flex-col gap-6">
      {/* Top Balance & Overview Card */}
      <div className="bg-zinc-950/60 border border-white/10 rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-sm">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-widest font-mono">
                Audited Wallet Ledger
              </span>
              <span className="text-xs text-zinc-400 font-medium">Virtual Play</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight flex items-center gap-3">
              <span className="text-emerald-400">{user ? user.virtualBalance.toLocaleString() : '0'}</span>
              <span className="text-sm sm:text-base font-bold text-zinc-400 font-sans">
                Virtual Coins
              </span>
            </h1>

            <p className="text-xs text-zinc-400 mt-2 flex items-center gap-1.5 font-medium">
              <Info className="w-3.5 h-3.5 text-zinc-500" />
              <span>Virtual Coins Only — Strictly No Real Monetary Value or Deposits</span>
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-ledger-claim-faucet"
              onClick={handleClaim}
              disabled={isClaiming || !user}
              className="px-5 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider text-xs shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2 transition-all active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-black" />
              <span>{isClaiming ? 'Claiming...' : 'Claim +1,000 Demo Coins'}</span>
            </button>

            <button
              id="btn-ledger-refresh"
              onClick={fetchLedger}
              className="p-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 transition-colors"
              title="Refresh Ledger"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ledger Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/5">
          <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-white/5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Wins & Faucets</span>
            <p className="text-base sm:text-lg font-black text-emerald-400 font-mono mt-0.5">
              +{totalCredits.toLocaleString()} <span className="text-zinc-500 text-xs">V-C</span>
            </p>
          </div>
          <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-white/5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Staked</span>
            <p className="text-base sm:text-lg font-black text-zinc-300 font-mono mt-0.5">
              -{totalDebits.toLocaleString()} <span className="text-zinc-500 text-xs">V-C</span>
            </p>
          </div>
          <div className="bg-zinc-900/60 p-3.5 rounded-2xl border border-white/5 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Audit Records</span>
            <p className="text-base sm:text-lg font-black text-zinc-200 font-mono mt-0.5">
              {transactions.length} Entries
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="bg-zinc-950/40 border border-white/5 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-tight">
              Immutable Financial Ledger Audit
            </h2>
          </div>
          <span className="text-xs text-zinc-500 font-mono">Real-time ledger events</span>
        </div>

        {!user ? (
          <div className="text-center py-12 bg-zinc-900/40 rounded-2xl border border-white/5 space-y-3">
            <p className="text-sm text-zinc-400 font-medium">Please log in to inspect your wallet ledger.</p>
            <button
              onClick={() => openAuthModal('login')}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider transition-all"
            >
              Play / Login
            </button>
          </div>
        ) : loading ? (
          <div className="text-center py-12 text-zinc-500 text-xs font-mono">Loading ledger records...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900/40 rounded-2xl border border-white/5">
            <p className="text-sm text-zinc-400 font-medium">No ledger entries found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-zinc-500 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Balance Before</th>
                  <th className="py-2.5 px-3">Balance After</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3 px-3 font-mono text-[11px] font-bold text-zinc-400">
                        {tx.id}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            tx.type === 'WIN_CREDIT'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : tx.type === 'BET_DEBIT'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : tx.type === 'REGISTRATION_BONUS' || tx.type === 'BONUS'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          {isPositive ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          <span>{tx.type}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-black text-sm">
                        <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPositive ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-zinc-400">
                        {tx.balanceBefore.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        {tx.balanceAfter.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-zinc-300 font-medium">
                        {tx.description}
                      </td>
                      <td className="py-3 px-3 text-right text-zinc-500 font-mono text-[11px]">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

