const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const types = ['Silver', 'Platinum', 'Gold', 'Diamond'];
const firstNames = ['Lokas', 'Sarah', 'Michael', 'Emma', 'David', 'James', 'Lisa', 'Robert', 'William', 'Mary', 'Richard', 'Jessica', 'Thomas', 'Daniel', 'Emily'];
const lastNames = ['K', 'Wong', 'Chen', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

async function main() {
  console.log('Clearing old placeholders...');
  await prisma.registration.deleteMany();
  await prisma.member.deleteMany();
  
  console.log('Generating 30 random KD players...');
  for (let i = 0; i < 30; i++) {
    const name = firstNames[Math.floor(Math.random() * firstNames.length)] + ' ' + lastNames[Math.floor(Math.random() * lastNames.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    
    // Generate KDB- followed by exactly 10 digits
    const randomDigits = Array.from({length: 10}, () => Math.floor(Math.random() * 10)).join('');
    const randomId = `KDB-${randomDigits}`;
    
    // Random past date within the last 30 days
    const randomDate = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
    
    // Random Profile Picture
    const randomAvatar = `https://i.pravatar.cc/150?u=${randomId}`;
    
    await prisma.member.create({
      data: {
        name: name,
        memberId: randomId,
        memberType: type
      }
    });
    
    await prisma.registration.create({
      data: {
        name: name,
        memberId: randomId,
        memberType: type,
        isMember: true,
        createdAt: randomDate,
        avatarUrl: randomAvatar
      }
    });
  }
  console.log('Database successfully seeded with new players!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
