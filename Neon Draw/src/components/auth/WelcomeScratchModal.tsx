import React, { useState, useEffect, useRef } from 'react';
import { X, Trophy, Sparkles, Gift, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { sounds } from '../../services/sound';

export const WelcomeScratchModal: React.FC = () => {
  const { welcomeScratchCard, isWelcomeModalOpen, closeWelcomeModal, updateUserBalanceDirectly } = useAuth();
  const [scratchedPercentage, setScratchedPercentage] = useState<number>(0);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [claiming, setClaiming] = useState<boolean>(false);
  const [claimed, setClaimed] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef<boolean>(false);

  const card = welcomeScratchCard || {
    id: 'welcome_temp',
    amount: 100,
    title: 'Welcome Scratch Card',
    description: 'Special 00-99 registration bonus reward',
  };

  useEffect(() => {
    if (!isWelcomeModalOpen || isRevealed) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Draw luxury gold gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f59e0b');
    gradient.addColorStop(0.3, '#fbbf24');
    gradient.addColorStop(0.5, '#d97706');
    gradient.addColorStop(0.8, '#f59e0b');
    gradient.addColorStop(1, '#b45309');

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('✨ SCRATCH HERE ✨', width / 2, height / 2 - 10);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#92400e';
    ctx.fillText('Swipe or tap to reveal your bonus!', width / 2, height / 2 + 18);

    setScratchedPercentage(0);
    setClaimed(false);
  }, [isWelcomeModalOpen, isRevealed]);

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

    if (ratio > 35 && !isRevealed) {
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
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();

    checkScratchPercentage();
  };

  const handleQuickReveal = () => {
    setIsRevealed(true);
    setScratchedPercentage(100);
    sounds.playBonus();
  };

  const handleClaimReward = async () => {
    if (!card.id) {
      closeWelcomeModal();
      return;
    }
    setClaiming(true);
    try {
      const res = await api.claimScratchCard(card.id);
      updateUserBalanceDirectly(res.newBalance);
      sounds.playBonus();
      setClaimed(true);
      setTimeout(() => {
        closeWelcomeModal();
      }, 1800);
    } catch (err: any) {
      // Fallback
      closeWelcomeModal();
    } finally {
      setClaiming(false);
    }
  };

  if (!isWelcomeModalOpen) return null;

  return (
    <div
      id="welcome-scratch-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-zinc-950 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_80px_rgba(245,158,11,0.25)] text-center overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <button
          type="button"
          onClick={closeWelcomeModal}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white border border-white/5 transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Celebration Header */}
        <div className="space-y-1.5 mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black border border-amber-500/30 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>REGISTRATION BONUS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            Welcome to NEON DRAW-99!
          </h2>
          <p className="text-xs text-zinc-400">
            Scratch your welcome card below to reveal your guaranteed coins reward!
          </p>
        </div>

        {/* Scratch Card Interactive Area */}
        <div className="relative w-full max-w-xs mx-auto h-48 rounded-2xl overflow-hidden border-2 border-amber-500/50 bg-zinc-900 shadow-[0_0_30px_rgba(245,158,11,0.2)] flex items-center justify-center select-none my-4">
          {/* Underneath Revealed Reward */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-amber-950 via-zinc-900 to-black text-center">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
              CONGRATULATIONS!
            </span>
            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 my-1 font-mono">
              ₹{card.amount}
            </div>
            <span className="text-xs text-zinc-300 font-bold">
              {card.amount} Coins (1 Coin = ₹1)
            </span>
            <p className="text-[10px] text-zinc-500 mt-1">Ready to play 00-99 draws</p>
          </div>

          {/* Canvas Scratch Layer */}
          {!isRevealed && (
            <canvas
              ref={canvasRef}
              width={320}
              height={192}
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

        {/* Action Controls */}
        <div className="space-y-3 mt-4">
          {!isRevealed ? (
            <button
              type="button"
              onClick={handleQuickReveal}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline cursor-pointer"
            >
              Tap here to reveal instantly
            </button>
          ) : claimed ? (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>₹{card.amount} Coins Added to Balance! Starting game...</span>
            </div>
          ) : (
            <button
              type="button"
              id="btn-claim-welcome-bonus"
              onClick={handleClaimReward}
              disabled={claiming}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-black text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              {claiming ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Adding ₹{card.amount} to Wallet...</span>
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4" />
                  <span>CLAIM ₹{card.amount} & PLAY NOW</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
