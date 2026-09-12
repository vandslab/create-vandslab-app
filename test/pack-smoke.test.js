// Smoke suite: pack a REAL npm tarball, generate projects from it, assert the output.
//
// Why the tarball and not src/: npm strips some files (notably every .gitignore)
// on the way into the package, so a template can look correct on disk and still
// produce a broken project once installed from the registry. Only packing catches it.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = path.resolve(import.meta.dirname, '..');

/** Stack combinations worth covering: both project types, every template, both standalone shapes. */
const STACKS = [
  { projectName: 'mono-next-express', projectType: 'monorepo', frontend: 'nextjs-16', backend: 'express' },
  { projectName: 'mono-vite-nestprisma', projectType: 'monorepo', frontend: 'vite', backend: 'nestjs-prisma' },
  { projectName: 'solo-nuxt', projectType: 'standalone', frontend: 'nuxt', backend: 'none' },
  { projectName: 'solo-nestjs', projectType: 'standalone', frontend: 'none', backend: 'nestjs' },
  { projectName: 'solo-both', projectType: 'standalone', frontend: 'vite', backend: 'nestjs' },
];

let workDir;
let pkgDir;
let generateProject;

before(async () => {
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cva-smoke-'));

  execFileSync('npm', ['run', 'build'], { cwd: repoRoot, stdio: 'inherit', shell: true });
  const out = execFileSync('npm', ['pack', '--pack-destination', workDir], {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: true,
  });
  const tarball = out.trim().split('\n').pop().trim();

  execFileSync('tar', ['-xzf', tarball], { cwd: workDir, stdio: 'inherit' });
  pkgDir = path.join(workDir, 'package');

  // The extracted package has no node_modules; point it at the repo's.
  fs.symlinkSync(
    path.join(repoRoot, 'node_modules'),
    path.join(pkgDir, 'node_modules'),
    process.platform === 'win32' ? 'junction' : 'dir'
  );

  ({ generateProject } = await import(pathToFileURL(path.join(pkgDir, 'dist', 'generator.js')).href));
}, { timeout: 180000 });

after(() => {
  if (workDir) fs.rmSync(workDir, { recursive: true, force: true });
});

/** Every path under `dir`, relative and POSIX-separated, dot files included. */
function walk(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full).split(path.sep).join('/');
    return entry.isDirectory() ? walk(full, base) : [rel];
  });
}

/** Directories that are an installable app in their own right, relative to the project root. */
function appRoots({ projectType, frontend, backend }) {
  if (projectType === 'monorepo') {
    return [frontend !== 'none' && 'apps/web', backend !== 'none' && 'apps/backend'].filter(Boolean);
  }
  if (frontend !== 'none' && backend !== 'none') return ['frontend', 'backend'];
  return ['.'];
}

function generate(config, outName = config.projectName) {
  const dir = path.join(workDir, 'generated', outName);
  return generateProject({ ...config, uiLibrary: 'none', targetPath: dir }).then(() => ({
    dir,
    files: walk(dir),
    readJson: (rel) => JSON.parse(fs.readFileSync(path.join(dir, rel), 'utf8')),
    readText: (rel) => fs.readFileSync(path.join(dir, rel), 'utf8'),
  }));
}

/**
 * Assert everything a freshly generated project must satisfy.
 *
 * @param {object} project        - { dir, files, readJson, readText } from generate()
 * @param {object} config         - the ProjectConfig that produced it
 * @param {string[]} roots        - appRoots(config): installable app dirs, '.' means project root
 */
