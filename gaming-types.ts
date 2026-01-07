/**
 * Gaming Parlour Management System - Type Definitions
 */

export type UserRole = 'admin' | 'staff' | 'customer';

export type MembershipTier = 'none' | 'bronze' | 'silver' | 'gold';

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'wallet' | 'paytm' | 'gpay' | 'phonepe';

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

// ============ NEW FEATURES ============

// Reservation System
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';

export interface Reservation {
  id: string;
  userId: string;
  userName: string;
  clientId: string;
  startTime: string;
  duration: number; // minutes
  status: ReservationStatus;
  createdAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  notes?: string;
  notificationSent: boolean;
}

// Queue Management
export type QueueStatus = 'waiting' | 'notified' | 'expired' | 'served';

export interface QueueEntry {
  id: string;
  userId: string;
  userName: string;
  phone?: string;
  joinedAt: string;
  estimatedWaitTime: number; // minutes
  status: QueueStatus;
  position: number;
  notifiedAt?: string;
  expiresAt?: string;
}

// Food & Beverage POS
export type FoodCategory = 'snacks' | 'drinks' | 'meals' | 'desserts';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  price: number;
  description?: string;
  imageUrl?: string;
  isAvailable: boolean;
  stockQuantity?: number;
}

export interface FoodOrder {
  id: string;
  userId: string;
  userName: string;
  clientId?: string;
  items: {
    foodItemId: string;
    foodItemName: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  status: OrderStatus;
  orderTime: string;
  deliveryTime?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

// Promotional Codes
export type PromoType = 'percentage' | 'fixed' | 'free_time';

export interface PromoCode {
  id: string;
  code: string;
  name: string;
  type: PromoType;
  value: number; // percentage or amount or minutes
  minPurchase?: number;
  maxDiscount?: number;
  validFrom: string;
  validTo: string;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  applicableToMembership?: MembershipTier[];
}

export interface PromoUsage {
  id: string;
  promoCodeId: string;
  userId: string;
  sessionId?: string;
  discountAmount: number;
  usedAt: string;
}

// Tournament System
export type TournamentStatus = 'upcoming' | 'registration' | 'ongoing' | 'completed' | 'cancelled';
export type TournamentFormat = 'single_elimination' | 'double_elimination' | 'round_robin' | 'free_for_all';

export interface Tournament {
  id: string;
  name: string;
  game: string;
  format: TournamentFormat;
  status: TournamentStatus;
  startTime: string;
  endTime?: string;
  maxParticipants: number;
  entryFee: number;
  prizePool: number;
  prizes: {
    position: number;
    amount: number;
  }[];
  participants: string[]; // user IDs
  matches: TournamentMatch[];
  createdBy: string;
  createdAt: string;
}

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  round: number;
  matchNumber: number;
  player1Id: string;
  player2Id: string;
  player1Score?: number;
  player2Score?: number;
  winnerId?: string;
  clientId?: string;
  startTime?: string;
  endTime?: string;
  status: 'scheduled' | 'ongoing' | 'completed';
}

export interface Leaderboard {
  userId: string;
  userName: string;
  tournamentsWon: number;
  tournamentsPlayed: number;
  totalWinnings: number;
  rank: number;
}

// Game Library Management
export type GameCategory = 'fps' | 'moba' | 'rpg' | 'sports' | 'racing' | 'strategy' | 'casual';

export interface Game {
  id: string;
  name: string;
  category: GameCategory;
  publisher?: string;
  releaseYear?: number;
  size: number; // GB
  minSpecs?: {
    cpu: string;
    gpu: string;
    ram: string;
    storage: string;
  };
  imageUrl?: string;
  isPopular: boolean;
  playCount: number;
}

export interface GameInstallation {
  gameId: string;
  clientId: string;
  installedAt: string;
  version?: string;
  lastPlayed?: string;
}

// Network Monitoring
export interface NetworkStats {
  clientId: string;
  timestamp: string;
  downloadSpeed: number; // Mbps
  uploadSpeed: number; // Mbps
  ping: number; // ms
  packetLoss: number; // percentage
  totalDownload: number; // GB
  totalUpload: number; // GB
}

// Customer Profile & History
export interface CustomerProfile {
  userId: string;
  totalSessions: number;
  totalHoursPlayed: number;
  totalSpent: number;
  averageSessionDuration: number;
  favoriteGames: string[];
  preferredPCs: string[];
  lastVisit: string;
  memberSince: string;
  loyaltyPoints: number;
  referralCode: string;
  referredBy?: string;
}

// Advanced Analytics
export interface AnalyticsData {
  date: string;
  revenue: number;
  sessions: number;
  uniqueCustomers: number;
  averageSessionDuration: number;
  peakHour: string;
  mostPlayedGame: string;
  occupancyRate: number;
}

export interface RevenueReport {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  totalRevenue: number;
  gamingRevenue: number;
  foodRevenue: number;
  membershipRevenue: number;
  breakdown: {
    date: string;
    revenue: number;
  }[];
}

// Remote PC Control
export type RemoteCommand = 'lock' | 'unlock' | 'restart' | 'shutdown' | 'screenshot' | 'message';

export interface RemoteControlAction {
  id: string;
  clientId: string;
  command: RemoteCommand;
  executedBy: string;
  executedAt: string;
  status: 'pending' | 'executed' | 'failed';
  payload?: any;
  result?: string;
}

// Backup System
export interface BackupRecord {
  id: string;
  filename: string;
  createdAt: string;
  size: number; // bytes
  type: 'automatic' | 'manual';
  createdBy?: string;
  description?: string;
}

// Notification System
export type NotificationType = 'email' | 'sms' | 'push' | 'in-app';

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  subject: string;
  body: string;
  variables: string[]; // e.g., ['userName', 'duration', 'amount']
}

