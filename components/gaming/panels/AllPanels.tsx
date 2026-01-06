/**
 * All Remaining Panels - Combined File
 */

import React, { useState, useEffect } from 'react';
import { queueService } from '../../../services/queueService';
import { analyticsService, exportService, backupService, remoteControlService } from '../../../services/advancedFeaturesService';
import { gameLibraryService } from '../../../services/gameLibraryService';
import { promoService } from '../../../services/promoService';
import { db } from '../../../services/databaseExtensions';
import type { QueueEntry, Game, PromoCode, BackupRecord, ClientPC } from '../../../gaming-types';
import type CommunicationService from '../../../services/communicationService';

// ========== QUEUE PANEL ==========
export const QueuePanel: React.FC = () => {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const [queueData, statsData] = await Promise.all([
      queueService.getActiveQueue(),
      queueService.getQueueStats(),
    ]);
    setQueue(queueData);
    setStats(statsData);
  };

  const notifyNext = async () => {
    await queueService.notifyNext();
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Queue Management</h2>
        <button
          onClick={notifyNext}
          disabled={queue.length === 0}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg transition"
        >
          Notify Next Person
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-600 rounded-xl p-4">
            <p className="text-sm text-white/80">Current Length</p>
            <p className="text-3xl font-bold">{stats.currentLength}</p>
          </div>
          <div className="bg-purple-600 rounded-xl p-4">
            <p className="text-sm text-white/80">Longest Wait</p>
            <p className="text-3xl font-bold">{stats.longestWaitTime} min</p>
          </div>
          <div className="bg-green-600 rounded-xl p-4">
            <p className="text-sm text-white/80">Served Today</p>
            <p className="text-3xl font-bold">{stats.totalServedToday}</p>
          </div>
        </div>
      )}

      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4">Waiting List</h3>
        {queue.length > 0 ? (
          <div className="space-y-2">
            {queue.map((entry, index) => (
              <div key={entry.id} className="bg-black/30 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-blue-400">#{index + 1}</span>
                  <div>
                    <p className="font-bold">{entry.userName}</p>
                    <p className="text-sm text-gray-400">
                      Joined {new Date(entry.joinedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Est. Wait</p>
                  <p className="font-bold">{entry.estimatedWaitTime} min</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8">Queue is empty</p>
        )}
      </div>
    </div>
  );
};

// ========== ANALYTICS PANEL ==========
export const AnalyticsPanel: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    loadReport();
  }, [period]);

  const loadReport = async () => {
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const data = await analyticsService.generateRevenueReport(period, startDate, endDate);
    setReport(data);
  };

  const exportData = async (type: string) => {
    const csv = await exportService.exportToCSV(type as any);
    exportService.downloadFile(csv, `${type}-export.csv`, 'text/csv');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Analytics & Reports</h2>

      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-600 rounded-xl p-4">
              <p className="text-sm text-white/80">Total Revenue</p>
              <p className="text-2xl font-bold">₹{report.totalRevenue}</p>
            </div>
            <div className="bg-blue-600 rounded-xl p-4">
              <p className="text-sm text-white/80">Gaming Revenue</p>
              <p className="text-2xl font-bold">₹{report.gamingRevenue}</p>
            </div>
            <div className="bg-purple-600 rounded-xl p-4">
              <p className="text-sm text-white/80">Food Revenue</p>
              <p className="text-2xl font-bold">₹{report.foodRevenue}</p>
            </div>
            <div className="bg-yellow-600 rounded-xl p-4">
              <p className="text-sm text-white/80">Period</p>
              <p className="text-lg font-bold capitalize">{period}</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Revenue Breakdown</h3>
              <div className="flex gap-2">
                {(['daily', 'weekly', 'monthly'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1 rounded capitalize ${
                      period === p ? 'bg-blue-600' : 'bg-white/10'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {report.breakdown.slice(0, 10).map((item: any) => (
                <div key={item.date} className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-300">{item.date}</span>
                  <span className="font-bold text-green-400">₹{item.revenue}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4">Export Data</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['sessions', 'payments', 'users', 'analytics'].map(type => (
            <button
              key={type}
              onClick={() => exportData(type)}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition capitalize"
            >
              📥 Export {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ========== GAME LIBRARY PANEL ==========
export const GameLibraryPanel: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [popularGames, setPopularGames] = useState<Game[]>([]);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    const [allGames, popular] = await Promise.all([
      gameLibraryService.getAllGames(),
      gameLibraryService.getPopularGames(5),
    ]);
    setGames(allGames);
    setPopularGames(popular);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Game Library</h2>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4">Most Popular Games</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {popularGames.map(game => (
            <div key={game.id} className="bg-black/30 rounded-lg p-4 text-center">
              <p className="text-3xl mb-2">🎮</p>
              <p className="font-bold text-sm mb-1">{game.name}</p>
              <p className="text-xs text-gray-400">{game.playCount} plays</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4">All Games ({games.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {games.map(game => (
            <div key={game.id} className="bg-black/30 rounded-lg p-4 border border-white/10">
              <p className="font-bold mb-1">{game.name}</p>
              <p className="text-xs text-gray-400 capitalize mb-2">{game.category}</p>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{game.size}GB</span>
                <span>{game.playCount} plays</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ========== PROMO CODE PANEL ==========
export const PromoCodePanel: React.FC = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);

  useEffect(() => {
    loadPromoCodes();
  }, []);

  const loadPromoCodes = async () => {
    const codes = await promoService.getActivePromoCodes();
    setPromoCodes(codes);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Promotional Codes</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promoCodes.map(promo => (
          <div key={promo.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="mb-4">
              <p className="text-2xl font-bold text-blue-400 mb-1">{promo.code}</p>
              <p className="text-sm text-gray-400">{promo.name}</p>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Type:</span>
                <span className="font-semibold capitalize">{promo.type.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Value:</span>
                <span className="font-semibold">
                  {promo.type === 'percentage' ? `${promo.value}%` :
                   promo.type === 'fixed' ? `₹${promo.value}` :
                   `${promo.value} min`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Used:</span>
                <span className="font-semibold">
                  {promo.usageCount}{promo.usageLimit ? `/${promo.usageLimit}` : ''}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10">
              <p className="text-xs text-gray-400">
                Valid: {new Date(promo.validFrom).toLocaleDateString()} - {new Date(promo.validTo).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ========== BACKUP PANEL ==========
export const BackupPanel: React.FC = () => {
  const [backups, setBackups] = useState<BackupRecord[]>([]);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    const data = await backupService.listBackups();
    setBackups(data);
  };

  const createBackup = async () => {
    await backupService.createBackup('manual', 'admin', 'Manual backup from dashboard');
    loadBackups();
  };

  const restoreBackup = async (id: string) => {
    if (confirm('Restore from this backup? Current data will be replaced.')) {
      await backupService.restoreBackup(id);
      alert('Backup restored successfully!');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Backup Management</h2>
        <button
          onClick={createBackup}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
        >
          💾 Create Backup
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4">Available Backups ({backups.length})</h3>
        <div className="space-y-2">
          {backups.map(backup => (
            <div key={backup.id} className="bg-black/30 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-bold">{backup.filename}</p>
                <p className="text-sm text-gray-400">
                  {new Date(backup.createdAt).toLocaleString()} • {(backup.size / 1024).toFixed(2)} KB
                </p>
                {backup.description && (
                  <p className="text-xs text-gray-500">{backup.description}</p>
                )}
              </div>
              <button
                onClick={() => restoreBackup(backup.id)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-sm"
              >
                Restore
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ========== USER MANAGEMENT PANEL ==========
export const UserManagementPanel: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const data = await db.getAllUsers();
    setUsers(data);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">User Management</h2>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-3">Username</th>
                <th className="text-left p-3">Full Name</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Membership</th>
                <th className="text-left p-3">Wallet</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-white/5">
                  <td className="p-3 font-semibold">{user.username}</td>
                  <td className="p-3">{user.fullName}</td>
                  <td className="p-3 capitalize">{user.role}</td>
                  <td className="p-3 capitalize">{user.membershipTier}</td>
                  <td className="p-3">₹{user.walletBalance}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${user.isActive ? 'bg-green-600' : 'bg-red-600'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ========== REMOTE CONTROL PANEL ==========
interface RemoteControlPanelProps {
  clients: ClientPC[];
  communication: CommunicationService;
}

export const RemoteControlPanel: React.FC<RemoteControlPanelProps> = ({ clients, communication }) => {
  const [message, setMessage] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('');

  const sendCommand = async (clientId: string, command: any) => {
    await remoteControlService.executeCommand(clientId, command, 'admin');
    communication.send({
      type: command,
      clientId,
      timestamp: new Date().toISOString(),
    });
  };

  const sendMessageToClient = async () => {
    if (selectedClient && message) {
      await remoteControlService.sendMessage(selectedClient, message, 'admin');
      communication.send({
        type: 'message',
        clientId: selectedClient,
        payload: { message },
        timestamp: new Date().toISOString(),
      });
      setMessage('');
      alert('Message sent!');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Remote PC Control</h2>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4">Send Message</h3>
        <div className="flex gap-4">
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="flex-1 px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white"
          >
            <option value="">Select PC...</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.id}</option>
            ))}
          </select>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter message..."
            className="flex-1 px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400"
          />
          <button
            onClick={sendMessageToClient}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            Send
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map(client => (
          <div key={client.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h4 className="font-bold text-lg mb-4">{client.id}</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => sendCommand(client.id, 'lock')}
                className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-sm"
              >
                🔒 Lock
              </button>
              <button
                onClick={() => sendCommand(client.id, 'unlock')}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
              >
                🔓 Unlock
              </button>
              <button
                onClick={() => sendCommand(client.id, 'restart')}
                className="px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded text-sm"
              >
                🔄 Restart
              </button>
              <button
                onClick={() => sendCommand(client.id, 'shutdown')}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
              >
                ⚡ Shutdown
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
