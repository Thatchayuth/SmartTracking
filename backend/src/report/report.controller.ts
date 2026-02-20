import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../shared/decorators';
import { ReportService } from './report.service';
import { ReportQueryDto, ReportTripsQueryDto } from './dto';

@Controller('api/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin', 'Manager')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('summary')
  getSummary(@Query() query: ReportQueryDto) {
    return this.reportService.getSummary(query);
  }

  @Get('trips')
  getTrips(@Query() query: ReportTripsQueryDto) {
    return this.reportService.getTrips(query);
  }

  @Get('export/excel')
  async exportExcel(@Query() query: ReportQueryDto, @Res() res: Response) {
    const buffer = await this.reportService.exportExcel(query);
    const filename = `report_${query.fromDate}_${query.toDate}.xlsx`;
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.byteLength,
    });
    res.send(buffer);
  }

  @Get('export/pdf')
  async exportPdf(@Query() query: ReportQueryDto, @Res() res: Response) {
    const buffer = await this.reportService.exportPdf(query);
    const filename = `report_${query.fromDate}_${query.toDate}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.byteLength,
    });
    res.send(buffer);
  }
}
