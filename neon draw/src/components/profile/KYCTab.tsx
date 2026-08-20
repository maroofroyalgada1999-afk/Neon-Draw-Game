import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Video,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Camera,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import { sounds } from '../../services/sound';
import { KYCRecord, KYCDocType } from '../../types/index';

interface KYCTabProps {
  onSuccess: () => void;
}

export const KYCTab: React.FC<KYCTabProps> = ({ onSuccess }) => {
  const [status, setStatus] = useState<string>('NOT_STARTED');
  const [kycRecord, setKycRecord] = useState<KYCRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Form State
  const [docType, setDocType] = useState<KYCDocType>('AADHAAR');
  const [docNumber, setDocNumber] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [hasVideoRecording, setHasVideoRecording] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fetchKycStatus = async () => {
    setLoading(true);
    try {
      const res = await api.getKycStatus();
      setStatus(res.status);
      setKycRecord(res.kyc);
    } catch (err) {
      console.warn('Failed to load KYC:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycStatus();
  }, []);

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(5);

    const interval = setInterval(() => {
      setRecordingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRecording(false);
          setHasVideoRecording(true);
          sounds.playSelect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!docNumber.trim()) {
      setError('Please provide document identification number.');
      return;
    }
    if (!fullName.trim()) {
      setError('Please enter your full legal name matching government ID.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitKyc({
        docType,
        docNumber: docNumber.trim(),
        fullName: fullName.trim(),
        dob: dob || undefined,
        hasVideoRecording,
        videoDurationSeconds: 5,
      });

      setStatus('VERIFIED');
      setKycRecord(res.kyc);
      sounds.playBonus();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'KYC submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-zinc-400 text-xs flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
        <span>Verifying security credentials...</span>
      </div>
    );
  }

  // Already Verified State
  if (status === 'VERIFIED' && kycRecord) {
    return (
      <div id="kyc-verified-content" className="space-y-4 animate-in fade-in duration-200">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-zinc-900 to-zinc-900 border border-emerald-500/30 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-black text-white">Identity Verified (Level 2)</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              Your account has full unrestricted access to instant withdrawals and high-limit rounds.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-white/5 text-left text-xs space-y-2 max-w-md mx-auto">
            <div className="flex justify-between">
              <span className="text-zinc-400">Legal Name:</span>
              <span className="font-bold text-white">{kycRecord.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Document Type:</span>
              <span className="font-bold text-emerald-300">{kycRecord.docType.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Document ID:</span>
              <span className="font-mono text-zinc-300">{kycRecord.docNumberMasked}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Verified Date:</span>
              <span className="text-zinc-400 font-mono">
                {new Date(kycRecord.reviewedAt || kycRecord.submittedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="kyc-tab-content" className="space-y-5 animate-in fade-in duration-200">
      <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
          <FileCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Player KYC & Identity Verification
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Comply with regulatory fair play rules for unrestricted instant bank withdrawals.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Document Type */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">
            Select Government ID Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(['AADHAAR', 'PAN_CARD', 'PASSPORT', 'DRIVING_LICENSE', 'NATIONAL_ID'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setDocType(type)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                  docType === type
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                    : 'bg-zinc-900 border-white/5 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Name & ID Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Full Legal Name (as on ID)
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Document Number
            </label>
            <input
              type="text"
              required
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder="e.g. 5182 9182 9102"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Video Liveness Optional Section */}
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">Face Liveness Video Check</span>
            </div>
            {hasVideoRecording && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Captured
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 text-xs">
            <p className="text-[11px] text-zinc-400">
              Quick 5-second simulated selfie scan to authenticate document ownership.
            </p>

            <button
              type="button"
              onClick={handleStartRecording}
              disabled={isRecording}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                isRecording
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10'
              }`}
            >
              {isRecording ? `Recording... (${recordingSeconds}s)` : hasVideoRecording ? 'Retake Video' : 'Start 5s Check'}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-sm shadow-md active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 text-zinc-950" />
          <span>{submitting ? 'Submitting Verification...' : 'Submit ID Verification'}</span>
        </button>
      </form>
    </div>
  );
};
