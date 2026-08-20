import React, { useState, useEffect } from 'react';
import {
  Coins,
  LifeBuoy,
  Volume2,
  VolumeX,
  User as UserIcon,
  LogOut,
  Sparkles,
  History,
  Bell,
  PlusCircle,
  ArrowDownToLine,
  Gift,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { sounds } from '../services/sound';
import { AccountModal } from './profile/AccountModal';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { user, openAuthModal, logout, claimFaucet } = useAuth();
  const [muted, setMuted] = useState<boolean>(sounds.getMuted());
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [accountInitialTab, setAccountInitialTab] = useState<
    'overview' | 'deposit' | 'withdrawal' | 'history' | 'promotions' | 'notifications' | 'kyc' | 'settings'
  >('overview');
  const [isClaimingFaucet, setIsClaimingFaucet] = useState<boolean>(false);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);

  // Periodic unread check
  useEffect(() => {
    if (!user) {
      setUnreadNotifications(0);
      return;
    }

    const checkNotifs = async () => {
      try {
        const res = await api.getNotifications();
        setUnreadNotifications(res.unreadCount || 0);
      } catch {
        // silent catch
      }
    };

    checkNotifs();
    const interval = setInterval(checkNotifs, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleToggleMute = () => {
    const next = sounds.toggleMute();
    setMuted(next);
  };

  const handleFaucetClick = async () => {
    setIsClaimingFaucet(true);
    try {
      await claimFaucet();
    } finally {
      setIsClaimingFaucet(false);
    }
  };

  const openAccountWithTab = (
    tab: 'overview' | 'deposit' | 'withdrawal' | 'history' | 'promotions' | 'notifications' | 'kyc' | 'settings'
  ) => {
    setAccountInitialTab(tab);
    setShowAccountModal(true);
    setShowProfileMenu(false);
    sounds.playSelect();
  };

  return (
    <header id="app-header" className="sticky top-0 z-40 w-full max-w-full bg-zinc-950/95 border-b border-white/10 shadow-2xl backdrop-blur-md pt-[env(safe-area-inset-top,0px)]">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 md:px-8 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4 w-full min-w-0 box-border">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-1.5 sm:gap-3 cursor-pointer select-none shrink-0 min-w-0" onClick={() => setActiveTab('game')}>
          <div className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-emerald-500 rounded-lg sm:rounded-xl flex items-center justify-center font-black text-black text-xs sm:text-base md:text-lg shadow-[0_0_15px_rgba(16,185,129,0.4)] tracking-tighter shrink-0">
            99
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-base md:text-lg font-black tracking-tight text-white leading-tight whitespace-nowrap">
              NEON DRAW<span className="text-emerald-400 font-mono text-xs sm:text-base md:text-lg ml-0.5">-99</span>
            </span>
            <span className="text-[8px] sm:text-[10px] text-emerald-500/80 font-mono uppercase tracking-wider hidden min-[440px]:block font-semibold mt-0.5">
              Live 60s Game Arena
            </span>
          </div>
        </div>

        {/* Right Section Controls */}
        <div className="flex items-center gap-1 sm:gap-2.5 md:gap-3 shrink-0 min-w-0">
          {/* Audio Mute Toggle */}
          <button
            id="btn-toggle-sound"
            onClick={handleToggleMute}
            className="p-1.5 sm:p-2 md:p-2.5 rounded-lg sm:rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5 transition-colors shrink-0 cursor-pointer"
            title={muted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />}
          </button>

          {/* Notifications Bell */}
          {user && (
            <button
              id="btn-header-notifications"
              onClick={() => openAccountWithTab('notifications')}
              className="relative p-1.5 sm:p-2 md:p-2.5 rounded-lg sm:rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5 transition-colors shrink-0 cursor-pointer"
              title="Notifications & Alerts"
            >
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-300" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-zinc-950 text-[9px] font-black flex items-center justify-center border-2 border-zinc-950 shadow-md">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>
          )}

          {/* Player Balance & Quick Deposit Box */}
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div
                onClick={() => openAccountWithTab('overview')}
                className="bg-zinc-900/90 hover:bg-zinc-800/90 transition-colors rounded-lg sm:rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 md:px-3.5 md:py-2 flex items-center gap-1.5 sm:gap-2.5 border border-white/5 shadow-inner shrink-0 cursor-pointer"
                title="View Wallet & Account"
              >
                <div className="flex flex-col items-end">
                  <span className="text-[8px] sm:text-[9px] text-zinc-400 font-bold uppercase tracking-wider leading-none hidden min-[360px]:inline">
                    BALANCE
                  </span>
                  <span className="text-emerald-400 font-mono font-bold text-xs sm:text-sm md:text-base leading-tight mt-0.5">
                    {user.virtualBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Quick Reload / Faucet */}
                <button
                  id="btn-claim-faucet"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFaucetClick();
                  }}
                  disabled={isClaimingFaucet}
                  className="px-1.5 py-1 sm:px-2 sm:py-1 text-[10px] font-bold rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all flex items-center gap-0.5 hover:shadow-[0_0_10px_rgba(16,185,129,0.3)] shrink-0 cursor-pointer"
                  title="Reload +1,000 Free Practice Coins"
                >
                  <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
                  <span className="hidden sm:inline">+1K</span>
                </button>
              </div>

              {/* Instant Deposit Button */}
              <button
                id="btn-header-deposit"
                onClick={() => openAccountWithTab('deposit')}
                className="hidden min-[480px]:flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-950/40 transition-all active:scale-95 cursor-pointer shrink-0"
                title="Instant Deposit"
              >
                <PlusCircle className="w-3.5 h-3.5 text-zinc-950 shrink-0" />
                <span>Deposit</span>
              </button>
            </div>
          ) : (
            <button
              id="btn-header-login"
              onClick={() => openAuthModal('login')}
              className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[11px] sm:text-xs md:text-sm uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:translate-y-[-1px] whitespace-nowrap shrink-0 cursor-pointer"
            >
              Play / Login
            </button>
          )}

          {/* User Profile / Avatar Menu */}
          {user && (
            <div className="relative shrink-0">
              <button
                id="btn-user-profile-menu"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 border-l border-white/10 hover:opacity-90 transition-opacity cursor-pointer shrink-0"
                title="Open Account Menu"
              >
                <div className="text-right hidden md:block">
                  <p className="text-xs font-bold text-white leading-tight">{user.name || user.username}</p>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    {user.kycStatus === 'VERIFIED' ? 'Verified Player' : 'Standard Player'}
                  </p>
                </div>
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name || user.username}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-xl border border-emerald-500/40 object-cover shadow-md"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-[11px] sm:text-xs shadow-md">
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </button>

              {/* Profile dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 sm:w-64 max-w-[calc(100vw-20px)] bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl">
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-xs font-bold text-white truncate">{user.name || user.username}</p>
                    <p className="text-[11px] text-zinc-400 truncate font-mono">@{user.username}</p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ID: ND99-{user.id.slice(-6).toUpperCase()}
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      id="menu-item-account"
                      onClick={() => openAccountWithTab('overview')}
                      className="w-full text-left px-4 py-2.5 text-xs text-white hover:bg-zinc-900 flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-emerald-400" />
                      <span>My Profile & Balance</span>
                    </button>

                    <button
                      id="menu-item-deposit"
                      onClick={() => openAccountWithTab('deposit')}
                      className="w-full text-left px-4 py-2.5 text-xs text-emerald-300 hover:bg-emerald-950/30 flex items-center gap-2.5 transition-colors font-bold cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4 text-emerald-400" />
                      <span>Deposit Funds</span>
                    </button>

                    <button
                      id="menu-item-withdraw"
                      onClick={() => openAccountWithTab('withdrawal')}
                      className="w-full text-left px-4 py-2.5 text-xs text-cyan-300 hover:bg-cyan-950/30 flex items-center gap-2.5 transition-colors font-bold cursor-pointer"
                    >
                      <ArrowDownToLine className="w-4 h-4 text-cyan-400" />
                      <span>Request Payout</span>
                    </button>

                    <button
                      id="menu-item-promotions"
                      onClick={() => openAccountWithTab('promotions')}
                      className="w-full text-left px-4 py-2.5 text-xs text-amber-300 hover:bg-amber-950/30 flex items-center gap-2.5 transition-colors font-bold cursor-pointer"
                    >
                      <Gift className="w-4 h-4 text-amber-400" />
                      <span>Promotions & Rewards</span>
                    </button>

                    <button
                      id="menu-item-kyc"
                      onClick={() => openAccountWithTab('kyc')}
                      className="w-full text-left px-4 py-2.5 text-xs text-purple-300 hover:bg-purple-950/30 flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                      <span>KYC Verification</span>
                    </button>

                    <button
                      id="menu-item-settings"
                      onClick={() => openAccountWithTab('settings')}
                      className="w-full text-left px-4 py-2.5 text-xs text-zinc-300 hover:bg-zinc-900 flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-zinc-400" />
                      <span>Security & Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('help');
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LifeBuoy className="w-4 h-4 text-cyan-400" />
                      <span>Help & Support</span>
                    </button>
                  </div>

                  <div className="border-t border-white/5 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Comprehensive Account Modal */}
      <AccountModal
        isOpen={showAccountModal}
        initialTab={accountInitialTab}
        onClose={() => setShowAccountModal(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />
    </header>
  );
};


