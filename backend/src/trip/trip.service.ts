import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { StartTripDto, TripQueryDto } from './dto';

// SQL Server does not support Prisma enums — use string constants
const TripStatus = {
  Started: 'Started',
  Paused: 'Paused',
  Resumed: 'Resumed',
  Stopped: 'Stopped',
} as const;

const SegmentStatus = {
  Active: 'Active',
  Closed: 'Closed',
} as const;

@Injectable()
export class TripService {
  private readonly logger = new Logger(TripService.name);

  constructor(private prisma: PrismaService) {}

  // ═══ START TRIP ═══
  async startTrip(userId: string, dto: StartTripDto) {
    // Check if user has an active trip
    const activeTrip = await this.prisma.trip.findFirst({
      where: {
        userId,
        status: { in: [TripStatus.Started, TripStatus.Paused, TripStatus.Resumed] },
      },
    });

    if (activeTrip) {
      throw new BadRequestException('You already have an active trip. Stop it first.');
    }

    const trip = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newTrip = await tx.trip.create({
        data: {
          userId,
          status: TripStatus.Started,
          note: dto.note,
        },
      });

      await tx.tripSegment.create({
        data: {
          tripId: newTrip.id,
          segmentOrder: 1,
          status: SegmentStatus.Active,
        },
      });

      return tx.trip.findUnique({
        where: { id: newTrip.id },
        include: {
          segments: { orderBy: { segmentOrder: 'desc' }, take: 1 },
        },
      });
    });

    this.logger.log(`Trip started: ${trip!.id} by user ${userId}`);

    return {
      tripId: trip!.id,
      status: trip!.status,
      startedAt: trip!.startedAt,
      activeSegmentId: trip!.segments[0].id,
    };
  }

  // ═══ PAUSE TRIP ═══
  async pauseTrip(tripId: string, userId: string) {
    const trip = await this.getActiveTripOrFail(tripId, userId);

    if (trip.status === TripStatus.Paused) {
      throw new BadRequestException('Trip is already paused');
    }

    if (trip.status === TripStatus.Stopped) {
      throw new BadRequestException('Trip is already stopped');
    }

    await this.prisma.$transaction([
      // Close active segment
      this.prisma.tripSegment.updateMany({
        where: { tripId, status: SegmentStatus.Active },
        data: { status: SegmentStatus.Closed, endedAt: new Date() },
      }),
      // Update trip status
      this.prisma.trip.update({
        where: { id: tripId },
        data: { status: TripStatus.Paused },
      }),
    ]);

    this.logger.log(`Trip paused: ${tripId}`);
    return { tripId, status: TripStatus.Paused };
  }

  // ═══ RESUME TRIP ═══
  async resumeTrip(tripId: string, userId: string) {
    const trip = await this.getActiveTripOrFail(tripId, userId);

    if (trip.status !== TripStatus.Paused) {
      throw new BadRequestException('Trip is not paused');
    }

    const maxSegment = await this.prisma.tripSegment.aggregate({
      where: { tripId },
      _max: { segmentOrder: true },
    });

    const nextOrder = (maxSegment._max.segmentOrder ?? 0) + 1;

    const segment = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.trip.update({
        where: { id: tripId },
        data: { status: TripStatus.Resumed },
      });

      return tx.tripSegment.create({
        data: {
          tripId,
          segmentOrder: nextOrder,
          status: SegmentStatus.Active,
        },
      });
    });

    this.logger.log(`Trip resumed: ${tripId}, new segment: ${segment.id}`);

    return {
      tripId,
      status: TripStatus.Resumed,
      newSegmentId: segment.id,
    };
  }

  // ═══ STOP TRIP ═══
  async stopTrip(tripId: string, userId: string) {
    const trip = await this.getActiveTripOrFail(tripId, userId);

    if (trip.status === TripStatus.Stopped) {
      throw new BadRequestException('Trip is already stopped');
    }

    // Calculate total distance and duration from GPS points
    const gpsPoints = await this.prisma.gpsPoint.findMany({
      where: { tripId },
      orderBy: { recordedAt: 'asc' },
      select: { latitude: true, longitude: true, recordedAt: true, segmentId: true },
    });

    const totalDistance = this.calculateTotalDistance(gpsPoints);

    // Calculate duration = sum of each segment's active time
    const segments = await this.prisma.tripSegment.findMany({
      where: { tripId },
      orderBy: { segmentOrder: 'asc' },
    });

    let totalDuration = 0;
    const now = new Date();
    for (const seg of segments) {
      const end = seg.endedAt ?? now;
      totalDuration += Math.floor((end.getTime() - seg.startedAt.getTime()) / 1000);
    }

    await this.prisma.$transaction([
      // Close any active segments
      this.prisma.tripSegment.updateMany({
        where: { tripId, status: SegmentStatus.Active },
        data: { status: SegmentStatus.Closed, endedAt: now },
      }),
      // Finalize trip
      this.prisma.trip.update({
        where: { id: tripId },
        data: {
          status: TripStatus.Stopped,
          endedAt: now,
          totalDistance: Math.round(totalDistance * 100) / 100,
          totalDuration,
        },
      }),
    ]);

    this.logger.log(`Trip stopped: ${tripId}, distance: ${totalDistance.toFixed(2)}km, duration: ${totalDuration}s`);

    return {
      tripId,
      status: TripStatus.Stopped,
      endedAt: now,
      totalDistanceKm: Math.round(totalDistance * 100) / 100,
      totalDurationSec: totalDuration,
    };
  }

  // ═══ LIST TRIPS ═══
  async findAll(query: TripQueryDto, currentUserId: string, currentRoles: string[]) {
    const where: any = {};

    // Sale can only see their own trips
    if (currentRoles.includes('Sale') && !currentRoles.includes('Admin') && !currentRoles.includes('Manager')) {
      where.userId = currentUserId;
    } else if (query.userId) {
      where.userId = query.userId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.fromDate || query.toDate) {
      where.startedAt = {};
      if (query.fromDate) where.startedAt.gte = new Date(`${query.fromDate}T00:00:00Z`);
      if (query.toDate) where.startedAt.lte = new Date(`${query.toDate}T23:59:59Z`);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.trip.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, employeeCode: true } },
          _count: { select: { segments: true } },
        },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.trip.count({ where }),
    ]);

    return {
      data: data.map((t: any) => ({
        id: t.id,
        user: t.user,
        status: t.status,
        startedAt: t.startedAt,
        endedAt: t.endedAt,
        totalDistanceKm: t.totalDistance,
        totalDurationSec: t.totalDuration,
        segmentCount: t._count.segments,
        note: t.note,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ═══ GET TRIP DETAIL ═══
  async findById(tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        user: { select: { id: true, fullName: true, employeeCode: true } },
        segments: { orderBy: { segmentOrder: 'asc' } },
      },
    });

    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  // ═══ GET TRIP ROUTE (GPS Points) ═══
  async getRoute(tripId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');

    return this.prisma.gpsPoint.findMany({
      where: { tripId },
      orderBy: { recordedAt: 'asc' },
    });
  }

  // ═══ GET ACTIVE TRIP for user ═══
  async getActiveTrip(userId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: {
        userId,
        status: { in: [TripStatus.Started, TripStatus.Paused, TripStatus.Resumed] },
      },
      include: {
        segments: {
          where: { status: SegmentStatus.Active },
          take: 1,
        },
      },
    });

    if (!trip) return null;

    return {
      tripId: trip.id,
      status: trip.status,
      startedAt: trip.startedAt,
      activeSegmentId: trip.segments[0]?.id ?? null,
    };
  }

  // ─── PRIVATE HELPERS ───

  private async getActiveTripOrFail(tripId: string, userId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.userId !== userId) throw new BadRequestException('Not your trip');

    return trip;
  }

  /**
   * Calculate total distance using Haversine formula between consecutive GPS points
   */
  private calculateTotalDistance(
    points: { latitude: number; longitude: number; segmentId: string }[],
  ): number {
    if (points.length < 2) return 0;

    let total = 0;
    for (let i = 1; i < points.length; i++) {
      // Only calculate distance within the same segment
      if (points[i].segmentId !== points[i - 1].segmentId) continue;

      total += this.haversine(
        points[i - 1].latitude,
        points[i - 1].longitude,
        points[i].latitude,
        points[i].longitude,
      );
    }
    return total;
  }

  /**
   * Haversine formula — returns distance in km
   */
  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}
