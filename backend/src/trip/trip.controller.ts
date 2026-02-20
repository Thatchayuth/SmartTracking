import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TripService } from './trip.service';
import { StartTripDto, TripQueryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, CurrentUser } from '../shared/decorators';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';

@Controller('api/trips')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @Post('start')
  @Roles('Sale')
  start(@CurrentUser() user: AuthenticatedUser, @Body() dto: StartTripDto) {
    return this.tripService.startTrip(user.id, dto);
  }

  @Patch(':id/pause')
  @Roles('Sale')
  pause(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.tripService.pauseTrip(id, user.id);
  }

  @Patch(':id/resume')
  @Roles('Sale')
  resume(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.tripService.resumeTrip(id, user.id);
  }

  @Patch(':id/stop')
  @Roles('Sale')
  stop(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.tripService.stopTrip(id, user.id);
  }

  @Get()
  @Roles('Sale', 'Manager', 'Admin')
  findAll(@Query() query: TripQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.tripService.findAll(query, user.id, user.roles);
  }

  @Get('active')
  @Roles('Sale')
  getActive(@CurrentUser() user: AuthenticatedUser) {
    return this.tripService.getActiveTrip(user.id);
  }

  @Get(':id')
  @Roles('Sale', 'Manager', 'Admin')
  findById(@Param('id') id: string) {
    return this.tripService.findById(id);
  }

  @Get(':id/route')
  @Roles('Sale', 'Manager', 'Admin')
  getRoute(@Param('id') id: string) {
    return this.tripService.getRoute(id);
  }
}
