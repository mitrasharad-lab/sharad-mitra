/**
 * Game Library Service
 * Manages game catalog and installations across PCs
 */

import { Game, GameCategory, GameInstallation } from '../gaming-types';
import { db } from './databaseService';

class GameLibraryService {
  /**
   * Add game to library
   */
  async addGame(
    name: string,
    category: GameCategory,
    size: number,
    options?: {
      publisher?: string;
      releaseYear?: number;
      minSpecs?: {
        cpu: string;
        gpu: string;
        ram: string;
        storage: string;
      };
      imageUrl?: string;
    }
  ): Promise<Game> {
    // Check if game already exists
    const existing = await this.getGameByName(name);
    if (existing) {
      throw new Error('Game already exists in library');
    }

    const game: Game = {
      id: `game-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name,
      category,
      size,
      publisher: options?.publisher,
      releaseYear: options?.releaseYear,
      minSpecs: options?.minSpecs,
      imageUrl: options?.imageUrl,
      isPopular: false,
      playCount: 0,
    };

    await db.createGame(game);

    await db.createActivityLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      type: 'system',
      description: `Game added to library: ${name} (${category}, ${size}GB)`,
      metadata: { gameId: game.id },
    });

    return game;
  }

  /**
   * Install game on client PC
   */
  async installGame(gameId: string, clientId: string, version?: string): Promise<void> {
    const game = await db.getGame(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    const client = await db.getClient(clientId);
    if (!client) {
      throw new Error('Client PC not found');
    }

    // Check if already installed
    const existing = await this.getGameInstallation(gameId, clientId);
    if (existing) {
      throw new Error('Game already installed on this PC');
    }

    const installation: GameInstallation = {
      gameId,
      clientId,
      installedAt: new Date().toISOString(),
      version,
    };

    await db.createGameInstallation(installation);

    // Update client's installed games list
    if (client.installedGames && !client.installedGames.includes(game.name)) {
      client.installedGames.push(game.name);
      await db.updateClient(client);
    }

    await db.createActivityLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      type: 'system',
      clientId,
      description: `Game installed: ${game.name} on ${clientId}`,
      metadata: { gameId, clientId, version },
    });
  }

  /**
   * Uninstall game from client PC
   */
  async uninstallGame(gameId: string, clientId: string): Promise<void> {
    const installation = await this.getGameInstallation(gameId, clientId);
    if (!installation) {
      throw new Error('Game not installed on this PC');
    }

    await db.deleteGameInstallation(gameId, clientId);

    // Update client's installed games list
    const client = await db.getClient(clientId);
    const game = await db.getGame(gameId);

    if (client && game && client.installedGames) {
      client.installedGames = client.installedGames.filter(g => g !== game.name);
      await db.updateClient(client);
    }

    await db.createActivityLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      type: 'system',
      clientId,
      description: `Game uninstalled: ${game?.name} from ${clientId}`,
      metadata: { gameId, clientId },
    });
  }

  /**
   * Get game installation status
   */
  async getGameInstallation(gameId: string, clientId: string): Promise<GameInstallation | null> {
    const installations = await db.getGameInstallationsByClient(clientId);
    return installations.find(i => i.gameId === gameId) || null;
  }

  /**
   * Get all games installed on a client
   */
  async getClientGames(clientId: string): Promise<Game[]> {
    const installations = await db.getGameInstallationsByClient(clientId);
    const games: Game[] = [];

    for (const installation of installations) {
      const game = await db.getGame(installation.gameId);
      if (game) {
        games.push(game);
      }
    }

    return games;
  }

  /**
   * Get all clients where a game is installed
   */
  async getGameClients(gameId: string): Promise<string[]> {
    const installations = await db.getGameInstallationsByGame(gameId);
    return installations.map(i => i.clientId);
  }

  /**
   * Update game played status
   */
  async recordGamePlay(gameId: string, clientId: string): Promise<void> {
    const game = await db.getGame(gameId);
    if (game) {
      game.playCount++;
      await db.updateGame(game);

      // Update last played for installation
      const installation = await this.getGameInstallation(gameId, clientId);
      if (installation) {
        installation.lastPlayed = new Date().toISOString();
        await db.updateGameInstallation(installation);
      }
    }
  }

  /**
   * Get popular games
   */
  async getPopularGames(limit: number = 10): Promise<Game[]> {
    const allGames = await db.getAllGames();
    return allGames
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, limit);
  }

  /**
   * Get games by category
   */
  async getGamesByCategory(category: GameCategory): Promise<Game[]> {
    const allGames = await db.getAllGames();
    return allGames.filter(game => game.category === category);
  }

  /**
   * Search games
   */
  async searchGames(query: string): Promise<Game[]> {
    const allGames = await db.getAllGames();
    const lowerQuery = query.toLowerCase();

    return allGames.filter(game =>
      game.name.toLowerCase().includes(lowerQuery) ||
      game.publisher?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get game by name
   */
  async getGameByName(name: string): Promise<Game | null> {
    const allGames = await db.getAllGames();
    return allGames.find(g => g.name.toLowerCase() === name.toLowerCase()) || null;
  }

  /**
   * Get full game library
   */
  async getAllGames(): Promise<Game[]> {
    return await db.getAllGames();
  }

  /**
   * Update game information
   */
  async updateGame(game: Game): Promise<void> {
    await db.updateGame(game);
  }

  /**
   * Get game statistics
   */
  async getGameStats(gameId: string) {
    const game = await db.getGame(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    const installations = await db.getGameInstallationsByGame(gameId);

    return {
      name: game.name,
      category: game.category,
      playCount: game.playCount,
      installedOnPCs: installations.length,
      clients: installations.map(i => i.clientId),
      lastPlayed: installations
        .filter(i => i.lastPlayed)
        .sort((a, b) => (b.lastPlayed || '').localeCompare(a.lastPlayed || ''))
        [0]?.lastPlayed,
    };
  }

  /**
   * Get installation recommendations (which games to install on which PCs)
   */
  async getInstallationRecommendations(): Promise<{ gameId: string; gameName: string; clientIds: string[] }[]> {
    const allGames = await db.getAllGames();
    const allClients = await db.getAllClients();
    const recommendations: { gameId: string; gameName: string; clientIds: string[] }[] = [];

    for (const game of allGames.sort((a, b) => b.playCount - a.playCount).slice(0, 20)) {
      const installations = await db.getGameInstallationsByGame(game.id);
      const installedClientIds = new Set(installations.map(i => i.clientId));

      const clientsNeedingInstall = allClients
        .filter(client => !installedClientIds.has(client.id))
        .map(c => c.id);

      if (clientsNeedingInstall.length > 0) {
        recommendations.push({
          gameId: game.id,
          gameName: game.name,
          clientIds: clientsNeedingInstall,
        });
      }
    }

    return recommendations;
  }

  /**
   * Calculate total storage used on a client
   */
  async getClientStorageUsage(clientId: string): Promise<{ totalGB: number; games: { name: string; size: number }[] }> {
    const clientGames = await this.getClientGames(clientId);

    const games = clientGames.map(game => ({
      name: game.name,
      size: game.size,
    }));

    const totalGB = games.reduce((sum, game) => sum + game.size, 0);

    return { totalGB, games };
  }
}

export const gameLibraryService = new GameLibraryService();
