import React, { useState, useEffect } from 'react';
import { Users, Copy, Check, Share2, Gift, Sparkles, Trophy, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import { sounds } from '../../services/sound';

interface ReferralsTabProps {
  onSuccess: (newBalance: number) => void;
  onOpenScratchCards?: () => void;
}

export const ReferralsTab: React.FC<ReferralsTabProps> = ({ onSuccess, onOpenScratchCards }) => {
  const [data, setData] = useState<{
    referralCode: string;
    referralLink: string;
    totalReferrals: number;
    totalCoinsEarned: number;
    referralCards: any[];
    referredUsers: { id: string; username: string; name: string; joinedAt: number }[];
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const res = await api.getReferrals();
      setData(res);
    } catch (err: any) {
      console.warn('Failed to load referral data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const handleCopyCode = () => {
    if (!data?.referralCode) return;
    navigator.clipboard.writeText(data.referralCode);
    setCopiedCode(true);
    sounds.playSelect();
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    if (!data?.referralLink) return;
    navigator.clipboard.writeText(data.referralLink);
    setCopiedLink(true);
    sounds.playSelect();
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleWhatsAppShare = () => {
    if (!data) return;
    const text = `Join me on NEON DRAW-99! 🎮 Play live number draws & get an instant Welcome Scratch Card worth up to ₹100 Coins!\n\nUse my Referral Code: ${data.referralCode}\nSign up here: ${data.referralLink}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-400 text-xs flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
        <span>Loading referral system...</span>
      </div>
    );
  }

  const referralCode = data?.referralCode || 'ND99-REWARDS';
  const referralLink = data?.referralLink || window.location.origin;
  const totalReferrals = data?.totalReferrals || 0;
  const totalCoinsEarned = data?.totalCoinsEarned || 0;
  const referredUsers = data?.referredUsers || [];

  return (
    <div id="referrals-tab" className="space-y-5 animate-in fade-in duration-200">
      {/* Referral Hero Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-950 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Invite Friends & Earn ₹50 Each</h3>
              <p className="text-xs text-zinc-400">
                Earn unlimited ₹50 Scratch Cards for every friend who registers!
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/5">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                Total Friends
              </span>
              <span className="text-xl font-black text-white font-mono">{totalReferrals}</span>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/5">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                Total ₹ Earned
              </span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                ₹{totalCoinsEarned}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-zinc-900/80 border border-white/5 flex items-center justify-between sm:block">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                  Reward Per Friend
                </span>
                <span className="text-xl font-black text-amber-400 font-mono">₹50 Card</span>
              </div>
              {onOpenScratchCards && (
                <button
                  type="button"
                  onClick={onOpenScratchCards}
                  className="sm:mt-2 text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>View Cards</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Code & Link Share Inputs */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1.5">
                Your Unique Referral Code
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 font-mono font-black text-emerald-400 text-sm tracking-wider flex items-center justify-between">
                  <span>{referralCode}</span>
                </div>
                <button
                  type="button"
                  id="btn-copy-ref-code"
                  onClick={handleCopyCode}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-white/10"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-zinc-400" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1.5">
                Shareable Referral Link
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-300 font-mono select-all focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="btn-copy-ref-link"
                    onClick={handleCopyLink}
                    className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/10"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    id="btn-whatsapp-share"
                    onClick={handleWhatsAppShare}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/40"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it Works Guide */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-3">
        <h4 className="text-xs font-black text-white uppercase tracking-wider">How Referral Works</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/5 space-y-1">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black flex items-center justify-center mb-2">
              1
            </div>
            <p className="text-xs font-bold text-white">Share Your Link</p>
            <p className="text-[11px] text-zinc-400">
              Send your link or referral code to friends on WhatsApp or Social Media.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/5 space-y-1">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black flex items-center justify-center mb-2">
              2
            </div>
            <p className="text-xs font-bold text-white">Friend Registers</p>
            <p className="text-[11px] text-zinc-400">
              Your friend joins and instantly receives a Welcome Scratch Card of up to ₹100.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/5 space-y-1">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black flex items-center justify-center mb-2">
              3
            </div>
            <p className="text-xs font-bold text-white">Get ₹50 Scratch Card</p>
            <p className="text-[11px] text-zinc-400">
              You automatically receive a ₹50 Scratch Card in your Rewards tab for each friend!
            </p>
          </div>
        </div>
      </div>

      {/* Invited Friends List */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider px-1">
          Invited Friends ({referredUsers.length})
        </h4>

        {referredUsers.length === 0 ? (
          <div className="p-6 text-center text-zinc-500 text-xs rounded-2xl bg-zinc-900/40 border border-white/5">
            No friends invited yet. Start sharing your referral code to earn ₹50 per friend!
          </div>
        ) : (
          <div className="space-y-2">
            {referredUsers.map((friend) => (
              <div
                key={friend.id}
                className="p-3 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center">
                    {friend.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">{friend.name || friend.username}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">@{friend.username}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-emerald-400 font-mono">+₹50 Card</span>
                  <span className="text-[10px] text-zinc-500 block">
                    {new Date(friend.joinedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
