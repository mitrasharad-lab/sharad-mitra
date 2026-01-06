/**
 * Food & Beverage POS Service
 * Handles food orders, menu management, and inventory
 */

import { FoodItem, FoodOrder, OrderStatus, FoodCategory, PaymentMethod } from '../gaming-types';
import { db } from './databaseService';

class FoodService {
  /**
   * Create food order
   */
  async createOrder(
    userId: string,
    userName: string,
    items: { foodItemId: string; quantity: number }[],
    paymentMethod: PaymentMethod,
    clientId?: string,
    notes?: string
  ): Promise<FoodOrder> {
    // Validate items and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const foodItem = await db.getFoodItem(item.foodItemId);
      if (!foodItem) {
        throw new Error(`Food item ${item.foodItemId} not found`);
      }
      if (!foodItem.isAvailable) {
        throw new Error(`${foodItem.name} is not available`);
      }
      if (foodItem.stockQuantity !== undefined && foodItem.stockQuantity < item.quantity) {
        throw new Error(`Insufficient stock for ${foodItem.name}`);
      }

      orderItems.push({
        foodItemId: item.foodItemId,
        foodItemName: foodItem.name,
        quantity: item.quantity,
        price: foodItem.price,
      });

      totalAmount += foodItem.price * item.quantity;

      // Update stock
      if (foodItem.stockQuantity !== undefined) {
        foodItem.stockQuantity -= item.quantity;
        await db.updateFoodItem(foodItem);
      }
    }

    const order: FoodOrder = {
      id: `order-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      userId,
      userName,
      clientId,
      items: orderItems,
      totalAmount,
      status: 'pending',
      orderTime: new Date().toISOString(),
      paymentMethod,
      notes,
    };

    await db.createFoodOrder(order);

    // Create payment record
    await db.createPayment({
      id: `payment-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      sessionId: '',
      userId,
      userName,
      clientId: clientId || 'COUNTER',
      amount: totalAmount,
      method: paymentMethod,
      timestamp: new Date().toISOString(),
      duration: 0,
      description: `Food order: ${orderItems.map(i => `${i.quantity}x ${i.foodItemName}`).join(', ')}`,
    });

    await db.createActivityLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      type: 'payment',
      userId,
      userName,
      clientId,
      description: `Food order placed: ${orderItems.length} items, ₹${totalAmount}`,
      metadata: { orderId: order.id, items: orderItems },
    });

    return order;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const order = await db.getFoodOrder(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    order.status = status;
    if (status === 'delivered') {
      order.deliveryTime = new Date().toISOString();
    }

    await db.updateFoodOrder(order);
  }

  /**
   * Get active orders
   */
  async getActiveOrders(): Promise<FoodOrder[]> {
    const allOrders = await db.getAllFoodOrders();
    return allOrders.filter(order =>
      order.status === 'pending' || order.status === 'preparing' || order.status === 'ready'
    );
  }

  /**
   * Get user orders
   */
  async getUserOrders(userId: string): Promise<FoodOrder[]> {
    return await db.getFoodOrdersByUser(userId);
  }

  /**
   * Add food item to menu
   */
  async addFoodItem(
    name: string,
    category: FoodCategory,
    price: number,
    description?: string,
    stockQuantity?: number,
    imageUrl?: string
  ): Promise<FoodItem> {
    const foodItem: FoodItem = {
      id: `food-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name,
      category,
      price,
      description,
      imageUrl,
      isAvailable: true,
      stockQuantity,
    };

    await db.createFoodItem(foodItem);

    await db.createActivityLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      type: 'system',
      description: `Food item added: ${name} - ₹${price}`,
      metadata: { foodItemId: foodItem.id },
    });

    return foodItem;
  }

  /**
   * Update food item
   */
  async updateFoodItem(foodItem: FoodItem): Promise<void> {
    await db.updateFoodItem(foodItem);
  }

  /**
   * Get menu by category
   */
  async getMenuByCategory(category: FoodCategory): Promise<FoodItem[]> {
    const allItems = await db.getAllFoodItems();
    return allItems.filter(item => item.category === category && item.isAvailable);
  }

  /**
   * Get full menu
   */
  async getFullMenu(): Promise<FoodItem[]> {
    return await db.getAllFoodItems();
  }

  /**
   * Get sales statistics
   */
  async getSalesStats(startDate?: string, endDate?: string) {
    const allOrders = await db.getAllFoodOrders();
    const today = new Date().toISOString().split('T')[0];

    const filteredOrders = allOrders.filter(order => {
      if (startDate && order.orderTime < startDate) return false;
      if (endDate && order.orderTime > endDate) return false;
      return order.status === 'delivered';
    });

    const todayOrders = allOrders.filter(order =>
      order.orderTime.startsWith(today) && order.status === 'delivered'
    );

    // Count items
    const itemSales: Record<string, { name: string; quantity: number; revenue: number }> = {};

    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        if (!itemSales[item.foodItemId]) {
          itemSales[item.foodItemId] = {
            name: item.foodItemName,
            quantity: 0,
            revenue: 0,
          };
        }
        itemSales[item.foodItemId].quantity += item.quantity;
        itemSales[item.foodItemId].revenue += item.price * item.quantity;
      });
    });

    return {
      totalRevenue: filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      todayRevenue: todayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      totalOrders: filteredOrders.length,
      todayOrders: todayOrders.length,
      itemSales: Object.values(itemSales).sort((a, b) => b.revenue - a.revenue),
      topSellingItem: Object.values(itemSales).sort((a, b) => b.quantity - a.quantity)[0],
    };
  }

  /**
   * Update stock quantity
   */
  async updateStock(foodItemId: string, quantity: number): Promise<void> {
    const item = await db.getFoodItem(foodItemId);
    if (!item) {
      throw new Error('Food item not found');
    }

    item.stockQuantity = quantity;
    await db.updateFoodItem(item);
  }

  /**
   * Get low stock items
   */
  async getLowStockItems(threshold: number = 10): Promise<FoodItem[]> {
    const allItems = await db.getAllFoodItems();
    return allItems.filter(item =>
      item.stockQuantity !== undefined &&
      item.stockQuantity < threshold &&
      item.isAvailable
    );
  }
}

export const foodService = new FoodService();
