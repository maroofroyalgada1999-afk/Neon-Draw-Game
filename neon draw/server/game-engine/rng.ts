import crypto from 'crypto';
import { GameNumber } from '../../src/types/index.js';

export class CryptoRNG {
  /**
   * Generates a 32-byte cryptographically secure server seed
   */
  public static generateServerSeed(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Computes SHA-256 hash of server seed for public pre-commitment
   */
  public static hashServerSeed(serverSeed: string): string {
    return crypto.createHash('sha256').update(serverSeed).digest('hex');
  }

  /**
   * Generates a random client seed string
   */
  public static generateClientSeed(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Determines the authoritative winning number ("01" to "20") using Provably Fair HMAC-SHA256
   */
  public static determineWinningNumber(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    roundNumber: number
  ): { winningNumber: string; hmacHex: string } {
    const message = `${clientSeed}:${nonce}:${roundNumber}`;
    const hmacHex = crypto
      .createHmac('sha256', serverSeed)
      .update(message)
      .digest('hex');

    // Take first 8 hex chars (32-bit unsigned integer)
    const subHex = hmacHex.substring(0, 8);
    const decimalValue = parseInt(subHex, 16);
    const numberIndex = (decimalValue % 20) + 1; // 1 to 20

    const winningNumber = String(numberIndex).padStart(2, '0');
    return { winningNumber, hmacHex };
  }

  /**
   * Verifies if a given winning number matches the seeds and nonce
   */
  public static verifyResult(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    roundNumber: number,
    expectedWinningNumber: string
  ): boolean {
    const { winningNumber } = this.determineWinningNumber(
      serverSeed,
      clientSeed,
      nonce,
      roundNumber
    );
    return winningNumber === expectedWinningNumber;
  }

  /**
   * Generates a cryptographically random integer in range [min, max] inclusive
   */
  public static randomInt(min: number, max: number): number {
    const range = max - min + 1;
    const bytesNeeded = 4;
    const maxUint32 = 0xffffffff;
    const limit = maxUint32 - (maxUint32 % range);

    let randomValue: number;
    do {
      randomValue = crypto.randomBytes(bytesNeeded).readUInt32BE(0);
    } while (randomValue >= limit);

    return min + (randomValue % range);
  }

  /**
   * Generates the authoritative 20-number grid ("01" through "20") with randomized mixed multipliers (2x to 20x).
   * Ensures high variety across every new round with high multipliers (11x-20x) shifting dynamically.
   */
  public static generateMultipliers(
    normalMin: number = 2,
    normalMax: number = 10,
    highMin: number = 11,
    highMax: number = 20,
    normalCount: number = 14,
    highCount: number = 6
  ): GameNumber[] {
    // Step 1: Create 20 base number strings "01" through "20"
    const allNumbers: string[] = [];
    for (let i = 1; i <= 20; i++) {
      allNumbers.push(String(i).padStart(2, '0'));
    }

    // Step 2: Randomly determine how many high multiplier numbers this round (e.g. 4 to 7 out of 20)
    const targetHighCount = Math.max(2, Math.min(10, highCount || 6));
    const highIndices = new Set<number>();
    while (highIndices.size < targetHighCount) {
      const idx = this.randomInt(0, 19);
      highIndices.add(idx);
    }

    // Step 3: Populate each number with its designated randomized multiplier
    const gameNumbers: GameNumber[] = [];
    for (let i = 0; i < 20; i++) {
      const numStr = allNumbers[i];
      const isHigh = highIndices.has(i);
      const multiplier = isHigh
        ? this.randomInt(highMin, highMax)
        : this.randomInt(normalMin, normalMax);

      gameNumbers.push({
        number: numStr,
        multiplier,
        isHighMultiplier: isHigh || multiplier >= 11,
      });
    }

    return gameNumbers;
  }
}
