import React, { useState, useEffect } from 'react';
import {
  Trophy,
  History,
  TrendingUp,
  Percent,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import { Bet } from '../../types/index';

export const GameHistoryTab: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'WON' | 'LOST' | 'PENDING'>('ALL');
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBets = async () => {
    setLoading(true);
    try {
      const res = await api.getMyBets(filter === 'ALL' ? undefined : filter);
      setBets(res.bets || []);
    } catch (err) {
      console.warn('Failed to load bet history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBets();
  }, [filter]);

  const totalBets = bets.length;
  const wonBets = bets.filter((b) => b.status === 'WON');
  const totalTurnover = bets.reduce((acc, b) => acc + (b.betAmount || 0), 0);
  const totalPayout = wonBets.reduce((acc, b) => acc + (b.payoutAmount || 0), 0);
  const netProfit = totalPayout - totalTurnover;
  const winRate = totalBets > 0 ? ((wonBets.length / totalBets) * 100).toFixed(1) : '0.0';

  return (
    <div id="game-history-tab-content" className="space-y-5 animate-in fade-in duration-200">
      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/5">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
            Rounds Played
          </span>
          <span className="text-lg font-mono font-black text-white">{totalBets}</span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/5">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
            Total Turnover
          </span>
          <span className="text-lg font-mono font-black text-white">₹{totalTurnover.toLocaleString()}</span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/5">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
            Total Won Payout
          </span>
          <span className="text-lg font-mono font-black text-emerald-400">₹{totalPayout.toLocaleString()}</span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/5">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
            Win Hit Rate
          </span>
          <span className="text-lg font-mono font-black text-cyan-400">{winRate}%</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {(['ALL', 'WON', 'LOST', 'PENDING'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === f
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <button
          onClick={fetchBets}
          className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 text-xs flex items-center gap-1 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* History List */}
      {loading ? (
        <div className="p-8 text-center text-zinc-400 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Loading betting ledger...</span>
        </div>
      ) : bets.length === 0 ? (
        <div className="p-8 text-center text-zinc-400 text-xs rounded-2xl bg-zinc-900/40 border border-white/5">
          No bets found for this filter. Place numbers on the draw grid!
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {bets.map((bet) => {
            const isWon = bet.status === 'WON';
            const isLost = bet.status === 'LOST';
            const isPending = bet.status === 'PENDING';

            return (
              <div
                key={bet.id}
                className="p-3.5 rounded-2xl bg-zinc-900/90 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between gap-3 text-xs"
              >
                {/* Left: Round & Selected Number */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-mono font-black text-sm border ${
                      isWon
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-md shadow-emerald-950/40'
                        : isLost
                        ? 'bg-zinc-950 text-zinc-400 border-white/5'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    #{bet.selectedNumber}
                  </div>

                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>Round #{bet.roundNumber || bet.roundId.slice(-6)}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-cyan-300 font-mono">
                        {bet.multiplier}x Multiplier
                      </span>
                    </div>

                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      Bet: ₹{bet.betAmount.toLocaleString()} •{' '}
                      {new Date(bet.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* Right: Result & Payout */}
                <div className="text-right">
                  {isWon && (
                    <>
                      <div className="font-mono font-black text-emerald-400 text-sm">
                        +₹{bet.payoutAmount.toLocaleString()}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Hit Win
                      </span>
                    </>
                  )}

                  {isLost && (
                    <>
                      <div className="font-mono font-bold text-zinc-400 text-xs">
                        ₹0
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                        <XCircle className="w-3 h-3 text-zinc-400" /> Result: #{bet.winningNumber || '--'}
                      </span>
                    </>
                  )}

                  {isPending && (
                    <>
                      <div className="font-mono font-bold text-amber-300 text-xs">
                        Pot: ₹{bet.potentialPayout.toLocaleString()}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                        <Clock className="w-3 h-3" /> In Live Draw
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
