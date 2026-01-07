/**
 * Pending OAuth Requests Panel
 * Shows OAuth login requests awaiting approval from staff
 */

import React, { useState, useEffect } from 'react';
import { OAuthSession, PricingRule, Payment } from '../../gaming-types';
import { db } from '../../services/databaseService';
import { sessionService } from '../../services/sessionService';
import CommunicationService from '../../services/communicationService';

interface OAuthRequest {
  clientId: string;
  oauthSession: OAuthSession;
  requestedAt: string;
}

interface Props {
  communication: CommunicationService;
}

const PendingOAuthRequests: React.FC<Props> = ({ communication }) => {
  const [requests, setRequests] = useState<OAuthRequest[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<OAuthRequest | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PricingRule | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPricingRules();

    // Listen for OAuth login requests
    const handleOAuthRequest = (message: any) => {
      if (message.type === 'oauth_login_request') {
        const newRequest: OAuthRequest = {
          clientId: message.clientId,
          oauthSession: message.payload.oauthSession,
          requestedAt: message.timestamp,
        };

        setRequests(prev => {
          // Check if request already exists
          const exists = prev.some(r => r.clientId === newRequest.clientId);
          if (exists) return prev;
          return [...prev, newRequest];
        });
      }

      // Remove cancelled requests
      if (message.type === 'oauth_login_cancelled') {
        setRequests(prev => prev.filter(r => r.clientId !== message.clientId));
        if (selectedRequest?.clientId === message.clientId) {
          setSelectedRequest(null);
        }
      }
    };

    communication.on('oauth_login_request', handleOAuthRequest);
    communication.on('oauth_login_cancelled', handleOAuthRequest);

    return () => {
      communication.off('oauth_login_request', handleOAuthRequest);
      communication.off('oauth_login_cancelled', handleOAuthRequest);
    };
  }, [communication, selectedRequest]);

  const loadPricingRules = async () => {
    const rules = await db.getAllPricingRules();
    const activeRules = rules.filter(r => r.isActive);
    setPricingRules(activeRules);
    if (activeRules.length > 0) {
      setSelectedPlan(activeRules[1]); // Default to 1 hour
    }
  };

  const handleApprove = async (request: OAuthRequest) => {
    if (!selectedPlan) {
      alert('Please select a pricing plan');
      return;
    }

    setLoading(true);

    try {
      // Create virtual user ID for OAuth session
      const userId = `oauth_${request.oauthSession.googleUserId}`;
      const userName = request.oauthSession.googleName;

      // Create payment record
      const payment: Payment = {
        id: `payment-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        sessionId: '',
        userId,
        userName,
        clientId: request.clientId,
        amount: selectedPlan.price,
        method: paymentMethod,
        timestamp: new Date().toISOString(),
        duration: selectedPlan.duration,
        description: `OAuth gaming session - ${selectedPlan.duration} minutes`,
      };

      // Save payment to database
      await db.addPayment(payment);

      // Start session
      const session = await sessionService.startSession(
        userId,
        userName,
        request.clientId,
        selectedPlan.duration,
        payment
      );

      // Send approval to client PC
      communication.send({
        type: 'session_approved',
        clientId: request.clientId,
        userId,
        payload: {
          session,
          oauthSession: request.oauthSession,
        },
        timestamp: new Date().toISOString(),
      });

      // Remove from pending requests
      setRequests(prev => prev.filter(r => r.clientId !== request.clientId));
      setSelectedRequest(null);

      alert(`Session approved for ${userName} on ${request.clientId}`);
    } catch (error: any) {
      console.error('Failed to approve session:', error);
      alert('Failed to approve session: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = (request: OAuthRequest) => {
    if (confirm(`Reject login request from ${request.oauthSession.googleName}?`)) {
      // Send rejection to client
      communication.send({
        type: 'session_rejected',
        clientId: request.clientId,
        timestamp: new Date().toISOString(),
      });

      // Remove from requests
      setRequests(prev => prev.filter(r => r.clientId !== request.clientId));
      setSelectedRequest(null);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4">📧 Pending OAuth Requests</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-gray-400">No pending requests</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <h3 className="text-xl font-bold text-white mb-4">
        📧 Pending OAuth Requests ({requests.length})
      </h3>

      <div className="space-y-4">
        {requests.map((request) => (
          <div
            key={request.clientId}
            className={`bg-white/5 rounded-lg p-4 border-2 transition ${
              selectedRequest?.clientId === request.clientId
                ? 'border-blue-400'
                : 'border-white/10'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* User Avatar */}
              <img
                src={request.oauthSession.googlePicture}
                alt={request.oauthSession.googleName}
                className="w-16 h-16 rounded-full border-2 border-white/20"
              />

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-lg font-bold text-white">
                      {request.oauthSession.googleName}
                    </h4>
                    <p className="text-sm text-gray-400">{request.oauthSession.googleEmail}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {request.clientId} • {new Date(request.requestedAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-600 text-white text-xs font-semibold rounded-full animate-pulse">
                    WAITING
                  </span>
                </div>

                {/* Approval Section */}
                {selectedRequest?.clientId === request.clientId ? (
                  <div className="mt-4 bg-black/30 rounded-lg p-4 space-y-4">
                    {/* Pricing Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Select Gaming Time:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {pricingRules.map(rule => (
                          <button
                            key={rule.id}
                            onClick={() => setSelectedPlan(rule)}
                            className={`p-3 rounded-lg border-2 transition ${
                              selectedPlan?.id === rule.id
                                ? 'bg-blue-600 border-blue-400'
                                : 'bg-white/5 border-white/10 hover:border-white/30'
                            }`}
                          >
                            <p className="text-xs text-gray-300">{rule.name}</p>
                            <p className="text-lg font-bold text-white">₹{rule.price}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Payment Method:
                      </label>
                      <div className="flex gap-2">
                        {['cash', 'card', 'upi'].map(method => (
                          <button
                            key={method}
                            onClick={() => setPaymentMethod(method as any)}
                            className={`flex-1 px-4 py-2 rounded-lg border-2 transition ${
                              paymentMethod === method
                                ? 'bg-green-600 border-green-400'
                                : 'bg-white/5 border-white/10 hover:border-white/30'
                            }`}
                          >
                            <span className="text-sm font-semibold text-white uppercase">
                              {method}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(request)}
                        disabled={loading || !selectedPlan}
                        className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition"
                      >
                        {loading ? 'Approving...' : `Approve - ₹${selectedPlan?.price || 0}`}
                      </button>
                      <button
                        onClick={() => handleReject(request)}
                        disabled={loading}
                        className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => setSelectedRequest(null)}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                  >
                    Review & Approve
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingOAuthRequests;
