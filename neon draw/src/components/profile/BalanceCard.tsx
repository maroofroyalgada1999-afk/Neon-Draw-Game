import React, { useState } from 'react';
import { Eye, EyeOff, PlusCircle, ArrowDownToLine, Gift, Wallet, Sparkles } from 'lucide-react';
import { User } from '../../types/index';

interface BalanceCardProps {
  user: User;
  onOpenDeposit: () => void;
  onOpenWithdrawal: () => void;
  onClaimBonus: () => void;
  isClaimingBonus?: boolean;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  user,
  onOpenDeposit,
  onOpenWithdrawal,
  onClaimBonus,
  isClaimingBonus = false,
}) => {
  const [showBalance, setShowBalance] = useState<boolean>(!user.balanceHidden);

  const formattedBalance = user.virtualBalance.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div id="player-balance-card" className="relative p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border border-emerald-500/20 shadow-xl overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute top-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Total Wallet Balance
            </span>
          </div>
        </div>

        <button
          id="toggle-balance-visibility-btn"
          onClick={() => setShowBalance(!showBalance)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 border border-white/5 transition-colors"
          title={showBalance ? 'Hide balance' : 'Show balance'}
        >
          {showBalance ? (
            <>
              <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
              <span>Hide</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 text-zinc-400" />
              <span>Show</span>
            </>
          )}
        </button>
      </div>

      {/* Balance Numbers Display */}
      <div className="mt-3.5">
        <div className="flex items-baseline gap-2">
          <span className="text-xs sm:text-sm font-semibold text-emerald-400">INR</span>
          <span className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
            {showBalance ? `₹${formattedBalance}` : '••••••••'}
          </span>
        </div>
        <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Instant Withdrawals & Deposits Active • 0% Platform Fee
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-3">
        <button
          id="balance-card-deposit-btn"
          onClick={onOpenDeposit}
          className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-950/40 active:scale-[0.98] transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-zinc-950 shrink-0" />
          <span>Deposit</span>
        </button>

        <button
          id="balance-card-withdraw-btn"
          onClick={onOpenWithdrawal}
          className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 hover:border-cyan-500/50 font-bold text-xs sm:text-sm shadow-md active:scale-[0.98] transition-all cursor-pointer"
        >
          <ArrowDownToLine className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Withdraw</span>
        </button>

        <button
          id="balance-card-faucet-btn"
          onClick={onClaimBonus}
          disabled={isClaimingBonus}
          className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-amber-500/10 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-500/50 font-bold text-xs sm:text-sm shadow-md active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
        >
          <Gift className={`w-4 h-4 text-amber-400 shrink-0 ${isClaimingBonus ? 'animate-spin' : ''}`} />
          <span>{isClaimingBonus ? 'Claiming...' : 'Daily Boost'}</span>
        </button>
      </div>
    </div>
  );
};
