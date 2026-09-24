import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { TlsOptions } from 'node:tls';
import type { LoggerOptions } from 'typeorm';
import { TypeOrmNestLogger } from './typeorm-nest.logger';

function sslOptions(
  mode: string | undefined,
  ca: string | undefined,
): boolean | TlsOptions {
  if (!mode || mode === 'disable') {
    return false;
  }

  const base: TlsOptions = ca ? { ca } : {};

  switch (mode) {
    case 'prefer':
    case 'allow':
    case 'require':
    case 'no-verify':
      return { ...base, rejectUnauthorized: false };

    case 'verify-ca':
      return {
        ...base,
        rejectUnauthorized: true,
        checkServerIdentity: () => undefined,
      } as TlsOptions;

    case 'verify-full':
      return { ...base, rejectUnauthorized: true };

    default:
      throw new Error(
        `Unsupported sslmode "${mode}". Use one of: disable, allow, prefer, ` +
          `require, no-verify, verify-ca, verify-full.`,
      );
  }
}

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        const isDevelopment = config.get<string>('NODE_ENV') === 'development';
        const ca = config.get<string>('DB_SSL_CA');
        const databaseUrl = config.get<string>('DATABASE_URL');

        const logging: LoggerOptions = isDevelopment
          ? ['error', 'warn', 'schema', 'migration']
          : ['error'];

        const common = {
          type: 'postgres' as const,
          autoLoadEntities: true,
          synchronize: isDevelopment,
          logger: new TypeOrmNestLogger(logging),
          logging,
        };

        if (databaseUrl) {
          const url = new URL(databaseUrl);

          return {
            ...common,
            host: url.hostname,
            port: Number(url.port) || 5432,
            username: decodeURIComponent(url.username),
            password: decodeURIComponent(url.password),
            database: url.pathname.slice(1),
            ssl: sslOptions(url.searchParams.get('sslmode') ?? undefined, ca),
          };
        }

        const mode =
          config.get<string>('DB_SSL_MODE') ??
          (config.get<string>('DB_SSL') === 'true' ? 'require' : 'disable');

        return {
          ...common,
          host: config.get<string>('DB_HOST'),
          port: config.get<number>('DB_PORT'),
          username: config.get<string>('DB_USERNAME'),
          password: config.get<string>('DB_PASSWORD'),
          database: config.get<string>('DB_NAME'),
          ssl: sslOptions(mode, ca),
        };
      },
    }),
  ],
})
export class DatabaseModule {}
