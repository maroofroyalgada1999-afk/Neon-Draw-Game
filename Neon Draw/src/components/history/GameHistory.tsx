import React, { useState, useEffect } from 'react';
import { History, Trophy, XCircle, ShieldCheck, Filter } from 'lucide-react';
import { api } from '../../services/api';
import { Bet, Round } from '../../types/index';
import { useAuth } from '../../context/AuthContext';

export const GameHistory: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'MY_BETS' | 'PAST_ROUNDS'>('MY_BETS');
  const [myBets, setMyBets] = useState<Bet[]>([]);
  const [pastRounds, setPastRounds] = useState<Round[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      if (user) {
        const betsData = await api.getMyBets(statusFilter);
        setMyBets(betsData.bets || []);
      }
      const roundsData = await api.getHistory(30);
      setPastRounds(roundsData.rounds || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user, statusFilter]);

  return (
    <div id="game-history-panel" className="bg-zinc-950/40 border border-white/5 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-sm">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-4 border-b border-white/5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
              Bets & Draw History
            </h2>
            <p className="text-xs text-zinc-400">
              Audit past rounds, track personal bet wins, and analyze game turnover
            </p>
          </div>
        </div>

        {/* Sub Tab Switcher */}
        <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-white/5">
          <button
            id="tab-history-my-bets"
            onClick={() => setActiveSubTab('MY_BETS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'MY_BETS'
                ? 'bg-emerald-500 text-black font-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            My Bets {user ? `(${myBets.length})` : ''}
          </button>
          <button
            id="tab-history-all-rounds"
            onClick={() => setActiveSubTab('PAST_ROUNDS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'PAST_ROUNDS'
                ? 'bg-emerald-500 text-black font-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Completed Rounds ({pastRounds.length})
          </button>
        </div>
      </div>

      {/* MY BETS TAB */}
      {activeSubTab === 'MY_BETS' && (
        <div>
          {/* Status Filters */}
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs font-bold text-zinc-400">Filter:</span>
            <div className="flex items-center gap-1.5">
              {['ALL', 'WON', 'LOST'].map((st) => (
                <button
                  key={st}
                  id={`filter-${st.toLowerCase()}`}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === st
                      ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 border border-white/5'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {!user ? (
            <div className="text-center py-12 bg-zinc-900/40 rounded-2xl border border-white/5 space-y-3">
              <p className="text-sm text-zinc-400 font-medium">Please log in to view your personal bet history.</p>
              <button
                onClick={() => openAuthModal('login')}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider transition-all"
              >
                Play / Login
              </button>
            </div>
          ) : loading ? (
            <div className="text-center py-12 text-zinc-500 text-xs font-mono">Loading bet history...</div>
          ) : myBets.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/40 rounded-2xl border border-white/5">
              <p className="text-sm text-zinc-400 font-medium">No bets found under this filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-zinc-500 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Round</th>
                    <th className="py-2.5 px-3">Chosen #</th>
                    <th className="py-2.5 px-3">Winning #</th>
                    <th className="py-2.5 px-3">Bet Amount</th>
                    <th className="py-2.5 px-3">Multiplier</th>
                    <th className="py-2.5 px-3">Status / Payout</th>
                    <th className="py-2.5 px-3 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {myBets.map((bet) => {
                    const isWon = bet.status === 'WON';
                    return (
                      <tr key={bet.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-zinc-300">
                          #{bet.roundNumber}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-800 text-zinc-200 font-mono font-black border border-white/10">
                            {bet.selectedNumber}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold">
                          {bet.winningNumber ? (
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-mono font-black ${
                                isWon
                                    ? 'bg-amber-400 text-black border border-amber-300 shadow-sm'
                                    : 'bg-zinc-900 text-zinc-400 border border-white/5'
                              }`}
                            >
                              {bet.winningNumber}
                            </span>
                          ) : (
                            <span className="text-zinc-500 font-mono">--</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-zinc-300">
                          {bet.betAmount.toLocaleString()} <span className="text-zinc-500 text-[10px]">V-C</span>
                        </td>
                        <td className="py-3 px-3 font-bold text-zinc-300 font-mono">
                          {bet.multiplier}x
                        </td>
                        <td className="py-3 px-3">
                          {isWon ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <Trophy className="w-3 h-3 text-amber-400" />
                              +{bet.payoutAmount.toLocaleString()} Coins
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-zinc-800 text-zinc-400">
                              <XCircle className="w-3 h-3 text-zinc-500" />
                              Lost
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right text-zinc-500 font-mono text-[11px]">
                          {new Date(bet.placedAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PAST ROUNDS TAB */}
      {activeSubTab === 'PAST_ROUNDS' && (
        <div>
          {loading ? (
            <div className="text-center py-12 text-zinc-500 text-xs font-mono">Loading past rounds...</div>
          ) : pastRounds.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/40 rounded-2xl border border-white/5">
              <p className="text-sm text-zinc-400 font-medium">No completed rounds found yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-zinc-500 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Round ID</th>
                    <th className="py-2.5 px-3">Winning #</th>
                    <th className="py-2.5 px-3">Multiplier</th>
                    <th className="py-2.5 px-3">Total Staked</th>
                    <th className="py-2.5 px-3">Total Payout</th>
                    <th className="py-2.5 px-3 text-right">Settled Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pastRounds.map((round) => {
                    const winningTile = round.numbers.find((n) => n.number === round.winningNumber);
                    const multiplier = winningTile ? winningTile.multiplier : 2;
                    const isHigh = winningTile ? winningTile.isHighMultiplier : false;

                    return (
                      <tr key={round.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-white">
                          #{round.roundNumber}
                          <span className="block text-[10px] text-zinc-500 font-normal">{round.id}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-400 text-black font-mono font-black text-sm border border-amber-300 shadow-md">
                            {round.winningNumber || '--'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-black ${
                              isHigh
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-zinc-800 text-zinc-300'
                            }`}
                          >
                            {multiplier}x {isHigh ? '🔥' : ''}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-zinc-300">
                          {(round.totalTurnoverCoins || 0).toLocaleString()} <span className="text-zinc-500 text-[10px]">V-C</span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                          {(round.totalPayoutCoins || 0).toLocaleString()} <span className="text-zinc-500 text-[10px]">V-C</span>
                        </td>
                        <td className="py-3 px-3 text-right text-zinc-500 font-mono text-[11px]">
                          {round.settledAt ? new Date(round.settledAt).toLocaleTimeString() : '---'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

