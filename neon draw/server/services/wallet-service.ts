import crypto from 'crypto';
import { Database } from '../db/database.js';
import {
  WalletTransaction,
  User,
  DepositTransaction,
  WithdrawalRequest,
  PaymentMethodType,
  PayoutMethodType,
  UpiDetails,
  BankAccountDetails,
} from '../../src/types/index.js';

export class WalletService {
  private static db = Database.getInstance();

  /**
   * Returns current deposit limits and configured merchant payment options
   */
  public static getDepositConfig() {
    const merchantUpiId = process.env.MERCHANT_UPI_ID || 'neondraw99@icici';
    const merchantName = process.env.MERCHANT_NAME || 'NEON DRAW-99';

    return {
      currency: 'INR',
      coinRate: 1, // 1 Coin = ₹1
      minAmount: 100,
      maxAmount: 50000,
      quickAmounts: [100, 300, 500, 1000, 2000, 5000],
      merchantUpiId,
      merchantName,
      expiryMinutes: 30,
      methods: [
        {
          id: 'UPI' as const,
          name: 'UPI (Unified Payments Interface)',
          description: 'Instant verification via GPay, PhonePe, Paytm, BHIM, CRED or any UPI App',
          preferred: true,
          fee: '0%',
          processingTime: 'Instant / 1-3 mins',
          isConfigured: true,
        },
      ],
    };
  }

