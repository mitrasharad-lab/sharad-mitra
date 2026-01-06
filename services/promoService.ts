/**
 * Promotional Code Service
 * Handles discount codes and promotional campaigns
 */

import { PromoCode, PromoUsage, PromoType, MembershipTier } from '../gaming-types';
import { db } from './databaseService';

class PromoService {
  /**
   * Create promotional code
   */
  async createPromoCode(
    code: string,
    name: string,
    type: PromoType,
    value: number,
    validFrom: string,
    validTo: string,
    options?: {
      minPurchase?: number;
      maxDiscount?: number;
      usageLimit?: number;
      applicableToMembership?: MembershipTier[];
    }
  ): Promise<PromoCode> {
    // Check if code already exists
    const existing = await this.getPromoByCode(code);
    if (existing) {
      throw new Error('Promo code already exists');
    }

    const promoCode: PromoCode = {
      id: `promo-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      code: code.toUpperCase(),
      name,
      type,
      value,
      validFrom,
      validTo,
      minPurchase: options?.minPurchase,
      maxDiscount: options?.maxDiscount,
      usageLimit: options?.usageLimit,
      usageCount: 0,
      isActive: true,
      applicableToMembership: options?.applicableToMembership,
    };

    await db.createPromoCode(promoCode);

    await db.createActivityLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      type: 'system',
      description: `Promo code created: ${code} - ${name}`,
      metadata: { promoCodeId: promoCode.id, type, value },
    });

    return promoCode;
  }

  /**
   * Validate and apply promo code
   */
  async applyPromoCode(
    code: string,
    userId: string,
    amount: number,
    membershipTier?: MembershipTier
  ): Promise<{ discountAmount: number; finalAmount: number; promoCode: PromoCode }> {
    const promoCode = await this.getPromoByCode(code);

    if (!promoCode) {
      throw new Error('Invalid promo code');
    }

    if (!promoCode.isActive) {
      throw new Error('Promo code is not active');
    }

    const now = new Date().toISOString();
    if (now < promoCode.validFrom || now > promoCode.validTo) {
      throw new Error('Promo code has expired or not yet valid');
    }

    if (promoCode.usageLimit && promoCode.usageCount >= promoCode.usageLimit) {
      throw new Error('Promo code usage limit reached');
    }

    if (promoCode.minPurchase && amount < promoCode.minPurchase) {
      throw new Error(`Minimum purchase of ₹${promoCode.minPurchase} required`);
    }

    if (promoCode.applicableToMembership && membershipTier) {
      if (!promoCode.applicableToMembership.includes(membershipTier)) {
        throw new Error('Promo code not applicable to your membership tier');
      }
    }

    // Calculate discount
    let discountAmount = 0;

    switch (promoCode.type) {
      case 'percentage':
        discountAmount = (amount * promoCode.value) / 100;
        if (promoCode.maxDiscount) {
          discountAmount = Math.min(discountAmount, promoCode.maxDiscount);
        }
        break;

      case 'fixed':
        discountAmount = promoCode.value;
        break;

      case 'free_time':
        // For free time, value represents minutes
        discountAmount = 0; // Handled differently
        break;
    }

    const finalAmount = Math.max(0, amount - discountAmount);

    return { discountAmount, finalAmount, promoCode };
  }

  /**
   * Record promo usage
   */
  async recordUsage(
    promoCodeId: string,
    userId: string,
    discountAmount: number,
    sessionId?: string
  ): Promise<void> {
    const promoUsage: PromoUsage = {
      id: `usage-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      promoCodeId,
      userId,
      sessionId,
      discountAmount,
      usedAt: new Date().toISOString(),
    };

    await db.createPromoUsage(promoUsage);

    // Update usage count
    const promoCode = await db.getPromoCode(promoCodeId);
    if (promoCode) {
      promoCode.usageCount++;
      await db.updatePromoCode(promoCode);
    }
  }

  /**
   * Get promo code by code string
   */
  async getPromoByCode(code: string): Promise<PromoCode | null> {
    const allPromos = await db.getAllPromoCodes();
    return allPromos.find(p => p.code === code.toUpperCase()) || null;
  }

  /**
   * Get all active promo codes
   */
  async getActivePromoCodes(): Promise<PromoCode[]> {
    const allPromos = await db.getAllPromoCodes();
    const now = new Date().toISOString();

    return allPromos.filter(promo =>
      promo.isActive &&
      promo.validFrom <= now &&
      promo.validTo >= now &&
      (!promo.usageLimit || promo.usageCount < promo.usageLimit)
    );
  }

  /**
   * Deactivate promo code
   */
  async deactivatePromoCode(promoCodeId: string): Promise<void> {
    const promoCode = await db.getPromoCode(promoCodeId);
    if (!promoCode) {
      throw new Error('Promo code not found');
    }

    promoCode.isActive = false;
    await db.updatePromoCode(promoCode);
  }

  /**
   * Get promo usage statistics
   */
  async getPromoStats(promoCodeId: string) {
    const promoCode = await db.getPromoCode(promoCodeId);
    if (!promoCode) {
      throw new Error('Promo code not found');
    }

    const usages = await db.getPromoUsagesByPromoCode(promoCodeId);

    return {
      code: promoCode.code,
      name: promoCode.name,
      usageCount: promoCode.usageCount,
      usageLimit: promoCode.usageLimit || 'Unlimited',
      totalDiscount: usages.reduce((sum, usage) => sum + usage.discountAmount, 0),
      uniqueUsers: new Set(usages.map(u => u.userId)).size,
      averageDiscount: usages.length > 0
        ? usages.reduce((sum, usage) => sum + usage.discountAmount, 0) / usages.length
        : 0,
    };
  }

  /**
   * Get user's promo usage history
   */
  async getUserPromoHistory(userId: string): Promise<PromoUsage[]> {
    return await db.getPromoUsagesByUser(userId);
  }

  /**
   * Generate unique promo code
   */
  generatePromoCode(prefix: string = 'GAME', length: number = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = prefix;

    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return code;
  }

  /**
   * Create bulk promo codes (for campaigns)
   */
  async createBulkPromoCodes(
    quantity: number,
    name: string,
    type: PromoType,
    value: number,
    validFrom: string,
    validTo: string,
    options?: {
      minPurchase?: number;
      maxDiscount?: number;
      usageLimit?: number;
    }
  ): Promise<PromoCode[]> {
    const promoCodes: PromoCode[] = [];

    for (let i = 0; i < quantity; i++) {
      let code = this.generatePromoCode();

      // Ensure uniqueness
      while (await this.getPromoByCode(code)) {
        code = this.generatePromoCode();
      }

      const promoCode = await this.createPromoCode(
        code,
        `${name} #${i + 1}`,
        type,
        value,
        validFrom,
        validTo,
        options
      );

      promoCodes.push(promoCode);
    }

    return promoCodes;
  }
}

export const promoService = new PromoService();
