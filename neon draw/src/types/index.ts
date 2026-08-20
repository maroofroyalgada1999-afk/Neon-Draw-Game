// Shared types for 20-Number Arena Platform

export type RoundPhase = 'RESULT_DISPLAY' | 'CHART_OBSERVATION' | 'BETTING' | 'DRAWING' | 'SETTLED';

export type RoundStatus = 'RESULT' | 'CHART' | 'OPEN' | 'BETTING_CLOSED' | 'DRAWING' | 'SETTLED' | 'CANCELLED';

export type MultiplierVisibility = 'PUBLIC' | 'HIDDEN' | 'REVEAL_AFTER_RESULT';

export type AdminRole = 'SUPER_ADMIN' | 'GAME_ADMIN' | 'SUPPORT_ADMIN' | 'AUDITOR';

export type TransactionType =
  | 'REGISTRATION_BONUS'
  | 'BET_DEBIT'
  | 'WIN_CREDIT'
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'WITHDRAWAL_HOLD'
  | 'WITHDRAWAL_REFUND'
  | 'REFUND'
  | 'BONUS'
  | 'PROMOTION_BONUS'
  | 'WELCOME_SCRATCH_REWARD'
  | 'REFERRAL_SCRATCH_REWARD'
  | 'PROMO_CODE_REWARD'
  | 'ADMIN_ADJUSTMENT';

export type PaymentMethodType = 'UPI' | 'NET_BANKING' | 'CARD' | 'CRYPTO' | 'BANK_TRANSFER';
export type DepositStatus = 'PENDING' | 'VERIFYING' | 'SUCCESS' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';

export interface DepositTransaction {
  id: string;
  userId: string;
  username?: string;
  amount: number;
  currency: string; // 'INR'
  coins: number; // 1 Coin = ₹1
  paymentMethod: PaymentMethodType;
  paymentProvider: string;
  status: DepositStatus;
  transactionReference: string;
  utrNumber?: string;
  utrSubmittedAt?: number;
  verificationResult?: string;
  adminNotes?: string;
  verifiedBy?: string;
  merchantUpiId?: string;
  upiUri?: string;
  createdAt: number;
  expiresAt: number;
  completedAt?: number;
  rejectedAt?: number;
  failureReason?: string;
  idempotencyKey?: string;
}

export type PayoutMethodType = 'UPI' | 'BANK_ACCOUNT';
export type WithdrawalStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REJECTED' | 'CANCELLED';

export interface BankAccountDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}

export interface UpiDetails {
  upiId: string;
  accountHolderName: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  method: PayoutMethodType;
  upiDetails?: UpiDetails;
  bankDetails?: BankAccountDetails;
  status: WithdrawalStatus;
  transactionReference: string;
  createdAt: number;
  processedAt?: number;
  adminNotes?: string;
  failureReason?: string;
}

export type NotificationType =
  | 'LOGIN'
  | 'SECURITY'
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'GAME_WIN'
  | 'SUPPORT'
  | 'VERIFICATION'
  | 'PROMOTION'
  | 'ANNOUNCEMENT'
  | 'SYSTEM';

export interface PlayerNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: number;
  actionUrl?: string;
  meta?: Record<string, any>;
}

export type KYCStatus = 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type KYCDocType = 'AADHAAR' | 'PAN_CARD' | 'PASSPORT' | 'DRIVING_LICENSE' | 'NATIONAL_ID';

export interface KYCRecord {
  id: string;
  userId: string;
  status: KYCStatus;
  docType: KYCDocType;
  docNumberMasked: string;
  fullName: string;
  dob?: string;
  hasVideoRecording: boolean;
  videoDurationSeconds?: number;
  submittedAt: number;
  reviewedAt?: number;
  reviewerNotes?: string;
  rejectionReason?: string;
}

export interface Promotion {
  id: string;
  title: string;
  code: string;
  description: string;
  bonusAmount: number;
  matchPercentage?: number;
  minDeposit?: number;
  eligibility: string;
  terms: string[];
  startDate: number;
  endDate: number;
  isActive: boolean;
  claimedByUserIds: string[];
}