  /**
   * Creates a pending deposit request with UPI payment details & 30-minute expiry
   */
  public static async createDeposit(params: {
    userId: string;
    amount: number;
    paymentMethod: PaymentMethodType;
  }): Promise<DepositTransaction> {
    const { userId, amount, paymentMethod } = params;

    if (!amount || typeof amount !== 'number' || !Number.isFinite(amount) || amount < 100) {
      throw new Error('Minimum deposit amount is ₹100.');
    }
    if (amount > 50000) {
      throw new Error('Maximum deposit amount per transaction is ₹50,000.');
    }
    if (!Number.isInteger(amount)) {
      throw new Error('Deposit amount must be a whole integer number.');
    }

    const user = this.db.getUserById(userId);
    if (!user) throw new Error('User not found.');
    if (!user.isActive) throw new Error('Account is suspended.');

    // Only allow configured methods
    if (paymentMethod !== 'UPI') {
      throw new Error(`Payment method "${paymentMethod}" is currently not available.`);
    }

    const merchantUpiId = process.env.MERCHANT_UPI_ID || 'neondraw99@icici';
    const merchantName = process.env.MERCHANT_NAME || 'NEON DRAW-99';
    const depositId = `dep_${crypto.randomBytes(8).toString('hex')}`;
    const txRef = `DEP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes

    // Construct valid UPI standard deep-link URI
    // upi://pay?pa=upiaddress&pn=payeename&am=amount&cu=INR&tr=orderid&tn=note
    const note = `Deposit ${txRef} NEON DRAW-99`;
    const upiUri = `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${amount.toFixed(2)}&cu=INR&tr=${depositId}&tn=${encodeURIComponent(note)}`;

    const depositTx: DepositTransaction = {
      id: depositId,
      userId,
      amount,
      coins: amount,
      currency: 'INR',
      paymentMethod,
      paymentProvider: 'UPI Instant Node',
      status: 'PENDING',
      transactionReference: txRef,
      merchantUpiId,
      upiUri,
      createdAt: Date.now(),
      expiresAt,
    };

    this.db.saveDepositTransaction(depositTx);
    return depositTx;
  }

  /**
   * Player submits UTR / transaction reference number for verification
   * Transitions status to 'VERIFYING' without auto-crediting
   */
  public static async submitUtrForVerification(params: {
    userId: string;
    depositId: string;
    utrNumber: string;
  }): Promise<{ deposit: DepositTransaction; message: string }> {
    const { userId, depositId, utrNumber } = params;

    if (!utrNumber || typeof utrNumber !== 'string') {
      throw new Error('Please enter a valid 12-digit UPI reference / UTR number.');
    }

    // Clean & standardize UTR string
    const cleanUtr = utrNumber.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (cleanUtr.length < 8 || cleanUtr.length > 24) {
      throw new Error('Invalid UTR format. UPI UTR numbers are typically 12 alphanumeric characters.');
    }

    // Lock on UTR and User to avoid concurrent duplicate submissions
    return await this.db.acquireUtrLock(cleanUtr, async () => {
      return await this.db.acquireUserLock(userId, async () => {
        const deposit = this.db.getDepositTransaction(depositId);
        if (!deposit) throw new Error('Deposit order not found.');
        if (deposit.userId !== userId) throw new Error('Unauthorized deposit order access.');

        // Check if expired
        if (deposit.expiresAt && Date.now() > deposit.expiresAt && deposit.status === 'PENDING') {
          deposit.status = 'EXPIRED';
          this.db.saveDepositTransaction(deposit);
          throw new Error('This deposit payment session has expired (30 minutes limit). Please initiate a new deposit.');
        }

        if (deposit.status === 'SUCCESS') {
          throw new Error('This deposit has already been verified and credited.');
        }

        if (deposit.status === 'CANCELLED' || deposit.status === 'EXPIRED') {
          throw new Error(`This deposit session is ${deposit.status.toLowerCase()}. Please create a new deposit.`);
        }

        // Check if this UTR has already been registered or used in another deposit
        if (this.db.isUtrUsed(cleanUtr, depositId)) {
          throw new Error('This UTR / transaction reference has already been used. Each payment UTR can only be submitted once.');
        }

        // Update deposit to VERIFYING state (NOT SUCCESS)
        deposit.status = 'VERIFYING';
        deposit.utrNumber = cleanUtr;
        deposit.utrSubmittedAt = Date.now();
        this.db.saveDepositTransaction(deposit);

        // Register in UTR index
        this.db.registerUtr(cleanUtr, deposit.id, userId);

        // Send confirmation notification
        this.db.addNotification({
          id: `notif_${crypto.randomBytes(8).toString('hex')}`,
          userId,
          type: 'DEPOSIT',
          title: 'Deposit Under Verification',
          message: `Your deposit of ₹${deposit.amount.toLocaleString()} (UTR: ${cleanUtr}) is submitted and being verified.`,
          isRead: false,
          createdAt: Date.now(),
        });

        return {
          deposit,
          message: 'UTR submitted successfully. Your deposit is now under verification.',
        };
      });
    });
  }

  /**
   * Verifies and credits a deposit transaction (used by Admin approval or Automated Provider Webhook)
   */
  public static async verifyDeposit(params: {
    userId: string;
    depositId: string;
    utrNumber?: string;
    verifiedBy?: string;
    adminNotes?: string;
  }): Promise<{ deposit: DepositTransaction; newBalance: number; transaction: WalletTransaction }> {
    const { userId, depositId, utrNumber, verifiedBy, adminNotes } = params;

    const deposit = this.db.getDepositTransaction(depositId);
    if (!deposit) throw new Error('Deposit transaction not found.');
    if (deposit.userId !== userId) throw new Error('Unauthorized transaction access.');
    if (deposit.status === 'SUCCESS') throw new Error('Deposit has already been verified and credited.');
    if (deposit.status === 'CANCELLED' || deposit.status === 'REJECTED' || deposit.status === 'EXPIRED') {
      throw new Error(`Deposit cannot be verified because it is currently ${deposit.status}.`);
    }

    const cleanUtr = (utrNumber || deposit.utrNumber || `UTR${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`).trim().toUpperCase();

    return await this.db.acquireUtrLock(cleanUtr, async () => {
      return await this.db.acquireUserLock(userId, async () => {
        // Double check after locks
        const freshDep = this.db.getDepositTransaction(depositId);
        if (!freshDep || freshDep.status === 'SUCCESS') {
          throw new Error('Deposit has already been completed.');
        }

        // Check if UTR is already used elsewhere
        if (this.db.isUtrUsed(cleanUtr, depositId)) {
          throw new Error('This UTR is already credited on another deposit.');
        }

        const user = this.db.getUserById(userId);
        if (!user) throw new Error('User not found.');

        // Update deposit transaction
        freshDep.status = 'SUCCESS';
        freshDep.utrNumber = cleanUtr;
        freshDep.completedAt = Date.now();
        if (verifiedBy) freshDep.verifiedBy = verifiedBy;
        if (adminNotes) freshDep.adminNotes = adminNotes;
        this.db.saveDepositTransaction(freshDep);

        // Register UTR index
        this.db.registerUtr(cleanUtr, freshDep.id, userId);

        // Credit user wallet (1 Coin = ₹1)
        const coinsToCredit = freshDep.amount;
        const balanceBefore = user.virtualBalance;
        const balanceAfter = balanceBefore + coinsToCredit;
        user.virtualBalance = balanceAfter;
        this.db.saveUser(user);

        // Create immutable ledger entry
        const ledgerTx: WalletTransaction = {
          id: `tx_${crypto.randomBytes(8).toString('hex')}`,
          userId,
          type: 'DEPOSIT',
          amount: coinsToCredit,
          balanceBefore,
          balanceAfter,
          referenceId: freshDep.id,
          description: `Deposit credited (+${coinsToCredit.toLocaleString()} Coins) via ${freshDep.paymentMethod} (UTR: ${cleanUtr})`,
          timestamp: Date.now(),
          status: 'COMPLETED',
        };
        this.db.addWalletTransaction(ledgerTx);

        // Add Notification
        this.db.addNotification({
          id: `notif_${crypto.randomBytes(8).toString('hex')}`,
          userId,
          type: 'DEPOSIT',
          title: 'Deposit Successful',
          message: `₹${freshDep.amount.toLocaleString()} verified. ${coinsToCredit.toLocaleString()} coins credited to your wallet balance.`,
          isRead: false,
          createdAt: Date.now(),
        });

        return { deposit: freshDep, newBalance: balanceAfter, transaction: ledgerTx };
      });
    });
  }

  /**
   * Admin approves a verifying/pending deposit and credits player account
   */
  public static async adminApproveDeposit(params: {
    adminUser: User;
    depositId: string;
    adminNotes?: string;
    ip: string;
    userAgent: string;
  }): Promise<{ deposit: DepositTransaction; newBalance: number; transaction: WalletTransaction }> {
    const { adminUser, depositId, adminNotes, ip, userAgent } = params;

    const deposit = this.db.getDepositTransaction(depositId);
    if (!deposit) throw new Error('Deposit record not found.');
    if (deposit.status === 'SUCCESS') throw new Error('Deposit is already approved and credited.');
    if (deposit.status === 'CANCELLED' || deposit.status === 'REJECTED') {
      throw new Error(`Deposit cannot be approved because it is ${deposit.status}.`);
    }

    const result = await this.verifyDeposit({
      userId: deposit.userId,
      depositId,
      utrNumber: deposit.utrNumber,
      verifiedBy: adminUser.username,
      adminNotes: adminNotes || 'Approved by Admin',
    });

    // Add Audit Log
    this.db.addAuditLog({
      id: `aud_${crypto.randomBytes(8).toString('hex')}`,
      actorId: adminUser.id,
      actorName: adminUser.username,
      actorRole: adminUser.adminRole || 'SUPER_ADMIN',
      action: 'DEPOSIT_APPROVED' as any,
      targetType: 'DEPOSIT' as any,
      targetId: depositId,
      previousValue: { status: deposit.status, amount: deposit.amount, utrNumber: deposit.utrNumber },
      newValue: { status: 'SUCCESS', verifiedBy: adminUser.username, adminNotes },
      ip,
      userAgent,
      timestamp: Date.now(),
    });

    return result;
  }

  /**
   * Admin rejects a deposit request
   */
  public static async adminRejectDeposit(params: {
    adminUser: User;
    depositId: string;
    reason: string;
    adminNotes?: string;
    ip: string;
    userAgent: string;
  }): Promise<{ deposit: DepositTransaction }> {
    const { adminUser, depositId, reason, adminNotes, ip, userAgent } = params;

    if (!reason || !reason.trim()) {
      throw new Error('Rejection reason is required.');
    }

    const deposit = this.db.getDepositTransaction(depositId);
    if (!deposit) throw new Error('Deposit record not found.');
    if (deposit.status === 'SUCCESS') {
      throw new Error('Cannot reject a deposit that has already been approved and credited.');
    }

    deposit.status = 'REJECTED';
    deposit.failureReason = reason.trim();
    deposit.adminNotes = adminNotes ? adminNotes.trim() : undefined;
    deposit.verifiedBy = adminUser.username;
    deposit.completedAt = Date.now();
    this.db.saveDepositTransaction(deposit);

    // Release UTR from active index if rejected
    if (deposit.utrNumber) {
      this.db.releaseUtr(deposit.utrNumber);
    }

    // Add notification to player
    this.db.addNotification({
      id: `notif_${crypto.randomBytes(8).toString('hex')}`,
      userId: deposit.userId,
      type: 'DEPOSIT',
      title: 'Deposit Verification Rejected',
      message: `Your deposit of ₹${deposit.amount.toLocaleString()} was not approved. Reason: ${deposit.failureReason}`,
      isRead: false,
      createdAt: Date.now(),
    });

    // Add Audit Log
    this.db.addAuditLog({
      id: `aud_${crypto.randomBytes(8).toString('hex')}`,
      actorId: adminUser.id,
      actorName: adminUser.username,
      actorRole: adminUser.adminRole || 'SUPER_ADMIN',
      action: 'DEPOSIT_REJECTED' as any,
      targetType: 'DEPOSIT' as any,
      targetId: depositId,
      previousValue: { status: deposit.status, amount: deposit.amount },
      newValue: { status: 'REJECTED', reason: deposit.failureReason, verifiedBy: adminUser.username },
      ip,
      userAgent,
      timestamp: Date.now(),
    });

    return { deposit };
  }

  /**
   * Player cancels their own pending deposit
   */
  public static async cancelDeposit(userId: string, depositId: string): Promise<{ deposit: DepositTransaction }> {
    return await this.db.acquireUserLock(userId, async () => {
      const deposit = this.db.getDepositTransaction(depositId);
      if (!deposit) throw new Error('Deposit not found.');
      if (deposit.userId !== userId) throw new Error('Unauthorized access.');
      if (deposit.status === 'SUCCESS') throw new Error('Cannot cancel a completed deposit.');
      if (deposit.status !== 'PENDING' && deposit.status !== 'VERIFYING') {
        throw new Error(`Deposit is already ${deposit.status.toLowerCase()}.`);
      }

      deposit.status = 'CANCELLED';
      deposit.failureReason = 'Cancelled by player';
      deposit.completedAt = Date.now();
      this.db.saveDepositTransaction(deposit);

      if (deposit.utrNumber) {
        this.db.releaseUtr(deposit.utrNumber);
      }

      return { deposit };
    });
  }

  /**
   * Requests a withdrawal with balance hold & validation
   */
  public static async requestWithdrawal(params: {
    userId: string;
    amount: number;
    method: PayoutMethodType;
    upiDetails?: UpiDetails;
    bankDetails?: BankAccountDetails;
  }): Promise<{ withdrawal: WithdrawalRequest; newBalance: number; transaction: WalletTransaction }> {
    const { userId, amount, method, upiDetails, bankDetails } = params;

    if (!amount || amount < 200) {
      throw new Error('Minimum payout amount is ₹200.');
    }
    if (amount > 25000) {
      throw new Error('Maximum payout per transaction is ₹25,000.');
    }

    if (method === 'UPI') {
      if (!upiDetails || !upiDetails.upiId) {
        throw new Error('Valid UPI ID (e.g. yourname@upi) is required.');
      }
      const upiRegex = /^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/;
      if (!upiRegex.test(upiDetails.upiId.trim())) {
        throw new Error('Invalid UPI ID format. Example: mobile@upi or name@okaxis');
      }
    } else if (method === 'BANK_ACCOUNT') {
      if (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifscCode) {
        throw new Error('Account number and IFSC code are required for bank transfer.');
      }
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(bankDetails.ifscCode.trim().toUpperCase())) {
        throw new Error('Invalid IFSC Code. Must be 11 characters, 5th character 0. Example: SBIN0001234');
      }
    }

    return await this.db.acquireUserLock(userId, async () => {
      const user = this.db.getUserById(userId);
      if (!user) throw new Error('User not found.');
      if (!user.isActive) throw new Error('Account is suspended.');
      if (user.isPaused) throw new Error('Account is self-paused under Responsible Gaming limits.');

      if (user.virtualBalance < amount) {
        throw new Error(`Insufficient balance for withdrawal. Available: ₹${user.virtualBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`);
      }

      // Check pending withdrawals count to prevent spamming
      const userWithdrawals = this.db.getUserWithdrawals(userId);
      const pendingCount = userWithdrawals.filter((w) => w.status === 'PENDING' || w.status === 'PROCESSING').length;
      if (pendingCount >= 3) {
        throw new Error('You currently have 3 pending withdrawal requests. Please wait until they are processed.');
      }

      // Hold/deduct balance immediately to avoid double-spend race condition
      const balanceBefore = user.virtualBalance;
      const balanceAfter = balanceBefore - amount;
      user.virtualBalance = balanceAfter;
      this.db.saveUser(user);

      const txRef = `WTH-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const withdrawal: WithdrawalRequest = {
        id: `wth_${crypto.randomBytes(8).toString('hex')}`,
        userId,
        amount,
        currency: 'INR',
        method,
        upiDetails: method === 'UPI' ? upiDetails : undefined,
        bankDetails: method === 'BANK_ACCOUNT' ? bankDetails : undefined,
        status: 'PENDING',
        transactionReference: txRef,
        createdAt: Date.now(),
      };
      this.db.saveWithdrawalRequest(withdrawal);

      const ledgerTx: WalletTransaction = {
        id: `tx_${crypto.randomBytes(8).toString('hex')}`,
        userId,
        type: 'WITHDRAWAL_HOLD',
        amount: -amount,
        balanceBefore,
        balanceAfter,
        referenceId: withdrawal.id,
        description: `Payout request initiated via ${method} (Ref: ${txRef})`,
        timestamp: Date.now(),
        status: 'COMPLETED',
      };
      this.db.addWalletTransaction(ledgerTx);

      // Notification
      this.db.addNotification({
        id: `notif_${crypto.randomBytes(8).toString('hex')}`,
        userId,
        type: 'WITHDRAWAL',
        title: 'Payout Request Submitted',
        message: `Your withdrawal request of ₹${amount.toLocaleString()} (${method}) is pending standard verification.`,
        isRead: false,
        createdAt: Date.now(),
      });

      return { withdrawal, newBalance: balanceAfter, transaction: ledgerTx };
    });
  }

