/**
 * Reservation Service
 * Handles PC reservations and booking management
 */

import { Reservation, ReservationStatus, ClientPC } from '../gaming-types';
import { db } from './databaseService';

class ReservationService {
  /**
   * Create a new reservation
   */
  async createReservation(
    userId: string,
    userName: string,
    clientId: string,
    startTime: string,
    duration: number,
    notes?: string
  ): Promise<Reservation> {
    // Check if client exists
    const client = await db.getClient(clientId);
    if (!client) {
      throw new Error('Client PC not found');
    }

    // Check for conflicts
    const conflicts = await this.checkConflicts(clientId, startTime, duration);
    if (conflicts.length > 0) {
      throw new Error('Time slot already reserved');
    }

    const reservation: Reservation = {
      id: `reservation-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      userId,
      userName,
      clientId,
      startTime,
      duration,
      status: 'pending',
      createdAt: new Date().toISOString(),
      notes,
      notificationSent: false,
    };

    await db.createReservation(reservation);

    await db.createActivityLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      type: 'system',
      userId,
      userName,
      clientId,
      description: `Reservation created for ${clientId} at ${startTime}`,
      metadata: { reservationId: reservation.id, duration },
    });

    return reservation;
  }

  /**
   * Check for reservation conflicts
   */
  async checkConflicts(
    clientId: string,
    startTime: string,
    duration: number
  ): Promise<Reservation[]> {
    const allReservations = await db.getReservationsByClient(clientId);
    const startMs = new Date(startTime).getTime();
    const endMs = startMs + duration * 60000;

    return allReservations.filter(res => {
      if (res.status === 'cancelled') return false;

      const resStartMs = new Date(res.startTime).getTime();
      const resEndMs = resStartMs + res.duration * 60000;

      // Check for overlap
      return (startMs < resEndMs && endMs > resStartMs);
    });
  }

  /**
   * Get upcoming reservations for a client
   */
  async getUpcomingReservations(clientId: string): Promise<Reservation[]> {
    const allReservations = await db.getReservationsByClient(clientId);
    const now = new Date().toISOString();

    return allReservations
      .filter(res => res.startTime > now && res.status !== 'cancelled')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  /**
   * Get user reservations
   */
  async getUserReservations(userId: string): Promise<Reservation[]> {
    return await db.getReservationsByUser(userId);
  }

  /**
   * Confirm reservation
   */
  async confirmReservation(reservationId: string): Promise<void> {
    const reservation = await db.getReservation(reservationId);
    if (!reservation) {
      throw new Error('Reservation not found');
    }

    reservation.status = 'confirmed';
    reservation.confirmedAt = new Date().toISOString();
    await db.updateReservation(reservation);
  }

  /**
   * Cancel reservation
   */
  async cancelReservation(reservationId: string, reason?: string): Promise<void> {
    const reservation = await db.getReservation(reservationId);
    if (!reservation) {
      throw new Error('Reservation not found');
    }

    reservation.status = 'cancelled';
    reservation.cancelledAt = new Date().toISOString();
    if (reason) {
      reservation.notes = (reservation.notes || '') + `\nCancellation reason: ${reason}`;
    }

    await db.updateReservation(reservation);

    await db.createActivityLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      type: 'system',
      userId: reservation.userId,
      userName: reservation.userName,
      clientId: reservation.clientId,
      description: `Reservation cancelled for ${reservation.clientId}`,
      metadata: { reservationId, reason },
    });
  }

  /**
   * Mark reservation as no-show
   */
  async markNoShow(reservationId: string): Promise<void> {
    const reservation = await db.getReservation(reservationId);
    if (!reservation) {
      throw new Error('Reservation not found');
    }

    reservation.status = 'no-show';
    await db.updateReservation(reservation);
  }

  /**
   * Complete reservation (when session actually starts)
   */
  async completeReservation(reservationId: string): Promise<void> {
    const reservation = await db.getReservation(reservationId);
    if (!reservation) {
      throw new Error('Reservation not found');
    }

    reservation.status = 'completed';
    await db.updateReservation(reservation);
  }

  /**
   * Get all reservations for today
   */
  async getTodayReservations(): Promise<Reservation[]> {
    const allReservations = await db.getAllReservations();
    const today = new Date().toISOString().split('T')[0];

    return allReservations.filter(res => res.startTime.startsWith(today));
  }

  /**
   * Check and send reminder notifications
   */
  async checkAndSendReminders(): Promise<void> {
    const allReservations = await db.getAllReservations();
    const now = new Date();
    const reminderTime = 30; // minutes before

    for (const reservation of allReservations) {
      if (reservation.status !== 'confirmed' || reservation.notificationSent) {
        continue;
      }

      const startTime = new Date(reservation.startTime);
      const timeDiff = (startTime.getTime() - now.getTime()) / 60000;

      if (timeDiff <= reminderTime && timeDiff > 0) {
        // Send notification (implement notification service)
        console.log(`Reminder: Reservation ${reservation.id} starts in ${Math.floor(timeDiff)} minutes`);

        reservation.notificationSent = true;
        await db.updateReservation(reservation);
      }
    }
  }
}

export const reservationService = new ReservationService();
