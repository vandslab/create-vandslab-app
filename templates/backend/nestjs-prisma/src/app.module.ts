import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
	imports: [
		// Global configuration module
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		// Database setup with Prisma
		PrismaModule,
		// Authentication module (login/register)
		AuthModule,
		// Users management module
		UsersModule,
		// Health check module
		HealthModule,
		// Activity logs module
		ActivityLogsModule,
	],
	providers: [
		// Global auth guard (checks JWT by default, skips if @Public())
		{
			provide: APP_GUARD,
			useClass: JwtAuthGuard,
		},
		// Global roles guard (checks roles if @Roles() is used)
		{
			provide: APP_GUARD,
			useClass: RolesGuard,
		},
	],
})
export class AppModule {}