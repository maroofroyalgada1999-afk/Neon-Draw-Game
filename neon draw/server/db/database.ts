import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Session,
  Round,
  Bet,
  WalletTransaction,
  AuditLog,
  SecurityEvent,
  GameConfig,
  AdminRole,
  SupportTicket,
  DepositTransaction,
  WithdrawalRequest,
  PlayerNotification,
  KYCRecord,
  Promotion,
  ScratchCardReward,
  isValid20NumberRound,
} from '../../src/types/index.js';

interface UserRecord extends User {
  passwordHash: string;
  salt: string;
}

interface DBData {
  users: Record<string, UserRecord>;
  sessions: Record<string, Session>;
  rounds: Record<string, Round>;
  bets: Record<string, Bet>;
  walletLedger: WalletTransaction[];
  depositTransactions: Record<string, DepositTransaction>;
  withdrawalRequests: Record<string, WithdrawalRequest>;
  notifications: Record<string, PlayerNotification>;
  kycRecords: Record<string, KYCRecord>;
  promotions: Record<string, Promotion>;
  scratchCards: Record<string, ScratchCardReward>;
  auditLogs: AuditLog[];
  securityEvents: SecurityEvent[];
  supportTickets: Record<string, SupportTicket>;
  config: GameConfig;
  currentRoundId: string | null;
  idempotencyKeys: Record<string, { result: any; expiresAt: number }>;
  utrIndex: Record<string, { depositId: string; userId: string; timestamp: number }>;
}

export class Database {
  private static instance: Database;
  private data: DBData;
  private dbFilePath: string;
  private saveTimeout: NodeJS.Timeout | null = null;
  private userLocks: Map<string, Promise<void>> = new Map();
  private utrLocks: Map<string, Promise<void>> = new Map();
  private otpStore: Map<string, { code: string; expiresAt: number; attempts: number; lastSentAt: number }> = new Map();

  private constructor() {
    const dataDir = path.join(process.cwd(), '.data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (err) {
        console.warn('Could not create .data directory, running pure in-memory:', err);
      }
    }
    this.dbFilePath = path.join(dataDir, 'db.json');
    this.data = this.loadInitialData();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private getDefaultConfig(): GameConfig {
    return {
      minBet: 10,
      maxBet: 10000,
      roundDurationSeconds: 45,
      bettingCloseBufferSeconds: 5, // 5s before draw, betting locks
      drawAnimationSeconds: 6, // 6s duration for countdown and number reveal
      multiplierVisibility: 'PUBLIC',
      normalMultiplierMin: 2,
      normalMultiplierMax: 10,
      highMultiplierMin: 11,
      highMultiplierMax: 20,
      normalMultiplierCount: 14,
      highMultiplierCount: 6,
      defaultStartingCoins: 1000,
      isGameActive: true,
      provablyFairEnabled: true,
    };
  }

  private getDefaultPromotions(): Record<string, Promotion> {
    return {
      promo_welcome_100: {
        id: 'promo_welcome_100',
        title: '100% Welcome Match Bonus',
        code: 'NEON100',
        description: 'Double your initial deposit with a 100% match bonus credited directly to your gaming wallet.',
        bonusAmount: 500,
        matchPercentage: 100,
        minDeposit: 100,
        eligibility: 'All new & active verified players',
        terms: [
          'Applicable on eligible wallet deposits',
          'Instant balance credit upon activation',
          'Standard fair play and anti-abuse verification rules apply',
        ],
        startDate: Date.now() - 86400000 * 7,
        endDate: Date.now() + 86400000 * 90,
        isActive: true,
        claimedByUserIds: [],
      },
      promo_streak_bonus: {
        id: 'promo_streak_bonus',
        title: 'Daily Arena Login Boost',
        code: 'DAILY50',
        description: 'Claim your daily loyalty reward of ₹50 every 24 hours to keep your gameplay momentum going.',
        bonusAmount: 50,
        eligibility: 'All registered platform members',
        terms: [
          'Claimable once every 24 hours per account',
          'Directly added to game balance ledger',
        ],
        startDate: Date.now() - 86400000 * 14,
        endDate: Date.now() + 86400000 * 180,
        isActive: true,
        claimedByUserIds: [],
      },
      promo_high_mult: {
        id: 'promo_high_mult',
        title: 'High-Multiplier 20x Shield',
        code: 'NEONSHIELD',
        description: 'Special ₹200 booster bonus dedicated to high multiplier (11x-20x) number enthusiasts.',
        bonusAmount: 200,
        eligibility: 'Players with at least 5 rounds played',
        terms: [
          'One-time claim per account',
          'Can be utilized across all 01–20 numbers',
        ],
        startDate: Date.now() - 86400000 * 3,
        endDate: Date.now() + 86400000 * 60,
        isActive: true,
        claimedByUserIds: [],
      },
    };
  }

