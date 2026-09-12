import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from '@node-rs/argon2';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from './user.service';

// Argon2 is deliberately slow; the service only needs to see its result.
vi.mock('@node-rs/argon2', () => ({
  hash: vi.fn(async () => '$argon2id$hashed'),
}));

const storedUser = {
  id: 'user-1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  password: '$argon2id$hashed',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UserService', () => {
  let service: UserService;
  let prisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
        delete: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<UserService>(UserService);
    vi.mocked(hash).mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', password: 'Passw0rdd' };

    it('rejects an email that is already taken', async () => {
      prisma.user.findUnique.mockResolvedValue(storedUser);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('stores the hash, never the plain password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(storedUser);

      await service.create(dto);

      expect(hash).toHaveBeenCalledWith(dto.password);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ password: '$argon2id$hashed' }),
        }),
      );
    });

    it('does not return the password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(storedUser);

      const result = await service.create(dto);

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe(storedUser.email);
    });
  });

  describe('remove', () => {
    it('deletes the user and reports success', async () => {
      prisma.user.delete.mockResolvedValue(storedUser);

      await expect(service.remove('user-1')).resolves.toEqual({ message: 'Success' });
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    });
  });
});
