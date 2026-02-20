import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WsGateway } from './ws.gateway';
import { GpsModule } from '../gps/gps.module';

@Module({
  imports: [
    GpsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  providers: [WsGateway],
  exports: [WsGateway],
})
export class WsModule {}
