/**
 * Games Panel Component
 * Displays available games with icons and launches them on click
 */

import React, { useState, useEffect } from 'react';
import { Game, LaunchedGame, Session } from '../../gaming-types';
import { db } from '../../services/databaseService';
import { gameLaunchService } from '../../services/gameLaunchService';
import CommunicationService from '../../services/communicationService';

interface Props {
  session: Session;
  clientId: string;
  communication: CommunicationService;
}

const GamesPanel: React.FC<Props> = ({ session, clientId, communication }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [activeGame, setActiveGame] = useState<LaunchedGame | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadGames();
    checkActiveGame();

    // Listen for game events
    const handleGameLaunched = (e: any) => {
      setActiveGame(e.detail.launchedGame);
      setLoading(false);
    };

    const handleGameStatusChanged = (e: any) => {
      if (e.detail.launchedGame.id === activeGame?.id) {
        setActiveGame(e.detail.launchedGame);
      }
    };

    const handleGameStopped = (e: any) => {
      if (e.detail.launchedGame.id === activeGame?.id) {
        setActiveGame(null);
      }
    };

    window.addEventListener('game_launched', handleGameLaunched);
    window.addEventListener('game_status_changed', handleGameStatusChanged);
    window.addEventListener('game_stopped', handleGameStopped);

    return () => {
      window.removeEventListener('game_launched', handleGameLaunched);
      window.removeEventListener('game_status_changed', handleGameStatusChanged);
      window.removeEventListener('game_stopped', handleGameStopped);
    };
  }, []);

  const loadGames = async () => {
    const allGames = await db.getAllGames();
    setGames(allGames);
  };

  const checkActiveGame = () => {
    const active = gameLaunchService.getActiveGameForSession(session.id);
    setActiveGame(active);
  };

  const handleLaunchGame = async (game: Game) => {
    if (activeGame) {
      setError('Please stop the current game before launching another');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const launchedGame = await gameLaunchService.launchGame(
        game,
        session.id,
        session.userId,
        clientId
      );

      // Notify master PC
      communication.send({
        type: 'sync',
        clientId,
        payload: {
          event: 'game_launched',
          gameId: game.id,
          gameName: game.name,
          sessionId: session.id,
        },
        timestamp: new Date().toISOString(),
      });

    } catch (err: any) {
      setError(err.message || 'Failed to launch game');
      setLoading(false);
    }
  };

  const handleStopGame = () => {
    if (!activeGame) return;

    gameLaunchService.stopGame(activeGame.id);

    // Notify master PC
    communication.send({
      type: 'sync',
      clientId,
      payload: {
        event: 'game_stopped',
        gameId: activeGame.gameId,
        gameName: activeGame.gameName,
        sessionId: session.id,
        playtime: activeGame.playtimeMinutes,
      },
      timestamp: new Date().toISOString(),
    });
  };

  const getGameIcon = (game: Game): string => {
    // Game-specific emojis
    const icons: Record<string, string> = {
      'valorant': '🎯',
      'cs:go': '🔫',
      'counter-strike': '🔫',
      'fortnite': '🏰',
      'apex legends': '🎮',
      'gta v': '🚗',
      'minecraft': '⛏️',
      'league of legends': '⚔️',
      'dota 2': '🛡️',
      'overwatch': '🎭',
      'pubg': '🪂',
      'call of duty': '💣',
      'fifa': '⚽',
      'rocket league': '🚀',
    };

    const gameName = game.name.toLowerCase();
    for (const [key, icon] of Object.entries(icons)) {
      if (gameName.includes(key)) {
        return icon;
      }
    }

    // Default icons by category
    const categoryIcons: Record<string, string> = {
      'fps': '🎯',
      'moba': '⚔️',
      'rpg': '🗡️',
      'sports': '⚽',
      'racing': '🏎️',
      'strategy': '♟️',
      'casual': '🎮',
    };

    return categoryIcons[game.category] || '🎮';
  };

  if (activeGame && activeGame.status === 'running') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-9xl mb-6">{getGameIcon(games.find(g => g.id === activeGame.gameId)!)}</div>
          <h1 className="text-4xl font-bold text-white mb-4">{activeGame.gameName}</h1>
          <p className="text-xl text-gray-300 mb-2">Game is Running</p>
          <p className="text-lg text-gray-400 mb-8">Playtime: {activeGame.playtimeMinutes} minutes</p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => gameLaunchService.pauseGame(activeGame.id)}
              className="px-8 py-4 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition"
            >
              ⏸️ Pause Game
            </button>
            <button
              onClick={handleStopGame}
              className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
            >
              ⏹️ Stop Game
            </button>
          </div>

          <div className="mt-8 p-4 bg-white/5 rounded-lg max-w-md mx-auto">
            <p className="text-sm text-gray-400">
              Press <kbd className="px-2 py-1 bg-white/20 rounded">Alt+Tab</kbd> to switch between game and timer
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (activeGame && activeGame.status === 'paused') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-gray-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-9xl mb-6">{getGameIcon(games.find(g => g.id === activeGame.gameId)!)}</div>
          <h1 className="text-4xl font-bold text-white mb-4">{activeGame.gameName}</h1>
          <p className="text-xl text-yellow-300 mb-2">⏸️ Game Paused</p>
          <p className="text-lg text-gray-400 mb-8">Playtime: {activeGame.playtimeMinutes} minutes</p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => gameLaunchService.resumeGame(activeGame.id)}
              className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
            >
              ▶️ Resume Game
            </button>
            <button
              onClick={handleStopGame}
              className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
            >
              ⏹️ Stop Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeGame && activeGame.status === 'launching') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-9xl mb-6 animate-pulse">{getGameIcon(games.find(g => g.id === activeGame.gameId)!)}</div>
          <h1 className="text-4xl font-bold text-white mb-4">{activeGame.gameName}</h1>
          <p className="text-xl text-blue-300 mb-2">🚀 Launching Game...</p>
          <div className="mt-8">
            <div className="w-64 h-2 bg-gray-700 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-white">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 p-6">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-2">🎮 Game Library</h1>
          <p className="text-gray-300">Select a game to start playing</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="container mx-auto mt-6">
          <div className="bg-red-500/20 border border-red-500 text-red-100 px-6 py-4 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* Games Grid */}
      <div className="container mx-auto p-6">
        {games.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-xl text-gray-300">No games available</p>
            <p className="text-sm text-gray-400 mt-2">Please contact staff to add games</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {games.map(game => (
              <button
                key={game.id}
                onClick={() => handleLaunchGame(game)}
                disabled={loading || !game.isPopular}
                className={`group relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 transition transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed ${
                  game.isPopular
                    ? 'border-white/20 hover:border-blue-400'
                    : 'border-gray-600'
                }`}
              >
                {/* Game Icon */}
                <div className="text-7xl mb-4 transition transform group-hover:scale-110">
                  {getGameIcon(game)}
                </div>

                {/* Game Name */}
                <h3 className="text-lg font-bold mb-2 truncate">{game.name}</h3>

                {/* Category Badge */}
                <span className="inline-block px-3 py-1 bg-purple-600 rounded-full text-xs font-semibold uppercase">
                  {game.category}
                </span>

                {/* Play Count */}
                {game.playCount > 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    ▶️ {game.playCount} plays
                  </p>
                )}

                {/* Coming Soon Badge */}
                {!game.isPopular && (
                  <div className="absolute top-2 right-2 bg-yellow-600 text-white px-2 py-1 rounded text-xs font-bold">
                    Coming Soon
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🎮</div>
            <p className="text-xl">Launching game...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamesPanel;
