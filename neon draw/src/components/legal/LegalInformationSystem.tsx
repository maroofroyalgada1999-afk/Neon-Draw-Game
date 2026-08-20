import React from 'react';
import { LegalPageId } from '../../types/index';
import { LEGAL_DOCS } from '../../data/legalContent';
import { LegalPageLayout } from './LegalPageLayout';
import { LegalDocView } from './LegalDocView';
import { FaqAccordion } from './FaqAccordion';
import { ContactSupportForm } from './ContactSupportForm';
import { Mail, HelpCircle, BookOpen, ShieldCheck, ArrowRight } from 'lucide-react';

interface LegalInformationSystemProps {
  activePage: LegalPageId;
  onNavigate: (page: LegalPageId) => void;
  onBackToArena?: () => void;
}

export const LegalInformationSystem: React.FC<LegalInformationSystemProps> = ({
  activePage,
  onNavigate,
  onBackToArena,
}) => {
  const renderContent = () => {
    switch (activePage) {
      case 'faq':
        return <FaqAccordion />;

      case 'contact':
        return <ContactSupportForm />;

      case 'help':
        return (
          <div className="space-y-6">
            {LEGAL_DOCS.help && <LegalDocView doc={LEGAL_DOCS.help} />}

            {/* Interactive Quick Launch Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div
                onClick={() => onNavigate('faq')}
                className="p-5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-white font-bold text-sm">Interactive FAQ Search</h4>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Search answers regarding rounds, probability, and 20-number selections.
                </p>
              </div>

              <div
                onClick={() => onNavigate('contact')}
                className="p-5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-white font-bold text-sm">Direct Support Desk</h4>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Open an authoritative SUP-2026 support ticket with our moderation desk.
                </p>
              </div>
            </div>
          </div>
        );

      default: {
        const doc = LEGAL_DOCS[activePage] || LEGAL_DOCS.terms;
        return <LegalDocView doc={doc} />;
      }
    }
  };

  return (
    <LegalPageLayout
      activePage={activePage}
      onNavigate={onNavigate}
      onBackToArena={onBackToArena}
    >
      {renderContent()}
    </LegalPageLayout>
  );
};
