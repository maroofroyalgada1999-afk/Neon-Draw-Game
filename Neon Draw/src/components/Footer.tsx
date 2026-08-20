import React from 'react';
import { ShieldCheck, Mail, MapPin, Sparkles } from 'lucide-react';
import { LegalPageId } from '../types/index';
import { BUSINESS_NAME, SUPPORT_EMAIL, BUSINESS_ADDRESS, LEGAL_CONFIG } from '../data/legalContent';

interface FooterProps {
  setActiveTab: (tab: string) => void;
  onNavigateLegal?: (page: LegalPageId) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab, onNavigateLegal }) => {
  const handleLegalClick = (page: LegalPageId) => {
    if (onNavigateLegal) {
      onNavigateLegal(page);
    } else {
      setActiveTab(`legal:${page}`);
    }
  };

  return (
    <footer id="app-footer" className="bg-zinc-950 border-t border-white/10 px-4 sm:px-8 py-8 z-30 space-y-8 text-xs">
      {/* Official Business & Contact Identity Card */}
      <div className="max-w-7xl mx-auto p-5 sm:p-6 rounded-3xl bg-zinc-900/50 border border-white/5 backdrop-blur-sm grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        <div className="md:col-span-6 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-xs">
              99
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">{BUSINESS_NAME}</h3>
              <p className="text-[10px] text-emerald-400 font-mono font-bold">100-Number Cyber Arena • Virtual Coins Demo</p>
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed max-w-lg">
            High-frequency mathematical simulation featuring 60-second server cycles, dynamic 80/20 multipliers, and provably fair cryptographic RNG.
          </p>
        </div>

        <div className="md:col-span-6 flex flex-col sm:flex-row gap-4 sm:gap-6 md:justify-end text-xs">
          {/* Address */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              Business Address
            </span>
            <p className="text-zinc-300 font-medium leading-snug break-words max-w-xs">
              {BUSINESS_ADDRESS}
            </p>
          </div>

          {/* Support Email */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              Support Email
            </span>
            <div>
              <a
                id="footer-support-email-link"
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-emerald-400 font-mono font-bold hover:underline transition-colors break-all"
              >
                {SUPPORT_EMAIL}
              </a>
            </div>
            <p className="text-[10px] text-zinc-500">24/7 Player Inquiries & Assistance</p>
          </div>
        </div>
      </div>

      {/* 4-Column Directory Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
        {/* Column 1: Arena & Features */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">
            Arena & Play
          </span>
          <ul className="space-y-1.5 text-zinc-400 font-medium">
            <li>
              <button
                id="footer-link-game"
                onClick={() => setActiveTab('game')}
                className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
              >
                100-Number Arena
              </button>
            </li>
            <li>
              <button
                id="footer-link-history"
                onClick={() => setActiveTab('history')}
                className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
              >
                Draw & Bet History
              </button>
            </li>
            <li>
              <button
                id="footer-link-wallet"
                onClick={() => setActiveTab('wallet')}
                className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
              >
                Wallet & Ledger
              </button>
            </li>
            <li>
              <button
                id="footer-link-about"
                onClick={() => handleLegalClick('about')}
                className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
              >
                About NEON DRAW-99
              </button>
            </li>
          </ul>
        </div>

        {/* Column 2: Rules & Guides */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">
            Rules & Guides
          </span>
          <ul className="space-y-1.5 text-zinc-400 font-medium">
            <li>
              <button
                id="footer-link-how-to-play"
                onClick={() => handleLegalClick('how-to-play')}
                className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
              >
                How to Play
              </button>
            </li>
            <li>
              <button
                id="footer-link-game-rules"
                onClick={() => handleLegalClick('game-rules')}
                className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
              >
                Game Rules (00-99)
              </button>
            </li>
            <li>
              <button
                id="footer-link-betting-rules"
                onClick={() => handleLegalClick('betting-rules')}
                className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
              >
                Betting Rules & Caps
              </button>
            </li>
            <li>
              <button
                id="footer-link-accessibility"
                onClick={() => handleLegalClick('accessibility')}
                className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
              >
                Accessibility Statement
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: Legal & Governance */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">
            Legal & Policy
          </span>
          <ul className="space-y-1.5 text-zinc-400 font-medium">
            <li>
              <button
                id="footer-link-terms"
                onClick={() => handleLegalClick('terms')}
                className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
              >
                Terms & Conditions
              </button>
            </li>
            <li>
              <button
                id="footer-link-privacy"
                onClick={() => handleLegalClick('privacy')}
                className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
              >
                Privacy Policy
              </button>
            </li>
            <li>
              <button
                id="footer-link-cookies"
                onClick={() => handleLegalClick('cookies')}
                className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
              >
                Cookie Policy
              </button>
            </li>
            <li>
              <button
                id="footer-link-refunds"
                onClick={() => handleLegalClick('refunds')}
                className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
              >
                Refund / Cancellation
              </button>
            </li>
            <li>
              <button
                id="footer-link-disclaimer"
                onClick={() => handleLegalClick('disclaimer')}
                className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
              >
                Disclaimer Notice
              </button>
            </li>
            <li>
              <button
                id="footer-link-legal"
                onClick={() => handleLegalClick('legal')}
                className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
              >
                Legal / Compliance
              </button>
            </li>
          </ul>
        </div>

        {/* Column 4: Support & Safety */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">
            Support & Safety
          </span>
          <ul className="space-y-1.5 text-zinc-400 font-medium">
            <li>
              <button
                id="footer-link-help"
                onClick={() => handleLegalClick('help')}
                className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
              >
                Help & Support Hub
              </button>
            </li>
            <li>
              <button
                id="footer-link-faq"
                onClick={() => handleLegalClick('faq')}
                className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
              >
                FAQ Directory
              </button>
            </li>
            <li>
              <button
                id="footer-link-contact"
                onClick={() => handleLegalClick('contact')}
                className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
              >
                Contact Support Desk
              </button>
            </li>
            <li>
              <button
                id="footer-link-responsible-play"
                onClick={() => handleLegalClick('responsible-play')}
                className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
              >
                Responsible Play / Safety
              </button>
            </li>
            <li>
              <button
                id="footer-link-account-security"
                onClick={() => handleLegalClick('account-security')}
                className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
              >
                Account & Security
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Legal Notice & Cryptographic RNG Badge */}
      <div className="max-w-7xl mx-auto pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-[11px] text-zinc-500 font-mono">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></span>
            <span>Authoritative Server RNG</span>
          </div>
          <span>•</span>
          <span>Exact 60s Cycle (15s/30s/15s)</span>
          <span>•</span>
          <span>80/20 Multipliers (2x-20x)</span>
          <span>•</span>
          <span>Max 20 Numbers</span>
        </div>

        <div className="text-zinc-400">
          © 2026 {BUSINESS_NAME} • All rights reserved.
        </div>
      </div>
    </footer>
  );
};
