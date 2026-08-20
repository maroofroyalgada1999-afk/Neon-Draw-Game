import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Smartphone,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Clock,
  History,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  XCircle,
  ExternalLink,
  Coins,
  Wallet,
  Sparkles,
  ChevronRight,
  Info,
  BadgeAlert,
  Loader2,
  Lock,
} from 'lucide-react';
import { api } from '../../services/api';
import { sounds } from '../../services/sound';
import { DepositTransaction } from '../../types/index';
import { useAuth } from '../../context/AuthContext';

interface DepositTabProps {
  onSuccess: (newBalance: number) => void;
}

interface DepositConfig {
  currency: string;
  coinRate: number;
  minAmount: number;
  maxAmount: number;
  quickAmounts: number[];
  merchantUpiId: string;
  merchantName: string;
  expiryMinutes: number;
  methods: {
    id: 'UPI';
    name: string;
    description: string;
    preferred?: boolean;
    fee: string;
    processingTime: string;
    isConfigured: boolean;
  }[];
}

export const DepositTab: React.FC<DepositTabProps> = ({ onSuccess }) => {
  const { user, refreshUser } = useAuth();

  // Server deposit config
  const [config, setConfig] = useState<DepositConfig | null>(null);
  const [configLoading, setConfigLoading] = useState<boolean>(true);

  // Selection state
  const [selectedMethod, setSelectedMethod] = useState<'UPI'>('UPI');
  const [amount, setAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>('500');

  // Multi-step flow: SELECT -> PAYMENT -> VERIFYING -> SUCCESS
  const [activeStep, setActiveStep] = useState<'SELECT' | 'PAYMENT' | 'VERIFYING' | 'SUCCESS'>('SELECT');
  const [activeDeposit, setActiveDeposit] = useState<DepositTransaction | null>(null);
  const [utrNumber, setUtrNumber] = useState<string>('');

  // Status & loaders
  const [loading, setLoading] = useState<boolean>(false);
  const [utrSubmitting, setUtrSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [copiedAmount, setCopiedAmount] = useState<boolean>(false);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(1800); // 30 mins in seconds

  // Deposit history & polling
  const [deposits, setDeposits] = useState<DepositTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Load Deposit Config
  const loadConfig = async () => {
    setConfigLoading(true);
    try {
      const cfg = await api.getDepositConfig();
      setConfig(cfg as DepositConfig);
      if (cfg.methods && cfg.methods.length > 0) {
        setSelectedMethod(cfg.methods[0].id);
      }
      if (cfg.quickAmounts && cfg.quickAmounts.length > 0) {
        setAmount(cfg.quickAmounts[2] || cfg.quickAmounts[0]);
        setCustomAmount(String(cfg.quickAmounts[2] || cfg.quickAmounts[0]));
      }
    } catch (err) {
      console.warn('Failed to fetch deposit configuration:', err);
    } finally {
      setConfigLoading(false);
    }
  };

  // 2. Load Deposit History
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.getDeposits();
      setDeposits(res.deposits || []);

      // Check if user has an ongoing PENDING or VERIFYING deposit to resume
      if (!activeDeposit && res.deposits && res.deposits.length > 0) {
        const ongoing = res.deposits.find(
          (d) => (d.status === 'PENDING' || d.status === 'VERIFYING') && (!d.expiresAt || d.expiresAt > Date.now())
        );
        if (ongoing) {
          setActiveDeposit(ongoing);
          if (ongoing.status === 'VERIFYING') {
            setActiveStep('VERIFYING');
          } else {
            setActiveStep('PAYMENT');
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load deposit history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadConfig();
    loadHistory();
  }, []);

  // 3. Expiration Timer countdown
  useEffect(() => {
    if (!activeDeposit || activeStep === 'SUCCESS' || activeStep === 'SELECT') return;

    const expiresAt = activeDeposit.expiresAt || (activeDeposit.createdAt + 30 * 60 * 1000);
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0 && activeDeposit.status === 'PENDING') {
        setActiveDeposit((prev) => (prev ? { ...prev, status: 'EXPIRED' } : null));
        setError('This deposit payment session has expired. Please create a new deposit.');
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [activeDeposit, activeStep]);

  // 4. Status Polling when in VERIFYING state
  useEffect(() => {
    if (activeStep === 'VERIFYING' && activeDeposit) {
      const checkStatus = async () => {
        try {
          const res = await api.getDeposit(activeDeposit.id);
          if (res.deposit) {
            setActiveDeposit(res.deposit);
            if (res.deposit.status === 'SUCCESS') {
              setActiveStep('SUCCESS');
              sounds.playWin();
              refreshUser();
              onSuccess(user ? user.virtualBalance + res.deposit.amount : res.deposit.amount);
              loadHistory();
            } else if (res.deposit.status === 'REJECTED') {
              setError(`Verification failed: ${res.deposit.failureReason || 'UTR not verified.'}`);
              loadHistory();
            }
          }
        } catch (e) {
          // ignore polling glitches
        }
      };

      pollingRef.current = setInterval(checkStatus, 6000);
      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    }
  }, [activeStep, activeDeposit, user, refreshUser, onSuccess]);

  const handleAmountSelect = (val: number) => {
    setAmount(val);
    setCustomAmount(String(val));
    setError('');
    sounds.playSelect();
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmount(val);
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      setAmount(num);
    }
    setError('');
  };

  // Step 1 -> Step 2: Create Deposit
  const handleInitiateDeposit = async () => {
    const min = config?.minAmount || 100;
    const max = config?.maxAmount || 50000;

    if (!amount || amount < min) {
      setError(`Minimum deposit amount is ₹${min}.`);
      return;
    }
    if (amount > max) {
      setError(`Maximum deposit amount is ₹${max.toLocaleString()}.`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.createDeposit({
        amount,
        paymentMethod: selectedMethod,
      });
      setActiveDeposit(res.deposit);
      setActiveStep('PAYMENT');
      sounds.playSelect();
      loadHistory();
    } catch (err: any) {
      setError(err.message || 'Failed to initialize deposit.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit UTR for verification (Transitions to VERIFYING)
  const handleSubmitUtr = async () => {
    if (!activeDeposit) return;
    if (!utrNumber || utrNumber.trim().length < 8) {
      setError('Please enter a valid 12-digit UPI reference / UTR number from your payment app.');
      return;
    }

    setUtrSubmitting(true);
    setError('');
    try {
      const res = await api.submitDepositUtr({
        depositId: activeDeposit.id,
        utrNumber: utrNumber.trim(),
      });
      setActiveDeposit(res.deposit);
      setActiveStep('VERIFYING');
      sounds.playSelect();
      loadHistory();
    } catch (err: any) {
      setError(err.message || 'Failed to submit UTR. Please check the reference number.');
    } finally {
      setUtrSubmitting(false);
    }
  };

  // Cancel Deposit
  const handleCancelDeposit = async () => {
    if (!activeDeposit) return;
    if (!confirm('Are you sure you want to cancel this pending deposit?')) return;

    setLoading(true);
    try {
      await api.cancelDeposit(activeDeposit.id);
      resetFlow();
      loadHistory();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel deposit.');
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, type: 'upi' | 'amount' | 'ref') => {
    navigator.clipboard.writeText(text);
    if (type === 'upi') {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } else if (type === 'amount') {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    } else {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
    sounds.playSelect();
  };

  const resetFlow = () => {
    setActiveStep('SELECT');
    setActiveDeposit(null);
    setUtrNumber('');
    setError('');
    if (pollingRef.current) clearInterval(pollingRef.current);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const quickChips = config?.quickAmounts || [100, 300, 500, 1000, 2000, 5000];
  const merchantUpi = activeDeposit?.merchantUpiId || config?.merchantUpiId || 'neondraw99@icici';
  const merchantName = config?.merchantName || 'NEON DRAW-99';
  const currentBalance = user?.virtualBalance ?? 0;

  // Build standard UPI URI for QR Code & App Launch
  const upiDeepLink = activeDeposit?.upiUri || `upi://pay?pa=${encodeURIComponent(merchantUpi)}&pn=${encodeURIComponent(merchantName)}&am=${(activeDeposit?.amount || amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Deposit ${activeDeposit?.transactionReference || ''} NEON DRAW-99`)}`;

  return (
    <div id="deposit-tab-container" className="space-y-5 animate-in fade-in duration-200">
      {/* Dynamic Header: Deposit & Player Balance */}
      <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
              <span>Deposit Coins</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                1 Coin = ₹1
              </span>
            </h2>
            <p className="text-[11px] text-zinc-400">
              Instant 24/7 UPI & QR verification
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
            Current Balance
          </span>
          <div className="flex items-center justify-end gap-1.5 font-mono font-black text-emerald-400 text-sm sm:text-base">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>₹{currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* STEP 1: Select Payment Method & Amount */}
      {activeStep === 'SELECT' && (
        <div className="space-y-5">
          {/* Payment Method Selector (Only Configured Server Methods) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-zinc-300 uppercase tracking-wider">
                Select Payment Method
              </label>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Zero Gateway Fees
              </span>
            </div>

            {configLoading ? (
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex items-center justify-center gap-2 text-xs text-zinc-400">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Loading available payment channels...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {(config?.methods || [{ id: 'UPI', name: 'UPI (Unified Payments Interface)', description: 'Google Pay, PhonePe, Paytm, BHIM, CRED', preferred: true, fee: '0%', processingTime: 'Instant / 1-3 mins', isConfigured: true }]).map((method) => {
                  const isSelected = selectedMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      id={`payment-method-${method.id.toLowerCase()}`}
                      onClick={() => {
                        setSelectedMethod(method.id);
                        sounds.playSelect();
                      }}
                      className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left transition-all relative flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/40'
                          : 'bg-zinc-900/70 border-white/5 hover:bg-zinc-900 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-black text-white truncate">
                              {method.name}
                            </span>
                            {method.preferred && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500 text-black uppercase">
                                Preferred
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                            {method.description}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-zinc-800 text-emerald-400 border border-white/5 block mb-0.5">
                          {method.processingTime}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          Fee: <strong className="text-white">{method.fee}</strong>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Amount Selection Section */}
          <div className="space-y-3 p-4 rounded-2xl bg-zinc-900/50 border border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-zinc-300 uppercase tracking-wider">
                Select Deposit Amount
              </label>
              <span className="text-[10px] font-mono text-zinc-400">
                Min: ₹{config?.minAmount || 100} • Max: ₹{(config?.maxAmount || 50000).toLocaleString()}
              </span>
            </div>

            {/* Quick Amount Chips */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {quickChips.map((chip) => {
                const isSelected = amount === chip && customAmount === String(chip);
                return (
                  <button
                    key={chip}
                    type="button"
                    id={`deposit-chip-${chip}`}
                    onClick={() => handleAmountSelect(chip)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-mono font-black transition-all border text-center cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-950/60 scale-[1.02]'
                        : 'bg-zinc-950/80 hover:bg-zinc-800 text-zinc-200 border-white/10 hover:border-emerald-500/30'
                    }`}
                  >
                    +₹{chip.toLocaleString()}
                  </button>
                );
              })}
            </div>

            {/* Custom Amount Input & Coin Conversion Display */}
            <div className="pt-2">
              <label className="block text-[11px] font-bold text-zinc-400 mb-1.5">
                Or Enter Custom Amount (INR)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-mono font-black text-base">
                  ₹
                </span>
                <input
                  id="deposit-custom-amount-input"
                  type="number"
                  min={config?.minAmount || 100}
                  max={config?.maxAmount || 50000}
                  step="1"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  placeholder="Enter amount (e.g. 500)"
                  className="w-full pl-8 pr-28 py-3 rounded-xl bg-zinc-950 border border-white/15 text-white font-mono font-black text-base focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>{amount > 0 ? amount.toLocaleString() : 0} Coins</span>
                </div>
              </div>
            </div>

            {/* Calculation summary banner */}
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/5 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">Total Coins to Credit:</span>
              <span className="text-white font-black flex items-center gap-1 text-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                +{amount > 0 ? amount.toLocaleString() : 0} Coins (₹{amount > 0 ? amount.toLocaleString() : 0})
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-rose-300 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            id="initiate-deposit-submit-btn"
            onClick={handleInitiateDeposit}
            disabled={loading || amount < (config?.minAmount || 100)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-950/50 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Creating Deposit Session...</span>
              </>
            ) : (
              <>
                <span>PROCEED TO PAY ₹{amount.toLocaleString()}</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </>
            )}
          </button>
        </div>
      )}

      {/* STEP 2: UPI Payment Page (QR Code, UPI ID, Launch Apps & UTR Submission) */}
      {activeStep === 'PAYMENT' && activeDeposit && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 sm:p-5 rounded-3xl bg-zinc-950 border border-emerald-500/30 space-y-4 shadow-2xl">
            {/* Header: Order ID, Expiry & Amount */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 uppercase tracking-wider">
                  <span>Order Ref:</span>
                  <button
                    onClick={() => copyText(activeDeposit.transactionReference, 'ref')}
                    className="text-emerald-400 font-mono font-bold hover:underline flex items-center gap-1"
                  >
                    {activeDeposit.transactionReference}
                    {copiedRef ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400 mt-0.5">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  <span>Session expires in: <strong>{formatTimer(timeLeft)}</strong></span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase text-zinc-400 font-bold block">
                  Amount to Pay
                </span>
                <span className="text-xl sm:text-2xl font-mono font-black text-white tracking-tight">
                  ₹{activeDeposit.amount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* QR Code & Merchant UPI Information */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 rounded-2xl bg-zinc-900/80 border border-white/5 items-center">
              {/* Dynamic QR Code */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-xl">
                <div className="p-1 bg-white rounded-xl">
                  <QRCodeSVG
                    value={upiDeepLink}
                    size={160}
                    level="H"
                    includeMargin={false}
                    className="w-36 h-36 sm:w-40 sm:h-40"
                  />
                </div>
                <span className="text-[10px] font-black text-black uppercase tracking-tighter mt-1">
                  Scan & Pay via any UPI App
                </span>
              </div>

              {/* Details & Copy Actions */}
              <div className="sm:col-span-7 space-y-3">
                {/* Merchant UPI ID Box */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                    Merchant UPI ID
                  </label>
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-emerald-500/20 flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-black text-emerald-300 truncate">
                      {merchantUpi}
                    </span>
                    <button
                      type="button"
                      id="copy-merchant-upi-btn"
                      onClick={() => copyText(merchantUpi, 'upi')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Amount Copy Box */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                    Exact Amount (INR)
                  </label>
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-white/10 flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-white">
                      ₹{activeDeposit.amount.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(activeDeposit.amount.toFixed(2), 'amount')}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedAmount ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Direct App Launch Button (Mobile/Desktop DeepLink) */}
                <a
                  href={upiDeepLink}
                  className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Open UPI App (GPay / PhonePe / Paytm)</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </a>
              </div>
            </div>

            {/* Step-by-Step Payment Guide */}
            <div className="p-3 rounded-2xl bg-zinc-900/50 border border-white/5 text-[11px] text-zinc-400 space-y-1.5">
              <div className="font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-400" />
                <span>How to Complete Payment:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 pl-1 text-zinc-400 font-sans">
                <li>Scan the QR code or copy the UPI ID into your UPI app.</li>
                <li>Transfer the exact amount (<strong>₹{activeDeposit.amount.toLocaleString()}</strong>).</li>
                <li>Copy the <strong>12-digit UTR / UPI Ref No.</strong> from your bank payment confirmation.</li>
                <li>Enter the UTR below and click <strong>Submit For Verification</strong>.</li>
              </ol>
            </div>

            {/* UTR Submission Box */}
            <div className="space-y-2.5 pt-2 border-t border-white/10">
              <label className="block text-xs font-black text-white uppercase tracking-wider flex items-center justify-between">
                <span>Enter 12-Digit UTR / UPI Ref Number</span>
                <span className="text-[10px] font-mono text-emerald-400">Required</span>
              </label>

              <div className="relative">
                <input
                  id="deposit-utr-submission-input"
                  type="text"
                  maxLength={24}
                  value={utrNumber}
                  onChange={(e) => {
                    // standardize alphanumeric UTR
                    setUtrNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                    setError('');
                  }}
                  placeholder="e.g. 418293810293 or UTR12345678"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/15 text-white font-mono font-bold text-sm tracking-wider focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 uppercase"
                />
              </div>
              <p className="text-[10px] text-zinc-500">
                Tip: The UTR / Ref No is visible on your GPay, PhonePe, Paytm, or Bank SMS receipt.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions: Cancel or Submit UTR */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelDeposit}
                disabled={loading || utrSubmitting}
                className="py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition-colors border border-white/5"
              >
                Cancel Deposit
              </button>

              <button
                type="button"
                id="submit-utr-verification-btn"
                onClick={handleSubmitUtr}
                disabled={utrSubmitting || !utrNumber || utrNumber.length < 8}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {utrSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Submitting UTR...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-black" />
                    <span>SUBMIT FOR VERIFICATION</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Under Verification Screen (VERIFYING State) */}
      {activeStep === 'VERIFYING' && activeDeposit && (
        <div className="p-6 rounded-3xl bg-zinc-950 border border-indigo-500/30 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/15 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-950/50">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase mb-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Payment Under Verification</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              Verifying Deposit of ₹{activeDeposit.amount.toLocaleString()}
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto leading-relaxed">
              Your UTR <span className="font-mono font-bold text-white">({activeDeposit.utrNumber})</span> has been submitted to the verification node. Once confirmed, your wallet balance will be automatically credited with <strong>+{activeDeposit.amount.toLocaleString()} Coins</strong>.
            </p>
          </div>

          {/* Deposit summary box */}
          <div className="max-w-sm mx-auto p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 text-xs text-left space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-zinc-400">Order ID:</span>
              <span className="text-white font-bold">{activeDeposit.transactionReference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Submitted UTR:</span>
              <span className="text-indigo-400 font-bold">{activeDeposit.utrNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Payment Channel:</span>
              <span className="text-white">UPI Instant</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Status:</span>
              <span className="text-indigo-400 font-black animate-pulse">VERIFYING</span>
            </div>
          </div>

          <div className="flex justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={loadHistory}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold flex items-center gap-1.5 border border-white/5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
              <span>Check Status</span>
            </button>

            <button
              type="button"
              onClick={resetFlow}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md"
            >
              Start New Request
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Success Confirmation Screen */}
      {activeStep === 'SUCCESS' && activeDeposit && (
        <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/40 text-center space-y-4 animate-in zoom-in-95 duration-200 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950/60">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <h3 className="text-xl font-black text-white">Deposit Credited Successfully!</h3>
            <p className="text-xs text-emerald-300/90 mt-1 max-w-sm mx-auto">
              ₹{activeDeposit.amount.toLocaleString()} has been verified. <strong>+{activeDeposit.amount.toLocaleString()} Coins</strong> added to your wallet.
            </p>
          </div>

          <div className="max-w-xs mx-auto p-3 rounded-2xl bg-zinc-950/80 border border-emerald-500/30 text-xs font-mono text-left space-y-1.5">
            <div className="flex justify-between">
              <span className="text-zinc-400">Order ID:</span>
              <span className="text-white font-bold">{activeDeposit.transactionReference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Credited:</span>
              <span className="text-emerald-400 font-bold">+{activeDeposit.amount.toLocaleString()} Coins</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">UTR:</span>
              <span className="text-zinc-300">{activeDeposit.utrNumber}</span>
            </div>
          </div>

          <button
            type="button"
            id="make-another-deposit-btn"
            onClick={resetFlow}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/50 cursor-pointer"
          >
            Make Another Deposit
          </button>
        </div>
      )}

      {/* Deposit Transaction History */}
      <div className="pt-3 border-t border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black text-zinc-300 uppercase tracking-wider">
            <History className="w-4 h-4 text-emerald-400" />
            <span>Deposit History</span>
          </div>
          <button
            type="button"
            id="refresh-deposit-history-btn"
            onClick={loadHistory}
            className="text-[11px] font-bold text-zinc-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loadingHistory ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {deposits.length === 0 ? (
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 text-center text-xs text-zinc-400">
            No previous deposit records found.
          </div>
        ) : (
          <div className="space-y-2">
            {deposits.map((dep) => {
              const statusColors: Record<string, string> = {
                SUCCESS: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                VERIFYING: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 animate-pulse',
                PENDING: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                REJECTED: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
                EXPIRED: 'bg-zinc-800 text-zinc-400 border-white/10',
                CANCELLED: 'bg-zinc-800 text-zinc-400 border-white/10',
              };

              return (
                <div
                  key={dep.id}
                  className="p-3 sm:p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      dep.status === 'SUCCESS' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                      dep.status === 'VERIFYING' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' :
                      dep.status === 'REJECTED' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' :
                      'bg-zinc-800 text-zinc-400 border border-white/5'
                    }`}>
                      <Smartphone className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-white text-sm">
                          +₹{dep.amount.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          ({dep.amount.toLocaleString()} Coins)
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span>{dep.transactionReference}</span>
                        <span>•</span>
                        <span>{new Date(dep.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        {dep.utrNumber && (
                          <>
                            <span>•</span>
                            <span className="text-zinc-300 font-bold">UTR: {dep.utrNumber}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border font-mono uppercase ${statusColors[dep.status] || 'bg-zinc-800 text-zinc-400'}`}>
                      {dep.status}
                    </span>

                    {/* Resume / Check button for ongoing deposit */}
                    {(dep.status === 'PENDING' || dep.status === 'VERIFYING') && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDeposit(dep);
                          if (dep.status === 'VERIFYING') {
                            setActiveStep('VERIFYING');
                          } else {
                            setActiveStep('PAYMENT');
                          }
                          sounds.playSelect();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold transition-colors"
                      >
                        View Order
                      </button>
                    )}

                    {dep.failureReason && (
                      <span className="text-[10px] text-rose-400 font-mono" title={dep.failureReason}>
                        Reason: {dep.failureReason}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
