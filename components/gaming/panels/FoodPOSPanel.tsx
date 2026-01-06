/**
 * Food & Beverage POS Panel
 * Complete point-of-sale system for food orders
 */

import React, { useState, useEffect } from 'react';
import { FoodItem, FoodOrder, FoodCategory } from '../../../gaming-types';
import { foodService } from '../../../services/foodService';
import { db } from '../../../services/databaseExtensions';

const FoodPOSPanel: React.FC = () => {
  const [menu, setMenu] = useState<FoodItem[]>([]);
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | 'all'>('all');
  const [showAddItem, setShowAddItem] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [menuData, ordersData, statsData] = await Promise.all([
      foodService.getFullMenu(),
      foodService.getActiveOrders(),
      foodService.getSalesStats(),
    ]);

    setMenu(menuData);
    setOrders(ordersData);
    setStats(statsData);
  };

  const filteredMenu = selectedCategory === 'all'
    ? menu
    : menu.filter(item => item.category === selectedCategory);

  const categories: Array<FoodCategory | 'all'> = ['all', 'snacks', 'drinks', 'meals', 'desserts'];

  const updateOrderStatus = async (orderId: string, status: any) => {
    await foodService.updateOrderStatus(orderId, status);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Food & Beverage POS</h2>
        <button
          onClick={() => setShowAddItem(true)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
        >
          + Add Menu Item
        </button>
      </div>

      {/* Sales Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-600 rounded-xl p-4">
            <p className="text-sm text-white/80">Today's Revenue</p>
            <p className="text-2xl font-bold">₹{stats.todayRevenue}</p>
          </div>
          <div className="bg-blue-600 rounded-xl p-4">
            <p className="text-sm text-white/80">Total Orders</p>
            <p className="text-2xl font-bold">{stats.todayOrders}</p>
          </div>
          <div className="bg-purple-600 rounded-xl p-4">
            <p className="text-sm text-white/80">Active Orders</p>
            <p className="text-2xl font-bold">{orders.length}</p>
          </div>
          <div className="bg-yellow-600 rounded-xl p-4">
            <p className="text-sm text-white/80">Top Item</p>
            <p className="text-sm font-bold">{stats.topSellingItem?.name || 'N/A'}</p>
          </div>
        </div>
      )}

      {/* Active Orders */}
      {orders.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Active Orders ({orders.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map(order => (
              <div key={order.id} className="bg-black/30 rounded-lg p-4 border border-white/10">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold">{order.userName}</p>
                    <p className="text-xs text-gray-400">{order.clientId || 'Counter'}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    order.status === 'pending' ? 'bg-yellow-600' :
                    order.status === 'preparing' ? 'bg-blue-600' :
                    order.status === 'ready' ? 'bg-green-600' : 'bg-gray-600'
                  }`}>
                    {order.status}
                  </span>
                </div>

                <div className="mb-3">
                  {order.items.map((item, idx) => (
                    <p key={idx} className="text-sm">
                      {item.quantity}x {item.foodItemName}
                    </p>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-white/10">
                  <p className="font-bold">₹{order.totalAmount}</p>
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                      >
                        Start
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                      >
                        Ready
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs"
                      >
                        Deliver
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Menu Management */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4">Menu Management</h3>

        {/* Category Filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg capitalize transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredMenu.map(item => (
            <div key={item.id} className="bg-black/30 rounded-lg p-4 border border-white/10">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="font-bold">{item.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{item.category}</p>
                </div>
                <span className={`w-2 h-2 rounded-full ${item.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>

              {item.description && (
                <p className="text-xs text-gray-400 mb-2">{item.description}</p>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <p className="text-lg font-bold">₹{item.price}</p>
                {item.stockQuantity !== undefined && (
                  <p className="text-xs text-gray-400">
                    Stock: {item.stockQuantity}
                  </p>
                )}
              </div>

              {item.stockQuantity !== undefined && item.stockQuantity < 10 && (
                <p className="text-xs text-red-400 mt-2">⚠️ Low stock!</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FoodPOSPanel;
