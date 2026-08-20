import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  ShieldCheck,
  Wallet,
  Trophy,
  History,
  LogOut,
  X,
  Sparkles,
  KeyRound,
  Bell,
  Gift,
  FileCheck,
  Settings,
  PlusCircle,
  ArrowDownToLine,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sounds } from '../../services/sound';
import { ProfileHeader } from './ProfileHeader';
import { BalanceCard } from './BalanceCard';
import { DepositTab } from './DepositTab';
import { WithdrawalTab } from './WithdrawalTab';
import { GameHistoryTab } from './GameHistoryTab';
import { PromotionsTab } from './PromotionsTab';
import { NotificationsTab } from './NotificationsTab';
import { KYCTab } from './KYCTab';
import { SettingsSecurityTab } from './SettingsSecurityTab';
import { ScratchCardsTab } from './ScratchCardsTab';
import { ReferralsTab } from './ReferralsTab';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?:
    | 'overview'
    | 'scratch'
    | 'referrals'
    | 'deposit'
    | 'withdrawal'
    | 'history'
    | 'promotions'
    | 'notifications'
    | 'kyc'
    | 'settings';
  onNavigateTab?: (tab: string) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'overview',
  onNavigateTab,
}) => {
  const { user, claimFaucet, updateUserBalanceDirectly, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'scratch'
    | 'referrals'
    | 'deposit'
    | 'withdrawal'
    | 'history'
    | 'promotions'
    | 'notifications'
    | 'kyc'
    | 'settings'
  >(initialTab);
  const [isClaimingBonus, setIsClaimingBonus] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen || !user) return null;

  const handleBalanceUpdate = (newBalance: number) => {
    updateUserBalanceDirectly(newBalance);
  };

  const handleClaimDailyBonus = async () => {
    setIsClaimingBonus(true);
    try {
      await claimFaucet();
    } finally {
      setIsClaimingBonus(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'My Account', icon: UserIcon },
    { id: 'scratch', label: 'Scratch Cards', icon: Trophy, highlight: 'amber' },
    { id: 'referrals', label: 'Invite & Earn', icon: Users, highlight: 'emerald' },
    { id: 'deposit', label: 'Deposit', icon: PlusCircle, highlight: 'emerald' },
    { id: 'withdrawal', label: 'Withdraw', icon: ArrowDownToLine, highlight: 'cyan' },
    { id: 'history', label: 'Bet History', icon: History },
    { id: 'promotions', label: 'Promos', icon: Gift },
    { id: 'notifications', label: 'Alerts', icon: Bell },
    { id: 'kyc', label: 'Verification', icon: FileCheck },
    { id: 'settings', label: 'Security', icon: Settings },
  ] as const;

  return (
    <div
      id="account-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto"
    >
      <div
        id="account-modal"
        className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black text-white tracking-wide">
                Player Account & Wallet
              </h1>
              <p className="text-[10px] text-zinc-400">
                Secure Session • ID: ND99-{user.id.slice(-6).toUpperCase()}
              </p>
            </div>
          </div>

          <button
            id="close-account-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close Account Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 my-1 border-b border-white/5 shrink-0 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`account-tab-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  sounds.playSelect();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950/40'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-white/5 hover:bg-zinc-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Tab Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-4">
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <ProfileHeader user={user} />

              <BalanceCard
                user={user}
                onOpenDeposit={() => setActiveTab('deposit')}
                onOpenWithdrawal={() => setActiveTab('withdrawal')}
                onClaimBonus={handleClaimDailyBonus}
                isClaimingBonus={isClaimingBonus}
              />

              {/* Quick Navigation Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  onClick={() => setActiveTab('scratch')}
                  className="p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/5 hover:border-amber-500/30 transition-all text-left group cursor-pointer"
                >
                  <Trophy className="w-5 h-5 text-amber-400 mb-1.5 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-white">Scratch Cards</div>
                  <div className="text-[10px] text-zinc-400">Claim Coins</div>
                </button>

                <button
                  onClick={() => setActiveTab('referrals')}
                  className="p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/5 hover:border-emerald-500/30 transition-all text-left group cursor-pointer"
                >
                  <Users className="w-5 h-5 text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-white">Invite & Earn</div>
                  <div className="text-[10px] text-zinc-400">₹50 Per Friend</div>
                </button>

                <button
                  onClick={() => setActiveTab('deposit')}
                  className="p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/5 hover:border-emerald-500/30 transition-all text-left group cursor-pointer"
                >
                  <PlusCircle className="w-5 h-5 text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-white">Deposit</div>
                  <div className="text-[10px] text-zinc-400">Instant UPI & Cards</div>
                </button>

                <button
                  onClick={() => setActiveTab('withdrawal')}
                  className="p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/5 hover:border-cyan-500/30 transition-all text-left group cursor-pointer"
                >
                  <ArrowDownToLine className="w-5 h-5 text-cyan-400 mb-1.5 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-white">Withdraw</div>
                  <div className="text-[10px] text-zinc-400">Bank & UPI Payouts</div>
                </button>
              </div>
            </div>
          )}

          {/* TAB: SCRATCH CARDS */}
          {activeTab === 'scratch' && (
            <ScratchCardsTab onSuccess={handleBalanceUpdate} />
          )}

          {/* TAB: REFERRALS */}
          {activeTab === 'referrals' && (
            <ReferralsTab
              onSuccess={handleBalanceUpdate}
              onOpenScratchCards={() => setActiveTab('scratch')}
            />
          )}

          {/* TAB: DEPOSIT */}
          {activeTab === 'deposit' && (
            <DepositTab onSuccess={handleBalanceUpdate} />
          )}

          {/* TAB: WITHDRAWAL */}
          {activeTab === 'withdrawal' && (
            <WithdrawalTab user={user} onSuccess={handleBalanceUpdate} />
          )}

          {/* TAB: GAME HISTORY */}
          {activeTab === 'history' && <GameHistoryTab />}

          {/* TAB: PROMOTIONS */}
          {activeTab === 'promotions' && (
            <PromotionsTab onSuccess={handleBalanceUpdate} />
          )}

          {/* TAB: NOTIFICATIONS */}
          {activeTab === 'notifications' && <NotificationsTab />}

          {/* TAB: KYC */}
          {activeTab === 'kyc' && (
            <KYCTab onSuccess={refreshUser} />
          )}

          {/* TAB: SETTINGS & SECURITY */}
          {activeTab === 'settings' && (
            <SettingsSecurityTab user={user} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
};

