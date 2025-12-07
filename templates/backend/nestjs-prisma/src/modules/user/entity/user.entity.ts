import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserEntity {
  @ApiProperty({
    description: 'User ID',
    example: 'c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b3d3b3d',
  })
  id: string;

  @ApiPropertyOptional({ example: 'John', type: String })
  firstName: string | null;

  @ApiPropertyOptional({ example: 'Snow', type: String })
  lastName: string | null;

  @ApiProperty({ example: 'john@snow.com' })
  email: string;

  @ApiProperty({ description: 'Create time' })
  createdAt: Date;

  @ApiProperty({ description: 'Last updated time' })
  updatedAt: Date;
}
