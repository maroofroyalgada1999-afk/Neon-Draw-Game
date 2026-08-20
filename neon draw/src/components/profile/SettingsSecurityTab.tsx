import React, { useState } from 'react';
import {
  Lock,
  KeyRound,
  ShieldAlert,
  Smartphone,
  Monitor,
  Tablet,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  UserCheck,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { sounds } from '../../services/sound';
import { User } from '../../types/index';

interface SettingsSecurityTabProps {
  user: User;
  onClose: () => void;
}

export const SettingsSecurityTab: React.FC<SettingsSecurityTabProps> = ({ user, onClose }) => {
  const { sessions, currentSessionId, revokeOtherSessions, logout, refreshUser } = useAuth();

  // Profile preferences
  const [name, setName] = useState<string>(user.name || '');
  const [phoneNumber, setPhoneNumber] = useState<string>(user.phoneNumber || '');
  const [balanceHidden, setBalanceHidden] = useState<boolean>(Boolean(user.balanceHidden));
  const [soundEnabled, setSoundEnabled] = useState<boolean>(user.soundEnabled !== false);
  const [profileSaving, setProfileSaving] = useState<boolean>(false);
  const [profileMessage, setProfileMessage] = useState<string>('');

  // Password change
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordLoading, setPasswordLoading] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>('');
  const [passwordSuccess, setPasswordSuccess] = useState<string>('');

  // Account deletion
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>('');
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string>('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage('');
    try {
      await api.updateProfile({
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        balanceHidden,
        soundEnabled,
      });
      sounds.setMuted(!soundEnabled);
      await refreshUser();
      setProfileMessage('Profile settings updated successfully.');
      sounds.playSelect();
      setTimeout(() => setProfileMessage(''), 3000);
    } catch (err: any) {
      setProfileMessage(err.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.changePassword({
        currentPassword,
        newPassword,
      });
      setPasswordSuccess(res.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      sounds.playBonus();
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm.');
      return;
    }

    setDeleteLoading(true);
    setDeleteError('');
    try {
      await api.deleteAccount();
      logout();
      onClose();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getDeviceIcon = (deviceType?: string) => {
    if (deviceType === 'MOBILE') return <Smartphone className="w-4 h-4 text-emerald-400" />;
    if (deviceType === 'TABLET') return <Tablet className="w-4 h-4 text-cyan-400" />;
    return <Monitor className="w-4 h-4 text-purple-400" />;
  };

  return (
    <div id="settings-security-tab-content" className="space-y-6 animate-in fade-in duration-200">
      {/* Section 1: Profile & Preferences */}
      <form onSubmit={handleSaveProfile} className="p-4 rounded-2xl bg-zinc-900/80 border border-white/5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Player Profile Details
          </span>
          <span className="text-[10px] text-zinc-400 font-mono">@{user.username}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Contact Phone</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-white/5 cursor-pointer">
            <div className="flex items-center gap-2">
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-zinc-400" />}
              <span className="text-xs text-zinc-200">Game Audio FX</span>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="accent-emerald-500 w-4 h-4"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-white/5 cursor-pointer">
            <div className="flex items-center gap-2">
              {balanceHidden ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4 text-zinc-400" />}
              <span className="text-xs text-zinc-200">Hide Balance by Default</span>
            </div>
            <input
              type="checkbox"
              checked={balanceHidden}
              onChange={(e) => setBalanceHidden(e.target.checked)}
              className="accent-emerald-500 w-4 h-4"
            />
          </label>
        </div>

        {profileMessage && (
          <div className="text-xs text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{profileMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={profileSaving}
          className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer"
        >
          {profileSaving ? 'Saving...' : 'Save Profile Preferences'}
        </button>
      </form>

      {/* Section 2: Password Security */}
      <form onSubmit={handleChangePassword} className="p-4 rounded-2xl bg-zinc-900/80 border border-white/5 space-y-3.5">
        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
          <KeyRound className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Security & Password
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {passwordError && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        {passwordSuccess && (
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={passwordLoading}
          className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all border border-white/10 cursor-pointer"
        >
          {passwordLoading ? 'Updating...' : 'Update Password'}
        </button>
      </form>

      {/* Section 3: Active Device Sessions */}
      <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Active Device Sessions ({sessions.length})
          </span>

          {sessions.length > 1 && (
            <button
              onClick={revokeOtherSessions}
              className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold"
            >
              Revoke Other Devices
            </button>
          )}
        </div>

        <div className="space-y-2">
          {sessions.map((sess) => {
            const isCurrent = sess.id === currentSessionId;
            return (
              <div
                key={sess.id}
                className="p-3 rounded-xl bg-zinc-950 border border-white/5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-zinc-900 border border-white/5">
                    {getDeviceIcon(sess.deviceType)}
                  </div>
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>{sess.deviceType || 'Web Browser'}</span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          Current Device
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      IP: {sess.ipAddress} • Last active {new Date(sess.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: Account Actions & Danger Zone */}
      <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-rose-300">Account Management</div>
            <div className="text-[11px] text-zinc-400">Sign out or permanently erase player credentials</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                logout();
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-xs font-bold"
            >
              Delete Account
            </button>
          </div>
        </div>

        {showDeleteModal && (
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-rose-500/40 space-y-2.5 animate-in fade-in duration-150">
            <div className="text-xs text-rose-300 font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Permanent Account Deletion</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Type <strong className="text-white">DELETE</strong> to permanently remove all betting records and wallet data.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs font-mono"
            />
            {deleteError && <div className="text-[11px] text-rose-400">{deleteError}</div>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-xs text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirmText !== 'DELETE'}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
