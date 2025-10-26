import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { RegisterDto, RegisterResponseDto } from './dto/register.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
	constructor(
		private prisma: PrismaService,
		private jwtService: JwtService,
	) {}

	async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
		const { email, password } = registerDto;

		// Check if user already exists
		const existingUser = await this.prisma.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			throw new ConflictException('User with this email already exists');
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 10);

		// Create new user
		const user = await this.prisma.user.create({
			data: {
				email,
				password: hashedPassword,
				role: Role.USER,
			},
		});

		// Generate JWT token
		const accessToken = this.generateToken(user);

		return {
			accessToken,
			user: {
				id: user.id,
				email: user.email,
				role: user.role,
			},
		};
	}

	async login(loginDto: LoginDto): Promise<LoginResponseDto> {
		const { email, password } = loginDto;

		// Find user by email
		const user = await this.prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			throw new UnauthorizedException('Invalid credentials');
		}

		// Check password
		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			throw new UnauthorizedException('Invalid credentials');
		}

		// Generate JWT token
		const accessToken = this.generateToken(user);

		return {
			accessToken,
			user: {
				id: user.id,
				email: user.email,
				role: user.role,
			},
		};
	}

	private generateToken(user: { id: string; email: string; role: Role }): string {
		const payload = {
			sub: user.id,
			email: user.email,
			role: user.role,
		};

		return this.jwtService.sign(payload);
	}
}