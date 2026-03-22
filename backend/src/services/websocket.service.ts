// WebSocket Service for Real-time Updates
// Optimized for 1500+ users with targeted messaging

import type { WebSocket } from '@fastify/websocket';

type EventType = 'invoice:created' | 'invoice:updated' | 'invoice:approved' | 'invoice:rejected' | 'invoice:deleted' | 'invoice:restored' | 'user:activated' | 'notification:new';

// WebSocket readyState constants
const WS_OPEN = 1;

interface WebSocketMessage {
  type: EventType;
  data: any;
  timestamp: string;
}

interface ClientInfo {
  socket: WebSocket;
  userId?: string;
  role?: string;
}

class WebSocketService {
  // Map of userId -> client info for targeted messaging
  private clientsByUser: Map<string, ClientInfo> = new Map();
  // Set of admin connections for admin-only broadcasts
  private adminClients: Set<WebSocket> = new Set();
  // All clients for general broadcasts
  private allClients: Set<ClientInfo> = new Set();

  addClient(client: WebSocket, userId?: string, role?: string) {
    const clientInfo: ClientInfo = { socket: client, userId, role };
    this.allClients.add(clientInfo);

    if (userId) {
      this.clientsByUser.set(userId, clientInfo);
    }
    if (role === 'ADMIN') {
      this.adminClients.add(client);
    }

    console.log(`[WebSocket] Client connected (userId: ${userId || 'anonymous'}). Total: ${this.allClients.size}`);

    client.on('close', () => {
      this.allClients.delete(clientInfo);
      if (userId) {
        this.clientsByUser.delete(userId);
      }
      if (role === 'ADMIN') {
        this.adminClients.delete(client);
      }
      console.log(`[WebSocket] Client disconnected. Total: ${this.allClients.size}`);
    });
  }

  // Send to specific user only
  sendToUser(userId: string, type: EventType, data: any) {
    const client = this.clientsByUser.get(userId);
    if (client && client.socket.readyState === WS_OPEN) {
      const message: WebSocketMessage = { type, data, timestamp: new Date().toISOString() };
      client.socket.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  // Send to multiple specific users
  sendToUsers(userIds: string[], type: EventType, data: any) {
    const message: WebSocketMessage = { type, data, timestamp: new Date().toISOString() };
    const messageStr = JSON.stringify(message);
    let sentCount = 0;

    for (const userId of userIds) {
      const client = this.clientsByUser.get(userId);
      if (client && client.socket.readyState === WS_OPEN) {
        client.socket.send(messageStr);
        sentCount++;
      }
    }

    return sentCount;
  }

  // Broadcast to all admins only
  broadcastToAdmins(type: EventType, data: any) {
    const message: WebSocketMessage = { type, data, timestamp: new Date().toISOString() };
    const messageStr = JSON.stringify(message);
    let sentCount = 0;

    this.adminClients.forEach((client) => {
      if (client.readyState === WS_OPEN) {
        client.send(messageStr);
        sentCount++;
      }
    });

    return sentCount;
  }

  // Broadcast to everyone (use sparingly for 1500+ users)
  broadcast(type: EventType, data: any) {
    const message: WebSocketMessage = { type, data, timestamp: new Date().toISOString() };
    const messageStr = JSON.stringify(message);
    let sentCount = 0;

    this.allClients.forEach((clientInfo) => {
      if (clientInfo.socket.readyState === WS_OPEN) {
        clientInfo.socket.send(messageStr);
        sentCount++;
      }
    });

    console.log(`[WebSocket] Broadcast "${type}" to ${sentCount} clients`);
    return sentCount;
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
    return this.allClients.size;
  }

  getAdminCount() {
    return this.adminClients.size;
  }

  isUserConnected(userId: string) {
    return this.clientsByUser.has(userId);
  }
}

export const wsService = new WebSocketService();
