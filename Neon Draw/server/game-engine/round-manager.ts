import crypto from 'crypto';
import { Database } from '../db/database.js';
import { CryptoRNG } from './rng.js';
import { WalletService } from '../services/wallet-service.js';
import { Round, Bet, GameConfig, RoundPhase, PreviousRoundResult } from '../../src/types/index.js';

export class RoundManager {
  private static instance: RoundManager;
  private db = Database.getInstance();
  private tickerInterval: NodeJS.Timeout | null = null;
  private isProcessingTransition = false;

  // Cycle constants: 15s Result + 30s Chart + 15s Betting = 60s
  public static readonly RESULT_DURATION_MS = 15000;
  public static readonly CHART_DURATION_MS = 30000;
  public static readonly BETTING_DURATION_MS = 15000;
  public static readonly TOTAL_CYCLE_MS = 60000;

  private constructor() {
    this.ensureActiveRound();
    this.startTicker();
  }

  public static getInstance(): RoundManager {
    if (!RoundManager.instance) {
      RoundManager.instance = new RoundManager();
    }
    return RoundManager.instance;
  }

  public startTicker(): void {
    if (this.tickerInterval) clearInterval(this.tickerInterval);
    this.tickerInterval = setInterval(() => {
      this.tick();
    }, 500); // 500ms ticker for sub-second precision
  }

  public stopTicker(): void {
    if (this.tickerInterval) {
      clearInterval(this.tickerInterval);
      this.tickerInterval = null;
    }
  }

  public ensureActiveRound(): Round {
    const currentId = this.db.getCurrentRoundId();
    if (currentId) {
      const existing = this.db.getRound(currentId);
      if (existing && existing.status !== 'SETTLED' && existing.status !== 'CANCELLED') {
        const now = Date.now();
        const bettingEnd = existing.bettingEnd || existing.bettingCloseTime || existing.drawTime || (existing.createdAt + 60000);
        if (now >= bettingEnd) {
          // Perform synchronous draw and settle, then create next round immediately
          this.performDrawAndSettle(existing);
          return this.createNewRound();
        }
        this.updateRoundPhase(existing);
        return existing;
      }
    }
    return this.createNewRound();
  }

  public createNewRound(): Round {
    const config = this.db.getConfig();
    const allRounds = this.db.getAllRounds(5);
    const lastSettledRound = allRounds.find((r) => r.status === 'SETTLED') || allRounds[0];
    const nextRoundNumber = lastSettledRound ? lastSettledRound.roundNumber + 1 : 1001;
    const roundId = `RND-${Date.now().toString().slice(-6)}-${nextRoundNumber}`;

    // Cryptographic server seed generation
    const serverSeed = CryptoRNG.generateServerSeed();
    const serverSeedHash = CryptoRNG.hashServerSeed(serverSeed);
    const clientSeed = CryptoRNG.generateClientSeed();
    const nonce = nextRoundNumber;

    // Authoritative 100 tiles generation with newly randomized positions:
    // Exactly 80 normal (2x-10x) and exactly 20 high (11x-20x)
    const numbers = CryptoRNG.generateMultipliers(
      config.normalMultiplierMin,
      config.normalMultiplierMax,
      config.highMultiplierMin,
      config.highMultiplierMax,
      config.normalMultiplierCount,
      config.highMultiplierCount
    );

    const now = Date.now();
    const resultDisplayStart = now;
    const resultDisplayEnd = now + RoundManager.RESULT_DURATION_MS; // +15s
    const chartStart = resultDisplayEnd;
    const chartEnd = resultDisplayEnd + RoundManager.CHART_DURATION_MS; // +30s
    const bettingStart = chartEnd;
    const bettingEnd = chartEnd + RoundManager.BETTING_DURATION_MS; // +15s
    const drawTime = bettingEnd;

    // Previous round summary for Phase 1 Result display
    let previousRoundResult: PreviousRoundResult | null = null;
    if (lastSettledRound && lastSettledRound.winningNumber) {
      const winningTile = lastSettledRound.numbers.find((n) => n.number === lastSettledRound.winningNumber);
      previousRoundResult = {
        roundId: lastSettledRound.id,
        roundNumber: lastSettledRound.roundNumber,
        winningNumber: lastSettledRound.winningNumber,
        winningMultiplier: winningTile ? winningTile.multiplier : 2,
        isHighMultiplier: winningTile ? winningTile.isHighMultiplier : false,
        totalTurnoverCoins: lastSettledRound.totalTurnoverCoins || 0,
        totalPayoutCoins: lastSettledRound.totalPayoutCoins || 0,
        settledAt: lastSettledRound.settledAt || lastSettledRound.drawTime,
      };
    } else {
      // Fallback default previous result for initial clean boot
      previousRoundResult = {
        roundId: `RND-INIT-1000`,
        roundNumber: 1000,
        winningNumber: '07',
        winningMultiplier: 15,
        isHighMultiplier: true,
        totalTurnoverCoins: 12500,
        totalPayoutCoins: 18750,
        settledAt: now - 15000,
      };
    }

    const newRound: Round & { _secretServerSeed?: string } = {
      id: roundId,
      roundNumber: nextRoundNumber,
      status: 'RESULT',
      currentPhase: 'RESULT_DISPLAY',
      createdAt: now,
      resultDisplayStart,
      resultDisplayEnd,
      chartStart,
      chartEnd,
      bettingStart,
      bettingEnd,
      drawTime,
      // Compatibility aliases
      bettingStartTime: bettingStart,
      bettingCloseTime: bettingEnd,
      numbers,
      multiplierVisibility: config.multiplierVisibility,
      winningNumber: null,
      serverSeedHash,
      clientSeed,
      nonce,
      totalBetsCount: 0,
      totalTurnoverCoins: 0,
      totalPayoutCoins: 0,
      previousRoundResult,
      _secretServerSeed: serverSeed,
    };

    this.db.saveRound(newRound as Round);
    this.db.setCurrentRoundId(roundId);
    return this.getPublicRound(newRound as Round);
  }

