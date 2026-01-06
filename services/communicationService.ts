/**
 * Communication Service
 * Handles real-time communication between Master and Client PCs
 *
 * Two modes:
 * 1. Local mode: Uses BroadcastChannel API for same-machine testing
 * 2. Network mode: Uses WebSocket for cross-machine communication
 */

import { WebSocketMessage } from '../gaming-types';

type MessageHandler = (message: WebSocketMessage) => void;

class CommunicationService {
  private mode: 'local' | 'network';
  private channel: BroadcastChannel | null = null;
  private ws: WebSocket | null = null;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private clientId: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: number | null = null;

  constructor(clientId: string, mode: 'local' | 'network' = 'local') {
    this.clientId = clientId;
    this.mode = mode;
  }

  /**
   * Initialize communication service
   */
  async connect(serverUrl?: string): Promise<void> {
    if (this.mode === 'local') {
      this.connectLocal();
    } else {
      if (!serverUrl) {
        throw new Error('Server URL required for network mode');
      }
      await this.connectNetwork(serverUrl);
    }

    // Send initial connection message
    this.send({
      type: 'connect',
      clientId: this.clientId,
      timestamp: new Date().toISOString(),
    });

    // Start heartbeat
    this.startHeartbeat();
  }

  /**
   * Local mode using BroadcastChannel (same machine)
   */
  private connectLocal(): void {
    this.channel = new BroadcastChannel('gaming-parlour');

    this.channel.onmessage = (event) => {
      const message: WebSocketMessage = event.data;

      // Ignore own messages
      if (message.clientId === this.clientId) return;

      this.handleMessage(message);
    };

    console.log(`[Communication] Connected in local mode as ${this.clientId}`);
  }

  /**
   * Network mode using WebSocket (cross-machine)
   */
  private async connectNetwork(serverUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(serverUrl);

      this.ws.onopen = () => {
        console.log(`[Communication] Connected to server as ${this.clientId}`);
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = (event) => {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      };

      this.ws.onerror = (error) => {
        console.error('[Communication] WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('[Communication] Disconnected from server');
        this.attemptReconnect(serverUrl);
      };
    });
  }

  /**
   * Attempt to reconnect to WebSocket server
   */
  private attemptReconnect(serverUrl: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Communication] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`[Communication] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = window.setTimeout(() => {
      this.connectNetwork(serverUrl).catch(console.error);
    }, delay);
  }

  /**
   * Send message to all connected clients
   */
  send(message: WebSocketMessage): void {
    message.clientId = message.clientId || this.clientId;
    message.timestamp = message.timestamp || new Date().toISOString();

    if (this.mode === 'local' && this.channel) {
      this.channel.postMessage(message);
    } else if (this.mode === 'network' && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('[Communication] Not connected, cannot send message');
    }
  }

  /**
   * Register message handler
   */
  on(type: WebSocketMessage['type'] | 'all', handler: MessageHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);
  }

  /**
   * Unregister message handler
   */
  off(type: WebSocketMessage['type'] | 'all', handler: MessageHandler): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: WebSocketMessage): void {
    // Call type-specific handlers
    const typeHandlers = this.handlers.get(message.type) || [];
    typeHandlers.forEach(handler => handler(message));

    // Call global handlers
    const allHandlers = this.handlers.get('all') || [];
    allHandlers.forEach(handler => handler(message));
  }

  /**
   * Send heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    setInterval(() => {
      this.send({
        type: 'heartbeat',
        clientId: this.clientId,
        timestamp: new Date().toISOString(),
      });
    }, 30000); // Every 30 seconds
  }

  /**
   * Disconnect from communication service
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.send({
      type: 'disconnect',
      clientId: this.clientId,
      timestamp: new Date().toISOString(),
    });

    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.handlers.clear();
  }

  /**
   * Get client ID
   */
  getClientId(): string {
    return this.clientId;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    if (this.mode === 'local') {
      return this.channel !== null;
    } else {
      return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }
  }
}

export default CommunicationService;
