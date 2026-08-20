import crypto from 'crypto';
import { Database } from '../db/database.js';
import { User, AdminRole, AuditLog, SecurityEvent } from '../../src/types/index.js';

export class AuditService {
  private static db = Database.getInstance();

  public static logAdminAction(params: {
    admin: User;
    action: string;
    targetType: string;
    targetId: string;
    previousValue?: any;
    newValue?: any;
    ip: string;
    userAgent: string;
  }): AuditLog {
    const { admin, action, targetType, targetId, previousValue, newValue, ip, userAgent } = params;

    const log: AuditLog = {
      id: `aud_${crypto.randomBytes(8).toString('hex')}`,
      actorId: admin.id,
      actorName: admin.username,
      actorRole: admin.adminRole || 'ADMIN',
      action,
      targetType,
      targetId,
      previousValue,
      newValue,
      ip: ip || '127.0.0.1',
      userAgent: userAgent || 'Unknown',
      timestamp: Date.now(),
    };

    this.db.addAuditLog(log);
    return log;
  }

  public static checkAdminPermission(
    user: User,
    requiredRole: AdminRole | AdminRole[]
  ): boolean {
    if (user.role !== 'ADMIN') return false;
    const currentRole = user.adminRole || 'AUDITOR';

    // SUPER_ADMIN has full permissions
    if (currentRole === 'SUPER_ADMIN') return true;

    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return allowed.includes(currentRole);
  }

  public static recordSecurityEvent(params: {
    userId?: string;
    username?: string;
    eventType: 'FAILED_LOGIN' | 'RAPID_BETS' | 'IDEMPOTENCY_RETRY' | 'LIMIT_EXCEEDED' | 'UNAUTHORIZED_ACCESS';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    details: string;
    ip: string;
  }): SecurityEvent {
    const { userId, username, eventType, severity, details, ip } = params;

    const event: SecurityEvent = {
      id: `sec_${crypto.randomBytes(8).toString('hex')}`,
      userId,
      username,
      eventType,
      severity,
      details,
      ip,
      timestamp: Date.now(),
    };

    this.db.addSecurityEvent(event);

    // If userId provided, increase risk score slightly
    if (userId) {
      const user = this.db.getUserById(userId);
      if (user) {
        const delta = severity === 'CRITICAL' ? 30 : severity === 'HIGH' ? 15 : severity === 'MEDIUM' ? 5 : 2;
        user.riskScore = Math.min(100, (user.riskScore || 0) + delta);
        this.db.saveUser(user);
      }
    }

    return event;
  }
}
