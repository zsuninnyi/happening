import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const seedUsers = [
  {
    id: 'user_admin',
    email: 'admin@happening.local',
    name: 'Admin',
    password: 'admin123',
    role: Role.admin,
  },
  {
    id: 'user_alice',
    email: 'alice@happening.local',
    name: 'Alice',
    password: 'alice123',
    role: Role.user,
  },
  {
    id: 'user_bob',
    email: 'bob@happening.local',
    name: 'Bob',
    password: 'bob123',
    role: Role.user,
  },
] as const;

async function main() {
  for (const user of seedUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      create: { ...user },
      update: {
        name: user.name,
        password: user.password,
        role: user.role,
      },
    });
  }

  console.log(`Seeded ${seedUsers.length} users:`);
  for (const user of seedUsers) {
    console.log(`  - ${user.email} (${user.role})`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
