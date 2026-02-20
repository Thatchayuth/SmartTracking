import { IsOptional, IsString, IsDateString, IsIn, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class TripQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsIn(['Started', 'Paused', 'Resumed', 'Stopped'])
  status?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

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
}
