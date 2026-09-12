#!/usr/bin/env node
/**
 * Refresh the per-app pnpm-lock.yaml files.
 *
 * The workspace has one lockfile at the root, which is what pnpm is designed
 * for. But a CI that checks out a single app directory (a TeamCity checkout
 * rule like `+:apps/backend => .`, say) never sees that root lockfile, so each
 * app also carries a standalone one produced with --ignore-workspace.
 *
 * These are derived files: re-run this whenever an app's dependencies change,
 * and commit the result alongside the root lockfile.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const appsDir = path.join(repoRoot, 'apps');

if (!fs.existsSync(appsDir)) {
  console.error('No apps/ directory found.');
  process.exit(1);
}

const apps = fs
  .readdirSync(appsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(appsDir, entry.name))
  .filter((dir) => fs.existsSync(path.join(dir, 'package.json')));

if (apps.length === 0) {
  console.error('No packages found under apps/.');
  process.exit(1);
}

for (const app of apps) {
  const name = path.relative(repoRoot, app).split(path.sep).join('/');
  process.stdout.write(`\n→ ${name}\n`);
  execFileSync('pnpm', ['install', '--ignore-workspace', '--lockfile-only'], {
    cwd: app,
    stdio: 'inherit',
    shell: true,
  });
}

console.log(`\n✓ Refreshed ${apps.length} per-app lockfile(s).`);
console.log('  Commit them together with the root pnpm-lock.yaml.');
