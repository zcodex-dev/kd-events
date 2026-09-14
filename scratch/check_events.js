const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cols = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'Event';`;
  console.log('Current Event Columns:', cols.map(c => c.column_name));
  
  const hasDefaultLang = cols.some(c => c.column_name === 'defaultLang');
  if (!hasDefaultLang) {
    console.log('Adding defaultLang column safely via ALTER TABLE...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "defaultLang" TEXT DEFAULT 'en';`);
    console.log('defaultLang column added successfully!');
  } else {
    console.log('defaultLang column already exists.');
  }

  const events = await prisma.event.findMany({ select: { id: true, title: true, defaultLang: true } });
  console.log('Events with defaultLang:', events);
}

main().catch(console.error).finally(() => prisma.$disconnect());
