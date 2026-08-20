import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session, AdminRole } from '../types/index';
import { api } from '../services/api';
import { sounds } from '../services/sound';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  sessions: Session[];
  currentSessionId: string | null;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  welcomeScratchCard: any | null;
  isWelcomeModalOpen: boolean;
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  closeWelcomeModal: () => void;
  sendMobileOtp: (phoneNumber: string) => Promise<{ success: boolean; phone: string; cooldownSeconds: number; testOtpCode: string }>;
  login: (identifier: string, pass: string) => Promise<void>;
  loginFull: (payload: { identifier: string; password?: string; otpCode?: string; isOtpLogin?: boolean }) => Promise<void>;
  register: (name: string, username: string, email: string, pass: string) => Promise<void>;
  registerFull: (payload: {
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
  }) => Promise<any>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  socialLoginDirect: (payload: {
    provider: 'GOOGLE' | 'FACEBOOK';
    email: string;
    name: string;
    avatarUrl?: string;
    socialId?: string;
  }) => Promise<void>;
  adminQuickLogin: (role?: AdminRole) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  claimFaucet: () => Promise<void>;
  revokeOtherSessions: () => Promise<void>;
  updateLimits: (daily?: number, single?: number, isPaused?: boolean) => Promise<void>;
  updateUserBalanceDirectly: (newBalance: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [welcomeScratchCard, setWelcomeScratchCard] = useState<any | null>(null);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(false);

  const refreshUser = useCallback(async () => {
    const token = api.getToken();
    if (!token) {
      setUser(null);
      setSessions([]);
      setCurrentSessionId(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
      setSessions(data.sessions || []);
      setCurrentSessionId(data.currentSessionId || null);
    } catch {
      api.clearToken();
      setUser(null);
      setSessions([]);
      setCurrentSessionId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Listen for OAuth popup postMessage
  useEffect(() => {
    const handleOAuthMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { token, user: authedUser } = event.data;
        if (token) {
          api.setToken(token);
          setUser(authedUser);
          setIsAuthModalOpen(false);
          sounds.playBonus();
          await refreshUser();
        }
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [refreshUser]);

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const closeWelcomeModal = () => {
    setIsWelcomeModalOpen(false);
  };

  const sendMobileOtp = async (phoneNumber: string) => {
    return await api.sendOtp(phoneNumber);
  };

  const login = async (identifier: string, pass: string) => {
    const res = await api.login({ identifier, password: pass });
    setUser(res.user);
    closeAuthModal();
    sounds.playSelect();
    await refreshUser();
  };

  const loginFull = async (payload: { identifier: string; password?: string; otpCode?: string; isOtpLogin?: boolean }) => {
    const res = await api.login(payload);
    setUser(res.user);
    closeAuthModal();
    sounds.playSelect();
    await refreshUser();
  };

  const register = async (name: string, username: string, email: string, pass: string) => {
    const res = await api.register({
      name,
      username,
      email,
      password: pass,
      termsAccepted: true,
      ageConfirmed: true,
    });
    setUser(res.user);
    if (res.welcomeScratchCard) {
      setWelcomeScratchCard(res.welcomeScratchCard);
      setIsWelcomeModalOpen(true);
    }
    closeAuthModal();
    sounds.playBonus();
    await refreshUser();
  };

  const registerFull = async (payload: {
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
  }) => {
    const res = await api.register(payload);
    setUser(res.user);
    if (res.welcomeScratchCard) {
      setWelcomeScratchCard(res.welcomeScratchCard);
      setIsWelcomeModalOpen(true);
    }
    closeAuthModal();
    sounds.playBonus();
    await refreshUser();
    return res;
  };

  const socialLoginDirect = async (payload: {
    provider: 'GOOGLE' | 'FACEBOOK';
    email: string;
    name: string;
    avatarUrl?: string;
    socialId?: string;
  }) => {
    const res = await api.socialLogin(payload);
    setUser(res.user);
    closeAuthModal();
    sounds.playBonus();
    await refreshUser();
  };

  const loginWithGoogle = async () => {
    try {
      const oauthUrlRes = await api.getOAuthUrl('google');
      if (oauthUrlRes.isConfigured && oauthUrlRes.url) {
        // Open OAuth popup directly to Google
        const popup = window.open(
          oauthUrlRes.url,
          'google_oauth_popup',
          'width=550,height=650,left=200,top=100,menubar=no,toolbar=no'
        );
        if (!popup) {
          throw new Error('Popup was blocked by your browser. Please allow popups for Google sign-in.');
        }
      } else {
        // If OAuth credentials are not yet configured in environment variables,
        // execute instant Sandbox Google sign-in with verified player profile
        const sampleEmail = 'google_player@neondraw.game';
        const sampleName = 'Google Verified Player';
        const sampleAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';
        await socialLoginDirect({
          provider: 'GOOGLE',
          email: sampleEmail,
          name: sampleName,
          avatarUrl: sampleAvatar,
          socialId: `goog_${Date.now()}`,
        });
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      throw err;
    }
  };

  const loginWithFacebook = async () => {
    try {
      const oauthUrlRes = await api.getOAuthUrl('facebook');
      if (oauthUrlRes.isConfigured && oauthUrlRes.url) {
        // Open OAuth popup directly to Facebook
        const popup = window.open(
          oauthUrlRes.url,
          'facebook_oauth_popup',
          'width=600,height=700,left=200,top=100,menubar=no,toolbar=no'
        );
        if (!popup) {
          throw new Error('Popup was blocked by your browser. Please allow popups for Facebook sign-in.');
        }
      } else {
        // If OAuth credentials are not yet configured in environment variables,
        // execute instant Sandbox Facebook sign-in with verified player profile
        const sampleEmail = 'facebook_player@neondraw.game';
        const sampleName = 'Facebook Player';
        const sampleAvatar = 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80';
        await socialLoginDirect({
          provider: 'FACEBOOK',
          email: sampleEmail,
          name: sampleName,
          avatarUrl: sampleAvatar,
          socialId: `fb_${Date.now()}`,
        });
      }
    } catch (err: any) {
      console.error('Facebook login error:', err);
      throw err;
    }
  };

  const adminQuickLogin = async (role: AdminRole = 'SUPER_ADMIN') => {
    const res = await api.adminQuickLogin(role);
    setUser(res.user);
    closeAuthModal();
    sounds.playSelect();
    await refreshUser();
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.warn('Logout network notice:', err);
    } finally {
      api.clearToken();
      setUser(null);
      setSessions([]);
      setCurrentSessionId(null);
      sounds.playLoss();
    }
  };

  const claimFaucet = async () => {
    if (!user) return;
    const res = await api.claimDemoFaucet();
    setUser((prev) => (prev ? { ...prev, virtualBalance: res.newBalance } : null));
    sounds.playBonus();
  };

  const revokeOtherSessions = async () => {
    await api.revokeOtherSessions();
    await refreshUser();
    sounds.playSelect();
  };

  const updateLimits = async (daily?: number, single?: number, isPaused?: boolean) => {
    const res = await api.updateResponsibleGaming({
      dailyBetLimit: daily,
      singleBetLimit: single,
      isPaused,
    });
    setUser(res.user);
    sounds.playSelect();
  };

  const updateUserBalanceDirectly = (newBalance: number) => {
    setUser((prev) => (prev ? { ...prev, virtualBalance: newBalance } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sessions,
        currentSessionId,
        isAuthModalOpen,
        authModalTab,
        welcomeScratchCard,
        isWelcomeModalOpen,
        openAuthModal,
        closeAuthModal,
        closeWelcomeModal,
        sendMobileOtp,
        login,
        loginFull,
        register,
        registerFull,
        loginWithGoogle,
        loginWithFacebook,
        socialLoginDirect,
        adminQuickLogin,
        logout,
        refreshUser,
        claimFaucet,
        revokeOtherSessions,
        updateLimits,
        updateUserBalanceDirectly,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