  private loadInitialData(): DBData {
    if (fs.existsSync(this.dbFilePath)) {
      try {
        const raw = fs.readFileSync(this.dbFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        // Ensure config has all default properties and migrated 20-number arena limits
        parsed.config = { ...this.getDefaultConfig(), ...(parsed.config || {}) };
        parsed.config.normalMultiplierCount = 14;
        parsed.config.highMultiplierCount = 6;
        if (!parsed.depositTransactions) parsed.depositTransactions = {};
        if (!parsed.withdrawalRequests) parsed.withdrawalRequests = {};
        if (!parsed.notifications) parsed.notifications = {};
        if (!parsed.kycRecords) parsed.kycRecords = {};
        if (!parsed.scratchCards) parsed.scratchCards = {};
        if (!parsed.utrIndex) parsed.utrIndex = {};
        if (!parsed.promotions || Object.keys(parsed.promotions).length === 0) {
          parsed.promotions = this.getDefaultPromotions();
        }
        // Ensure all users have country, currency, and referralCode
        if (parsed.users) {
          Object.values(parsed.users as Record<string, UserRecord>).forEach((u) => {
            u.country = u.country || 'IN';
            u.currency = u.currency || 'INR';
            if (!u.referralCode) {
              u.referralCode = `ND99-${u.id.slice(-6).toUpperCase()}`;
            }
          });
        }
        // Clean up legacy rounds containing invalid count or numbers
        if (parsed.rounds) {
          for (const [id, r] of Object.entries(parsed.rounds as Record<string, Round>)) {
            if (!isValid20NumberRound(r)) {
              delete parsed.rounds[id];
            }
          }
        }
        if (parsed.currentRoundId && (!parsed.rounds || !parsed.rounds[parsed.currentRoundId])) {
          parsed.currentRoundId = null;
        }
        return parsed;
      } catch (err) {
        console.warn('Failed to parse existing db.json, initializing fresh store:', err);
      }
    }

    const initialData: DBData = {
      users: {},
      sessions: {},
      rounds: {},
      bets: {},
      walletLedger: [],
      depositTransactions: {},
      withdrawalRequests: {},
      notifications: {},
      kycRecords: {},
      promotions: this.getDefaultPromotions(),
      scratchCards: {},
      auditLogs: [],
      securityEvents: [],
      supportTickets: {},
      config: this.getDefaultConfig(),
      currentRoundId: null,
      idempotencyKeys: {},
      utrIndex: {},
    };

    // Helper to seed users
    const createAdminRecord = (
      id: string,
      name: string,
      username: string,
      email: string,
      adminRole: AdminRole,
      pass: string
    ): UserRecord => {
      const salt = crypto.randomBytes(16).toString('hex');
      return {
        id,
        name,
        username,
        email,
        country: 'IN',
        currency: 'INR',
        referralCode: `ND99-${id.slice(-6).toUpperCase()}`,
        role: 'ADMIN',
        adminRole,
        virtualBalance: 100000,
        isActive: true,
        riskScore: 0,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
        passwordHash: this.hashPassword(pass, salt),
        salt,
      };
    };

    // Seed 4 Role-Specific Admins
    const superAdmin = createAdminRecord('usr_admin_master', 'System Super Admin', 'admin', 'admin@neondraw.admin', 'SUPER_ADMIN', 'AdminSecret2026!');
    const gameAdmin = createAdminRecord('usr_admin_game', 'Game Operator Admin', 'game_admin', 'game@neondraw.admin', 'GAME_ADMIN', 'GameSecret2026!');
    const supportAdmin = createAdminRecord('usr_admin_support', 'Support Desk Admin', 'support_admin', 'support@neondraw.admin', 'SUPPORT_ADMIN', 'SupportSecret2026!');
    const auditor = createAdminRecord('usr_admin_auditor', 'Compliance Auditor', 'auditor', 'auditor@neondraw.admin', 'AUDITOR', 'AuditorSecret2026!');

    initialData.users[superAdmin.id] = superAdmin;
    initialData.users[gameAdmin.id] = gameAdmin;
    initialData.users[supportAdmin.id] = supportAdmin;
    initialData.users[auditor.id] = auditor;

    // Seed demo Player account
    const demoSalt = crypto.randomBytes(16).toString('hex');
    const demoPassHash = this.hashPassword('DemoPass123!', demoSalt);
    const demoUser: UserRecord = {
      id: 'usr_demo_player',
      name: 'Demo Player',
      username: 'demo_player',
      email: 'demo@neondraw.game',
      country: 'IN',
      currency: 'INR',
      referralCode: 'ND99-DEMO99',
      role: 'PLAYER',
      virtualBalance: 1000,
      isActive: true,
      riskScore: 0,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      passwordHash: demoPassHash,
      salt: demoSalt,
    };
    initialData.users[demoUser.id] = demoUser;

    // Seed initial ledger record for demo player
    initialData.walletLedger.push({
      id: 'tx_seed_demo_001',
      userId: demoUser.id,
      type: 'REGISTRATION_BONUS',
      amount: 1000,
      balanceBefore: 0,
      balanceAfter: 1000,
      description: 'Welcome virtual bonus (1,000 coins)',
      timestamp: Date.now(),
      status: 'COMPLETED',
    });

    // Seed initial support tickets
    const ticket1: SupportTicket = {
      id: 'tkt_101',
      userId: demoUser.id,
      name: demoUser.name,
      username: demoUser.username,
      email: demoUser.email,
      subject: 'Inquiry regarding 60s round phases',
      category: 'GAMEPLAY',
      message: 'Hello, could you explain how the 15s result and 30s observation phases transition to betting?',
      status: 'RESOLVED',
      priority: 'LOW',
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 1800000,
      adminReply: 'Each round strictly follows 15s Result Announcement -> 30s Multiplier Chart Observation -> 15s Final Betting -> Instant Draw.',
      assignedAdmin: 'support_admin',
    };

    const ticket2: SupportTicket = {
      id: 'tkt_102',
      userId: demoUser.id,
      name: demoUser.name,
      username: demoUser.username,
      email: demoUser.email,
      subject: 'Question on multiplier distribution',
      category: 'RULES',
      message: 'Are high multipliers (11x-20x) fixed at 20 numbers each round?',
      status: 'OPEN',
      priority: 'MEDIUM',
      createdAt: Date.now() - 900000,
      updatedAt: Date.now() - 900000,
    };

    initialData.supportTickets[ticket1.id] = ticket1;
    initialData.supportTickets[ticket2.id] = ticket2;

    return initialData;
  }

  public hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  }

