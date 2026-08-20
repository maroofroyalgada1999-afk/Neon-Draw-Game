import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Round, Bet, RoundPhase, PreviousRoundResult } from '../types/index';
import { api } from '../services/api';
import { sounds } from '../services/sound';
import { useAuth } from './AuthContext';

interface GameContextType {
  currentRound: Round | null;
  serverTimeOffset: number;
  currentPhase: RoundPhase;
  phaseSecondsRemaining: number;
  // Authoritative phase flags
  isResultPhase: boolean;
  isChartPhase: boolean;
  isBettingPhase: boolean;
  isDrawing: boolean;
  isSettled: boolean;
  // Selection mode & multi-number selection (strictly max 20 different numbers)
  selectionMode: 'single' | 'multi';
  setSelectionMode: (mode: 'single' | 'multi') => void;
  selectedNumber: string | null;
  selectedNumbers: Set<string>;
  userBetsInCurrentRound: Bet[];
  userDistinctBetNumbers: Set<string>;
  totalBatchStake: number;
  betAmount: number; // per number
  isPlacingBet: boolean;
  betError: string | null;
  betSuccess: string | null;
  // Previous round result & player outcome
  previousRoundResult: PreviousRoundResult | null;
  userPreviousResult: {
    won: boolean;
    winningNumber: string;
    winningMultiplier: number;
    payout: number;
    totalBet: number;
  } | null;
  lastSettledResult: {
    won: boolean;
    winningNumber: string;
    winningMultiplier: number;
    payout: number;
    totalBet: number;
  } | null;
  showDrawOverlay: boolean;
  dismissDrawOverlay: () => void;
  // Live aggregated number stats
  numberStats: Record<string, { betsCount: number; totalAmount: number; potentialPayout: number }>;
  recentRoundBets: { id: string; username: string; selectedNumber: string; betAmount: number; placedAt: number }[];
  // Actions
  setSelectedNumber: (num: string | null) => void;
  toggleNumberSelection: (num: string) => void;
  clearSelection: () => void;
  quickSelectRandom: (count: number) => void;
  quickSelectHighMultipliers: () => void;
  setBetAmount: (amount: number) => void;
  placeBet: () => Promise<void>;
  placeBatchBets: () => Promise<void>;
  refreshRound: () => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, openAuthModal, updateUserBalanceDirectly } = useAuth();
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);
  const [userBetsInCurrentRound, setUserBetsInCurrentRound] = useState<Bet[]>([]);
  const [recentRoundBets, setRecentRoundBets] = useState<
    { id: string; username: string; selectedNumber: string; betAmount: number; placedAt: number }[]
  >([]);

  // Selection mode: 'single' or 'multi' (up to 20)
  const [selectionMode, setSelectionMode] = useState<'single' | 'multi'>('single');
  const [selectedNumber, setSelectedNumberState] = useState<string | null>('07');
  const [selectedNumbers, setSelectedNumbers] = useState<Set<string>>(new Set(['07']));
  const [betAmount, setBetAmountState] = useState<number>(50);
  const [isPlacingBet, setIsPlacingBet] = useState<boolean>(false);
  const [betError, setBetError] = useState<string | null>(null);
  const [betSuccess, setBetSuccess] = useState<string | null>(null);

  // Authoritative phase timing
  const [currentPhase, setCurrentPhase] = useState<RoundPhase>('RESULT_DISPLAY');
  const [phaseSecondsRemaining, setPhaseSecondsRemaining] = useState<number>(15);

  const [previousRoundResult, setPreviousRoundResult] = useState<PreviousRoundResult | null>(null);
  const [userPreviousResult, setUserPreviousResult] = useState<{
    won: boolean;
    winningNumber: string;
    winningMultiplier: number;
    payout: number;
    totalBet: number;
  } | null>(null);
  const [showDrawOverlay, setShowDrawOverlay] = useState<boolean>(false);

  const dismissDrawOverlay = useCallback(() => {
    setShowDrawOverlay(false);
  }, []);

  const lastSettledResult = userPreviousResult;

  const lastObservedPhase = useRef<RoundPhase | null>(null);
  const celebratedRounds = useRef<Set<string>>(new Set());

  // Derive distinct bet numbers already committed by the player in current round
  const userDistinctBetNumbers = React.useMemo(() => {
    return new Set(userBetsInCurrentRound.map((b) => b.selectedNumber));
  }, [userBetsInCurrentRound]);

  const totalBatchStake = selectedNumbers.size * betAmount;

  const numberStats = currentRound?.numberStats || {};

  const refreshRound = useCallback(async () => {
    try {
      const data = await api.getCurrentRound();
      const now = Date.now();
      setServerTimeOffset(data.serverTime - now);
      setCurrentRound(data.round);
      setUserBetsInCurrentRound(data.userBets || []);
      setRecentRoundBets(data.recentRoundBets || []);

      if (data.round) {
        const round = data.round;

        // Set previous round result
        if (round.previousRoundResult) {
          setPreviousRoundResult(round.previousRoundResult);
        }

        // Detect phase transition
        if (round.currentPhase !== lastObservedPhase.current) {
          lastObservedPhase.current = round.currentPhase;
          if (round.currentPhase === 'BETTING') {
            sounds.playSelect();
          }
        }

        // If newly entered Result Display phase, check previous round outcome
        if (round.currentPhase === 'RESULT_DISPLAY' && round.previousRoundResult) {
          const prev = round.previousRoundResult;
          if (!celebratedRounds.current.has(prev.roundId)) {
            celebratedRounds.current.add(prev.roundId);

            // Fetch user history to check if user won in previous round
            api.getMyBets().then((res) => {
              const prevBets = res.bets.filter((b) => b.roundId === prev.roundId);
              if (prevBets.length > 0) {
                const winningBet = prevBets.find((b) => b.selectedNumber === prev.winningNumber);
                const totalBet = prevBets.reduce((sum, b) => sum + b.betAmount, 0);
                const payout = winningBet ? winningBet.payoutAmount || winningBet.betAmount * prev.winningMultiplier : 0;
                const won = Boolean(winningBet);

                setUserPreviousResult({
                  won,
                  winningNumber: prev.winningNumber,
                  winningMultiplier: prev.winningMultiplier,
                  payout,
                  totalBet,
                });

                if (won) {
                  sounds.playWin();
                  try {
                    confetti({
                      particleCount: 120,
                      spread: 80,
                      origin: { y: 0.5 },
                    });
                  } catch {
                    // canvas confetti safe fallback
                  }
                } else {
                  sounds.playLoss();
                }
              } else {
                setUserPreviousResult(null);
              }
            }).catch(() => {});
          }
        }
      }
    } catch (err) {
      // Handled silently to prevent console log flooding during network switches or reloads
    }
  }, []);

  // Poll server round every 1 second
  useEffect(() => {
    refreshRound();
    const interval = setInterval(() => {
      refreshRound();
    }, 1000);
    return () => clearInterval(interval);
  }, [refreshRound]);

  // Precise local ticker for server-authoritative countdown
  useEffect(() => {
    const timer = setInterval(() => {
      if (!currentRound) return;
      const now = Date.now() + serverTimeOffset;

      if (now < currentRound.resultDisplayEnd) {
        setCurrentPhase('RESULT_DISPLAY');
        const secs = Math.max(0, Math.ceil((currentRound.resultDisplayEnd - now) / 1000));
        setPhaseSecondsRemaining(secs);
      } else if (now < currentRound.chartEnd) {
        setCurrentPhase('CHART_OBSERVATION');
        const secs = Math.max(0, Math.ceil((currentRound.chartEnd - now) / 1000));
        setPhaseSecondsRemaining(secs);
      } else if (now < currentRound.bettingEnd) {
        setCurrentPhase('BETTING');
        const secs = Math.max(0, Math.ceil((currentRound.bettingEnd - now) / 1000));
        setPhaseSecondsRemaining(secs);
        if (secs <= 3 && secs > 0) {
          sounds.playTick(secs === 1);
        }
      } else {
        setCurrentPhase('DRAWING');
        setPhaseSecondsRemaining(0);
      }
    }, 250);

    return () => clearInterval(timer);
  }, [currentRound, serverTimeOffset]);

  const isResultPhase = currentPhase === 'RESULT_DISPLAY';
  const isChartPhase = currentPhase === 'CHART_OBSERVATION';
  const isBettingPhase = currentPhase === 'BETTING' && phaseSecondsRemaining > 0;
  const isDrawing = currentPhase === 'DRAWING';
  const isSettled = currentRound?.status === 'SETTLED';

  // Toggle number selection:
  // In 'single' mode: clicking 42 selects 42; clicking 17 removes 42 and selects 17; clicking 17 again deselects 17
  // In 'multi' mode: toggles numbers in the set, enforcing strict 20-number maximum limit
  const toggleNumberSelection = useCallback(
    (numStr: string) => {
      const formatted = numStr.padStart(2, '0');
      setBetError(null);
      setBetSuccess(null);

      if (selectionMode === 'single') {
        if (selectedNumber === formatted) {
          // Deselect
          setSelectedNumberState(null);
          setSelectedNumbers(new Set());
        } else {
          // Switch selection to new number
          setSelectedNumberState(formatted);
          setSelectedNumbers(new Set([formatted]));
        }
        sounds.playSelect();
        return;
      }

      // Multi-select mode
      setSelectedNumbers((prev) => {
        const next = new Set(prev);
        if (next.has(formatted)) {
          next.delete(formatted);
          if (selectedNumber === formatted) {
            const remaining = Array.from(next);
            setSelectedNumberState(remaining.length > 0 ? remaining[0] : null);
          }
        } else {
          // Check limit: combined selected + existing placed bets cannot exceed 20
          const combined = new Set([...userDistinctBetNumbers, ...next, formatted]);
          if (combined.size > 20) {
            setBetError('Maximum 20 different numbers allowed in this round. The 21st number is rejected.');
            sounds.playLoss();
            return prev;
          }
          next.add(formatted);
          setSelectedNumberState(formatted);
        }
        sounds.playSelect();
        return next;
      });
    },
    [selectionMode, selectedNumber, userDistinctBetNumbers]
  );

  const setSelectedNumber = useCallback(
    (numStr: string | null) => {
      setBetError(null);
      setBetSuccess(null);
      if (!numStr) {
        setSelectedNumberState(null);
        setSelectedNumbers(new Set());
        return;
      }
      const formatted = numStr.padStart(2, '0');
      setSelectedNumberState(formatted);
      setSelectedNumbers(new Set([formatted]));
      sounds.playSelect();
    },
    []
  );

  const clearSelection = useCallback(() => {
    setSelectedNumbers(new Set());
    setSelectedNumberState(null);
    setBetError(null);
    setBetSuccess(null);
  }, []);

  const quickSelectRandom = useCallback(
    (count: number) => {
      setBetError(null);
      setBetSuccess(null);
      setSelectionMode('multi');
      const limit = Math.min(20, count);
      const chosen = new Set<string>();

      // Preserve existing placed bets if any
      userDistinctBetNumbers.forEach((n) => chosen.add(n));

      while (chosen.size < limit) {
        const rand = (Math.floor(Math.random() * 20) + 1)
          .toString()
          .padStart(2, '0');
        chosen.add(rand);
      }

      setSelectedNumbers(chosen);
      const first = Array.from(chosen)[0];
      setSelectedNumberState(first || null);
      sounds.playSelect();
    },
    [userDistinctBetNumbers]
  );

  const quickSelectHighMultipliers = useCallback(() => {
    if (!currentRound) return;
    setBetError(null);
    setBetSuccess(null);
    setSelectionMode('multi');
    const highNumbers = currentRound.numbers.filter((n) => n.isHighMultiplier).map((n) => n.number);
    // Take up to 20
    const chosen = new Set(highNumbers.slice(0, 20));
    setSelectedNumbers(chosen);
    if (chosen.size > 0) {
      setSelectedNumberState(Array.from(chosen)[0]);
    }
    sounds.playSelect();
  }, [currentRound]);

  const setBetAmount = useCallback((amt: number) => {
    setBetAmountState(amt);
    setBetError(null);
    setBetSuccess(null);
  }, []);

  // Place bets on all currently selected numbers (up to 20)
  const placeBatchBets = async () => {
    setBetError(null);
    setBetSuccess(null);

    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!isBettingPhase) {
      if (isResultPhase) {
        setBetError('Betting is closed during Phase 1 (Result Display).');
      } else if (isChartPhase) {
        setBetError(`Betting is closed during Phase 2 (Observation). Opens in ${phaseSecondsRemaining}s.`);
      } else {
        setBetError('Betting is closed for this round.');
      }
      return;
    }

    const numbersToBet: string[] = Array.from(selectedNumbers);
    if (numbersToBet.length === 0) {
      setBetError('Please select at least 1 number from the grid (max 20).');
      return;
    }

    if (numbersToBet.length > 20) {
      setBetError('Maximum 20 different numbers allowed per round.');
      return;
    }

    if (betAmount <= 0) {
      setBetError('Please enter a valid bet amount per number.');
      return;
    }

    const totalRequired = numbersToBet.length * betAmount;
    if (user.virtualBalance < totalRequired) {
      setBetError(`Insufficient virtual coins. Required ${totalRequired.toLocaleString()} coins, you have ${user.virtualBalance.toLocaleString()}.`);
      return;
    }

    setIsPlacingBet(true);
    try {
      const betsPayload: { selectedNumber: string; betAmount: number }[] = numbersToBet.map((num: string) => ({
        selectedNumber: num,
        betAmount,
      }));

      const res = await api.placeBatchBets({ bets: betsPayload });
      updateUserBalanceDirectly(res.newBalance);
      sounds.playBet();
      setBetSuccess(
        `Successfully placed ${numbersToBet.length} bets (${totalRequired.toLocaleString()} Coins total)!`
      );
      await refreshRound();
    } catch (err: any) {
      setBetError(err.message || 'Failed to place bets.');
    } finally {
      setIsPlacingBet(false);
    }
  };

  // Place bet on the primary selected number
  const placeBet = async () => {
    if (selectedNumbers.size > 1) {
      return await placeBatchBets();
    }

    setBetError(null);
    setBetSuccess(null);

    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!isBettingPhase) {
      if (isResultPhase) {
        setBetError('Betting is closed during Phase 1 (Result Display).');
      } else if (isChartPhase) {
        setBetError(`Betting is closed during Phase 2 (Observation). Opens in ${phaseSecondsRemaining}s.`);
      } else {
        setBetError('Betting is closed for this round.');
      }
      return;
    }

    if (!selectedNumber) {
      setBetError('Please select a number from 01 to 20 first.');
      return;
    }

    if (betAmount <= 0) {
      setBetError('Please enter a valid bet amount.');
      return;
    }

    if (user.virtualBalance < betAmount) {
      setBetError(`Insufficient virtual coins. You have ${user.virtualBalance.toLocaleString()} coins.`);
      return;
    }

    setIsPlacingBet(true);
    try {
      const idempotencyKey = `bet_idem_${user.id}_${currentRound?.id}_${selectedNumber}_${Date.now()}`;
      const res = await api.placeBet({
        selectedNumber,
        betAmount,
        idempotencyKey,
      });

      updateUserBalanceDirectly(res.newBalance);
      sounds.playBet();
      setBetSuccess(`Bet placed: ${betAmount.toLocaleString()} Coins on #${selectedNumber}`);
      await refreshRound();
    } catch (err: any) {
      setBetError(err.message || 'Failed to place bet.');
    } finally {
      setIsPlacingBet(false);
    }
  };

  return (
    <GameContext.Provider
      value={{
        currentRound,
        serverTimeOffset,
        currentPhase,
        phaseSecondsRemaining,
        isResultPhase,
        isChartPhase,
        isBettingPhase,
        isDrawing,
        isSettled,
        selectionMode,
        setSelectionMode,
        selectedNumber,
        selectedNumbers,
        userBetsInCurrentRound,
        userDistinctBetNumbers,
        totalBatchStake,
        betAmount,
        isPlacingBet,
        betError,
        betSuccess,
        previousRoundResult,
        userPreviousResult,
        lastSettledResult,
        showDrawOverlay,
        dismissDrawOverlay,
        numberStats,
        recentRoundBets,
        setSelectedNumber,
        toggleNumberSelection,
        clearSelection,
        quickSelectRandom,
        quickSelectHighMultipliers,
        setBetAmount,
        placeBet,
        placeBatchBets,
        refreshRound,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

