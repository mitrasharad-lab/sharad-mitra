/**
 * Advanced Features Service
 * Analytics, Exports, Backups, Remote Control, and more
 */

import {
  AnalyticsData,
  RevenueReport,
  BackupRecord,
  RemoteControlAction,
  RemoteCommand,
  CustomerProfile,
  Game,
  GameInstallation,
  Tournament,
  TournamentStatus,
  TournamentFormat,
  TournamentMatch,
  Leaderboard,
} from '../gaming-types';
import { db } from './databaseService';

// ========== ANALYTICS SERVICE ==========

export class AnalyticsService {
  /**
   * Get comprehensive analytics for a date range
   */
  async getAnalytics(startDate: string, endDate: string): Promise<AnalyticsData[]> {
    const sessions = await db.getAllSessions();
    const payments = await db.getAllPayments();

    const analyticsMap: Record<string, AnalyticsData> = {};

    // Process each day in the range
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];

      const daySessions = sessions.filter(s => s.startTime.startsWith(dateStr));
      const dayPayments = payments.filter(p => p.timestamp.startsWith(dateStr));

      analyticsMap[dateStr] = {
        date: dateStr,
        revenue: dayPayments.reduce((sum, p) => sum + p.amount, 0),
        sessions: daySessions.length,
        uniqueCustomers: new Set(daySessions.map(s => s.userId)).size,
        averageSessionDuration: daySessions.length > 0
          ? daySessions.reduce((sum, s) => sum + s.plannedDuration, 0) / daySessions.length
          : 0,
        peakHour: this.calculatePeakHour(daySessions),
        mostPlayedGame: 'Counter-Strike', // TODO: Implement game tracking
        occupancyRate: this.calculateOccupancyRate(daySessions),
      };
    }

    return Object.values(analyticsMap);
  }

  /**
   * Generate revenue report
   */
  async generateRevenueReport(
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    startDate: string,
    endDate: string
  ): Promise<RevenueReport> {
    const payments = await db.getAllPayments();
    const foodOrders = await db.getAllFoodOrders();

    const filteredPayments = payments.filter(p =>
      p.timestamp >= startDate && p.timestamp <= endDate
    );

    const filteredFoodOrders = foodOrders.filter(o =>
      o.orderTime >= startDate && o.orderTime <= endDate && o.status === 'delivered'
    );

    const gamingRevenue = filteredPayments
      .filter(p => p.description?.includes('Gaming') || p.sessionId)
      .reduce((sum, p) => sum + p.amount, 0);

    const foodRevenue = filteredFoodOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // Group by period
    const breakdown = this.groupByPeriod(filteredPayments, period);

    return {
      period,
      startDate,
      endDate,
      totalRevenue: gamingRevenue + foodRevenue,
      gamingRevenue,
      foodRevenue,
      membershipRevenue: 0, // TODO: Implement membership fees
      breakdown,
    };
  }

  private groupByPeriod(payments: any[], period: string) {
    const grouped: Record<string, number> = {};

    payments.forEach(payment => {
      let key = payment.timestamp.split('T')[0]; // Daily by default

      if (period === 'weekly') {
        const date = new Date(payment.timestamp);
        const week = this.getWeekNumber(date);
        key = `${date.getFullYear()}-W${week}`;
      } else if (period === 'monthly') {
        key = payment.timestamp.substring(0, 7); // YYYY-MM
      } else if (period === 'yearly') {
        key = payment.timestamp.substring(0, 4); // YYYY
      }

      grouped[key] = (grouped[key] || 0) + payment.amount;
    });

    return Object.entries(grouped).map(([date, revenue]) => ({ date, revenue }));
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  private calculatePeakHour(sessions: any[]): string {
    const hourCounts: Record<number, number> = {};

    sessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    let peakHour = 12;
    let maxCount = 0;

    Object.entries(hourCounts).forEach(([hour, count]) => {
      if (count > maxCount) {
        maxCount = count;
        peakHour = parseInt(hour);
      }
    });

    return `${peakHour}:00`;
  }

  private calculateOccupancyRate(sessions: any[]): number {
    if (sessions.length === 0) return 0;

    // Assuming 5 PCs, 12 hours operation per day
    const totalPCHours = 5 * 12;
    const usedHours = sessions.reduce((sum, s) => sum + (s.plannedDuration / 60), 0);

    return Math.min(100, (usedHours / totalPCHours) * 100);
  }
}

