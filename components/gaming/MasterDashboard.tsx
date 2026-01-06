/**
 * Master PC Dashboard
 * Central control panel for managing all client PCs
 */

import React, { useState, useEffect } from 'react';
import { ClientPC, Session, DashboardStats, User, Payment } from '../../gaming-types';
import { db } from '../../services/databaseService';
import { sessionService } from '../../services/sessionService';
import CommunicationService from '../../services/communicationService';

interface Props {
  communication: CommunicationService;
  onLogout: () => void;
}

const MasterDashboard: React.FC<Props> = ({ communication, onLogout }) => {
  const [clients, setClients] = useState<ClientPC[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientPC | null>(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extensionMinutes, setExtensionMinutes] = useState(30);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [view, setView] = useState<'overview' | 'clients' | 'history' | 'users'>('overview');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const [clientsData, statsData, sessionsData, paymentsData] = await Promise.all([
      db.getAllClients(),
      db.getDashboardStats(),
      db.getActiveSessions(),
      db.getAllPayments(),
    ]);

    setClients(clientsData);
    setStats(statsData);
    setActiveSessions(sessionsData);
    setRecentPayments(paymentsData.slice(-10).reverse());
  };

  const handleExtendSession = async (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client || !client.currentSession) return;

    setSelectedClient(client);
    setShowExtendModal(true);
  };

  const confirmExtension = async () => {
    if (!selectedClient || !selectedClient.currentSession) return;

    await sessionService.extendSession(
      selectedClient.currentSession.id,
      extensionMinutes,
      'admin',
      'Extended from Master PC'
    );

    // Notify client PC
    communication.send({
      type: 'extension',
      clientId: selectedClient.id,
      payload: { additionalMinutes: extensionMinutes },
      timestamp: new Date().toISOString(),
    });

    setShowExtendModal(false);
    setExtensionMinutes(30);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Gaming Parlour - Master Control</h1>
            <p className="text-sm text-gray-300">Central Management Dashboard</p>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-3 flex gap-4">
          {['overview', 'clients', 'history', 'users'].map(tab => (
            <button
              key={tab}
              onClick={() => setView(tab as any)}
              className={`px-4 py-2 rounded-lg capitalize transition ${
                view === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>

      <div className="container mx-auto p-6">
        {/* Overview */}
        {view === 'overview' && stats && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard title="Today's Revenue" value={`${stats.currency || '₹'}${stats.todayRevenue}`} />
              <StatCard title="Total Revenue" value={`${stats.currency || '₹'}${stats.totalRevenue}`} />
              <StatCard title="Active Sessions" value={stats.activeSessions.toString()} />
              <StatCard title="Available PCs" value={`${stats.availablePCs} / ${stats.availablePCs + stats.occupiedPCs}`} />
            </div>

            {/* Client Status Grid */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Client PCs Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients.map(client => (
                  <div
                    key={client.id}
                    className="bg-black/30 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg">{client.id}</h3>
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
                            Extend
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
                      <p className="text-sm text-green-400 mt-3">Ready for use</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* History View */}
        {view === 'history' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Recent Payments</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-3">Time</th>
                    <th className="text-left p-3">User</th>
                    <th className="text-left p-3">PC</th>
                    <th className="text-left p-3">Duration</th>
                    <th className="text-left p-3">Amount</th>
                    <th className="text-left p-3">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map(payment => (
                    <tr key={payment.id} className="border-b border-white/5">
                      <td className="p-3">{new Date(payment.timestamp).toLocaleString()}</td>
                      <td className="p-3">{payment.userName}</td>
                      <td className="p-3">{payment.clientId}</td>
                      <td className="p-3">{payment.duration} min</td>
                      <td className="p-3 font-semibold">₹{payment.amount}</td>
                      <td className="p-3 capitalize">{payment.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Extension Modal */}
      {showExtendModal && selectedClient && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-white/20">
            <h3 className="text-xl font-bold mb-4">
              Extend Session - {selectedClient.id}
            </h3>
            <p className="text-gray-300 mb-4">
              User: {selectedClient.currentSession?.userName}
            </p>
            <div className="mb-6">
              <label className="block text-sm mb-2">Additional Time (minutes)</label>
              <input
                type="number"
                value={extensionMinutes}
                onChange={(e) => setExtensionMinutes(Number(e.target.value))}
                className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg"
                min="5"
                step="5"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmExtension}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowExtendModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string }> = ({ title, value }) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
    <p className="text-sm text-gray-300 mb-1">{title}</p>
    <p className="text-3xl font-bold">{value}</p>
  </div>
);

export default MasterDashboard;
