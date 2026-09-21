const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cols = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'Event';`;
  console.log('Current Event Columns:', cols.map(c => c.column_name));
  
  const hasTelegramImageUrl = cols.some(c => c.column_name === 'telegramImageUrl');
  if (!hasTelegramImageUrl) {
    console.log('Adding telegramImageUrl column safely via ALTER TABLE...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "telegramImageUrl" TEXT;`);
    console.log('telegramImageUrl column added successfully!');
  } else {
    console.log('telegramImageUrl column already exists.');
  }

  const updatedCols = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'Event';`;
  console.log('Updated Event Columns:', updatedCols.map(c => c.column_name));
}

main().catch(console.error).finally(() => prisma.$disconnect());
