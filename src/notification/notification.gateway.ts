import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { Inject, forwardRef, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
})
export class NotificationGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger('NotificationGateway');

  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService
  ) {}

  afterInit(server: Server): void {
    this.logger.log('NotificationGateway: Socket.io server initialized');
  }

  async handleConnection(socket: Socket) {
    try {
      // Extract token from auth, query, or authorization header
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        (socket.handshake.headers?.authorization?.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.slice(7)
          : undefined);

      if (!token) {
        this.logger.debug(`Socket connection without token (socket ${socket.id})`);
        return;
      }

      let payload: any;
      try {
        payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      } catch (err) {
        this.logger.warn(`Socket connection with invalid token (${socket.id}): ${err.message}`);
        socket.disconnect();
        return;
      }

      const userId = payload.subject || payload.sub || payload.id;
      if (!userId) {
        this.logger.warn(`Socket payload missing user ID (${socket.id})`);
        socket.disconnect();
        return;
      }

      socket.data.userId = userId;
      await socket.join(userId);
      this.logger.log(`Socket user connected & joined room: ${userId} (socket ${socket.id})`);
    } catch (err) {
      this.logger.error(`Error in handleConnection: ${err.message}`);
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    const userId = socket.data?.userId;
    this.logger.debug(`Socket disconnected: user ${userId || 'anonymous'} (socket ${socket.id})`);
  }

  sendToUser(userId: string, event: string, payload: any) {
    if (!this.server) {
      this.logger.warn(`Cannot send event '${event}' to user '${userId}': Socket server not ready`);
      return;
    }
    this.server.to(userId).emit(event, payload);
  }

  broadcast(event: string, payload: any) {
    if (!this.server) {
      this.logger.warn(`Cannot broadcast event '${event}': Socket server not ready`);
      return;
    }
    this.server.emit(event, payload);
  }

  @SubscribeMessage('ping')
  handlePing(@MessageBody() data: any): string {
    return 'pong';
  }

  @SubscribeMessage('join_module')
  handleJoinModule(socket: Socket, moduleName: string) {
    if (moduleName) {
      socket.join(`module_${moduleName}`);
      return { joined: `module_${moduleName}` };
    }
  }

  @SubscribeMessage('leave_module')
  handleLeaveModule(socket: Socket, moduleName: string) {
    if (moduleName) {
      socket.leave(`module_${moduleName}`);
      return { left: `module_${moduleName}` };
    }
  }
}
