/**
 * Initialize Advanced Features with Sample Data
 */

import { db } from './databaseExtensions';
import { foodService } from './foodService';
import { promoService } from './promoService';
import { tournamentService } from './tournamentService';
import { gameLibraryService } from './gameLibraryService';

export async function initializeAdvancedFeatures(): Promise<void> {
  console.log('[Init] Initializing advanced features...');

  // Initialize Food & Beverage Menu
  await initializeFoodMenu();

  // Initialize Promotional Codes
  await initializePromoCodes();

  // Initialize Game Library
  await initializeGameLibrary();

  // Initialize Sample Tournaments
  await initializeTournaments();

  // Initialize Sample Reservations
  await initializeReservations();

  console.log('[Init] Advanced features initialized!');
}

async function initializeFoodMenu() {
  const foodItems = [
    { name: 'Samosa', category: 'snacks' as const, price: 15, description: 'Crispy vegetable samosa', stock: 50 },
    { name: 'Chips', category: 'snacks' as const, price: 20, description: 'Assorted chips', stock: 100 },
    { name: 'Sandwich', category: 'snacks' as const, price: 40, description: 'Veg cheese sandwich', stock: 30 },
    { name: 'Pizza Slice', category: 'snacks' as const, price: 60, description: 'Large pizza slice', stock: 20 },
    { name: 'French Fries', category: 'snacks' as const, price: 50, description: 'Crispy fries', stock: 40 },

    { name: 'Coca-Cola', category: 'drinks' as const, price: 20, description: '300ml bottle', stock: 100 },
    { name: 'Pepsi', category: 'drinks' as const, price: 20, description: '300ml bottle', stock: 100 },
    { name: 'Mountain Dew', category: 'drinks' as const, price: 20, description: '300ml bottle', stock: 80 },
    { name: 'Red Bull', category: 'drinks' as const, price: 125, description: 'Energy drink 250ml', stock: 50 },
    { name: 'Iced Coffee', category: 'drinks' as const, price: 60, description: 'Cold coffee', stock: 30 },

    { name: 'Burger', category: 'meals' as const, price: 80, description: 'Veg burger with fries', stock: 25 },
    { name: 'Pasta', category: 'meals' as const, price: 90, description: 'White sauce pasta', stock: 20 },
    { name: 'Noodles', category: 'meals' as const, price: 70, description: 'Hakka noodles', stock: 30 },

    { name: 'Ice Cream', category: 'desserts' as const, price: 40, description: 'Assorted flavors', stock: 50 },
    { name: 'Brownie', category: 'desserts' as const, price: 50, description: 'Chocolate brownie', stock: 20 },
  ];

  for (const item of foodItems) {
    try {
      await foodService.addFoodItem(item.name, item.category, item.price, item.description, item.stock);
    } catch (e) {
      // Item might already exist
    }
  }

  console.log('[Init] Food menu initialized with', foodItems.length, 'items');
}

async function initializePromoCodes() {
  const promoCodes = [
    {
      code: 'WELCOME10',
      name: 'Welcome Discount',
      type: 'percentage' as const,
      value: 10,
      validFrom: new Date().toISOString(),
      validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      options: { minPurchase: 50 },
    },
    {
      code: 'FIRSTGAME',
      name: 'First Time Bonus',
      type: 'fixed' as const,
      value: 20,
      validFrom: new Date().toISOString(),
      validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      options: { usageLimit: 100 },
    },
    {
      code: 'WEEKEND50',
      name: 'Weekend Special',
      type: 'percentage' as const,
      value: 15,
      validFrom: new Date().toISOString(),
      validTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      options: { maxDiscount: 100 },
    },
    {
      code: 'FREEHOUR',
      name: 'Free Hour',
      type: 'free_time' as const,
      value: 60,
      validFrom: new Date().toISOString(),
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      options: { usageLimit: 50 },
    },
    {
      code: 'SILVER25',
      name: 'Silver Member Bonus',
      type: 'percentage' as const,
      value: 25,
      validFrom: new Date().toISOString(),
      validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      options: { applicableToMembership: ['silver' as const, 'gold' as const] },
    },
  ];

  for (const promo of promoCodes) {
    try {
      await promoService.createPromoCode(
        promo.code,
        promo.name,
        promo.type,
        promo.value,
        promo.validFrom,
        promo.validTo,
        promo.options
      );
    } catch (e) {
      // Promo might already exist
    }
  }

  console.log('[Init] Promo codes initialized:', promoCodes.length);
}

