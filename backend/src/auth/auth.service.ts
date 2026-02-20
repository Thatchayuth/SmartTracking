import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto';
import { JwtPayload, TokenResponse, AuthenticatedUser } from './interfaces/auth.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<TokenResponse & { user: AuthenticatedUser }> {
    const user = await this.prisma.user.findUnique({
      where: { employeeCode: dto.employeeCode },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const roles = user.userRoles.map((ur: any) => ur.role.name);
    const tokens = await this.generateTokens(user.id, user.employeeCode, roles);

    this.logger.log(`User logged in: ${user.employeeCode}`);

    return {
      ...tokens,
      user: {
        id: user.id,
        employeeCode: user.employeeCode,
        fullName: user.fullName,
        email: user.email,
        roles,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: { userRoles: { include: { role: true } } },
        },
      },
    });

    if (!stored || stored.expiresAt < new Date() || !stored.user.isActive) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Delete old refresh token
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    const roles = stored.user.userRoles.map((ur: any) => ur.role.name);
    return this.generateTokens(stored.user.id, stored.user.employeeCode, roles);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  async getProfile(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      employeeCode: user.employeeCode,
      fullName: user.fullName,
      email: user.email,
      roles: user.userRoles.map((ur: any) => ur.role.name),
    };
  }

  // ─── Private ───

  private async generateTokens(
    userId: string,
    employeeCode: string,
    roles: string[],
  ): Promise<TokenResponse> {
    const payload: JwtPayload = {
      sub: userId,
      employeeCode,
      roles,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
    });

    // Generate refresh token as random UUID-based string
    const refreshTokenValue = randomUUID();

    const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d');
    const expiresAt = new Date();
    const days = parseInt(refreshExpiresIn.replace('d', ''));
    expiresAt.setDate(expiresAt.getDate() + (isNaN(days) ? 7 : days));

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }
}
