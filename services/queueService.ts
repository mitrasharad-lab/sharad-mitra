/**
 * Queue Management Service
 * Handles waiting list when all PCs are occupied
 */

import { QueueEntry, QueueStatus } from '../gaming-types';
import { db } from './databaseService';

class QueueService {
  /**
   * Add user to queue
   */
  async joinQueue(userId: string, userName: string, phone?: string): Promise<QueueEntry> {
    // Check if user is already in queue
    const existingEntry = await this.getUserQueueEntry(userId);
    if (existingEntry && existingEntry.status === 'waiting') {
      throw new Error('You are already in the queue');
    }

    // Get current queue length
    const currentQueue = await this.getActiveQueue();
    const position = currentQueue.length + 1;

    // Estimate wait time (15 minutes per person as average)
    const estimatedWaitTime = position * 15;

    const queueEntry: QueueEntry = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      userId,
      userName,
      phone,
      joinedAt: new Date().toISOString(),
      estimatedWaitTime,
      status: 'waiting',
      position,
    };

    await db.createQueueEntry(queueEntry);

    await db.createActivityLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      type: 'system',
      userId,
      userName,
      description: `User joined queue at position ${position}`,
      metadata: { queueEntryId: queueEntry.id, position },
    });

    return queueEntry;
  }

  /**
   * Get active queue
   */
  async getActiveQueue(): Promise<QueueEntry[]> {
    const allEntries = await db.getAllQueueEntries();
    return allEntries
      .filter(entry => entry.status === 'waiting')
      .sort((a, b) => a.position - b.position);
  }

  /**
   * Get user's queue entry
   */
  async getUserQueueEntry(userId: string): Promise<QueueEntry | null> {
    const allEntries = await db.getAllQueueEntries();
    const userEntries = allEntries.filter(entry => entry.userId === userId && entry.status === 'waiting');
    return userEntries[0] || null;
  }

  /**
   * Notify next person in queue
   */
  async notifyNext(): Promise<QueueEntry | null> {
    const queue = await this.getActiveQueue();
    if (queue.length === 0) return null;

    const nextEntry = queue[0];
    nextEntry.status = 'notified';
    nextEntry.notifiedAt = new Date().toISOString();
    nextEntry.expiresAt = new Date(Date.now() + 10 * 60000).toISOString(); // 10 minutes to respond

    await db.updateQueueEntry(nextEntry);

    // Send notification
    console.log(`Notifying ${nextEntry.userName} - PC is available`);

    await db.createActivityLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      type: 'system',
      userId: nextEntry.userId,
      userName: nextEntry.userName,
      description: `User notified - PC available`,
      metadata: { queueEntryId: nextEntry.id },
    });

    return nextEntry;
  }

  /**
   * Mark entry as served
   */
  async markServed(queueEntryId: string): Promise<void> {
    const entry = await db.getQueueEntry(queueEntryId);
    if (!entry) {
      throw new Error('Queue entry not found');
    }

    entry.status = 'served';
    await db.updateQueueEntry(entry);

    // Update positions for remaining queue
    await this.updatePositions();
  }

  /**
   * Remove from queue
   */
  async removeFromQueue(queueEntryId: string): Promise<void> {
    await db.deleteQueueEntry(queueEntryId);
    await this.updatePositions();
  }

  /**
   * Update positions after someone leaves
   */
  private async updatePositions(): Promise<void> {
    const queue = await this.getActiveQueue();

    for (let i = 0; i < queue.length; i++) {
      queue[i].position = i + 1;
      queue[i].estimatedWaitTime = (i + 1) * 15;
      await db.updateQueueEntry(queue[i]);
    }
  }

  /**
   * Check for expired notifications
   */
  async checkExpiredNotifications(): Promise<void> {
    const allEntries = await db.getAllQueueEntries();
    const now = new Date();

    for (const entry of allEntries) {
      if (entry.status === 'notified' && entry.expiresAt) {
        const expiryTime = new Date(entry.expiresAt);
        if (now > expiryTime) {
          entry.status = 'expired';
          await db.updateQueueEntry(entry);

          await db.createActivityLog({
            id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            timestamp: new Date().toISOString(),
            type: 'system',
            userId: entry.userId,
            userName: entry.userName,
            description: `Queue notification expired`,
            metadata: { queueEntryId: entry.id },
          });

          // Notify next person
          await this.notifyNext();
        }
      }
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const queue = await this.getActiveQueue();
    const allEntries = await db.getAllQueueEntries();

    return {
      currentLength: queue.length,
      longestWaitTime: queue.length > 0 ? queue[queue.length - 1].estimatedWaitTime : 0,
      totalServedToday: allEntries.filter(e =>
        e.status === 'served' &&
        e.joinedAt.startsWith(new Date().toISOString().split('T')[0])
      ).length,
      averageWaitTime: 15, // Can be calculated from historical data
    };
  }
}

export const queueService = new QueueService();