  /**
   * Evaluates current phase based on server timestamps
   */
  public updateRoundPhase(round: Round): void {
    if (round.status === 'SETTLED' || round.status === 'CANCELLED') return;

    const now = Date.now();
    const resultDisplayEnd = round.resultDisplayEnd || (round.createdAt + RoundManager.RESULT_DURATION_MS);
    const chartEnd = round.chartEnd || (resultDisplayEnd + RoundManager.CHART_DURATION_MS);
    const bettingEnd = round.bettingEnd || round.bettingCloseTime || round.drawTime || (chartEnd + RoundManager.BETTING_DURATION_MS);

    if (now < resultDisplayEnd) {
      if (round.currentPhase !== 'RESULT_DISPLAY') {
        round.currentPhase = 'RESULT_DISPLAY';
        round.status = 'RESULT';
        this.db.saveRound(round);
      }
    } else if (now < chartEnd) {
      if (round.currentPhase !== 'CHART_OBSERVATION') {
        round.currentPhase = 'CHART_OBSERVATION';
        round.status = 'CHART';
        this.db.saveRound(round);
      }
    } else if (now < bettingEnd) {
      if (round.currentPhase !== 'BETTING') {
        round.currentPhase = 'BETTING';
        round.status = 'OPEN';
        this.db.saveRound(round);
      }
    } else {
      // now >= bettingEnd -> Phase 4 Draw
      if (round.status !== 'DRAWING') {
        round.currentPhase = 'DRAWING';
        round.status = 'BETTING_CLOSED';
        this.db.saveRound(round);
      }
    }
  }

  /**
   * Ticks regularly to automatically advance phase transitions
   */
  private async tick(): Promise<void> {
    if (this.isProcessingTransition) return;
    const currentId = this.db.getCurrentRoundId();
    if (!currentId) {
      this.ensureActiveRound();
      return;
    }

    const round = this.db.getRound(currentId);
    if (!round) {
      this.createNewRound();
      return;
    }

    const now = Date.now();
    const bettingEnd = round.bettingEnd || round.bettingCloseTime || round.drawTime || (round.createdAt + 60000);

    // Settle immediately when betting closes (now >= bettingEnd)
    if (round.status !== 'SETTLED' && round.status !== 'CANCELLED' && now >= bettingEnd) {
      this.isProcessingTransition = true;
      try {
        await this.performDrawAndSettle(round);
        // Immediately start next round whose Phase 1 Result Display will showcase this newly settled round for 15s!
        this.createNewRound();
      } catch (err) {
        console.error('Error settling round:', err);
      } finally {
        this.isProcessingTransition = false;
      }
      return;
    }

    // Update ongoing phase
    this.updateRoundPhase(round);
  }

