import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiPropertyOptional({ description: 'First Name', example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last Name', example: 'Snow' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ description: 'Email', example: 'john@snow.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password', example: 'securePassword123' })
  @IsString()
  @MinLength(8)
  password: string;
}
