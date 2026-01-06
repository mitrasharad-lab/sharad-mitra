/**
 * Authentication Service
 * Handles user login, session management, and password hashing
 */

import { User, UserRole } from '../gaming-types';
import { db } from './databaseService';

// Simple hash function (In production, use bcrypt with a backend server)
async function simpleHash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

class AuthService {
  private currentSession: AuthSession | null = null;

  async login(username: string, password: string): Promise<AuthSession> {
    const user = await db.getUserByUsername(username);

    if (!user) {
      throw new Error('Invalid username or password');
    }

    if (!user.isActive) {
      throw new Error('Account is disabled. Please contact administrator.');
    }

    const passwordHash = await simpleHash(password);
    if (user.passwordHash !== passwordHash) {
      throw new Error('Invalid username or password');
    }

    // Update last login
    user.lastLoginAt = new Date().toISOString();
    await db.updateUser(user);

    // Create session
    const token = await this.generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    this.currentSession = { user, token, expiresAt };

    // Log activity
    await db.createActivityLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      type: 'login',
      userId: user.id,
      userName: user.username,
      description: `User ${user.username} logged in`,
    });

    return this.currentSession;
  }

  async logout(): Promise<void> {
    if (this.currentSession) {
      await db.createActivityLog({
        id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        timestamp: new Date().toISOString(),
        type: 'logout',
        userId: this.currentSession.user.id,
        userName: this.currentSession.user.username,
        description: `User ${this.currentSession.user.username} logged out`,
      });
    }

    this.currentSession = null;
  }

  getCurrentSession(): AuthSession | null {
    if (!this.currentSession) return null;

    // Check if session expired
    if (new Date(this.currentSession.expiresAt) < new Date()) {
      this.currentSession = null;
      return null;
    }

    return this.currentSession;
  }

  isAuthenticated(): boolean {
    return this.getCurrentSession() !== null;
  }

  hasRole(role: UserRole): boolean {
    const session = this.getCurrentSession();
    return session?.user.role === role;
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  isStaff(): boolean {
    const session = this.getCurrentSession();
    return session?.user.role === 'admin' || session?.user.role === 'staff';
  }

  async createUser(
    username: string,
    password: string,
    fullName: string,
    role: UserRole = 'customer',
    email?: string,
    phone?: string
  ): Promise<User> {
    // Check if username exists
    const existing = await db.getUserByUsername(username);
    if (existing) {
      throw new Error('Username already exists');
    }

    const passwordHash = await simpleHash(password);

    const user: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      username,
      passwordHash,
      fullName,
      email,
      phone,
      role,
      membershipTier: 'none',
      walletBalance: 0,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    await db.createUser(user);

    await db.createActivityLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      type: 'system',
      description: `New user created: ${username} (${role})`,
      metadata: { userId: user.id, username },
    });

    return user;
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await db.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const oldHash = await simpleHash(oldPassword);
    if (user.passwordHash !== oldHash) {
      throw new Error('Current password is incorrect');
    }

    user.passwordHash = await simpleHash(newPassword);
    await db.updateUser(user);

    await db.createActivityLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      type: 'system',
      userId: user.id,
      userName: user.username,
      description: `Password changed for user ${user.username}`,
    });
  }

  async resetPassword(userId: string, newPassword: string): Promise<void> {
    // Admin function to reset user password
    if (!this.isStaff()) {
      throw new Error('Unauthorized');
    }

    const user = await db.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.passwordHash = await simpleHash(newPassword);
    await db.updateUser(user);

    const currentUser = this.getCurrentSession()?.user;
    await db.createActivityLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      type: 'system',
      userId: currentUser?.id,
      userName: currentUser?.username,
      description: `Password reset for user ${user.username} by ${currentUser?.username}`,
      metadata: { targetUserId: user.id },
    });
  }

  private async generateToken(): Promise<string> {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

export const authService = new AuthService();
export { simpleHash };
