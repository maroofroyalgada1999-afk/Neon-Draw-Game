import React, { useState, useEffect } from 'react';
import {
  ArrowDownToLine,
  Smartphone,
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  History,
  ShieldAlert,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { sounds } from '../../services/sound';
import { WithdrawalRequest, User } from '../../types/index';

interface WithdrawalTabProps {
  user: User;
  onSuccess: (newBalance: number) => void;
}

export const WithdrawalTab: React.FC<WithdrawalTabProps> = ({ user, onSuccess }) => {
  const [method, setMethod] = useState<'UPI' | 'BANK_ACCOUNT'>('UPI');
  const [amount, setAmount] = useState<string>('500');
  const [upiId, setUpiId] = useState<string>('');
  const [accountHolderName, setAccountHolderName] = useState<string>(user.name || '');

  // Bank details
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [ifscCode, setIfscCode] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  const loadWithdrawals = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.getWithdrawals();
      setWithdrawals(res.withdrawals || []);
    } catch (err) {
      console.warn('Failed to load withdrawals:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 200) {
      setError('Minimum withdrawal amount is ₹200.');
      return;
    }
    if (numericAmount > 25000) {
      setError('Maximum single withdrawal limit is ₹25,000.');
      return;
    }
    if (numericAmount > user.virtualBalance) {
      setError(`Insufficient balance. You currently have ₹${user.virtualBalance.toLocaleString()}.`);
      return;
    }

    if (method === 'UPI') {
      if (!upiId || !upiId.includes('@')) {
        setError('Please enter a valid UPI ID (e.g. name@okhdfcbank).');
        return;
      }
      if (!accountHolderName.trim()) {
        setError('Account holder legal name is required.');
        return;
      }
    } else {
      if (!accountNumber || accountNumber.length < 8) {
        setError('Please enter a valid Bank Account Number (at least 8 digits).');
        return;
      }
      if (!ifscCode || ifscCode.length < 5) {
        setError('Please enter a valid Bank IFSC Code (e.g. HDFC0001234).');
        return;
      }
      if (!accountHolderName.trim()) {
        setError('Account holder name is required.');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await api.requestWithdrawal({
        amount: numericAmount,
        method,
        upiDetails: method === 'UPI' ? { upiId: upiId.trim(), accountHolderName: accountHolderName.trim() } : undefined,
        bankDetails:
          method === 'BANK_ACCOUNT'
            ? {
                accountHolderName: accountHolderName.trim(),
                accountNumber: accountNumber.trim(),
                ifscCode: ifscCode.trim().toUpperCase(),
                bankName: bankName.trim() || 'Indian Scheduled Bank',
              }
            : undefined,
      });

      onSuccess(res.newBalance);
      setSuccessMessage(`Payout request of ₹${numericAmount.toLocaleString()} submitted successfully!`);
      sounds.playSelect();
      loadWithdrawals();
    } catch (err: any) {
      setError(err.message || 'Withdrawal request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelWithdrawal = async (id: string) => {
    try {
      const res = await api.cancelWithdrawal(id);
      onSuccess(res.newBalance);
      sounds.playBonus();
      loadWithdrawals();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel withdrawal.');
    }
  };

  return (
    <div id="withdrawal-tab-content" className="space-y-6 animate-in fade-in duration-200">
      {/* Balance Summary Header */}
      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-white/10 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
            Available for Payout
          </span>
          <span className="text-xl sm:text-2xl font-mono font-black text-emerald-400">
            ₹{user.virtualBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
            Processing Speed
          </span>
          <span className="text-xs font-bold text-cyan-300">Instant (15-60m)</span>
        </div>
      </div>

      <form onSubmit={handleRequestWithdrawal} className="space-y-4">
        {/* Method Selector */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">
            Payout Destination
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              id="payout-method-upi"
              onClick={() => setMethod('UPI')}
              className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                method === 'UPI'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                  : 'bg-zinc-900 border-white/5 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              <Smartphone className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-left">
                <div className="text-xs font-bold">UPI VPA</div>
                <div className="text-[10px] text-zinc-400">Instant Payout</div>
              </div>
            </button>

            <button
              type="button"
              id="payout-method-bank"
              onClick={() => setMethod('BANK_ACCOUNT')}
              className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                method === 'BANK_ACCOUNT'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                  : 'bg-zinc-900 border-white/5 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              <Building2 className="w-5 h-5 text-teal-400 shrink-0" />
              <div className="text-left">
                <div className="text-xs font-bold">Bank Account</div>
                <div className="text-[10px] text-zinc-400">IMPS / NEFT</div>
              </div>
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Withdrawal Amount (INR)
            </label>
            <span className="text-[11px] text-zinc-400">Min: ₹200 • Max: ₹25,000</span>
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">
              ₹
            </span>
            <input
              id="withdrawal-amount-input"
              type="number"
              min="200"
              max="25000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500"
              className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Method Specific Fields */}
        {method === 'UPI' ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                UPI ID / VPA
              </label>
              <input
                id="withdrawal-upi-id"
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="username@okhdfcbank"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Account Holder Name
              </label>
              <input
                id="withdrawal-upi-holder-name"
                type="text"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="Full legal name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Account Number
                </label>
                <input
                  id="withdrawal-bank-acc"
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 5010029102910"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  IFSC Code
                </label>
                <input
                  id="withdrawal-bank-ifsc"
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="HDFC0001234"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 uppercase"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Account Holder Legal Name
              </label>
              <input
                id="withdrawal-bank-holder-name"
                type="text"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="Name as printed on bank passbook"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <button
          type="submit"
          id="submit-withdrawal-btn"
          disabled={loading || user.virtualBalance < 200}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-zinc-950 font-black text-sm shadow-lg shadow-cyan-950/40 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowDownToLine className="w-4 h-4 text-zinc-950" />
          <span>{loading ? 'Submitting Request...' : `Withdraw ₹${parseFloat(amount || '0').toLocaleString()}`}</span>
        </button>
      </form>

      {/* Payout History */}
      <div className="pt-2 border-t border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 uppercase tracking-wider">
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>Payout History</span>
          </div>
          <button
            type="button"
            onClick={loadWithdrawals}
            className="text-[11px] text-zinc-400 hover:text-cyan-400 flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${loadingHistory ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {withdrawals.length === 0 ? (
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5 text-center text-xs text-zinc-400">
            No withdrawal requests on record.
          </div>
        ) : (
          <div className="space-y-2">
            {withdrawals.map((w) => (
              <div
                key={w.id}
                className="p-3 rounded-xl bg-zinc-900/80 border border-white/5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <ArrowDownToLine className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-mono font-bold text-white">
                      ₹{w.amount.toLocaleString()} ({w.method})
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      Ref: {w.transactionReference} • {new Date(w.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      w.status === 'SUCCESS'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : w.status === 'PENDING' || w.status === 'PROCESSING'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {w.status}
                  </span>

                  {w.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => handleCancelWithdrawal(w.id)}
                      className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-semibold border border-rose-500/20 transition-colors"
                      title="Cancel payout request and refund balance"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
