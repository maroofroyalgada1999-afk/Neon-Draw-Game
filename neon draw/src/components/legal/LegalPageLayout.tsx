import React, { useState } from 'react';
import {
  FileText,
  Shield,
  Info,
  BookOpen,
  Gamepad2,
  Coins,
  HeartHandshake,
  LifeBuoy,
  HelpCircle,
  Mail,
  Cookie,
  RotateCcw,
  AlertTriangle,
  KeyRound,
  Eye,
  Scale,
  ChevronRight,
  Search,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { LegalPageId } from '../../types/index';

interface LegalPageLayoutProps {
  activePage: LegalPageId;
  onNavigate: (page: LegalPageId) => void;
  onBackToArena?: () => void;
  children: React.ReactNode;
}

export const LEGAL_PAGES_META: {
  id: LegalPageId;
  label: string;
  category: 'Legal' | 'Rules' | 'Platform' | 'Support' | 'Safety';
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}[] = [
  // Rules & Gameplay
  { id: 'how-to-play', label: 'How to Play', category: 'Rules', icon: BookOpen, description: 'Step-by-step game walkthrough' },
  { id: 'game-rules', label: 'Game Rules', category: 'Rules', icon: Gamepad2, description: '20-number matrix & dynamic multipliers' },
  { id: 'betting-rules', label: 'Betting Rules', category: 'Rules', icon: Coins, description: 'Staking limits & 20-number max cap' },
  // Legal & Compliance
  { id: 'terms', label: 'Terms & Conditions', category: 'Legal', icon: FileText, description: 'User agreement & conditions' },
  { id: 'privacy', label: 'Privacy Policy', category: 'Legal', icon: Shield, description: 'Data protection & privacy rights' },
  { id: 'cookies', label: 'Cookie Policy', category: 'Legal', icon: Cookie, description: 'Session tokens & local storage' },
  { id: 'refunds', label: 'Refund / Cancellation', category: 'Legal', icon: RotateCcw, description: 'Virtual coin ledger & round refunds' },
  { id: 'disclaimer', label: 'Disclaimer', category: 'Legal', icon: AlertTriangle, description: 'Non-monetary entertainment notice' },
  { id: 'legal', label: 'Legal / Compliance', category: 'Legal', icon: Scale, description: 'Entity disclosures & classification' },
  // Safety & Security
  { id: 'responsible-play', label: 'Responsible Play / Safety', category: 'Safety', icon: HeartHandshake, description: 'Player protection & healthy gaming' },
  { id: 'account-security', label: 'Account & Security', category: 'Safety', icon: KeyRound, description: 'Authentication & session control' },
  // Support & Info
  { id: 'help', label: 'Help & Support', category: 'Support', icon: LifeBuoy, description: 'Central guides & assistance hub' },
  { id: 'faq', label: 'FAQ', category: 'Support', icon: HelpCircle, description: 'Frequently asked questions' },
  { id: 'contact', label: 'Contact Support', category: 'Support', icon: Mail, description: 'Open a support ticket' },
  { id: 'about', label: 'About NEON DRAW-99', category: 'Platform', icon: Info, description: 'Vision, math engine & tech stack' },
  { id: 'accessibility', label: 'Accessibility', category: 'Platform', icon: Eye, description: 'Inclusive design & WCAG standards' },
];

export const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({
  activePage,
  onNavigate,
  onBackToArena,
  children,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const currentPageMeta = LEGAL_PAGES_META.find((p) => p.id === activePage) || LEGAL_PAGES_META[0];
  const CurrentIcon = currentPageMeta.icon;

  const filteredPages = LEGAL_PAGES_META.filter((p) =>
    p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories: ('Rules' | 'Legal' | 'Safety' | 'Support' | 'Platform')[] = [
    'Rules',
    'Legal',
    'Safety',
    'Support',
    'Platform',
  ];

  return (
    <div id="legal-system-layout" className="max-w-7xl mx-auto space-y-5 animate-in fade-in duration-150">
      {/* Top Breadcrumb & Quick Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-zinc-950/80 border border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <button
            onClick={onBackToArena}
            className="hover:text-emerald-400 text-zinc-300 font-bold transition-colors cursor-pointer"
          >
            NEON DRAW-99 Arena
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
          <span className="text-zinc-500">Information & Legal</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
          <span className="text-emerald-400 font-bold">{currentPageMeta.label}</span>
        </div>

        <div className="flex items-center gap-2">
          {onBackToArena && (
            <button
              onClick={onBackToArena}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Arena</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Left Navigation Sidebar + Right Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Left Sidebar: Fast Navigation List (Sticky on desktop) */}
        <aside className="lg:col-span-4 xl:col-span-3 space-y-4 lg:sticky lg:top-20">
          {/* Mobile Selector Dropdown (for quick navigation on small screens) */}
          <div className="lg:hidden p-3.5 rounded-2xl bg-zinc-950/90 border border-white/10 shadow-lg space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Jump to Information Page
            </label>
            <select
              value={activePage}
              onChange={(e) => onNavigate(e.target.value as LegalPageId)}
              className="w-full bg-zinc-900 border border-white/15 rounded-xl py-2.5 px-3 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
            >
              {categories.map((cat) => (
                <optgroup key={cat} label={`-- ${cat.toUpperCase()} --`}>
                  {LEGAL_PAGES_META.filter((p) => p.category === cat).map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Desktop Nav Box */}
          <div className="hidden lg:block p-4 rounded-3xl bg-zinc-950/80 border border-white/10 shadow-2xl backdrop-blur-md space-y-4">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics, rules & policies..."
                className="w-full bg-zinc-900/80 border border-white/10 rounded-xl py-2 pl-8 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Categorized Links */}
            <div className="space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto pr-1 scrollbar-thin">
              {categories.map((cat) => {
                const pagesInCat = filteredPages.filter((p) => p.category === cat);
                if (pagesInCat.length === 0) return null;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">
                      {cat}
                    </div>
                    {pagesInCat.map((item) => {
                      const Icon = item.icon;
                      const isActive = activePage === item.id;
                      return (
                        <button
                          key={item.id}
                          id={`nav-legal-${item.id}`}
                          onClick={() => onNavigate(item.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between group cursor-pointer ${
                            isActive
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Help Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-900/80 to-zinc-950 border border-white/5 space-y-2">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block font-mono">
              Direct Assistance
            </span>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Need immediate help or have an account inquiry?
            </p>
            <button
              onClick={() => onNavigate('contact')}
              className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>Open Support Desk</span>
            </button>
          </div>
        </aside>

        {/* Right Content Area */}
        <section className="lg:col-span-8 xl:col-span-9 space-y-5">
          {/* Header Banner for Selected Page */}
          <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-zinc-950 to-zinc-950 border border-emerald-500/20 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)] shrink-0">
                <CurrentIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                    {currentPageMeta.category}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">Version 1.0</span>
                </div>
                <h1 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tight mt-0.5">
                  {currentPageMeta.label}
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">{currentPageMeta.description}</p>
              </div>
            </div>

            <div className="text-[11px] font-mono text-zinc-500 self-start sm:self-auto shrink-0 bg-zinc-900/60 px-3 py-1.5 rounded-xl border border-white/5">
              Authoritative Reference: <span className="text-zinc-300">Active</span>
            </div>
          </div>

          {/* Rendered Page Content */}
          <div className="p-5 sm:p-7 rounded-3xl bg-zinc-950/80 border border-white/5 shadow-2xl space-y-6">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
};