  /**
   * Server-authoritative draw and settlement logic
   */
  public async performDrawAndSettle(round: Round): Promise<Round> {
    const rawRound = this.db.getRound(round.id) as any;
    if (!rawRound || rawRound.status === 'SETTLED' || rawRound.status === 'CANCELLED') {
      return round;
    }

    rawRound.status = 'DRAWING';
    rawRound.currentPhase = 'DRAWING';
    this.db.saveRound(rawRound);

    // Compute winning number from Provably-Fair seeds
    const secretServerSeed = rawRound._secretServerSeed || CryptoRNG.generateServerSeed();
    const { winningNumber } = CryptoRNG.determineWinningNumber(
      secretServerSeed,
      rawRound.clientSeed,
      rawRound.nonce,
      rawRound.roundNumber
    );

    rawRound.winningNumber = winningNumber;
    rawRound.serverSeedRevealed = secretServerSeed;

    // Settle all bets placed in this round
    const bets = this.db.getBetsForRound(rawRound.id);
    let totalPayout = 0;

    for (const bet of bets) {
      if (bet.status !== 'PENDING') continue;

      const isWinner = bet.selectedNumber === winningNumber;
      bet.winningNumber = winningNumber;
      bet.settledAt = Date.now();

      if (isWinner) {
        const numberData = rawRound.numbers.find((n: any) => n.number === winningNumber);
        const assignedMultiplier = numberData ? numberData.multiplier : bet.multiplier;
        const payout = bet.betAmount * assignedMultiplier;

        bet.status = 'WON';
        bet.multiplier = assignedMultiplier;
        bet.payoutAmount = payout;
        totalPayout += payout;

        await WalletService.creditForWin({
          userId: bet.userId,
          payout,
          roundId: rawRound.id,
          betId: bet.id,
          winningNumber,
          multiplier: assignedMultiplier,
        });
      } else {
        bet.status = 'LOST';
        bet.payoutAmount = 0;
      }

      this.db.saveBet(bet);
    }

    rawRound.totalPayoutCoins = totalPayout;
    rawRound.status = 'SETTLED';
    rawRound.currentPhase = 'SETTLED';
    rawRound.settlementTime = Date.now();
    rawRound.settledAt = Date.now();

    this.db.saveRound(rawRound);
    return this.getPublicRound(rawRound);
  }

