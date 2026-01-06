/**
 * Initialization Service
 * Sets up default data on first run
 */

import { User, ClientPC, PricingRule, SystemConfig } from '../gaming-types';
import { db } from './databaseService';
import { simpleHash } from './authService';

export async function initializeSystem(): Promise<void> {
  console.log('[Init] Initializing Gaming Parlour System...');

  await db.initialize();

  // Check if already initialized
  const existingUsers = await db.getAllUsers();
  if (existingUsers.length > 0) {
    console.log('[Init] System already initialized');
    return;
  }

  console.log('[Init] First-time setup...');

  // Create default admin user
  const adminPasswordHash = await simpleHash('admin123');
  const adminUser: User = {
    id: 'user-admin',
    username: 'admin',
    passwordHash: adminPasswordHash,
    fullName: 'System Administrator',
    email: 'admin@gamingparlour.local',
    role: 'admin',
    membershipTier: 'gold',
    walletBalance: 0,
    createdAt: new Date().toISOString(),
    isActive: true,
  };
  await db.createUser(adminUser);

  // Create demo users
  const demoUsers: User[] = [
    {
      id: 'user-demo-1',
      username: 'demo1',
      passwordHash: await simpleHash('demo123'),
      fullName: 'Demo User 1',
      role: 'customer',
      membershipTier: 'bronze',
      walletBalance: 100,
      createdAt: new Date().toISOString(),
      isActive: true,
    },
    {
      id: 'user-demo-2',
      username: 'demo2',
      passwordHash: await simpleHash('demo123'),
      fullName: 'Demo User 2',
      role: 'customer',
      membershipTier: 'silver',
      walletBalance: 200,
      createdAt: new Date().toISOString(),
      isActive: true,
    },
  ];

  for (const user of demoUsers) {
    await db.createUser(user);
  }

  // Create 5 client PCs
  const clients: ClientPC[] = [
    {
      id: 'PC-1',
      name: 'Gaming PC 1',
      status: 'available',
      specifications: {
        cpu: 'Intel i7-12700K',
        gpu: 'NVIDIA RTX 3070',
        ram: '16GB DDR4',
        storage: '1TB NVMe SSD',
      },
      installedGames: ['CS:GO', 'Valorant', 'GTA V', 'Minecraft'],
    },
    {
      id: 'PC-2',
      name: 'Gaming PC 2',
      status: 'available',
      specifications: {
        cpu: 'Intel i7-12700K',
        gpu: 'NVIDIA RTX 3070',
        ram: '16GB DDR4',
        storage: '1TB NVMe SSD',
      },
      installedGames: ['CS:GO', 'Valorant', 'GTA V', 'Minecraft'],
    },
    {
      id: 'PC-3',
      name: 'Gaming PC 3',
      status: 'available',
      specifications: {
        cpu: 'AMD Ryzen 7 5800X',
        gpu: 'NVIDIA RTX 3080',
        ram: '32GB DDR4',
        storage: '2TB NVMe SSD',
      },
      installedGames: ['CS:GO', 'Valorant', 'GTA V', 'Minecraft', 'Cyberpunk 2077'],
    },
    {
      id: 'PC-4',
      name: 'Gaming PC 4',
      status: 'available',
      specifications: {
        cpu: 'Intel i5-12400F',
        gpu: 'NVIDIA RTX 3060',
        ram: '16GB DDR4',
        storage: '512GB NVMe SSD',
      },
      installedGames: ['CS:GO', 'Valorant', 'Minecraft', 'Fortnite'],
    },
    {
      id: 'PC-5',
      name: 'Gaming PC 5',
      status: 'available',
      specifications: {
        cpu: 'Intel i5-12400F',
        gpu: 'NVIDIA RTX 3060',
        ram: '16GB DDR4',
        storage: '512GB NVMe SSD',
      },
      installedGames: ['CS:GO', 'Valorant', 'Minecraft', 'Fortnite'],
    },
  ];

  for (const client of clients) {
    await db.createClient(client);
  }

  // Create default pricing rules
  const pricingRules: PricingRule[] = [
    {
      id: 'price-30min',
      name: '30 Minutes',
      duration: 30,
      price: 30,
      isActive: true,
    },
    {
      id: 'price-1hour',
      name: '1 Hour',
      duration: 60,
      price: 50,
      isActive: true,
    },
    {
      id: 'price-2hours',
      name: '2 Hours',
      duration: 120,
      price: 90,
      isActive: true,
    },
    {
      id: 'price-3hours',
      name: '3 Hours',
      duration: 180,
      price: 130,
      isActive: true,
    },
    {
      id: 'price-fullday',
      name: 'Full Day (8 Hours)',
      duration: 480,
      price: 400,
      isActive: true,
    },
  ];

  for (const rule of pricingRules) {
    await db.createPricingRule(rule);
  }

  // Create system config
  const config: SystemConfig = {
    warningTime: 5,
    gracePeriod: 2,
    autoLockOnExpiry: true,
    allowPause: true,
    maxPauseDuration: 15,
    enableNotifications: true,
    enableSound: true,
    currency: '₹',
    timezone: 'Asia/Kolkata',
    businessHours: {
      open: '10:00',
      close: '23:00',
    },
    masterPCId: 'MASTER',
  };

  await db.updateConfig(config);

  // Create initial activity log
  await db.createActivityLog({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'system',
    description: 'Gaming Parlour System initialized',
    metadata: {
      version: '1.0.0',
      clients: clients.length,
      users: 1 + demoUsers.length,
    },
  });

  console.log('[Init] System initialization complete!');
  console.log('[Init] Default admin credentials:');
  console.log('[Init]   Username: admin');
  console.log('[Init]   Password: admin123');
  console.log('[Init] Demo users: demo1/demo123, demo2/demo123');
}
