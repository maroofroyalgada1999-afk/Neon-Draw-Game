import React from 'react';
import { LegalDoc } from '../../data/legalContent';
import { ShieldCheck, Info, CheckCircle2, AlertCircle } from 'lucide-react';

interface LegalDocViewProps {
  doc: LegalDoc;
}

export const LegalDocView: React.FC<LegalDocViewProps> = ({ doc }) => {
  return (
    <div className="space-y-6 text-xs leading-relaxed text-zinc-300">
      {/* Document Meta Summary Bar */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-white font-bold">{doc.title}</span>
          <span className="text-zinc-500">v{doc.version}</span>
        </div>
        <div className="text-zinc-400">
          Last Reviewed & Updated: <span className="text-zinc-200 font-bold">{doc.lastUpdated}</span>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6 divide-y divide-white/5">
        {doc.sections.map((section, idx) => (
          <article key={section.id || idx} id={section.id} className={idx > 0 ? 'pt-6 space-y-3' : 'space-y-3'}>
            <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full inline-block"></span>
              <span>{section.title}</span>
            </h2>

            {/* Main Content (string or paragraphs) */}
            {Array.isArray(section.content) ? (
              <div className="space-y-2 text-zinc-300">
                {section.content.map((p, pIdx) => (
                  <p key={pIdx} className="leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-zinc-300 leading-relaxed">{section.content}</p>
            )}

            {/* Optional Highlight Card */}
            {section.highlight && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 flex items-start gap-2.5 my-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{section.highlight}</span>
              </div>
            )}

            {/* Optional Subsections */}
            {section.subsections && section.subsections.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {section.subsections.map((sub, sIdx) => (
                  <div key={sIdx} className="p-3 rounded-xl bg-zinc-900/40 border border-white/5 space-y-1">
                    <h3 className="font-bold text-white text-xs">{sub.title}</h3>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{sub.text}</p>
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
};