  /**
   * Cancel pending withdrawal and release held balance
   */
  public static async cancelWithdrawal(userId: string, withdrawalId: string): Promise<{ withdrawal: WithdrawalRequest; newBalance: number }> {
    return await this.db.acquireUserLock(userId, async () => {
      const withdrawal = this.db.getWithdrawalRequest(withdrawalId);
      if (!withdrawal) throw new Error('Withdrawal request not found.');
      if (withdrawal.userId !== userId) throw new Error('Unauthorized.');
      if (withdrawal.status !== 'PENDING') {
        throw new Error(`Cannot cancel withdrawal because it is already ${withdrawal.status}.`);
      }

      const user = this.db.getUserById(userId);
      if (!user) throw new Error('User not found.');

      withdrawal.status = 'CANCELLED';
      withdrawal.processedAt = Date.now();
      withdrawal.failureReason = 'Cancelled by player';
      this.db.saveWithdrawalRequest(withdrawal);

      // Refund held balance
      const balanceBefore = user.virtualBalance;
      const balanceAfter = balanceBefore + withdrawal.amount;
      user.virtualBalance = balanceAfter;
      this.db.saveUser(user);

      const ledgerTx: WalletTransaction = {
        id: `tx_${crypto.randomBytes(8).toString('hex')}`,
        userId,
        type: 'WITHDRAWAL_REFUND',
        amount: withdrawal.amount,
        balanceBefore,
        balanceAfter,
        referenceId: withdrawal.id,
        description: `Refund: Cancelled payout request #${withdrawal.transactionReference}`,
        timestamp: Date.now(),
        status: 'COMPLETED',
      };
      this.db.addWalletTransaction(ledgerTx);

      return { withdrawal, newBalance: balanceAfter };
    });
  }

