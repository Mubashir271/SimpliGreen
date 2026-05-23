import 'dotenv/config';
import app, { prisma } from './app';

const PORT = process.env.PORT || 3000;

async function main() {
  await prisma.$connect();
  console.log('Database connected');
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
