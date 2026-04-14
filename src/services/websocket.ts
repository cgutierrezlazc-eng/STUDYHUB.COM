/**
 * WebSocket service for real-time messaging in Conniku.
 * Handles connection lifecycle, automatic reconnection, and event dispatching.
 */

type MessageHandler = (data: any) => void;
type ConnectionHandler = (connected: boolean) => void;

interface WSMessage {
  type: string;
  [key: string]: any;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string = '';
  private token: string = '';
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private isManualClose = false;
  private _connected = false;

  get connected(): boolean {
    return this._connected;
  }

  /**
   * Connect to the WebSocket server.
   */
  connect(token: string): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return; // Already connected or connecting
    }

    this.token = token;
    this.isManualClose = false;

    // Determine WebSocket URL
    const apiBase =
      window.location.hostname === 'localhost'
        ? 'ws://localhost:8899'
        : `wss://${window.location.hostname.includes('conniku.com') ? 'studyhub-api-bpco.onrender.com' : window.location.hostname}`;

    this.url = `${apiBase}/ws?token=${encodeURIComponent(token)}`;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this._connected = true;
        this.reconnectAttempts = 0;
        this._notifyConnection(true);
        this._startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const data: WSMessage = JSON.parse(event.data);
          this._dispatch(data.type, data);
        } catch (e) {
          console.error('[WS] Failed to parse message:', e);
        }
      };

      this.ws.onclose = (event) => {
        this._connected = false;
        this._stopPing();
        this._notifyConnection(false);

        if (!this.isManualClose && event.code !== 4003) {
          this._scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WS] Error:', error);
      };
    } catch (e) {
      console.error('[WS] Failed to create WebSocket:', e);
      this._scheduleReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket server.
   */
  disconnect(): void {
    this.isManualClose = true;
    this._stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close(1000, 'User disconnect');
      this.ws = null;
    }
    this._connected = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Send a message through the WebSocket.
   */
  send(data: WSMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  /**
   * Subscribe to a conversation for real-time updates.
   */
  subscribeConversation(conversationId: string): void {
    this.send({ type: 'subscribe', conversation_id: conversationId });
  }

  /**
   * Unsubscribe from a conversation.
   */
  unsubscribeConversation(conversationId: string): void {
    this.send({ type: 'unsubscribe', conversation_id: conversationId });
  }

  /**
   * Send a chat message via WebSocket.
   */
  sendMessage(
    conversationId: string,
    content: string,
    messageType: string = 'text',
    replyTo?: { id: string; content: string; senderName: string }
  ): void {
    this.send({
      type: 'message',
      conversation_id: conversationId,
      content,
      message_type: messageType,
      ...(replyTo
        ? {
            reply_to_id: replyTo.id,
            reply_to_content: replyTo.content,
            reply_to_sender_name: replyTo.senderName,
          }
        : {}),
    });
  }

  /**
   * Send typing indicator.
   */
  sendTyping(conversationId: string): void {
    this.send({ type: 'typing', conversation_id: conversationId });
  }

  /**
   * Send stop typing indicator.
   */
  sendStopTyping(conversationId: string): void {
    this.send({ type: 'stop_typing', conversation_id: conversationId });
  }

  /**
   * Mark a message as read.
   */
  markRead(conversationId: string, messageId: string): void {
    this.send({ type: 'read', conversation_id: conversationId, message_id: messageId });
  }

  /**
   * Register a handler for a specific message type.
   */
  on(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.messageHandlers.get(type)?.delete(handler);
    };
  }

  /**
   * Register a connection state handler.
   */
  onConnection(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  // ─── Private ──────────────────────────────────────────────────

  private _dispatch(type: string, data: any): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(data);
        } catch (e) {
          console.error(`[WS] Handler error for ${type}:`, e);
        }
      });
    }
    // Also dispatch to wildcard handlers
    const wildcardHandlers = this.messageHandlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach((h) => {
        try {
          h(data);
        } catch (e) {
          console.error('[WS] Wildcard handler error:', e);
        }
      });
    }
  }

  private _notifyConnection(connected: boolean): void {
    this.connectionHandlers.forEach((h) => {
      try {
        h(connected);
      } catch (e) {
        console.error('[WS] Connection handler error:', e);
      }
    });
  }

  private _scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      if (this.token) {
        this.connect(this.token);
      }
    }, delay);
  }

  private _startPing(): void {
    this._stopPing();
    this.pingTimer = setInterval(() => {
      this.send({ type: 'ping' });
    }, 25000); // Ping every 25s to keep connection alive
  }

  private _stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
}

// Global singleton
export const wsService = new WebSocketService();
