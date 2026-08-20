import React, { useState } from 'react';
import { Copy, Check, ShieldCheck, Clock, User as UserIcon } from 'lucide-react';
import { User } from '../../types/index';

interface ProfileHeaderProps {
  user: User;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user }) => {
  const [copied, setCopied] = useState(false);

  const accountId = user.id ? `ND99-${user.id.replace(/^usr_/, '').toUpperCase()}` : 'ND99-PLAYER';

  const handleCopyId = () => {
    navigator.clipboard.writeText(accountId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isVerified = user.kycStatus === 'VERIFIED' || user.emailVerified;
  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Active Member';

  return (
    <div id="player-profile-header" className="relative p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-lg overflow-hidden">
      {/* Decorative neon subtle ambient glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-3xl pointer-events-none rounded-full" />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Avatar + Details */}
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="relative shrink-0">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || user.username}
                referrerPolicy="no-referrer"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-md shadow-emerald-950/40"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-xl shadow-inner">
                {user.name ? user.name.slice(0, 2).toUpperCase() : user.username ? user.username.slice(0, 2).toUpperCase() : <UserIcon className="w-6 h-6" />}
              </div>
            )}
            <div
              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-zinc-950 flex items-center justify-center text-[10px] ${
                user.isActive ? 'bg-emerald-500 text-black' : 'bg-amber-500 text-black'
              }`}
              title={user.isActive ? 'Active Account' : 'Limited Account'}
            >
              ✓
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide truncate">
                {user.name || user.username}
              </h2>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <Clock className="w-3 h-3 text-amber-300" />
                  Standard
                </span>
              )}
            </div>

            <div className="text-xs text-zinc-400 font-mono mt-0.5 truncate">
              @{user.username} {user.email ? `• ${user.email}` : ''}
            </div>

            <div className="text-[11px] text-zinc-500 mt-1">
              Member since {joinDate}
            </div>
          </div>
        </div>

        {/* Right: Account ID Card + Copy Action */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center p-2.5 sm:p-3 rounded-xl bg-zinc-950/80 border border-white/5 shrink-0">
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
            Player Account ID
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs sm:text-sm font-mono font-bold text-emerald-300 tracking-wider">
              {accountId}
            </span>
            <button
              id="copy-account-id-btn"
              onClick={handleCopyId}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-zinc-300 hover:text-emerald-300 border border-white/10 transition-colors"
              title="Copy Account ID"
              aria-label="Copy Account ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
