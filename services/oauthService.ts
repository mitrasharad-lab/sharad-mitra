/**
 * Google OAuth Service
 * Handles Gmail authentication for client PC login
 */

import {
  GoogleOAuthToken,
  GoogleUserInfo,
  OAuthSession,
} from '../gaming-types';

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'demo-client-id';
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/oauth/callback`;
const GOOGLE_SCOPE = 'openid profile email';

// Development mode flag
const DEV_MODE = import.meta.env.DEV || !import.meta.env.VITE_GOOGLE_CLIENT_ID;

class OAuthService {
  private oauthSessions: Map<string, OAuthSession> = new Map();
  private storageKey = 'gaming_oauth_sessions';

  constructor() {
    this.loadSessions();
  }

  /**
   * Load OAuth sessions from localStorage
   */
  private loadSessions() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const sessions: OAuthSession[] = JSON.parse(stored);
        sessions.forEach(session => {
          this.oauthSessions.set(session.id, session);
        });
      }
    } catch (error) {
      console.error('Failed to load OAuth sessions:', error);
    }
  }

  /**
   * Save OAuth sessions to localStorage
   */
  private saveSessions() {
    try {
      const sessions = Array.from(this.oauthSessions.values());
      localStorage.setItem(this.storageKey, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save OAuth sessions:', error);
    }
  }

  /**
   * Initiate Google OAuth login flow
   */
  async initiateGoogleLogin(clientId: string): Promise<void> {
    if (DEV_MODE) {
      // In development mode, simulate OAuth flow
      return this.simulateGoogleLogin(clientId);
    }

    // Production OAuth flow
    const authUrl = this.buildGoogleAuthUrl();

    // Store client ID for callback
    sessionStorage.setItem('oauth_client_id', clientId);

    // Redirect to Google OAuth
    window.location.href = authUrl;
  }

  /**
   * Simulate Google login for development
   */
  private async simulateGoogleLogin(clientId: string): Promise<void> {
    return new Promise((resolve) => {
      // Show a simulated Google login modal
      const email = prompt('Enter your Gmail address (simulated):') || 'demo@gmail.com';
      const name = prompt('Enter your name:') || 'Demo User';

      if (email && name) {
        // Create simulated OAuth session
        const googleUserId = 'google_' + Math.random().toString(36).substring(7);
        const token: GoogleOAuthToken = {
          accessToken: 'simulated_access_token_' + Date.now(),
          idToken: 'simulated_id_token_' + Date.now(),
          expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
          tokenType: 'Bearer',
        };

        const session: OAuthSession = {
          id: 'oauth_' + Date.now(),
          userId: '', // Will be linked after account creation
          googleUserId,
          googleEmail: email,
          googleName: name,
          googlePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
          token,
          clientId,
          createdAt: new Date().toISOString(),
        };

        this.oauthSessions.set(session.id, session);
        this.saveSessions();

        // Dispatch custom event for the UI to handle
        window.dispatchEvent(new CustomEvent('oauth_success', {
          detail: { session },
        }));

        resolve();
      } else {
        throw new Error('OAuth login cancelled');
      }
    });
  }

  /**
   * Build Google OAuth authorization URL
   */
  private buildGoogleAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: GOOGLE_SCOPE,
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Handle OAuth callback (exchange code for tokens)
   */
  async handleOAuthCallback(code: string, state: string): Promise<OAuthSession> {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokenData = await tokenResponse.json();

    // Get user info
    const userInfo = await this.getUserInfo(tokenData.access_token);

    // Retrieve client ID from session storage
    const clientId = sessionStorage.getItem('oauth_client_id') || 'PC-1';
    sessionStorage.removeItem('oauth_client_id');

    // Create OAuth session
    const token: GoogleOAuthToken = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      idToken: tokenData.id_token,
      expiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      tokenType: tokenData.token_type,
    };

    const session: OAuthSession = {
      id: 'oauth_' + Date.now(),
      userId: '', // Will be linked after account creation
      googleUserId: userInfo.id,
      googleEmail: userInfo.email,
      googleName: userInfo.name,
      googlePicture: userInfo.picture,
      token,
      clientId,
      createdAt: new Date().toISOString(),
    };

    this.oauthSessions.set(session.id, session);
    this.saveSessions();

    return session;
  }

  /**
   * Get Google user info using access token
   */
  private async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return await response.json();
  }

  /**
   * Get OAuth session by ID
   */
  getSession(sessionId: string): OAuthSession | null {
    return this.oauthSessions.get(sessionId) || null;
  }

  /**
   * Get OAuth session by client ID
   */
  getSessionByClientId(clientId: string): OAuthSession | null {
    return Array.from(this.oauthSessions.values())
      .find(session => session.clientId === clientId) || null;
  }

  /**
   * Link OAuth session to user account
   */
  linkToUser(sessionId: string, userId: string): void {
    const session = this.oauthSessions.get(sessionId);
    if (session) {
      session.userId = userId;
      this.saveSessions();
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(sessionId: string): Promise<void> {
    const session = this.oauthSessions.get(sessionId);
    if (!session || !session.token.refreshToken) {
      throw new Error('No refresh token available');
    }

    if (DEV_MODE) {
      // Simulate token refresh
      session.token.accessToken = 'simulated_refreshed_token_' + Date.now();
      session.token.expiresAt = new Date(Date.now() + 3600000).toISOString();
      session.lastRefreshAt = new Date().toISOString();
      this.saveSessions();
      return;
    }

    // Production token refresh
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: session.token.refreshToken,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();

    session.token.accessToken = data.access_token;
    session.token.expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
    session.lastRefreshAt = new Date().toISOString();

    this.saveSessions();
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(sessionId: string): boolean {
    const session = this.oauthSessions.get(sessionId);
    if (!session) return true;

    return new Date(session.token.expiresAt) < new Date();
  }

  /**
   * Logout (revoke tokens and clear session)
   */
  async logout(sessionId: string): Promise<void> {
    const session = this.oauthSessions.get(sessionId);
    if (!session) return;

    if (!DEV_MODE && session.token.accessToken) {
      // Revoke token in production
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${session.token.accessToken}`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Failed to revoke token:', error);
      }
    }

    this.oauthSessions.delete(sessionId);
    this.saveSessions();
  }

  /**
   * Clear all OAuth sessions
   */
  clearAllSessions(): void {
    this.oauthSessions.clear();
    localStorage.removeItem(this.storageKey);
  }
}

export const oauthService = new OAuthService();
export default oauthService;
