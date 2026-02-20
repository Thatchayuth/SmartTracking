import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, AssignRolesDto } from './dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, page = 1, limit = 20) {
    const where = search
      ? {
          OR: [
            { fullName: { contains: search } },
            { employeeCode: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: {
          userRoles: { include: { role: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: data.map((u: any) => this.mapUser(u)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: { include: { role: { select: { name: true } } } },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return this.mapUser(user);
  }

  async findSaleUsers() {
    const saleRole = await this.prisma.role.findUnique({
      where: { name: 'Sale' },
    });

    if (!saleRole) return [];

    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        userRoles: { some: { roleId: saleRole.id } },
      },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
      },
      orderBy: { fullName: 'asc' },
    });

    return users;
  }

  async create(dto: CreateUserDto) {
    // Check uniqueness
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ employeeCode: dto.employeeCode }, { email: dto.email }],
      },
    });

    if (existing) {
      throw new ConflictException('Employee code or email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        employeeCode: dto.employeeCode,
        fullName: dto.fullName,
        email: dto.email,
        passwordHash,
        phone: dto.phone,
      },
      include: {
        userRoles: { include: { role: { select: { name: true } } } },
      },
    });

    return this.mapUser(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id); // ensure exists

    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (existing) throw new ConflictException('Email already in use');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
      include: {
        userRoles: { include: { role: { select: { name: true } } } },
      },
    });

    return this.mapUser(user);
  }

  async deactivate(id: string) {
    await this.findById(id);
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    return { message: 'User deactivated' };
  }

  async assignRoles(id: string, dto: AssignRolesDto) {
    await this.findById(id);

    const roles = await this.prisma.role.findMany({
      where: { name: { in: dto.roleNames } },
    });

    // Remove all current roles, then reassign
    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId: id } }),
      ...roles.map((role: any) =>
        this.prisma.userRole.create({
          data: { userId: id, roleId: role.id },
        }),
      ),
    ]);

    return this.findById(id);
  }

  // ─── Private Helpers ───

  private mapUser(user: any) {
    const { passwordHash, ...rest } = user;
    return {
      ...rest,
      roles: user.userRoles?.map((ur: any) => ur.role.name) ?? [],
      userRoles: undefined,
    };
  }
}
