import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GpsPointDto } from './dto';

@Injectable()
export class GpsService {
  private readonly logger = new Logger(GpsService.name);

  constructor(private prisma: PrismaService) {}

  async savePoint(dto: GpsPointDto) {
    return this.prisma.gpsPoint.create({
      data: {
        tripId: dto.tripId,
        segmentId: dto.segmentId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy,
        speed: dto.speed,
        heading: dto.heading,
        recordedAt: new Date(dto.recordedAt),
      },
    });
  }

  async saveBatch(points: GpsPointDto[]) {
    const result = await this.prisma.gpsPoint.createMany({
      data: points.map((p) => ({
        tripId: p.tripId,
        segmentId: p.segmentId,
        latitude: p.latitude,
        longitude: p.longitude,
        accuracy: p.accuracy,
        speed: p.speed,
        heading: p.heading,
        recordedAt: new Date(p.recordedAt),
      })),
    });

    this.logger.log(`Batch saved ${result.count} GPS points`);
    return { count: result.count };
  }

  async getPointsByTrip(tripId: string) {
    return this.prisma.gpsPoint.findMany({
      where: { tripId },
      orderBy: { recordedAt: 'asc' },
    });
  }

  async getPointsBySegment(segmentId: string) {
    return this.prisma.gpsPoint.findMany({
      where: { segmentId },
      orderBy: { recordedAt: 'asc' },
    });
  }
}
