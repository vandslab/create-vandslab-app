import { Logger as NestLogger } from '@nestjs/common';
import { AbstractLogger } from 'typeorm';
import type { LogLevel, LogMessage, QueryRunner } from 'typeorm';

/**
 * Routes TypeORM's output through the Nest logger.
 *
 * Extends AbstractLogger rather than implementing Logger directly: the base
 * class is what applies the `logging` levels. A bare Logger implementation
 * receives every event regardless of configuration and has to filter itself —
 * which is how the schema-sync introspection queries end up on screen even
 * though `query` was never enabled.
 */
export class TypeOrmNestLogger extends AbstractLogger {
  private readonly logger = new NestLogger('TypeORM');

  protected writeLog(
    level: LogLevel,
    logMessage: LogMessage | string | number | (LogMessage | string | number)[],
    queryRunner?: QueryRunner,
  ): void {
    const messages = this.prepareLogMessages(
      logMessage,
      { highlightSql: false },
      queryRunner,
    );

    for (const message of messages) {
      const text = [message.prefix, message.message]
        .filter(Boolean)
        .join(' ');

      switch (message.type ?? level) {
        case 'log':
        case 'schema-build':
        case 'migration':
          this.logger.log(text);
          break;

        case 'info':
        case 'query':
          this.logger.debug(text);
          break;

        case 'warn':
        case 'query-slow':
          this.logger.warn(text);
          break;

        case 'error':
        case 'query-error':
          this.logger.error(text);
          break;

        default:
          this.logger.log(text);
      }
    }
  }
}
