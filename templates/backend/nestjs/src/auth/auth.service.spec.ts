import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { hash, verify } from '@node-rs/argon2';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';

// Argon2 is deliberately slow; the service only needs to see its result.
vi.mock('@node-rs/argon2', () => ({
  hash: vi.fn(async () => '$argon2id$hashed'),
  verify: vi.fn(async () => true),
}));

const storedUser = {
  id: 'user-1',
  email: 'ada@example.com',
  password: '$argon2id$hashed',
  role: Role.USER,
} as User;

describe('AuthService', () => {
  let service: AuthService;
  let repository: {
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    repository = {
      findOne: vi.fn(),
      create: vi.fn((entity) => entity),
      save: vi.fn(async (entity) => entity),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: repository },
        { provide: JwtService, useValue: { sign: vi.fn(() => 'signed.jwt.token') } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    vi.mocked(hash).mockClear();
    vi.mocked(verify).mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const dto = { email: 'ada@example.com', password: 'Passw0rdd' };

    it('rejects an email that is already taken', async () => {
      repository.findOne.mockResolvedValue(storedUser);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('stores the hash, never the plain password', async () => {
      repository.findOne.mockResolvedValue(null);

      await service.register(dto);

      expect(hash).toHaveBeenCalledWith(dto.password);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ password: '$argon2id$hashed' }),
      );
    });

    it('gives new accounts the USER role', async () => {
      repository.findOne.mockResolvedValue(null);

      await service.register(dto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: Role.USER }),
      );
    });

    it('never returns the password', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.register(dto);

      expect(result.user).not.toHaveProperty('password');
      expect(result.accessToken).toBe('signed.jwt.token');
    });
  });

  describe('login', () => {
    const dto = { email: 'ada@example.com', password: 'Passw0rdd' };

    it('gives the same error for an unknown email as for a wrong password', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);

      repository.findOne.mockResolvedValue(storedUser);
      vi.mocked(verify).mockResolvedValue(false);
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('verifies the stored hash against the supplied password, in that order', async () => {
      repository.findOne.mockResolvedValue(storedUser);
      vi.mocked(verify).mockResolvedValue(true);

      await service.login(dto);

      expect(verify).toHaveBeenCalledWith(storedUser.password, dto.password);
    });

    it('returns a token and a user without the password', async () => {
      repository.findOne.mockResolvedValue(storedUser);
      vi.mocked(verify).mockResolvedValue(true);

      const result = await service.login(dto);

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.user).not.toHaveProperty('password');
    });
  });
});
