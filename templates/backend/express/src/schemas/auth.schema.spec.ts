import { loginSchema, registerSchema } from './auth.schema';

const register = (body: Record<string, unknown>) => registerSchema.safeParse({ body });

describe('registerSchema', () => {
	const valid = { email: 'user@example.com', password: 'Passw0rdd', name: 'Ada' };

	it('accepts a valid registration', () => {
		expect(register(valid).success).toBe(true);
	});

	it('treats name as optional', () => {
		const { name: _name, ...withoutName } = valid;
		expect(register(withoutName).success).toBe(true);
	});

	it('rejects a malformed email', () => {
		expect(register({ ...valid, email: 'not-an-email' }).success).toBe(false);
	});

	it('rejects a password shorter than 8 characters', () => {
		expect(register({ ...valid, password: 'Pas0' }).success).toBe(false);
	});

	it.each([
		['no uppercase', 'passw0rdd'],
		['no lowercase', 'PASSW0RDD'],
		['no digit', 'Passwordd'],
	])('rejects a password with %s', (_label, password) => {
		expect(register({ ...valid, password }).success).toBe(false);
	});
});

describe('loginSchema', () => {
	it('accepts any non-empty password', () => {
		const result = loginSchema.safeParse({
			body: { email: 'user@example.com', password: 'anything' },
		});
		expect(result.success).toBe(true);
	});

	it('still validates the email', () => {
		const result = loginSchema.safeParse({ body: { email: 'nope', password: 'anything' } });
		expect(result.success).toBe(false);
	});
});
