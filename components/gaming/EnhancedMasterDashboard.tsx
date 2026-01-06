/**
 * Enhanced Master Dashboard
 * Complete admin panel with all 15 advanced features
 */

import React, { useState, useEffect } from 'react';
import { ClientPC, Session, DashboardStats, User } from '../../gaming-types';
import { db } from '../../services/databaseExtensions';
import { sessionService } from '../../services/sessionService';
import { analyticsService, backupService } from '../../services/advancedFeaturesService';
import { reservationService } from '../../services/reservationService';
import { queueService } from '../../services/queueService';
import { tournamentService } from '../../services/tournamentService';
import CommunicationService from '../../services/communicationService';

// Import feature panels
import FoodPOSPanel from './panels/FoodPOSPanel';
import TournamentPanel from './panels/TournamentPanel';
import ReservationPanel from './panels/ReservationPanel';
import {
  QueuePanel,
  AnalyticsPanel,
  GameLibraryPanel,
  PromoCodePanel,
  UserManagementPanel,
  BackupPanel,
  RemoteControlPanel,
} from './panels/AllPanels';

interface Props {
  communication: CommunicationService;
  onLogout: () => void;
}

type ViewType = 'overview' | 'clients' | 'history' | 'users' | 'food' | 'tournaments' |
                'reservations' | 'queue' | 'analytics' | 'games' | 'promos' | 'backup' | 'remote';