// ========== EXPORT SERVICE ==========

export class ExportService {
  /**
   * Export data to CSV format
   */
  async exportToCSV(dataType: 'sessions' | 'payments' | 'users' | 'analytics'): Promise<string> {
    let data: any[] = [];
    let headers: string[] = [];

    switch (dataType) {
      case 'sessions':
        data = await db.getAllSessions();
        headers = ['ID', 'User', 'Client', 'Start Time', 'Duration', 'Status', 'Amount Paid'];
        break;

      case 'payments':
        data = await db.getAllPayments();
        headers = ['ID', 'User', 'Client', 'Amount', 'Method', 'Timestamp', 'Description'];
        break;

      case 'users':
        data = await db.getAllUsers();
        headers = ['ID', 'Username', 'Full Name', 'Email', 'Role', 'Membership', 'Wallet Balance'];
        break;

      case 'analytics':
        const analytics = await new AnalyticsService().getAnalytics(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          new Date().toISOString()
        );
        data = analytics;
        headers = ['Date', 'Revenue', 'Sessions', 'Unique Customers', 'Avg Duration', 'Peak Hour', 'Occupancy Rate'];
        break;
    }

    return this.convertToCSV(data, headers);
  }

  private convertToCSV(data: any[], headers: string[]): string {
    let csv = headers.join(',') + '\n';

    data.forEach(row => {
      const values = headers.map(header => {
        const key = header.toLowerCase().replace(/ /g, '');
        let value = row[key] || row[header] || '';

        // Handle nested objects
        if (typeof value === 'object') {
          value = JSON.stringify(value);
        }

        // Escape commas and quotes
        value = String(value).replace(/"/g, '""');
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${value}"`;
        }

        return value;
      });

      csv += values.join(',') + '\n';
    });

    return csv;
  }

  /**
   * Export to JSON
   */
  async exportToJSON(dataType: string): Promise<string> {
    const data = await db.exportAllData();
    const parsed = JSON.parse(data);

    if (dataType === 'all') {
      return data;
    }

    return JSON.stringify(parsed[dataType], null, 2);
  }

  /**
   * Download file helper
   */
  downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}

// ========== BACKUP SERVICE ==========

