import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class UserEntity {
  @ApiProperty({
    description: 'User ID',
    example: 'c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b3d3b3d',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiPropertyOptional({ example: 'John', type: String })
  @Column({ type: 'varchar', nullable: true })
  firstName: string | null;

  @ApiPropertyOptional({ example: 'Snow', type: String })
  @Column({ type: 'varchar', nullable: true })
  lastName: string | null;

  @ApiProperty({ example: 'john@snow.com' })
  @Column({ unique: true })
  email: string;

  // Deliberately has no @ApiProperty: the service strips it before returning,
  // so it must never appear in the generated OpenAPI schema either.
  @Column()
  password: string;

  @ApiProperty({ description: 'Create time' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last updated time' })
  @UpdateDateColumn()
  updatedAt: Date;
}
