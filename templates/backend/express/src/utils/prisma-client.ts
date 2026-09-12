import "dotenv/config";
import { PrismaClient } from "../generated";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 requires a driver adapter for every database connection. PrismaPg
// owns the connection pool, so pool behaviour follows node-postgres defaults
// (no connect timeout) rather than the Prisma 6 engine defaults.
//
// DATABASE_URL must be a direct connection string (postgresql://...).
// Prisma Accelerate / Prisma Postgres URLs (prisma://, prisma+postgres://)
// are NOT accepted by the adapter — those need the Accelerate extension.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
	globalForPrisma.prisma ||
	new PrismaClient({
		adapter,
		log: ["error"],
	});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
