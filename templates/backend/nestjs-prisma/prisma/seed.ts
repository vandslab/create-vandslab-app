import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
	console.log('🌱 Start seeding...');

	// Create admin user
	const adminPassword = await bcrypt.hash('admin123', 10);
	const admin = await prisma.user.upsert({
		where: { email: 'admin@example.com' },
		update: {},
		create: {
			email: 'admin@example.com',
			password: adminPassword,
			name: 'Admin User',
			role: Role.ADMIN,
		},
	});
	console.log('Created admin user:', admin.email);

	// Create test user
	const userPassword = await bcrypt.hash('user123', 10);
	const user = await prisma.user.upsert({
		where: { email: 'user@example.com' },
		update: {},
		create: {
			email: 'user@example.com',
			password: userPassword,
			name: 'Test User',
			role: Role.USER,
		},
	});
	console.log('Created test user:', user.email);

	console.log('✅ Seeding finished.');
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error('❌ Seeding failed:', e);
		await prisma.$disconnect();
		process.exit(1);
	});