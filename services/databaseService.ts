/**
 * Gaming Parlour Database Service
 * Handles all data persistence using IndexedDB
 */

import type {
  User,
  ClientPC,
  Session,
  Payment,
  ActivityLog,
  PricingRule,
  SystemConfig,
  GamingParlourDatabase,
  DashboardStats,
} from '../gaming-types';

const DB_NAME = 'GamingParlourDB';
const DB_VERSION = 1;

class DatabaseService {
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('username', 'username', { unique: true });
          userStore.createIndex('role', 'role');
        }

        if (!db.objectStoreNames.contains('clients')) {
          db.createObjectStore('clients', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('userId', 'userId');
          sessionStore.createIndex('clientId', 'clientId');
          sessionStore.createIndex('status', 'status');
          sessionStore.createIndex('startTime', 'startTime');
        }

        if (!db.objectStoreNames.contains('payments')) {
          const paymentStore = db.createObjectStore('payments', { keyPath: 'id' });
          paymentStore.createIndex('userId', 'userId');
          paymentStore.createIndex('sessionId', 'sessionId');
          paymentStore.createIndex('timestamp', 'timestamp');
        }

        if (!db.objectStoreNames.contains('activityLogs')) {
          const logStore = db.createObjectStore('activityLogs', { keyPath: 'id' });
          logStore.createIndex('timestamp', 'timestamp');
          logStore.createIndex('type', 'type');
          logStore.createIndex('userId', 'userId');
        }

        if (!db.objectStoreNames.contains('pricingRules')) {
          db.createObjectStore('pricingRules', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('config')) {
          db.createObjectStore('config', { keyPath: 'id' });
        }
      };
    });
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // User Management
  async createUser(user: User): Promise<void> {
    const store = this.getStore('users', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add(user);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const store = this.getStore('users');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const store = this.getStore('users');
    const index = store.index('username');
    return new Promise((resolve, reject) => {
      const request = index.get(username);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllUsers(): Promise<User[]> {
    const store = this.getStore('users');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateUser(user: User): Promise<void> {
    const store = this.getStore('users', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(user);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteUser(id: string): Promise<void> {
    const store = this.getStore('users', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Client PC Management
  async createClient(client: ClientPC): Promise<void> {
    const store = this.getStore('clients', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add(client);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getClient(id: string): Promise<ClientPC | undefined> {
    const store = this.getStore('clients');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllClients(): Promise<ClientPC[]> {
    const store = this.getStore('clients');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateClient(client: ClientPC): Promise<void> {
    const store = this.getStore('clients', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(client);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Session Management
  async createSession(session: Session): Promise<void> {
    const store = this.getStore('sessions', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add(session);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSession(id: string): Promise<Session | undefined> {
    const store = this.getStore('sessions');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getActiveSessions(): Promise<Session[]> {
    const store = this.getStore('sessions');
    const index = store.index('status');
    return new Promise((resolve, reject) => {
      const request = index.getAll('active');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getSessionsByUser(userId: string): Promise<Session[]> {
    const store = this.getStore('sessions');
    const index = store.index('userId');
    return new Promise((resolve, reject) => {
      const request = index.getAll(userId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateSession(session: Session): Promise<void> {
    const store = this.getStore('sessions', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(session);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllSessions(): Promise<Session[]> {
    const store = this.getStore('sessions');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Payment Management
  async createPayment(payment: Payment): Promise<void> {
    const store = this.getStore('payments', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add(payment);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    const store = this.getStore('payments');
    const index = store.index('userId');
    return new Promise((resolve, reject) => {
      const request = index.getAll(userId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPayments(): Promise<Payment[]> {
    const store = this.getStore('payments');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Activity Logs
  async createActivityLog(log: ActivityLog): Promise<void> {
    const store = this.getStore('activityLogs', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add(log);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getActivityLogs(limit: number = 100): Promise<ActivityLog[]> {
    const store = this.getStore('activityLogs');
    const index = store.index('timestamp');
    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev');
      const logs: ActivityLog[] = [];
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && logs.length < limit) {
          logs.push(cursor.value);
          cursor.continue();
        } else {
          resolve(logs);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Pricing Rules
  async createPricingRule(rule: PricingRule): Promise<void> {
    const store = this.getStore('pricingRules', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add(rule);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPricingRules(): Promise<PricingRule[]> {
    const store = this.getStore('pricingRules');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updatePricingRule(rule: PricingRule): Promise<void> {
    const store = this.getStore('pricingRules', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(rule);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // System Config
  async getConfig(): Promise<SystemConfig | undefined> {
    const store = this.getStore('config');
    return new Promise((resolve, reject) => {
      const request = store.get('system');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateConfig(config: SystemConfig): Promise<void> {
    const store = this.getStore('config', 'readwrite');
    const configWithId = { ...config, id: 'system' };
    return new Promise((resolve, reject) => {
      const request = store.put(configWithId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const [sessions, payments, clients, users] = await Promise.all([
      this.getAllSessions(),
      this.getAllPayments(),
      this.getAllClients(),
      this.getAllUsers(),
    ]);

    const today = new Date().toISOString().split('T')[0];
    const todayPayments = payments.filter(p => p.timestamp.startsWith(today));
    const activeSessions = sessions.filter(s => s.status === 'active');
    const availablePCs = clients.filter(c => c.status === 'available').length;
    const occupiedPCs = clients.filter(c => c.status === 'occupied').length;
    const todayUsers = users.filter(u => u.createdAt.startsWith(today));

    return {
      totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
      todayRevenue: todayPayments.reduce((sum, p) => sum + p.amount, 0),
      activeSessions: activeSessions.length,
      totalSessions: sessions.length,
      availablePCs,
      occupiedPCs,
      totalCustomers: users.filter(u => u.role === 'customer').length,
      newCustomersToday: todayUsers.filter(u => u.role === 'customer').length,
      averageSessionDuration: sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (s.plannedDuration || 0), 0) / sessions.length
        : 0,
      peakHour: this.calculatePeakHour(sessions),
    };
  }

  private calculatePeakHour(sessions: Session[]): string {
    const hourCounts: Record<string, number> = {};
    sessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      const hourKey = `${hour}:00`;
      hourCounts[hourKey] = (hourCounts[hourKey] || 0) + 1;
    });

    let peakHour = '12:00';
    let maxCount = 0;
    Object.entries(hourCounts).forEach(([hour, count]) => {
      if (count > maxCount) {
        maxCount = count;
        peakHour = hour;
      }
    });

    return peakHour;
  }

  // Export data
  async exportAllData(): Promise<string> {
    const [users, clients, sessions, payments, logs, rules, config] = await Promise.all([
      this.getAllUsers(),
      this.getAllClients(),
      this.getAllSessions(),
      this.getAllPayments(),
      this.getActivityLogs(1000),
      this.getAllPricingRules(),
      this.getConfig(),
    ]);

    const data: GamingParlourDatabase = {
      users,
      clients,
      sessions,
      payments,
      activityLogs: logs,
      pricingRules: rules,
      config: config!,
    };

    return JSON.stringify(data, null, 2);
  }

  // Import data (for backup restoration)
  async importData(jsonData: string): Promise<void> {
    const data: GamingParlourDatabase = JSON.parse(jsonData);

    // Clear existing data
    await this.clearAllData();

    // Import new data
    for (const user of data.users) {
      await this.createUser(user);
    }
    for (const client of data.clients) {
      await this.createClient(client);
    }
    for (const session of data.sessions) {
      await this.createSession(session);
    }
    for (const payment of data.payments) {
      await this.createPayment(payment);
    }
    for (const log of data.activityLogs) {
      await this.createActivityLog(log);
    }
    for (const rule of data.pricingRules) {
      await this.createPricingRule(rule);
    }
    if (data.config) {
      await this.updateConfig(data.config);
    }
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stores = ['users', 'clients', 'sessions', 'payments', 'activityLogs', 'pricingRules'];
    const transaction = this.db.transaction(stores, 'readwrite');

    return new Promise((resolve, reject) => {
      stores.forEach(storeName => {
        transaction.objectStore(storeName).clear();
      });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const db = new DatabaseService();