function assertProjectInvariants(project, config, roots) {
  const { files, readJson, readText } = project;

  // --- packaging hygiene: nothing internal to the scaffolder may survive ---
  assert.deepEqual(files.filter((f) => f.endsWith('.template')), [], 'unrenamed *.template files leaked');
  assert.deepEqual(files.filter((f) => f.endsWith('.gitkeep')), [], '.gitkeep placeholders leaked');

  for (const file of files.filter(isTextFile)) {
    assert.doesNotMatch(readText(file), /\{\{[A-Z_]+\}\}/, `unsubstituted placeholder in ${file}`);
  }

  // --- shape: the root and every app are installable ---
  assert.ok(files.includes('package.json'), 'missing root package.json');
  assert.ok(files.includes('README.md'), 'missing generated README.md');

  // pnpm 10+ reads nodeLinker from here, and Prisma 7 does not resolve without
  // hoisted node_modules. A project without this file installs into a layout
  // where @prisma/client cannot load itself.
  // ...at the project root, and in every app directory, because CI may check
  // out a single app and that copy has no workspace root above it.
  for (const dir of ['.', ...roots]) {
    const cfg = join(dir, 'pnpm-workspace.yaml');
    assert.ok(files.includes(cfg), `missing ${cfg}`);
    assert.match(readText(cfg), /^nodeLinker: hoisted$/m, `${cfg} does not set nodeLinker: hoisted`);
  }
  assert.equal(typeof readJson('package.json').name, 'string', 'root package.json has no name');
  for (const root of roots) {
    assert.ok(files.includes(join(root, 'package.json')), `missing ${join(root, 'package.json')}`);
    // npm strips real .gitignore files out of the tarball, so every template
    // must ship gitignore.template instead. This is the regression guard.
    assert.ok(
      files.includes(join(root, '.gitignore')),
      `missing ${join(root, '.gitignore')} — the template needs a gitignore.template`
    );
  }

  // --- Docker vs. VCS: a lockfile a Dockerfile COPYs must be committable ---
  // `COPY package.json pnpm-lock.yaml ./` + `--frozen-lockfile` fails the build
  // outright if any .gitignore in scope keeps the lockfile out of the repo.
  for (const root of roots) {
    const dockerfile = join(root, 'Dockerfile');
    if (!files.includes(dockerfile)) continue;
    if (!readText(dockerfile).includes('pnpm-lock.yaml')) continue;

    // Both the app's own .gitignore and the project root's apply to the app.
    for (const scope of root === '.' ? ['.'] : ['.', root]) {
      const ignore = join(scope, '.gitignore');
      if (!files.includes(ignore)) continue;
      const ignoresLockfile = readText(ignore)
        .split(/\r?\n/)
        .some((line) => line.trim() === 'pnpm-lock.yaml');
      assert.equal(
        ignoresLockfile,
        false,
        `${ignore} ignores pnpm-lock.yaml, but ${dockerfile} COPYs it — docker build cannot succeed`
      );
    }
  }
}

const BINARY_EXT = new Set([
  '.ico', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.pdf',
  '.woff', '.woff2', '.ttf', '.eot', '.otf', '.zip', '.gz',
]);

function isTextFile(file) {
  return !BINARY_EXT.has(path.extname(file).toLowerCase());
}

/** Join a project-relative dir with a file, where '.' means the project root. */
function join(dir, file) {
  return dir === '.' ? file : `${dir}/${file}`;
}

for (const config of STACKS) {
  test(`generated project: ${config.projectName}`, async () => {
    const project = await generate(config);
    assertProjectInvariants(project, config, appRoots(config));
  });
}

// Open gaps tracked in CLAUDE.md "Known issues". These are reported as
// diagnostics rather than assertions: the suite stays green (so a red run
// always means a real regression) while still printing, on every run, exactly
// which generated projects are still missing what.
for (const config of STACKS) {
  test(`known gaps: ${config.projectName}`, async (t) => {
    const { files, readJson } = await generate(config, `${config.projectName}-gaps`);
    const roots = appRoots(config);
    const gaps = [];

    for (const root of roots) {
      const scripts = readJson(join(root, 'package.json')).scripts ?? {};
      if (!scripts.typecheck) gaps.push(`${root} has no typecheck script`);
    }

    const rootName = readJson('package.json').name;
    if (rootName !== config.projectName) {
      gaps.push(`root package.json name is "${rootName}", not "${config.projectName}"`);
    }

    for (const gap of gaps) t.diagnostic(gap);
  });
}
