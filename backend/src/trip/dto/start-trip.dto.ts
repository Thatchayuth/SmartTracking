import { IsOptional, IsString } from 'class-validator';

export class StartTripDto {
  @IsOptional()
  @IsString()
  note?: string;
}
