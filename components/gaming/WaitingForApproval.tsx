/**
 * Waiting for Approval Screen
 * Shows after OAuth login while waiting for Master PC to approve and start session
 */

import React, { useEffect, useState } from 'react';
import { OAuthSession } from '../../gaming-types';

interface Props {
  clientId: string;
  oauthSession: OAuthSession;
  onCancel: () => void;
}

const WaitingForApproval: React.FC<Props> = ({ clientId, oauthSession, onCancel }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    // Animate loading dots
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-white/10 rounded-full mb-4">
            <div className="text-6xl">🎮</div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Gaming Parlour</h1>
          <p className="text-xl text-blue-200">{clientId}</p>
        </div>

        {/* Main Content */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          {/* User Profile */}
          <div className="flex items-center gap-4 mb-8">
            <img
              src={oauthSession.googlePicture}
              alt={oauthSession.googleName}
              className="w-20 h-20 rounded-full border-4 border-white/30 shadow-lg"
            />
            <div>
              <h2 className="text-2xl font-bold text-white">{oauthSession.googleName}</h2>
              <p className="text-gray-300">{oauthSession.googleEmail}</p>
            </div>
          </div>

          {/* Status */}
          <div className="text-center py-8">
            {/* Animated Icon */}
            <div className="text-6xl mb-6 animate-pulse">⏳</div>

            {/* Status Message */}
            <h3 className="text-2xl font-bold text-white mb-2">
              Waiting for Staff Approval{dots}
            </h3>
            <p className="text-lg text-gray-300 mb-8">
              Please wait while our staff processes your request
            </p>

            {/* Progress Animation */}
            <div className="max-w-md mx-auto mb-8">
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4 mb-6">
              <p className="text-blue-100 text-sm">
                <strong>Next Steps:</strong><br/>
                1. Staff will verify your request<br/>
                2. Payment will be collected at the counter<br/>
                3. Your gaming session will start automatically
              </p>
            </div>
          </div>

          {/* Cancel Button */}
          <button
            onClick={onCancel}
            className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
          >
            Cancel Request
          </button>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-gray-400">
              Please approach the counter if you need assistance
            </p>
          </div>
        </div>

        {/* Status Card */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl mb-2">✅</div>
            <p className="text-xs text-gray-300">Logged In</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10 animate-pulse">
            <div className="text-2xl mb-2">⏳</div>
            <p className="text-xs text-gray-300">Pending</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10 opacity-50">
            <div className="text-2xl mb-2">🎮</div>
            <p className="text-xs text-gray-300">Gaming</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingForApproval;