export interface SentNotification {
  id: string;
  userId: string;
  type: NotificationType;
  subject: string;
  body: string;
  sentAt: string;
  status: 'sent' | 'failed' | 'pending';
  readAt?: string;
}

// Multi-location Support
export interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  managerUserId: string;
  numberOfPCs: number;
  isActive: boolean;
  openingHours: {
    [key: string]: { open: string; close: string; };
  };
}

// Enhanced User with more features
export interface EnhancedUser extends User {
  profile?: CustomerProfile;
  permissions?: string[];
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  twoFactorEnabled?: boolean;
  profilePictureUrl?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
}

// ============ GOOGLE OAUTH AUTHENTICATION ============

export interface GoogleOAuthToken {
  accessToken: string;
  refreshToken?: string;
  idToken: string;
  expiresAt: string;
  tokenType: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  verifiedEmail: boolean;
  name: string;
  givenName: string;
  familyName: string;
  picture: string;
  locale: string;
}

export interface OAuthSession {
  id: string;
  userId: string;
  googleUserId: string;
  googleEmail: string;
  googleName: string;
  googlePicture: string;
  token: GoogleOAuthToken;
  clientId: string;
  createdAt: string;
  lastRefreshAt?: string;
}

// ============ GAME LAUNCH SYSTEM ============

export type GameLaunchStatus = 'launching' | 'running' | 'paused' | 'stopped' | 'crashed';

export interface LaunchedGame {
  id: string;
  gameId: string;
  gameName: string;
  sessionId: string;
  userId: string;
  clientId: string;
  status: GameLaunchStatus;
  launchedAt: string;
  stoppedAt?: string;
  playtimeMinutes: number;
  lastHeartbeat?: string;
}

export interface GameLaunchEvent {
  id: string;
  launchedGameId: string;
  eventType: 'launch' | 'pause' | 'resume' | 'stop' | 'crash' | 'heartbeat';
  timestamp: string;
  metadata?: Record<string, any>;
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
  // New features
  reservations: Reservation[];
  queueEntries: QueueEntry[];
  foodItems: FoodItem[];
  foodOrders: FoodOrder[];
  promoCodes: PromoCode[];
  promoUsages: PromoUsage[];
  tournaments: Tournament[];
  games: Game[];
  gameInstallations: GameInstallation[];
  networkStats: NetworkStats[];
  customerProfiles: CustomerProfile[];
  remoteActions: RemoteControlAction[];
  backups: BackupRecord[];
  sentNotifications: SentNotification[];
  // OAuth & Game Launch
  oauthSessions: OAuthSession[];
  launchedGames: LaunchedGame[];
  gameLaunchEvents: GameLaunchEvent[];
}
