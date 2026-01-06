/**
 * Session Service
 * Manages gaming sessions, timers, warnings, and extensions
 */

import { Session, TimeExtension, Payment, ClientPC } from '../gaming-types';
import { db } from './databaseService';

type TimerCallback = (remainingMinutes: number) => void;
type WarningCallback = () => void;
type ExpiryCallback = () => void;

class SessionService {
  private timers: Map<string, number> = new Map();
  private timerCallbacks: Map<string, TimerCallback> = new Map();
  private warningCallbacks: Map<string, WarningCallback> = new Map();
  private expiryCallbacks: Map<string, ExpiryCallback> = new Map();
  private warningSent: Set<string> = new Set();

  /**
   * Start a new gaming session
   */
  async startSession(
    userId: string,
    userName: string,
    clientId: string,
    durationMinutes: number,
    payment: Payment
  ): Promise<Session> {
    // Check if client is available
    const client = await db.getClient(clientId);
    if (!client) {
      throw new Error('Client PC not found');
    }
    if (client.status !== 'available') {
      throw new Error('Client PC is not available');
    }

    // Create session
    const session: Session = {
      id: `session-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      userId,
      userName,
      clientId,
      startTime: new Date().toISOString(),
      plannedDuration: durationMinutes,
      remainingTime: durationMinutes,
      status: 'active',
    };

    await db.createSession(session);

    // Update client status
    client.status = 'occupied';
    client.currentSession = session;
    await db.updateClient(client);

    // Record payment
    await db.createPayment(payment);

    // Log activity
    await db.createActivityLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      type: 'login',
      userId,
      userName,
      clientId,
      description: `Session started on ${clientId} for ${durationMinutes} minutes`,
      metadata: { sessionId: session.id, duration: durationMinutes },
    });

    // Start timer
    this.startTimer(session);

    return session;
  }

  /**
   * End a gaming session
   */
  async endSession(sessionId: string): Promise<void> {
    const session = await db.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.status = 'completed';
    session.endTime = new Date().toISOString();
    await db.updateSession(session);

    // Update client status
    const client = await db.getClient(session.clientId);
    if (client) {
      client.status = 'available';
      client.currentSession = undefined;
      await db.updateClient(client);
    }

    // Stop timer
    this.stopTimer(sessionId);

    // Log activity
    await db.createActivityLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      type: 'logout',
      userId: session.userId,
      userName: session.userName,
      clientId: session.clientId,
      description: `Session ended on ${session.clientId}`,
      metadata: { sessionId: session.id },
    });
  }

  /**
   * Pause a session
   */
  async pauseSession(sessionId: string): Promise<void> {
    const session = await db.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== 'active') {
      throw new Error('Session is not active');
    }

    session.status = 'paused';
    session.pausedAt = new Date().toISOString();
    await db.updateSession(session);

    this.stopTimer(sessionId);

    await db.createActivityLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      type: 'pause',
      userId: session.userId,
      userName: session.userName,
      clientId: session.clientId,
      description: `Session paused on ${session.clientId}`,
      metadata: { sessionId: session.id, remainingTime: session.remainingTime },
    });
  }

  /**
   * Resume a paused session
   */
  async resumeSession(sessionId: string): Promise<void> {
    const session = await db.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== 'paused') {
      throw new Error('Session is not paused');
    }

    // Calculate paused duration
    if (session.pausedAt) {
      const pausedDuration = (Date.now() - new Date(session.pausedAt).getTime()) / 60000;
      session.pausedDuration = (session.pausedDuration || 0) + pausedDuration;
    }

    session.status = 'active';
    session.pausedAt = undefined;
    await db.updateSession(session);

    this.startTimer(session);

    await db.createActivityLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      type: 'resume',
      userId: session.userId,
      userName: session.userName,
      clientId: session.clientId,
      description: `Session resumed on ${session.clientId}`,
      metadata: { sessionId: session.id, remainingTime: session.remainingTime },
    });
  }

  /**
   * Extend session time
   */
  async extendSession(
    sessionId: string,
    additionalMinutes: number,
    extendedBy: string,
    reason?: string
  ): Promise<void> {
    const session = await db.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const extension: TimeExtension = {
      extendedBy,
      extendedAt: new Date().toISOString(),
      additionalMinutes,
      reason,
    };

    session.remainingTime += additionalMinutes;
    session.plannedDuration += additionalMinutes;
    session.extensionHistory = session.extensionHistory || [];
    session.extensionHistory.push(extension);

    await db.updateSession(session);

    // Reset warning flag
    this.warningSent.delete(sessionId);

    await db.createActivityLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      type: 'extension',
      userId: session.userId,
      userName: session.userName,
      clientId: session.clientId,
      description: `Session extended by ${additionalMinutes} minutes on ${session.clientId}`,
      metadata: {
        sessionId: session.id,
        additionalMinutes,
        extendedBy,
        reason,
        newRemainingTime: session.remainingTime,
      },
    });
  }

  /**
   * Start countdown timer for a session
   */
  private startTimer(session: Session): void {
    // Clear existing timer if any
    this.stopTimer(session.id);

    const intervalId = window.setInterval(async () => {
      const currentSession = await db.getSession(session.id);
      if (!currentSession || currentSession.status !== 'active') {
        this.stopTimer(session.id);
        return;
      }

      currentSession.remainingTime -= 1 / 60; // Decrease by 1 second

      // Update session in DB every minute
      if (currentSession.remainingTime % 1 === 0) {
        await db.updateSession(currentSession);
      }

      // Call timer callback
      const callback = this.timerCallbacks.get(session.id);
      if (callback) {
        callback(currentSession.remainingTime);
      }

      // Check for warning (5 minutes remaining)
      if (
        currentSession.remainingTime <= 5 &&
        currentSession.remainingTime > 4.9 &&
        !this.warningSent.has(session.id)
      ) {
        this.warningSent.add(session.id);
        const warningCallback = this.warningCallbacks.get(session.id);
        if (warningCallback) {
          warningCallback();
        }
      }

      // Check for expiry
      if (currentSession.remainingTime <= 0) {
        currentSession.status = 'expired';
        await db.updateSession(currentSession);
        this.stopTimer(session.id);

        const expiryCallback = this.expiryCallbacks.get(session.id);
        if (expiryCallback) {
          expiryCallback();
        }

        // Auto-end session
        await this.endSession(session.id);
      }
    }, 1000); // Update every second

    this.timers.set(session.id, intervalId);
  }

  /**
   * Stop countdown timer
   */
  private stopTimer(sessionId: string): void {
    const intervalId = this.timers.get(sessionId);
    if (intervalId) {
      clearInterval(intervalId);
      this.timers.delete(sessionId);
    }
  }

  /**
   * Register timer update callback
   */
  onTimerUpdate(sessionId: string, callback: TimerCallback): void {
    this.timerCallbacks.set(sessionId, callback);
  }

  /**
   * Register warning callback (5 minutes remaining)
   */
  onWarning(sessionId: string, callback: WarningCallback): void {
    this.warningCallbacks.set(sessionId, callback);
  }

  /**
   * Register expiry callback
   */
  onExpiry(sessionId: string, callback: ExpiryCallback): void {
    this.expiryCallbacks.set(sessionId, callback);
  }

  /**
   * Get active session for a client
   */
  async getActiveSessionForClient(clientId: string): Promise<Session | null> {
    const client = await db.getClient(clientId);
    if (!client || !client.currentSession) {
      return null;
    }
    return client.currentSession;
  }

  /**
   * Get remaining time for a session
   */
  async getRemainingTime(sessionId: string): Promise<number> {
    const session = await db.getSession(sessionId);
    return session?.remainingTime || 0;
  }

  /**
   * Format time for display
   */
  formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes % 1) * 60);

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  }
}

export const sessionService = new SessionService();
