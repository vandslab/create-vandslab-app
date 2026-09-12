import { AuthError, InvalidCredentialsError } from '@/exceptions/auth-error';
import prisma from '@/utils/prisma-client';
import { verify } from '@node-rs/argon2';
import { AuthService } from './auth.service';

vi.mock('@/utils/prisma-client', () => ({
	default: {
		user: { findUnique: vi.fn(), create: vi.fn() },
	},
}));

// Argon2 is deliberately slow; the service only needs to see its result.
vi.mock('@node-rs/argon2', () => ({
	hash: vi.fn(async () => '$argon2id$hashed'),
	verify: vi.fn(async () => true),
}));

vi.mock('jsonwebtoken', () => ({
	default: { sign: vi.fn(() => 'signed.jwt.token') },
}));

const findUnique = vi.mocked(prisma.user.findUnique);
const create = vi.mocked(prisma.user.create);

const storedUser = {
	id: 'user-1',
	email: 'user@example.com',
	password: '$argon2id$hashed',
	name: 'Ada',
	role: 'USER',
	createdAt: new Date(),
	updatedAt: new Date(),
};

describe('AuthService', () => {
	let service: AuthService;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new AuthService();
	});

	describe('register', () => {
		it('rejects an email that is already taken', async () => {
			findUnique.mockResolvedValue(storedUser as never);

			await expect(service.register(storedUser.email, 'Passw0rdd')).rejects.toThrow(AuthError);
			expect(create).not.toHaveBeenCalled();
		});

		it('stores the hash, never the plain password', async () => {
			findUnique.mockResolvedValue(null as never);
			create.mockResolvedValue(storedUser as never);

			await service.register(storedUser.email, 'Passw0rdd', 'Ada');

			expect(create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({ password: '$argon2id$hashed' }),
				})
			);
			expect(create).not.toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({ password: 'Passw0rdd' }),
				})
			);
		});

		it('does not return the password', async () => {
			findUnique.mockResolvedValue(null as never);
			create.mockResolvedValue(storedUser as never);

			const result = await service.register(storedUser.email, 'Passw0rdd');

			expect(result).not.toHaveProperty('password');
			expect(result.email).toBe(storedUser.email);
		});
	});

	describe('login', () => {
		it('rejects an unknown email', async () => {
			findUnique.mockResolvedValue(null as never);

			await expect(service.login('nobody@example.com', 'Passw0rdd')).rejects.toThrow(
				InvalidCredentialsError
			);
		});

		it('rejects a wrong password', async () => {
			findUnique.mockResolvedValue(storedUser as never);
			vi.mocked(verify).mockResolvedValue(false);

			await expect(service.login(storedUser.email, 'wrong')).rejects.toThrow(
				InvalidCredentialsError
			);
		});

		it('verifies the stored hash against the supplied password, in that order', async () => {
			findUnique.mockResolvedValue(storedUser as never);
			vi.mocked(verify).mockResolvedValue(true);

			await service.login(storedUser.email, 'Passw0rdd');

			expect(verify).toHaveBeenCalledWith(storedUser.password, 'Passw0rdd');
		});

		it('returns a token and a user without the password', async () => {
			findUnique.mockResolvedValue(storedUser as never);
			vi.mocked(verify).mockResolvedValue(true);

			const result = await service.login(storedUser.email, 'Passw0rdd');

			expect(result.token).toBe('signed.jwt.token');
			expect(result.user).not.toHaveProperty('password');
		});
	});

	describe('me', () => {
		it('throws when the user is gone', async () => {
			findUnique.mockResolvedValue(null as never);

			await expect(service.me('user-1')).rejects.toThrow(AuthError);
		});
	});
});
