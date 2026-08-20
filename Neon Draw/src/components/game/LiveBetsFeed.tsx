import React from 'react';
import { Users, Coins, Flame } from 'lucide-react';
import { useGame } from '../../context/GameContext';

export const LiveBetsFeed: React.FC = () => {
  const { recentRoundBets } = useGame();

  if (!recentRoundBets || recentRoundBets.length === 0) {
    return (
      <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-4 text-center backdrop-blur-sm shadow-lg">
        <Users className="w-5 h-5 text-zinc-600 mx-auto mb-1.5" />
        <p className="text-[11px] text-zinc-500 font-medium">No other bets in this round yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div id="live-bets-feed" className="bg-zinc-950/40 border border-white/5 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Live Community Bets ({recentRoundBets.length})
          </h3>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></span>
      </div>

      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
        {recentRoundBets.map((bet) => (
          <div
            key={bet.id}
            className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-white/5 text-xs hover:border-white/10 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-200 font-mono font-bold text-xs flex items-center justify-center border border-white/10">
                {bet.selectedNumber}
              </span>
              <span className="font-semibold text-zinc-300 font-mono text-xs">{bet.username}</span>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-emerald-400 font-bold text-xs">
              <span>{bet.betAmount.toLocaleString()}</span>
              <span className="text-[10px] text-zinc-500 font-sans">V-C</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