  /**
   * Places a validated single bet on the active round
   * STRICT ENFORCEMENT: Max 20 different numbers per round
   */
  public async placeBet(params: {
    userId: string;
    username: string;
    selectedNumber: string;
    betAmount: number;
    idempotencyKey?: string;
  }): Promise<{ bet: Bet; newBalance: number }> {
    const { userId, username, selectedNumber, betAmount, idempotencyKey } = params;

    if (idempotencyKey) {
      const cached = this.db.getIdempotencyResult(idempotencyKey);
      if (cached) return cached;
    }

    const currentId = this.db.getCurrentRoundId();
    if (!currentId) throw new Error('No active game round.');

    const round = this.db.getRound(currentId);
    if (!round) throw new Error('Round not found.');

    this.updateRoundPhase(round);

    const now = Date.now();
    if (round.currentPhase !== 'BETTING' || now < round.bettingStart || now >= round.bettingEnd) {
      if (round.currentPhase === 'RESULT_DISPLAY') {
        throw new Error('Betting is closed during Phase 1 (Result Display). Please wait for the betting phase.');
      }
      if (round.currentPhase === 'CHART_OBSERVATION') {
        const secsLeft = Math.max(1, Math.ceil((round.chartEnd - now) / 1000));
        throw new Error(`Betting is closed during Phase 2 (Chart Observation). Betting opens in ${secsLeft}s.`);
      }
      throw new Error('Betting is currently closed for this round.');
    }

    const config = this.db.getConfig();
    if (!config.isGameActive) throw new Error('Game is temporarily paused by admin.');

    // Validate number format "01" to "20"
    const numInt = parseInt(selectedNumber, 10);
    if (isNaN(numInt) || numInt < 1 || numInt > 20 || selectedNumber.length !== 2) {
      throw new Error('Selected number must be a two-digit string between "01" and "20".');
    }

    // Validate amount
    if (betAmount < config.minBet || betAmount > config.maxBet) {
      throw new Error(`Bet amount must be between ${config.minBet.toLocaleString()} and ${config.maxBet.toLocaleString()} coins.`);
    }

    // STRICT 20-NUMBER LIMIT PER ROUND PER USER
    const userBetsInRound = this.db.getBetsForRound(round.id).filter((b) => b.userId === userId);
    const userDistinctNumbers = new Set(userBetsInRound.map((b) => b.selectedNumber));

    if (!userDistinctNumbers.has(selectedNumber) && userDistinctNumbers.size >= 20) {
      throw new Error('Maximum limit reached: You can select a maximum of 20 DIFFERENT numbers per round. The 21st number is rejected.');
    }

    // Find assigned multiplier
    const tile = round.numbers.find((n) => n.number === selectedNumber);
    const multiplier = tile ? tile.multiplier : 2;
    const potentialPayout = betAmount * multiplier;

    const betId = `bet_${crypto.randomBytes(8).toString('hex')}`;

    // Debit user wallet atomically
    const { newBalance } = await WalletService.debitForBet({
      userId,
      amount: betAmount,
      roundId: round.id,
      betId,
      selectedNumber,
    });

    const newBet: Bet = {
      id: betId,
      roundId: round.id,
      roundNumber: round.roundNumber,
      userId,
      username,
      selectedNumber,
      betAmount,
      multiplier,
      potentialPayout,
      status: 'PENDING',
      payoutAmount: 0,
      placedAt: Date.now(),
    };

    this.db.saveBet(newBet);

    // Update round stats
    round.totalBetsCount += 1;
    round.totalTurnoverCoins += betAmount;
    this.db.saveRound(round);

    const result = { bet: newBet, newBalance };
    if (idempotencyKey) {
      this.db.setIdempotencyResult(idempotencyKey, result);
    }

    return result;
  }

  /**
   * Places multiple bets atomically in a single request (e.g. quick select 20 numbers)
   */
  public async placeBatchBets(params: {
    userId: string;
    username: string;
    bets: { selectedNumber: string; betAmount: number }[];
  }): Promise<{ placedBets: Bet[]; newBalance: number }> {
    const { userId, username, bets } = params;
    if (!bets || bets.length === 0) throw new Error('No bets provided.');

    const currentId = this.db.getCurrentRoundId();
    if (!currentId) throw new Error('No active game round.');

    const round = this.db.getRound(currentId);
    if (!round) throw new Error('Round not found.');

    this.updateRoundPhase(round);

    const now = Date.now();
    if (round.currentPhase !== 'BETTING' || now < round.bettingStart || now >= round.bettingEnd) {
      throw new Error('Betting is currently closed for this round.');
    }

    const config = this.db.getConfig();
    if (!config.isGameActive) throw new Error('Game is temporarily paused by admin.');

    // Check user's current numbers
    const userBetsInRound = this.db.getBetsForRound(round.id).filter((b) => b.userId === userId);
    const existingNumbers = new Set(userBetsInRound.map((b) => b.selectedNumber));
    const newNumbers = new Set(bets.map((b) => String(b.selectedNumber).padStart(2, '0')));
    const combinedNumbers = new Set([...existingNumbers, ...newNumbers]);

    if (combinedNumbers.size > 20) {
      throw new Error(`Maximum limit reached: Selecting these would exceed the 20-number limit (${combinedNumbers.size} total). Max 20 different numbers allowed.`);
    }

    // Check user balance for total batch amount
    const totalAmount = bets.reduce((sum, b) => sum + b.betAmount, 0);
    const user = this.db.getUserById(userId);
    if (!user || user.virtualBalance < totalAmount) {
      throw new Error(`Insufficient balance: Required ${totalAmount.toLocaleString()} coins.`);
    }

    const placedBets: Bet[] = [];
    let currentBalance = user.virtualBalance;

    for (const item of bets) {
      const formattedNum = String(item.selectedNumber).padStart(2, '0');
      const numInt = parseInt(formattedNum, 10);
      if (isNaN(numInt) || numInt < 1 || numInt > 20) continue;
      if (item.betAmount < config.minBet || item.betAmount > config.maxBet) continue;

      const tile = round.numbers.find((n) => n.number === formattedNum);
      const multiplier = tile ? tile.multiplier : 2;
      const betId = `bet_${crypto.randomBytes(8).toString('hex')}`;

      const debitRes = await WalletService.debitForBet({
        userId,
        amount: item.betAmount,
        roundId: round.id,
        betId,
        selectedNumber: formattedNum,
      });
      currentBalance = debitRes.newBalance;

      const newBet: Bet = {
        id: betId,
        roundId: round.id,
        roundNumber: round.roundNumber,
        userId,
        username,
        selectedNumber: formattedNum,
        betAmount: item.betAmount,
        multiplier,
        potentialPayout: item.betAmount * multiplier,
        status: 'PENDING',
        payoutAmount: 0,
        placedAt: Date.now(),
      };

      this.db.saveBet(newBet);
      placedBets.push(newBet);
      round.totalBetsCount += 1;
      round.totalTurnoverCoins += item.betAmount;
    }

    this.db.saveRound(round);
    return { placedBets, newBalance: currentBalance };
  }

