/**
 * Client PC Active Session
 * Shows countdown timer, warnings, and session controls
 */

import React, { useState, useEffect, useRef } from 'react';
import { Session } from '../../gaming-types';
import { sessionService } from '../../services/sessionService';
import CommunicationService from '../../services/communicationService';

interface Props {
  session: Session;
  clientId: string;
  communication: CommunicationService;
  onSessionEnd: () => void;
}

const ClientSession: React.FC<Props> = ({ session, clientId, communication, onSessionEnd }) => {
  const [remainingTime, setRemainingTime] = useState(session.remainingTime);
  const [showWarning, setShowWarning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const warningShownRef = useRef(false);

  useEffect(() => {
    // Register timer callback
    sessionService.onTimerUpdate(session.id, (minutes) => {
      setRemainingTime(minutes);
    });

    // Register warning callback
    sessionService.onWarning(session.id, () => {
      if (!warningShownRef.current) {
        warningShownRef.current = true;
        setShowWarning(true);
        playWarningSound();
        showBrowserNotification();
      }
    });

    // Register expiry callback
    sessionService.onExpiry(session.id, () => {
      alert('Your session has expired. Thank you for playing!');
      onSessionEnd();
    });

    // Listen for extension messages from master
    const handleExtension = (message: any) => {
      if (message.clientId === clientId && message.type === 'extension') {
        const additionalMinutes = message.payload.additionalMinutes;
        alert(`Your session has been extended by ${additionalMinutes} minutes!`);
        setShowWarning(false);
        warningShownRef.current = false;
      }
    };

    const handleSessionEnd = (message: any) => {
      if (message.clientId === clientId && message.type === 'session_end') {
        alert('Your session has been ended by staff. Thank you!');
        onSessionEnd();
      }
    };

    communication.on('extension', handleExtension);
    communication.on('session_end', handleSessionEnd);

    return () => {
      communication.off('extension', handleExtension);
      communication.off('session_end', handleSessionEnd);
    };
  }, [session.id, clientId, communication, onSessionEnd]);

  const playWarningSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const showBrowserNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Gaming Time Warning', {
        body: '5 minutes remaining in your session!',
        icon: '🎮',
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Gaming Time Warning', {
            body: '5 minutes remaining in your session!',
            icon: '🎮',
          });
        }
      });
    }
  };

  const handlePause = async () => {
    if (isPaused) {
      await sessionService.resumeSession(session.id);
      communication.send({
        type: 'resume',
        clientId,
        timestamp: new Date().toISOString(),
      });
      setIsPaused(false);
    } else {
      await sessionService.pauseSession(session.id);
      communication.send({
        type: 'pause',
        clientId,
        timestamp: new Date().toISOString(),
      });
      setIsPaused(true);
    }
  };

  const handleEndSession = async () => {
    if (confirm('Are you sure you want to end your session?')) {
      await sessionService.endSession(session.id);
      communication.send({
        type: 'session_end',
        clientId,
        timestamp: new Date().toISOString(),
      });
      onSessionEnd();
    }
  };

  const getTimerColor = () => {
    if (remainingTime <= 5) return 'text-red-500';
    if (remainingTime <= 15) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getProgressPercentage = () => {
    return (remainingTime / session.plannedDuration) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{clientId} - Active Session</h1>
            <p className="text-sm text-gray-300">Welcome, {session.userName}!</p>
          </div>
          <button
            onClick={handleEndSession}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
          >
            End Session
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          {/* Timer Display */}
          <div className="mb-8">
            <p className="text-lg text-gray-300 mb-4">Time Remaining</p>
            <div className={`text-9xl font-bold mb-4 ${getTimerColor()} transition-colors`}>
              {sessionService.formatTime(remainingTime)}
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-2xl mx-auto h-4 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  remainingTime <= 5
                    ? 'bg-red-500'
                    : remainingTime <= 15
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-4 justify-center mb-8">
            <button
              onClick={handlePause}
              className={`px-8 py-4 rounded-xl font-semibold transition ${
                isPaused
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-yellow-600 hover:bg-yellow-700'
              }`}
            >
              {isPaused ? '▶️ Resume' : '⏸️ Pause'}
            </button>
          </div>

          {/* Session Info */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-3">Session Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Started:</span>
                <span className="font-semibold">
                  {new Date(session.startTime).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Total Time:</span>
                <span className="font-semibold">{session.plannedDuration} minutes</span>
              </div>
              {session.extensionHistory && session.extensionHistory.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-300">Extensions:</span>
                  <span className="font-semibold">{session.extensionHistory.length}</span>
                </div>
              )}
              {isPaused && (
                <div className="bg-yellow-500/20 border border-yellow-500 rounded p-2 mt-2">
                  <p className="text-yellow-200 font-semibold">⏸️ Session Paused</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-pulse">
          <div className="bg-red-600 rounded-2xl p-8 max-w-md w-full text-center border-4 border-white">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-3xl font-bold mb-4">Time Warning!</h2>
            <p className="text-xl mb-6">
              Only <span className="font-bold">5 minutes</span> remaining in your session!
            </p>
            <button
              onClick={() => setShowWarning(false)}
              className="px-8 py-3 bg-white text-red-600 font-bold rounded-lg hover:bg-gray-100 transition"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Tip */}
      <div className="bg-black/30 backdrop-blur-sm border-t border-white/10 p-4 text-center">
        <p className="text-sm text-gray-300">
          Press <kbd className="px-2 py-1 bg-white/20 rounded">F11</kbd> for fullscreen gaming experience
        </p>
      </div>
    </div>
  );
};

export default ClientSession;
