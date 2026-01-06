/**
 * Login Selector
 * Choose between Master PC or Client PC mode
 */

import React, { useState } from 'react';
import { authService } from '../../services/authService';

interface Props {
  onMasterLogin: () => void;
  onClientSelect: (clientId: string) => void;
}

const LoginSelector: React.FC<Props> = ({ onMasterLogin, onClientSelect }) => {
  const [mode, setMode] = useState<'select' | 'master-login' | 'client-select'>('select');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMasterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const session = await authService.login(username, password);

      if (session.user.role !== 'admin' && session.user.role !== 'staff') {
        throw new Error('Only admin/staff can access Master PC');
      }

      onMasterLogin();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-8xl mb-4">🎮</div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Gaming Parlour Management System
          </h1>
          <p className="text-xl text-purple-200">Professional Gaming Center Solution</p>
        </div>

        {/* Mode Selection */}
        {mode === 'select' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              onClick={() => setMode('master-login')}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border-2 border-white/20 hover:border-blue-400 cursor-pointer transition transform hover:scale-105"
            >
              <div className="text-6xl mb-4">🖥️</div>
              <h2 className="text-3xl font-bold text-white mb-3">Master PC</h2>
              <p className="text-gray-300 mb-4">
                Control center for managing all client PCs, users, and sessions
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Monitor all PCs</li>
                <li>• Manage sessions</li>
                <li>• View reports</li>
                <li>• Control timers</li>
              </ul>
            </div>

            <div
              onClick={() => setMode('client-select')}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border-2 border-white/20 hover:border-green-400 cursor-pointer transition transform hover:scale-105"
            >
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-3xl font-bold text-white mb-3">Client PC</h2>
              <p className="text-gray-300 mb-4">
                Gaming stations for customers with time tracking and management
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• User login</li>
                <li>• Time tracking</li>
                <li>• Session warnings</li>
                <li>• Payment history</li>
              </ul>
            </div>
          </div>
        )}

        {/* Master PC Login */}
        {mode === 'master-login' && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 max-w-md mx-auto">
            <button
              onClick={() => setMode('select')}
              className="text-white/60 hover:text-white mb-4 flex items-center gap-2"
            >
              ← Back
            </button>

            <h2 className="text-3xl font-bold text-white mb-6">Master PC Login</h2>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleMasterLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Admin Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="admin"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="admin123"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition"
              >
                {loading ? 'Logging in...' : 'Access Master Control'}
              </button>
            </form>

            <p className="text-xs text-gray-400 text-center mt-4">
              Default: admin / admin123
            </p>
          </div>
        )}

        {/* Client PC Selection */}
        {mode === 'client-select' && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <button
              onClick={() => setMode('select')}
              className="text-white/60 hover:text-white mb-6 flex items-center gap-2"
            >
              ← Back
            </button>

            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              Select Your Gaming PC
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  onClick={() => onClientSelect(`PC-${num}`)}
                  className="bg-gradient-to-br from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white rounded-xl p-8 transition transform hover:scale-105 active:scale-95"
                >
                  <div className="text-5xl mb-2">🎮</div>
                  <div className="text-2xl font-bold">PC {num}</div>
                </button>
              ))}
            </div>

            <p className="text-sm text-gray-300 text-center mt-6">
              Select the PC number matching your gaming station
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400 text-sm">
          <p>Gaming Parlour Management System v1.0</p>
          <p className="mt-1">Complete solution for gaming center operations</p>
        </div>
      </div>
    </div>
  );
};

export default LoginSelector;