  public async acquireUserLock<T>(userId: string, fn: () => Promise<T>): Promise<T> {
    const existingLock = this.userLocks.get(userId) || Promise.resolve();
    let releaseLock: () => void = () => {};
    const nextLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    this.userLocks.set(userId, existingLock.then(() => nextLock));

    try {
      await existingLock;
      return await fn();
    } finally {
      releaseLock();
      if (this.userLocks.get(userId) === nextLock) {
        this.userLocks.delete(userId);
      }
    }
  }

  public async acquireUtrLock<T>(utr: string, fn: () => Promise<T>): Promise<T> {
    const cleanUtr = utr.trim().toLowerCase();
    const existingLock = this.utrLocks.get(cleanUtr) || Promise.resolve();
    let releaseLock: () => void = () => {};
    const nextLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    this.utrLocks.set(cleanUtr, existingLock.then(() => nextLock));

    try {
      await existingLock;
      return await fn();
    } finally {
      releaseLock();
      if (this.utrLocks.get(cleanUtr) === nextLock) {
        this.utrLocks.delete(cleanUtr);
      }
    }
  }

  public schedulePersist(): void {
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      try {
        const tmpFile = `${this.dbFilePath}.tmp`;
        fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf8');
        fs.renameSync(tmpFile, this.dbFilePath);
      } catch (err) {
        console.error('Error persisting database file:', err);
      }
    }, 200);
  }

  // --- Users ---
  public getUserById(id: string): UserRecord | null {
    return this.data.users[id] ? { ...this.data.users[id] } : null;
  }

  public getUserByUsernameOrEmail(identifier: string): UserRecord | null {
    const clean = identifier.trim().toLowerCase();
    for (const u of Object.values(this.data.users)) {
      if (u.username.toLowerCase() === clean || u.email.toLowerCase() === clean) {
        return { ...u };
      }
    }
    return null;
  }

  public getUserByEmail(email: string): UserRecord | null {
    if (!email) return null;
    const clean = email.trim().toLowerCase();
    for (const u of Object.values(this.data.users)) {
      if (u.email && u.email.toLowerCase() === clean) {
        return { ...u };
      }
    }
    return null;
  }

  public getUserByPhone(phone: string): UserRecord | null {
    if (!phone) return null;
    const clean = phone.replace(/[^0-9]/g, '').slice(-10);
    if (!clean) return null;
    for (const u of Object.values(this.data.users)) {
      if (u.phoneNumber && u.phoneNumber.replace(/[^0-9]/g, '').slice(-10) === clean) {
        return { ...u };
      }
    }
    return null;
  }

  public getUserByReferralCode(code: string): UserRecord | null {
    if (!code) return null;
    const clean = code.trim().toUpperCase();
    for (const u of Object.values(this.data.users)) {
      if (u.referralCode && u.referralCode.trim().toUpperCase() === clean) {
        return { ...u };
      }
      // Also match account ID alias
      const idAlias = `ND99-${u.id.slice(-6).toUpperCase()}`;
      if (idAlias === clean) {
        return { ...u };
      }
    }
    return null;
  }

  public generateUniqueReferralCode(username: string): string {
    const cleanUser = (username || 'ND').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3);
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
    let code = `ND99-${cleanUser}${suffix}`.slice(0, 11);
    let attempts = 0;
    while (this.getUserByReferralCode(code) && attempts < 20) {
      const rnd = crypto.randomBytes(3).toString('hex').toUpperCase();
      code = `ND99-${rnd}`;
      attempts++;
    }
    return code;
  }

  public getUserBySocialId(provider: 'GOOGLE' | 'FACEBOOK', socialId: string): UserRecord | null {
    if (!socialId) return null;
    for (const u of Object.values(this.data.users)) {
      if (u.authProvider === provider && u.socialId === socialId) {
        return { ...u };
      }
    }
    return null;
  }

  public getAllUsers(): User[] {
    return Object.values(this.data.users).map((u) => {
      const { passwordHash, salt, ...safeUser } = u;
      return safeUser;
    });
  }

  public saveUser(user: UserRecord): void {
    this.data.users[user.id] = { ...user };
    this.schedulePersist();
  }

  // --- Sessions ---
  public getSession(token: string): Session | null {
    const s = this.data.sessions[token];
    if (!s) return null;
    if (Date.now() > s.expiresAt) {
      delete this.data.sessions[token];
      this.schedulePersist();
      return null;
    }
    return { ...s };
  }

  public saveSession(session: Session): void {
    this.data.sessions[session.token] = { ...session };
    this.schedulePersist();
  }

  public deleteSession(token: string): void {
    delete this.data.sessions[token];
    this.schedulePersist();
  }

  public getUserSessions(userId: string): Session[] {
    const now = Date.now();
    return Object.values(this.data.sessions).filter(
      (s) => s.userId === userId && s.expiresAt > now
    );
  }

  public deleteAllUserSessionsExcept(userId: string, currentToken: string): void {
    for (const [token, s] of Object.entries(this.data.sessions)) {
      if (s.userId === userId && token !== currentToken) {
        delete this.data.sessions[token];
      }
    }
    this.schedulePersist();
  }

  // --- Rounds ---
  public getRound(id: string): Round | null {
    const r = this.data.rounds[id];
    if (!r || !isValid20NumberRound(r)) return null;
    return { ...r };
  }

  public getCurrentRoundId(): string | null {
    const id = this.data.currentRoundId;
    if (!id) return null;
    const r = this.data.rounds[id];
    if (!r || !isValid20NumberRound(r)) {
      this.data.currentRoundId = null;
      return null;
    }
    return id;
  }

  public setCurrentRoundId(id: string): void {
    this.data.currentRoundId = id;
    this.schedulePersist();
  }

  public saveRound(round: Round): void {
    this.data.rounds[round.id] = { ...round };
    this.schedulePersist();
  }

  public getAllRounds(limit = 50): Round[] {
    return Object.values(this.data.rounds)
      .filter((r) => isValid20NumberRound(r))
      .sort((a, b) => b.roundNumber - a.roundNumber)
      .slice(0, limit);
  }

  // --- Bets ---
  public getBet(id: string): Bet | null {
    return this.data.bets[id] ? { ...this.data.bets[id] } : null;
  }

  public saveBet(bet: Bet): void {
    this.data.bets[bet.id] = { ...bet };
    this.schedulePersist();
  }

  public getBetsForRound(roundId: string): Bet[] {
    return Object.values(this.data.bets).filter((b) => b.roundId === roundId);
  }

  public getUserBets(userId: string, limit = 100): Bet[] {
    return Object.values(this.data.bets)
      .filter((b) => b.userId === userId)
      .sort((a, b) => b.placedAt - a.placedAt)
      .slice(0, limit);
  }

  public getAllBets(limit = 100): Bet[] {
    return Object.values(this.data.bets)
      .sort((a, b) => b.placedAt - a.placedAt)
      .slice(0, limit);
  }

  // --- Wallet Ledger ---
  public addWalletTransaction(tx: WalletTransaction): void {
    this.data.walletLedger.push(tx);
    this.schedulePersist();
  }

  public getUserWalletTransactions(userId: string, limit = 100): WalletTransaction[] {
    return this.data.walletLedger
      .filter((t) => t.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  public getAllWalletTransactions(limit = 200): WalletTransaction[] {
    return [...this.data.walletLedger]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // --- Audit Logs ---
  public addAuditLog(log: AuditLog): void {
    this.data.auditLogs.push(log);
    this.schedulePersist();
  }

  public getAuditLogs(limit = 100): AuditLog[] {
    return [...this.data.auditLogs]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // --- Security Events ---
  public addSecurityEvent(event: SecurityEvent): void {
    this.data.securityEvents.push(event);
    this.schedulePersist();
  }

  public getSecurityEvents(limit = 100): SecurityEvent[] {
    return [...this.data.securityEvents]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // --- Game Config ---
  public getConfig(): GameConfig {
    return { ...this.data.config };
  }

  public updateConfig(newConfig: Partial<GameConfig>): GameConfig {
    this.data.config = { ...this.data.config, ...newConfig };
    this.schedulePersist();
    return { ...this.data.config };
  }

  // --- Support Tickets ---
  public addSupportTicket(ticket: SupportTicket): void {
    if (!this.data.supportTickets) this.data.supportTickets = {};
    this.data.supportTickets[ticket.id] = { ...ticket };
    this.schedulePersist();
  }

  public getSupportTicketById(id: string): SupportTicket | null {
    if (!this.data.supportTickets) return null;
    return this.data.supportTickets[id] ? { ...this.data.supportTickets[id] } : null;
  }

  public getAllSupportTickets(limit = 100): SupportTicket[] {
    if (!this.data.supportTickets) return [];
    return Object.values(this.data.supportTickets)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  public getUserSupportTickets(userId: string): SupportTicket[] {
    if (!this.data.supportTickets) return [];
    return Object.values(this.data.supportTickets)
      .filter((t) => t.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  public updateSupportTicket(id: string, update: Partial<SupportTicket>): SupportTicket | null {
    if (!this.data.supportTickets || !this.data.supportTickets[id]) return null;
    this.data.supportTickets[id] = {
      ...this.data.supportTickets[id],
      ...update,
      updatedAt: Date.now(),
    };
    this.schedulePersist();
    return { ...this.data.supportTickets[id] };
  }

  // --- Deposits ---
  public saveDepositTransaction(tx: DepositTransaction): void {
    if (!this.data.depositTransactions) this.data.depositTransactions = {};
    this.data.depositTransactions[tx.id] = { ...tx };
    if (tx.utrNumber) {
      const clean = tx.utrNumber.trim().toLowerCase();
      if (!this.data.utrIndex) this.data.utrIndex = {};
      this.data.utrIndex[clean] = {
        depositId: tx.id,
        userId: tx.userId,
        timestamp: tx.utrSubmittedAt || tx.createdAt,
      };
    }
    this.schedulePersist();
  }

  public getDepositTransaction(id: string): DepositTransaction | null {
    if (!this.data.depositTransactions) return null;
    return this.data.depositTransactions[id] ? { ...this.data.depositTransactions[id] } : null;
  }

  public getUserDeposits(userId: string, limit = 50): DepositTransaction[] {
    if (!this.data.depositTransactions) return [];
    return Object.values(this.data.depositTransactions)
      .filter((d) => d.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  public getAllDepositTransactions(limit = 200): DepositTransaction[] {
    if (!this.data.depositTransactions) return [];
    return Object.values(this.data.depositTransactions)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  public getDepositByUtr(utrNumber: string): DepositTransaction | null {
    if (!utrNumber || !this.data.depositTransactions) return null;
    const clean = utrNumber.trim().toLowerCase();
    
    // Check index first
    if (this.data.utrIndex && this.data.utrIndex[clean]) {
      const depId = this.data.utrIndex[clean].depositId;
      const dep = this.data.depositTransactions[depId];
      if (dep) return { ...dep };
    }

    // Direct scan fallback
    for (const dep of Object.values(this.data.depositTransactions)) {
      if (dep.utrNumber && dep.utrNumber.trim().toLowerCase() === clean) {
        return { ...dep };
      }
    }
    return null;
  }

  public isUtrUsed(utrNumber: string, excludeDepositId?: string): boolean {
    if (!utrNumber) return false;
    const clean = utrNumber.trim().toLowerCase();

    // Check UTR index
    if (this.data.utrIndex && this.data.utrIndex[clean]) {
      const record = this.data.utrIndex[clean];
      if (!excludeDepositId || record.depositId !== excludeDepositId) {
        // If the deposit was rejected or cancelled, it might be freed up, otherwise it's used
        const dep = this.data.depositTransactions?.[record.depositId];
        if (dep && dep.status !== 'REJECTED' && dep.status !== 'CANCELLED' && dep.status !== 'EXPIRED') {
          return true;
        }
      }
    }

    // Scan all active deposits for safety
    if (this.data.depositTransactions) {
      for (const dep of Object.values(this.data.depositTransactions)) {
        if (excludeDepositId && dep.id === excludeDepositId) continue;
        if (dep.utrNumber && dep.utrNumber.trim().toLowerCase() === clean) {
          if (dep.status === 'SUCCESS' || dep.status === 'VERIFYING' || dep.status === 'PENDING') {
            return true;
          }
        }
      }
    }

    return false;
  }

  public registerUtr(utrNumber: string, depositId: string, userId: string): void {
    if (!utrNumber) return;
    const clean = utrNumber.trim().toLowerCase();
    if (!this.data.utrIndex) this.data.utrIndex = {};
    this.data.utrIndex[clean] = {
      depositId,
      userId,
      timestamp: Date.now(),
    };
    this.schedulePersist();
  }

  public releaseUtr(utrNumber: string): void {
    if (!utrNumber || !this.data.utrIndex) return;
    const clean = utrNumber.trim().toLowerCase();
    delete this.data.utrIndex[clean];
    this.schedulePersist();
  }

  // --- Withdrawals ---
  public saveWithdrawalRequest(req: WithdrawalRequest): void {
    if (!this.data.withdrawalRequests) this.data.withdrawalRequests = {};
    this.data.withdrawalRequests[req.id] = { ...req };
    this.schedulePersist();
  }

  public getWithdrawalRequest(id: string): WithdrawalRequest | null {
    if (!this.data.withdrawalRequests) return null;
    return this.data.withdrawalRequests[id] ? { ...this.data.withdrawalRequests[id] } : null;
  }

  public getUserWithdrawals(userId: string, limit = 50): WithdrawalRequest[] {
    if (!this.data.withdrawalRequests) return [];
    return Object.values(this.data.withdrawalRequests)
      .filter((w) => w.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  public getAllWithdrawals(limit = 100): WithdrawalRequest[] {
    if (!this.data.withdrawalRequests) return [];
    return Object.values(this.data.withdrawalRequests)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  // --- Notifications ---
  public addNotification(notification: PlayerNotification): void {
    if (!this.data.notifications) this.data.notifications = {};
    this.data.notifications[notification.id] = { ...notification };
    this.schedulePersist();
  }

  public getUserNotifications(userId: string, limit = 50): PlayerNotification[] {
    if (!this.data.notifications) return [];
    return Object.values(this.data.notifications)
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  public markNotificationRead(id: string, userId: string): boolean {
    if (!this.data.notifications || !this.data.notifications[id]) return false;
    if (this.data.notifications[id].userId !== userId) return false;
    this.data.notifications[id].isRead = true;
    this.schedulePersist();
    return true;
  }

  public markAllNotificationsRead(userId: string): number {
    if (!this.data.notifications) return 0;
    let count = 0;
    Object.values(this.data.notifications).forEach((n) => {
      if (n.userId === userId && !n.isRead) {
        n.isRead = true;
        count++;
      }
    });
    if (count > 0) this.schedulePersist();
    return count;
  }

  // --- KYC ---
  public getKYCRecord(userId: string): KYCRecord | null {
    if (!this.data.kycRecords) return null;
    return this.data.kycRecords[userId] ? { ...this.data.kycRecords[userId] } : null;
  }

  public saveKYCRecord(kyc: KYCRecord): void {
    if (!this.data.kycRecords) this.data.kycRecords = {};
    this.data.kycRecords[kyc.userId] = { ...kyc };
    this.schedulePersist();
  }

  // --- Promotions ---
  public getAllPromotions(): Promotion[] {
    if (!this.data.promotions) return [];
    return Object.values(this.data.promotions);
  }

  public getPromotionById(id: string): Promotion | null {
    if (!this.data.promotions) return null;
    return this.data.promotions[id] ? { ...this.data.promotions[id] } : null;
  }

  public claimPromotion(promoId: string, userId: string): Promotion | null {
    if (!this.data.promotions || !this.data.promotions[promoId]) return null;
    const promo = this.data.promotions[promoId];
    if (!promo.claimedByUserIds) promo.claimedByUserIds = [];
    if (!promo.claimedByUserIds.includes(userId)) {
      promo.claimedByUserIds.push(userId);
      this.schedulePersist();
    }
    return { ...promo };
  }

  // --- User Profile & Preferences ---
  public updateUserProfile(userId: string, update: Partial<User>): UserRecord | null {
    const user = this.data.users[userId];
    if (!user) return null;
    // Disallow overriding critical security attributes directly
    const { id: _, role: __, virtualBalance: ___, riskScore: ____, passwordHash: _____, salt: ______, ...allowedUpdates } = update as any;
    Object.assign(user, allowedUpdates);
    this.schedulePersist();
    return { ...user };
  }

  public changeUserPassword(userId: string, oldPasswordPlainText: string, newPasswordPlainText: string): { success: boolean; error?: string } {
    const user = this.data.users[userId];
    if (!user) return { success: false, error: 'User not found.' };

    const calculatedOldHash = this.hashPassword(oldPasswordPlainText, user.salt);
    if (calculatedOldHash !== user.passwordHash) {
      return { success: false, error: 'Current password is incorrect.' };
    }

    if (newPasswordPlainText.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    const newSalt = crypto.randomBytes(16).toString('hex');
    user.salt = newSalt;
    user.passwordHash = this.hashPassword(newPasswordPlainText, newSalt);
    this.schedulePersist();
    return { success: true };
  }

  // --- Scratch Cards System ---
  public getScratchCardsByUserId(userId: string): ScratchCardReward[] {
    if (!this.data.scratchCards) return [];
    return Object.values(this.data.scratchCards)
      .filter((card) => card.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  public getScratchCardById(cardId: string): ScratchCardReward | null {
    if (!this.data.scratchCards) return null;
    return this.data.scratchCards[cardId] ? { ...this.data.scratchCards[cardId] } : null;
  }

  public saveScratchCard(card: ScratchCardReward): void {
    if (!this.data.scratchCards) this.data.scratchCards = {};
    this.data.scratchCards[card.id] = { ...card };
    this.schedulePersist();
  }

  public createWelcomeScratchCard(userId: string): ScratchCardReward {
    if (!this.data.scratchCards) this.data.scratchCards = {};
    // Check if welcome scratch card already exists for user
    const existing = Object.values(this.data.scratchCards).find(
      (c) => c.userId === userId && c.type === 'WELCOME'
    );
    if (existing) {
      return { ...existing };
    }

    // Generate random integer between 50 and 100 inclusive
    const amount = 50 + Math.floor(Math.random() * 51);
    const cardId = `sc_wel_${crypto.randomBytes(6).toString('hex')}`;
    const card: ScratchCardReward = {
      id: cardId,
      userId,
      type: 'WELCOME',
      title: 'Welcome Scratch Card',
      amount,
      isRevealed: false,
      isClaimed: false,
      createdAt: Date.now(),
    };

    this.data.scratchCards[card.id] = card;
    this.schedulePersist();
    return { ...card };
  }

  public createReferralScratchCard(
    referrerUserId: string,
    referredUserId: string,
    referredUsername: string
  ): ScratchCardReward {
    if (!this.data.scratchCards) this.data.scratchCards = {};
    // Check if referral card already created for this pair
    const existing = Object.values(this.data.scratchCards).find(
      (c) => c.userId === referrerUserId && c.referralUserId === referredUserId && c.type === 'REFERRAL'
    );
    if (existing) {
      return { ...existing };
    }

    const cardId = `sc_ref_${crypto.randomBytes(6).toString('hex')}`;
    const card: ScratchCardReward = {
      id: cardId,
      userId: referrerUserId,
      type: 'REFERRAL',
      title: 'Referral Scratch Reward',
      amount: 100, // Fixed 100 Coins for referral
      isRevealed: false,
      isClaimed: false,
      referralUserId: referredUserId,
      referralUsername: referredUsername,
      createdAt: Date.now(),
    };

    this.data.scratchCards[card.id] = card;
    this.schedulePersist();
    return { ...card };
  }

  public async claimScratchCard(userId: string, cardId: string): Promise<{ card: ScratchCardReward; newBalance: number }> {
    return this.acquireUserLock(userId, async () => {
      const card = this.data.scratchCards?.[cardId];
      if (!card) {
        throw new Error('Scratch card not found.');
      }
      if (card.userId !== userId) {
        throw new Error('Unauthorized scratch card claim.');
      }
      if (card.isClaimed) {
        throw new Error('This scratch card reward has already been claimed.');
      }

      const user = this.data.users[userId];
      if (!user) {
        throw new Error('User not found.');
      }

      const now = Date.now();
      const prevBalance = user.virtualBalance;
      const nextBalance = prevBalance + card.amount;

      // Update card state
      card.isClaimed = true;
      card.isRevealed = true;
      card.claimedAt = now;

      // Update user wallet balance
      user.virtualBalance = nextBalance;
      this.data.users[userId] = user;

      // Create Ledger Entry
      const txType = card.type === 'WELCOME' ? 'WELCOME_SCRATCH_REWARD' : 'REFERRAL_SCRATCH_REWARD';
      const txDescription =
        card.type === 'WELCOME'
          ? `Welcome Scratch Card Reward (+${card.amount} Coins / ₹${card.amount})`
          : `Referral Scratch Card Reward (+${card.amount} Coins / ₹${card.amount} from @${card.referralUsername || 'player'})`;

      this.addWalletTransaction({
        id: `tx_sc_${crypto.randomBytes(8).toString('hex')}`,
        userId,
        type: txType,
        amount: card.amount,
        balanceBefore: prevBalance,
        balanceAfter: nextBalance,
        description: txDescription,
        timestamp: now,
        status: 'COMPLETED',
      });

      // Send confirmation notification
      this.addNotification({
        id: `notif_${crypto.randomBytes(8).toString('hex')}`,
        userId,
        type: 'PROMOTION',
        title: '🎉 Scratch Reward Credited!',
        message: `+${card.amount} Coins (₹${card.amount}) credited to your wallet balance successfully.`,
        isRead: false,
        createdAt: now,
      });

      this.schedulePersist();
      return { card: { ...card }, newBalance: nextBalance };
    });
  }

  // --- Mobile OTP Verification System (Server-Side) ---
  public sendMobileOtp(rawPhone: string): { success: boolean; phone: string; cooldownSeconds: number; testOtpCode: string } {
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      throw new Error('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
    }

    const now = Date.now();
    const existing = this.otpStore.get(cleanPhone);

    if (existing && existing.lastSentAt && now - existing.lastSentAt < 30000) {
      const wait = Math.ceil((30000 - (now - existing.lastSentAt)) / 1000);
      throw new Error(`OTP already sent. Please wait ${wait} seconds before requesting a new code.`);
    }

    // Generate 6-digit numeric OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpStore.set(cleanPhone, {
      code,
      expiresAt: now + 5 * 60 * 1000, // 5 minutes validity
      attempts: 0,
      lastSentAt: now,
    });

    return {
      success: true,
      phone: `+91 ${cleanPhone}`,
      cooldownSeconds: 30,
      testOtpCode: code, // returned for verification preview and testing
    };
  }

  public verifyMobileOtp(rawPhone: string, code: string): boolean {
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '').slice(-10);
    const cleanCode = (code || '').trim();

    if (!cleanPhone || !cleanCode) return false;
    const item = this.otpStore.get(cleanPhone);
    if (!item) return false;

    if (Date.now() > item.expiresAt) {
      this.otpStore.delete(cleanPhone);
      return false;
    }

    item.attempts += 1;
    if (item.attempts > 5) {
      this.otpStore.delete(cleanPhone);
      return false;
    }

    if (item.code === cleanCode) {
      this.otpStore.delete(cleanPhone);
      return true;
    }

    return false;
  }

  // --- Server-Side Promo Code System ---
  public validatePromoCode(rawCode: string, userId?: string): { valid: boolean; bonusAmount: number; title: string; promoCode: string; error?: string } {
    const code = (rawCode || '').trim().toUpperCase();
    if (!code) {
      return { valid: false, bonusAmount: 0, title: '', promoCode: '', error: 'Promo code is required.' };
    }

    // Predefined promotional reward schemes
    const standardCodes: Record<string, { bonus: number; title: string }> = {
      NEON100: { bonus: 100, title: 'NEON100 - Welcome ₹100 / 100 Coins Boost' },
      WELCOME50: { bonus: 50, title: 'WELCOME50 - Starter ₹50 / 50 Coins Boost' },
      BONUS75: { bonus: 75, title: 'BONUS75 - Lucky ₹75 / 75 Coins Boost' },
      VIP500: { bonus: 500, title: 'VIP500 - High Roller ₹500 Boost' },
      INDIA99: { bonus: 99, title: 'INDIA99 - Special ₹99 Coins Gift' },
      PROMO50: { bonus: 50, title: 'PROMO50 - Promotional ₹50 Coins Credit' },
    };

    // Check standard promo table or dynamic promotions
    let match = standardCodes[code];
    if (!match && this.data.promotions) {
      const dbPromo = Object.values(this.data.promotions).find((p) => p.code.toUpperCase() === code && p.isActive);
      if (dbPromo) {
        match = { bonus: dbPromo.bonusAmount || 50, title: dbPromo.title };
      }
    }

    if (!match) {
      return { valid: false, bonusAmount: 0, title: '', promoCode: code, error: `Promo code "${code}" is invalid or expired.` };
    }

    // Check if user already used this promo code
    if (userId) {
      const user = this.data.users[userId];
      if (user && user.promoCodeUsed && user.promoCodeUsed.toUpperCase() === code) {
        return { valid: false, bonusAmount: 0, title: '', promoCode: code, error: 'You have already redeemed this promo code.' };
      }
      const existingLedger = this.data.walletLedger.find(
        (tx) => tx.userId === userId && tx.type === 'PROMO_CODE_REWARD' && tx.description.includes(code)
      );
      if (existingLedger) {
        return { valid: false, bonusAmount: 0, title: '', promoCode: code, error: 'You have already redeemed this promo code.' };
      }
    }

    return {
      valid: true,
      bonusAmount: match.bonus,
      title: match.title,
      promoCode: code,
    };
  }

  public async applyPromoCode(
    code: string,
    userId: string
  ): Promise<{ success: boolean; bonusAmount: number; title: string; newBalance: number }> {
    return this.acquireUserLock(userId, async () => {
      const validation = this.validatePromoCode(code, userId);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid promo code.');
      }

      const user = this.data.users[userId];
      if (!user) throw new Error('User not found.');

      const now = Date.now();
      const prevBalance = user.virtualBalance;
      const bonus = validation.bonusAmount;
      const nextBalance = prevBalance + bonus;

      user.virtualBalance = nextBalance;
      user.promoCodeUsed = validation.promoCode;
      this.data.users[userId] = user;

      // Add to wallet ledger
      this.addWalletTransaction({
        id: `tx_promo_${crypto.randomBytes(8).toString('hex')}`,
        userId,
        type: 'PROMO_CODE_REWARD',
        amount: bonus,
        balanceBefore: prevBalance,
        balanceAfter: nextBalance,
        description: `Promo Code Reward [${validation.promoCode}] (+${bonus} Coins / ₹${bonus})`,
        timestamp: now,
        status: 'COMPLETED',
      });

      this.addNotification({
        id: `notif_${crypto.randomBytes(8).toString('hex')}`,
        userId,
        type: 'PROMOTION',
        title: `🎁 Promo Code Applied: ${validation.promoCode}`,
        message: `Successfully applied promo code! +${bonus} Coins (₹${bonus}) added to your balance.`,
        isRead: false,
        createdAt: now,
      });

      this.schedulePersist();
      return {
        success: true,
        bonusAmount: bonus,
        title: validation.title,
        newBalance: nextBalance,
      };
    });
  }

  // --- Idempotency ---
  public getIdempotencyResult(key: string): any | null {
    const item = this.data.idempotencyKeys[key];
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      delete this.data.idempotencyKeys[key];
      return null;
    }
    return item.result;
  }

  public setIdempotencyResult(key: string, result: any, ttlMs = 120000): void {
    this.data.idempotencyKeys[key] = {
      result,
      expiresAt: Date.now() + ttlMs,
    };
  }
}
