import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class RequestInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: (data: any): void => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const delay = Date.now() - now;

          //this.logger.debug(JSON.stringify(data, null, 2));
          this.logger.log(`${method} ${url} ${statusCode} - ${delay}ms ${ip} `);
        },
        error: (error: any): void => {
          const statusCode = error.status || error.response?.statusCode || 500;
          const delay = Date.now() - now;
          const errorMessage =
            error.response?.data?.message || error.message || 'Unknown error';

          this.logger.error(
            `${method} ${url} ${statusCode} - ${delay}ms - ${errorMessage} ${ip}`,
          );
        },
      }),
    );
  }
}
