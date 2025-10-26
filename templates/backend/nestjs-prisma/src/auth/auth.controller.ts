import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { RegisterDto, RegisterResponseDto } from './dto/register.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	@Public()
	@ApiOperation({ summary: 'Register a new user' })
	@ApiResponse({
		status: 201,
		description: 'User successfully registered',
		type: RegisterResponseDto,
	})
	@ApiResponse({
		status: 409,
		description: 'User with this email already exists',
	})
	async register(@Body() registerDto: RegisterDto): Promise<RegisterResponseDto> {
		return this.authService.register(registerDto);
	}

	@Post('login')
	@Public()
	@ApiOperation({ summary: 'Login with email and password' })
	@ApiResponse({
		status: 200,
		description: 'Login successful',
		type: LoginResponseDto,
	})
	@ApiResponse({
		status: 401,
		description: 'Invalid credentials',
	})
	async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
		return this.authService.login(loginDto);
	}
}