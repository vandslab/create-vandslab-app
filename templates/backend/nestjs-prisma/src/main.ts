import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RequestInterceptor } from '@/common/interceptors/request.interceptor';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'log', 'warn']
        : ['log', 'error', 'warn', 'debug'],
    bodyParser: false,
  });
  const logger = new Logger();
  app.useGlobalInterceptors(new RequestInterceptor());

  // validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true, // for cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Swagger config
  const config = new DocumentBuilder()
    .setTitle('===== PROJECT =====')
    .setDescription('===== PROJECT DESCRIPTION =====')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'bearerAuth',
    )
    // Global responses
    .addGlobalResponse({
      status: 500,
      description: 'Internal server error',
    })
    .addServer('http://localhost:4000', 'Local development endpoint')
    .addServer('https://production.url.com', 'Production endpoint')
    .build();

  app.setGlobalPrefix('/api');

  const document = SwaggerModule.createDocument(app, config);
  const theme = new SwaggerTheme();
  const options = {
    customCss: theme.getBuffer(SwaggerThemeNameEnum.DRACULA),
  };

  SwaggerModule.setup('/api/docs', app, document, options);

  await app.listen(process.env.PORT ?? 4000);

  logger.log(`Server: http://localhost:${process.env.PORT}`);
  logger.log(`Swagger: http://localhost:${process.env.PORT}/api/docs`);
}
bootstrap();
