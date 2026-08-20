import React, { useState, useEffect } from 'react';
import { Gift, Sparkles, Check, Clock, AlertCircle, ShieldCheck, Tag } from 'lucide-react';
import { api } from '../../services/api';
import { sounds } from '../../services/sound';
import { Promotion } from '../../types/index';

interface PromotionsTabProps {
  onSuccess: (newBalance: number) => void;
}

export const PromotionsTab: React.FC<PromotionsTabProps> = ({ onSuccess }) => {
  const [promotions, setPromotions] = useState<(Promotion & { hasClaimed?: boolean })[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const res = await api.getPromotions();
      setPromotions(res.promotions || []);
    } catch (err) {
      console.warn('Failed to load promotions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleClaim = async (promoId: string) => {
    setClaimingId(promoId);
    setStatusMessage(null);
    try {
      const res = await api.claimPromotion(promoId);
      onSuccess(res.newBalance);
      setStatusMessage({
        type: 'success',
        message: `Claimed ₹${res.bonusAmount.toLocaleString()} bonus successfully! Added to your game balance.`,
      });
      sounds.playBonus();
      fetchPromotions();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        message: err.message || 'Failed to claim promotion.',
      });
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div id="promotions-tab-content" className="space-y-4 animate-in fade-in duration-200">
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{statusMessage.message}</span>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-zinc-400 text-xs flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
          <span>Loading available promotions...</span>
        </div>
      ) : promotions.length === 0 ? (
        <div className="p-8 text-center text-zinc-400 text-xs rounded-2xl bg-zinc-900/40 border border-white/5">
          No promotional campaigns active right now. Check back shortly!
        </div>
      ) : (
        <div className="space-y-3.5">
          {promotions.map((promo) => {
            const isClaimed = Boolean(promo.hasClaimed);
            return (
              <div
                key={promo.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all relative overflow-hidden ${
                  isClaimed
                    ? 'bg-zinc-900/40 border-white/5 opacity-80'
                    : 'bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border-amber-500/30 shadow-lg shadow-amber-950/20'
                }`}
              >
                {/* Glow accent */}
                {!isClaimed && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        <Tag className="w-2.5 h-2.5" />
                        {promo.code}
                      </span>
                      <h3 className="text-sm font-black text-white">{promo.title}</h3>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                      {promo.description}
                    </p>

                    {promo.terms && promo.terms.length > 0 && (
                      <div className="text-[10px] text-zinc-400 space-y-0.5 pt-1">
                        {promo.terms.map((t, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-amber-500/60" />
                            <span>{t}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
                        Reward Value
                      </span>
                      <span className="text-base sm:text-lg font-mono font-black text-amber-300">
                        +₹{promo.bonusAmount.toLocaleString()}
                      </span>
                    </div>

                    <button
                      type="button"
                      id={`claim-promo-btn-${promo.id}`}
                      onClick={() => handleClaim(promo.id)}
                      disabled={isClaimed || claimingId === promo.id}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isClaimed
                          ? 'bg-zinc-800 text-zinc-400 border border-white/5 cursor-not-allowed'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black shadow-md shadow-amber-950/40 active:scale-95'
                      }`}
                    >
                      {isClaimed ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Claimed</span>
                        </>
                      ) : claimingId === promo.id ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 animate-spin" />
                          <span>Claiming...</span>
                        </>
                      ) : (
                        <>
                          <Gift className="w-3.5 h-3.5" />
                          <span>Claim Bonus</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
