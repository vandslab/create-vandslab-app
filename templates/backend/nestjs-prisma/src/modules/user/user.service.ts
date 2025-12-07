import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserEntity } from './entity/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto): Promise<UserEntity> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const { password, ...user } = await this.prisma.user.create({
      data: { ...dto, password: hashedPassword },
    });
    return user;
  }

  async findAll(): Promise<UserEntity[]> {
    return this.prisma.user.findMany();
  }

  async findOne(userId: string): Promise<UserEntity> {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(userId: string, dto: UpdateUserDto): Promise<UserEntity> {
    const { password, ...user } = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
    return user;
  }

  async remove(userId: string): Promise<{ message: string }> {
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: 'Success' };
  }
}
