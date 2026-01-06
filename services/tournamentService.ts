/**
 * Tournament Service
 * Manages gaming tournaments, matches, and leaderboards
 */

import {
  Tournament,
  TournamentStatus,
  TournamentFormat,
  TournamentMatch,
  Leaderboard,
} from '../gaming-types';
import { db } from './databaseService';

class TournamentService {
  /**
   * Create new tournament
   */
  async createTournament(
    name: string,
    game: string,
    format: TournamentFormat,
    startTime: string,
    maxParticipants: number,
    entryFee: number,
    prizePool: number,
    prizes: { position: number; amount: number }[],
    createdBy: string
  ): Promise<Tournament> {
    const tournament: Tournament = {
      id: `tournament-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name,
      game,
      format,
      status: 'registration',
      startTime,
      maxParticipants,
      entryFee,
      prizePool,
      prizes,
      participants: [],
      matches: [],
      createdBy,
      createdAt: new Date().toISOString(),
    };

    await db.createTournament(tournament);

    await db.createActivityLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      type: 'system',
      description: `Tournament created: ${name} (${game})`,
      metadata: {
        tournamentId: tournament.id,
        maxParticipants,
        entryFee,
        prizePool,
      },
    });

    return tournament;
  }

  /**
   * Register participant
   */
  async registerParticipant(tournamentId: string, userId: string): Promise<void> {
    const tournament = await db.getTournament(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.status !== 'registration') {
      throw new Error('Tournament registration is closed');
    }

    if (tournament.participants.length >= tournament.maxParticipants) {
      throw new Error('Tournament is full');
    }

    if (tournament.participants.includes(userId)) {
      throw new Error('Already registered');
    }

    // Check wallet balance and deduct entry fee
    const user = await db.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.walletBalance < tournament.entryFee) {
      throw new Error('Insufficient balance for entry fee');
    }

    user.walletBalance -= tournament.entryFee;
    await db.updateUser(user);

    tournament.participants.push(userId);
    await db.updateTournament(tournament);

    // Record payment
    await db.createPayment({
      id: `payment-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      sessionId: '',
      userId,
      userName: user.username,
      clientId: 'TOURNAMENT',
      amount: tournament.entryFee,
      method: 'wallet',
      timestamp: new Date().toISOString(),
      duration: 0,
      description: `Tournament entry: ${tournament.name}`,
    });

