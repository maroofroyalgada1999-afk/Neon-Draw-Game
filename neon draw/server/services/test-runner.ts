import { CryptoRNG } from '../game-engine/rng.js';
import { Database } from '../db/database.js';
import { RoundManager } from '../game-engine/round-manager.js';
import { WalletService } from './wallet-service.js';

export interface TestResultItem {
  id: string;
  name: string;
  category: 'GAME_ENGINE' | 'WALLET_LEDGER' | 'PROVABLY_FAIR' | 'SECURITY' | 'INTEGRATION';
  status: 'PASSED' | 'FAILED';
  durationMs: number;
  message: string;
  details?: any;
}

export interface TestSuiteReport {
  timestamp: number;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  durationMs: number;
  results: TestResultItem[];
}

export class TestRunner {
  public static async runAllTests(): Promise<TestSuiteReport> {
    const startOverall = Date.now();
    const results: TestResultItem[] = [];

    // --- TEST 1: Exactly 20 Numbers Generation (01 to 20) ---
    {
      const start = Date.now();
      try {
        const tiles = CryptoRNG.generateMultipliers();
        const uniqueSet = new Set(tiles.map((t) => t.number));
        const allFormattedCorrectly = tiles.every((t) => /^[0-9]{2}$/.test(t.number) && parseInt(t.number, 10) >= 1 && parseInt(t.number, 10) <= 20);

        if (tiles.length !== 20) {
          throw new Error(`Expected 20 tiles, got ${tiles.length}`);
        }
        if (uniqueSet.size !== 20) {
          throw new Error(`Expected 20 unique numbers, got ${uniqueSet.size}`);
        }
        if (!allFormattedCorrectly) {
          throw new Error('Not all numbers are padded 2-digit strings (01-20)');
        }

        results.push({
          id: 'test_20_numbers',
          name: 'Grid 01-20 Complete Generation',
          category: 'GAME_ENGINE',
          status: 'PASSED',
          durationMs: Date.now() - start,
          message: 'Generated exactly 20 distinct numbers from "01" to "20" without duplicates.',
        });
      } catch (err: any) {
        results.push({
          id: 'test_20_numbers',
          name: 'Grid 01-20 Complete Generation',
          category: 'GAME_ENGINE',
          status: 'FAILED',
          durationMs: Date.now() - start,
          message: err.message,
        });
      }
    }

    // --- TEST 2: Multiplier Range 2x to 20x ---
    {
      const start = Date.now();
      try {
        const tiles = CryptoRNG.generateMultipliers();
        const allValid = tiles.every((t) => t.multiplier >= 2 && t.multiplier <= 20);

        if (tiles.length !== 20) {
          throw new Error(`Expected 20 tiles, got ${tiles.length}`);
        }
        if (!allValid) {
          throw new Error('Multiplier values outside expected range (2x-20x)');
        }

        results.push({
          id: 'test_multiplier_dist',
          name: 'Multiplier Distribution (2x to 20x)',
          category: 'GAME_ENGINE',
          status: 'PASSED',
          durationMs: Date.now() - start,
          message: 'All 20 numbers verified with mixed multipliers between 2x and 20x.',
        });
      } catch (err: any) {
        results.push({
          id: 'test_multiplier_dist',
          name: 'Multiplier Distribution (2x to 20x)',
          category: 'GAME_ENGINE',
          status: 'FAILED',
          durationMs: Date.now() - start,
          message: err.message,
        });
      }
    }

    // --- TEST 3: Provably Fair Cryptographic Verification ---
    {
      const start = Date.now();
      try {
        const serverSeed = CryptoRNG.generateServerSeed();
        const serverHash = CryptoRNG.hashServerSeed(serverSeed);
        const clientSeed = 'test_client_seed_abc123';
        const nonce = 42;
        const roundNumber = 1001;

        const { winningNumber, hmacHex } = CryptoRNG.determineWinningNumber(
          serverSeed,
          clientSeed,
          nonce,
          roundNumber
        );

        const isValid = CryptoRNG.verifyResult(
          serverSeed,
          clientSeed,
          nonce,
          roundNumber,
          winningNumber
        );

        if (!isValid) {
          throw new Error('Provably fair verification failed for generated result');
        }

        results.push({
          id: 'test_provably_fair',
          name: 'Provably Fair HMAC-SHA256 Result Integrity',
          category: 'PROVABLY_FAIR',
          status: 'PASSED',
          durationMs: Date.now() - start,
          message: `Result #${winningNumber} verified against HMAC ${hmacHex.slice(0, 12)}...`,
        });
      } catch (err: any) {
        results.push({
          id: 'test_provably_fair',
          name: 'Provably Fair HMAC-SHA256 Result Integrity',
          category: 'PROVABLY_FAIR',
          status: 'FAILED',
          durationMs: Date.now() - start,
          message: err.message,
        });
      }
    }

    // --- TEST 4: Atomic Wallet Ledger & Non-Negative Balance Guard ---
    {
      const start = Date.now();
      try {
        const db = Database.getInstance();
        let testUser = db.getUserById('usr_test_wallet_agent');
        if (!testUser) {
          testUser = {
            id: 'usr_test_wallet_agent',
            name: 'Wallet Test Agent',
            username: 'test_wallet_agent',
            email: 'test_wallet@example.com',
            role: 'PLAYER',
            virtualBalance: 500,
            isActive: true,
            riskScore: 0,
            createdAt: Date.now(),
            lastLoginAt: Date.now(),
            passwordHash: 'hash',
            salt: 'salt',
          };
          db.saveUser(testUser);
        } else {
          testUser.virtualBalance = 500;
          db.saveUser(testUser);
        }

        // Attempt bet of 100 (should succeed)
        const debitResult = await WalletService.debitForBet({
          userId: testUser.id,
          amount: 100,
          roundId: 'RND_TEST_001',
          betId: 'BET_TEST_001',
          selectedNumber: '07',
        });

        if (debitResult.newBalance !== 400) {
          throw new Error(`Expected balance 400, got ${debitResult.newBalance}`);
        }

        // Attempt bet of 500 (exceeds balance of 400, must throw)
        let errorCaught = false;
        try {
          await WalletService.debitForBet({
            userId: testUser.id,
            amount: 500,
            roundId: 'RND_TEST_001',
            betId: 'BET_TEST_002',
            selectedNumber: '07',
          });
        } catch {
          errorCaught = true;
        }

        if (!errorCaught) {
          throw new Error('Wallet allowed debit exceeding available balance!');
        }

        results.push({
          id: 'test_wallet_balance_guard',
          name: 'Atomic Wallet Balance & Negative Prevention',
          category: 'WALLET_LEDGER',
          status: 'PASSED',
          durationMs: Date.now() - start,
          message: 'Atomic debit and overdraft protection verified in ledger.',
        });
      } catch (err: any) {
        results.push({
          id: 'test_wallet_balance_guard',
          name: 'Atomic Wallet Balance & Negative Prevention',
          category: 'WALLET_LEDGER',
          status: 'FAILED',
          durationMs: Date.now() - start,
          message: err.message,
        });
      }
    }

    // --- TEST 5: Idempotency & Double Settlement Guard ---
    {
      const start = Date.now();
      try {
        const roundManager = RoundManager.getInstance();
        const currentRound = roundManager.ensureActiveRound();

        // Check that placing bet with same idempotency key returns identical result without double debit
        const key = `idem_test_${Date.now()}`;
        const res1 = await roundManager.placeBet({
          userId: 'usr_demo_player',
          username: 'demo_player',
          selectedNumber: '07',
          betAmount: 10,
          idempotencyKey: key,
        });

        const balanceAfterFirst = res1.newBalance;

        const res2 = await roundManager.placeBet({
          userId: 'usr_demo_player',
          username: 'demo_player',
          selectedNumber: '07',
          betAmount: 10,
          idempotencyKey: key,
        });

        if (res1.bet.id !== res2.bet.id) {
          throw new Error('Idempotency failed: generated different bet IDs');
        }
        if (res2.newBalance !== balanceAfterFirst) {
          throw new Error('Idempotency failed: double debited user balance');
        }

        results.push({
          id: 'test_idempotency',
          name: 'Idempotency Key & Replay Attack Defense',
          category: 'SECURITY',
          status: 'PASSED',
          durationMs: Date.now() - start,
          message: 'Idempotent requests safely returned identical response without duplicate balance modification.',
        });
      } catch (err: any) {
        results.push({
          id: 'test_idempotency',
          name: 'Idempotency Key & Replay Attack Defense',
          category: 'SECURITY',
          status: 'FAILED',
          durationMs: Date.now() - start,
          message: err.message,
        });
      }
    }

    const passedCount = results.filter((r) => r.status === 'PASSED').length;
    const failedCount = results.filter((r) => r.status === 'FAILED').length;

    return {
      timestamp: Date.now(),
      totalTests: results.length,
      passedCount,
      failedCount,
      durationMs: Date.now() - startOverall,
      results,
    };
  }
}
