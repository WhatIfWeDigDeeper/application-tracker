import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function createPrismaClient() {
  const url = new URL(process.env.DATABASE_URL!);
  const schema = url.searchParams.get('schema') ?? undefined;
  url.searchParams.delete('schema');
  const adapter = new PrismaPg(
    { connectionString: url.toString() },
    { schema },
  );
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || createPrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
