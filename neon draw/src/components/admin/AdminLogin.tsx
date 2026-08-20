import React, { useState } from 'react';
import { ShieldAlert, Lock, User, KeyRound, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminLoginProps {
  onSuccess?: () => void;
  onBackToPlayerApp?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onBackToPlayerApp }) => {
  const { login, adminQuickLogin } = useAuth();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    setError('');

    try {
      await login(username.trim(), password.trim());
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid administrative credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRole = async (role: 'SUPER_ADMIN' | 'GAME_ADMIN' | 'SUPPORT_ADMIN' | 'AUDITOR') => {
    setLoading(true);
    setError('');
    try {
      await adminQuickLogin(role);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              Admin Portal Login
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Restricted Administrative Console • Role-Based Authentication
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleAdminLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1.5">
                Admin Username / Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin, game_admin, support_admin..."
                  className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-xs tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Authorize & Enter Console'}
            </button>
          </form>

          {/* Quick Demo Credentials Switcher */}
          <div className="pt-4 border-t border-white/5 space-y-3">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block text-center">
              Quick Role Authentication (Demonstration Mode)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickRole('SUPER_ADMIN')}
                className="p-2.5 rounded-xl bg-zinc-900/80 hover:bg-emerald-950/40 border border-white/5 hover:border-emerald-500/30 text-left transition-colors"
              >
                <span className="text-xs font-bold text-emerald-400 block">👑 Super Admin</span>
                <span className="text-[9px] text-zinc-500 font-mono">admin / Full Access</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRole('GAME_ADMIN')}
                className="p-2.5 rounded-xl bg-zinc-900/80 hover:bg-amber-950/40 border border-white/5 hover:border-amber-500/30 text-left transition-colors"
              >
                <span className="text-xs font-bold text-amber-400 block">🎯 Game Operator</span>
                <span className="text-[9px] text-zinc-500 font-mono">game_admin / Rounds</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRole('SUPPORT_ADMIN')}
                className="p-2.5 rounded-xl bg-zinc-900/80 hover:bg-cyan-950/40 border border-white/5 hover:border-cyan-500/30 text-left transition-colors"
              >
                <span className="text-xs font-bold text-cyan-400 block">🛡️ Support Desk</span>
                <span className="text-[9px] text-zinc-500 font-mono">support_admin / Tickets</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRole('AUDITOR')}
                className="p-2.5 rounded-xl bg-zinc-900/80 hover:bg-purple-950/40 border border-white/5 hover:border-purple-500/30 text-left transition-colors"
              >
                <span className="text-xs font-bold text-purple-400 block">📜 Auditor</span>
                <span className="text-[9px] text-zinc-500 font-mono">auditor / Read-Only</span>
              </button>
            </div>
          </div>

          {/* Back to Player Arena */}
          {onBackToPlayerApp && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onBackToPlayerApp}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Player Game Arena</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
