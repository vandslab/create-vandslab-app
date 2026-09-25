# Changelog

All notable changes to `create-vandslab-app` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.1] - 2026-09-25

### Fixed

- **NestJS templates (`nestjs`, `nestjs-prisma`)**: request bodies are parsed again. 1.4.0 shipped
  `bodyParser: false` without registering a parser of its own, so `req.body` was always empty and
  every `POST /api/users` / `PATCH /api/users/:userId` failed validation with a `400`.

## [1.4.0] - 2026-09-24

### Added

- Smoke test suite (`pnpm test`): packs the real npm tarball, generates projects from it and asserts
  the output invariants (ignore files present, no build/secret artifacts leaked, workspace config).
- Vitest specs for the Express backend (auth service, auth schema, auth errors).
- Generated projects get a `pnpm-workspace.yaml` with `nodeLinker: hoisted` and
  `verifyDepsBeforeRun: false`. Monorepos also get one per app, so a single app checked out on its
  own in CI still installs correctly.
- Monorepo `scripts/update-lockfiles.mjs` for refreshing per-app lockfiles.
- `nestjs-prisma`: `env.example` template.
- `install-global` script for installing the CLI from a local checkout.

### Changed

- **NestJS 12** in both Nest templates.
- **Vitest instead of Jest** in all three backends (Jest cannot load the ESM-only NestJS 12 packages).
- **Password hashing moved from `bcrypt` to argon2** (`@node-rs/argon2`) in all backends.
- **Prisma pinned to exactly 7.8.0** across the whole Prisma family, using the `PrismaPg` driver
  adapter. The client is generated into the source tree instead of `node_modules`, so it survives
  `pnpm prune --prod`.
- **The two Nest templates now share one layout**: every feature lives under `src/modules/<name>/`
  (service, controller, `dto/`, `entity/`, specs). The TypeORM template's `users/` became
  `modules/user/`.
- TypeORM logs are routed through the Nest logger and filtered by level. The `sslmode` parameter
  of the connection URL now supports every PostgreSQL value (`require`, `verify-ca`, `verify-full`,
  ...); an unknown value fails at startup instead of silently disabling TLS.
- **Swagger is served only when `NODE_ENV=development`**; in any other environment the route is not
  registered at all. Set `NODE_ENV=development` in `.env` for local development.
- Backend Dockerfiles rebuilt as a four-stage build (base, prod-deps, build, runtime) running as a
  non-root user. `pnpm test` runs during the image build, so a red suite fails the image.
- Generated root `package.json`: requires pnpm 11, declares it through `devEngines` instead of a
  pinned `packageManager`, and bumps TypeScript 6, Turborepo, ESLint 10, Prettier and
  `concurrently`.
- Frontend dependency bumps: Next.js 16.3, React 19.3, Nuxt 4.5, Vite 8.3, Tailwind CSS 4.3.3.
- The CLI now requires **Node.js 20+** (was 18+).

### Removed

- **NestJS (TypeORM) template no longer ships auth**: the JWT strategy, guards, role decorators,
  health module and activity-log module were removed so both Nest templates match. The Express
  template still includes auth.
- Chakra UI and DaisyUI UI-library templates (shadcn is the only remaining option).
- Generated `.npmrc` and root `.eslintrc.json`; lint configuration lives in each stack template.
- The unused `packages/typescript-config` that was copied into every monorepo.

### Fixed

- Generated projects always get a `.gitignore`. npm strips every `.gitignore` from the published
  tarball, so templates that shipped a real one produced projects without any ignore file.

## Earlier versions

Versions before 1.4.0 have no changelog entries; see the
[git history](https://github.com/vandslab/create-vandslab-app/commits/main) and
[tags](https://github.com/vandslab/create-vandslab-app/tags).

[Unreleased]: https://github.com/vandslab/create-vandslab-app/compare/v1.4.1...HEAD
[1.4.1]: https://github.com/vandslab/create-vandslab-app/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/vandslab/create-vandslab-app/compare/v1.3.1...v1.4.0
