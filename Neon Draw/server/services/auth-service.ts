import crypto from 'crypto';
import { Database } from '../db/database.js';
import { User, Session, AdminRole } from '../../src/types/index.js';

export class AuthService {
  private static db = Database.getInstance();
  private static loginAttempts: Map<string, { count: number; lockedUntil?: number }> = new Map();

  public static async register(params: {
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
    ip: string;
    userAgent: string;
  }): Promise<{ user: User; token: string; welcomeScratchCard?: any }> {
    const {
      name,
      username,
      email,
      phoneNumber,
      otpCode,
      password,
      registrationType = phoneNumber ? 'MOBILE' : 'EMAIL',
      referralCode,
      promoCode,
      termsAccepted,
      ageConfirmed,
      ip,
      userAgent,
    } = params;

    // Mandatory Terms & Age Confirmation
    if (!termsAccepted || !ageConfirmed) {
      throw new Error('You must accept the Terms of Service & Privacy Policy and confirm you are 18+ years of age.');
    }

    let cleanPhone: string | undefined = undefined;
    let cleanEmail: string | undefined = undefined;
    let finalUsername = '';
    let finalName = '';

    if (registrationType === 'MOBILE') {
      if (!phoneNumber) {
        throw new Error('Mobile number is required for mobile registration.');
      }
      cleanPhone = phoneNumber.replace(/[^0-9]/g, '').slice(-10);
      if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
        throw new Error('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
      }

      // Check if phone already registered
      if (this.db.getUserByPhone(cleanPhone)) {
        throw new Error('This mobile number is already registered. Please login.');
      }

      // Verify OTP if provided
      if (otpCode) {
        const isValidOtp = this.db.verifyMobileOtp(cleanPhone, otpCode);
        if (!isValidOtp) {
          throw new Error('Invalid or expired OTP code. Please enter the correct 6-digit code or request a new one.');
        }
      }

      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }

      finalName = (name && name.trim().length >= 2) ? name.trim() : `Player +91 ${cleanPhone.slice(0, 5)}...`;
      
      if (username && username.trim().length >= 3 && /^[a-zA-Z0-9_]+$/.test(username.trim())) {
        finalUsername = username.trim().toLowerCase();
        if (this.db.getUserByUsernameOrEmail(finalUsername)) {
          finalUsername = `user_${cleanPhone.slice(-4)}_${crypto.randomBytes(2).toString('hex')}`;
        }
      } else {
        finalUsername = `in_${cleanPhone.slice(-4)}_${crypto.randomBytes(2).toString('hex')}`;
      }

      cleanEmail = email && email.includes('@') ? email.trim().toLowerCase() : `m_${cleanPhone}@neondraw.in`;
    } else {
      // Email Registration
      if (!email || !email.includes('@')) {
        throw new Error('A valid email address is required.');
      }
      cleanEmail = email.trim().toLowerCase();
      if (this.db.getUserByUsernameOrEmail(cleanEmail) || this.db.getUserByEmail(cleanEmail)) {
        throw new Error('This email address is already registered. Please login.');
      }

      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }

      if (phoneNumber) {
        const testPhone = phoneNumber.replace(/[^0-9]/g, '').slice(-10);
        if (testPhone.length === 10) {
          if (this.db.getUserByPhone(testPhone)) {
            throw new Error('This mobile number is already linked to an existing account.');
          }
          cleanPhone = testPhone;
        }
      }

      finalName = (name && name.trim().length >= 2) ? name.trim() : cleanEmail.split('@')[0];
      
