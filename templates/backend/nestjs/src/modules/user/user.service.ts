import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from '@node-rs/argon2';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entity/user.entity';

/** Everything the API may return — the password never leaves the service. */
export type PublicUser = Omit<UserEntity, 'password'>;

/** Columns selected for read queries, so the hash is never loaded at all. */
const PUBLIC_COLUMNS = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async create(dto: CreateUserDto): Promise<PublicUser> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await hash(dto.password);

    const created = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });

    const { password, ...user } = await this.userRepository.save(created);
    return user;
  }

  async findAll(): Promise<PublicUser[]> {
    return this.userRepository.find({ select: PUBLIC_COLUMNS });
  }

  async findOne(userId: string): Promise<PublicUser> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: PUBLIC_COLUMNS,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(userId: string, dto: UpdateUserDto): Promise<PublicUser> {
    const user = await this.userRepository.preload({ id: userId, ...dto });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // preload copied the plain password straight off the DTO; replace it.
    if (dto.password) {
      user.password = await hash(dto.password);
    }

    const { password, ...updated } = await this.userRepository.save(user);
    return updated;
  }

  async remove(userId: string): Promise<{ message: string }> {
    const result = await this.userRepository.delete({ id: userId });

    if (!result.affected) {
      throw new NotFoundException('User not found');
    }

    return { message: 'Success' };
  }
}
