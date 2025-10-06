// ...existing code...
// ...existing code...
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

import { AuthService } from 'src/auth/auth.service';
import { Inject, forwardRef } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({ cors: true })
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('ping')
  handlePing(@MessageBody() data: any): string {
    return 'pong';
  }

  constructor(
    @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService
  ) {
  }

  sendToUser(userId: string, event: string, payload: any) {
    this.server.to(userId).emit(event, payload);
  }

  broadcast(event: string, payload: any) {
    this.server.emit(event, payload);
  }
  afterInit(server: Server): void {
    console.log('NotificationGateway afterInit: Socket.io server initialized');
    server.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) {
          return next(new Error('Authentication token missing'));
        }
        // Validate token using AuthService
        let payload: any;
        try {
          payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        } catch (err) {
          return next(new Error('Invalid token'));
        }
        // Attach userId to socket
        socket.data.userId = payload.subject || payload.sub || payload.id;
        // Join room for user
        socket.join(socket.data.userId);
        return next();
      } catch (err) {
        return next(new Error('Socket authentication failed'));
      }
    });
  }
}
