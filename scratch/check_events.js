const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const events = await prisma.event.findMany();
  for (const ev of events) {
    console.log(`Event: ${ev.title}`);
    console.log(`  titleId: ${ev.titleId}`);
    console.log(`  titleZh: ${ev.titleZh}`);
    console.log(`  descriptionId length: ${ev.descriptionId?.length}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