  /**
   * Claims an active promotion
   */
  public static async claimPromotion(userId: string, promoId: string): Promise<{ promotion: any; newBalance: number; bonusAmount: number }> {
    return await this.db.acquireUserLock(userId, async () => {
      const promo = this.db.getPromotionById(promoId);
      if (!promo) throw new Error('Promotion not found.');
      if (!promo.isActive) throw new Error('This promotion has ended or is inactive.');
      if (Date.now() > promo.endDate) throw new Error('This promotion has expired.');

      if (promo.claimedByUserIds && promo.claimedByUserIds.includes(userId)) {
        throw new Error('You have already claimed this promotion.');
      }

      const user = this.db.getUserById(userId);
      if (!user) throw new Error('User not found.');

      const bonus = promo.bonusAmount;
      const balanceBefore = user.virtualBalance;
      const balanceAfter = balanceBefore + bonus;
      user.virtualBalance = balanceAfter;
      this.db.saveUser(user);

      this.db.claimPromotion(promoId, userId);

      const ledgerTx: WalletTransaction = {
        id: `tx_${crypto.randomBytes(8).toString('hex')}`,
        userId,
        type: 'PROMOTION_BONUS',
        amount: bonus,
        balanceBefore,
        balanceAfter,
        referenceId: promo.id,
        description: `Promotional Bonus: ${promo.title} (Code: ${promo.code})`,
        timestamp: Date.now(),
        status: 'COMPLETED',
      };
      this.db.addWalletTransaction(ledgerTx);

      this.db.addNotification({
        id: `notif_${crypto.randomBytes(8).toString('hex')}`,
        userId,
        type: 'PROMOTION',
        title: 'Promotion Reward Claimed!',
        message: `₹${bonus.toLocaleString()} bonus credited to your account from "${promo.title}".`,
        isRead: false,
        createdAt: Date.now(),
      });

      return { promotion: promo, newBalance: balanceAfter, bonusAmount: bonus };
    });
  }

