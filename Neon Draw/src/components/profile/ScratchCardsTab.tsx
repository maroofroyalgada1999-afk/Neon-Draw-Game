import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Gift, CheckCircle2, Trophy, ArrowRight, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { sounds } from '../../services/sound';
import { ScratchCardReward } from '../../types/index';

interface ScratchCardsTabProps {
  onSuccess: (newBalance: number) => void;
}

export const ScratchCardsTab: React.FC<ScratchCardsTabProps> = ({ onSuccess }) => {
  const [cards, setCards] = useState<ScratchCardReward[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [scratchedPercentage, setScratchedPercentage] = useState<number>(0);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [claiming, setClaiming] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef<boolean>(false);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await api.getScratchCards();
      setCards(res.scratchCards || []);
      // If there's an unclaimed card and none active, activate the first unclaimed
      const firstUnclaimed = (res.scratchCards || []).find((c: ScratchCardReward) => !c.isClaimed);
      if (firstUnclaimed && !activeCardId) {
        setActiveCardId(firstUnclaimed.id);
        setIsRevealed(firstUnclaimed.isRevealed);
      }
    } catch (err: any) {
      console.warn('Failed to load scratch cards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const activeCard = cards.find((c) => c.id === activeCardId) || cards[0];

  // Initialize Canvas Scratch Layer
  useEffect(() => {
    if (!activeCard || activeCard.isClaimed || isRevealed) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Draw metallic golden scratch cover
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f59e0b');
    gradient.addColorStop(0.3, '#fbbf24');
    gradient.addColorStop(0.5, '#d97706');
    gradient.addColorStop(0.8, '#f59e0b');
    gradient.addColorStop(1, '#b45309');

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add pattern & text
    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('✨ SCRATCH HERE ✨', width / 2, height / 2 - 10);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#92400e';
    ctx.fillText('Swipe or click to reveal your reward', width / 2, height / 2 + 15);

    setScratchedPercentage(0);
  }, [activeCardId, isRevealed]);

  const checkScratchPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;
    let transparentPixels = 0;
    const totalPixels = pixels.length / 4;

    for (let i = 3; i < pixels.length; i += 16) {
      if (pixels[i] < 128) {
        transparentPixels++;
      }
    }

    const ratio = (transparentPixels / (totalPixels / 4)) * 100;
    setScratchedPercentage(Math.min(100, Math.round(ratio)));

    if (ratio > 40 && !isRevealed) {
      setIsRevealed(true);
      sounds.playBonus();
    }
  };

  const handleScratch = (clientX: number, clientY: number) => {
    if (!canvasRef.current || isRevealed) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fill();

    checkScratchPercentage();
  };

  const handleClaim = async (cardId: string) => {
    setClaiming(true);
    setStatusMessage(null);
    try {
      const res = await api.claimScratchCard(cardId);
      onSuccess(res.newBalance);
      sounds.playBonus();
      setStatusMessage({
        type: 'success',
        message: `Claimed ₹${res.card.amount} Coins successfully! Credited to your main wallet.`,
      });
      fetchCards();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        message: err.message || 'Failed to claim reward.',
      });
    } finally {
      setClaiming(false);
    }
  };

  const handleQuickReveal = () => {
    setIsRevealed(true);
    setScratchedPercentage(100);
    sounds.playBonus();
  };

  return (
    <div id="scratch-cards-tab" className="space-y-5 animate-in fade-in duration-200">
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
        <div className="p-12 text-center text-zinc-400 text-xs flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
          <span>Loading your reward cards...</span>
        </div>
      ) : cards.length === 0 ? (
        <div className="p-8 text-center text-zinc-400 text-xs rounded-2xl bg-zinc-900/40 border border-white/5 space-y-2">
          <Gift className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="font-semibold text-zinc-300">No scratch cards available</p>
          <p className="text-[11px] text-zinc-500">
            Invite friends from the Referrals tab to earn ₹50 scratch cards for each friend!
          </p>
        </div>
      ) : (
        <>
          {/* Active Scratch Card Hero */}
          {activeCard && (
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 border border-amber-500/30 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{activeCard.title}</h3>
                    <p className="text-[11px] text-zinc-400">{activeCard.description}</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    activeCard.isClaimed
                      ? 'bg-zinc-800 text-zinc-400 border border-white/5'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {activeCard.isClaimed ? 'Claimed' : 'Unclaimed'}
                </span>
              </div>

              {/* Scratch Arena */}
              <div className="relative w-full max-w-sm mx-auto h-48 sm:h-52 rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-zinc-900 shadow-[0_0_30px_rgba(245,158,11,0.15)] flex items-center justify-center select-none">
                {/* Underneath Revealed Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-amber-950/40 via-zinc-900 to-black text-center">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">
                    🎉 YOU HAVE WON
                  </span>
                  <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 my-1 font-mono">
                    ₹{activeCard.amount}
                  </div>
                  <span className="text-xs text-zinc-300 font-semibold">
                    {activeCard.amount} Coins (1 Coin = ₹1)
                  </span>
                  <p className="text-[10px] text-zinc-500 mt-1">Instant withdrawal & game balance</p>
                </div>

                {/* Canvas Overlay for scratching */}
                {!activeCard.isClaimed && !isRevealed && (
                  <canvas
                    ref={canvasRef}
                    width={360}
                    height={200}
                    onMouseDown={(e) => {
                      isDrawing.current = true;
                      handleScratch(e.clientX, e.clientY);
                    }}
                    onMouseMove={(e) => {
                      if (isDrawing.current) {
                        handleScratch(e.clientX, e.clientY);
                      }
                    }}
                    onMouseUp={() => {
                      isDrawing.current = false;
                    }}
                    onMouseLeave={() => {
                      isDrawing.current = false;
                    }}
                    onTouchStart={(e) => {
                      isDrawing.current = true;
                      if (e.touches[0]) {
                        handleScratch(e.touches[0].clientX, e.touches[0].clientY);
                      }
                    }}
                    onTouchMove={(e) => {
                      if (isDrawing.current && e.touches[0]) {
                        handleScratch(e.touches[0].clientX, e.touches[0].clientY);
                      }
                    }}
                    onTouchEnd={() => {
                      isDrawing.current = false;
                    }}
                    className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                  />
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                {!activeCard.isClaimed && !isRevealed ? (
                  <button
                    type="button"
                    onClick={handleQuickReveal}
                    className="w-full sm:w-auto text-xs text-amber-400 hover:text-amber-300 underline font-medium py-1 cursor-pointer"
                  >
                    Tap to reveal instantly
                  </button>
                ) : (
                  <div className="text-xs text-zinc-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Card fully revealed</span>
                  </div>
                )}

                {!activeCard.isClaimed ? (
                  <button
                    type="button"
                    id={`btn-claim-scratch-${activeCard.id}`}
                    onClick={() => handleClaim(activeCard.id)}
                    disabled={claiming}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                  >
                    {claiming ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        <span>Crediting Wallet...</span>
                      </>
                    ) : (
                      <>
                        <Gift className="w-3.5 h-3.5" />
                        <span>CLAIM ₹{activeCard.amount} TO WALLET</span>
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-xs font-bold text-zinc-500 bg-zinc-900 px-4 py-2 rounded-xl border border-white/5">
                    Already Added to Balance
                  </span>
                )}
              </div>
            </div>
          )}

          {/* List of All Scratch Cards */}
          {cards.length > 1 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider px-1">
                Your Reward Collection ({cards.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cards.map((card) => {
                  const isSelected = card.id === (activeCard?.id || '');
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => {
                        setActiveCardId(card.id);
                        setIsRevealed(card.isClaimed || card.isRevealed);
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/50'
                          : card.isClaimed
                          ? 'bg-zinc-900/40 border-white/5 opacity-70'
                          : 'bg-zinc-900 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">{card.title}</span>
                          <span className="text-[10px] text-amber-400 font-mono font-bold">
                            ₹{card.amount}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 truncate">{card.description}</p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          card.isClaimed
                            ? 'bg-zinc-800 text-zinc-400'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {card.isClaimed ? 'Claimed' : 'Ready'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
