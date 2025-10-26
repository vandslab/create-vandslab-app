import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional } from 'class-validator';

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['email'])) {
  @ApiPropertyOptional({
    example: 'NewPassword123',
    description: 'New password (min 6 characters)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;
}
