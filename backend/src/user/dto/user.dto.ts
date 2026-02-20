import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  employeeCode: string;

  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AssignRolesDto {
  @IsString({ each: true })
  roleNames: string[]; // ['Admin', 'Sale']
}
