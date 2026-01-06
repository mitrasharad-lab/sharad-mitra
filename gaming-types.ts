/**
 * Gaming Parlour Management System - Type Definitions
 */

export type UserRole = 'admin' | 'staff' | 'customer';

export type MembershipTier = 'none' | 'bronze' | 'silver' | 'gold';

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'wallet';

export type SessionStatus = 'active' | 'paused' | 'completed' | 'expired';

export type ClientStatus = 'available' | 'occupied' | 'offline' | 'maintenance';

export interface User {
  id: string;
  username: string;
  passwordHash: string; // In production, use bcrypt
  fullName: string;
  email?: string;
  phone?: string;
  role: UserRole;
  membershipTier: MembershipTier;
  walletBalance: number;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export interface ClientPC {
  id: string; // 'PC-1', 'PC-2', etc.
  name: string;
  status: ClientStatus;
  ipAddress?: string;
  currentSession?: Session;
  specifications?: {
    cpu: string;
    gpu: string;
    ram: string;
    storage: string;
  };
  installedGames?: string[];
}

export interface Session {
  id: string;
  userId: string;
  userName: string;
  clientId: string;
  startTime: string;
  endTime?: string;
  plannedDuration: number; // in minutes
  remainingTime: number; // in minutes
  status: SessionStatus;
  pausedAt?: string;
  pausedDuration?: number; // total paused time in minutes
  autoExtended?: boolean;
  extensionHistory?: TimeExtension[];
}

export interface TimeExtension {
  extendedBy: string; // admin/staff username
  extendedAt: string;
  additionalMinutes: number;
  reason?: string;
}

export interface Payment {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  clientId: string;
  amount: number;
  method: PaymentMethod;
  timestamp: string;
  duration: number; // minutes purchased
  discount?: number;
  description?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'login' | 'logout' | 'payment' | 'extension' | 'pause' | 'resume' | 'system';
  userId?: string;
  userName?: string;
  clientId?: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface PricingRule {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number;
  isActive: boolean;
  validFrom?: string;
  validTo?: string;
  daysOfWeek?: number[]; // 0-6, Sunday = 0
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
}

export interface SystemConfig {
  warningTime: number; // minutes before expiry to show warning (default: 5)
  gracePeriod: number; // minutes after expiry before force logout (default: 2)
  autoLockOnExpiry: boolean;
  allowPause: boolean;
  maxPauseDuration: number; // minutes
  enableNotifications: boolean;
  enableSound: boolean;
  currency: string;
  timezone: string;
  businessHours: {
    open: string; // HH:mm
    close: string; // HH:mm
  };
  masterPCId: string;
}

export interface DashboardStats {
  totalRevenue: number;
  todayRevenue: number;
  activeSessions: number;
  totalSessions: number;
  availablePCs: number;
  occupiedPCs: number;
  totalCustomers: number;
  newCustomersToday: number;
  averageSessionDuration: number;
  peakHour: string;
}

export interface WebSocketMessage {
  type: 'connect' | 'disconnect' | 'session_start' | 'session_end' | 'time_update' |
        'warning' | 'extension' | 'pause' | 'resume' | 'lock' | 'unlock' | 'sync' | 'heartbeat';
  clientId?: string;
  userId?: string;
  payload?: any;
  timestamp: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

// Database interface for storage operations
export interface GamingParlourDatabase {
  users: User[];
  clients: ClientPC[];
  sessions: Session[];
  payments: Payment[];
  activityLogs: ActivityLog[];
  pricingRules: PricingRule[];
  config: SystemConfig;
}
