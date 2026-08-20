import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Trophy, X, Coins, CheckCircle, ShieldCheck } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../services/sound';

export const DrawAnimationModal: React.FC = () => {
  const { currentRound, showDrawOverlay, dismissDrawOverlay, lastSettledResult } = useGame();
  const [stage, setStage] = useState<'COUNTDOWN' | 'SPINNING' | 'REVEAL'>('COUNTDOWN');
  const [countdownNum, setCountdownNum] = useState<number>(3);
  const [displayNumber, setDisplayNumber] = useState<string>('01');
  const spinInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!showDrawOverlay || !currentRound) return;

    if (currentRound.status === 'DRAWING' || currentRound.status === 'BETTING_CLOSED') {
      setStage('COUNTDOWN');
      setCountdownNum(3);

      const countTimer = setInterval(() => {
        setCountdownNum((prev) => {
          if (prev <= 1) {
            clearInterval(countTimer);
            startSpinning();
            return 0;
          }
          sounds.playTick(prev === 2);
          return prev - 1;
        });
      }, 800);

      return () => clearInterval(countTimer);
    } else if (currentRound.status === 'SETTLED' && currentRound.winningNumber) {
      // If already settled, skip directly to reveal
      setDisplayNumber(currentRound.winningNumber);
      setStage('REVEAL');
    }
  }, [showDrawOverlay, currentRound?.status, currentRound?.winningNumber]);

  const startSpinning = () => {
    setStage('SPINNING');
    let spinCount = 0;
    const maxSpins = 25;

    spinInterval.current = setInterval(() => {
      spinCount++;
      const randomTwoDigit = String(Math.floor(Math.random() * 20) + 1).padStart(2, '0');
      setDisplayNumber(randomTwoDigit);
      sounds.playDrawCycle();

      if (spinCount >= maxSpins) {
        if (spinInterval.current) clearInterval(spinInterval.current);
        const winningNum = currentRound?.winningNumber || randomTwoDigit;
        setDisplayNumber(winningNum);
        setStage('REVEAL');
      }
    }, 60);
  };

  useEffect(() => {
    return () => {
      if (spinInterval.current) clearInterval(spinInterval.current);
    };
  }, []);

  if (!showDrawOverlay) return null;

  const winningNumber = currentRound?.winningNumber || displayNumber;
  const tileInfo = currentRound?.numbers.find((n) => n.number === winningNumber);
  const multiplier = tileInfo ? tileInfo.multiplier : 2;
  const isHigh = tileInfo ? tileInfo.isHighMultiplier : false;

  const playerWon = lastSettledResult?.won;
  const payout = lastSettledResult?.payout || 0;

  return (
    <div
      id="draw-animation-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(0,0,0,0.9)] text-center overflow-hidden">
        {/* Dismiss Button */}
        {stage === 'REVEAL' && (
          <button
            id="btn-close-draw-modal"
            onClick={dismissDrawOverlay}
            className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white border border-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Stage 1: Countdown */}
        {stage === 'COUNTDOWN' && (
          <div className="flex flex-col items-center justify-center py-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2 font-mono">
              Betting Closed • Draw Initializing
            </span>
            <div className="w-28 h-28 rounded-full bg-zinc-900 border-2 border-emerald-500/80 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] my-4 animate-pulse">
              <span className="text-6xl font-black text-white font-mono">{countdownNum}</span>
            </div>
            <p className="text-xs text-zinc-400">Cryptographic RNG computing winning number...</p>
          </div>
        )}

        {/* Stage 2: Spinning Carousel */}
        {stage === 'SPINNING' && (
          <div className="flex flex-col items-center justify-center py-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2 font-mono animate-pulse">
              Selecting Authoritative Winning Number...
            </span>
            <div className="w-32 h-32 rounded-3xl bg-zinc-900 border-2 border-amber-500 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.4)] my-4">
              <span className="text-6xl font-black text-amber-300 font-mono tracking-wider animate-bounce">
                {displayNumber}
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">Verifying HMAC-SHA256 seed commitments</p>
          </div>
        )}

        {/* Stage 3: Reveal Result */}
        {stage === 'REVEAL' && (
          <div className="flex flex-col items-center justify-center py-2 animate-in zoom-in-95 duration-200">
            {/* Header Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-xs font-bold text-zinc-300 mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono">Round #{currentRound?.roundNumber} Result</span>
            </div>

            {/* Winning Number Box */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-amber-400 border border-white/20 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.5)] my-3 transform scale-105">
              <span className="text-5xl sm:text-6xl font-black text-black font-mono tracking-wider">
                {winningNumber}
              </span>
              <span className="text-[10px] font-black bg-black text-amber-300 px-2 py-0.5 rounded-full mt-1 font-mono">
                {multiplier}x Multiplier {isHigh ? '🔥' : ''}
              </span>
            </div>

            {/* Player Outcome */}
            {playerWon ? (
              <div className="w-full mt-4 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.3)] animate-bounce">
                <div className="flex items-center justify-center gap-2 text-emerald-300 font-black text-base uppercase tracking-wider">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span>CONGRATULATIONS! YOU WON!</span>
                </div>
                <p className="text-2xl font-black text-amber-300 font-mono mt-1">
                  +{payout.toLocaleString()} Virtual Coins
                </p>
                <p className="text-[11px] text-emerald-400/80 mt-1">
                  Payout automatically settled and credited to your wallet ledger.
                </p>
              </div>
            ) : (
              <div className="w-full mt-4 p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5">
                <p className="text-sm font-bold text-zinc-200">
                  Winning Number: <span className="text-amber-400 font-mono font-black">#{winningNumber}</span> ({multiplier}x)
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Better luck next round! New round starting shortly.
                </p>
              </div>
            )}

            {/* Continue Button */}
            <button
              id="btn-continue-playing"
              onClick={dismissDrawOverlay}
              className="w-full mt-4 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-xs shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all hover:translate-y-[-1px]"
            >
              Continue Playing
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

