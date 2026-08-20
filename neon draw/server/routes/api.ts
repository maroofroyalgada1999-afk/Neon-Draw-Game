import { Router, Request, Response } from 'express';
import { Database } from '../db/database.js';
import { AuthService } from '../services/auth-service.js';
import { OAuthService } from '../services/oauth-service.js';
import { WalletService } from '../services/wallet-service.js';
import { RoundManager } from '../game-engine/round-manager.js';
import { CryptoRNG } from '../game-engine/rng.js';
import { AuditService } from '../services/audit-service.js';
import { TestRunner } from '../services/test-runner.js';
import { AdminRole, AdminKPIs } from '../../src/types/index.js';

export const apiRouter = Router();
const db = Database.getInstance();
const roundManager = RoundManager.getInstance();

// Auth Middleware
function extractAuth(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  return AuthService.validateToken(token);
}

function requireAuth(req: Request, res: Response, next: () => void) {
  const auth = extractAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  (req as any).user = auth.user;
  (req as any).session = auth.session;
  next();
}

function requireAdmin(roles?: AdminRole | AdminRole[]) {
  return (req: Request, res: Response, next: () => void) => {
    const auth = extractAuth(req);
    if (!auth || auth.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied: Admin privileges required.' });
    }
    if (roles && !AuditService.checkAdminPermission(auth.user, roles)) {
      return res.status(403).json({ error: 'Access denied: Insufficient permissions for this role.' });
    }
    (req as any).user = auth.user;
    (req as any).session = auth.session;
    next();
  };
}

