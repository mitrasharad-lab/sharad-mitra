/**
 * Database Service Extensions for Advanced Features
 * Adds methods for all new features to the database service
 */

import type {
  Reservation,
  QueueEntry,
  FoodItem,
  FoodOrder,
  PromoCode,
  PromoUsage,
  Tournament,
  Game,
  GameInstallation,
  NetworkStats,
  CustomerProfile,
  RemoteControlAction,
  BackupRecord,
  SentNotification,
} from '../gaming-types';

// This file extends the database service with methods for new features
// Import as: import { db } from './databaseExtensions';

import { db as baseDb } from './databaseService';

// Extend the database class
const extendedDb = Object.assign(baseDb, {
  // ========== RESERVATION METHODS ==========
  async createReservation(reservation: Reservation): Promise<void> {
    if (!localStorage.getItem('reservations')) {
      localStorage.setItem('reservations', JSON.stringify([]));
    }
    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    reservations.push(reservation);
    localStorage.setItem('reservations', JSON.stringify(reservations));
  },

  async getReservation(id: string): Promise<Reservation | undefined> {
    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    return reservations.find((r: Reservation) => r.id === id);
  },

  async getAllReservations(): Promise<Reservation[]> {
    return JSON.parse(localStorage.getItem('reservations') || '[]');
  },

  async getReservationsByClient(clientId: string): Promise<Reservation[]> {
    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    return reservations.filter((r: Reservation) => r.clientId === clientId);
  },

  async getReservationsByUser(userId: string): Promise<Reservation[]> {
    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    return reservations.filter((r: Reservation) => r.userId === userId);
  },

  async updateReservation(reservation: Reservation): Promise<void> {
    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    const index = reservations.findIndex((r: Reservation) => r.id === reservation.id);
    if (index !== -1) {
      reservations[index] = reservation;
      localStorage.setItem('reservations', JSON.stringify(reservations));
    }
  },

  // ========== QUEUE METHODS ==========
  async createQueueEntry(entry: QueueEntry): Promise<void> {
    if (!localStorage.getItem('queueEntries')) {
      localStorage.setItem('queueEntries', JSON.stringify([]));
    }
    const entries = JSON.parse(localStorage.getItem('queueEntries') || '[]');
    entries.push(entry);
    localStorage.setItem('queueEntries', JSON.stringify(entries));
  },

  async getQueueEntry(id: string): Promise<QueueEntry | undefined> {
    const entries = JSON.parse(localStorage.getItem('queueEntries') || '[]');
    return entries.find((e: QueueEntry) => e.id === id);
  },

  async getAllQueueEntries(): Promise<QueueEntry[]> {
    return JSON.parse(localStorage.getItem('queueEntries') || '[]');
  },

  async updateQueueEntry(entry: QueueEntry): Promise<void> {
    const entries = JSON.parse(localStorage.getItem('queueEntries') || '[]');
    const index = entries.findIndex((e: QueueEntry) => e.id === entry.id);
    if (index !== -1) {
      entries[index] = entry;
      localStorage.setItem('queueEntries', JSON.stringify(entries));
    }
  },

  async deleteQueueEntry(id: string): Promise<void> {
    const entries = JSON.parse(localStorage.getItem('queueEntries') || '[]');
    const filtered = entries.filter((e: QueueEntry) => e.id !== id);
    localStorage.setItem('queueEntries', JSON.stringify(filtered));
  },

  // ========== FOOD ITEM METHODS ==========
  async createFoodItem(item: FoodItem): Promise<void> {
    if (!localStorage.getItem('foodItems')) {
      localStorage.setItem('foodItems', JSON.stringify([]));
    }
    const items = JSON.parse(localStorage.getItem('foodItems') || '[]');
    items.push(item);
    localStorage.setItem('foodItems', JSON.stringify(items));
  },

  async getFoodItem(id: string): Promise<FoodItem | undefined> {
    const items = JSON.parse(localStorage.getItem('foodItems') || '[]');
    return items.find((i: FoodItem) => i.id === id);
  },

  async getAllFoodItems(): Promise<FoodItem[]> {
    return JSON.parse(localStorage.getItem('foodItems') || '[]');
  },

  async updateFoodItem(item: FoodItem): Promise<void> {
    const items = JSON.parse(localStorage.getItem('foodItems') || '[]');
    const index = items.findIndex((i: FoodItem) => i.id === item.id);
    if (index !== -1) {
      items[index] = item;
      localStorage.setItem('foodItems', JSON.stringify(items));
    }
  },

  // ========== FOOD ORDER METHODS ==========
  async createFoodOrder(order: FoodOrder): Promise<void> {
    if (!localStorage.getItem('foodOrders')) {
      localStorage.setItem('foodOrders', JSON.stringify([]));
    }
    const orders = JSON.parse(localStorage.getItem('foodOrders') || '[]');
    orders.push(order);
    localStorage.setItem('foodOrders', JSON.stringify(orders));
  },

  async getFoodOrder(id: string): Promise<FoodOrder | undefined> {
    const orders = JSON.parse(localStorage.getItem('foodOrders') || '[]');
    return orders.find((o: FoodOrder) => o.id === id);
  },

  async getAllFoodOrders(): Promise<FoodOrder[]> {
    return JSON.parse(localStorage.getItem('foodOrders') || '[]');
  },

  async getFoodOrdersByUser(userId: string): Promise<FoodOrder[]> {
    const orders = JSON.parse(localStorage.getItem('foodOrders') || '[]');
    return orders.filter((o: FoodOrder) => o.userId === userId);
  },

  async updateFoodOrder(order: FoodOrder): Promise<void> {
    const orders = JSON.parse(localStorage.getItem('foodOrders') || '[]');
    const index = orders.findIndex((o: FoodOrder) => o.id === order.id);
    if (index !== -1) {
      orders[index] = order;
      localStorage.setItem('foodOrders', JSON.stringify(orders));
    }
  },

  // ========== PROMO CODE METHODS ==========
  async createPromoCode(promo: PromoCode): Promise<void> {
    if (!localStorage.getItem('promoCodes')) {
      localStorage.setItem('promoCodes', JSON.stringify([]));
    }
    const promos = JSON.parse(localStorage.getItem('promoCodes') || '[]');
    promos.push(promo);
    localStorage.setItem('promoCodes', JSON.stringify(promos));
  },

  async getPromoCode(id: string): Promise<PromoCode | undefined> {
    const promos = JSON.parse(localStorage.getItem('promoCodes') || '[]');
    return promos.find((p: PromoCode) => p.id === id);
  },

  async getAllPromoCodes(): Promise<PromoCode[]> {
    return JSON.parse(localStorage.getItem('promoCodes') || '[]');
  },

  async updatePromoCode(promo: PromoCode): Promise<void> {
    const promos = JSON.parse(localStorage.getItem('promoCodes') || '[]');
    const index = promos.findIndex((p: PromoCode) => p.id === promo.id);
    if (index !== -1) {
      promos[index] = promo;
      localStorage.setItem('promoCodes', JSON.stringify(promos));
    }
  },

  async createPromoUsage(usage: PromoUsage): Promise<void> {
    if (!localStorage.getItem('promoUsages')) {
      localStorage.setItem('promoUsages', JSON.stringify([]));
    }
    const usages = JSON.parse(localStorage.getItem('promoUsages') || '[]');
    usages.push(usage);
    localStorage.setItem('promoUsages', JSON.stringify(usages));
  },

  async getPromoUsagesByPromoCode(promoCodeId: string): Promise<PromoUsage[]> {
    const usages = JSON.parse(localStorage.getItem('promoUsages') || '[]');
    return usages.filter((u: PromoUsage) => u.promoCodeId === promoCodeId);
  },

  async getPromoUsagesByUser(userId: string): Promise<PromoUsage[]> {
    const usages = JSON.parse(localStorage.getItem('promoUsages') || '[]');
    return usages.filter((u: PromoUsage) => u.userId === userId);
  },

  // ========== TOURNAMENT METHODS ==========
  async createTournament(tournament: Tournament): Promise<void> {
    if (!localStorage.getItem('tournaments')) {
      localStorage.setItem('tournaments', JSON.stringify([]));
    }
    const tournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
    tournaments.push(tournament);
    localStorage.setItem('tournaments', JSON.stringify(tournaments));
  },

  async getTournament(id: string): Promise<Tournament | undefined> {
    const tournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
    return tournaments.find((t: Tournament) => t.id === id);
  },

  async getAllTournaments(): Promise<Tournament[]> {
    return JSON.parse(localStorage.getItem('tournaments') || '[]');
  },

  async updateTournament(tournament: Tournament): Promise<void> {
    const tournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
    const index = tournaments.findIndex((t: Tournament) => t.id === tournament.id);
    if (index !== -1) {
      tournaments[index] = tournament;
      localStorage.setItem('tournaments', JSON.stringify(tournaments));
    }
  },

  // ========== GAME METHODS ==========
  async createGame(game: Game): Promise<void> {
    if (!localStorage.getItem('games')) {
      localStorage.setItem('games', JSON.stringify([]));
    }
    const games = JSON.parse(localStorage.getItem('games') || '[]');
    games.push(game);
    localStorage.setItem('games', JSON.stringify(games));
  },

  async getGame(id: string): Promise<Game | undefined> {
    const games = JSON.parse(localStorage.getItem('games') || '[]');
    return games.find((g: Game) => g.id === id);
  },

  async getAllGames(): Promise<Game[]> {
    return JSON.parse(localStorage.getItem('games') || '[]');
  },

  async updateGame(game: Game): Promise<void> {
    const games = JSON.parse(localStorage.getItem('games') || '[]');
    const index = games.findIndex((g: Game) => g.id === game.id);
    if (index !== -1) {
      games[index] = game;
      localStorage.setItem('games', JSON.stringify(games));
    }
  },

  async createGameInstallation(installation: GameInstallation): Promise<void> {
    if (!localStorage.getItem('gameInstallations')) {
      localStorage.setItem('gameInstallations', JSON.stringify([]));
    }
    const installations = JSON.parse(localStorage.getItem('gameInstallations') || '[]');
    installations.push(installation);
    localStorage.setItem('gameInstallations', JSON.stringify(installations));
  },

  async getGameInstallationsByClient(clientId: string): Promise<GameInstallation[]> {
    const installations = JSON.parse(localStorage.getItem('gameInstallations') || '[]');
    return installations.filter((i: GameInstallation) => i.clientId === clientId);
  },

  async getGameInstallationsByGame(gameId: string): Promise<GameInstallation[]> {
    const installations = JSON.parse(localStorage.getItem('gameInstallations') || '[]');
    return installations.filter((i: GameInstallation) => i.gameId === gameId);
  },

  async updateGameInstallation(installation: GameInstallation): Promise<void> {
    const installations = JSON.parse(localStorage.getItem('gameInstallations') || '[]');
    const index = installations.findIndex(
      (i: GameInstallation) => i.gameId === installation.gameId && i.clientId === installation.clientId
    );
    if (index !== -1) {
      installations[index] = installation;
      localStorage.setItem('gameInstallations', JSON.stringify(installations));
    }
  },

  async deleteGameInstallation(gameId: string, clientId: string): Promise<void> {
    const installations = JSON.parse(localStorage.getItem('gameInstallations') || '[]');
    const filtered = installations.filter(
      (i: GameInstallation) => !(i.gameId === gameId && i.clientId === clientId)
    );
    localStorage.setItem('gameInstallations', JSON.stringify(filtered));
  },

  // ========== CUSTOMER PROFILE METHODS ==========
  async createCustomerProfile(profile: CustomerProfile): Promise<void> {
    if (!localStorage.getItem('customerProfiles')) {
      localStorage.setItem('customerProfiles', JSON.stringify([]));
    }
    const profiles = JSON.parse(localStorage.getItem('customerProfiles') || '[]');
    profiles.push(profile);
    localStorage.setItem('customerProfiles', JSON.stringify(profiles));
  },

  async getCustomerProfile(userId: string): Promise<CustomerProfile | undefined> {
    const profiles = JSON.parse(localStorage.getItem('customerProfiles') || '[]');
    return profiles.find((p: CustomerProfile) => p.userId === userId);
  },

  async updateCustomerProfile(profile: CustomerProfile): Promise<void> {
    const profiles = JSON.parse(localStorage.getItem('customerProfiles') || '[]');
    const index = profiles.findIndex((p: CustomerProfile) => p.userId === profile.userId);
    if (index !== -1) {
      profiles[index] = profile;
      localStorage.setItem('customerProfiles', JSON.stringify(profiles));
    }
  },

  // ========== REMOTE ACTION METHODS ==========
  async createRemoteAction(action: RemoteControlAction): Promise<void> {
    if (!localStorage.getItem('remoteActions')) {
      localStorage.setItem('remoteActions', JSON.stringify([]));
    }
    const actions = JSON.parse(localStorage.getItem('remoteActions') || '[]');
    actions.push(action);
    localStorage.setItem('remoteActions', JSON.stringify(actions));
  },

  async updateRemoteAction(action: RemoteControlAction): Promise<void> {
    const actions = JSON.parse(localStorage.getItem('remoteActions') || '[]');
    const index = actions.findIndex((a: RemoteControlAction) => a.id === action.id);
    if (index !== -1) {
      actions[index] = action;
      localStorage.setItem('remoteActions', JSON.stringify(actions));
    }
  },

  async getRemoteActionsByClient(clientId: string): Promise<RemoteControlAction[]> {
    const actions = JSON.parse(localStorage.getItem('remoteActions') || '[]');
    return actions.filter((a: RemoteControlAction) => a.clientId === clientId);
  },

  // ========== BACKUP RECORD METHODS ==========
  async createBackupRecord(backup: BackupRecord): Promise<void> {
    if (!localStorage.getItem('backupRecords')) {
      localStorage.setItem('backupRecords', JSON.stringify([]));
    }
    const backups = JSON.parse(localStorage.getItem('backupRecords') || '[]');
    backups.push(backup);
    localStorage.setItem('backupRecords', JSON.stringify(backups));
  },

  async getAllBackupRecords(): Promise<BackupRecord[]> {
    return JSON.parse(localStorage.getItem('backupRecords') || '[]');
  },

  async deleteBackupRecord(id: string): Promise<void> {
    const backups = JSON.parse(localStorage.getItem('backupRecords') || '[]');
    const filtered = backups.filter((b: BackupRecord) => b.id !== id);
    localStorage.setItem('backupRecords', JSON.stringify(filtered));
  },

  // ========== NOTIFICATION METHODS ==========
  async createSentNotification(notification: SentNotification): Promise<void> {
    if (!localStorage.getItem('sentNotifications')) {
      localStorage.setItem('sentNotifications', JSON.stringify([]));
    }
    const notifications = JSON.parse(localStorage.getItem('sentNotifications') || '[]');
    notifications.push(notification);
    localStorage.setItem('sentNotifications', JSON.stringify(notifications));
  },

  async getSentNotificationsByUser(userId: string): Promise<SentNotification[]> {
    const notifications = JSON.parse(localStorage.getItem('sentNotifications') || '[]');
    return notifications.filter((n: SentNotification) => n.userId === userId);
  },
});

export const db = extendedDb;