  /**
   * Debits a user's wallet atomically for placing a bet
   */
  public static async debitForBet(params: {
    userId: string;
    amount: number;
    roundId: string;
    betId: string;
    selectedNumber: string;
  }): Promise<{ transaction: WalletTransaction; newBalance: number }> {
    const { userId, amount, roundId, betId, selectedNumber } = params;

    if (amount <= 0 || !Number.isInteger(amount)) {
      throw new Error('Bet amount must be a positive integer.');
    }

    return await this.db.acquireUserLock(userId, async () => {
      const user = this.db.getUserById(userId);
      if (!user) throw new Error('User not found.');
      if (!user.isActive) throw new Error('User account is suspended.');
      if (user.isPaused) throw new Error('Account is temporarily self-paused.');

      // Check single bet limit
      if (user.singleBetLimit && amount > user.singleBetLimit) {
        throw new Error(`Bet exceeds your responsible gaming single bet limit of ${user.singleBetLimit.toLocaleString()} coins.`);
      }

      // Check daily bet limit
      if (user.dailyBetLimit) {
        const todaySpent = (user.todayBetTotal || 0) + amount;
        if (todaySpent > user.dailyBetLimit) {
          throw new Error(`Bet exceeds your daily limit. Spent today: ${(user.todayBetTotal || 0).toLocaleString()}, Daily limit: ${user.dailyBetLimit.toLocaleString()} coins.`);
        }
      }

      // Check sufficient balance
      if (user.virtualBalance < amount) {
        throw new Error(`Insufficient virtual coin balance. You have ${user.virtualBalance.toLocaleString()} coins.`);
      }

      const balanceBefore = user.virtualBalance;
      const balanceAfter = balanceBefore - amount;

      user.virtualBalance = balanceAfter;
      user.todayBetTotal = (user.todayBetTotal || 0) + amount;
      this.db.saveUser(user);

      const tx: WalletTransaction = {
        id: `tx_${crypto.randomBytes(8).toString('hex')}`,
        userId,
        type: 'BET_DEBIT',
        amount: -amount,
        balanceBefore,
        balanceAfter,
        referenceId: betId,
        roundId,
        description: `Bet placed on #${selectedNumber} (${amount.toLocaleString()} coins)`,
        timestamp: Date.now(),
        status: 'COMPLETED',
      };

      this.db.addWalletTransaction(tx);
      return { transaction: tx, newBalance: balanceAfter };
    });
  }

