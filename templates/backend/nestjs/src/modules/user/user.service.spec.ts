import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { hash } from '@node-rs/argon2';
import { UserEntity } from './entity/user.entity';
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
} as UserEntity;

describe('UserService', () => {
  let service: UserService;
  let repository: {
    findOne: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    preload: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    repository = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn((entity) => entity),
      save: vi.fn(async (entity) => entity),
      preload: vi.fn(),
      delete: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(UserEntity), useValue: repository },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    vi.mocked(hash).mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      password: 'Passw0rdd',
    };

    it('rejects an email that is already taken', async () => {
      repository.findOne.mockResolvedValue(storedUser);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('stores the hash, never the plain password', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.save.mockResolvedValue(storedUser);

      await service.create(dto);

      expect(hash).toHaveBeenCalledWith(dto.password);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ password: '$argon2id$hashed' }),
      );
    });

    it('does not return the password', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.save.mockResolvedValue(storedUser);

      const result = await service.create(dto);

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe(storedUser.email);
    });
  });

  describe('findOne', () => {
    it('throws when the user does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });

    it('never selects the password column', async () => {
      repository.findOne.mockResolvedValue(storedUser);

      await service.findOne('user-1');

      const [options] = repository.findOne.mock.lastCall ?? [];
      expect(options.select).not.toHaveProperty('password');
    });
  });

  describe('update', () => {
    it('re-hashes a new password instead of storing it plain', async () => {
      repository.preload.mockResolvedValue({ ...storedUser });
      repository.save.mockResolvedValue(storedUser);

      await service.update('user-1', { password: 'NewPassw0rd' });

      expect(hash).toHaveBeenCalledWith('NewPassw0rd');
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ password: '$argon2id$hashed' }),
      );
    });

    it('throws when the user does not exist', async () => {
      repository.preload.mockResolvedValue(undefined);

      await expect(service.update('missing', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('reports success when a row was deleted', async () => {
      repository.delete.mockResolvedValue({ affected: 1 });

      await expect(service.remove('user-1')).resolves.toEqual({ message: 'Success' });
    });

    it('throws when nothing was deleted', async () => {
      repository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
