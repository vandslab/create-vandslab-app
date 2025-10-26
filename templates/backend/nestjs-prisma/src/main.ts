import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Enable CORS
	app.enableCors({
		origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
		credentials: true,
	});

	// Global validation pipe
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true, // Strip props that don't have decorators
			forbidNonWhitelisted: true, // Throw error if non-whitelisted props exist
			transform: true, // Transform payloads to DTO instances
		}),
	);

	// Swagger API documentation
	const config = new DocumentBuilder()
		.setTitle('{{PROJECT_NAME}} API')
		.setDescription('API documentation for {{PROJECT_NAME}} backend')
		.setVersion('1.0')
		.addBearerAuth()
		.build();

	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api', app, document);

	const port = process.env.PORT || 4000;
	await app.listen(port);

	console.log(`🚀 Server running on http://localhost:${port}`);
	console.log(`📚 Swagger docs available at http://localhost:${port}/api`);
}

bootstrap();
