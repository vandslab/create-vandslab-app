# {{PROJECT_NAME}} Backend

NestJS backend with Prisma ORM, JWT authentication, and Swagger documentation.

## Tech Stack

- **Framework**: NestJS 11
- **Language**: TypeScript 5
- **ORM**: Prisma 5
- **Database**: PostgreSQL
- **Authentication**: JWT (Passport.js)
- **API Documentation**: Swagger/OpenAPI
- **Package Manager**: pnpm

## Features

- ✅ JWT Authentication with refresh tokens
- ✅ User management (CRUD operations)
- ✅ Role-based access control (User/Admin)
- ✅ Activity logging system
- ✅ Prisma ORM with migrations
- ✅ Swagger API documentation
- ✅ Health check endpoint
- ✅ Type-safe with TypeScript
- ✅ Environment configuration
- ✅ Request validation with class-validator
- ✅ Global error handling

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- PostgreSQL database

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials
```

### Database Setup

```bash
# Generate Prisma Client
pnpm prisma:generate

# Run database migrations (development)
pnpm prisma:migrate:dev

# Run database migrations (production)
pnpm prisma:migrate:deploy

# Seed the database with sample data
pnpm prisma:seed

# Open Prisma Studio to view/edit data
pnpm prisma:studio
```

### Development

```bash
# Run in development mode (with hot reload)
pnpm dev

# Run in debug mode
pnpm start:debug
```

### Production

```bash
# Build the application
pnpm build

# Run in production mode
pnpm start
```

### Testing

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:cov

# Run e2e tests
pnpm test:e2e
```

## Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm test` - Run tests
- `pnpm prisma:generate` - Generate Prisma Client
- `pnpm prisma:migrate:dev` - Run migrations in development
- `pnpm prisma:migrate:deploy` - Deploy migrations to production
- `pnpm prisma:studio` - Open Prisma Studio
- `pnpm prisma:seed` - Seed the database

## API Documentation

Once the server is running, you can access:

- **Swagger UI**: http://localhost:4000/api
- **JSON Schema**: http://localhost:4000/api-json

## Default Users

After seeding the database:

- **Admin**: admin@example.com / admin123
- **User**: user@example.com / user123

## Environment Variables

See `.env.example` for all required environment variables:

- `PORT` - Server port (default: 4000)
- `NODE_ENV` - Environment (development/production)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - JWT expiration time in seconds
- `CORS_ORIGIN` - Allowed CORS origin

## Project Structure

```
src/
├── activity-logs/    # Activity logging module
├── auth/            # Authentication module
├── common/          # Shared decorators, guards, enums
├── health/          # Health check module
├── prisma/          # Prisma service and configuration
├── users/           # User management module
├── app.module.ts    # Main application module
└── main.ts          # Application entry point

prisma/
├── schema.prisma    # Database schema
└── seed.ts         # Database seeding script
```

## Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Role-based access control
- Request validation and sanitization
- CORS configuration
- Environment-based configuration