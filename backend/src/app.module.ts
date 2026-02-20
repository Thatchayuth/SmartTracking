import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TripModule } from './trip/trip.module';
import { GpsModule } from './gps/gps.module';
import { WsModule } from './ws/ws.module';
import { ReportModule } from './report/report.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UserModule,
    TripModule,
    GpsModule,
    WsModule,
    ReportModule,
  ],
})
export class AppModule {}