  /**
   * Computes aggregated number-wise statistics for Phase 2 Chart
   */
  public getNumberStatsForRound(roundId: string): Record<string, { betsCount: number; totalAmount: number; potentialPayout: number }> {
    const bets = this.db.getBetsForRound(roundId);
    const round = this.db.getRound(roundId);
    const stats: Record<string, { betsCount: number; totalAmount: number; potentialPayout: number }> = {};

    // Initialize all 20 numbers ('01' to '20')
    for (let i = 1; i <= 20; i++) {
      const numStr = String(i).padStart(2, '0');
      stats[numStr] = { betsCount: 0, totalAmount: 0, potentialPayout: 0 };
    }

    if (!round) return stats;

    for (const b of bets) {
      if (stats[b.selectedNumber]) {
        stats[b.selectedNumber].betsCount += 1;
        stats[b.selectedNumber].totalAmount += b.betAmount;
        const tile = round.numbers.find((n) => n.number === b.selectedNumber);
        const mult = tile ? tile.multiplier : 2;
        stats[b.selectedNumber].potentialPayout += b.betAmount * mult;
      }
    }

    return stats;
  }

  /**
   * Admin Force Draw
   */
  public async forceDraw(): Promise<Round> {
    const currentId = this.db.getCurrentRoundId();
    if (!currentId) throw new Error('No active round.');
    const round = this.db.getRound(currentId);
    if (!round) throw new Error('Round not found.');
    if (round.status === 'SETTLED' || round.status === 'CANCELLED') {
      return this.createNewRound();
    }

    const settled = await this.performDrawAndSettle(round);
    this.createNewRound();
    return settled;
  }

  /**
   * Admin Cancel Round (Refunds all pending bets)
   */
  public async cancelRound(roundId: string, reason = 'Cancelled by administrator'): Promise<Round> {
    const round = this.db.getRound(roundId);
    if (!round) throw new Error('Round not found.');
    if (round.status === 'SETTLED') throw new Error('Cannot cancel already settled round.');

    round.status = 'CANCELLED';
    round.settledAt = Date.now();

    const bets = this.db.getBetsForRound(round.id);
    for (const bet of bets) {
      if (bet.status === 'PENDING') {
        bet.status = 'REFUNDED';
        await WalletService.refundBet({
          userId: bet.userId,
          amount: bet.betAmount,
          roundId: round.id,
          betId: bet.id,
          reason,
        });
        this.db.saveBet(bet);
      }
    }

    this.db.saveRound(round);
    return this.getPublicRound(round);
  }

  /**
   * Sanitizes secret server seed before sending round to public clients
   */
  public getPublicRound(round: Round): Round {
    const { _secretServerSeed, ...publicRound } = round as any;
    if (publicRound.status !== 'SETTLED') {
      delete publicRound.serverSeedRevealed;
    }
    // Attach current number stats for Phase 2 Chart
    publicRound.numberStats = this.getNumberStatsForRound(round.id);
    return publicRound;
  }
}