  /**
   * Credits a user's wallet atomically for a winning bet
   */
  public static async creditForWin(params: {
    userId: string;
    payout: number;
    roundId: string;
    betId: string;
    winningNumber: string;
    multiplier: number;
  }): Promise<{ transaction: WalletTransaction; newBalance: number }> {
    const { userId, payout, roundId, betId, winningNumber, multiplier } = params;

    return await this.db.acquireUserLock(userId, async () => {
      const user = this.db.getUserById(userId);
      if (!user) throw new Error('User not found.');

      const balanceBefore = user.virtualBalance;
      const balanceAfter = balanceBefore + payout;

      user.virtualBalance = balanceAfter;
      this.db.saveUser(user);

      const tx: WalletTransaction = {
        id: `tx_${crypto.randomBytes(8).toString('hex')}`,
        userId,
        type: 'WIN_CREDIT',
        amount: payout,
        balanceBefore,
        balanceAfter,
        referenceId: betId,
        roundId,
        description: `Win payout on #${winningNumber} at ${multiplier}x (${payout.toLocaleString()} coins)`,
        timestamp: Date.now(),
        status: 'COMPLETED',
      };

      this.db.addWalletTransaction(tx);
      return { transaction: tx, newBalance: balanceAfter };
    });
  }

  /**
   * Refunds a bet atomically if a round is cancelled
   */
  public static async refundBet(params: {
    userId: string;
    amount: number;
    roundId: string;
    betId: string;
    reason?: string;
  }): Promise<WalletTransaction> {
    const { userId, amount, roundId, betId, reason } = params;

    return await this.db.acquireUserLock(userId, async () => {
      const user = this.db.getUserById(userId);
      if (!user) throw new Error('User not found.');

      const balanceBefore = user.virtualBalance;
      const balanceAfter = balanceBefore + amount;

      user.virtualBalance = balanceAfter;
      this.db.saveUser(user);

      const tx: WalletTransaction = {
        id: `tx_${crypto.randomBytes(8).toString('hex')}`,
        userId,
        type: 'REFUND',
        amount,
        balanceBefore,
        balanceAfter,
        referenceId: betId,
        roundId,
        description: `Refund: ${reason || 'Round cancelled'} (+${amount.toLocaleString()} coins)`,
        timestamp: Date.now(),
        status: 'COMPLETED',
      };

      this.db.addWalletTransaction(tx);
      return tx;
    });
  }

