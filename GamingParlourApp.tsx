/**
 * Gaming Parlour Application - Main Component
 * Manages routing between Master PC and Client PC modes
 */

import React, { useState, useEffect } from 'react';
import LoginSelector from './components/gaming/LoginSelector';
import MasterDashboard from './components/gaming/MasterDashboard';
import ClientLogin from './components/gaming/ClientLogin';
import ClientSession from './components/gaming/ClientSession';
import WaitingForApproval from './components/gaming/WaitingForApproval';
import { Session, Payment, OAuthSession } from './gaming-types';
import { sessionService } from './services/sessionService';
import { authService } from './services/authService';
import CommunicationService from './services/communicationService';
import { initializeSystem } from './services/initService';

type AppMode = 'selection' | 'master' | 'client';
type ClientState = 'login' | 'waiting_approval' | 'session';

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

  useEffect(() => {
    if (!communication || mode !== 'client') return;

    // Listen for session approval from Master PC
    const handleSessionApproval = (message: any) => {
      if (message.clientId === clientId && message.type === 'session_approved') {
        const { session } = message.payload;
        setCurrentSession(session);
        setClientState('session');
      }
    };

    communication.on('session_approved', handleSessionApproval);

    return () => {
      communication.off('session_approved', handleSessionApproval);
    };
  }, [communication, mode, clientId]);

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

  const handleOAuthLoginSuccess = async (oauthSessionData: OAuthSession) => {
    // Store OAuth session
    setOAuthSession(oauthSessionData);

    // Send OAuth login request to Master PC
    communication?.send({
      type: 'oauth_login_request',
      clientId,
      userId: `oauth_${oauthSessionData.googleUserId}`,
      payload: {
        oauthSession: oauthSessionData,
        googleEmail: oauthSessionData.googleEmail,
        googleName: oauthSessionData.googleName,
        googlePicture: oauthSessionData.googlePicture,
      },
      timestamp: new Date().toISOString(),
    });

    // Show waiting screen
    setClientState('waiting_approval');
  };

  const handleCancelWaiting = () => {
    // Cancel the request and return to login
    setOAuthSession(null);
    setClientState('login');

    // Notify master PC
    communication?.send({
      type: 'oauth_login_cancelled',
      clientId,
      timestamp: new Date().toISOString(),
    });
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

          {clientState === 'waiting_approval' && oauthSession && (
            <WaitingForApproval
              clientId={clientId}
              oauthSession={oauthSession}
              onCancel={handleCancelWaiting}
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
