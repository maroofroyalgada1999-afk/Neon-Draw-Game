import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GameProvider } from './context/GameContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { PhaseStatusHeader } from './components/game/PhaseStatusHeader';
import { NumberGrid } from './components/game/NumberGrid';
import { BetControls } from './components/game/BetControls';
import { DrawAnimationModal } from './components/game/DrawAnimationModal';
import { LiveBetsFeed } from './components/game/LiveBetsFeed';
import { GameHistory } from './components/history/GameHistory';
import { WalletLedger } from './components/wallet/WalletLedger';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AuthModal } from './components/auth/AuthModal';
import { WelcomeScratchModal } from './components/auth/WelcomeScratchModal';
import { Footer } from './components/Footer';
import { LegalInformationSystem } from './components/legal/LegalInformationSystem';
import { LegalPageId } from './types/index';
import { ShieldCheck, Coins, Sparkles } from 'lucide-react';

const VALID_LEGAL_PAGES: LegalPageId[] = [
  'terms',
  'privacy',
  'about',
  'how-to-play',
  'game-rules',
  'betting-rules',
  'responsible-play',
  'help',
  'faq',
  'contact',
  'cookies',
  'refunds',
  'disclaimer',
  'account-security',
  'accessibility',
  'legal',
];

const GameTabContent: React.FC = () => {
  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 60s 3-Phase Cycle Header */}
      <PhaseStatusHeader />

      {/* Main Game Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Left Column: 20-Number Matrix */}
        <div className="lg:col-span-7 xl:col-span-8 order-2 lg:order-1 space-y-4">
          <NumberGrid />
        </div>

        {/* Right Column: Bet Staking & Live Bets Feed */}
        <div className="lg:col-span-5 xl:col-span-4 order-1 lg:order-2 space-y-5">
          <BetControls />
          <LiveBetsFeed />
        </div>
      </div>

      {/* Platform Guarantee Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5 backdrop-blur-sm flex items-center gap-3.5 shadow-lg">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-white tracking-wide">20 Unique Numbers</h4>
            <p className="text-[11px] text-zinc-500 mt-0.5">Mixed (2x–20x) dynamic multipliers</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5 backdrop-blur-sm flex items-center gap-3.5 shadow-lg">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-white tracking-wide">Virtual Currency Only</h4>
            <p className="text-[11px] text-zinc-500 mt-0.5">Demo play with zero monetary value</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5 backdrop-blur-sm flex items-center gap-3.5 shadow-lg">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-white tracking-wide">60s Exact Cycle</h4>
            <p className="text-[11px] text-zinc-500 mt-0.5">15s Result • 30s Chart • 15s Betting</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const MainLayout: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/admin')) return path;
    }
    return '/';
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace(/^\//, '');
      if (VALID_LEGAL_PAGES.includes(path as LegalPageId)) return `legal:${path}`;
      if (path === 'history') return 'history';
      if (path === 'wallet') return 'wallet';
      if (path === 'help') return 'legal:help';
    }
    return 'game';
  });

  // Handle URL history sync
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentPath(path);
      const cleanPath = path.replace(/^\//, '');

      if (VALID_LEGAL_PAGES.includes(cleanPath as LegalPageId)) {
        setActiveTab(`legal:${cleanPath}`);
      } else if (path === '/history') {
        setActiveTab('history');
      } else if (path === '/wallet') {
        setActiveTab('wallet');
      } else if (path === '/help') {
        setActiveTab('legal:help');
      } else if (!path.startsWith('/admin')) {
        setActiveTab('game');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string, tab?: string) => {
    setCurrentPath(path);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
    }
    if (tab) setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlayerTabChange = (tab: string) => {
    if (tab.startsWith('legal:')) {
      const pageId = tab.replace('legal:', '') as LegalPageId;
      handleLegalNavigate(pageId);
      return;
    }

    if (tab === 'help') {
      handleLegalNavigate('help');
      return;
    }

    setActiveTab(tab);
    const path = tab === 'game' ? '/' : `/${tab}`;
    navigateTo(path, tab);
  };

  const handleLegalNavigate = (page: LegalPageId) => {
    setActiveTab(`legal:${page}`);
    navigateTo(`/${page}`, `legal:${page}`);
  };

  const isAdminRoute = currentPath.startsWith('/admin');
  const isLegalTab = activeTab.startsWith('legal:');
  const currentLegalPageId: LegalPageId = isLegalTab
    ? (activeTab.replace('legal:', '') as LegalPageId)
    : 'terms';

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* If in Player Area, show Player Header & Navigation */}
      {!isAdminRoute ? (
        <>
          {/* Top Header */}
          <Header activeTab={activeTab} setActiveTab={handlePlayerTabChange} />

          {/* Sub Navigation Bar */}
          <Navigation activeTab={activeTab} setActiveTab={handlePlayerTabChange} />

          {/* Main Player Content Area */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 bg-[radial-gradient(circle_at_50%_20%,_#111827_0%,_#000000_100%)] pb-24 md:pb-12">
            {/* GAME ARENA TAB */}
            {activeTab === 'game' && <GameTabContent />}

            {/* HISTORY TAB */}
            {activeTab === 'history' && <GameHistory />}

            {/* WALLET TAB */}
            {activeTab === 'wallet' && <WalletLedger />}

            {/* COMPLETE FUNCTIONAL LEGAL & INFORMATION SYSTEM */}
            {isLegalTab && (
              <LegalInformationSystem
                activePage={currentLegalPageId}
                onNavigate={handleLegalNavigate}
                onBackToArena={() => handlePlayerTabChange('game')}
              />
            )}
          </main>

          {/* Application Footer with All 16 Legal & Info Links */}
          <Footer
            setActiveTab={handlePlayerTabChange}
            onNavigateLegal={handleLegalNavigate}
          />
        </>
      ) : (
        /* Dedicated Standalone Admin Application Area */
        <div className="flex-1 flex flex-col min-h-screen bg-zinc-950">
          {/* Admin Top Minimal Nav */}
          <header className="border-b border-white/10 bg-zinc-950/90 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-xs">
                99
              </div>
              <div>
                <span className="text-sm font-black text-white uppercase tracking-wider">
                  NEON DRAW-99
                </span>
                <span className="text-[10px] text-zinc-500 font-mono ml-2">ADMIN PORTAL</span>
              </div>
            </div>

            <button
              onClick={() => navigateTo('/', 'game')}
              className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/5 font-bold transition-colors cursor-pointer"
            >
              ← Return to Player Arena
            </button>
          </header>

          <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 pb-20">
            <AdminDashboard
              currentPath={currentPath}
              onNavigatePath={(p) => navigateTo(p)}
              onBackToPlayer={() => navigateTo('/', 'game')}
            />
          </main>
        </div>
      )}

      {/* Global Modals (Draw Animation, Player Auth & Welcome Scratch Card) */}
      <DrawAnimationModal />
      <AuthModal onOpenLegal={(page) => handleLegalNavigate(page)} />
      <WelcomeScratchModal />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <MainLayout />
      </GameProvider>
    </AuthProvider>
  );
}

export default App;
