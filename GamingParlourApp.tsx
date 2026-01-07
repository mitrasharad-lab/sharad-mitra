/**
 * Gaming Parlour Application - Main Component
 * Manages routing between Master PC and Client PC modes
 */

import React, { useState, useEffect } from 'react';
import LoginSelector from './components/gaming/LoginSelector';
import MasterDashboard from './components/gaming/MasterDashboard';
import ClientLogin from './components/gaming/ClientLogin';
import ClientSession from './components/gaming/ClientSession';
import { Session, Payment, OAuthSession } from './gaming-types';
import { sessionService } from './services/sessionService';
import { authService } from './services/authService';
import CommunicationService from './services/communicationService';
import { initializeSystem } from './services/initService';

type AppMode = 'selection' | 'master' | 'client';
type ClientState = 'login' | 'session';

const GamingParlourApp: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('selection');
  const [clientId, setClientId] = useState<string>('');
  const [clientState, setClientState] = useState<ClientState>('login');
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [oauthSession, setOAuthSession] = useState<OAuthSession | null>(null);
  const [communication, setCommunication] = useState<CommunicationService | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Initialize system on first load
    const init = async () => {
      try {
        await initializeSystem();
        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize system:', error);
        alert('Failed to initialize system. Please refresh the page.');
      }
    };

    init();
  }, []);

  const handleMasterLogin = () => {
    const comm = new CommunicationService('MASTER', 'local');
    comm.connect();
    setCommunication(comm);
    setMode('master');
  };

  const handleClientSelect = (selectedClientId: string) => {
    const comm = new CommunicationService(selectedClientId, 'local');
    comm.connect();
    setCommunication(comm);
    setClientId(selectedClientId);
    setMode('client');
    setClientState('login');
  };

  const handleClientLoginSuccess = async (
    userId: string,
    userName: string,
    durationMinutes: number,
    amount: number
  ) => {
    // Create payment record
    const payment: Payment = {
      id: `payment-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      sessionId: '', // Will be updated after session creation
      userId,
      userName,
      clientId,
      amount,
      method: 'wallet',
      timestamp: new Date().toISOString(),
      duration: durationMinutes,
      description: `Gaming session - ${durationMinutes} minutes`,
    };

    // Start session
    const session = await sessionService.startSession(
      userId,
      userName,
      clientId,
      durationMinutes,
      payment
    );

    // Notify master PC
    communication?.send({
      type: 'session_start',
      clientId,
      userId,
      payload: { session },
      timestamp: new Date().toISOString(),
    });

    setCurrentSession(session);
    setClientState('session');
  };

  const handleOAuthLoginSuccess = async (
    oauthSessionData: OAuthSession,
    durationMinutes: number,
    amount: number
  ) => {
    // Store OAuth session
    setOAuthSession(oauthSessionData);

    // Create a virtual user ID for OAuth session
    const userId = `oauth_${oauthSessionData.googleUserId}`;
    const userName = oauthSessionData.googleName;

    // Create payment record
    const payment: Payment = {
      id: `payment-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      sessionId: '', // Will be updated after session creation
      userId,
      userName,
      clientId,
      amount,
      method: 'wallet', // In production, integrate with actual payment gateway
      timestamp: new Date().toISOString(),
      duration: durationMinutes,
      description: `OAuth gaming session - ${durationMinutes} minutes`,
    };

    // Start session
    const session = await sessionService.startSession(
      userId,
      userName,
      clientId,
      durationMinutes,
      payment
    );

    // Notify master PC about OAuth login
    communication?.send({
      type: 'session_start',
      clientId,
      userId,
      payload: {
        session,
        oauthLogin: true,
        googleEmail: oauthSessionData.googleEmail,
        googleName: oauthSessionData.googleName,
      },
      timestamp: new Date().toISOString(),
    });

    setCurrentSession(session);
    setClientState('session');
  };

  const handleSessionEnd = () => {
    setCurrentSession(null);
    setOAuthSession(null);
    setClientState('login');
    authService.logout();
  };

  const handleLogout = () => {
    if (communication) {
      communication.disconnect();
      setCommunication(null);
    }
    authService.logout();
    setMode('selection');
    setClientId('');
    setClientState('login');
    setCurrentSession(null);
  };

  if (!initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4 animate-pulse">🎮</div>
          <h2 className="text-2xl font-bold mb-2">Initializing Gaming Parlour System...</h2>
          <p className="text-gray-300">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gaming-parlour-app">
      {mode === 'selection' && (
        <LoginSelector
          onMasterLogin={handleMasterLogin}
          onClientSelect={handleClientSelect}
        />
      )}

      {mode === 'master' && communication && (
        <MasterDashboard
          communication={communication}
          onLogout={handleLogout}
        />
      )}

      {mode === 'client' && communication && (
        <>
          {clientState === 'login' && (
            <ClientLogin
              clientId={clientId}
              onLoginSuccess={handleClientLoginSuccess}
              onOAuthLoginSuccess={handleOAuthLoginSuccess}
            />
          )}

          {clientState === 'session' && currentSession && (
            <ClientSession
              session={currentSession}
              clientId={clientId}
              communication={communication}
              onSessionEnd={handleSessionEnd}
              oauthSession={oauthSession}
            />
          )}
        </>
      )}
    </div>
  );
};

export default GamingParlourApp;
