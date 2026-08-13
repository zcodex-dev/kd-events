const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial admins...');

  const superAdmin = await prisma.adminUser.upsert({
    where: { personnelId: 'MK-C052' },
    update: {},
    create: {
      personnelId: 'MK-C052',
      name: 'Super Admin',
      role: 'SUPERADMIN',
      password: 'admin123', // Default password
    },
  });
  console.log('Created Super Admin:', superAdmin.personnelId);

  const simpleAdmin = await prisma.adminUser.upsert({
    where: { personnelId: 'MK-C0001' },
    update: {},
    create: {
      personnelId: 'MK-C0001',
      name: 'Simple Admin',
      role: 'ADMIN',
      password: 'admin123', // Default password
    },
  });
  console.log('Created Simple Admin:', simpleAdmin.personnelId);

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