  /**
   * Daily reload / demo faucet to keep game testing fun and smooth
   */
  public static async claimDemoFaucet(userId: string): Promise<{ transaction: WalletTransaction; newBalance: number }> {
    return await this.db.acquireUserLock(userId, async () => {
      const user = this.db.getUserById(userId);
      if (!user) throw new Error('User not found.');

      const faucetAmount = 1000;
      const balanceBefore = user.virtualBalance;
      const balanceAfter = balanceBefore + faucetAmount;

      user.virtualBalance = balanceAfter;
      this.db.saveUser(user);

      const tx: WalletTransaction = {
        id: `tx_${crypto.randomBytes(8).toString('hex')}`,
        userId,
        type: 'BONUS',
        amount: faucetAmount,
        balanceBefore,
        balanceAfter,
        description: 'Demo Faucet Reload (+1,000 Virtual Coins)',
        timestamp: Date.now(),
        status: 'COMPLETED',
      };

      this.db.addWalletTransaction(tx);
      return { transaction: tx, newBalance: balanceAfter };
    });
  }

  /**
   * Admin manual virtual coin adjustment with audit trail
   */
  public static async adminAdjustBalance(params: {
    adminUser: User;
    targetUserId: string;
    amount: number;
    reason: string;
    ip: string;
    userAgent: string;
  }): Promise<{ transaction: WalletTransaction; newBalance: number }> {
    const { adminUser, targetUserId, amount, reason, ip, userAgent } = params;

    return await this.db.acquireUserLock(targetUserId, async () => {
      const target = this.db.getUserById(targetUserId);
      if (!target) throw new Error('Target player not found.');

      const balanceBefore = target.virtualBalance;
      const balanceAfter = Math.max(0, balanceBefore + amount);
      const actualDelta = balanceAfter - balanceBefore;

      target.virtualBalance = balanceAfter;
      this.db.saveUser(target);

      const tx: WalletTransaction = {
        id: `tx_${crypto.randomBytes(8).toString('hex')}`,
        userId: targetUserId,
        type: 'ADMIN_ADJUSTMENT',
        amount: actualDelta,
        balanceBefore,
        balanceAfter,
        description: `Admin adjustment by ${adminUser.username}: ${reason}`,
        timestamp: Date.now(),
        status: 'COMPLETED',
      };

      this.db.addWalletTransaction(tx);

      // Add audit log
      this.db.addAuditLog({
        id: `aud_${crypto.randomBytes(8).toString('hex')}`,
        actorId: adminUser.id,
        actorName: adminUser.username,
        actorRole: adminUser.adminRole || 'ADMIN',
        action: 'WALLET_ADJUSTMENT',
        targetType: 'USER',
        targetId: targetUserId,
        previousValue: { balance: balanceBefore },
        newValue: { balance: balanceAfter, delta: actualDelta, reason },
        ip,
        userAgent,
        timestamp: Date.now(),
      });

      return { transaction: tx, newBalance: balanceAfter };
    });
  }
}
