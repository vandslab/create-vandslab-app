import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity';
import { ActivityLog } from '../../activity-logs/entities/activity-log.entity';

@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				// Check if DATABASE_URL is provided (for Prisma Cloud or other hosted DBs)
				const databaseUrl = configService.get<string>('DATABASE_URL');

				if (databaseUrl) {
					// Parse DATABASE_URL for TypeORM
					const url = new URL(databaseUrl);
					const sslRequired = url.searchParams.get('sslmode') === 'require';

					return {
						type: 'postgres',
						host: url.hostname,
						port: parseInt(url.port) || 5432,
						username: url.username,
						password: url.password,
						database: url.pathname.slice(1), // Remove leading slash
						entities: [User, ActivityLog],
						synchronize: configService.get<string>('NODE_ENV') === 'development',
						logging: configService.get<string>('NODE_ENV') === 'development',
						ssl: sslRequired ? { rejectUnauthorized: false } : false,
					};
				}

				// Fall back to individual credentials
				const useSSL = configService.get<string>('DB_SSL') === 'true';

				return {
					type: 'postgres',
					host: configService.get<string>('DB_HOST'),
					port: configService.get<number>('DB_PORT'),
					username: configService.get<string>('DB_USERNAME'),
					password: configService.get<string>('DB_PASSWORD'),
					database: configService.get<string>('DB_NAME'),
					entities: [User, ActivityLog],
					synchronize: configService.get<string>('NODE_ENV') === 'development', // WARNING: Disable in production
					logging: configService.get<string>('NODE_ENV') === 'development',
					ssl: useSSL ? { rejectUnauthorized: false } : false,
				};
			},
		}),
	],
})
export class DatabaseModule {}