const EnhancedMasterDashboard: React.FC<Props> = ({ communication, onLogout }) => {
  const [view, setView] = useState<ViewType>('overview');
  const [clients, setClients] = useState<ClientPC[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [notifications, setNotifications] = useState<number>(0);
  const [queueLength, setQueueLength] = useState(0);
  const [upcomingReservations, setUpcomingReservations] = useState(0);
  const [activeTournaments, setActiveTournaments] = useState(0);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [clientsData, statsData, sessionsData] = await Promise.all([
        db.getAllClients(),
        db.getDashboardStats(),
        db.getActiveSessions(),
      ]);

      setClients(clientsData);
      setStats(statsData);
      setActiveSessions(sessionsData);

      // Load notification counts
      const queue = await queueService.getActiveQueue();
      setQueueLength(queue.length);

      const today = new Date().toISOString().split('T')[0];
      const reservations = await reservationService.getTodayReservations();
      setUpcomingReservations(reservations.filter(r => r.status === 'confirmed').length);

      const tournaments = await tournamentService.getActiveTournaments();
      setActiveTournaments(tournaments.length);

      const totalNotifications = queue.length + upcomingReservations;
      setNotifications(totalNotifications);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleExtendSession = async (clientId: string, minutes: number = 30) => {
    const client = clients.find(c => c.id === clientId);
    if (!client || !client.currentSession) return;

    await sessionService.extendSession(
      client.currentSession.id,
      minutes,
      'admin',
      'Extended from Master Dashboard'
    );

    communication.send({
      type: 'extension',
      clientId: client.id,
      payload: { additionalMinutes: minutes },
      timestamp: new Date().toISOString(),
    });

    loadData();
  };

  const handleEndSession = async (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client || !client.currentSession) return;

    if (confirm(`End session for ${client.currentSession.userName}?`)) {
      await sessionService.endSession(client.currentSession.id);
      communication.send({
        type: 'session_end',
        clientId: client.id,
        timestamp: new Date().toISOString(),
      });
      loadData();
    }
  };

  const getStatusColor = (status: ClientPC['status']) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'occupied': return 'bg-blue-500';
      case 'offline': return 'bg-gray-500';
      case 'maintenance': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '📊', badge: null },
    { id: 'clients', label: 'Client PCs', icon: '🖥️', badge: activeSessions.length },
    { id: 'users', label: 'Users', icon: '👥', badge: null },
    { id: 'food', label: 'Food & Drinks', icon: '🍔', badge: null },
    { id: 'tournaments', label: 'Tournaments', icon: '🏆', badge: activeTournaments },
    { id: 'reservations', label: 'Reservations', icon: '📅', badge: upcomingReservations },
    { id: 'queue', label: 'Queue', icon: '🎯', badge: queueLength },
    { id: 'analytics', label: 'Analytics', icon: '📈', badge: null },
    { id: 'games', label: 'Game Library', icon: '🎮', badge: null },
    { id: 'promos', label: 'Promo Codes', icon: '🎁', badge: null },
    { id: 'remote', label: 'Remote Control', icon: '🎛️', badge: null },
    { id: 'backup', label: 'Backup', icon: '💾', badge: null },
    { id: 'history', label: 'History', icon: '📜', badge: null },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10 p-4 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              🎮 Gaming Parlour - Master Control
              {notifications > 0 && (
                <span className="bg-red-500 text-xs px-2 py-1 rounded-full animate-pulse">
                  {notifications}
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-300">Complete Management Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => backupService.createBackup('manual', 'admin', 'Manual backup from dashboard')}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-sm"
            >
              💾 Backup Now
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-black/20 backdrop-blur-sm border-r border-white/10 overflow-y-auto">
          <nav className="p-4 space-y-2">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setView(item.id as ViewType)}
                className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center justify-between ${
                  view === item.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
                {item.badge !== null && item.badge > 0 && (
                  <span className="bg-red-500 text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {view === 'overview' && stats && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-6">Dashboard Overview</h2>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Today's Revenue" value={`₹${stats.todayRevenue}`} icon="💰" color="green" />
                <StatCard title="Active Sessions" value={stats.activeSessions.toString()} icon="🎮" color="blue" />
                <StatCard title="Available PCs" value={`${stats.availablePCs}/5`} icon="🖥️" color="purple" />
                <StatCard title="In Queue" value={queueLength.toString()} icon="⏳" color="yellow" />
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <QuickStatCard title="Total Revenue" value={`₹${stats.totalRevenue}`} />
                <QuickStatCard title="Total Customers" value={stats.totalCustomers.toString()} />
                <QuickStatCard title="Peak Hour" value={stats.peakHour} />
              </div>

              {/* Client PCs Grid */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Client PCs Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clients.map(client => (
                    <div
                      key={client.id}
                      className="bg-black/30 rounded-lg p-4 border border-white/10"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-lg">{client.id}</h4>
                          <p className="text-sm text-gray-300">{client.name}</p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(client.status)}`} />
                      </div>

                      {client.currentSession && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <p className="text-sm font-semibold">{client.currentSession.userName}</p>
                          <p className="text-xs text-gray-400">
                            Remaining: {sessionService.formatTime(client.currentSession.remainingTime)}
                          </p>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleExtendSession(client.id)}
                              className="flex-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition"
                            >
                              +30 min
                            </button>
                            <button
                              onClick={() => handleEndSession(client.id)}
                              className="flex-1 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition"
                            >
                              End
                            </button>
                          </div>
                        </div>
                      )}

                      {client.status === 'available' && (
                        <p className="text-sm text-green-400 mt-3">✓ Ready for use</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <QuickActionCard
                  title="Active Tournaments"
                  value={activeTournaments}
                  action="Manage"
                  onClick={() => setView('tournaments')}
                />
                <QuickActionCard
                  title="Today's Reservations"
                  value={upcomingReservations}
                  action="View"
                  onClick={() => setView('reservations')}
                />
                <QuickActionCard
                  title="Waiting in Queue"
                  value={queueLength}
                  action="Manage"
                  onClick={() => setView('queue')}
                />
              </div>
            </div>
          )}

          {view === 'users' && <UserManagementPanel />}
          {view === 'food' && <FoodPOSPanel />}
          {view === 'tournaments' && <TournamentPanel />}
          {view === 'reservations' && <ReservationPanel />}
          {view === 'queue' && <QueuePanel />}
          {view === 'analytics' && <AnalyticsPanel />}
          {view === 'games' && <GameLibraryPanel />}
          {view === 'promos' && <PromoCodePanel />}
          {view === 'backup' && <BackupPanel />}
          {view === 'remote' && <RemoteControlPanel clients={clients} communication={communication} />}
        </main>
      </div>
    </div>
  );
};

// Helper Components
const StatCard: React.FC<{ title: string; value: string; icon: string; color: string }> = ({
  title,
  value,
  icon,
  color,
}) => {
  const colorClasses = {
    green: 'from-green-600 to-green-800',
    blue: 'from-blue-600 to-blue-800',
    purple: 'from-purple-600 to-purple-800',
    yellow: 'from-yellow-600 to-yellow-800',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} rounded-xl p-6 border border-white/10`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-white/80">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
};

const QuickStatCard: React.FC<{ title: string; value: string }> = ({ title, value }) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
    <p className="text-sm text-gray-300 mb-1">{title}</p>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

const QuickActionCard: React.FC<{
  title: string;
  value: number;
  action: string;
  onClick: () => void;
}> = ({ title, value, action, onClick }) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
    <p className="text-sm text-gray-300 mb-2">{title}</p>
    <div className="flex items-center justify-between">
      <p className="text-3xl font-bold">{value}</p>
      <button
        onClick={onClick}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-sm"
      >
        {action} →
      </button>
    </div>
  </div>
);

export default EnhancedMasterDashboard;