export const VALID_GAME_NUMBERS: string[] = [
  '01', '02', '03', '04', '05',
  '06', '07', '08', '09', '10',
  '11', '12', '13', '14', '15',
  '16', '17', '18', '19', '20',
];
export const VALID_GAME_NUMBERS_SET = new Set<string>(VALID_GAME_NUMBERS);

export function isValid20NumberRound(round: any): boolean {
  if (!round || typeof round !== 'object') return false;
  if (!Array.isArray(round.numbers) || round.numbers.length !== 20) return false;
  
  const seen = new Set<string>();
  for (const n of round.numbers) {
    if (!n || typeof n !== 'object') return false;
    if (typeof n.number !== 'string' || !VALID_GAME_NUMBERS_SET.has(n.number)) return false;
    if (typeof n.multiplier !== 'number' || n.multiplier < 1) return false;
    if (seen.has(n.number)) return false;
    seen.add(n.number);
  }
  
  if (seen.size !== 20) return false;
  
  if (round.winningNumber && !VALID_GAME_NUMBERS_SET.has(round.winningNumber)) {
    return false;
  }
  
  return true;
}

export interface GameNumber {
  number: string; // "01" - "20"
  multiplier: number; // 2 - 20
  isHighMultiplier: boolean; // true if 11x-20x, false if 2x-10x
}

export interface PreviousRoundResult {
  roundId: string;
  roundNumber: number;
  winningNumber: string;
  winningMultiplier: number;
  isHighMultiplier: boolean;
  totalTurnoverCoins: number;
  totalPayoutCoins: number;
  settledAt: number;
}

export interface NumberBetStat {
  number: string;
  multiplier: number;
  isHighMultiplier: boolean;
  betsCount: number;
  totalAmount: number;
  potentialPayout: number;
  percentageOfPool: number;
}

export interface Round {
  id: string; // e.g. "RND-1001"
  roundNumber: number;
  status: RoundStatus;
  currentPhase: RoundPhase;
  createdAt: number;
  // Authoritative server cycle timestamps (Exact 60s total)
  resultDisplayStart: number;
  resultDisplayEnd: number; // 15 seconds
  chartStart: number;
  chartEnd: number; // 30 seconds
  bettingStart: number;
  bettingEnd: number; // 15 seconds
  drawTime: number;
  settlementTime?: number;
  // Legacy aliases for backwards compatibility
  bettingStartTime: number;
  bettingCloseTime: number;
  settledAt?: number;
  numbers: GameNumber[];
  multiplierVisibility: MultiplierVisibility;
  winningNumber: string | null;
  serverSeedHash: string; // Published before betting closes
  serverSeedRevealed?: string; // Revealed after draw
  clientSeed: string;
  nonce: number;
  totalBetsCount: number;
  totalTurnoverCoins: number;
  totalPayoutCoins: number;
  previousRoundResult?: PreviousRoundResult | null;
  numberStats?: Record<string, { betsCount: number; totalAmount: number; potentialPayout: number }>;
}

export interface Bet {
  id: string;
  roundId: string;
  roundNumber: number;
  userId: string;
  username: string;
  selectedNumber: string; // "01" - "20"
  betAmount: number;
  multiplier: number;
  potentialPayout: number;
  status: 'PENDING' | 'WON' | 'LOST' | 'REFUNDED';
  winningNumber?: string;
  payoutAmount: number;
  placedAt: number;
  settledAt?: number;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  country?: string; // 'IN'
  currency?: string; // 'INR'
  referralCode?: string; // e.g. "ND99-AB1234"
  referredBy?: string; // Referrer's User ID
  promoCodeUsed?: string;
  role: 'PLAYER' | 'ADMIN';
  adminRole?: AdminRole;
  authProvider?: 'EMAIL' | 'PHONE' | 'GOOGLE' | 'FACEBOOK';
  avatarUrl?: string;
  socialId?: string;
  emailVerified?: boolean;
  kycStatus?: KYCStatus;
  virtualBalance: number;
  isActive: boolean;
  isPaused?: boolean;
  isDeleted?: boolean;
  deletedAt?: number;
  termsAcceptedAt?: number;
  privacyPolicyAcceptedAt?: number;
  termsVersion?: string;
  privacyPolicyVersion?: string;
  dailyBetLimit?: number;
  singleBetLimit?: number;
  todayBetTotal?: number;
  balanceHidden?: boolean;
  soundEnabled?: boolean;
  riskScore: number; // 0 - 100
  createdAt: number;
  lastLoginAt: number;
}