    await db.createActivityLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      type: 'system',
      userId,
      userName: user.username,
      description: `Registered for tournament: ${tournament.name}`,
      metadata: { tournamentId, entryFee: tournament.entryFee },
    });
  }

  /**
   * Start tournament and generate brackets
   */
  async startTournament(tournamentId: string): Promise<void> {
    const tournament = await db.getTournament(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.participants.length < 2) {
      throw new Error('Not enough participants');
    }

    tournament.status = 'ongoing';

    // Generate matches based on format
    switch (tournament.format) {
      case 'single_elimination':
        tournament.matches = this.generateSingleEliminationBracket(tournament);
        break;

      case 'double_elimination':
        tournament.matches = this.generateDoubleEliminationBracket(tournament);
        break;

      case 'round_robin':
        tournament.matches = this.generateRoundRobinMatches(tournament);
        break;

      case 'free_for_all':
        // All participants play together
        break;
    }

    await db.updateTournament(tournament);

    await db.createActivityLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      type: 'system',
      description: `Tournament started: ${tournament.name}`,
      metadata: {
        tournamentId,
        participants: tournament.participants.length,
        matches: tournament.matches.length,
      },
    });
  }

  /**
   * Generate single elimination bracket
   */
  private generateSingleEliminationBracket(tournament: Tournament): TournamentMatch[] {
    const matches: TournamentMatch[] = [];
    const participants = [...tournament.participants];

    // Add byes if not power of 2
    while (!this.isPowerOfTwo(participants.length)) {
      participants.push('BYE');
    }

    // Shuffle participants
    this.shuffleArray(participants);

    let matchNumber = 1;
    let round = 1;

    // First round
    for (let i = 0; i < participants.length; i += 2) {
      matches.push({
        id: `match-${Date.now()}-${matchNumber}`,
        tournamentId: tournament.id,
        round,
        matchNumber: matchNumber++,
        player1Id: participants[i],
        player2Id: participants[i + 1],
        status: 'scheduled',
      });
    }

    return matches;
  }

  /**
   * Generate double elimination bracket
   */
  private generateDoubleEliminationBracket(tournament: Tournament): TournamentMatch[] {
    // Similar to single elimination but with losers bracket
    return this.generateSingleEliminationBracket(tournament);
  }

  /**
   * Generate round-robin matches
   */
  private generateRoundRobinMatches(tournament: Tournament): TournamentMatch[] {
    const matches: TournamentMatch[] = [];
    const participants = tournament.participants;
    let matchNumber = 1;

    // Each participant plays everyone else once
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        matches.push({
          id: `match-${Date.now()}-${matchNumber}`,
          tournamentId: tournament.id,
          round: 1,
          matchNumber: matchNumber++,
          player1Id: participants[i],
          player2Id: participants[j],
          status: 'scheduled',
        });
      }
    }

    return matches;
  }

  /**
   * Record match result
   */
  async recordMatchResult(
    matchId: string,
    player1Score: number,
    player2Score: number,
    clientId?: string
  ): Promise<void> {
    const tournaments = await db.getAllTournaments();

    for (const tournament of tournaments) {
      const match = tournament.matches.find(m => m.id === matchId);
      if (match) {
        match.player1Score = player1Score;
        match.player2Score = player2Score;
        match.winnerId = player1Score > player2Score ? match.player1Id : match.player2Id;
        match.status = 'completed';
        match.endTime = new Date().toISOString();
        match.clientId = clientId;

        await db.updateTournament(tournament);

        await db.createActivityLog({
          id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          timestamp: new Date().toISOString(),
          type: 'system',
          description: `Match completed: ${match.player1Id} vs ${match.player2Id} (${player1Score}-${player2Score})`,
          metadata: { matchId, tournamentId: tournament.id, winnerId: match.winnerId },
        });

        break;
      }
    }
  }

  /**
   * Complete tournament and distribute prizes
   */
  async completeTournament(tournamentId: string): Promise<void> {
    const tournament = await db.getTournament(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    tournament.status = 'completed';
    tournament.endTime = new Date().toISOString();

    // Calculate standings
    const standings = this.calculateStandings(tournament);

    // Distribute prizes
    for (const prize of tournament.prizes) {
      if (standings[prize.position - 1]) {
        const winnerId = standings[prize.position - 1];
        const user = await db.getUser(winnerId);

        if (user) {
          user.walletBalance += prize.amount;
          await db.updateUser(user);

          await db.createActivityLog({
            id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            timestamp: new Date().toISOString(),
            type: 'system',
            userId: user.id,
            userName: user.username,
            description: `Won ${this.getPositionName(prize.position)} place in ${tournament.name} - Prize: ₹${prize.amount}`,
            metadata: { tournamentId, position: prize.position, prize: prize.amount },
          });
        }
      }
    }

    await db.updateTournament(tournament);
  }

  /**
   * Calculate tournament standings
   */
  private calculateStandings(tournament: Tournament): string[] {
    const wins: Record<string, number> = {};

    tournament.participants.forEach(p => {
      wins[p] = 0;
    });

    tournament.matches.forEach(match => {
      if (match.winnerId) {
        wins[match.winnerId] = (wins[match.winnerId] || 0) + 1;
      }
    });

    return Object.entries(wins)
      .sort(([, a], [, b]) => b - a)
      .map(([userId]) => userId);
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 10): Promise<Leaderboard[]> {
    const tournaments = await db.getAllTournaments();
    const completedTournaments = tournaments.filter(t => t.status === 'completed');

    const playerStats: Record<string, Leaderboard> = {};

    // Process all completed tournaments
    for (const tournament of completedTournaments) {
      const standings = this.calculateStandings(tournament);

      standings.forEach((userId, index) => {
        if (!playerStats[userId]) {
          const user = db.getUser(userId);
          playerStats[userId] = {
            userId,
            userName: '', // Will be filled later
            tournamentsWon: 0,
            tournamentsPlayed: 0,
            totalWinnings: 0,
            rank: 0,
          };
        }

        playerStats[userId].tournamentsPlayed++;

        if (index === 0) {
          playerStats[userId].tournamentsWon++;
        }

        const prize = tournament.prizes.find(p => p.position === index + 1);
        if (prize) {
          playerStats[userId].totalWinnings += prize.amount;
        }
      });
    }

    // Sort by wins, then by winnings
    const leaderboard = Object.values(playerStats).sort((a, b) => {
      if (b.tournamentsWon !== a.tournamentsWon) {
        return b.tournamentsWon - a.tournamentsWon;
      }
      return b.totalWinnings - a.totalWinnings;
    });

    // Assign ranks
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return leaderboard.slice(0, limit);
  }

  /**
   * Get active tournaments
   */
  async getActiveTournaments(): Promise<Tournament[]> {
    const tournaments = await db.getAllTournaments();
    return tournaments.filter(t =>
      t.status === 'registration' || t.status === 'ongoing'
    );
  }

  /**
   * Get user tournaments
   */
  async getUserTournaments(userId: string): Promise<Tournament[]> {
    const tournaments = await db.getAllTournaments();
    return tournaments.filter(t => t.participants.includes(userId));
  }

  // Helper functions
  private isPowerOfTwo(n: number): boolean {
    return n && (n & (n - 1)) === 0;
  }

  private shuffleArray(array: any[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  private getPositionName(position: number): string {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const value = position % 100;
    return position + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]);
  }
}

export const tournamentService = new TournamentService();
