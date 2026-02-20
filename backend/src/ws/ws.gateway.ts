import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GpsService } from '../gps/gps.service';
import { GpsPointDto } from '../gps/dto';
import { JwtPayload } from '../auth/interfaces/auth.interface';

@WebSocketGateway({
  cors: {
    origin: '*', // Will be restricted in production
  },
  namespace: '/tracking',
})
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WsGateway.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private gpsService: GpsService,
  ) {}

  // ─── Connection Lifecycle ───

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Attach user info to socket
      (client as any).user = payload;

      this.logger.log(`Client connected: ${payload.employeeCode} (${client.id})`);
    } catch (error) {
      this.logger.warn(`Unauthorized WebSocket connection: ${client.id}`);
      client.emit('error', { message: 'Unauthorized' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = (client as any).user;
    this.logger.log(`Client disconnected: ${user?.employeeCode ?? client.id}`);
  }

  // ─── GPS Events ───

  @SubscribeMessage('gps:send')
  async handleGpsSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: GpsPointDto,
  ) {
    try {
      const user = (client as any).user as JwtPayload;

      await this.gpsService.savePoint(data);

      // ACK back to sender
      client.emit('gps:ack', {
        tripId: data.tripId,
        recordedAt: data.recordedAt,
        status: 'saved',
      });

      // Broadcast live position to admin viewers in the trip room
      this.server.to(`trip:${data.tripId}`).emit('gps:live', {
        tripId: data.tripId,
        userId: user.sub,
        employeeCode: user.employeeCode,
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed,
        recordedAt: data.recordedAt,
      });
    } catch (error) {
      this.logger.error(`Error saving GPS point: ${error}`);
      client.emit('gps:error', { message: 'Failed to save GPS point' });
    }
  }

  @SubscribeMessage('gps:batch')
  async handleGpsBatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { points: GpsPointDto[] },
  ) {
    try {
      const result = await this.gpsService.saveBatch(data.points);
      client.emit('gps:ack', { count: result.count, status: 'batch_saved' });
    } catch (error) {
      this.logger.error(`Error saving GPS batch: ${error}`);
      client.emit('gps:error', { message: 'Failed to save GPS batch' });
    }
  }

  // ─── Room Management ───

  @SubscribeMessage('trip:join')
  handleJoinTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string },
  ) {
    client.join(`trip:${data.tripId}`);
    this.logger.log(`Client ${client.id} joined room trip:${data.tripId}`);
    client.emit('trip:joined', { tripId: data.tripId });
  }

  @SubscribeMessage('trip:leave')
  handleLeaveTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string },
  ) {
    client.leave(`trip:${data.tripId}`);
    this.logger.log(`Client ${client.id} left room trip:${data.tripId}`);
  }

  // ─── Broadcast trip status (called from TripService via events) ───

  broadcastTripStatus(tripId: string, status: string, data?: any) {
    this.server.to(`trip:${tripId}`).emit('trip:status', {
      tripId,
      status,
      ...data,
    });
  }
}
