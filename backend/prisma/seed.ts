import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Create Roles ───
  const roles = await Promise.all(
    [
      { name: 'Admin', description: 'System administrator with full access' },
      { name: 'Manager', description: 'Manager who can view reports and manage team' },
      { name: 'Sale', description: 'Sale representative who tracks trips' },
    ].map((role) =>
      prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role,
      }),
    ),
  );

  console.log(`✅ Created ${roles.length} roles`);

  // ─── Create Admin User ───
  const passwordHash = await bcrypt.hash('Admin@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@smarttracking.com' },
    update: {},
    create: {
      employeeCode: 'ADM001',
      fullName: 'System Admin',
      email: 'admin@smarttracking.com',
      passwordHash,
      phone: '0800000000',
      isActive: true,
    },
  });

  // ─── Assign Admin role ───
  const adminRole = roles.find((r) => r.name === 'Admin')!;
  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: admin.id, roleId: adminRole.id },
    },
    update: {},
    create: {
      userId: admin.id,
      roleId: adminRole.id,
    },
  });

  console.log(`✅ Created admin user: ${admin.email} (password: Admin@123)`);

  // ─── Create Demo Sale User ───
  const salePasswordHash = await bcrypt.hash('Sale@123', 10);

  const sale = await prisma.user.upsert({
    where: { email: 'sale01@smarttracking.com' },
    update: {},
    create: {
      employeeCode: 'SLE001',
      fullName: 'สมชาย ขยัน',
      email: 'sale01@smarttracking.com',
      passwordHash: salePasswordHash,
      phone: '0811111111',
      isActive: true,
    },
  });

  const saleRole = roles.find((r) => r.name === 'Sale')!;
  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: sale.id, roleId: saleRole.id },
    },
    update: {},
    create: {
      userId: sale.id,
      roleId: saleRole.id,
    },
  });

  console.log(`✅ Created sale user: ${sale.email} (password: Sale@123)`);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
