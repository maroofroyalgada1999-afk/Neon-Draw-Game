import {
  User,
  Session,
  Round,
  Bet,
  WalletTransaction,
  AuditLog,
  SecurityEvent,
  GameConfig,
  AdminKPIs,
  AdminRole,
  TestSuiteReport,
  DepositTransaction,
} from '../types/index';

const TOKEN_KEY = 'num99_auth_token';

class ApiService {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  public setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }

  public clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  public getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(endpoint, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {}),
      },
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text().catch(() => '');
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}: ${res.statusText}`);
      }
      // If server returned HTML during development or proxy fallback
      throw new Error(`API endpoint ${endpoint} returned non-JSON content. Server might still be starting.`);
    }

    let data: any;
    try {
      data = await res.json();
    } catch {
      throw new Error(`Failed to parse JSON response from ${endpoint}`);
    }

    if (!res.ok) {
      throw new Error(data?.error || `Request failed with status ${res.status}`);
    }
    return data as T;
  }

  // --- Auth API ---
  public async sendOtp(phoneNumber: string) {
    return await this.request<{ success: boolean; phone: string; cooldownSeconds: number; testOtpCode: string }>(
      '/api/auth/send-otp',
      {
        method: 'POST',
        body: JSON.stringify({ phoneNumber }),
      }
    );
  }

  public async register(payload: {
    name?: string;
    username?: string;
    email?: string;
    phoneNumber?: string;
    otpCode?: string;
    password?: string;
    registrationType?: 'MOBILE' | 'EMAIL';
    referralCode?: string;
    promoCode?: string;
    termsAccepted: boolean;
    ageConfirmed: boolean;
  }) {
    const data = await this.request<{ user: User; token: string; welcomeScratchCard?: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(data.token);
    return data;
  }

  public async login(payload: {
    identifier: string;
    password?: string;
    otpCode?: string;
    isOtpLogin?: boolean;
  }) {
    const data = await this.request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(data.token);
    return data;
  }

  public async demoQuickLogin() {
    const data = await this.request<{ user: User; token: string }>('/api/auth/demo-quick-login', {
      method: 'POST',
    });
    this.setToken(data.token);
    return data;
  }

  public async adminQuickLogin(role: AdminRole = 'SUPER_ADMIN') {
    const data = await this.request<{ user: User; token: string }>('/api/auth/admin-quick-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    this.setToken(data.token);
    return data;
  }

  public async getOAuthConfig() {
    return await this.request<{
      googleConfigured: boolean;
      facebookConfigured: boolean;
      googleClientId: string | null;
      facebookAppId: string | null;
    }>('/api/auth/oauth/config');
  }

  public async getOAuthUrl(provider: 'google' | 'facebook') {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams({ provider, origin });
    return await this.request<{
      url: string;
      isConfigured: boolean;
      provider: 'GOOGLE' | 'FACEBOOK';
      redirectUri: string;
    }>(`/api/auth/oauth/url?${params.toString()}`);
  }

  public async socialLogin(payload: {
    provider: 'GOOGLE' | 'FACEBOOK';
    email: string;
    name: string;
    avatarUrl?: string;
    socialId?: string;
    emailVerified?: boolean;
  }) {
    const data = await this.request<{ user: User; token: string }>('/api/auth/social-login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(data.token);
    return data;
  }

  public async logout() {
    try {
      await this.request<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
    } finally {
      this.clearToken();
    }
  }

  public async getMe() {
    return await this.request<{ user: User; sessions: Session[]; currentSessionId: string }>('/api/auth/me');
  }

  public async revokeOtherSessions() {
    return await this.request<{ success: boolean }>('/api/auth/sessions/revoke-others', { method: 'POST' });
  }

  public async updateResponsibleGaming(payload: { dailyBetLimit?: number; singleBetLimit?: number; isPaused?: boolean }) {
    return await this.request<{ user: User }>('/api/auth/responsible-gaming', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  private getLocalFallbackRound() {
    const now = Date.now();
    const cycle = 60000;
    const elapsed = now % cycle;

    const resultDisplayStart = now - elapsed;
    const resultDisplayEnd = resultDisplayStart + 15000;
    const chartStart = resultDisplayEnd;
    const chartEnd = chartStart + 30000;
    const bettingStart = chartEnd;
    const bettingEnd = bettingStart + 15000;
    const drawTime = bettingEnd;

    let currentPhase: Round['currentPhase'] = 'RESULT_DISPLAY';
    let status: Round['status'] = 'RESULT';

    if (elapsed < 15000) {
      currentPhase = 'RESULT_DISPLAY';
      status = 'RESULT';
    } else if (elapsed < 45000) {
      currentPhase = 'CHART_OBSERVATION';
      status = 'CHART';
    } else {
      currentPhase = 'BETTING';
      status = 'OPEN';
    }

    // Deterministic 20-number multiplier grid (01 through 20) with dynamic seed
    const roundIdx = Math.floor(now / cycle);
    const numbers = Array.from({ length: 20 }, (_, i) => {
      const numStr = String(i + 1).padStart(2, '0');
      // Rotate high multipliers (11x-20x) dynamically across 6 numbers per round
      const isHigh = (i + roundIdx * 3) % 3 === 0;
      const multiplier = isHigh ? 11 + ((i + roundIdx) % 10) : 2 + ((i + roundIdx) % 9);
      return {
        number: numStr,
        multiplier,
        isHighMultiplier: isHigh || multiplier >= 11,
      };
    });

    return {
      round: {
        id: `RND-INIT-${roundIdx}`,
        roundNumber: (roundIdx % 10000) + 1001,
        status,
        currentPhase,
        createdAt: now - elapsed,
        resultDisplayStart,
        resultDisplayEnd,
        chartStart,
        chartEnd,
        bettingStart,
        bettingEnd,
        drawTime,
        bettingStartTime: bettingStart,
        bettingCloseTime: bettingEnd,
        numbers,
        multiplierVisibility: 'PUBLIC' as Round['multiplierVisibility'],
        winningNumber: null,
        serverSeedHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        clientSeed: 'provably_fair_init_seed',
        nonce: 1001,
        totalBetsCount: 0,
        totalTurnoverCoins: 0,
        totalPayoutCoins: 0,
        previousRoundResult: {
          roundId: `RND-INIT-${roundIdx - 1}`,
          roundNumber: (roundIdx % 10000) + 1000,
          winningNumber: '07',
          winningMultiplier: 15,
          isHighMultiplier: true,
          totalTurnoverCoins: 12500,
          totalPayoutCoins: 18750,
          settledAt: resultDisplayStart - 1000,
        },
      },
      serverTime: now,
      userBets: [] as Bet[],
      recentRoundBets: [] as { id: string; username: string; selectedNumber: string; betAmount: number; placedAt: number }[],
    };
  }

  // --- Game API ---
  public async getCurrentRound() {
    try {
      return await this.request<{
        round: Round;
        serverTime: number;
        userBets: Bet[];
        recentRoundBets: { id: string; username: string; selectedNumber: string; betAmount: number; placedAt: number }[];
      }>('/api/game/current-round');
    } catch {
      // Gracefully provide synced local round fallback during startup or transient network interruptions
      return this.getLocalFallbackRound();
    }
  }

  public async getRound(id: string) {
    return await this.request<{ round: Round }>(`/api/game/round/${id}`);
  }

  public async getHistory(limit = 20) {
    return await this.request<{ rounds: Round[] }>(`/api/game/history?limit=${limit}`);
  }

  public async placeBet(payload: { selectedNumber: string; betAmount: number; idempotencyKey?: string }) {
    return await this.request<{ bet: Bet; newBalance: number }>('/api/game/bet', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async placeBatchBets(payload: { bets: { selectedNumber: string; betAmount: number }[] }) {
    return await this.request<{ placedBets: Bet[]; newBalance: number }>('/api/game/batch-bet', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getMyBets(status?: string) {
    const q = status ? `?status=${status}` : '';
    return await this.request<{ bets: Bet[] }>(`/api/game/my-bets${q}`);
  }

  // --- Wallet & Deposit/Withdrawal API ---
  public async getWallet() {
    return await this.request<{ virtualBalance: number; currency: string; balanceHidden?: boolean; notice: string }>('/api/wallet');
  }

  public async getLedger() {
    return await this.request<{ transactions: WalletTransaction[] }>('/api/wallet/ledger');
  }

  public async claimDemoFaucet() {
    return await this.request<{ transaction: WalletTransaction; newBalance: number }>('/api/wallet/demo-faucet', {
      method: 'POST',
    });
  }

  public async getDepositConfig() {
    return await this.request<{
      minAmount: number;
      maxAmount: number;
      currency: string;
      coinRate: number;
      quickAmounts: number[];
      merchantUpiId: string;
      merchantName: string;
      expiryMinutes: number;
      methods: { id: 'UPI'; name: string; description: string; preferred?: boolean; fee: string; processingTime: string; isConfigured: boolean }[];
    }>('/api/wallet/deposit/config');
  }

  public async createDeposit(payload: { amount: number; paymentMethod?: string }) {
    return await this.request<{ success: boolean; deposit: DepositTransaction }>('/api/wallet/deposit/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async submitDepositUtr(payload: { depositId: string; utrNumber: string }) {
    return await this.request<{ success: boolean; deposit: DepositTransaction; message: string }>('/api/wallet/deposit/submit-utr', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async verifyDeposit(payload: { depositId: string; utrNumber?: string }) {
    return await this.request<{ success: boolean; deposit: DepositTransaction; newBalance: number; transaction: WalletTransaction }>('/api/wallet/deposit/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async cancelDeposit(depositId: string) {
    return await this.request<{ success: boolean; deposit: DepositTransaction }>(`/api/wallet/deposit/${depositId}/cancel`, {
      method: 'POST',
    });
  }

  public async getDeposit(depositId: string) {
    return await this.request<{ deposit: DepositTransaction }>(`/api/wallet/deposit/${depositId}`);
  }

  public async getDeposits() {
    return await this.request<{ deposits: DepositTransaction[] }>('/api/wallet/deposits');
  }

  public async getAdminDeposits(statusFilter?: string) {
    const url = statusFilter ? `/api/admin/deposits?status=${encodeURIComponent(statusFilter)}` : '/api/admin/deposits';
    return await this.request<{ deposits: DepositTransaction[] }>(url);
  }

  public async approveAdminDeposit(depositId: string, adminNotes?: string) {
    return await this.request<{ success: boolean; deposit: DepositTransaction; newBalance: number; transaction: WalletTransaction }>(`/api/admin/deposits/${depositId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ adminNotes }),
    });
  }

  public async rejectAdminDeposit(depositId: string, reason: string, adminNotes?: string) {
    return await this.request<{ success: boolean; deposit: DepositTransaction }>(`/api/admin/deposits/${depositId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason, adminNotes }),
    });
  }

  public async getWithdrawalConfig() {
    return await this.request<{
      minAmount: number;
      maxAmount: number;
      dailyLimit: number;
      fee: string;
      processingTime: string;
      availableBalance: number;
      kycStatus: string;
      methods: { id: string; name: string; description: string; fields: string[] }[];
    }>('/api/wallet/withdrawal/config');
  }

  public async requestWithdrawal(payload: {
    amount: number;
    method: 'UPI' | 'BANK_ACCOUNT';
    upiDetails?: { upiId: string; accountHolderName: string };
    bankDetails?: { accountHolderName: string; accountNumber: string; ifscCode: string; bankName: string };
  }) {
    return await this.request<{ success: boolean; withdrawal: any; newBalance: number; transaction: WalletTransaction }>('/api/wallet/withdrawal/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getWithdrawals() {
    return await this.request<{ withdrawals: any[] }>('/api/wallet/withdrawals');
  }

  public async cancelWithdrawal(withdrawalId: string) {
    return await this.request<{ success: boolean; withdrawal: any; newBalance: number }>(`/api/wallet/withdrawal/${withdrawalId}/cancel`, {
      method: 'POST',
    });
  }

  // --- Notifications API ---
  public async getNotifications() {
    return await this.request<{ notifications: any[]; unreadCount: number }>('/api/notifications');
  }

  public async markNotificationRead(id: string) {
    return await this.request<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: 'POST',
    });
  }

  public async markAllNotificationsRead() {
    return await this.request<{ success: boolean; count: number }>('/api/notifications/read-all', {
      method: 'POST',
    });
  }

  // --- Promotions & Promo Codes API ---
  public async getPromotions() {
    return await this.request<{ promotions: any[] }>('/api/promotions');
  }

  public async claimPromotion(id: string) {
    return await this.request<{ success: boolean; promotion: any; newBalance: number; bonusAmount: number }>(`/api/promotions/${id}/claim`, {
      method: 'POST',
    });
  }

  public async validatePromoCode(code: string) {
    return await this.request<{ valid: boolean; bonusAmount: number; title: string; promoCode: string; error?: string }>(
      '/api/promotions/validate-code',
      {
        method: 'POST',
        body: JSON.stringify({ code }),
      }
    );
  }

  public async applyPromoCode(code: string) {
    return await this.request<{ success: boolean; bonusAmount: number; title: string; newBalance: number }>(
      '/api/promotions/apply-code',
      {
        method: 'POST',
        body: JSON.stringify({ code }),
      }
    );
  }

  // --- Scratch Cards API ---
  public async getScratchCards() {
    return await this.request<{ scratchCards: any[] }>('/api/scratch-cards');
  }

  public async claimScratchCard(cardId: string) {
    return await this.request<{ success: boolean; card: any; newBalance: number }>(`/api/scratch-cards/${cardId}/claim`, {
      method: 'POST',
    });
  }

  // --- Referrals API ---
  public async getReferrals() {
    return await this.request<{
      referralCode: string;
      referralLink: string;
      totalReferrals: number;
      totalCoinsEarned: number;
      referralCards: any[];
      referredUsers: { id: string; username: string; name: string; joinedAt: number }[];
    }>('/api/referrals');
  }

  // --- KYC API ---
  public async getKycStatus() {
    return await this.request<{ status: string; kyc: any | null }>('/api/kyc/status');
  }

  public async submitKyc(payload: {
    docType: string;
    docNumber: string;
    fullName: string;
    dob?: string;
    hasVideoRecording?: boolean;
    videoDurationSeconds?: number;
  }) {
    return await this.request<{ success: boolean; kyc: any }>('/api/kyc/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Profile & Preferences API ---
  public async updateProfile(payload: {
    name?: string;
    phoneNumber?: string;
    balanceHidden?: boolean;
    soundEnabled?: boolean;
  }) {
    return await this.request<{ success: boolean; user: User }>('/api/user/profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async changePassword(payload: { currentPassword: string; newPassword: string }) {
    return await this.request<{ success: boolean; message: string }>('/api/user/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // --- Admin API ---
  public async getAdminDashboard() {
    return await this.request<{
      kpis: AdminKPIs;
      currentRound: Round;
      recentBets: Bet[];
    }>('/api/admin/dashboard');
  }

  public async forceDraw() {
    return await this.request<{ success: boolean; round: Round }>('/api/admin/round/force-draw', { method: 'POST' });
  }

  public async nextRound() {
    return await this.request<{ success: boolean; round: Round }>('/api/admin/round/next', { method: 'POST' });
  }

  public async cancelRound(id: string, reason: string) {
    return await this.request<{ success: boolean; round: Round }>(`/api/admin/round/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  public async getAdminUsers() {
    return await this.request<{ users: User[] }>('/api/admin/users');
  }

  public async adjustUserBalance(userId: string, amount: number, reason: string) {
    return await this.request<{ transaction: WalletTransaction; newBalance: number }>(`/api/admin/users/${userId}/adjust-balance`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    });
  }

  public async toggleUserStatus(userId: string) {
    return await this.request<{ user: User }>(`/api/admin/users/${userId}/toggle-status`, { method: 'POST' });
  }

  public async getAdminConfig() {
    return await this.request<{ config: GameConfig }>('/api/admin/config');
  }

  public async updateAdminConfig(config: Partial<GameConfig>) {
    return await this.request<{ config: GameConfig }>('/api/admin/config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  public async getAuditLogs() {
    return await this.request<{ logs: AuditLog[] }>('/api/admin/audit-logs');
  }

  public async getSecurityEvents() {
    return await this.request<{ events: SecurityEvent[] }>('/api/admin/security-events');
  }

  public async runTests() {
    return await this.request<TestSuiteReport>('/api/admin/run-tests', { method: 'POST' });
  }

  public async deleteAccount() {
    try {
      const data = await this.request<{ success: boolean; message: string }>('/api/auth/delete-account', {
        method: 'POST',
      });
      return data;
    } finally {
      this.clearToken();
    }
  }

  // --- Support Tickets API ---
  public async createSupportTicket(payload: {
    name?: string;
    email?: string;
    accountId?: string;
    subject: string;
    category: string;
    message: string;
    priority?: string;
  }) {
    return await this.request<{ success: boolean; ticket: any }>('/api/support/ticket', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getMySupportTickets() {
    return await this.request<{ tickets: any[] }>('/api/support/my-tickets');
  }

  public async getAdminSupportTickets() {
    return await this.request<{ tickets: any[] }>('/api/admin/support/tickets');
  }

  public async replySupportTicket(id: string, reply: string, status = 'RESOLVED') {
    return await this.request<{ ticket: any }>(`/api/admin/support/tickets/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ reply, status }),
    });
  }

  public async updateSupportTicketStatus(id: string, status: string) {
    return await this.request<{ ticket: any }>(`/api/admin/support/tickets/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  public async assignSupportTicket(id: string, assignedAdmin: string) {
    return await this.request<{ ticket: any }>(`/api/admin/support/tickets/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assignedAdmin }),
    });
  }
}

export const api = new ApiService();
