/**
 * Tournament Management Panel
 * Create and manage gaming tournaments
 */

import React, { useState, useEffect } from 'react';
import { Tournament, Leaderboard } from '../../../gaming-types';
import { tournamentService } from '../../../services/tournamentService';

const TournamentPanel: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [leaderboard, setLeaderboard] = useState<Leaderboard[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [tournamentsData, leaderboardData] = await Promise.all([
      tournamentService.getActiveTournaments(),
      tournamentService.getLeaderboard(10),
    ]);

    setTournaments(tournamentsData);
    setLeaderboard(leaderboardData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registration': return 'bg-green-600';
      case 'ongoing': return 'bg-blue-600';
      case 'completed': return 'bg-gray-600';
      default: return 'bg-yellow-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Tournament Management</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
        >
          + Create Tournament
        </button>
      </div>

      {/* Active Tournaments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tournaments.map(tournament => (
          <div key={tournament.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{tournament.name}</h3>
                <p className="text-sm text-gray-400">{tournament.game}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(tournament.status)}`}>
                {tournament.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-400">Format</p>
                <p className="text-sm font-semibold capitalize">{tournament.format.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Participants</p>
                <p className="text-sm font-semibold">{tournament.participants.length}/{tournament.maxParticipants}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Entry Fee</p>
                <p className="text-sm font-semibold">₹{tournament.entryFee}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Prize Pool</p>
                <p className="text-sm font-semibold">₹{tournament.prizePool}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">Prize Distribution</p>
              <div className="space-y-1">
                {tournament.prizes.map(prize => (
                  <div key={prize.position} className="flex justify-between text-sm">
                    <span>🏆 Position {prize.position}</span>
                    <span className="font-semibold">₹{prize.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              {tournament.status === 'registration' && (
                <button
                  onClick={async () => {
                    await tournamentService.startTournament(tournament.id);
                    loadData();
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                >
                  Start Tournament
                </button>
              )}
              {tournament.status === 'ongoing' && (
                <button
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition"
                >
                  View Matches
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4">Global Leaderboard</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-3">Rank</th>
                <th className="text-left p-3">Player</th>
                <th className="text-left p-3">Tournaments Won</th>
                <th className="text-left p-3">Tournaments Played</th>
                <th className="text-left p-3">Total Winnings</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map(entry => (
                <tr key={entry.userId} className="border-b border-white/5">
                  <td className="p-3">
                    {entry.rank <= 3 ? (
                      <span className="text-2xl">
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                      </span>
                    ) : (
                      <span className="font-semibold">#{entry.rank}</span>
                    )}
                  </td>
                  <td className="p-3 font-semibold">{entry.userName}</td>
                  <td className="p-3">{entry.tournamentsWon}</td>
                  <td className="p-3">{entry.tournamentsPlayed}</td>
                  <td className="p-3 font-semibold text-green-400">₹{entry.totalWinnings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TournamentPanel;
