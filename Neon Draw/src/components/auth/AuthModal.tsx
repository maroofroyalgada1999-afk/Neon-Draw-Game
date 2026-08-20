import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Lock,
  User as UserIcon,
  Mail,
  Smartphone,
  CheckCircle2,
  ChevronRight,
  Shield,
  Eye,
  EyeOff,
  Tag,
  Gift,
  Copy,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { sounds } from '../../services/sound';

interface AuthModalProps {
  onOpenLegal?: (page: 'terms' | 'privacy') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onOpenLegal }) => {
  const {
    isAuthModalOpen,
    authModalTab,
    closeAuthModal,
    openAuthModal,
    loginFull,
    registerFull,
    sendMobileOtp,
    loginWithGoogle,
    loginWithFacebook,
    socialLoginDirect,
  } = useAuth();

  // Registration Form State
  const [regMethod, setRegMethod] = useState<'mobile' | 'email'>('mobile');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [referralCode, setReferralCode] = useState<string>('');
  const [promoCode, setPromoCode] = useState<string>('');
  const [promoValidation, setPromoValidation] = useState<{ valid: boolean; bonusAmount?: number; text?: string } | null>(null);

  // Checkboxes
  const [ageConfirmed, setAgeConfirmed] = useState<boolean>(true);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(true);

  // OTP Countdown State
  const [otpCooldown, setOtpCooldown] = useState<number>(0);
  const [otpSentPhone, setOtpSentPhone] = useState<string | null>(null);
  const [testOtpHelper, setTestOtpHelper] = useState<string | null>(null);

  // Login Form State
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginOtpCode, setLoginOtpCode] = useState<string>('');
  const [loginOtpCooldown, setLoginOtpCooldown] = useState<number>(0);
  const [loginTestOtp, setLoginTestOtp] = useState<string | null>(null);

  // Generic Status
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const [showSandboxOptions, setShowSandboxOptions] = useState<boolean>(false);

  // OTP Cooldown Timers
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  useEffect(() => {
    if (loginOtpCooldown <= 0) return;
    const timer = setInterval(() => {
      setLoginOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [loginOtpCooldown]);

  // Read URL query params for referral code if available (e.g. ?ref=ND99-ABC)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        setReferralCode(ref.trim().toUpperCase());
      }
    }
  }, []);

  // Validate Promo Code Live
  const handleValidatePromo = async (code: string) => {
    const clean = code.trim().toUpperCase();
    setPromoCode(clean);
    if (!clean) {
      setPromoValidation(null);
      return;
    }

    try {
      const res = await api.validatePromoCode(clean);
      if (res.valid) {
        setPromoValidation({
          valid: true,
          bonusAmount: res.bonusAmount,
          text: `Valid Promo! +₹${res.bonusAmount} Coins unlocked`,
        });
      } else {
        setPromoValidation({
          valid: false,
          text: res.error || 'Invalid promo code',
        });
      }
    } catch {
      setPromoValidation(null);
    }
  };

  // Send Registration OTP
  const handleSendRegOtp = async () => {
    setError(null);
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendMobileOtp(cleanPhone);
      setOtpCooldown(res.cooldownSeconds || 30);
      setOtpSentPhone(res.phone);
      setTestOtpHelper(res.testOtpCode || '123456');
      sounds.playSelect();
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  // Send Login OTP
  const handleSendLoginOtp = async () => {
    setError(null);
    const cleanPhone = loginIdentifier.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Please enter your 10-digit registered mobile number to receive OTP.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendMobileOtp(cleanPhone);
      setLoginOtpCooldown(res.cooldownSeconds || 30);
      setLoginTestOtp(res.testOtpCode || '123456');
      sounds.playSelect();
    } catch (err: any) {
      setError(err.message || 'Failed to send login OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (authModalTab === 'register') {
      if (!ageConfirmed) {
        setError('You must confirm you are 18+ years of age to register.');
        return;
      }
      if (!termsAccepted) {
        setError('You must accept the Terms & Conditions and Privacy Policy.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Password and Confirm Password do not match.');
        return;
      }

      setLoading(true);
      try {
        await registerFull({
          name: name.trim() || undefined,
          username: username.trim() || undefined,
          email: email.trim() || undefined,
          phoneNumber: phoneNumber.replace(/\D/g, '') || undefined,
          otpCode: otpCode.trim() || undefined,
          password,
          registrationType: regMethod === 'mobile' ? 'MOBILE' : 'EMAIL',
          referralCode: referralCode.trim() || undefined,
          promoCode: promoCode.trim() || undefined,
          termsAccepted,
          ageConfirmed,
        });
      } catch (err: any) {
        setError(err.message || 'Registration failed. Please review your details.');
      } finally {
        setLoading(false);
      }
    } else {
      // Login flow
      if (!loginIdentifier) {
        setError('Please enter your mobile number, email, or username.');
        return;
      }

      setLoading(true);
      try {
        if (loginMethod === 'otp') {
          if (!loginOtpCode) {
            setError('Please enter the 6-digit OTP code.');
            setLoading(false);
            return;
          }
          await loginFull({
            identifier: loginIdentifier.trim(),
            otpCode: loginOtpCode.trim(),
            isOtpLogin: true,
          });
        } else {
          if (!loginPassword) {
            setError('Please enter your account password.');
            setLoading(false);
            return;
          }
          await loginFull({
            identifier: loginIdentifier.trim(),
            password: loginPassword,
            isOtpLogin: false,
          });
        }
      } catch (err: any) {
        setError(err.message || 'Login failed. Invalid credentials.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Google OAuth
  const handleGoogleClick = async () => {
    setError(null);
    setSocialLoading('google');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setSocialLoading(null);
    }
  };

  // Facebook OAuth
  const handleFacebookClick = async () => {
    setError(null);
    setSocialLoading('facebook');
    try {
      await loginWithFacebook();
    } catch (err: any) {
      setError(err.message || 'Facebook authentication failed.');
    } finally {
      setSocialLoading(null);
    }
  };

  // Quick Demo Player Handler
  const handleQuickDemoPlayer = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginFull({
        identifier: 'demo_player',
        password: 'password123',
      });
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSandboxSocialLogin = async (provider: 'GOOGLE' | 'FACEBOOK', emailPreset: string, namePreset: string) => {
    setError(null);
    setSocialLoading(provider.toLowerCase() as any);
    try {
      await socialLoginDirect({
        provider,
        email: emailPreset,
        name: namePreset,
        socialId: `soc_${provider.toLowerCase()}_${Date.now()}`,
        avatarUrl:
          provider === 'GOOGLE'
            ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
      });
    } catch (err: any) {
      setError(err.message || `${provider} login failed`);
    } finally {
      setSocialLoading(null);
    }
  };

  if (!isAuthModalOpen) return null;

  return (
    <div
      id="auth-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-3xl p-5 sm:p-7 shadow-[0_0_70px_rgba(0,0,0,0.9)] overflow-hidden max-h-[94vh] flex flex-col">
        {/* Close Button */}
        <button
          id="btn-close-auth-modal"
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white border border-white/5 transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Modal Brand Header */}
        <div className="text-center mb-4 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto mb-2 text-black font-black text-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-white/20">
            99
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
            {authModalTab === 'login' ? 'Player Login' : 'Player Registration'}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {authModalTab === 'login'
              ? 'Access your secure NEON DRAW-99 gaming account'
              : 'Register now & claim your Welcome Scratch Card'}
          </p>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="overflow-y-auto pr-1 space-y-4 flex-1 scrollbar-thin">
          {/* Main Auth Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-zinc-900 border border-white/5 text-xs font-bold">
            <button
              type="button"
              id="tab-login"
              onClick={() => {
                setError(null);
                openAuthModal('login');
              }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                authModalTab === 'login'
                  ? 'bg-zinc-800 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              id="tab-register"
              onClick={() => {
                setError(null);
                openAuthModal('register');
              }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                authModalTab === 'register'
                  ? 'bg-emerald-500 text-zinc-950 font-black shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Register (₹ Free Bonus)
            </button>
          </div>

          {/* Social Authentication */}
          <div className="grid grid-cols-2 gap-2">
            <button
              id="btn-auth-google"
              type="button"
              onClick={handleGoogleClick}
              disabled={loading || socialLoading !== null}
              className="py-2.5 px-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs border border-white/10 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {socialLoading === 'google' ? (
                <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Google</span>
            </button>

            <button
              id="btn-auth-facebook"
              type="button"
              onClick={handleFacebookClick}
              disabled={loading || socialLoading !== null}
              className="py-2.5 px-3 rounded-2xl bg-[#1877F2]/15 hover:bg-[#1877F2]/25 text-[#1877F2] font-bold text-xs border border-[#1877F2]/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {socialLoading === 'facebook' ? (
                <div className="w-3.5 h-3.5 border-2 border-[#1877F2] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              )}
              <span>Facebook</span>
            </button>
          </div>

          <div className="relative flex py-0.5 items-center">
            <div className="flex-grow border-t border-white/10" />
            <span className="flex-shrink mx-3 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
              or enter details
            </span>
            <div className="flex-grow border-t border-white/10" />
          </div>

          {/* ========================================================================= */}
          {/* REGISTRATION VIEW */}
          {/* ========================================================================= */}
          {authModalTab === 'register' && (
            <div className="space-y-3.5">
              {/* Sub Method Tabs: Mobile vs Email */}
              <div className="flex items-center gap-2 border-b border-white/10 pb-2 text-xs">
                <button
                  type="button"
                  onClick={() => setRegMethod('mobile')}
                  className={`flex items-center gap-1.5 pb-1 font-bold transition-colors cursor-pointer ${
                    regMethod === 'mobile'
                      ? 'text-emerald-400 border-b-2 border-emerald-400'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile Registration (Fast OTP)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRegMethod('email')}
                  className={`flex items-center gap-1.5 pb-1 font-bold transition-colors cursor-pointer ${
                    regMethod === 'email'
                      ? 'text-emerald-400 border-b-2 border-emerald-400'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Registration</span>
                </button>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Method A: Mobile Registration Fields */}
                {regMethod === 'mobile' ? (
                  <>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">
                        Indian Mobile Number (+91)
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-zinc-400">
                            +91
                          </span>
                          <input
                            type="tel"
                            maxLength={10}
                            required
                            placeholder="98765 43210"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-12 pr-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono tracking-wider"
                          />
                        </div>
                        <button
                          type="button"
                          id="btn-send-reg-otp"
                          onClick={handleSendRegOtp}
                          disabled={loading || otpCooldown > 0 || phoneNumber.length !== 10}
                          className="px-3.5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0"
                        >
                          {otpCooldown > 0 ? (
                            <span className="font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {otpCooldown}s
                            </span>
                          ) : (
                            'Send OTP'
                          )}
                        </button>
                      </div>
                    </div>

                    {/* OTP Verification Box */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                          6-Digit OTP Verification Code
                        </label>
                        {testOtpHelper && (
                          <button
                            type="button"
                            onClick={() => setOtpCode(testOtpHelper)}
                            className="text-[10px] text-emerald-400 hover:underline font-mono cursor-pointer"
                          >
                            Auto-fill OTP: {testOtpHelper}
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="Enter 6-digit OTP (e.g. 123456)"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono tracking-widest text-center"
                      />
                    </div>
                  </>
                ) : (
                  /* Method B: Email Registration Fields */
                  <>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-3" />
                        <input
                          type="email"
                          required
                          placeholder="player@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">
                        Full Name / Display Name
                      </label>
                      <div className="relative">
                        <UserIcon className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Arjun Sharma"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Password Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">
                      Create Password
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Min 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-9 pr-8 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Optional Referral Code & Promo Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">
                      Referral Code (Optional)
                    </label>
                    <div className="relative">
                      <Tag className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="ND99-XXXXXX"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono uppercase tracking-wider"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                        Promo Code (Optional)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleValidatePromo('WELCOME100')}
                        className="text-[9px] text-amber-400 hover:underline font-mono"
                      >
                        Try WELCOME100
                      </button>
                    </div>
                    <div className="relative">
                      <Gift className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="e.g. WELCOME100"
                        value={promoCode}
                        onChange={(e) => handleValidatePromo(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono uppercase tracking-wider"
                      />
                    </div>
                    {promoValidation && (
                      <p
                        className={`text-[10px] mt-1 font-medium ${
                          promoValidation.valid ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {promoValidation.text}
                      </p>
                    )}
                  </div>
                </div>

                {/* Mandatory Checkboxes */}
                <div className="p-3 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-zinc-300">
                    <input
                      id="checkbox-age-confirm"
                      type="checkbox"
                      required
                      checked={ageConfirmed}
                      onChange={(e) => setAgeConfirmed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="leading-snug">
                      I confirm I am <strong>18+ years of age</strong> and residing in an eligible state in India.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-zinc-300">
                    <input
                      id="checkbox-terms-agree"
                      type="checkbox"
                      required
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="leading-snug">
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          closeAuthModal();
                          onOpenLegal?.('terms');
                        }}
                        className="text-emerald-400 font-bold hover:underline cursor-pointer"
                      >
                        Terms & Conditions
                      </button>{' '}
                      and{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          closeAuthModal();
                          onOpenLegal?.('privacy');
                        }}
                        className="text-emerald-400 font-bold hover:underline cursor-pointer"
                      >
                        Privacy Policy
                      </button>
                      .
                    </span>
                  </label>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 rounded-2xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Register Button */}
                <button
                  id="btn-auth-register-submit"
                  type="submit"
                  disabled={loading || socialLoading !== null}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-black uppercase tracking-wider text-xs shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all hover:translate-y-[-1px] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4" />
                      <span>CREATE ACCOUNT & UNLOCK SCRATCH CARD</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* LOGIN VIEW */}
          {/* ========================================================================= */}
          {authModalTab === 'login' && (
            <div className="space-y-3.5">
              {/* Login Sub-Mode Switcher */}
              <div className="flex items-center gap-3 border-b border-white/10 pb-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setLoginMethod('password');
                  }}
                  className={`pb-1 font-bold transition-colors cursor-pointer ${
                    loginMethod === 'password'
                      ? 'text-emerald-400 border-b-2 border-emerald-400'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Password Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setLoginMethod('otp');
                  }}
                  className={`pb-1 font-bold transition-colors cursor-pointer ${
                    loginMethod === 'otp'
                      ? 'text-emerald-400 border-b-2 border-emerald-400'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  📱 Mobile OTP Login
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {loginMethod === 'password' ? (
                  <>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">
                        Mobile Number, Email, or Username
                      </label>
                      <div className="relative">
                        <UserIcon className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. 9876543210 or player@mail.com"
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-3" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-9 pr-8 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">
                        10-Digit Mobile Number
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-zinc-400">
                            +91
                          </span>
                          <input
                            type="tel"
                            maxLength={10}
                            required
                            placeholder="98765 43210"
                            value={loginIdentifier}
                            onChange={(e) => setLoginIdentifier(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-12 pr-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                          />
                        </div>
                        <button
                          type="button"
                          id="btn-send-login-otp"
                          onClick={handleSendLoginOtp}
                          disabled={loading || loginOtpCooldown > 0 || loginIdentifier.length !== 10}
                          className="px-3.5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0"
                        >
                          {loginOtpCooldown > 0 ? `${loginOtpCooldown}s` : 'Send OTP'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                          6-Digit Login OTP
                        </label>
                        {loginTestOtp && (
                          <button
                            type="button"
                            onClick={() => setLoginOtpCode(loginTestOtp)}
                            className="text-[10px] text-emerald-400 hover:underline font-mono cursor-pointer"
                          >
                            Auto-fill OTP: {loginTestOtp}
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="Enter 6-digit OTP code"
                        value={loginOtpCode}
                        onChange={(e) => setLoginOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono tracking-widest text-center"
                      />
                    </div>
                  </>
                )}

                {/* Error Box */}
                {error && (
                  <div className="p-3 rounded-2xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  id="btn-auth-login-submit"
                  type="submit"
                  disabled={loading || socialLoading !== null}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider text-xs shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all hover:translate-y-[-1px] cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Log In & Play'}
                </button>
              </form>

              {/* Instant Sandbox Demo Access */}
              <div className="p-3 rounded-2xl bg-zinc-900/80 border border-emerald-500/20 flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-emerald-400 block font-mono">
                    1-Click Demo Account
                  </span>
                  <span className="text-[10px] text-zinc-400">Pre-seeded with ₹1,000 Coins</span>
                </div>
                <button
                  id="btn-auth-quick-demo"
                  type="button"
                  onClick={handleQuickDemoPlayer}
                  disabled={loading || socialLoading !== null}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                >
                  Instant Play
                </button>
              </div>
            </div>
          )}

          {/* Social Sandbox Expansion */}
          <div className="border border-white/5 rounded-2xl p-2.5 bg-zinc-900/40">
            <button
              type="button"
              onClick={() => setShowSandboxOptions(!showSandboxOptions)}
              className="w-full flex items-center justify-between text-[11px] font-mono text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Test Social Accounts (Instant Switcher)</span>
              </span>
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform ${
                  showSandboxOptions ? 'rotate-90 text-emerald-400' : ''
                }`}
              />
            </button>

            {showSandboxOptions && (
              <div className="mt-2.5 pt-2.5 border-t border-white/5 space-y-1.5 animate-in fade-in duration-100">
                <button
                  type="button"
                  onClick={() =>
                    handleSandboxSocialLogin('GOOGLE', 'maroof.roy@gmail.com', 'Maroof Royal (Google)')
                  }
                  className="w-full text-left px-3 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-xs text-zinc-300 flex items-center justify-between border border-white/5 cursor-pointer"
                >
                  <span className="truncate">Google: maroof.roy@gmail.com</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold shrink-0">Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSandboxSocialLogin('FACEBOOK', 'alex.player@facebook.com', 'Alex Rivera (Facebook)')
                  }
                  className="w-full text-left px-3 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-xs text-zinc-300 flex items-center justify-between border border-white/5 cursor-pointer"
                >
                  <span className="truncate">Facebook: alex.player@fb.com</span>
                  <span className="text-[10px] text-[#1877F2] font-mono font-bold shrink-0">Sign In</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Switcher */}
        <div className="pt-3 mt-3 border-t border-white/5 text-center text-xs text-zinc-400 shrink-0">
          {authModalTab === 'login' ? (
            <p>
              New player?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  openAuthModal('register');
                }}
                className="text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                Create Account & Claim ₹50–₹100 Scratch Card
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  openAuthModal('login');
                }}
                className="text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                Log In to Account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