      if (username && username.trim().length >= 3 && /^[a-zA-Z0-9_]+$/.test(username.trim())) {
        finalUsername = username.trim().toLowerCase();
        if (this.db.getUserByUsernameOrEmail(finalUsername)) {
          throw new Error('Username already taken. Please choose another username.');
        }
      } else {
        const base = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase().slice(0, 10);
        finalUsername = `${base || 'player'}_${crypto.randomBytes(2).toString('hex')}`;
      }
    }

    const userId = `usr_${crypto.randomBytes(8).toString('hex')}`;
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = this.db.hashPassword(password, salt);
    const userReferralCode = this.db.generateUniqueReferralCode(finalUsername);

    // Validate and link Referral Code if provided
    let referrerUser: any = null;
    if (referralCode && referralCode.trim()) {
      const ref = this.db.getUserByReferralCode(referralCode.trim());
      if (ref && ref.id !== userId) {
        referrerUser = ref;
      }
    }

    const now = Date.now();
    const newUser = {
      id: userId,
      name: finalName,
      username: finalUsername,
      email: cleanEmail,
      phoneNumber: cleanPhone ? `+91 ${cleanPhone}` : undefined,
      phoneVerified: registrationType === 'MOBILE' && Boolean(otpCode),
      country: 'IN',
      currency: 'INR',
      referralCode: userReferralCode,
      referredBy: referrerUser ? referrerUser.id : undefined,
      role: 'PLAYER' as const,
      authProvider: (registrationType === 'MOBILE' ? 'PHONE' : 'EMAIL') as any,
      virtualBalance: 0, // Real player balance initialized to ₹0 / 0 Coins
      isActive: true,
      isDeleted: false,
      termsAcceptedAt: now,
      privacyPolicyAcceptedAt: now,
      termsVersion: '2.0-IN',
      privacyPolicyVersion: '2.0-IN',
      riskScore: 0,
      createdAt: now,
      lastLoginAt: now,
      passwordHash,
      salt,
    };

    this.db.saveUser(newUser);

    // 1. Generate Server-Side Welcome Scratch Card (50-100 Coins)
    const welcomeScratchCard = this.db.createWelcomeScratchCard(userId);

    // 2. If valid referral, generate Referral Scratch Card for the Referrer (+100 Coins)
    if (referrerUser) {
      const refCard = this.db.createReferralScratchCard(referrerUser.id, userId, newUser.username);
      this.db.addNotification({
        id: `notif_ref_${crypto.randomBytes(8).toString('hex')}`,
        userId: referrerUser.id,
        type: 'PROMOTION',
        title: '🎉 New Referral Joined!',
        message: `Player @${newUser.username} joined with your code! You unlocked a 100 Coin (₹100) Referral Scratch Card!`,
        isRead: false,
        createdAt: now,
      });
    }

    // 3. If Promo Code provided, validate and apply
    if (promoCode && promoCode.trim()) {
      try {
        await this.db.applyPromoCode(promoCode.trim(), userId);
      } catch (err: any) {
        console.warn(`Promo code application failed during registration: ${err?.message}`);
      }
    }

    // Welcome Notification
    this.db.addNotification({
      id: `notif_wel_${crypto.randomBytes(8).toString('hex')}`,
      userId,
      type: 'SYSTEM',
      title: '🌟 Welcome to NEON DRAW-99!',
      message: `Your account is ready! Claim your Welcome Scratch Card (50-100 Coins) from your account rewards.`,
      isRead: false,
      createdAt: now,
    });

    // Create session
    const session = this.createSession(userId, ip, userAgent);
    const updatedUser = this.db.getUserById(userId) || newUser;
    const { passwordHash: _, salt: __, ...safeUser } = updatedUser;
    return { user: safeUser, token: session.token, welcomeScratchCard };
  }

  public static async login(params: {
    identifier: string;
    password?: string;
    otpCode?: string;
    isOtpLogin?: boolean;
    ip: string;
    userAgent: string;
  }): Promise<{ user: User; token: string }> {
    const { identifier, password, otpCode, isOtpLogin, ip, userAgent } = params;
    const key = `${ip}_${identifier.toLowerCase()}`;
    const attempt = this.loginAttempts.get(key) || { count: 0 };

    if (attempt.lockedUntil && Date.now() < attempt.lockedUntil) {
      const waitSeconds = Math.ceil((attempt.lockedUntil - Date.now()) / 1000);
      throw new Error(`Account temporarily locked due to excessive failed attempts. Please retry in ${waitSeconds}s.`);
    }

    // Try finding by username, email, phone, or referralCode
    let user =
      this.db.getUserByUsernameOrEmail(identifier) ||
      this.db.getUserByEmail(identifier) ||
      this.db.getUserByPhone(identifier) ||
      this.db.getUserByReferralCode(identifier);

    if (!user) {
      this.recordFailedLogin(key, identifier, ip);
      throw new Error('Account not found with provided mobile number, email, or username.');
    }

    if (!user.isActive) {
      throw new Error('Your account has been suspended. Please contact support desk.');
    }

    if (isOtpLogin && otpCode) {
      const rawPhone = user.phoneNumber || identifier;
      const isValid = this.db.verifyMobileOtp(rawPhone, otpCode);
      if (!isValid) {
        this.recordFailedLogin(key, identifier, ip, user.id);
        throw new Error('Invalid or expired OTP code.');
      }
    } else {
      if (!password) {
        throw new Error('Password is required.');
      }
      const testHash = this.db.hashPassword(password, user.salt);
      if (testHash !== user.passwordHash) {
        this.recordFailedLogin(key, identifier, ip, user.id);
        throw new Error('Invalid credentials. Please check your password.');
      }
    }

    // Reset failed attempts
    this.loginAttempts.delete(key);

    user.lastLoginAt = Date.now();
    this.db.saveUser(user);

    const session = this.createSession(user.id, ip, userAgent);
    const { passwordHash: _, salt: __, ...safeUser } = user;
    return { user: safeUser, token: session.token };
  }

  public static async socialLogin(params: {
    provider: 'GOOGLE' | 'FACEBOOK';
    socialId: string;
    email: string;
    name: string;
    avatarUrl?: string;
    emailVerified?: boolean;
    ip: string;
    userAgent: string;
  }): Promise<{ user: User; token: string }> {
    const { provider, socialId, email, name, avatarUrl, emailVerified, ip, userAgent } = params;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error(`Valid email required from ${provider} authentication.`);
    }

    // 1. Check for existing user by social ID or verified Email address
    let user = this.db.getUserBySocialId(provider, socialId) || this.db.getUserByEmail(cleanEmail);

    if (user) {
      // Existing User Account Linking
      if (!user.isActive) {
        throw new Error('Your account has been suspended. Please contact support.');
      }

      // Link social provider & identity to existing account
      user.authProvider = provider;
      user.socialId = socialId;
      if (avatarUrl) {
        user.avatarUrl = avatarUrl;
      }
      user.emailVerified = emailVerified ?? true;
      user.lastLoginAt = Date.now();

      // Ensure social login strictly enforces PLAYER role if not admin
      if (user.role !== 'ADMIN') {
        user.role = 'PLAYER';
      }

      this.db.saveUser(user);

      const session = this.createSession(user.id, ip, userAgent);
      const { passwordHash: _, salt: __, ...safeUser } = user;
      return { user: safeUser, token: session.token };
    }

    // 2. New User Registration via Social Auth
    const config = this.db.getConfig();
    const startingCoins = config.defaultStartingCoins || 1000;
    const userId = `usr_${crypto.randomBytes(8).toString('hex')}`;
    const salt = crypto.randomBytes(16).toString('hex');
    const randomPass = crypto.randomBytes(32).toString('hex');
    const passwordHash = this.db.hashPassword(randomPass, salt);

    // Derive a unique username
    let baseUsername = (cleanEmail.split('@')[0] || name || 'player')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .toLowerCase()
      .slice(0, 14);
    if (baseUsername.length < 3) baseUsername = `${provider.toLowerCase()}_player`;

    let finalUsername = baseUsername;
    let attempts = 0;
    while (this.db.getUserByUsernameOrEmail(finalUsername) && attempts < 20) {
      const suffix = Math.floor(10 + Math.random() * 89);
      finalUsername = `${baseUsername.slice(0, 11)}_${suffix}`;
      attempts++;
    }
    if (this.db.getUserByUsernameOrEmail(finalUsername)) {
      finalUsername = `player_${crypto.randomBytes(3).toString('hex')}`;
    }

    const now = Date.now();
    const newUser = {
      id: userId,
      name: (name || finalUsername).trim(),
      username: finalUsername,
      email: cleanEmail,
      role: 'PLAYER' as const, // Social logins always assign PLAYER role
      authProvider: provider,
      avatarUrl: avatarUrl || undefined,
      socialId,
      emailVerified: emailVerified ?? true,
      virtualBalance: startingCoins,
      isActive: true,
      riskScore: 0,
      createdAt: now,
      lastLoginAt: now,
      passwordHash,
      salt,
    };

    this.db.saveUser(newUser);

    // Initial Ledger Entry for Welcome virtual coins
    this.db.addWalletTransaction({
      id: `tx_${crypto.randomBytes(8).toString('hex')}`,
      userId,
      type: 'REGISTRATION_BONUS',
      amount: startingCoins,
      balanceBefore: 0,
      balanceAfter: startingCoins,
      description: `Welcome bonus virtual coins (${startingCoins.toLocaleString()} coins via ${provider})`,
      timestamp: now,
      status: 'COMPLETED',
    });

    const session = this.createSession(userId, ip, userAgent);
    const { passwordHash: _, salt: __, ...safeUser } = newUser;
    return { user: safeUser, token: session.token };
  }

  public static async demoQuickLogin(ip = '127.0.0.1', userAgent = 'Demo-Player'): Promise<{ user: User; token: string }> {
    let user = this.db.getUserById('usr_demo_player') || this.db.getUserByUsernameOrEmail('demo_player');
    if (!user) {
      const salt = crypto.randomBytes(16).toString('hex');
      user = {
        id: 'usr_demo_player',
        name: 'Demo Player',
        username: 'demo_player',
        email: 'demo@neondraw.game',
        role: 'PLAYER',
        virtualBalance: 1000,
        isActive: true,
        riskScore: 0,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
        passwordHash: this.db.hashPassword('DemoPass123!', salt),
        salt,
      };
      this.db.saveUser(user);
    } else {
      user.lastLoginAt = Date.now();
      this.db.saveUser(user);
    }

    const session = this.createSession(user.id, ip, userAgent);
    const { passwordHash: _, salt: __, ...safeUser } = user;
    return { user: safeUser, token: session.token };
  }

  public static async adminQuickLogin(role: AdminRole = 'SUPER_ADMIN', ip = '127.0.0.1', userAgent = 'Admin-Console'): Promise<{ user: User; token: string }> {
    let admin = this.db.getUserById('usr_admin_master');
    if (!admin) {
      const salt = crypto.randomBytes(16).toString('hex');
      admin = {
        id: 'usr_admin_master',
        name: 'System Super Admin',
        username: 'admin',
        email: 'admin@number99.game',
        role: 'ADMIN',
        adminRole: role,
        virtualBalance: 100000,
        isActive: true,
        riskScore: 0,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
        passwordHash: this.db.hashPassword('AdminSecret2026!', salt),
        salt,
      };
      this.db.saveUser(admin);
    } else {
      admin.adminRole = role;
      admin.lastLoginAt = Date.now();
      this.db.saveUser(admin);
    }

    const session = this.createSession(admin.id, ip, userAgent);
    const { passwordHash: _, salt: __, ...safeUser } = admin;
    return { user: safeUser, token: session.token };
  }

  public static createSession(userId: string, ip: string, userAgent: string): Session {
    const token = `sess_${crypto.randomBytes(24).toString('hex')}`;
    let deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop';
    const ua = (userAgent || '').toLowerCase();
    if (/tablet|ipad/.test(ua)) deviceType = 'tablet';
    else if (/mobile|android|iphone/.test(ua)) deviceType = 'mobile';

    const session: Session = {
      id: `sid_${crypto.randomBytes(8).toString('hex')}`,
      userId,
      token,
      ip,
      userAgent: userAgent || 'Unknown Device',
      deviceType,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      lastActiveAt: Date.now(),
    };

    this.db.saveSession(session);
    return session;
  }

  public static validateToken(token: string): { user: User; session: Session } | null {
    if (!token) return null;
    const session = this.db.getSession(token);
    if (!session) return null;

    const user = this.db.getUserById(session.userId);
    if (!user || !user.isActive) return null;

    // Refresh last active
    session.lastActiveAt = Date.now();
    this.db.saveSession(session);

    const { passwordHash: _, salt: __, ...safeUser } = user;
    return { user: safeUser, session };
  }

  public static logout(token: string): void {
    this.db.deleteSession(token);
  }

  public static logoutAllOtherSessions(userId: string, currentToken: string): void {
    this.db.deleteAllUserSessionsExcept(userId, currentToken);
  }

  public static async deleteAccount(userId: string, ip: string, userAgent: string): Promise<boolean> {
    const user = this.db.getUserById(userId);
    if (!user) throw new Error('User not found.');

    const now = Date.now();
    // Soft-delete / anonymize user record and mark deleted
    this.db.saveUser({
      ...user,
      isActive: false,
      isDeleted: true,
      deletedAt: now,
      name: 'Deleted User',
      email: `deleted_${userId}@anonymized.local`,
    });

    // Terminate all sessions
    this.db.deleteAllUserSessionsExcept(userId, '');

    // Record Security Event & Audit Log
    this.db.addSecurityEvent({
      id: `sec_${crypto.randomBytes(8).toString('hex')}`,
      userId,
      username: user.username,
      eventType: 'ACCOUNT_DELETED',
      severity: 'MEDIUM',
      details: `User account ${user.username} (${userId}) requested permanent self-deletion.`,
      ip,
      timestamp: now,
    });

    return true;
  }

  private static recordFailedLogin(key: string, identifier: string, ip: string, userId?: string): void {
    const attempt = this.loginAttempts.get(key) || { count: 0 };
    attempt.count += 1;
    if (attempt.count >= 5) {
      attempt.lockedUntil = Date.now() + 60 * 1000; // Lock for 60 seconds
    }
    this.loginAttempts.set(key, attempt);

    this.db.addSecurityEvent({
      id: `sec_${crypto.randomBytes(8).toString('hex')}`,
      userId,
      username: identifier,
      eventType: 'FAILED_LOGIN',
      severity: attempt.count >= 5 ? 'HIGH' : 'LOW',
      details: `Failed login attempt #${attempt.count} for identifier "${identifier}"`,
      ip,
      timestamp: Date.now(),
    });
  }
}
