#!/usr/bin/env node
/**
 * Install this CLI globally from a real npm tarball.
 *
 * Deliberately NOT `npm link`: a link exposes the working tree, so files npm
 * strips on the way into a package (every .gitignore, anything the root
 * .gitignore matches) would still appear to work locally. Packing first makes
 * `create-vandslab-app` behave exactly as it will for someone installing from
 * the registry.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { stdio: 'inherit', shell: true, cwd: repoRoot, ...opts });

const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'cva-install-'));

try {
  console.log('\n[1/3] building...');
  run('pnpm', ['build']);

  console.log('\n[2/3] packing tarball...');
  const tarball = execFileSync('npm', ['pack', '--pack-destination', stage], {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: true,
  })
    .trim()
    .split('\n')
    .pop()
    .trim();

  console.log(`\n[3/3] installing ${tarball} globally...`);
  run('npm', ['install', '-g', path.join(stage, tarball)]);

  const { version } = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  console.log(`\n✓ create-vandslab-app@${version} installed from tarball.`);
  console.log('  Run it anywhere:  create-vandslab-app my-app');
  console.log('  Re-run this script after every change:  pnpm install-global');
} finally {
  fs.rmSync(stage, { recursive: true, force: true });
}
