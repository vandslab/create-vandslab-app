# create-vandslab-app

**Interactive CLI for creating modern full-stack applications**

Create production-ready monorepos and standalone projects with your preferred tech stack in seconds.

## Features

### Project Types

- **Monorepo** - Turborepo-powered workspace with shared packages
- **Standalone** - Single application projects

### Frontend Frameworks

- **Next.js 15** - Stable App Router with React 19
- **Next.js 16** - Latest with built-in improvements
- **Vite** - Lightning fast HMR with React 19

### Backend Frameworks

- **Express.js** - Fast & flexible with Prisma ORM
- **NestJS** - Enterprise-grade with TypeORM / Prisma ORM

### UI Libraries

- **shadcn/ui** - Modern components with Radix UI
- **Chakra UI** - Modular component library
- **DaisyUI** - Tailwind CSS components

### Technologies

- **TypeScript** - Full type safety
- **Tailwind CSS 4** - Next-gen styling
- **pnpm** - Fast package management
- **Turborepo** - High-performance builds

## Quick Start

```bash
# Using pnpx (recommended)
pnpx create-vandslab-app@latest my-app

# Or in current directory
pnpx create-vandslab-app@latest .

# Global install
pnpm add -g create-vandslab-app
create-vandslab-app my-app
```

## What You Get

### Monorepo Structure

```
my-app/
├── apps/
│   ├── web/                 # Frontend (Next.js/Vite)
│   └── backend/             # Backend (Express/NestJS)
├── packages/                # Shared packages
├── turbo.json              # Turborepo config
├── pnpm-workspace.yaml     # pnpm workspaces
└── package.json            # Root scripts
```

### Available Scripts

#### Monorepo

```bash
pnpm dev        # Start all dev servers
pnpm build      # Build all packages
pnpm start      # Start production servers
pnpm typecheck  # Type check all packages
pnpm lint       # Lint all packages
pnpm test       # Run tests
pnpm clean      # Clean build outputs
```

#### Standalone

```bash
pnpm dev        # Start dev server
pnpm build      # Build for production
pnpm start      # Start production server
pnpm typecheck  # Type check
pnpm lint       # Lint code
```

## Pre-configured

- **TypeScript** strict mode
- **Path aliases** (@/components, @/lib, etc.)
- **ESLint** with best practices
- **Prettier** code formatting
- **Git** with .gitignore
- **Environment variables** setup
- **Docker** ready (optional)
- **Hot Module Replacement**

## Requirements

- Node.js >= 20.0.0
- pnpm >= 9.0.0

## License

MIT © Vandslab

---

<p align="center">Vandslab Team</p>
