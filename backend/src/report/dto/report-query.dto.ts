import { IsOptional, IsUUID, IsDateString, IsInt, Min, Max, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class ReportQueryDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsDateString()
  fromDate: string;

  @IsDateString()
  toDate: string;
}

export class ReportTripsQueryDto extends ReportQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsIn(['startedAt', 'totalDistance', 'totalDuration'])
  sortBy?: string = 'startedAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
