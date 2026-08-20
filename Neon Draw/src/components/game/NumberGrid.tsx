import React, { useState, useMemo } from 'react';
import { Sparkles, Flame, Filter, CheckCircle2, Shuffle, Trash2, ShieldAlert } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { GameNumber } from '../../types/index';

export const NumberGrid: React.FC = () => {
  const {
    currentRound,
    selectionMode,
    setSelectionMode,
    selectedNumber,
    selectedNumbers,
    toggleNumberSelection,
    clearSelection,
    quickSelectRandom,
    quickSelectHighMultipliers,
    userDistinctBetNumbers,
    isBettingPhase,
    isChartPhase,
    isResultPhase,
    betError,
  } = useGame();

  const [filterMode, setFilterMode] = useState<string>('ALL');

  const numbers: GameNumber[] = useMemo(() => {
    if (!currentRound || !currentRound.numbers || currentRound.numbers.length === 0) {
      return Array.from({ length: 20 }, (_, i) => ({
        number: String(i + 1).padStart(2, '0'),
        multiplier: 2,
        isHighMultiplier: false,
      }));
    }
    return currentRound.numbers;
  }, [currentRound]);

  // Filtered numbers
  const filteredNumbers = useMemo(() => {
    if (filterMode === 'ALL') return numbers;
    if (filterMode === 'HIGH') return numbers.filter((n) => n.isHighMultiplier || n.multiplier >= 11);
    if (filterMode === 'SELECTED') return numbers.filter((n) => selectedNumbers.has(n.number) || userDistinctBetNumbers.has(n.number));
    return numbers;
  }, [numbers, filterMode, selectedNumbers, userDistinctBetNumbers]);

  const filterTabs = [
    { id: 'ALL', label: 'All 20' },
    { id: 'HIGH', label: '11x–20x 🔥', isHigh: true },
    { id: 'SELECTED', label: `My Selected (${selectedNumbers.size})` },
  ];

  const totalDistinct = new Set([...userDistinctBetNumbers, ...selectedNumbers]).size;

  return (
    <div id="number-grid-container" className="w-full max-w-full min-w-0 box-border bg-zinc-950/50 border border-white/5 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-2xl backdrop-blur-sm overflow-hidden">
      {/* Header with Quick Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-3 sm:pb-4 border-b border-white/5 mb-2.5 sm:mb-3.5">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)] shrink-0">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h2 className="text-xs sm:text-base font-black text-white tracking-tight uppercase">
                01–20 Grid
              </h2>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-black border ${
                  totalDistinct >= 20
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {totalDistinct} / 20 Selected
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-zinc-400 font-medium truncate">
              Click numbers to select (strictly max 20 per round)
            </p>
          </div>
        </div>

        {/* Quick Batch & Selection Mode Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          {/* Mode Switcher */}
          <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg sm:rounded-xl border border-white/10 mr-0.5 sm:mr-1">
            <button
              id="mode-single-pick"
              onClick={() => setSelectionMode('single')}
              className={`px-2 py-1 rounded-md sm:rounded-lg text-[10px] sm:text-[11px] font-bold transition-all ${
                selectionMode === 'single'
                  ? 'bg-emerald-500 text-black font-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Single
            </button>
            <button
              id="mode-multi-pick"
              onClick={() => setSelectionMode('multi')}
              className={`px-2 py-1 rounded-md sm:rounded-lg text-[10px] sm:text-[11px] font-bold transition-all ${
                selectionMode === 'multi'
                  ? 'bg-emerald-500 text-black font-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Multi (≤20)
            </button>
          </div>

          <button
            id="btn-pick-10"
            onClick={() => quickSelectRandom(10)}
            className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 flex items-center gap-1 transition-all"
            title="Randomly pick 10 numbers"
          >
            <Shuffle className="w-3 h-3 text-cyan-400" />
            Pick 10
          </button>
          <button
            id="btn-pick-20"
            onClick={() => quickSelectRandom(20)}
            className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 flex items-center gap-1 transition-all"
            title="Select all 20 numbers"
          >
            <Shuffle className="w-3 h-3 text-emerald-400" />
            All 20
          </button>
          <button
            id="btn-pick-high"
            onClick={quickSelectHighMultipliers}
            className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 transition-all"
            title="Select high-multiplier numbers (11x-20x)"
          >
            <Flame className="w-3 h-3 text-amber-400" />
            High (11x+)
          </button>
          {selectedNumbers.size > 0 && (
            <button
              id="btn-clear-selection"
              onClick={clearSelection}
              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-bold bg-zinc-900 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-300 border border-white/10 flex items-center gap-1 transition-all"
              title="Clear current selection"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter Badges */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2.5 scrollbar-thin min-w-0 max-w-full">
        <Filter className="w-3.5 h-3.5 text-zinc-500 hidden sm:block mr-0.5 shrink-0" />
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            id={`filter-tab-${tab.id}`}
            onClick={() => setFilterMode(tab.id)}
            className={`px-3 py-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              filterMode === tab.id
                ? tab.isHigh
                  ? 'bg-amber-500 text-black font-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                  : 'bg-emerald-500 text-black font-black shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* The 20 Numbers Grid: Exactly 5 columns × 4 rows */}
      <div
        id="tiles-matrix"
        className="grid grid-cols-5 gap-1.5 sm:gap-2.5 p-0.5"
      >
        {filteredNumbers.map((tile) => {
          const isSelected = selectedNumbers.has(tile.number);
          const hasUserPlacedBet = userDistinctBetNumbers.has(tile.number);
          const isHigh = tile.isHighMultiplier || tile.multiplier >= 11;

          return (
            <button
              key={tile.number}
              id={`tile-${tile.number}`}
              onClick={() => toggleNumberSelection(tile.number)}
              className={`relative group flex flex-col items-center justify-center p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl border transition-all duration-150 transform active:scale-95 min-w-0 cursor-pointer ${
                isSelected
                  ? 'bg-emerald-500 border-white/30 ring-2 ring-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-105 z-10 text-black font-black'
                  : hasUserPlacedBet
                  ? 'bg-cyan-950/60 border-cyan-400/80 shadow-md text-cyan-300 ring-1 ring-cyan-500/40'
                  : isHigh
                  ? 'bg-zinc-900/90 border-amber-500/40 hover:border-amber-400/90 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-zinc-900/70 border-white/10 hover:border-white/30'
              }`}
            >
              {/* Has Already Placed Bet Tag */}
              {hasUserPlacedBet && (
                <span className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-cyan-400 text-black text-[8px] sm:text-[9px] font-black flex items-center justify-center shadow-md">
                  ✓
                </span>
              )}

              {/* Number Display */}
              <span
                className={`text-sm sm:text-base md:text-lg font-black tracking-wider font-mono transition-colors ${
                  isSelected
                    ? 'text-black font-black'
                    : hasUserPlacedBet
                    ? 'text-cyan-300 font-black'
                    : isHigh
                    ? 'text-amber-400 group-hover:text-amber-300'
                    : 'text-zinc-200 group-hover:text-white'
                }`}
              >
                {tile.number}
              </span>

              {/* Multiplier Tag */}
              <div
                className={`mt-0.5 px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold flex items-center gap-0.5 tracking-tight font-mono ${
                  isSelected
                    ? 'text-black/90 font-black bg-black/10'
                    : isHigh
                    ? 'text-amber-400 font-extrabold bg-amber-500/10 border border-amber-500/30'
                    : 'text-zinc-400 bg-zinc-800/60'
                }`}
              >
                <span>{tile.multiplier}x</span>
                {isHigh && !isSelected && <Flame className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Info / Limit Alert */}
      <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-mono text-[10px] sm:text-xs">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400/80 inline-block shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
            11x–20x (High)
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[10px] sm:text-xs">
            <span className="w-2.5 h-2.5 rounded-sm bg-zinc-600 inline-block"></span>
            2x–10x (Normal)
          </span>
        </div>

        <div className="text-[10px] sm:text-[11px] font-mono text-zinc-400">
          Max 20 numbers per player per round
        </div>
      </div>
    </div>
  );
};