export class BackupService {
  /**
   * Create backup
   */
  async createBackup(type: 'automatic' | 'manual', createdBy?: string, description?: string): Promise<BackupRecord> {
    const data = await db.exportAllData();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `gaming-parlour-backup-${timestamp}.json`;

    const backup: BackupRecord = {
      id: `backup-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      filename,
      createdAt: new Date().toISOString(),
      size: new Blob([data]).size,
      type,
      createdBy,
      description,
    };

    await db.createBackupRecord(backup);

    // Store backup in browser storage
    localStorage.setItem(`backup_${backup.id}`, data);

    await db.createActivityLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      type: 'system',
      description: `Backup created: ${filename} (${(backup.size / 1024).toFixed(2)} KB)`,
      metadata: { backupId: backup.id, type },
    });

    return backup;
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backupId: string): Promise<void> {
    const backupData = localStorage.getItem(`backup_${backupId}`);
    if (!backupData) {
      throw new Error('Backup data not found');
    }

    await db.importData(backupData);

    await db.createActivityLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      type: 'system',
      description: `Database restored from backup: ${backupId}`,
      metadata: { backupId },
    });
  }

  /**
   * List all backups
   */
  async listBackups(): Promise<BackupRecord[]> {
    return await db.getAllBackupRecords();
  }

  /**
   * Delete old backups
   */
  async cleanOldBackups(daysToKeep: number = 30): Promise<number> {
    const backups = await db.getAllBackupRecords();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let deletedCount = 0;

    for (const backup of backups) {
      if (new Date(backup.createdAt) < cutoffDate) {
        await db.deleteBackupRecord(backup.id);
        localStorage.removeItem(`backup_${backup.id}`);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Auto backup scheduler (call this periodically)
   */
  async scheduleAutoBackup(): Promise<void> {
    const backups = await db.getAllBackupRecords();
    const today = new Date().toISOString().split('T')[0];

    const todayBackup = backups.find(b =>
      b.type === 'automatic' && b.createdAt.startsWith(today)
    );

    if (!todayBackup) {
      await this.createBackup('automatic', 'SYSTEM', 'Daily automatic backup');
    }
  }
}

// ========== REMOTE CONTROL SERVICE ==========

export class RemoteControlService {
  /**
   * Execute remote command
   */
  async executeCommand(
    clientId: string,
    command: RemoteCommand,
    executedBy: string,
    payload?: any
  ): Promise<RemoteControlAction> {
    const action: RemoteControlAction = {
      id: `action-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      clientId,
      command,
      executedBy,
      executedAt: new Date().toISOString(),
      status: 'pending',
      payload,
    };

    await db.createRemoteAction(action);

    await db.createActivityLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      type: 'system',
      clientId,
      description: `Remote command executed: ${command} on ${clientId} by ${executedBy}`,
      metadata: { actionId: action.id, command, payload },
    });

    // In a real implementation, this would send the command via WebSocket
    console.log(`Executing ${command} on ${clientId}`, payload);

    // Simulate execution
    setTimeout(async () => {
      action.status = 'executed';
      action.result = `${command} completed successfully`;
      await db.updateRemoteAction(action);
    }, 1000);

    return action;
  }

  /**
   * Send message to client PC
   */
  async sendMessage(clientId: string, message: string, executedBy: string): Promise<void> {
    await this.executeCommand(clientId, 'message', executedBy, { message });
  }

  /**
   * Lock/Unlock PC
   */
  async toggleLock(clientId: string, lock: boolean, executedBy: string): Promise<void> {
    const command: RemoteCommand = lock ? 'lock' : 'unlock';
    await this.executeCommand(clientId, command, executedBy);

    const client = await db.getClient(clientId);
    if (client) {
      client.status = lock ? 'maintenance' : 'available';
      await db.updateClient(client);
    }
  }

  /**
   * Get action history for a client
   */
  async getClientActionHistory(clientId: string): Promise<RemoteControlAction[]> {
    return await db.getRemoteActionsByClient(clientId);
  }
}

// ========== CUSTOMER PROFILE SERVICE ==========

export class ProfileService {
  /**
   * Get or create customer profile
   */
  async getProfile(userId: string): Promise<CustomerProfile> {
    let profile = await db.getCustomerProfile(userId);

    if (!profile) {
      profile = await this.createProfile(userId);
    }

    return profile;
  }

  /**
   * Create new customer profile
   */
  async createProfile(userId: string): Promise<CustomerProfile> {
    const user = await db.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const profile: CustomerProfile = {
      userId,
      totalSessions: 0,
      totalHoursPlayed: 0,
      totalSpent: 0,
      averageSessionDuration: 0,
      favoriteGames: [],
      preferredPCs: [],
      lastVisit: new Date().toISOString(),
      memberSince: user.createdAt,
      loyaltyPoints: 0,
      referralCode: this.generateReferralCode(user.username),
    };

    await db.createCustomerProfile(profile);
    return profile;
  }

  /**
   * Update profile after session
   */
  async updateProfileAfterSession(
    userId: string,
    sessionDuration: number,
    amountSpent: number,
    clientId: string
  ): Promise<void> {
    const profile = await this.getProfile(userId);

    profile.totalSessions++;
    profile.totalHoursPlayed += sessionDuration / 60;
    profile.totalSpent += amountSpent;
    profile.averageSessionDuration = profile.totalHoursPlayed / profile.totalSessions * 60;
    profile.lastVisit = new Date().toISOString();

    // Update preferred PCs
    if (!profile.preferredPCs.includes(clientId)) {
      profile.preferredPCs.push(clientId);
    }

    // Award loyalty points (1 point per ₹10 spent)
    profile.loyaltyPoints += Math.floor(amountSpent / 10);

    await db.updateCustomerProfile(profile);
  }

  private generateReferralCode(username: string): string {
    const prefix = username.substring(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${random}`;
  }
}

// Export service instances
export const analyticsService = new AnalyticsService();
export const exportService = new ExportService();
export const backupService = new BackupService();
export const remoteControlService = new RemoteControlService();
export const profileService = new ProfileService();
