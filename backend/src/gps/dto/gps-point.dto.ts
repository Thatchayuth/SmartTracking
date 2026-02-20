import { IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';

export class GpsPointDto {
  @IsString()
  tripId: string;

  @IsString()
  segmentId: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @IsOptional()
  @IsNumber()
  speed?: number;

  @IsOptional()
  @IsNumber()
  heading?: number;

  @IsDateString()
  recordedAt: string;
}

export class GpsBatchDto {
  points: GpsPointDto[];
}
