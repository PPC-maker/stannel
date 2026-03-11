// WebSocket Service for Real-time Updates

import type { WebSocket } from '@fastify/websocket';

type EventType = 'invoice:created' | 'invoice:updated' | 'invoice:approved' | 'invoice:rejected' | 'invoice:deleted' | 'invoice:restored' | 'user:activated';

// WebSocket readyState constants
const WS_OPEN = 1;

interface WebSocketMessage {
  type: EventType;
  data: any;
  timestamp: string;
}

class WebSocketService {
  private clients: Set<WebSocket> = new Set();

  addClient(client: WebSocket) {
    this.clients.add(client);
    console.log(`[WebSocket] Client connected. Total clients: ${this.clients.size}`);

    client.on('close', () => {
      this.clients.delete(client);
      console.log(`[WebSocket] Client disconnected. Total clients: ${this.clients.size}`);
    });
  }

  broadcast(type: EventType, data: any) {
    const message: WebSocketMessage = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };

    const messageStr = JSON.stringify(message);
    let sentCount = 0;

    this.clients.forEach((client) => {
      if (client.readyState === WS_OPEN) {
        client.send(messageStr);
        sentCount++;
      }
    });

    console.log(`[WebSocket] Broadcast "${type}" to ${sentCount} clients`);
  }

  // Convenience methods
  invoiceCreated(invoice: any) {
    this.broadcast('invoice:created', invoice);
  }

  invoiceUpdated(invoice: any) {
    this.broadcast('invoice:updated', invoice);
  }

  invoiceApproved(invoice: any) {
    this.broadcast('invoice:approved', invoice);
  }

  invoiceRejected(invoice: any) {
    this.broadcast('invoice:rejected', invoice);
  }

  invoiceDeleted(invoice: any) {
    this.broadcast('invoice:deleted', invoice);
  }

  invoiceRestored(invoice: any) {
    this.broadcast('invoice:restored', invoice);
  }

  userActivated(user: any) {
    this.broadcast('user:activated', user);
  }

  getClientCount() {
    return this.clients.size;
  }
}

export const wsService = new WebSocketService();
