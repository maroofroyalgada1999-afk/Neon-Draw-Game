import React from 'react';
import {
  Coins,
  Lock,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';

export const BetControls: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const {
    currentRound,
    currentPhase,
    phaseSecondsRemaining,
    isResultPhase,
    isChartPhase,
    isBettingPhase,
    selectedNumber,
    selectedNumbers,
    userDistinctBetNumbers,
    betAmount,
    setBetAmount,
    placeBatchBets,
    placeBet,
    isPlacingBet,
    betError,
    betSuccess,
    totalBatchStake,
  } = useGame();

  const selectedNumbersArray = Array.from(selectedNumbers);
  const selectedCount = selectedNumbersArray.length;
  const totalDistinct = new Set([...userDistinctBetNumbers, ...selectedNumbers]).size;

  // Calculate potential payout range across selected numbers
  const potentialPayoutRange = React.useMemo(() => {
    if (!currentRound || selectedCount === 0) return { min: 0, max: 0 };
    let minMult = 999;
    let maxMult = 0;

    selectedNumbersArray.forEach((num) => {
      const tile = currentRound.numbers.find((n) => n.number === num);
      const mult = tile ? tile.multiplier : 2;
      if (mult < minMult) minMult = mult;
      if (mult > maxMult) maxMult = mult;
    });

    if (minMult === 999) minMult = 2;
    return {
      min: betAmount * minMult,
      max: betAmount * maxMult,
    };
  }, [currentRound, selectedCount, selectedNumbersArray, betAmount]);

  const quickChips = [10, 50, 100, 500];

  const handleChipClick = (amount: number) => {
    setBetAmount(amount);
  };

  const handleMultiply = (factor: number) => {
    setBetAmount(Math.max(10, Math.floor(betAmount * factor)));
  };

  const handleMax = () => {
    if (user && selectedCount > 0) {
      const maxPerNumber = Math.max(10, Math.floor(user.virtualBalance / selectedCount));
      setBetAmount(Math.min(10000, maxPerNumber));
    } else if (user) {
      setBetAmount(Math.min(10000, user.virtualBalance));
    }
  };

  const handleMin = () => {
    setBetAmount(10);
  };

  return (
    <div id="bet-controls-panel" className="w-full max-w-full min-w-0 box-border flex flex-col gap-4">
      {/* Betting Form & Staking Panel */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-zinc-950/60 border border-white/10 shadow-2xl backdrop-blur-md flex flex-col gap-3.5 sm:gap-4 overflow-hidden">
        {/* Selected Numbers Summary & Multiplier Display */}
        <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col gap-2 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 truncate">
              <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              {selectedCount === 1 ? 'Selected Number' : 'Selected Numbers'}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-mono font-black border shrink-0 ${
                totalDistinct >= 20
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {totalDistinct} / 20 Max
            </span>
          </div>

          {/* Single vs Multi Number Card */}
          {selectedCount === 1 && selectedNumber ? (
            (() => {
              const tile = currentRound?.numbers.find((n) => n.number === selectedNumber);
              const mult = tile ? tile.multiplier : 2;
              const isHigh = tile?.isHighMultiplier;
              return (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/80 border border-emerald-500/30 min-w-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400 shrink-0">
                      #{selectedNumber}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] sm:text-[11px] text-zinc-400 uppercase font-bold tracking-wider truncate">
                        Multiplier
                      </span>
                      <span className={`text-xs font-mono font-black ${isHigh ? 'text-amber-400 flex items-center gap-1' : 'text-emerald-400'}`}>
                        {mult}x {isHigh && '🔥 HIGH'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[9px] sm:text-[10px] text-zinc-500 uppercase font-bold">Potential Win</span>
                    <div className="text-xs sm:text-sm font-mono font-black text-emerald-400">
                      +{(betAmount * mult).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              );
            })()
          ) : selectedCount > 1 ? (
            <div className="flex items-center gap-1.5 flex-wrap max-h-24 overflow-y-auto scrollbar-thin p-1">
              {selectedNumbersArray.map((num) => {
                const tile = currentRound?.numbers.find((n) => n.number === num);
                return (
                  <span
                    key={num}
                    className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-mono font-bold border ${
                      tile?.isHighMultiplier
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-zinc-800 text-zinc-200 border-white/10'
                    }`}
                  >
                    #{num}
                    <span className="text-[9px] sm:text-[10px] text-zinc-400">{tile ? `${tile.multiplier}x` : ''}</span>
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-900/30 border border-dashed border-white/10 text-center">
              <span className="text-[11px] sm:text-xs text-zinc-500 italic">
                No number selected. Click 01–20 on the grid to choose.
              </span>
            </div>
          )}
        </div>

        {/* Stake Per Number Configuration */}
        <div className="min-w-0">
          <div className="flex justify-between items-center mb-1.5 sm:mb-2 gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 truncate">
              <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Bet Amount (Per Number)
            </label>
            <span className="text-[11px] sm:text-xs text-zinc-400 font-mono shrink-0">
              Bal: {user ? user.virtualBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </span>
          </div>

          <div className="relative">
            <input
              id="input-bet-amount"
              type="number"
              min="10"
              max="10000"
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-3 pl-3 sm:pl-4 pr-32 sm:pr-40 text-lg sm:text-xl font-mono font-black text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
            <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-1.5">
              <button
                id="btn-bet-min"
                onClick={handleMin}
                className="px-1.5 sm:px-2.5 py-1 rounded-md sm:rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] sm:text-xs font-bold font-mono transition-all"
                title="Minimum Bet (10)"
              >
                MIN
              </button>
              <button
                id="btn-bet-half"
                onClick={() => setBetAmount(Math.max(10, Math.floor(betAmount / 2)))}
                className="px-1.5 sm:px-2.5 py-1 rounded-md sm:rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] sm:text-xs font-bold font-mono transition-all"
                title="Half (1/2)"
              >
                1/2
              </button>
              <button
                id="btn-bet-double"
                onClick={() => handleMultiply(2)}
                className="px-1.5 sm:px-2.5 py-1 rounded-md sm:rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] sm:text-xs font-bold font-mono transition-all"
                title="Double (X2)"
              >
                X2
              </button>
              <button
                id="btn-bet-max"
                onClick={handleMax}
                className="px-1.5 sm:px-2.5 py-1 rounded-md sm:rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-[10px] sm:text-xs font-bold font-mono transition-all"
                title="Max Bet"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Preset Bet Amount Buttons: 10, 50, 100, 500 in one single row */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mt-2">
            {quickChips.map((chip) => (
              <button
                key={chip}
                id={`btn-preset-bet-${chip}`}
                type="button"
                onClick={() => handleChipClick(chip)}
                className={`py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-mono font-bold border transition-all text-center cursor-pointer ${
                  betAmount === chip
                    ? 'bg-amber-500 text-black border-amber-400 shadow-md font-black'
                    : 'bg-zinc-900 text-zinc-300 border-white/5 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Total Batch Calculation Summary */}
        <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-zinc-900/60 border border-white/5 space-y-1.5 sm:space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Total Bet:</span>
            <span className="font-mono font-black text-amber-400 text-xs sm:text-sm">
              {totalBatchStake.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Potential Win:</span>
            <span className="font-mono font-bold text-emerald-400 text-xs sm:text-sm truncate ml-2">
              {potentialPayoutRange.min === potentialPayoutRange.max
                ? `${potentialPayoutRange.min.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `${potentialPayoutRange.min.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} – ${potentialPayoutRange.max.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>
        </div>

        {/* Messages */}
        {betError && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{betError}</span>
          </div>
        )}

        {betSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-xs">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{betSuccess}</span>
          </div>
        )}

        {/* Main Action Button */}
        {!user ? (
          <button
            id="btn-auth-signin"
            onClick={() => openAuthModal('login')}
            className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-base shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2"
          >
            Sign In / Register to Play
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : isBettingPhase ? (
          <button
            id="btn-place-bet"
            onClick={placeBatchBets}
            disabled={isPlacingBet || selectedCount === 0}
            className={`w-full py-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 shadow-xl ${
              selectedCount === 0
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : isPlacingBet
                ? 'bg-emerald-600 text-black opacity-75 cursor-wait'
                : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-95'
            }`}
          >
            {isPlacingBet ? (
              'Placing Bet on Ledger...'
            ) : selectedCount === 0 ? (
              'PLACE BET (Select Number)'
            ) : (
              `PLACE BET (${totalBatchStake.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
            )}
          </button>
        ) : isResultPhase ? (
          <button
            id="btn-place-bet-locked"
            disabled
            className="w-full py-4 rounded-2xl bg-purple-950/80 border border-purple-500/30 text-purple-300 font-black text-sm flex items-center justify-center gap-2 cursor-not-allowed"
          >
            <Lock className="w-4 h-4" />
            Phase 1: Result Display ({phaseSecondsRemaining}s remaining)
          </button>
        ) : isChartPhase ? (
          <button
            id="btn-place-bet-locked"
            disabled
            className="w-full py-4 rounded-2xl bg-amber-950/80 border border-amber-500/30 text-amber-300 font-black text-sm flex items-center justify-center gap-2 cursor-not-allowed"
          >
            <Lock className="w-4 h-4" />
            Phase 2: Observation (Betting Opens in {phaseSecondsRemaining}s)
          </button>
        ) : (
          <button
            id="btn-place-bet-locked"
            disabled
            className="w-full py-4 rounded-2xl bg-zinc-900 border border-white/10 text-zinc-500 font-black text-sm flex items-center justify-center gap-2 cursor-not-allowed"
          >
            <Lock className="w-4 h-4" />
            Settling Round...
          </button>
        )}
      </div>
    </div>
  );
};
