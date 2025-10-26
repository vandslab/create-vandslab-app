import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
	@ApiProperty({
		example: 'user@example.com',
		description: 'User email address',
	})
	@IsEmail()
	email: string;

	@ApiProperty({
		example: 'SecurePassword123',
		description: 'User password (min 6 characters)',
		minLength: 6,
	})
	@IsString()
	@MinLength(6)
	password: string;
}

export class RegisterResponseDto {
	@ApiProperty({
		example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
		description: 'JWT access token',
	})
	accessToken: string;

	@ApiProperty({
		example: {
			id: '123e4567-e89b-12d3-a456-426614174000',
			email: 'user@example.com',
			role: 'USER',
		},
		description: 'User information',
	})
	user: {
		id: string;
		email: string;
		role: string;
	};
}