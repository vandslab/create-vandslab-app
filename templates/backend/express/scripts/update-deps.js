#!/usr/bin/env node

import { execSync } from 'child_process';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import * as p from '@clack/prompts';
import pc from 'picocolors';

const TEMPLATES_DIR = './templates';

// Find all package.json files
function findPackageJsonFiles(dir) {
  const files = [];

  function walk(currentDir) {
    const entries = readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);

      if (entry.isDirectory() && entry.name !== 'node_modules') {
        walk(fullPath);
      } else if (entry.name === 'package.json') {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

// Get available versions from npm registry (latest 3 stable versions)
function getAvailableVersions(packageName) {
  try {
    const result = execSync(`npm view ${packageName} versions --json`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const allVersions = JSON.parse(result);

    // Filter out pre-release versions (beta, alpha, rc, nightly, canary, dev, next, integration, etc.)
    const stableVersions = allVersions.filter(version => {
      return !version.match(/-(alpha|beta|rc|nightly|canary|dev|next|pre|experimental|integration|snapshot)/i);
    });

    // Return last 3 stable versions
    const last3 = stableVersions.slice(-3).reverse();
    return {
      latest: last3[0],
      versions: last3
    };
  } catch {
    return null;
  }
}

// Get outdated packages for a directory
function getOutdatedPackages(dir, progressCallback) {
  try {
    const packageJsonPath = join(dir, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    const outdated = {};
    const total = Object.keys(allDeps).length;
    let checked = 0;

    for (const [name, currentVersion] of Object.entries(allDeps)) {
      checked++;
      if (progressCallback) {
        progressCallback(checked, total, name);
      }

      const versionInfo = getAvailableVersions(name);
      if (versionInfo && versionInfo.latest !== currentVersion.replace(/^[\^~]/, '')) {
        outdated[name] = {
          current: currentVersion,
          latest: versionInfo.latest,
          versions: versionInfo.versions
        };
      }
    }

    return outdated;
  } catch (error) {
    console.error(`Error checking ${dir}:`, error.message);
    return {};
  }
}

// Update specific packages with versions (package.json + lockfile only, no install)
function updatePackages(dir, packagesWithVersions) {
  if (packagesWithVersions.length === 0) return;

  const packageJsonPath = join(dir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  // Update versions in package.json
  for (const { name, version } of packagesWithVersions) {
    if (packageJson.dependencies?.[name]) {
      packageJson.dependencies[name] = `^${version}`;
    }
    if (packageJson.devDependencies?.[name]) {
      packageJson.devDependencies[name] = `^${version}`;
    }
  }

  // Write updated package.json with proper formatting
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');

  // Regenerate lockfile without installing node_modules
  execSync('pnpm install --lockfile-only', {
    cwd: dir,
    stdio: 'inherit'
  });
}

// Main function
async function main() {
  console.clear();

  // VANDSLAB banner
  console.log(
    pc.cyan(`
██╗   ██╗ █████╗ ███╗   ██╗██████╗ ███████╗██╗      █████╗ ██████╗
██║   ██║██╔══██╗████╗  ██║██╔══██╗██╔════╝██║     ██╔══██╗██╔══██╗
██║   ██║███████║██╔██╗ ██║██║  ██║███████╗██║     ███████║██████╔╝
╚██╗ ██╔╝██╔══██║██║╚██╗██║██║  ██║╚════██║██║     ██╔══██║██╔══██╗
 ╚████╔╝ ██║  ██║██║ ╚████║██████╔╝███████║███████╗██║  ██║██████╔╝
  ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝╚═════╝
    `)
  );
  console.log(pc.dim('               Template Dependency Updater\n'));

  p.intro(pc.bgCyan(pc.black(' Update Dependencies ')));

  const packageFiles = findPackageJsonFiles(TEMPLATES_DIR);

  if (packageFiles.length === 0) {
    p.outro(pc.yellow('No package.json files found'));
    return;
  }

  p.note(`Found ${packageFiles.length} package.json files`, 'Templates');

  // Ask what to do with the templates
  const initialAction = await p.select({
    message: 'What would you like to do?',
    options: [
      { value: 'all', label: 'Check all templates', hint: `Go through all ${packageFiles.length} templates` },
      { value: 'select', label: 'Select specific templates', hint: 'Choose which ones to check' },
      { value: 'exit', label: 'Exit', hint: 'Cancel and exit' }
    ]
  });

  if (p.isCancel(initialAction) || initialAction === 'exit') {
    p.cancel('Operation cancelled');
    process.exit(0);
  }

  let filesToProcess = packageFiles;

  if (initialAction === 'select') {
    const selected = await p.multiselect({
      message: 'Select templates to check (Space to select, Enter to confirm)',
      options: packageFiles.map(file => {
        const relativePath = relative(process.cwd(), file);
        const folderName = relativePath.split(/[\/\\]/).slice(-2, -1)[0];
        return {
          value: file,
          label: folderName,
          hint: relativePath
        };
      }),
      required: false
    });

    if (p.isCancel(selected)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }

    if (selected.length === 0) {
      p.outro(pc.yellow('No templates selected'));
      process.exit(0);
    }

    filesToProcess = selected;
  }

  for (const packageFile of filesToProcess) {
    const dir = join(process.cwd(), packageFile, '..');
    const relativePath = relative(process.cwd(), packageFile);

    // Extract just the folder name (e.g., "express", "nextjs-16")
    const folderName = relativePath.split(/[\/\\]/).slice(-2, -1)[0];

    console.log('');
    p.log.step(pc.cyan(`📦 ${folderName} package.json`));

    // Read package.json to show how many packages we're checking
    const packageJsonPath = join(dir, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const totalDeps = Object.keys({
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    }).length;

    // Show progress while checking packages
    process.stdout.write(pc.dim(`  Checking ${totalDeps} packages `));

    let dots = 0;
    const outdated = getOutdatedPackages(dir, (checked, total) => {
      // Show animated dots every 3 packages
      if (checked % 3 === 0) {
        dots = (dots + 1) % 4;
        const dotStr = '.'.repeat(dots) + ' '.repeat(3 - dots);
        process.stdout.write(`\r${pc.dim(`  Checking ${totalDeps} packages ${dotStr} (${checked}/${total})`)}`);
      }
    });

    const outdatedList = Object.entries(outdated);
    process.stdout.write(`\r${pc.dim(`  ✓ Checked ${totalDeps} packages`)}\n`);

    if (outdatedList.length === 0) {
      p.log.success(pc.green('✓ All packages up to date'));
      continue;
    }

    // Show outdated packages with available versions
    console.log('');
    p.log.info('Outdated packages:');
    outdatedList.forEach(([name, info]) => {
      const versionsList = info.versions.map((v, i) =>
        i === 0 ? pc.green(v) : pc.dim(v)
      ).join(', ');
      console.log(
        `  ${pc.yellow(name)}: ${pc.dim(info.current)} → ${versionsList}`
      );
    });

    console.log('');

    // Ask what to do
    const action = await p.select({
      message: `Update packages in ${folderName}?`,
      options: [
        { value: 'all', label: 'Update all to latest', hint: 'Update all to newest version' },
        { value: 'select', label: 'Select packages & versions', hint: 'Choose packages and versions' },
        { value: 'skip', label: 'Skip', hint: 'Leave as is, go to next' }
      ]
    });

    if (p.isCancel(action)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }

    if (action === 'skip') {
      p.log.info(pc.dim('Skipped'));
      continue;
    }

    let packagesToUpdate = [];

    if (action === 'all') {
      // Update all to latest version
      packagesToUpdate = outdatedList.map(([name, info]) => ({
        name,
        version: info.latest
      }));
    } else {
      // Select individual packages and versions
      const selectedPackages = await p.multiselect({
        message: 'Select packages to update (Space to select, Enter to confirm)',
        options: outdatedList.map(([name, info]) => ({
          value: name,
          label: `${name} (${info.current} → ${info.versions.join(', ')})`,
          hint: info.latest
        })),
        required: false
      });

      if (p.isCancel(selectedPackages)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }

      if (selectedPackages.length === 0) {
        p.log.info(pc.dim('No packages selected'));
        continue;
      }

      // For each selected package, ask which version
      for (const pkgName of selectedPackages) {
        const info = outdated[pkgName];

        const selectedVersion = await p.select({
          message: `Select version for ${pc.yellow(pkgName)}`,
          options: info.versions.map((version, index) => ({
            value: version,
            label: version,
            hint: index === 0 ? 'Latest' : `${index} version(s) behind`
          }))
        });

        if (p.isCancel(selectedVersion)) {
          p.cancel('Operation cancelled');
          process.exit(0);
        }

        packagesToUpdate.push({
          name: pkgName,
          version: selectedVersion
        });
      }
    }

    if (packagesToUpdate.length === 0) {
      p.log.info(pc.dim('No packages selected'));
      continue;
    }

    // Update packages
    const s = p.spinner();
    s.start(`Updating ${packagesToUpdate.length} package(s)...`);

    try {
      updatePackages(dir, packagesToUpdate);
      s.stop(pc.green(`✓ Updated ${packagesToUpdate.length} package(s)`));
    } catch (error) {
      s.stop(pc.red('✗ Update failed'));
      console.error(error.message);
    }
  }

  console.log('');
  p.outro(pc.green('Done! 🎉'));

  console.log('');
  p.note(
    'Next steps:\n' +
    '  - Test the templates\n' +
    '  - Commit changes\n' +
    '  - Bump version and publish',
    'Don\'t forget'
  );
}

main().catch(console.error);
