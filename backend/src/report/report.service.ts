import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportQueryDto, ReportTripsQueryDto } from './dto';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  // ─── Shared where clause builder ───
  private buildWhere(query: ReportQueryDto) {
    const where: any = {
      status: 'Stopped',
      startedAt: {
        gte: new Date(`${query.fromDate}T00:00:00Z`),
        lte: new Date(`${query.toDate}T23:59:59Z`),
      },
    };
    if (query.userId) where.userId = query.userId;
    return where;
  }

  // ═══ SUMMARY ═══
  async getSummary(query: ReportQueryDto) {
    const where = this.buildWhere(query);

    const result = await this.prisma.trip.aggregate({
      where,
      _count: { id: true },
      _sum: { totalDistance: true, totalDuration: true },
      _avg: { totalDistance: true, totalDuration: true },
    });

    return {
      totalTrips: result._count.id,
      totalDistanceKm: Math.round((result._sum.totalDistance ?? 0) * 100) / 100,
      totalDurationSec: result._sum.totalDuration ?? 0,
      avgDistanceKm: Math.round((result._avg.totalDistance ?? 0) * 100) / 100,
      avgDurationSec: Math.round(result._avg.totalDuration ?? 0),
    };
  }

  // ═══ TRIPS TABLE (Paginated) ═══
  async getTrips(query: ReportTripsQueryDto) {
    const where = this.buildWhere(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.trip.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, employeeCode: true } },
          _count: { select: { segments: true } },
        },
        orderBy: { [query.sortBy ?? 'startedAt']: query.sortOrder ?? 'desc' },
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

  // ═══ EXPORT EXCEL ═══
  async exportExcel(query: ReportQueryDto): Promise<Buffer> {
    const where = this.buildWhere(query);

    const trips = await this.prisma.trip.findMany({
      where,
      include: { user: { select: { fullName: true, employeeCode: true } } },
      orderBy: { startedAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SmartTracking';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Trip Report');

    // Title row
    sheet.mergeCells('A1:I1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'GPS Tracking - Trip Report';
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };

    // Period row
    sheet.mergeCells('A2:I2');
    const periodCell = sheet.getCell('A2');
    periodCell.value = `Period: ${query.fromDate} - ${query.toDate}`;
    periodCell.font = { size: 11, italic: true };
    periodCell.alignment = { horizontal: 'center' };

    // Empty row
    sheet.addRow([]);

    // Header columns
    sheet.columns = [
      { key: 'no',           width: 6  },
      { key: 'employeeCode', width: 15 },
      { key: 'fullName',     width: 25 },
      { key: 'date',         width: 14 },
      { key: 'startTime',    width: 12 },
      { key: 'endTime',      width: 12 },
      { key: 'distance',     width: 14 },
      { key: 'duration',     width: 14 },
      { key: 'note',         width: 30 },
    ];

    // Header row (row 4)
    const headerRow = sheet.addRow({
      no: '#',
      employeeCode: 'Employee Code',
      fullName: 'Sale Name',
      date: 'Date',
      startTime: 'Start Time',
      endTime: 'End Time',
      distance: 'Distance (km)',
      duration: 'Duration',
      note: 'Note',
    });

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1976D2' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Data rows
    trips.forEach((t: any, i: number) => {
      const row = sheet.addRow({
        no: i + 1,
        employeeCode: t.user.employeeCode,
        fullName: t.user.fullName,
        date: t.startedAt.toISOString().split('T')[0],
        startTime: this.formatTime(t.startedAt),
        endTime: t.endedAt ? this.formatTime(t.endedAt) : '-',
        distance: t.totalDistance != null ? Math.round(t.totalDistance * 100) / 100 : '-',
        duration: t.totalDuration != null ? this.formatDuration(t.totalDuration) : '-',
        note: t.note ?? '',
      });

      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Summary row
    const totalDist = trips.reduce((s: number, t: any) => s + (t.totalDistance ?? 0), 0);
    const totalDur = trips.reduce((s: number, t: any) => s + (t.totalDuration ?? 0), 0);
    const summaryRow = sheet.addRow({
      no: '',
      employeeCode: '',
      fullName: 'TOTAL',
      date: `${trips.length} trips`,
      startTime: '',
      endTime: '',
      distance: Math.round(totalDist * 100) / 100,
      duration: this.formatDuration(totalDur),
      note: '',
    });
    summaryRow.font = { bold: true };
    summaryRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE3F2FD' },
      };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'double' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }

  // ═══ EXPORT PDF ═══
  async exportPdf(query: ReportQueryDto): Promise<Buffer> {
    const where = this.buildWhere(query);

    const [summaryResult, trips] = await this.prisma.$transaction([
      this.prisma.trip.aggregate({
        where,
        _count: { id: true },
        _sum: { totalDistance: true, totalDuration: true },
      }),
      this.prisma.trip.findMany({
        where,
        include: { user: { select: { fullName: true, employeeCode: true } } },
        orderBy: { startedAt: 'desc' },
      }),
    ]);

    return new Promise<Buffer>((resolve) => {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        layout: 'landscape',
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // ── Title ──
      doc.fontSize(20).font('Helvetica-Bold')
        .text('GPS Tracking - Trip Report', { align: 'center' });
      doc.fontSize(11).font('Helvetica')
        .text(`Period: ${query.fromDate}  to  ${query.toDate}`, { align: 'center' });
      doc.moveDown(0.5);

      // ── Summary ──
      const totalDist = Math.round((summaryResult._sum.totalDistance ?? 0) * 100) / 100;
      const totalDur = this.formatDuration(summaryResult._sum.totalDuration ?? 0);

      doc.fontSize(11).font('Helvetica-Bold')
        .text(`Total Trips: ${summaryResult._count.id}     |     Total Distance: ${totalDist} km     |     Total Duration: ${totalDur}`);
      doc.moveDown(0.8);

      // ── Table ──
      const tableTop = doc.y;
      const colX = [40, 70, 140, 280, 390, 460, 530, 610, 690];
      const headers = ['#', 'Code', 'Name', 'Date', 'Start', 'End', 'Dist(km)', 'Duration'];

      // Header row
      doc.fontSize(9).font('Helvetica-Bold');
      headers.forEach((h, i) => {
        doc.text(h, colX[i], tableTop, { width: (colX[i + 1] || 780) - colX[i], lineBreak: false });
      });

      // Line under header
      doc.moveTo(40, tableTop + 14).lineTo(760, tableTop + 14).stroke();
      doc.y = tableTop + 18;

      // Data rows
      doc.font('Helvetica').fontSize(8);
      trips.forEach((t: any, i: number) => {
        if (doc.y > 540) {
          doc.addPage();
          doc.y = 40;
        }

        const y = doc.y;
        const row = [
          `${i + 1}`,
          t.user.employeeCode,
          t.user.fullName,
          t.startedAt.toISOString().split('T')[0],
          this.formatTime(t.startedAt),
          t.endedAt ? this.formatTime(t.endedAt) : '-',
          t.totalDistance != null ? `${Math.round(t.totalDistance * 100) / 100}` : '-',
          t.totalDuration != null ? this.formatDuration(t.totalDuration) : '-',
        ];

        row.forEach((cell, ci) => {
          doc.text(cell, colX[ci], y, { width: (colX[ci + 1] || 780) - colX[ci], lineBreak: false });
        });
        doc.y = y + 14;
      });

      // Footer
      doc.moveDown(1);
      doc.fontSize(8).font('Helvetica')
        .text(`Generated: ${new Date().toISOString()}`, { align: 'right' });

      doc.end();
    });
  }

  // ─── Helpers ───

  private formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }

  private formatTime(date: Date): string {
    return date.toISOString().substring(11, 16); // HH:mm
  }
}
