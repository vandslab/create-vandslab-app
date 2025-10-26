import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../common/enums/role.enum';

export class UserResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User UUID',
  })
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User full name',
    nullable: true,
  })
  name: string | null;

  @ApiProperty({
    example: Role.USER,
    enum: Role,
    description: 'User role',
  })
  role: Role;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'User creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'User last update timestamp',
  })
  updatedAt: Date;
}