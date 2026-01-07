/**
 * Game Launch Service
 * Handles launching games and tracking game sessions
 */

import {
  LaunchedGame,
  GameLaunchEvent,
  GameLaunchStatus,
  Game,
} from '../gaming-types';

class GameLaunchService {
  private launchedGames: Map<string, LaunchedGame> = new Map();
  private gameLaunchEvents: GameLaunchEvent[] = [];
  private heartbeatIntervals: Map<string, number> = new Map();
  private storageKey = 'gaming_launched_games';

  constructor() {
    this.loadLaunchedGames();
  }

  /**
   * Load launched games from localStorage
   */
  private loadLaunchedGames() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const games: LaunchedGame[] = JSON.parse(stored);
        games.forEach(game => {
          this.launchedGames.set(game.id, game);
        });
      }
    } catch (error) {
      console.error('Failed to load launched games:', error);
    }
  }

  /**
   * Save launched games to localStorage
   */
  private saveLaunchedGames() {
    try {
      const games = Array.from(this.launchedGames.values());
      localStorage.setItem(this.storageKey, JSON.stringify(games));
    } catch (error) {
      console.error('Failed to save launched games:', error);
    }
  }

  /**
   * Launch a game
   */
  async launchGame(
    game: Game,
    sessionId: string,
    userId: string,
    clientId: string
  ): Promise<LaunchedGame> {
    // Check if game is already running for this session
    const existing = this.getActiveGameForSession(sessionId);
    if (existing) {
      throw new Error('Another game is already running. Please stop it first.');
    }

    const launchedGame: LaunchedGame = {
      id: 'launched_' + Date.now(),
      gameId: game.id,
      gameName: game.name,
      sessionId,
      userId,
      clientId,
      status: 'launching',
      launchedAt: new Date().toISOString(),
      playtimeMinutes: 0,
    };

    this.launchedGames.set(launchedGame.id, launchedGame);
    this.saveLaunchedGames();

    // Log launch event
    this.logEvent(launchedGame.id, 'launch');

    // Simulate game launch (in production, this would communicate with game launcher)
    setTimeout(() => {
      this.updateGameStatus(launchedGame.id, 'running');
      this.startHeartbeat(launchedGame.id);
    }, 2000);

    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('game_launched', {
      detail: { launchedGame },
    }));

    return launchedGame;
  }

  /**
   * Update game status
   */
  updateGameStatus(launchedGameId: string, status: GameLaunchStatus): void {
    const game = this.launchedGames.get(launchedGameId);
    if (!game) return;

    game.status = status;
    game.lastHeartbeat = new Date().toISOString();
    this.saveLaunchedGames();

    // Log status change event
    this.logEvent(launchedGameId, status === 'running' ? 'resume' : status === 'paused' ? 'pause' : 'stop');

    // Dispatch event
    window.dispatchEvent(new CustomEvent('game_status_changed', {
      detail: { launchedGame: game },
    }));
  }

  /**
   * Pause game
   */
  pauseGame(launchedGameId: string): void {
    this.updateGameStatus(launchedGameId, 'paused');
    this.stopHeartbeat(launchedGameId);
  }

  /**
   * Resume game
   */
  resumeGame(launchedGameId: string): void {
    this.updateGameStatus(launchedGameId, 'running');
    this.startHeartbeat(launchedGameId);
  }

  /**
   * Stop game
   */
  stopGame(launchedGameId: string): void {
    const game = this.launchedGames.get(launchedGameId);
    if (!game) return;

    game.status = 'stopped';
    game.stoppedAt = new Date().toISOString();
    this.stopHeartbeat(launchedGameId);
    this.saveLaunchedGames();

    // Log stop event
    this.logEvent(launchedGameId, 'stop');

    // Dispatch event
    window.dispatchEvent(new CustomEvent('game_stopped', {
      detail: { launchedGame: game },
    }));
  }

  /**
   * Get active game for a session
   */
  getActiveGameForSession(sessionId: string): LaunchedGame | null {
    return Array.from(this.launchedGames.values())
      .find(game =>
        game.sessionId === sessionId &&
        (game.status === 'launching' || game.status === 'running' || game.status === 'paused')
      ) || null;
  }

  /**
   * Get all launched games for a session
   */
  getGamesForSession(sessionId: string): LaunchedGame[] {
    return Array.from(this.launchedGames.values())
      .filter(game => game.sessionId === sessionId);
  }

  /**
   * Get launched game by ID
   */
  getLaunchedGame(launchedGameId: string): LaunchedGame | null {
    return this.launchedGames.get(launchedGameId) || null;
  }

  /**
   * Start heartbeat for playtime tracking
   */
  private startHeartbeat(launchedGameId: string): void {
    // Clear existing interval if any
    this.stopHeartbeat(launchedGameId);

    // Update playtime every minute
    const interval = window.setInterval(() => {
      const game = this.launchedGames.get(launchedGameId);
      if (game && game.status === 'running') {
        game.playtimeMinutes += 1;
        game.lastHeartbeat = new Date().toISOString();
        this.saveLaunchedGames();

        // Log heartbeat event
        this.logEvent(launchedGameId, 'heartbeat', {
          playtimeMinutes: game.playtimeMinutes,
        });

        // Dispatch update event
        window.dispatchEvent(new CustomEvent('game_playtime_updated', {
          detail: { launchedGame: game },
        }));
      }
    }, 60000); // Every minute

    this.heartbeatIntervals.set(launchedGameId, interval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(launchedGameId: string): void {
    const interval = this.heartbeatIntervals.get(launchedGameId);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(launchedGameId);
    }
  }

  /**
   * Log game launch event
   */
  private logEvent(
    launchedGameId: string,
    eventType: GameLaunchEvent['eventType'],
    metadata?: Record<string, any>
  ): void {
    const event: GameLaunchEvent = {
      id: 'event_' + Date.now(),
      launchedGameId,
      eventType,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.gameLaunchEvents.push(event);

    // Keep only last 1000 events
    if (this.gameLaunchEvents.length > 1000) {
      this.gameLaunchEvents = this.gameLaunchEvents.slice(-1000);
    }
  }

  /**
   * Get events for a launched game
   */
  getEventsForGame(launchedGameId: string): GameLaunchEvent[] {
    return this.gameLaunchEvents.filter(event => event.launchedGameId === launchedGameId);
  }

  /**
   * Clean up stopped games (optional cleanup)
   */
  cleanupStoppedGames(): void {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    for (const [id, game] of this.launchedGames) {
      if (game.status === 'stopped' && game.stoppedAt && game.stoppedAt < sevenDaysAgo) {
        this.launchedGames.delete(id);
        this.stopHeartbeat(id);
      }
    }

    this.saveLaunchedGames();
  }

  /**
   * Get total playtime for a user
   */
  getTotalPlaytimeForUser(userId: string): number {
    return Array.from(this.launchedGames.values())
      .filter(game => game.userId === userId)
      .reduce((total, game) => total + game.playtimeMinutes, 0);
  }

  /**
   * Get most played games
   */
  getMostPlayedGames(limit: number = 10): { gameId: string; gameName: string; totalPlaytime: number }[] {
    const gamePlaytimes = new Map<string, { gameName: string; totalPlaytime: number }>();

    for (const game of this.launchedGames.values()) {
      const existing = gamePlaytimes.get(game.gameId);
      if (existing) {
        existing.totalPlaytime += game.playtimeMinutes;
      } else {
        gamePlaytimes.set(game.gameId, {
          gameName: game.gameName,
          totalPlaytime: game.playtimeMinutes,
        });
      }
    }

    return Array.from(gamePlaytimes.entries())
      .map(([gameId, data]) => ({ gameId, ...data }))
      .sort((a, b) => b.totalPlaytime - a.totalPlaytime)
      .slice(0, limit);
  }
}

export const gameLaunchService = new GameLaunchService();
export default gameLaunchService;