export interface ScratchCardReward {
  id: string;
  userId: string;
  type: 'WELCOME' | 'REFERRAL';
  title: string;
  amount: number; // 50-100 Coins for Welcome, 100 Coins for Referral
  isRevealed: boolean;
  isClaimed: boolean;
  claimedAt?: number;
  createdAt: number;
  referralUserId?: string;
  referralUsername?: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  ip: string;
  userAgent: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  createdAt: number;
  expiresAt: number;
  lastActiveAt: number;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number; // positive for credit, negative for debit
  balanceBefore: number;
  balanceAfter: number;
  referenceId?: string; // betId or roundId
  roundId?: string;
  description: string;
  timestamp: number;
  status: 'COMPLETED' | 'REVERTED';
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  previousValue?: any;
  newValue?: any;
  ip: string;
  userAgent: string;
  timestamp: number;
}

export interface SecurityEvent {
  id: string;
  userId?: string;
  username?: string;
  eventType: 'FAILED_LOGIN' | 'RAPID_BETS' | 'IDEMPOTENCY_RETRY' | 'LIMIT_EXCEEDED' | 'UNAUTHORIZED_ACCESS' | 'ACCOUNT_DELETED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
  ip: string;
  timestamp: number;
}

export type SupportTicketCategory =
  | 'GAMEPLAY'
  | 'WALLET'
  | 'ACCOUNT'
  | 'RULES'
  | 'LOGIN_PROBLEM'
  | 'ACCOUNT_PROBLEM'
  | 'BETTING_PROBLEM'
  | 'HISTORY_PROBLEM'
  | 'WALLET_PROBLEM'
  | 'TECHNICAL_PROBLEM'
  | 'OTHER';

export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_USER' | 'RESOLVED' | 'CLOSED';

export interface SupportTicket {
  id: string; // e.g. "SUP-2026-001024"
  userId?: string;
  name: string;
  username: string;
  email: string;
  accountId?: string;
  subject: string;
  category: SupportTicketCategory;
  message: string;
  status: SupportTicketStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: number;
  updatedAt: number;
  adminReply?: string;
  assignedAdmin?: string;
}

export type LegalPageId =
  | 'terms'
  | 'privacy'
  | 'about'
  | 'how-to-play'
  | 'game-rules'
  | 'betting-rules'
  | 'responsible-play'
  | 'help'
  | 'faq'
  | 'contact'
  | 'cookies'
  | 'refunds'
  | 'disclaimer'
  | 'account-security'
  | 'accessibility'
  | 'legal';

export interface GameConfig {
  minBet: number;
  maxBet: number;
  roundDurationSeconds: number;
  bettingCloseBufferSeconds: number; // seconds before draw when betting locks
  drawAnimationSeconds: number;
  multiplierVisibility: MultiplierVisibility;
  normalMultiplierMin: number;
  normalMultiplierMax: number;
  highMultiplierMin: number;
  highMultiplierMax: number;
  normalMultiplierCount: number; // 14
  highMultiplierCount: number; // 6
  defaultStartingCoins: number;
  isGameActive: boolean;
  provablyFairEnabled: boolean;
}

export interface AdminKPIs {
  totalPlayers: number;
  activePlayersToday: number;
  totalRounds: number;
  totalBetsPlaced: number;
  totalTurnoverCoins: number;
  totalPayoutCoins: number;
  netHouseHoldCoins: number;
  rtpPercentage: number;
  openBetsCount: number;
}

export interface TestResult {
  id: string;
  name: string;
  category: string;
  status: 'PASSED' | 'FAILED';
  durationMs: number;
  message: string;
  error?: string;
}

export interface TestSuiteReport {
  timestamp: number;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  durationMs: number;
  results: TestResult[];
}

