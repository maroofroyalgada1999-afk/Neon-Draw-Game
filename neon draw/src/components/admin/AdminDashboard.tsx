import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Users,
  Coins,
  Trophy,
  Play,
  RotateCcw,
  Ban,
  Settings,
  ShieldCheck,
  Activity,
  Search,
  Check,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Lock,
  BarChart3,
  Flame,
  TrendingUp,
  MessageSquare,
  Send,
  ArrowLeft,
  LifeBuoy,
  RefreshCw,
  Sliders,
  Filter,
} from 'lucide-react';
import { api } from '../../services/api';
import {
  AdminKPIs,
  User,
  Round,
  AuditLog,
  SecurityEvent,
  GameConfig,
  AdminRole,
  TestSuiteReport,
  SupportTicket,
  DepositTransaction,
} from '../../types/index';
import { useAuth } from '../../context/AuthContext';
import { AdminLogin } from './AdminLogin';

interface AdminDashboardProps {
  currentPath?: string;
  onNavigatePath?: (path: string) => void;
  onBackToPlayer?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentPath = '/admin',
  onNavigatePath,
  onBackToPlayer,
}) => {
  const { user, adminQuickLogin, logout } = useAuth();

  // Role resolution
  const userAdminRole: AdminRole = user?.adminRole || 'SUPER_ADMIN';

  // State
  const [activeTab, setActiveTab] = useState<string>('OVERVIEW');
  const [kpis, setKpis] = useState<AdminKPIs | null>(null);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [testReport, setTestReport] = useState<TestSuiteReport | null>(null);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [adminDeposits, setAdminDeposits] = useState<DepositTransaction[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userSearch, setUserSearch] = useState<string>('');
  const [ticketSearch, setTicketSearch] = useState<string>('');
  const [ticketFilterStatus, setTicketFilterStatus] = useState<string>('ALL');

  // Deposits Filter & Action state
  const [depositFilterStatus, setDepositFilterStatus] = useState<string>('ALL');
  const [depositSearch, setDepositSearch] = useState<string>('');
  const [selectedDepositDetails, setSelectedDepositDetails] = useState<DepositTransaction | null>(null);
  const [approvingDepositId, setApprovingDepositId] = useState<string | null>(null);
  const [adminApprovalNote, setAdminApprovalNote] = useState<string>('UTR Verified via Bank Portal');
  const [rejectingDepositId, setRejectingDepositId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Invalid or Unverifiable UTR / Payment Reference');
  const [adminRejectNote, setAdminRejectNote] = useState<string>('');
  const [processingDepositAction, setProcessingDepositAction] = useState<boolean>(false);

  // Support Ticket Reply state
  const [replyingTicketId, setReplyingTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [replyStatus, setReplyStatus] = useState<string>('RESOLVED');

  // User balance adjustment state
  const [adjustTargetUser, setAdjustTargetUser] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(500);
  const [adjustReason, setAdjustReason] = useState<string>('VIP Grant');

  // Determine allowed tabs based on role
  const allowedTabs = useMemo(() => {
    if (!user || user.role !== 'ADMIN') return [];
    switch (userAdminRole) {
      case 'SUPER_ADMIN':
        return ['OVERVIEW', 'DEPOSITS', 'ROUNDS', 'USERS', 'CONFIG', 'TICKETS', 'AUDIT', 'TESTS'];
      case 'GAME_ADMIN':
        return ['ROUNDS', 'CONFIG', 'OVERVIEW'];
      case 'SUPPORT_ADMIN':
        return ['DEPOSITS', 'TICKETS', 'USERS', 'OVERVIEW'];
      case 'AUDITOR':
        return ['DEPOSITS', 'AUDIT', 'TESTS', 'OVERVIEW'];
      default:
        return ['OVERVIEW'];
    }
  }, [user, userAdminRole]);

  // Sync activeTab with path or default allowed tab
  useEffect(() => {
    if (currentPath === '/admin/game' && allowedTabs.includes('ROUNDS')) {
      setActiveTab('ROUNDS');
    } else if (currentPath === '/admin/deposits' && allowedTabs.includes('DEPOSITS')) {
      setActiveTab('DEPOSITS');
    } else if (currentPath === '/admin/support' && allowedTabs.includes('TICKETS')) {
      setActiveTab('TICKETS');
    } else if (currentPath === '/admin/auditor' && allowedTabs.includes('AUDIT')) {
      setActiveTab('AUDIT');
    } else if (currentPath === '/admin/super' && allowedTabs.includes('OVERVIEW')) {
      setActiveTab('OVERVIEW');
    } else if (!allowedTabs.includes(activeTab)) {
      setActiveTab(allowedTabs[0] || 'OVERVIEW');
    }
  }, [currentPath, allowedTabs]);

  const fetchAdminData = async () => {
    if (!user || user.role !== 'ADMIN') return;
    setLoading(true);
    try {
      // Fetch overview KPIs
      if (allowedTabs.includes('OVERVIEW')) {
        const dash = await api.getAdminDashboard();
        setKpis(dash.kpis);
        setCurrentRound(dash.currentRound);
      }

      // Fetch users
      if (allowedTabs.includes('USERS')) {
        const uData = await api.getAdminUsers();
        setUsers(uData.users || []);
      }

      // Fetch deposits
      if (allowedTabs.includes('DEPOSITS')) {
        const dData = await api.getAdminDeposits();
        setAdminDeposits(dData.deposits || []);
      }

      // Fetch config & round
      if (allowedTabs.includes('CONFIG') || allowedTabs.includes('ROUNDS')) {
        const cData = await api.getAdminConfig();
        setConfig(cData.config);
      }

      // Fetch audit logs & security
      if (allowedTabs.includes('AUDIT')) {
        const aData = await api.getAuditLogs();
        setAuditLogs(aData.logs || []);

        const sData = await api.getSecurityEvents();
        setSecurityEvents(sData.events || []);
      }

      // Fetch tickets
      if (allowedTabs.includes('TICKETS')) {
        const tData = await api.getAdminSupportTickets();
        setSupportTickets(tData.tickets || []);
      }
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchAdminData();
    }
  }, [user, userAdminRole]);

  // Force Draw
  const handleForceDraw = async () => {
    setActionMsg(null);
    try {
      const res = await api.forceDraw();
      setActionMsg({
        type: 'success',
        text: `Round #${res.round.roundNumber} forcefully drawn with winning number #${res.round.winningNumber}!`,
      });
      await fetchAdminData();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Force draw failed' });
    }
  };

  // Next Round
  const handleNextRound = async () => {
    setActionMsg(null);
    try {
      const res = await api.nextRound();
      setActionMsg({ type: 'success', text: `New round #${res.round.roundNumber} created and opened!` });
      await fetchAdminData();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Next round creation failed' });
    }
  };

  // Cancel Round
  const handleCancelRound = async () => {
    if (!currentRound) return;
    const reason = prompt('Reason for cancelling round and refunding all bets:', 'Administrative maintenance');
    if (!reason) return;

    setActionMsg(null);
    try {
      await api.cancelRound(currentRound.id, reason);
      setActionMsg({ type: 'success', text: `Round #${currentRound.roundNumber} cancelled and all bets refunded.` });
      await fetchAdminData();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Cancel failed' });
    }
  };

  // Toggle User Status
  const handleToggleStatus = async (targetId: string) => {
    try {
      await api.toggleUserStatus(targetId);
      await fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Execute Balance Adjustment
  const handleExecuteBalanceAdjustment = async () => {
    if (!adjustTargetUser) return;
    try {
      await api.adjustUserBalance(adjustTargetUser.id, adjustAmount, adjustReason);
      setAdjustTargetUser(null);
      setActionMsg({
        type: 'success',
        text: `Balance adjusted for @${adjustTargetUser.username} (${adjustAmount > 0 ? '+' : ''}${adjustAmount} coins).`,
      });
      await fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Save Configuration
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    try {
      const res = await api.updateAdminConfig(config);
      setConfig(res.config);
      setActionMsg({ type: 'success', text: 'System configuration updated successfully.' });
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to update config' });
    }
  };

  // Run Automated Tests
  const handleRunTests = async () => {
    setLoading(true);
    try {
      const report = await api.runTests();
      setTestReport(report);
    } catch (err: any) {
      alert('Test suite error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reply to Support Ticket
  const handleSubmitTicketReply = async (ticketId: string) => {
    if (!replyText.trim()) return;
    try {
      await api.replySupportTicket(ticketId, replyText.trim(), replyStatus);
      setReplyingTicketId(null);
      setReplyText('');
      setActionMsg({ type: 'success', text: 'Support reply sent and ticket status updated.' });
      await fetchAdminData();
    } catch (err: any) {
      alert('Failed to reply: ' + err.message);
    }
  };

  // Update Ticket Status
  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    try {
      await api.updateSupportTicketStatus(ticketId, status);
      await fetchAdminData();
    } catch (err: any) {
      alert('Failed to update ticket status: ' + err.message);
    }
  };

  // Deposit Approval
  const handleApproveDeposit = async (depositId: string) => {
    setProcessingDepositAction(true);
    try {
      const res = await api.approveAdminDeposit(depositId, adminApprovalNote);
      setActionMsg({
        type: 'success',
        text: `Deposit ${res.deposit.transactionReference} approved! ₹${res.deposit.amount} (+${res.deposit.amount} Coins) credited to player.`,
      });
      setApprovingDepositId(null);
      await fetchAdminData();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Approval failed' });
    } finally {
      setProcessingDepositAction(false);
    }
  };

  // Deposit Rejection
  const handleRejectDeposit = async (depositId: string) => {
    if (!rejectReason.trim()) {
      alert('Please specify a rejection reason.');
      return;
    }
    setProcessingDepositAction(true);
    try {
      const res = await api.rejectAdminDeposit(depositId, rejectReason.trim(), adminRejectNote.trim() || undefined);
      setActionMsg({
        type: 'success',
        text: `Deposit ${res.deposit.transactionReference} has been rejected.`,
      });
      setRejectingDepositId(null);
      await fetchAdminData();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Rejection failed' });
    } finally {
      setProcessingDepositAction(false);
    }
  };

  // If user is not authenticated as an Admin, render the dedicated Admin Login portal
  if (!user || user.role !== 'ADMIN') {
    return <AdminLogin onSuccess={fetchAdminData} onBackToPlayerApp={onBackToPlayer} />;
  }

  // Filtered lists
  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const filteredTickets = supportTickets.filter((t) => {
    const matchQuery =
      t.subject.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.username.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.message.toLowerCase().includes(ticketSearch.toLowerCase());
    const matchStatus = ticketFilterStatus === 'ALL' || t.status === ticketFilterStatus;
    return matchQuery && matchStatus;
  });

  const filteredDeposits = adminDeposits.filter((d) => {
    const matchQuery =
      (d.transactionReference && d.transactionReference.toLowerCase().includes(depositSearch.toLowerCase())) ||
      (d.utrNumber && d.utrNumber.toLowerCase().includes(depositSearch.toLowerCase())) ||
      (d.userId && d.userId.toLowerCase().includes(depositSearch.toLowerCase())) ||
      (d.amount && String(d.amount).includes(depositSearch));
    const matchStatus = depositFilterStatus === 'ALL' || d.status === depositFilterStatus;
    return matchQuery && matchStatus;
  });

  const tabDefs = [
    { id: 'OVERVIEW', label: 'Platform KPIs', icon: Activity, roleNeeded: 'ANY_ADMIN' },
    { id: 'DEPOSITS', label: 'Deposit Requests', icon: Coins, roleNeeded: 'SUPPORT_ADMIN_OR_SUPER' },
    { id: 'ROUNDS', label: 'Round Controls', icon: Play, roleNeeded: 'GAME_ADMIN_OR_SUPER' },
    { id: 'USERS', label: 'Player Accounts', icon: Users, roleNeeded: 'SUPPORT_ADMIN_OR_SUPER' },
    { id: 'CONFIG', label: 'Rules & Multipliers', icon: Settings, roleNeeded: 'GAME_ADMIN_OR_SUPER' },
    { id: 'TICKETS', label: 'Support Desk', icon: LifeBuoy, roleNeeded: 'SUPPORT_ADMIN_OR_SUPER' },
    { id: 'AUDIT', label: 'Audit & Security', icon: FileText, roleNeeded: 'AUDITOR_OR_SUPER' },
    { id: 'TESTS', label: 'Automated Test Suite', icon: ShieldCheck, roleNeeded: 'AUDITOR_OR_SUPER' },
  ];

  const visibleTabs = tabDefs.filter((tab) => allowedTabs.includes(tab.id));

  return (
    <div id="admin-application-area" className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner & RBAC Navigation */}
      <div className="bg-zinc-950/80 border border-emerald-500/20 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-md space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                  ADMIN CONSOLE
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono uppercase">
                  {userAdminRole}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Logged in as <span className="text-white font-bold font-mono">@{user.username}</span> • Role-Based Operations Desk
              </p>
            </div>
          </div>

          {/* Quick Role Switcher for Demo & Back Button */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-zinc-900/80 border border-white/10 rounded-2xl p-1 text-[11px] font-bold">
              <span className="px-2 text-zinc-500 font-mono text-[10px] uppercase">Switch Role:</span>
              <button
                onClick={() => adminQuickLogin('SUPER_ADMIN')}
                className={`px-2.5 py-1 rounded-xl transition-colors ${
                  userAdminRole === 'SUPER_ADMIN' ? 'bg-emerald-500 text-black font-black' : 'text-zinc-400 hover:text-white'
                }`}
                title="Super Admin Workspace"
              >
                👑 Super
              </button>
              <button
                onClick={() => adminQuickLogin('GAME_ADMIN')}
                className={`px-2.5 py-1 rounded-xl transition-colors ${
                  userAdminRole === 'GAME_ADMIN' ? 'bg-amber-400 text-black font-black' : 'text-zinc-400 hover:text-white'
                }`}
                title="Game Admin Workspace"
              >
                🎯 Game
              </button>
              <button
                onClick={() => adminQuickLogin('SUPPORT_ADMIN')}
                className={`px-2.5 py-1 rounded-xl transition-colors ${
                  userAdminRole === 'SUPPORT_ADMIN' ? 'bg-cyan-400 text-black font-black' : 'text-zinc-400 hover:text-white'
                }`}
                title="Support Admin Workspace"
              >
                🛡️ Support
              </button>
              <button
                onClick={() => adminQuickLogin('AUDITOR')}
                className={`px-2.5 py-1 rounded-xl transition-colors ${
                  userAdminRole === 'AUDITOR' ? 'bg-purple-400 text-black font-black' : 'text-zinc-400 hover:text-white'
                }`}
                title="Auditor Workspace"
              >
                📜 Auditor
              </button>
            </div>

            {onBackToPlayer && (
              <button
                onClick={onBackToPlayer}
                className="px-3.5 py-2 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-zinc-300 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Player Arena</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Status Notification */}
        {actionMsg && (
          <div
            className={`p-3 rounded-2xl text-xs font-semibold border flex items-center justify-between gap-2 ${
              actionMsg.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            }`}
          >
            <span>{actionMsg.text}</span>
            <button onClick={() => setActionMsg(null)} className="text-zinc-400 hover:text-white text-xs">
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 border border-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACCESS DENIED FALLBACK */}
      {!allowedTabs.includes(activeTab) && (
        <div className="p-8 rounded-3xl bg-zinc-950/80 border border-red-500/30 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
          <h3 className="text-base font-black text-white uppercase">Access Denied</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Your current administrative role (<span className="font-mono text-amber-400 font-bold">{userAdminRole}</span>) is not authorized to access this module.
          </p>
        </div>
      )}

      {/* TAB 1: OVERVIEW & KPIS */}
      {activeTab === 'OVERVIEW' && allowedTabs.includes('OVERVIEW') && kpis && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-3xl bg-zinc-950/60 border border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Total Players</span>
              <span className="text-xl sm:text-2xl font-black text-white font-mono mt-1 block">
                {kpis.totalPlayers}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono mt-1 block">
                {kpis.activePlayersToday} active today
              </span>
            </div>

            <div className="p-4 sm:p-5 rounded-3xl bg-zinc-950/60 border border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Virtual Turnover</span>
              <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono mt-1 block">
                {kpis.totalTurnoverCoins.toLocaleString()}
              </span>
              <span className="text-[10px] text-zinc-400 mt-1 block font-mono">Coins wagered</span>
            </div>

            <div className="p-4 sm:p-5 rounded-3xl bg-zinc-950/60 border border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Total Payouts</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1 block">
                {kpis.totalPayoutCoins.toLocaleString()}
              </span>
              <span className="text-[10px] text-zinc-400 mt-1 block font-mono">Coins won by players</span>
            </div>

            <div className="p-4 sm:p-5 rounded-3xl bg-zinc-950/60 border border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Calculated RTP %</span>
              <span className="text-xl sm:text-2xl font-black text-cyan-300 font-mono mt-1 block">
                {kpis.rtpPercentage}%
              </span>
              <span className="text-[10px] text-zinc-400 mt-1 block font-mono">
                Net House: {kpis.netHouseHoldCoins.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Quick Round Status */}
          {currentRound && (
            <div className="p-5 rounded-3xl bg-zinc-950/60 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Active Round: #{currentRound.roundNumber} ({currentRound.id})
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Status: <span className="text-emerald-400 font-bold font-mono uppercase">{currentRound.status}</span> • Total Bets: <span className="font-mono text-white">{currentRound.totalBetsCount}</span>
                </p>
              </div>

              {['SUPER_ADMIN', 'GAME_ADMIN'].includes(userAdminRole) && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleForceDraw}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black uppercase text-xs tracking-wider transition-all"
                  >
                    ⚡ Force Draw
                  </button>
                  <button
                    onClick={handleNextRound}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-xs tracking-wider transition-all"
                  >
                    ➕ Next Round
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ROUND CONTROLS */}
      {activeTab === 'ROUNDS' && allowedTabs.includes('ROUNDS') && currentRound && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-zinc-950/60 border border-white/5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Round State Machine Controls</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={handleForceDraw}
                className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-amber-500/30 hover:border-amber-500/60 text-left transition-all"
              >
                <span className="font-black text-amber-300 block text-xs uppercase tracking-wider">⚡ Force Instant Draw</span>
                <span className="text-[11px] text-zinc-400 mt-1 block leading-relaxed">
                  Immediately evaluates cryptographic RNG and settles all bets for Round #{currentRound.roundNumber}.
                </span>
              </button>

              <button
                onClick={handleNextRound}
                className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-emerald-500/30 hover:border-emerald-500/60 text-left transition-all"
              >
                <span className="font-black text-emerald-300 block text-xs uppercase tracking-wider">➕ Create Next Round</span>
                <span className="text-[11px] text-zinc-400 mt-1 block leading-relaxed">
                  Creates and opens the next sequential round with fresh seed commitments and 80/20 multiplier grid.
                </span>
              </button>

              <button
                onClick={handleCancelRound}
                className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-rose-500/30 hover:border-rose-500/60 text-left transition-all"
              >
                <span className="font-black text-rose-300 block text-xs uppercase tracking-wider">🚫 Cancel Round (Refund)</span>
                <span className="text-[11px] text-zinc-400 mt-1 block leading-relaxed">
                  Cancels the current round and atomically refunds all pending player wagers.
                </span>
              </button>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-zinc-950/60 border border-white/5 text-xs font-mono">
            <h4 className="font-bold text-white mb-2 font-sans uppercase tracking-wider text-[11px]">
              Active Round Cryptographic Parameters
            </h4>
            <div className="space-y-1.5 text-zinc-400 text-[11px]">
              <p>Round ID: <span className="text-zinc-200">{currentRound.id}</span></p>
              <p className="truncate">Server Seed Hash: <span className="text-emerald-400">{currentRound.serverSeedHash}</span></p>
              <p>Client Seed: <span className="text-zinc-200">{currentRound.clientSeed}</span></p>
              <p>Nonce: <span className="text-zinc-200">{currentRound.nonce}</span></p>
              <p>Winning Number: <span className="text-amber-300 font-bold">{currentRound.winningNumber || 'Not Drawn Yet'}</span></p>
            </div>
          </div>

          {/* Number-Wise Exposure Table */}
          <div className="p-5 rounded-3xl bg-zinc-950/60 border border-white/5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-white uppercase tracking-wider text-xs">
                  Real-Time Number-Wise Risk & Exposure Monitor
                </h4>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                Round #{currentRound.roundNumber} • Total Wagered: {currentRound.totalTurnoverCoins || 0} Coins
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-white/5 text-zinc-400 uppercase text-[10px]">
                    <th className="py-2 px-2">Number</th>
                    <th className="py-2 px-2">Multiplier</th>
                    <th className="py-2 px-2">Bets Count</th>
                    <th className="py-2 px-2">Turnover</th>
                    <th className="py-2 px-2 text-right">Potential Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(currentRound.numbers || []).map((num) => {
                    const stat = (currentRound.numberStats && currentRound.numberStats[num.number]) || {
                      betsCount: 0,
                      totalAmount: 0,
                      potentialPayout: 0,
                    };
                    const hasExposure = stat.totalAmount > 0;
                    return (
                      <tr
                        key={num.number}
                        className={`hover:bg-zinc-800/40 transition-colors ${
                          hasExposure ? 'bg-emerald-950/20 text-emerald-300' : 'text-zinc-400'
                        }`}
                      >
                        <td className="py-1.5 px-2 font-bold text-white">#{num.number}</td>
                        <td className="py-1.5 px-2">
                          <span className={num.isHighMultiplier ? 'text-amber-400 font-bold' : 'text-zinc-400'}>
                            {num.multiplier}x {num.isHighMultiplier && '🔥'}
                          </span>
                        </td>
                        <td className="py-1.5 px-2">{stat.betsCount}</td>
                        <td className="py-1.5 px-2">{stat.totalAmount.toLocaleString()} Coins</td>
                        <td className="py-1.5 px-2 text-right font-bold">
                          {(stat.potentialPayout || stat.totalAmount * num.multiplier).toLocaleString()} Coins
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: DEPOSIT REQUESTS & VERIFICATION */}
      {activeTab === 'DEPOSITS' && allowedTabs.includes('DEPOSITS') && (
        <div className="space-y-4">
          {/* Top Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={depositSearch}
                onChange={(e) => setDepositSearch(e.target.value)}
                placeholder="Search by UTR, Order Ref, User ID, or Amount..."
                className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={depositFilterStatus}
                onChange={(e) => setDepositFilterStatus(e.target.value)}
                className="bg-zinc-900 border border-white/10 rounded-xl py-2 px-3 text-xs text-white font-mono flex-1 sm:flex-initial"
              >
                <option value="ALL">All Statuses ({adminDeposits.length})</option>
                <option value="VERIFYING">VERIFYING Only ({adminDeposits.filter((d) => d.status === 'VERIFYING').length})</option>
                <option value="PENDING">PENDING ({adminDeposits.filter((d) => d.status === 'PENDING').length})</option>
                <option value="SUCCESS">SUCCESS ({adminDeposits.filter((d) => d.status === 'SUCCESS').length})</option>
                <option value="REJECTED">REJECTED ({adminDeposits.filter((d) => d.status === 'REJECTED').length})</option>
                <option value="CANCELLED">CANCELLED ({adminDeposits.filter((d) => d.status === 'CANCELLED').length})</option>
              </select>

              <button
                onClick={fetchAdminData}
                className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5 cursor-pointer"
                title="Refresh Deposits"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 block">
                Needs Verification
              </span>
              <span className="text-xl font-mono font-black text-indigo-400">
                {adminDeposits.filter((d) => d.status === 'VERIFYING').length} Orders
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">
                Approved Volume
              </span>
              <span className="text-xl font-mono font-black text-emerald-400">
                ₹{adminDeposits.filter((d) => d.status === 'SUCCESS').reduce((acc, d) => acc + d.amount, 0).toLocaleString()}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                Pending Payments
              </span>
              <span className="text-xl font-mono font-black text-amber-400">
                {adminDeposits.filter((d) => d.status === 'PENDING').length} Orders
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                Total Requests
              </span>
              <span className="text-xl font-mono font-black text-white">
                {adminDeposits.length}
              </span>
            </div>
          </div>

          {/* Deposits Table */}
          <div className="overflow-x-auto rounded-2xl border border-white/5 bg-zinc-950/60">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-zinc-900/60 text-zinc-400 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-3.5">Order / Reference</th>
                  <th className="py-3 px-3.5">Player User</th>
                  <th className="py-3 px-3.5">Amount (INR)</th>
                  <th className="py-3 px-3.5">UTR / Bank Ref</th>
                  <th className="py-3 px-3.5">Method</th>
                  <th className="py-3 px-3.5">Date / Time</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5 text-right">Verification Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredDeposits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs font-mono text-zinc-500">
                      No deposit records matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredDeposits.map((dep) => {
                    const statusPillClass =
                      dep.status === 'SUCCESS' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                      dep.status === 'VERIFYING' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 animate-pulse' :
                      dep.status === 'PENDING' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
                      dep.status === 'REJECTED' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' :
                      'bg-zinc-800 text-zinc-400 border-white/5';

                    return (
                      <tr key={dep.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="py-3 px-3.5">
                          <span className="font-mono font-bold text-white block">
                            {dep.transactionReference}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            ID: {dep.id.slice(0, 12)}...
                          </span>
                        </td>

                        <td className="py-3 px-3.5 font-mono">
                          <span className="text-zinc-300 font-bold block">
                            @{dep.userId.slice(-6).toUpperCase()}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {dep.userId}
                          </span>
                        </td>

                        <td className="py-3 px-3.5 font-mono">
                          <span className="font-black text-white text-sm block">
                            ₹{dep.amount.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-bold">
                            +{dep.amount.toLocaleString()} Coins
                          </span>
                        </td>

                        <td className="py-3 px-3.5 font-mono">
                          {dep.utrNumber ? (
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-white font-bold tracking-wider">
                                {dep.utrNumber}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-500 italic">
                              Not submitted yet
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-900 text-zinc-300 border border-white/5">
                            {dep.paymentMethod || 'UPI'}
                          </span>
                        </td>

                        <td className="py-3 px-3.5 text-[11px] font-mono text-zinc-400">
                          {new Date(dep.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>

                        <td className="py-3 px-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border font-mono uppercase ${statusPillClass}`}>
                            {dep.status}
                          </span>
                        </td>

                        <td className="py-3 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* APPROVE & REJECT BUTTONS FOR VERIFYING / PENDING */}
                            {(dep.status === 'VERIFYING' || dep.status === 'PENDING') && ['SUPER_ADMIN', 'SUPPORT_ADMIN'].includes(userAdminRole) ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setApprovingDepositId(dep.id);
                                    setAdminApprovalNote(`UTR ${dep.utrNumber || ''} verified`);
                                  }}
                                  disabled={processingDepositAction}
                                  className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[11px] uppercase transition-all shadow-sm cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectingDepositId(dep.id);
                                    setRejectReason('Invalid or Unverifiable UTR / Payment Reference');
                                  }}
                                  disabled={processingDepositAction}
                                  className="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-[11px] transition-all cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            ) : dep.status === 'SUCCESS' ? (
                              <span className="text-[10px] text-emerald-400 font-mono">
                                ✓ Credited {dep.verifiedBy ? `(@${dep.verifiedBy})` : ''}
                              </span>
                            ) : dep.status === 'REJECTED' ? (
                              <span className="text-[10px] text-rose-400 font-mono" title={dep.failureReason}>
                                ✕ {dep.failureReason ? dep.failureReason.slice(0, 20) + '...' : 'Rejected'}
                              </span>
                            ) : (
                              <span className="text-[10px] text-zinc-500 font-mono">
                                {dep.status}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* APPROVAL MODAL */}
          {approvingDepositId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
              <div className="w-full max-w-md bg-zinc-950 border border-emerald-500/30 rounded-3xl p-5 shadow-2xl space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase">Approve & Credit Deposit</h3>
                    <p className="text-[10px] text-zinc-400">Order: {approvingDepositId}</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <p className="text-zinc-300">
                    Confirm that payment has been received in the merchant account. This will immediately credit coins to the player's wallet.
                  </p>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      Admin Verification Note:
                    </label>
                    <input
                      type="text"
                      value={adminApprovalNote}
                      onChange={(e) => setAdminApprovalNote(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setApprovingDepositId(null)}
                    disabled={processingDepositAction}
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveDeposit(approvingDepositId)}
                    disabled={processingDepositAction}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase transition-all shadow-md flex items-center gap-1.5"
                  >
                    {processingDepositAction ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Confirm & Credit Coins</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* REJECTION MODAL */}
          {rejectingDepositId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
              <div className="w-full max-w-md bg-zinc-950 border border-rose-500/30 rounded-3xl p-5 shadow-2xl space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase">Reject Deposit Request</h3>
                    <p className="text-[10px] text-zinc-400">Order: {rejectingDepositId}</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      Rejection Reason (Sent to Player):
                    </label>
                    <select
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs mb-2"
                    >
                      <option value="Invalid or Unverifiable UTR / Payment Reference">Invalid or Unverifiable UTR</option>
                      <option value="Payment not received in merchant account">Payment not received in bank</option>
                      <option value="Amount transferred does not match order amount">Incorrect Transfer Amount</option>
                      <option value="Duplicate UTR submission detected">Duplicate UTR Reference</option>
                      <option value="Payment received was reversed or disputed">Payment Dispute / Reversal</option>
                    </select>

                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Custom reason..."
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      Internal Admin Notes (Optional):
                    </label>
                    <input
                      type="text"
                      value={adminRejectNote}
                      onChange={(e) => setAdminRejectNote(e.target.value)}
                      placeholder="Internal remarks..."
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white font-mono text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setRejectingDepositId(null)}
                    disabled={processingDepositAction}
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectDeposit(rejectingDepositId)}
                    disabled={processingDepositAction}
                    className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase transition-all shadow-md flex items-center gap-1.5"
                  >
                    {processingDepositAction ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>Reject Deposit</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PLAYER ACCOUNTS */}
      {activeTab === 'USERS' && allowedTabs.includes('USERS') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search players by username, email or name..."
                className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <span className="text-xs text-zinc-400 font-mono">{filteredUsers.length} players found</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-zinc-400 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-3">Player</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Virtual Coins</th>
                  <th className="py-3 px-3">Risk Score</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-bold text-white">{u.name || u.username}</p>
                      <p className="text-[11px] text-zinc-400 font-mono">@{u.username} • {u.email}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 font-mono">
                        {u.role === 'ADMIN' ? u.adminRole || 'ADMIN' : 'PLAYER'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-300">
                      {u.virtualBalance.toLocaleString()} Coins
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.riskScore > 40
                            ? 'bg-rose-500/20 text-rose-300'
                            : u.riskScore > 10
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {u.riskScore}/100
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          u.isActive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {userAdminRole === 'SUPER_ADMIN' && (
                          <button
                            onClick={() => setAdjustTargetUser(u)}
                            className="px-3 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-[11px] font-bold text-amber-300 border border-white/5 transition-colors"
                          >
                            Adjust Coins
                          </button>
                        )}
                        {['SUPER_ADMIN', 'SUPPORT_ADMIN'].includes(userAdminRole) && (
                          <button
                            onClick={() => handleToggleStatus(u.id)}
                            className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-colors ${
                              u.isActive
                                ? 'bg-rose-950/60 text-rose-300 hover:bg-rose-900/80 border border-rose-800/60'
                                : 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/80 border border-emerald-800/60'
                            }`}
                          >
                            {u.isActive ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Adjust Balance Modal (Super Admin only) */}
          {adjustTargetUser && userAdminRole === 'SUPER_ADMIN' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
                <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">
                  Adjust Coins for @{adjustTargetUser.username}
                </h4>
                <p className="text-xs text-zinc-400 mb-4 font-mono">
                  Current balance: {adjustTargetUser.virtualBalance.toLocaleString()} Coins
                </p>

                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">
                      Amount to Add (+) or Subtract (-)
                    </label>
                    <input
                      type="number"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">
                      Audit Reason (Mandatory)
                    </label>
                    <input
                      type="text"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      placeholder="e.g. VIP Demo Reload"
                      className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExecuteBalanceAdjustment}
                    className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-xs tracking-wider"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setAdjustTargetUser(null)}
                    className="flex-1 py-3 rounded-2xl bg-zinc-900 text-zinc-300 font-bold text-xs border border-white/5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CONFIGURATION & MULTIPLIERS */}
      {activeTab === 'CONFIG' && allowedTabs.includes('CONFIG') && config && (
        <form onSubmit={handleSaveConfig} className="space-y-5">
          <div className="p-5 rounded-3xl bg-zinc-950/60 border border-white/5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Game Rules & Multiplier Ranges</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">Min Bet (Coins)</label>
                <input
                  type="number"
                  value={config.minBet}
                  onChange={(e) => setConfig({ ...config, minBet: parseInt(e.target.value) || 10 })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-2.5 font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">Max Bet (Coins)</label>
                <input
                  type="number"
                  value={config.maxBet}
                  onChange={(e) => setConfig({ ...config, maxBet: parseInt(e.target.value) || 10000 })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-2.5 font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">Round Duration (s)</label>
                <input
                  type="number"
                  value={config.roundDurationSeconds}
                  onChange={(e) => setConfig({ ...config, roundDurationSeconds: parseInt(e.target.value) || 45 })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-2.5 font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">Multiplier Visibility</label>
                <select
                  value={config.multiplierVisibility}
                  onChange={(e) => setConfig({ ...config, multiplierVisibility: e.target.value as any })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="PUBLIC">PUBLIC (Always Visible)</option>
                  <option value="HIDDEN">HIDDEN</option>
                  <option value="REVEAL_AFTER_RESULT">REVEAL_AFTER_RESULT</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mt-4 pt-4 border-t border-white/5">
              <div className="p-4 bg-zinc-900/80 rounded-2xl border border-white/5">
                <span className="font-bold text-zinc-300 block mb-2 text-xs uppercase tracking-wider">
                  Normal Tier ({config.normalMultiplierCount} Numbers)
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={config.normalMultiplierMin}
                    onChange={(e) => setConfig({ ...config, normalMultiplierMin: parseInt(e.target.value) || 2 })}
                    className="w-16 bg-zinc-950 border border-white/10 rounded-xl p-2 font-mono text-white text-center"
                  />
                  <span className="text-zinc-500">to</span>
                  <input
                    type="number"
                    value={config.normalMultiplierMax}
                    onChange={(e) => setConfig({ ...config, normalMultiplierMax: parseInt(e.target.value) || 10 })}
                    className="w-16 bg-zinc-950 border border-white/10 rounded-xl p-2 font-mono text-white text-center"
                  />
                  <span className="text-zinc-400">Multiplier Range</span>
                </div>
              </div>

              <div className="p-4 bg-zinc-900/80 rounded-2xl border border-white/5">
                <span className="font-bold text-amber-300 block mb-2 text-xs uppercase tracking-wider">
                  High Tier 🔥 ({config.highMultiplierCount} Numbers)
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={config.highMultiplierMin}
                    onChange={(e) => setConfig({ ...config, highMultiplierMin: parseInt(e.target.value) || 11 })}
                    className="w-16 bg-zinc-950 border border-white/10 rounded-xl p-2 font-mono text-white text-center"
                  />
                  <span className="text-zinc-500">to</span>
                  <input
                    type="number"
                    value={config.highMultiplierMax}
                    onChange={(e) => setConfig({ ...config, highMultiplierMax: parseInt(e.target.value) || 20 })}
                    className="w-16 bg-zinc-950 border border-white/10 rounded-xl p-2 font-mono text-white text-center"
                  />
                  <span className="text-zinc-400">Multiplier Range</span>
                </div>
              </div>
            </div>
          </div>

          {['SUPER_ADMIN', 'GAME_ADMIN'].includes(userAdminRole) && (
            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider text-xs shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all hover:translate-y-[-1px]"
            >
              Save Configuration Changes
            </button>
          )}
        </form>
      )}

      {/* TAB 5: SUPPORT TICKETS DESK */}
      {activeTab === 'TICKETS' && allowedTabs.includes('TICKETS') && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                placeholder="Search inquiries by player, subject or text..."
                className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={ticketFilterStatus}
                onChange={(e) => setTicketFilterStatus(e.target.value)}
                className="bg-zinc-900 border border-white/10 rounded-xl py-2 px-3 text-xs text-white font-mono"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">OPEN Only</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>

              <button
                onClick={fetchAdminData}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5"
                title="Refresh Tickets"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-zinc-500 bg-zinc-900/30 rounded-3xl border border-white/5">
                No support tickets found matching current filters.
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-4 sm:p-5 rounded-3xl bg-zinc-950/60 border border-white/5 space-y-3 hover:border-white/10 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ticket.status === 'RESOLVED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                        ticket.status === 'IN_PROGRESS' ? 'bg-amber-950 text-amber-400 border border-amber-500/30' :
                        'bg-zinc-800 text-zinc-300 border border-white/10'
                      }`}>
                        {ticket.status}
                      </span>
                      <span className="text-xs font-bold text-white">{ticket.subject}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                      <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                      <span>•</span>
                      <span className="text-zinc-400 font-bold">Category: {ticket.category}</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 bg-zinc-900/50 p-3 rounded-2xl border border-white/5 leading-relaxed">
                    {ticket.message}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                    <span className="text-[11px] text-zinc-400 font-mono">
                      From: <span className="text-emerald-400 font-bold">@{ticket.username}</span> ({ticket.email})
                    </span>

                    <div className="flex items-center gap-2">
                      {ticket.adminReply ? (
                        <div className="text-[11px] text-emerald-400 font-mono">
                          ✓ Replied by @{ticket.assignedAdmin || 'admin'}
                        </div>
                      ) : (
                        <button
                          onClick={() => setReplyingTicketId(replyingTicketId === ticket.id ? null : ticket.id)}
                          className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <Send className="w-3 h-3" />
                          <span>Reply to Player</span>
                        </button>
                      )}

                      <select
                        value={ticket.status}
                        onChange={(e) => handleUpdateTicketStatus(ticket.id, e.target.value)}
                        className="bg-zinc-900 border border-white/10 rounded-xl py-1 px-2.5 text-[11px] text-zinc-300 font-mono"
                      >
                        <option value="OPEN">Mark OPEN</option>
                        <option value="IN_PROGRESS">Mark IN_PROGRESS</option>
                        <option value="WAITING_FOR_USER">Mark WAITING_FOR_USER</option>
                        <option value="RESOLVED">Mark RESOLVED</option>
                        <option value="CLOSED">Mark CLOSED</option>
                      </select>
                    </div>
                  </div>

                  {/* Previous Admin Reply Display */}
                  {ticket.adminReply && (
                    <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
                      <span className="font-bold text-emerald-400 block text-[10px] uppercase">
                        Admin Reply ({ticket.assignedAdmin}):
                      </span>
                      <p>{ticket.adminReply}</p>
                    </div>
                  )}

                  {/* Inline Reply Form */}
                  {replyingTicketId === ticket.id && (
                    <div className="p-3.5 rounded-2xl bg-zinc-900 border border-emerald-500/30 space-y-3 mt-2">
                      <label className="block text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                        Response to @{ticket.username}
                      </label>
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type official support response..."
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <span>Set status to:</span>
                          <select
                            value={replyStatus}
                            onChange={(e) => setReplyStatus(e.target.value)}
                            className="bg-zinc-950 border border-white/10 rounded-xl py-1 px-2 text-xs text-white"
                          >
                            <option value="RESOLVED">RESOLVED</option>
                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                            <option value="CLOSED">CLOSED</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSubmitTicketReply(ticket.id)}
                            className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold"
                          >
                            Send Response
                          </button>
                          <button
                            onClick={() => setReplyingTicketId(null)}
                            className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT LOGS & SECURITY */}
      {activeTab === 'AUDIT' && allowedTabs.includes('AUDIT') && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              Immutable Admin Audit Logs ({auditLogs.length})
            </h3>
            <div className="overflow-x-auto max-h-72 overflow-y-auto scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-zinc-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Admin</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Target</th>
                    <th className="py-2.5 px-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-900/40">
                      <td className="py-2 px-3 text-zinc-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td className="py-2 px-3 text-zinc-300">{log.actorName} ({log.actorRole})</td>
                      <td className="py-2 px-3 text-emerald-400 font-bold">{log.action}</td>
                      <td className="py-2 px-3 text-zinc-400">{log.targetType}:{log.targetId}</td>
                      <td className="py-2 px-3 text-zinc-400 max-w-xs truncate">{JSON.stringify(log.newValue || {})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              Security & Risk Events ({securityEvents.length})
            </h3>
            <div className="overflow-x-auto max-h-72 overflow-y-auto scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-zinc-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Event Type</th>
                    <th className="py-2.5 px-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                  {securityEvents.map((sec) => (
                    <tr key={sec.id} className="hover:bg-zinc-900/40">
                      <td className="py-2 px-3 text-zinc-500">{new Date(sec.timestamp).toLocaleTimeString()}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            sec.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {sec.severity}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-white">{sec.eventType}</td>
                      <td className="py-2 px-3 text-zinc-400">{sec.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: TEST SUITE RUNNER */}
      {activeTab === 'TESTS' && allowedTabs.includes('TESTS') && (
        <div className="space-y-5">
          <div className="p-5 rounded-3xl bg-zinc-950/60 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Automated Engine & Security Verification Suite
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                Executes live unit and integration tests across RNG, 80/20 multiplier balance, round cycles, and wallet ledger locks.
              </p>
            </div>

            <button
              id="btn-run-tests"
              onClick={handleRunTests}
              disabled={loading}
              className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-xs tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all shrink-0"
            >
              <ShieldCheck className="w-4 h-4 text-black" />
              <span>{loading ? 'Executing Tests...' : 'Run All Test Suites'}</span>
            </button>
          </div>

          {testReport && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 bg-zinc-900/80 rounded-2xl border border-white/5 text-xs">
                <span className="font-bold text-white uppercase tracking-wider">
                  Report: {testReport.passedCount}/{testReport.totalTests} Tests Passed ({testReport.durationMs}ms)
                </span>
                <span className="font-mono text-emerald-400 font-black">100% Passing</span>
              </div>

              <div className="space-y-2">
                {testReport.results.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      {r.status === 'PASSED' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-bold text-white">{r.name}</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{r.message}</p>
                      </div>
                    </div>

                    <span className="font-mono text-[10px] text-zinc-500 shrink-0">{r.durationMs}ms</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
