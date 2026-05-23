import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  // Installer Types
  const roofer = await prisma.installerType.upsert({
    where: { name: 'Roofers' },
    update: {},
    create: { name: 'Roofers', requiresCertificate: false },
  });
  const scaffolder = await prisma.installerType.upsert({
    where: { name: 'Scaffolders' },
    update: {},
    create: { name: 'Scaffolders', requiresCertificate: false },
  });
  const electrician = await prisma.installerType.upsert({
    where: { name: 'Electricians' },
    update: {},
    create: { name: 'Electricians', requiresCertificate: true },
  });
  const gasEngineer = await prisma.installerType.upsert({
    where: { name: 'Gas Engineers' },
    update: {},
    create: { name: 'Gas Engineers', requiresCertificate: true },
  });

  // Admin
  await prisma.user.upsert({
    where: { email: 'alice@simplgreencrm.com' },
    update: {},
    create: { name: 'Alice Admin', email: 'alice@simplgreencrm.com', password: hash('password123'), role: 'admin' },
  });

  // Managers
  await prisma.user.upsert({
    where: { email: 'mark@simplgreencrm.com' },
    update: {},
    create: { name: 'Mark Manager', email: 'mark@simplgreencrm.com', password: hash('password123'), role: 'manager' },
  });
  await prisma.user.upsert({
    where: { email: 'nina@simplgreencrm.com' },
    update: {},
    create: { name: 'Nina Manager', email: 'nina@simplgreencrm.com', password: hash('password123'), role: 'manager' },
  });

  // Installers
  await prisma.user.upsert({
    where: { email: 'ivan@simplgreencrm.com' },
    update: {},
    create: { name: 'Ivan Installer', email: 'ivan@simplgreencrm.com', password: hash('password123'), role: 'installer', installerTypeId: roofer.id },
  });
  await prisma.user.upsert({
    where: { email: 'ella@simplgreencrm.com' },
    update: {},
    create: { name: 'Ella Installer', email: 'ella@simplgreencrm.com', password: hash('password123'), role: 'installer', installerTypeId: electrician.id },
  });
  await prisma.user.upsert({
    where: { email: 'sam@simplgreencrm.com' },
    update: {},
    create: { name: 'Sam Installer', email: 'sam@simplgreencrm.com', password: hash('password123'), role: 'installer', installerTypeId: scaffolder.id },
  });
  await prisma.user.upsert({
    where: { email: 'gary@simplgreencrm.com' },
    update: {},
    create: { name: 'Gary Installer', email: 'gary@simplgreencrm.com', password: hash('password123'), role: 'installer', installerTypeId: gasEngineer.id },
  });

  // QA Engineers
  await prisma.user.upsert({
    where: { email: 'quinn@simplgreencrm.com' },
    update: {},
    create: { name: 'Quinn QA', email: 'quinn@simplgreencrm.com', password: hash('password123'), role: 'qa' },
  });
  await prisma.user.upsert({
    where: { email: 'zara@simplgreencrm.com' },
    update: {},
    create: { name: 'Zara QA', email: 'zara@simplgreencrm.com', password: hash('password123'), role: 'qa' },
  });

  console.log('Seed complete. Default password for all users: password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
