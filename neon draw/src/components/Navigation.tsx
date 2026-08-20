import React from 'react';
import {
  Gamepad2,
  History,
  Wallet,
  LifeBuoy,
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'game', label: 'Arena 01–20', icon: Gamepad2 },
    { id: 'history', label: 'Bets & Draws', icon: History },
    { id: 'wallet', label: 'Wallet Ledger', icon: Wallet },
    { id: 'help', label: 'Help & Support', icon: LifeBuoy },
  ];

  return (
    <>
      {/* Desktop Sub-Header Navigation */}
      <nav id="desktop-nav" className="hidden md:block bg-zinc-950/80 border-b border-white/10 sticky top-16 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeTab === item.id ||
                (item.id === 'help' && activeTab.startsWith('legal:'));
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2.5 px-4 py-3.5 text-xs font-bold border-b-2 transition-all ${
                    isActive
                      ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 shadow-[0_4px_12px_rgba(16,185,129,0.15)]'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  <span className="tracking-wide uppercase text-[11px]">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-zinc-500 flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></span>
            <span className="uppercase text-[10px] tracking-widest">Server RNG Engine Active</span>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Dock Bar */}
      <div id="mobile-dock" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-white/10 py-1.5 px-3 safe-area-pb shadow-2xl">
        <div className="grid grid-cols-4 gap-1 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id ||
              (item.id === 'help' && activeTab.startsWith('legal:'));
            return (
              <button
                key={item.id}
                id={`mobile-nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
                  isActive
                    ? 'text-emerald-400 bg-emerald-500/15 font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'text-zinc-500 hover:text-zinc-300 font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <span className="text-[10px] mt-1 tracking-tight truncate max-w-full font-mono">
                  {item.id === 'game' ? 'Arena' : item.id === 'history' ? 'History' : item.id === 'wallet' ? 'Wallet' : 'Help'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

