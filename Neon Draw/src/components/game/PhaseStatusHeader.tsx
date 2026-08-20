import React from 'react';
import {
  Clock,
  Eye,
  Trophy,
  Flame,
  Coins,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';

export const PhaseStatusHeader: React.FC = () => {
  const {
    currentRound,
    currentPhase,
    phaseSecondsRemaining,
    isResultPhase,
    isChartPhase,
    isBettingPhase,
    isDrawing,
    previousRoundResult,
    userPreviousResult,
    selectedNumbers,
    userDistinctBetNumbers,
  } = useGame();

  const totalDistinctNumbers = new Set([...userDistinctBetNumbers, ...selectedNumbers]).size;

  return (
    <div id="phase-status-header" className="w-full max-w-full min-w-0 space-y-3 sm:space-y-4 box-border">
      {/* 3-Step Breadcrumb Progress Bar */}
      <div className="w-full grid grid-cols-3 gap-1 sm:gap-3 min-w-0">
        {/* Phase 1 Pill */}
        <div
          id="phase-1-pill"
          className={`w-full min-w-0 py-1.5 sm:py-2.5 px-0.5 sm:px-4 rounded-lg sm:rounded-xl border text-center flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 transition-all overflow-hidden ${
            isResultPhase
              ? 'bg-purple-950/60 border-purple-500/80 shadow-[0_0_20px_rgba(168,85,247,0.35)] ring-1 ring-purple-500/50'
              : 'bg-zinc-950/40 border-white/5 opacity-60'
          }`}
        >
          <Trophy className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${isResultPhase ? 'text-purple-400' : 'text-zinc-500'}`} />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-0 sm:gap-1 leading-tight sm:leading-normal min-w-0">
            <span
              className={`text-[8px] min-[360px]:text-[10px] min-[400px]:text-[11px] sm:text-xs font-black tracking-tight sm:tracking-wider uppercase whitespace-nowrap ${
                isResultPhase ? 'text-purple-300' : 'text-zinc-400'
              }`}
            >
              PHASE 1:
            </span>
            <span
              className={`text-[8px] min-[360px]:text-[10px] min-[400px]:text-[11px] sm:text-xs font-black tracking-tight sm:tracking-wider uppercase whitespace-nowrap ${
                isResultPhase ? 'text-purple-300' : 'text-zinc-400'
              }`}
            >
              RESULT
            </span>
          </div>
        </div>

        {/* Phase 2 Pill */}
        <div
          id="phase-2-pill"
          className={`w-full min-w-0 py-1.5 sm:py-2.5 px-0.5 sm:px-4 rounded-lg sm:rounded-xl border text-center flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 transition-all overflow-hidden ${
            isChartPhase
              ? 'bg-amber-950/60 border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.35)] ring-1 ring-amber-500/50'
              : 'bg-zinc-950/40 border-white/5 opacity-60'
          }`}
        >
          <Eye className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${isChartPhase ? 'text-amber-400' : 'text-zinc-500'}`} />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-0 sm:gap-1 leading-tight sm:leading-normal min-w-0">
            <span
              className={`text-[8px] min-[360px]:text-[10px] min-[400px]:text-[11px] sm:text-xs font-black tracking-tight sm:tracking-wider uppercase whitespace-nowrap ${
                isChartPhase ? 'text-amber-300' : 'text-zinc-400'
              }`}
            >
              PHASE 2:
            </span>
            <span
              className={`text-[8px] min-[360px]:text-[10px] min-[400px]:text-[11px] sm:text-xs font-black tracking-tight sm:tracking-wider uppercase whitespace-nowrap ${
                isChartPhase ? 'text-amber-300' : 'text-zinc-400'
              }`}
            >
              OBSERVE
            </span>
          </div>
        </div>

        {/* Phase 3 Pill */}
        <div
          id="phase-3-pill"
          className={`w-full min-w-0 py-1.5 sm:py-2.5 px-0.5 sm:px-4 rounded-lg sm:rounded-xl border text-center flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 transition-all overflow-hidden ${
            isBettingPhase
              ? 'bg-emerald-950/60 border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.35)] ring-1 ring-emerald-500/50 animate-pulse'
              : 'bg-zinc-950/40 border-white/5 opacity-60'
          }`}
        >
          <Coins className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${isBettingPhase ? 'text-emerald-400' : 'text-zinc-500'}`} />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-0 sm:gap-1 leading-tight sm:leading-normal min-w-0">
            <span
              className={`text-[8px] min-[360px]:text-[10px] min-[400px]:text-[11px] sm:text-xs font-black tracking-tight sm:tracking-wider uppercase whitespace-nowrap ${
                isBettingPhase ? 'text-emerald-300' : 'text-zinc-400'
              }`}
            >
              PHASE 3:
            </span>
            <span
              className={`text-[8px] min-[360px]:text-[10px] min-[400px]:text-[11px] sm:text-xs font-black tracking-tight sm:tracking-wider uppercase whitespace-nowrap ${
                isBettingPhase ? 'text-emerald-300' : 'text-zinc-400'
              }`}
            >
              BETTING
            </span>
          </div>
        </div>
      </div>

      {/* Hero Banner for Active Phase */}
      {/* PHASE 1: RESULT DISPLAY HERO */}
      {isResultPhase && (
        <div id="phase-1-result-card" className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 via-zinc-950 to-purple-950/60 border border-purple-500/40 shadow-xl backdrop-blur-md min-w-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 min-w-0">
            {/* Left: Previous Round Info */}
            <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto text-left min-w-0">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-purple-500/20 border-2 border-purple-400/80 flex flex-col items-center justify-center text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.4)] shrink-0">
                <span className="text-[8px] sm:text-[9px] uppercase font-bold text-purple-400 tracking-wider">Winner</span>
                <span className="text-lg sm:text-2xl font-black font-mono text-white leading-none my-0.5">
                  #{previousRoundResult?.winningNumber !== undefined ? String(previousRoundResult.winningNumber).padStart(2, '0') : '??'}
                </span>
                <span className="text-[9px] sm:text-[10px] font-black text-amber-300">
                  {previousRoundResult?.winningMultiplier || 2}x
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 whitespace-nowrap">
                    PHASE 1 • RESULT
                  </span>
                  <span className="text-[11px] sm:text-xs text-zinc-400 font-mono">
                    Round #{previousRoundResult?.roundNumber || '---'}
                  </span>
                </div>

                <h2 className="text-xs sm:text-base font-black text-white mt-0.5 truncate">
                  Previous Round Settlement
                </h2>

                {/* Player Outcome */}
                {userPreviousResult && (
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {userPreviousResult.won ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[10px] sm:text-xs">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        WON +{userPreviousResult.payout.toLocaleString()} Coins!
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-zinc-800 border border-white/10 text-zinc-400 font-medium text-[10px] sm:text-xs">
                        <XCircle className="w-3 h-3 text-zinc-500 shrink-0" />
                        No win ({userPreviousResult.totalBet.toLocaleString()} staked)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Countdown */}
            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t border-white/5 sm:border-t-0 shrink-0">
              <span className="text-[10px] sm:text-xs text-purple-300 font-bold uppercase tracking-wider whitespace-nowrap">
                Next Observation in:
              </span>
              <div className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-purple-950 border border-purple-500/50 text-lg sm:text-2xl font-black font-mono text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                {String(phaseSecondsRemaining).padStart(2, '0')}s
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 2: CHART / OBSERVATION HERO */}
      {isChartPhase && (
        <div id="phase-2-observation-card" className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-950/70 via-zinc-950 to-amber-950/50 border border-amber-500/40 shadow-xl backdrop-blur-md min-w-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 min-w-0">
            {/* Left Info */}
            <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto text-left min-w-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] shrink-0">
                <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                    PHASE 2 • OBSERVATION
                  </span>
                  <span className="text-[11px] sm:text-xs text-zinc-400 font-mono">
                    Round #{currentRound?.roundNumber || '---'}
                  </span>
                </div>

                <h2 className="text-xs sm:text-base font-black text-white tracking-tight mt-0.5 truncate">
                  Observation & Multipliers
                </h2>
              </div>
            </div>

            {/* Right: Countdown to Betting Open */}
            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t border-white/5 sm:border-t-0 shrink-0">
              <span className="text-[10px] sm:text-xs text-amber-300 font-bold uppercase tracking-wider whitespace-nowrap">
                Betting Opens In:
              </span>
              <div className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-amber-950/90 border border-amber-500/50 text-lg sm:text-2xl font-black font-mono text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                {String(phaseSecondsRemaining).padStart(2, '0')}s
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 3: BETTING HERO */}
      {isBettingPhase && (
        <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-950/90 via-zinc-950 to-emerald-950/70 border border-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.25)] backdrop-blur-md min-w-0">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-5 min-w-0">
            {/* Left Info */}
            <div className="flex items-center gap-3 text-left w-full md:w-auto min-w-0">
              <div className="w-11 h-11 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-emerald-500/20 border-2 border-emerald-400/80 flex items-center justify-center text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.4)] shrink-0 animate-bounce">
                <Coins className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-400" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-emerald-500 text-black shadow-md whitespace-nowrap">
                    PHASE 3 • BETTING (15s)
                  </span>
                  <span className="text-[11px] sm:text-xs text-zinc-400 font-mono">
                    Round #{currentRound?.roundNumber || '---'}
                  </span>
                </div>

                <h2 className="text-sm sm:text-xl font-black text-white mt-1 leading-tight">
                  Place Your Bets (Max 20 Numbers)
                </h2>

                {/* Counter Pill */}
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold font-mono border ${
                      totalDistinctNumbers >= 20
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    Numbers Selected: {totalDistinctNumbers} / 20 Max
                  </span>
                  {totalDistinctNumbers >= 20 && (
                    <span className="text-[10px] text-amber-400 font-semibold">
                      (20/20 limit reached)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Countdown to Close */}
            <div className="flex items-center justify-between md:flex-col md:items-end gap-1.5 w-full md:w-auto pt-2 md:pt-0 border-t border-white/5 md:border-t-0 shrink-0">
              <span className="text-[10px] sm:text-xs text-emerald-300 font-bold uppercase tracking-wider whitespace-nowrap">
                Betting Closes In:
              </span>
              <div
                className={`px-3 py-1 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border text-xl sm:text-3xl font-black font-mono shadow-lg ${
                  phaseSecondsRemaining <= 5
                    ? 'bg-rose-950 border-rose-500 text-rose-300 animate-ping'
                    : 'bg-emerald-950 border-emerald-500/60 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                }`}
              >
                {String(phaseSecondsRemaining).padStart(2, '0')}s
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DRAWING / SETTLING HERO */}
      {isDrawing && (
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-cyan-950 via-zinc-950 to-cyan-950 border border-cyan-500/50 shadow-2xl backdrop-blur-md text-center min-w-0">
          <div className="flex flex-col items-center gap-2">
            <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400 animate-spin" />
            <h2 className="text-base sm:text-lg font-black text-white">
              Determining Winning Number...
            </h2>
            <p className="text-[11px] sm:text-xs text-cyan-300">
              Settling bets and updating balances. Next round starts immediately in Phase 1!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