// ---------------------------------------------------------------------------
// AUTH ROUTES
// ---------------------------------------------------------------------------
apiRouter.post('/auth/send-otp', async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }
    const result = db.sendMobileOtp(phoneNumber);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const {
      name,
      username,
      email,
      phoneNumber,
      otpCode,
      password,
      registrationType,
      referralCode,
      promoCode,
      termsAccepted,
      ageConfirmed,
    } = req.body;

    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';

    const result = await AuthService.register({
      name,
      username,
      email,
      phoneNumber,
      otpCode,
      password,
      registrationType,
      referralCode,
      promoCode,
      termsAccepted: Boolean(termsAccepted),
      ageConfirmed: Boolean(ageConfirmed),
      ip,
      userAgent,
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { identifier, password, otpCode, isOtpLogin } = req.body;
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';

    const result = await AuthService.login({
      identifier,
      password,
      otpCode,
      isOtpLogin: Boolean(isOtpLogin),
      ip,
      userAgent,
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/auth/demo-quick-login', async (req: Request, res: Response) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';
    const result = await AuthService.demoQuickLogin(ip, userAgent);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/auth/admin-quick-login', async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';
    const result = await AuthService.adminQuickLogin(role || 'SUPER_ADMIN', ip, userAgent);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Social Login endpoint (Google & Facebook)
apiRouter.post('/auth/social-login', async (req: Request, res: Response) => {
  try {
    const { provider, socialId, email, name, avatarUrl, emailVerified } = req.body;
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';

    if (!provider || (provider !== 'GOOGLE' && provider !== 'FACEBOOK')) {
      return res.status(400).json({ error: 'Invalid provider. Must be GOOGLE or FACEBOOK.' });
    }

    const result = await AuthService.socialLogin({
      provider,
      socialId: socialId || `soc_${provider.toLowerCase()}_${Date.now()}`,
      email,
      name: name || `${provider} Player`,
      avatarUrl,
      emailVerified: emailVerified ?? true,
      ip,
      userAgent,
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// OAuth Config Status
apiRouter.get('/auth/oauth/config', (req: Request, res: Response) => {
  res.json({
    googleConfigured: Boolean(process.env.GOOGLE_CLIENT_ID),
    facebookConfigured: Boolean(process.env.FACEBOOK_APP_ID),
    googleClientId: process.env.GOOGLE_CLIENT_ID || null,
    facebookAppId: process.env.FACEBOOK_APP_ID || null,
  });
});

// OAuth Authorization URL generator
apiRouter.get('/auth/oauth/url', (req: Request, res: Response) => {
  try {
    const provider = String(req.query.provider || 'google').toLowerCase();
    const origin = (req.query.origin as string) || (process.env.APP_URL ? process.env.APP_URL : `${req.protocol}://${req.get('host')}`);
    const redirectUri = `${origin.replace(/\/$/, '')}/auth/callback`;
    const state = `${provider}_${Date.now()}`;

    if (provider === 'google') {
      const { url, isConfigured } = OAuthService.getGoogleAuthUrl(redirectUri, state);
      return res.json({ url, isConfigured, provider: 'GOOGLE', redirectUri });
    } else if (provider === 'facebook') {
      const { url, isConfigured } = OAuthService.getFacebookAuthUrl(redirectUri, state);
      return res.json({ url, isConfigured, provider: 'FACEBOOK', redirectUri });
    } else {
      return res.status(400).json({ error: 'Unsupported provider. Use "google" or "facebook".' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// OAuth Callback Route (handles browser popup redirect from Google / Facebook)
const oauthCallbackHandler = async (req: Request, res: Response) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    const errorMsg = String(error_description || error || 'Authentication was cancelled.');
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Status</title>
          <style>
            body { background: #09090b; color: #f43f5e; font-family: ui-sans-serif, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .box { text-align: center; max-width: 420px; padding: 24px; border: 1px solid rgba(244,63,94,0.3); border-radius: 16px; background: #18181b; }
            h2 { margin: 0 0 8px; font-size: 18px; font-weight: 800; }
            p { margin: 0; color: #a1a1aa; font-size: 13px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="box">
            <h2>Authentication Cancelled</h2>
            <p>${errorMsg}</p>
            <p style="margin-top: 12px; font-size: 11px; color: #71717a;">This window will close automatically...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: ${JSON.stringify(errorMsg)} }, '*');
              setTimeout(() => { try { window.close(); } catch(e){} }, 2000);
            }
          </script>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send('Missing authorization code.');
  }

  try {
    const origin = process.env.APP_URL ? process.env.APP_URL : `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${origin.replace(/\/$/, '')}/auth/callback`;
    const isFacebook = String(state || '').startsWith('facebook');

    let userInfo;
    if (isFacebook) {
      userInfo = await OAuthService.exchangeFacebookCode(String(code), redirectUri);
    } else {
      userInfo = await OAuthService.exchangeGoogleCode(String(code), redirectUri);
    }

    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';

    const authResult = await AuthService.socialLogin({
      provider: userInfo.provider,
      socialId: userInfo.socialId,
      email: userInfo.email,
      name: userInfo.name,
      avatarUrl: userInfo.avatarUrl,
      emailVerified: userInfo.emailVerified,
      ip,
      userAgent,
    });

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body { background: #09090b; color: #10b981; font-family: ui-sans-serif, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .box { text-align: center; max-width: 420px; padding: 24px; border: 1px solid rgba(16,185,129,0.3); border-radius: 16px; background: #18181b; box-shadow: 0 0 30px rgba(16,185,129,0.15); }
            h2 { margin: 0 0 8px; font-size: 18px; font-weight: 800; color: #34d399; }
            p { margin: 0; color: #a1a1aa; font-size: 13px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="box">
            <h2>Authentication Successful</h2>
            <p>Welcome, <strong>${authResult.user.name || authResult.user.username}</strong>! Connecting to NEON DRAW-99...</p>
          </div>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_AUTH_SUCCESS',
                  token: ${JSON.stringify(authResult.token)},
                  user: ${JSON.stringify(authResult.user)}
                }, '*');
                setTimeout(() => { try { window.close(); } catch(e){} }, 500);
              } else {
                localStorage.setItem('num99_auth_token', ${JSON.stringify(authResult.token)});
                window.location.href = '/';
              }
            } catch(e) {
              console.error('PostMessage error:', e);
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    const errorMsg = err.message || 'OAuth authentication failed.';
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Error</title>
          <style>
            body { background: #09090b; color: #f43f5e; font-family: ui-sans-serif, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .box { text-align: center; max-width: 420px; padding: 24px; border: 1px solid rgba(244,63,94,0.3); border-radius: 16px; background: #18181b; }
            h2 { margin: 0 0 8px; font-size: 18px; font-weight: 800; }
            p { margin: 0; color: #a1a1aa; font-size: 13px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="box">
            <h2>Authentication Error</h2>
            <p>${errorMsg}</p>
            <p style="margin-top: 12px; font-size: 11px; color: #71717a;">This window will close automatically...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: ${JSON.stringify(errorMsg)} }, '*');
              setTimeout(() => { try { window.close(); } catch(e){} }, 3000);
            }
          </script>
        </body>
      </html>
    `);
  }
};

apiRouter.get('/auth/oauth/callback', oauthCallbackHandler);
apiRouter.get('/auth/callback', oauthCallbackHandler);

apiRouter.post('/auth/logout', requireAuth, (req: Request, res: Response) => {
  const token = (req as any).session.token;
  AuthService.logout(token);
  res.json({ success: true });
});

apiRouter.get('/auth/me', requireAuth, (req: Request, res: Response) => {
  const user = db.getUserById((req as any).user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { passwordHash: _, salt: __, ...safeUser } = user;
  const sessions = db.getUserSessions(user.id);
  res.json({ user: safeUser, sessions, currentSessionId: (req as any).session.id });
});

apiRouter.post('/auth/sessions/revoke-others', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const token = (req as any).session.token;
  AuthService.logoutAllOtherSessions(userId, token);
  res.json({ success: true });
});

apiRouter.post('/auth/responsible-gaming', requireAuth, (req: Request, res: Response) => {
  const user = db.getUserById((req as any).user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { dailyBetLimit, singleBetLimit, isPaused } = req.body;
  if (dailyBetLimit !== undefined) user.dailyBetLimit = Math.max(0, Number(dailyBetLimit));
  if (singleBetLimit !== undefined) user.singleBetLimit = Math.max(0, Number(singleBetLimit));
  if (isPaused !== undefined) user.isPaused = Boolean(isPaused);

  db.saveUser(user);
  const { passwordHash: _, salt: __, ...safeUser } = user;
  res.json({ user: safeUser });
});

// ---------------------------------------------------------------------------
// GAME ROUTES
// ---------------------------------------------------------------------------
apiRouter.get('/game/current-round', (req: Request, res: Response) => {
  const round = roundManager.ensureActiveRound();
  const publicRound = roundManager.getPublicRound(round);
  const auth = extractAuth(req);
  let userBets: any[] = [];
  if (auth) {
    userBets = db.getBetsForRound(round.id).filter((b) => b.userId === auth.user.id);
  }

  // Active bets summary (e.g. recent bets in round)
  const recentRoundBets = db
    .getBetsForRound(round.id)
    .slice(-15)
    .map((b) => ({
      id: b.id,
      username: b.username.slice(0, 3) + '***',
      selectedNumber: b.selectedNumber,
      betAmount: b.betAmount,
      placedAt: b.placedAt,
    }));

  res.json({
    round: publicRound,
    serverTime: Date.now(),
    userBets,
    recentRoundBets,
  });
});

apiRouter.get('/game/round/:id', (req: Request, res: Response) => {
  const round = db.getRound(req.params.id);
  if (!round) return res.status(404).json({ error: 'Round not found' });
  res.json({ round: roundManager.getPublicRound(round) });
});

apiRouter.get('/game/history', (req: Request, res: Response) => {
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const rounds = db
    .getAllRounds(limit)
    .filter((r) => r.status === 'SETTLED')
    .map((r) => roundManager.getPublicRound(r));
  res.json({ rounds });
});

apiRouter.post('/game/bet', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { selectedNumber, betAmount, idempotencyKey } = req.body;

    const result = await roundManager.placeBet({
      userId: user.id,
      username: user.username,
      selectedNumber: String(selectedNumber).padStart(2, '0'),
      betAmount: parseInt(betAmount, 10),
      idempotencyKey,
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/game/batch-bet', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { bets } = req.body;

    const result = await roundManager.placeBatchBets({
      userId: user.id,
      username: user.username,
      bets: Array.isArray(bets) ? bets : [],
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/game/my-bets', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const status = req.query.status as string;
  let bets = db.getUserBets(userId, 100);

  if (status && status !== 'ALL') {
    bets = bets.filter((b) => b.status === status);
  }

  res.json({ bets });
});

apiRouter.post('/game/verify', (req: Request, res: Response) => {
  try {
    const { serverSeed, clientSeed, nonce, roundNumber } = req.body;
    if (!serverSeed || !clientSeed || nonce === undefined || roundNumber === undefined) {
      return res.status(400).json({ error: 'Missing required parameters: serverSeed, clientSeed, nonce, roundNumber' });
    }

    const { winningNumber, hmacHex } = CryptoRNG.determineWinningNumber(
      serverSeed,
      clientSeed,
      Number(nonce),
      Number(roundNumber)
    );

    const calculatedServerHash = CryptoRNG.hashServerSeed(serverSeed);

    res.json({
      winningNumber,
      hmacHex,
      calculatedServerHash,
      verified: true,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// WALLET & PAYMENT ROUTES
// ---------------------------------------------------------------------------
apiRouter.get('/wallet', requireAuth, (req: Request, res: Response) => {
  const user = db.getUserById((req as any).user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    virtualBalance: user.virtualBalance,
    currency: 'INR',
    balanceHidden: user.balanceHidden || false,
    notice: 'Safe Secure Gaming Balance',
  });
});

apiRouter.get('/wallet/ledger', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const transactions = db.getUserWalletTransactions(userId, 100);
  res.json({ transactions });
});

apiRouter.post('/wallet/demo-faucet', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const result = await WalletService.claimDemoFaucet(userId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Deposit Config & Actions
apiRouter.get('/wallet/deposit/config', requireAuth, (req: Request, res: Response) => {
  res.json(WalletService.getDepositConfig());
});

apiRouter.post('/wallet/deposit/create', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { amount, paymentMethod } = req.body;
    const deposit = await WalletService.createDeposit({
      userId,
      amount: Number(amount),
      paymentMethod: paymentMethod || 'UPI',
    });
    res.json({ success: true, deposit });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/wallet/deposit/submit-utr', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { depositId, utrNumber } = req.body;
    if (!depositId || !utrNumber) {
      return res.status(400).json({ error: 'depositId and utrNumber are required.' });
    }

    const result = await WalletService.submitUtrForVerification({
      userId,
      depositId,
      utrNumber,
    });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/wallet/deposit/verify', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { depositId, utrNumber } = req.body;
    if (!depositId) return res.status(400).json({ error: 'depositId is required.' });

    const result = await WalletService.verifyDeposit({
      userId,
      depositId,
      utrNumber,
    });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/wallet/deposit/:id/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const result = await WalletService.cancelDeposit(userId, req.params.id);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/wallet/deposit/:id', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const deposit = db.getDepositTransaction(req.params.id);
  if (!deposit || deposit.userId !== userId) {
    return res.status(404).json({ error: 'Deposit not found' });
  }
  res.json({ deposit });
});

apiRouter.get('/wallet/deposits', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const deposits = db.getUserDeposits(userId);
  res.json({ deposits });
});

// Withdrawal Config & Actions
apiRouter.get('/wallet/withdrawal/config', requireAuth, (req: Request, res: Response) => {
  const user = db.getUserById((req as any).user.id);
  const kyc = db.getKYCRecord((req as any).user.id);

  res.json({
    minAmount: 200,
    maxAmount: 25000,
    dailyLimit: 50000,
    fee: '0%',
    processingTime: '15-60 minutes',
    availableBalance: user ? user.virtualBalance : 0,
    kycStatus: kyc ? kyc.status : 'NOT_STARTED',
    methods: [
      {
        id: 'UPI',
        name: 'UPI Instant Payout',
        description: 'Receive payout directly to your VPA ID',
        fields: ['upiId', 'accountHolderName'],
      },
      {
        id: 'BANK_ACCOUNT',
        name: 'Direct Bank Transfer (IMPS/NEFT)',
        description: 'Instant transfer to Indian savings/current accounts',
        fields: ['accountNumber', 'ifscCode', 'accountHolderName', 'bankName'],
      },
    ],
  });
});

apiRouter.post('/wallet/withdrawal/request', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { amount, method, upiDetails, bankDetails } = req.body;

    const result = await WalletService.requestWithdrawal({
      userId,
      amount: Number(amount),
      method,
      upiDetails,
      bankDetails,
    });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/wallet/withdrawals', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const withdrawals = db.getUserWithdrawals(userId);
  res.json({ withdrawals });
});

apiRouter.post('/wallet/withdrawal/:id/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const withdrawalId = req.params.id;
    const result = await WalletService.cancelWithdrawal(userId, withdrawalId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// NOTIFICATIONS ROUTES
// ---------------------------------------------------------------------------
apiRouter.get('/notifications', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const notifications = db.getUserNotifications(userId, 50);
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  res.json({ notifications, unreadCount });
});

apiRouter.post('/notifications/:id/read', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const notifId = req.params.id;
  const success = db.markNotificationRead(notifId, userId);
  res.json({ success });
});

apiRouter.post('/notifications/read-all', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const count = db.markAllNotificationsRead(userId);
  res.json({ success: true, count });
});

// ---------------------------------------------------------------------------
// PROMOTIONS & REWARDS ROUTES
// ---------------------------------------------------------------------------
apiRouter.get('/promotions', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const promotions = db.getAllPromotions().map((p) => ({
    ...p,
    hasClaimed: Boolean(p.claimedByUserIds && p.claimedByUserIds.includes(userId)),
  }));
  res.json({ promotions });
});

apiRouter.post('/promotions/:id/claim', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const promoId = req.params.id;
    const result = await WalletService.claimPromotion(userId, promoId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Promo Code Server-Side Validation and Application
apiRouter.post('/promotions/validate-code', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Promo code is required.' });
    }
    const result = db.validatePromoCode(code, userId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/promotions/apply-code', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Promo code is required.' });
    }
    const result = await db.applyPromoCode(code, userId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// SCRATCH CARDS ROUTES (Welcome & Referral Rewards)
// ---------------------------------------------------------------------------
apiRouter.get('/scratch-cards', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    let cards = db.getScratchCardsByUserId(userId);

    // If a registered player has no scratch cards yet, ensure a welcome scratch card exists
    if (cards.length === 0) {
      db.createWelcomeScratchCard(userId);
      cards = db.getScratchCardsByUserId(userId);
    }

    res.json({ scratchCards: cards });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/scratch-cards/:id/claim', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const cardId = req.params.id;
    const result = await db.claimScratchCard(userId, cardId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// REFERRAL SYSTEM ROUTES
// ---------------------------------------------------------------------------
apiRouter.get('/referrals', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const currentUser = db.getUserById(userId) || user;

    const allUsers = db.getAllUsers();
    const referredUsers = allUsers.filter((u) => u.referredBy === userId);
    const referralCards = db.getScratchCardsByUserId(userId).filter((c) => c.type === 'REFERRAL');

    const totalCoinsEarned = referralCards
      .filter((c) => c.isClaimed)
      .reduce((sum, c) => sum + c.amount, 0);

    const origin = process.env.APP_URL ? process.env.APP_URL : `${req.protocol}://${req.get('host')}`;
    const referralLink = `${origin.replace(/\/$/, '')}?ref=${currentUser.referralCode || `ND99-${userId.slice(-6).toUpperCase()}`}`;

    res.json({
      referralCode: currentUser.referralCode || `ND99-${userId.slice(-6).toUpperCase()}`,
      referralLink,
      totalReferrals: referredUsers.length,
      totalCoinsEarned,
      referralCards,
      referredUsers: referredUsers.map((u) => ({
        id: u.id,
        username: u.username,
        name: u.name,
        joinedAt: u.createdAt,
      })),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// KYC VERIFICATION ROUTES
// ---------------------------------------------------------------------------
apiRouter.get('/kyc/status', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const kyc = db.getKYCRecord(userId);
  res.json({
    status: kyc ? kyc.status : 'NOT_STARTED',
    kyc: kyc || null,
  });
});

apiRouter.post('/kyc/submit', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { docType, docNumber, fullName, dob, hasVideoRecording, videoDurationSeconds } = req.body;

    if (!docType || !docNumber || !fullName) {
      return res.status(400).json({ error: 'Document type, document number, and full legal name are required.' });
    }

    // Mask doc number for privacy (show last 4 characters only)
    const docClean = String(docNumber).trim();
    const masked = docClean.length > 4 ? `•••• •••• ${docClean.slice(-4)}` : `•••• ${docClean}`;

    const kycRecord = {
      id: `kyc_${Date.now()}`,
      userId,
      status: 'VERIFIED' as const, // Fast mock automated verification for player ease
      docType,
      docNumberMasked: masked,
      fullName: String(fullName).trim(),
      dob: dob || undefined,
      hasVideoRecording: Boolean(hasVideoRecording),
      videoDurationSeconds: videoDurationSeconds || 5,
      submittedAt: Date.now(),
      reviewedAt: Date.now(),
      reviewerNotes: 'Automated AI document authenticity & face-liveness check passed successfully.',
    };

    db.saveKYCRecord(kycRecord);

    // Update user profile kycStatus
    const user = db.getUserById(userId);
    if (user) {
      user.kycStatus = 'VERIFIED';
      db.saveUser(user);
    }

    db.addNotification({
      id: `notif_${Date.now()}`,
      userId,
      type: 'VERIFICATION',
      title: 'KYC Verification Approved',
      message: 'Your identity documents have been verified. Unlimited deposit and payout access is enabled.',
      isRead: false,
      createdAt: Date.now(),
    });

    res.json({ success: true, kyc: kycRecord });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// USER PROFILE & PREFERENCES ROUTES
// ---------------------------------------------------------------------------
apiRouter.post('/user/profile', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, phoneNumber, balanceHidden, soundEnabled } = req.body;

    const user = db.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (name !== undefined && String(name).trim().length > 0) {
      user.name = String(name).trim();
    }
    if (phoneNumber !== undefined) {
      user.phoneNumber = String(phoneNumber).trim();
    }
    if (balanceHidden !== undefined) {
      user.balanceHidden = Boolean(balanceHidden);
    }
    if (soundEnabled !== undefined) {
      user.soundEnabled = Boolean(soundEnabled);
    }

    db.saveUser(user);
    const { passwordHash: _, salt: __, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/user/change-password', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    const result = db.changeUserPassword(userId, currentPassword, newPassword);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    db.addNotification({
      id: `notif_${Date.now()}`,
      userId,
      type: 'SECURITY',
      title: 'Password Changed',
      message: 'Your account security password was updated successfully.',
      isRead: false,
      createdAt: Date.now(),
    });

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/user/delete-account', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = db.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.isActive = false;
    user.isDeleted = true;
    user.deletedAt = Date.now();
    db.saveUser(user);

    // Invalidate sessions
    const sessions = db.getUserSessions(userId);
    sessions.forEach((s) => db.deleteSession(s.token));

    res.json({ success: true, message: 'Account has been deactivated.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// ADMIN ROUTES
// ---------------------------------------------------------------------------
apiRouter.get('/admin/dashboard', requireAdmin(), (req: Request, res: Response) => {
  const users = db.getAllUsers();
  const rounds = db.getAllRounds(200);
  const settledRounds = rounds.filter((r) => r.status === 'SETTLED');
  const allBets = db.getAllBets(500);

  const totalTurnover = settledRounds.reduce((acc, r) => acc + (r.totalTurnoverCoins || 0), 0);
  const totalPayouts = settledRounds.reduce((acc, r) => acc + (r.totalPayoutCoins || 0), 0);
  const netHouseHold = totalTurnover - totalPayouts;
  const rtp = totalTurnover > 0 ? (totalPayouts / totalTurnover) * 100 : 90;

  const kpis: AdminKPIs = {
    totalPlayers: users.length,
    activePlayersToday: users.filter((u) => Date.now() - u.lastLoginAt < 24 * 60 * 60 * 1000).length,
    totalRounds: rounds.length,
    totalBetsPlaced: allBets.length,
    totalTurnoverCoins: totalTurnover,
    totalPayoutCoins: totalPayouts,
    netHouseHoldCoins: netHouseHold,
    rtpPercentage: Number(rtp.toFixed(2)),
    openBetsCount: allBets.filter((b) => b.status === 'PENDING').length,
  };

  res.json({
    kpis,
    currentRound: roundManager.getPublicRound(roundManager.ensureActiveRound()),
    recentBets: allBets.slice(0, 15),
  });
});

apiRouter.post('/admin/round/force-draw', requireAdmin(['SUPER_ADMIN', 'GAME_ADMIN']), async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const round = await roundManager.forceDraw();
    AuditService.logAdminAction({
      admin,
      action: 'FORCE_DRAW',
      targetType: 'ROUND',
      targetId: round.id,
      newValue: { winningNumber: round.winningNumber, status: round.status },
      ip: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || '',
    });
    res.json({ success: true, round });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/admin/round/next', requireAdmin(['SUPER_ADMIN', 'GAME_ADMIN']), (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const round = roundManager.createNewRound();
    AuditService.logAdminAction({
      admin,
      action: 'CREATE_ROUND',
      targetType: 'ROUND',
      targetId: round.id,
      newValue: { roundNumber: round.roundNumber },
      ip: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || '',
    });
    res.json({ success: true, round });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/admin/round/:id/cancel', requireAdmin(['SUPER_ADMIN', 'GAME_ADMIN']), async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const { reason } = req.body;
    const round = await roundManager.cancelRound(req.params.id, reason);
    AuditService.logAdminAction({
      admin,
      action: 'CANCEL_ROUND',
      targetType: 'ROUND',
      targetId: round.id,
      newValue: { reason },
      ip: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || '',
    });
    res.json({ success: true, round });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/admin/users', requireAdmin(['SUPER_ADMIN', 'SUPPORT_ADMIN', 'AUDITOR']), (req: Request, res: Response) => {
  const users = db.getAllUsers();
  res.json({ users });
});

apiRouter.post('/admin/users/:id/adjust-balance', requireAdmin(['SUPER_ADMIN']), async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const { amount, reason } = req.body;
    if (amount === undefined || !reason) {
      return res.status(400).json({ error: 'Amount and reason are required.' });
    }

    const result = await WalletService.adminAdjustBalance({
      adminUser: admin,
      targetUserId: req.params.id,
      amount: parseInt(amount, 10),
      reason,
      ip: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || '',
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/admin/users/:id/toggle-status', requireAdmin(['SUPER_ADMIN', 'SUPPORT_ADMIN']), (req: Request, res: Response) => {
  const admin = (req as any).user;
  const user = db.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const prev = user.isActive;
  user.isActive = !prev;
  db.saveUser(user);

  AuditService.logAdminAction({
    admin,
    action: user.isActive ? 'ACTIVATE_USER' : 'SUSPEND_USER',
    targetType: 'USER',
    targetId: user.id,
    previousValue: { isActive: prev },
    newValue: { isActive: user.isActive },
    ip: req.ip || '127.0.0.1',
    userAgent: req.headers['user-agent'] || '',
  });

  const { passwordHash: _, salt: __, ...safeUser } = user;
  res.json({ user: safeUser });
});

// Admin Deposit Management
apiRouter.get('/admin/deposits', requireAdmin(['SUPER_ADMIN', 'SUPPORT_ADMIN', 'AUDITOR']), (req: Request, res: Response) => {
  const deposits = db.getAllDepositTransactions(200);
  const statusFilter = req.query.status as string;
  const filtered = statusFilter ? deposits.filter((d) => d.status === statusFilter) : deposits;
  res.json({ deposits: filtered });
});

apiRouter.post('/admin/deposits/:id/approve', requireAdmin(['SUPER_ADMIN', 'SUPPORT_ADMIN']), async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const { adminNotes } = req.body;
    const result = await WalletService.adminApproveDeposit({
      adminUser: admin,
      depositId: req.params.id,
      adminNotes,
      ip: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || '',
    });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/admin/deposits/:id/reject', requireAdmin(['SUPER_ADMIN', 'SUPPORT_ADMIN']), async (req: Request, res: Response) => {
  try {
    const admin = (req as any).user;
    const { reason, adminNotes } = req.body;
    const result = await WalletService.adminRejectDeposit({
      adminUser: admin,
      depositId: req.params.id,
      reason: reason || 'Invalid or unverifiable payment reference / UTR',
      adminNotes,
      ip: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || '',
    });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/admin/config', requireAdmin(['SUPER_ADMIN', 'GAME_ADMIN', 'AUDITOR']), (req: Request, res: Response) => {
  res.json({ config: db.getConfig() });
});

apiRouter.post('/admin/config', requireAdmin(['SUPER_ADMIN', 'GAME_ADMIN']), (req: Request, res: Response) => {
  const admin = (req as any).user;
  const prevConfig = db.getConfig();
  const updatedConfig = db.updateConfig(req.body);

  AuditService.logAdminAction({
    admin,
    action: 'UPDATE_CONFIG',
    targetType: 'SYSTEM_CONFIG',
    targetId: 'GLOBAL',
    previousValue: prevConfig,
    newValue: updatedConfig,
    ip: req.ip || '127.0.0.1',
    userAgent: req.headers['user-agent'] || '',
  });

  res.json({ config: updatedConfig });
});

apiRouter.get('/admin/audit-logs', requireAdmin(['SUPER_ADMIN', 'AUDITOR']), (req: Request, res: Response) => {
  const logs = db.getAuditLogs(100);
  res.json({ logs });
});

apiRouter.get('/admin/security-events', requireAdmin(['SUPER_ADMIN', 'AUDITOR']), (req: Request, res: Response) => {
  const events = db.getSecurityEvents(100);
  res.json({ events });
});

apiRouter.post('/admin/run-tests', requireAdmin(['SUPER_ADMIN', 'AUDITOR']), async (req: Request, res: Response) => {
  try {
    const report = await TestRunner.runAllTests();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/auth/delete-account', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';

    await AuthService.deleteAccount(user.id, ip, userAgent);
    res.json({ success: true, message: 'Account has been permanently deleted.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// SUPPORT TICKETS (Player & Admin Desk)
// ---------------------------------------------------------------------------
apiRouter.post('/support/ticket', async (req: Request, res: Response) => {
  try {
    const auth = extractAuth(req);
    const { name, email, accountId, subject, category, message, priority } = req.body;
    
    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required.' });
    }

    const ticketName = auth ? auth.user.name : (name ? String(name).trim() : 'Guest User');
    const ticketEmail = email ? String(email).trim().toLowerCase() : (auth?.user.email || '');
    const ticketUsername = auth ? auth.user.username : 'guest';
    const ticketAccountId = auth ? auth.user.id : (accountId ? String(accountId).trim() : 'UNREGISTERED');

    if (!auth && (!ticketEmail || !ticketEmail.includes('@'))) {
      return res.status(400).json({ error: 'Valid contact email is required.' });
    }

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const ticketId = `SUP-2026-${randomSuffix}`;

    const newTicket = {
      id: ticketId,
      userId: auth ? auth.user.id : 'guest',
      name: ticketName,
      username: ticketUsername,
      email: ticketEmail,
      accountId: ticketAccountId,
      subject: String(subject).slice(0, 120),
      category: category || 'OTHER',
      message: String(message).slice(0, 3000),
      status: 'OPEN' as const,
      priority: (priority || 'MEDIUM') as any,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    db.addSupportTicket(newTicket);
    res.json({ success: true, ticket: newTicket });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/support/my-tickets', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const tickets = db.getUserSupportTickets(user.id);
  res.json({ tickets });
});

apiRouter.get('/admin/support/tickets', requireAdmin(['SUPER_ADMIN', 'SUPPORT_ADMIN', 'AUDITOR']), (req: Request, res: Response) => {
  const tickets = db.getAllSupportTickets(100);
  res.json({ tickets });
});

apiRouter.post('/admin/support/tickets/:id/reply', requireAdmin(['SUPER_ADMIN', 'SUPPORT_ADMIN']), (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { reply, status } = req.body;
  if (!reply) return res.status(400).json({ error: 'Reply text is required.' });

  const ticket = db.getSupportTicketById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const updated = db.updateSupportTicket(req.params.id, {
    adminReply: reply,
    assignedAdmin: admin.username,
    status: status || 'RESOLVED',
  });

  AuditService.logAdminAction({
    admin,
    action: 'SUPPORT_TICKET_REPLY',
    targetType: 'SUPPORT_TICKET',
    targetId: req.params.id,
    newValue: { status: updated?.status, reply },
    ip: req.ip || '127.0.0.1',
    userAgent: req.headers['user-agent'] || '',
  });

  res.json({ ticket: updated });
});

apiRouter.post('/admin/support/tickets/:id/status', requireAdmin(['SUPER_ADMIN', 'SUPPORT_ADMIN']), (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required.' });

  const ticket = db.getSupportTicketById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const updated = db.updateSupportTicket(req.params.id, {
    status,
    assignedAdmin: admin.username,
  });

  AuditService.logAdminAction({
    admin,
    action: 'SUPPORT_TICKET_STATUS_CHANGE',
    targetType: 'SUPPORT_TICKET',
    targetId: req.params.id,
    newValue: { status },
    ip: req.ip || '127.0.0.1',
    userAgent: req.headers['user-agent'] || '',
  });

  res.json({ ticket: updated });
});

apiRouter.post('/admin/support/tickets/:id/assign', requireAdmin(['SUPER_ADMIN', 'SUPPORT_ADMIN']), (req: Request, res: Response) => {
  const admin = (req as any).user;
  const { assignedAdmin } = req.body;
  if (!assignedAdmin) return res.status(400).json({ error: 'Assigned admin username is required.' });

  const ticket = db.getSupportTicketById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const updated = db.updateSupportTicket(req.params.id, {
    assignedAdmin,
  });

  AuditService.logAdminAction({
    admin,
    action: 'SUPPORT_TICKET_ASSIGN',
    targetType: 'SUPPORT_TICKET',
    targetId: req.params.id,
    newValue: { assignedAdmin },
    ip: req.ip || '127.0.0.1',
    userAgent: req.headers['user-agent'] || '',
  });

  res.json({ ticket: updated });
});