async function initializeGameLibrary() {
  const games = [
    { name: 'Counter-Strike: Global Offensive', category: 'fps' as const, size: 25, publisher: 'Valve', year: 2012 },
    { name: 'Valorant', category: 'fps' as const, size: 22, publisher: 'Riot Games', year: 2020 },
    { name: 'League of Legends', category: 'moba' as const, size: 12, publisher: 'Riot Games', year: 2009 },
    { name: 'Dota 2', category: 'moba' as const, size: 40, publisher: 'Valve', year: 2013 },
    { name: 'GTA V', category: 'casual' as const, size: 95, publisher: 'Rockstar', year: 2013 },
    { name: 'Fortnite', category: 'fps' as const, size: 30, publisher: 'Epic Games', year: 2017 },
    { name: 'Apex Legends', category: 'fps' as const, size: 75, publisher: 'EA', year: 2019 },
    { name: 'Minecraft', category: 'casual' as const, size: 2, publisher: 'Mojang', year: 2011 },
    { name: 'FIFA 24', category: 'sports' as const, size: 50, publisher: 'EA Sports', year: 2023 },
    { name: 'Rocket League', category: 'sports' as const, size: 20, publisher: 'Psyonix', year: 2015 },
    { name: 'Call of Duty: Warzone', category: 'fps' as const, size: 125, publisher: 'Activision', year: 2020 },
    { name: 'Overwatch 2', category: 'fps' as const, size: 50, publisher: 'Blizzard', year: 2022 },
    { name: 'Among Us', category: 'casual' as const, size: 1, publisher: 'Innersloth', year: 2018 },
    { name: 'PUBG: Battlegrounds', category: 'fps' as const, size: 40, publisher: 'KRAFTON', year: 2017 },
    { name: 'Rainbow Six Siege', category: 'fps' as const, size: 85, publisher: 'Ubisoft', year: 2015 },
  ];

  const installedGames = ['Counter-Strike: Global Offensive', 'Valorant', 'GTA V', 'Minecraft'];

  for (const game of games) {
    try {
      const addedGame = await gameLibraryService.addGame(game.name, game.category, game.size, {
        publisher: game.publisher,
        releaseYear: game.year,
      });

      // Install popular games on all PCs
      if (installedGames.includes(game.name)) {
        for (let i = 1; i <= 5; i++) {
          try {
            await gameLibraryService.installGame(addedGame.id, `PC-${i}`);
          } catch (e) {
            // Already installed
          }
        }
      }
    } catch (e) {
      // Game might already exist
    }
  }

  console.log('[Init] Game library initialized with', games.length, 'games');
}

async function initializeTournaments() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(18, 0, 0, 0);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(16, 0, 0, 0);

  const tournaments = [
    {
      name: 'CS:GO Weekly Championship',
      game: 'Counter-Strike: Global Offensive',
      format: 'single_elimination' as const,
      startTime: tomorrow.toISOString(),
      maxParticipants: 16,
      entryFee: 100,
      prizePool: 1000,
      prizes: [
        { position: 1, amount: 600 },
        { position: 2, amount: 300 },
        { position: 3, amount: 100 },
      ],
    },
    {
      name: 'Valorant Friday Night',
      game: 'Valorant',
      format: 'double_elimination' as const,
      startTime: nextWeek.toISOString(),
      maxParticipants: 8,
      entryFee: 150,
      prizePool: 1000,
      prizes: [
        { position: 1, amount: 500 },
        { position: 2, amount: 300 },
        { position: 3, amount: 200 },
      ],
    },
  ];

  for (const tournament of tournaments) {
    try {
      await tournamentService.createTournament(
        tournament.name,
        tournament.game,
        tournament.format,
        tournament.startTime,
        tournament.maxParticipants,
        tournament.entryFee,
        tournament.prizePool,
        tournament.prizes,
        'admin'
      );
    } catch (e) {
      // Tournament might already exist
    }
  }

  console.log('[Init] Tournaments initialized:', tournaments.length);
}

async function initializeReservations() {
  // Sample reservations could be added here if needed
  console.log('[Init] Reservations initialized');
}
