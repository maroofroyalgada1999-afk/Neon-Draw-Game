import React, { useState } from 'react';
import { FAQ_DATA } from '../../data/legalContent';
import { HelpCircle, ChevronDown, Search, Sparkles } from 'lucide-react';

export const FaqAccordion: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [openIndices, setOpenIndices] = useState<Record<number, boolean>>({ 0: true, 1: true });

  const categories = ['ALL', 'Gameplay', 'Multipliers', 'Wallet & Coins', 'Fairness & Security', 'Account & Safety', 'Technical'];

  const filteredFaqs = FAQ_DATA.filter((item) => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch =
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleIndex = (idx: number) => {
    setOpenIndices((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Category Pills & Search */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search FAQs by question or keyword..."
            className="w-full bg-zinc-900/80 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold font-mono transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <p className="text-center text-zinc-500 py-8 text-xs">No matching questions found.</p>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isOpen = !!openIndices[idx];
            return (
              <div
                key={idx}
                className="rounded-2xl bg-zinc-900/40 border border-white/5 overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleIndex(idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-zinc-900/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-white/5 uppercase shrink-0">
                      {faq.category}
                    </span>
                    <h3 className="font-bold text-white text-xs sm:text-sm">{faq.q}</h3>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-emerald-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-zinc-300 text-xs leading-relaxed border-t border-white/5 bg-zinc-950/30 animate-in fade-in duration-150">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
