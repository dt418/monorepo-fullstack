import type { Server as HttpServer } from 'http';
import type { Http2Server } from 'http2';
import type { WsMessage, WsEventType } from '@myorg/types';
import { createLogger } from '@myorg/utils';
import type { Socket } from 'socket.io';
import { Server } from 'socket.io';
import { container } from '../container';
import { AuthService } from '../services';

const logger = createLogger('WebSocket');

interface AuthenticatedSocket extends Socket {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * WebSocket gateway with authentication and room management
 */
export class WebSocketGateway {
  private io: Server;
  private static instance: WebSocketGateway | null = null;

  private constructor(server: HttpServer | Http2Server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    logger.info('WebSocket gateway initialized');
  }

  /**
   * Get or create singleton instance
   */
  static initialize(server: HttpServer | Http2Server): WebSocketGateway {
    if (!WebSocketGateway.instance) {
      WebSocketGateway.instance = new WebSocketGateway(server);
    }
    return WebSocketGateway.instance;
  }

  static getInstance(): WebSocketGateway | null {
    return WebSocketGateway.instance;
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware() {
    this.io.use((socket: AuthenticatedSocket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      try {
        const authService = container.resolve(AuthService);
        const payload = authService.verifyAccessToken(token);
        socket.user = payload;
        next();
      } catch (err) {
        next(new Error('Invalid token'));
      }
    });
  }

  /**
   * Setup connection and event handlers
   */
  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`Client connected: ${socket.id} (${socket.user?.email})`);

      // Join user-specific room
      if (socket.user) {
        socket.join(`user:${socket.user.userId}`);

        // Broadcast online status
        this.broadcast('user:online', {
          userId: socket.user.userId,
          email: socket.user.email,
        });
      }

      // Handle room joining
      socket.on('join:room', (room: string) => {
        socket.join(room);
        logger.debug(`${socket.user?.email} joined room: ${room}`);

        this.toRoom(room, 'presence:join', {
          userId: socket.user?.userId,
          email: socket.user?.email,
          room,
        });
      });

      // Handle room leaving
      socket.on('leave:room', (room: string) => {
        socket.leave(room);
        logger.debug(`${socket.user?.email} left room: ${room}`);

        this.toRoom(room, 'presence:leave', {
          userId: socket.user?.userId,
          email: socket.user?.email,
          room,
        });
      });

      // Handle ping
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);

        if (socket.user) {
          this.broadcast('user:offline', {
            userId: socket.user.userId,
            email: socket.user.email,
          });
        }
      });
    });
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(event: WsEventType, payload: unknown): void {
    const message: WsMessage = {
      event,
      payload,
      timestamp: new Date(),
    };
    this.io.emit(event, message);
  }

  /**
   * Send to specific room
   */
  toRoom(room: string, event: WsEventType, payload: unknown): void {
    const message: WsMessage = {
      event,
      payload,
      timestamp: new Date(),
    };
    this.io.to(room).emit(event, message);
  }

  /**
   * Send to specific user
   */
  toUser(userId: string, event: WsEventType, payload: unknown): void {
    this.toRoom(`user:${userId}`, event, payload);
  }

  /**
   * Get connected clients count
   */
  getConnectionsCount(): number {
    return this.io.engine.clientsCount;
  }
}
