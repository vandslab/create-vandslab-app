import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ProjectConfig } from './prompts.js';
import { copyDirectory, copyFile, replaceInDirectory } from './utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function generateProject(config: ProjectConfig): Promise<void> {
  const { projectName, projectType, frontend, backend, targetPath, uiLibrary } = config;

  // Create project directory
  await fs.ensureDir(targetPath);

  // Get templates directory (from package root, not dist)
  const templatesDir = path.resolve(__dirname, '..', 'templates');

  // Copy base files (always included)
  await copyBaseFiles(templatesDir, targetPath, config);

  if (projectType === 'monorepo') {
    await generateMonorepo(templatesDir, targetPath, config);
  } else {
    await generateStandalone(templatesDir, targetPath, config);
  }

  // Add UI library if selected
  if (uiLibrary && uiLibrary !== 'none' && frontend !== 'none') {
    // Determine the correct path based on project structure
    let appPath = targetPath;
    if (projectType === 'standalone' && backend !== 'none') {
      // Standalone with both frontend and backend - frontend is in subfolder
      appPath = path.join(targetPath, 'frontend');
    }
    await addUILibrary(templatesDir, appPath, config);
  }

  // Replace placeholders in all generated files
  const replacements = {
    PROJECT_NAME: projectName,
    PROJECT_NAME_CAMEL: toCamelCase(projectName),
    PROJECT_NAME_PASCAL: toPascalCase(projectName),
  };

  await replaceInDirectory(targetPath, replacements);

  // Generate README
  await generateReadme(targetPath, config);
}

async function copyBaseFiles(
  templatesDir: string,
  targetPath: string,
  config: ProjectConfig
): Promise<void> {
  const baseDir = path.join(templatesDir, 'base');

  // Copy Dockerfile
  await copyFile(path.join(baseDir, 'Dockerfile'), path.join(targetPath, 'Dockerfile'));

  // Copy .npmrc
  await copyFile(path.join(baseDir, '.npmrc'), path.join(targetPath, '.npmrc'));

  // Copy .gitignore
  await copyFile(path.join(baseDir, '.gitignore'), path.join(targetPath, '.gitignore'));

  // Copy ESLint config
  await copyFile(path.join(baseDir, '.eslintrc.json'), path.join(targetPath, '.eslintrc.json'));

  // Copy Prettier config
  await copyFile(path.join(baseDir, '.prettierrc'), path.join(targetPath, '.prettierrc'));
}

async function generateMonorepo(
  templatesDir: string,
  targetPath: string,
  config: ProjectConfig
): Promise<void> {
  // Create monorepo structure
  await fs.ensureDir(path.join(targetPath, 'apps'));
  await fs.ensureDir(path.join(targetPath, 'packages'));

  // Copy turborepo config
  const turboConfig = path.join(templatesDir, 'monorepo', 'turbo.json');
  await copyFile(turboConfig, path.join(targetPath, 'turbo.json'));

  // Copy pnpm workspace config
  const workspaceConfig = path.join(templatesDir, 'monorepo', 'pnpm-workspace.yaml');
  await copyFile(workspaceConfig, path.join(targetPath, 'pnpm-workspace.yaml'));

  // Generate root package.json
  await generateRootPackageJson(targetPath, config);

  // Copy frontend if selected
  if (config.frontend !== 'none') {
    const frontendTemplate = path.join(templatesDir, 'frontend', config.frontend);
    const frontendDest = path.join(targetPath, 'apps', 'web');
    await copyDirectory(frontendTemplate, frontendDest);
  }

  // Copy backend if selected
  if (config.backend !== 'none') {
    await generateBackend(templatesDir, path.join(targetPath, 'apps', 'backend'), config);
  }

  // Copy shared configs
  await copySharedConfigs(templatesDir, path.join(targetPath, 'packages'), config);
}

async function generateStandalone(
  templatesDir: string,
  targetPath: string,
  config: ProjectConfig
): Promise<void> {
  const hasBothFrontendAndBackend = config.frontend !== 'none' && config.backend !== 'none';

  if (hasBothFrontendAndBackend) {
    // Both frontend and backend - use separate folders
    if (config.frontend !== 'none') {
      const frontendTemplate = path.join(templatesDir, 'frontend', config.frontend);
      const frontendDest = path.join(targetPath, 'frontend');
      await copyDirectory(frontendTemplate, frontendDest);
    }

    if (config.backend !== 'none') {
      const backendDest = path.join(targetPath, 'backend');
      await generateBackend(templatesDir, backendDest, config);
    }

    // Create root package.json with scripts for both
    await generateStandaloneRootPackageJson(targetPath, config);
  } else {
    // Only one selected - use root folder
    if (config.frontend !== 'none') {
      const frontendTemplate = path.join(templatesDir, 'frontend', config.frontend);
      await copyDirectory(frontendTemplate, targetPath);
    } else if (config.backend !== 'none') {
      await generateBackend(templatesDir, targetPath, config);
    }
  }
}

async function generateBackend(
  templatesDir: string,
  targetPath: string,
  config: ProjectConfig
): Promise<void> {
  // Select backend template based on framework choice
  const backendTemplate = path.join(templatesDir, 'backend', config.backend);
  await copyDirectory(backendTemplate, targetPath);

  // Note: Each backend template includes its own setup
  // - express: Prisma, Auth (JWT), Swagger
  // - nestjs: TypeORM, Auth (JWT), Swagger
  // - nestjs-prisma: Prisma, Auth (JWT), Swagger
}

async function copySharedConfigs(
  templatesDir: string,
  packagesPath: string,
  config: ProjectConfig
): Promise<void> {
  const configsDir = path.join(templatesDir, 'configs');

  // Copy TypeScript config
  await copyDirectory(path.join(configsDir, 'typescript-config'), path.join(packagesPath, 'typescript-config'));

  // Copy ESLint config
  await copyDirectory(path.join(configsDir, 'eslint-config'), path.join(packagesPath, 'eslint-config'));
}

async function generateStandaloneRootPackageJson(targetPath: string, config: ProjectConfig): Promise<void> {
  const packageJson = {
    name: config.projectName,
    version: '0.1.0',
    private: true,
    engines: {
      node: '>=20.0.0',
      pnpm: '>=9.0.0',
    },
    scripts: {
      preinstall: 'npx only-allow pnpm',
      'install:all': 'pnpm install --recursive',
      'dev': 'concurrently "pnpm dev:frontend" "pnpm dev:backend"',
      'dev:frontend': 'cd frontend && pnpm dev',
      'dev:backend': 'cd backend && pnpm dev',
      'build': 'pnpm build:frontend && pnpm build:backend',
      'build:frontend': 'cd frontend && pnpm build',
      'build:backend': 'cd backend && pnpm build',
      'start': 'concurrently "pnpm start:frontend" "pnpm start:backend"',
      'start:frontend': 'cd frontend && pnpm start',
      'start:backend': 'cd backend && pnpm start',
      'typecheck': 'pnpm typecheck:frontend && pnpm typecheck:backend',
      'typecheck:frontend': 'cd frontend && pnpm typecheck',
      'typecheck:backend': 'cd backend && pnpm typecheck',
    },
    devDependencies: {
      concurrently: '^9.1.0',
      '@types/node': '^22.10.2',
      typescript: '^5.7.2',
    },
    packageManager: 'pnpm@9.15.0',
  };

  await fs.writeJson(path.join(targetPath, 'package.json'), packageJson, { spaces: 2 });
}

async function generateRootPackageJson(targetPath: string, config: ProjectConfig): Promise<void> {
  const packageJson = {
    name: config.projectName,
    version: '0.1.0',
    private: true,
    engines: {
      node: '>=20.0.0',
      pnpm: '>=9.0.0',
    },
    scripts: {
      preinstall: 'npx only-allow pnpm',
      dev: 'turbo dev',
      build: 'turbo build',
      start: 'turbo start',
      typecheck: 'turbo typecheck',
      lint: 'turbo lint',
      test: 'turbo test',
      clean: 'turbo clean',
    },
    devDependencies: {
      turbo: '^2.3.3',
      '@types/node': '^22.10.2',
      typescript: '^5.7.2',
      prettier: '^3.4.2',
      eslint: '^9.17.0',
    },
    packageManager: 'pnpm@9.15.0',
  };

  await fs.writeJson(path.join(targetPath, 'package.json'), packageJson, { spaces: 2 });
}

async function generateReadme(targetPath: string, config: ProjectConfig): Promise<void> {
  const { projectName, projectType, frontend, backend } = config;

  let readme = `# ${projectName}\n\n`;
  readme += `Generated with [create-vandslab-app](https://github.com/vandslab/create-vandslab-app)\n\n`;

  // Show structure for projects with both frontend and backend
  if (projectType === 'monorepo') {
    readme += `## Project Structure\n\n`;
    readme += `\`\`\`\n`;
    readme += `apps/\n`;
    if (frontend !== 'none') readme += `├── web/          # Frontend application\n`;
    if (backend !== 'none') readme += `├── backend/      # Backend server\n`;
    readme += `packages/         # Shared configurations\n`;
    readme += `turbo.json        # Turborepo config\n`;
    readme += `\`\`\`\n\n`;
  } else if (frontend !== 'none' && backend !== 'none') {
    readme += `## Project Structure\n\n`;
    readme += `\`\`\`\n`;
    readme += `frontend/         # ${frontend} application\n`;
    readme += `backend/          # ${backend} server\n`;
    readme += `package.json      # Root scripts\n`;
    readme += `\`\`\`\n\n`;
  }

  readme += `## Stack\n\n`;

  if (projectType === 'monorepo') {
    readme += `- **Monorepo**: Turborepo\n`;
  }

  if (frontend !== 'none') {
    const frontendName = frontend === 'vite' ? 'Vite + React' : `Next.js ${frontend.split('-')[1]}`;
    readme += `- **Frontend**: ${frontendName} + TypeScript + Tailwind CSS\n`;
  }

  if (backend !== 'none') {
    if (backend === 'express') {
      readme += `- **Backend**: Express + TypeScript\n`;
      readme += `- **Database**: PostgreSQL with Prisma\n`;
      readme += `- **Auth**: JWT Authentication\n`;
      readme += `- **API Docs**: Swagger/OpenAPI\n`;
    } else if (backend === 'nestjs') {
      readme += `- **Backend**: NestJS + TypeScript\n`;
      readme += `- **Database**: PostgreSQL with TypeORM\n`;
      readme += `- **Auth**: JWT Authentication\n`;
      readme += `- **API Docs**: Swagger/OpenAPI\n`;
    } else if (backend === 'nestjs-prisma') {
      readme += `- **Backend**: NestJS + TypeScript\n`;
      readme += `- **Database**: PostgreSQL with Prisma\n`;
      readme += `- **Auth**: JWT Authentication\n`;
      readme += `- **API Docs**: Swagger/OpenAPI\n`;
    }
  }

  readme += `\n## Getting Started\n\n`;
  readme += `\`\`\`bash\n`;
  readme += `# Install dependencies\n`;
  readme += `pnpm install\n\n`;
  readme += `# Run development servers\n`;
  readme += `pnpm dev\n\n`;

  if (projectType === 'monorepo') {
    readme += `# Type check all packages\n`;
    readme += `pnpm typecheck\n\n`;
    readme += `# Build all packages\n`;
    readme += `pnpm build\n\n`;
    readme += `# Start production servers\n`;
    readme += `pnpm start\n`;
  } else {
    readme += `# Type check\n`;
    readme += `pnpm typecheck\n\n`;
    readme += `# Build for production\n`;
    readme += `pnpm build\n\n`;
    readme += `# Start production server\n`;
    readme += `pnpm start\n`;
  }

  readme += `\`\`\`\n`;

  readme += `\n## Available Scripts\n\n`;

  if (projectType === 'monorepo') {
    readme += `- **\`pnpm dev\`**: Start all development servers\n`;
    readme += `- **\`pnpm build\`**: Build all packages for production\n`;
    readme += `- **\`pnpm start\`**: Start all production servers\n`;
    readme += `- **\`pnpm typecheck\`**: Type check all packages\n`;
    readme += `- **\`pnpm lint\`**: Lint all packages\n`;
    readme += `- **\`pnpm test\`**: Run tests in all packages\n`;
    readme += `- **\`pnpm clean\`**: Clean all build outputs\n`;
  } else {
    readme += `- **\`pnpm dev\`**: Start development server\n`;
    readme += `- **\`pnpm build\`**: Build for production\n`;
    readme += `- **\`pnpm start\`**: Start production server\n`;
    readme += `- **\`pnpm typecheck\`**: Type check the code\n`;
    readme += `- **\`pnpm lint\`**: Lint the code\n`;
  }

  await fs.writeFile(path.join(targetPath, 'README.md'), readme, 'utf-8');
}

async function addUILibrary(
  templatesDir: string,
  targetPath: string,
  config: ProjectConfig
): Promise<void> {
  const { frontend, uiLibrary, projectType } = config;

  // Determine target directory based on project structure
  const appPath = projectType === 'monorepo'
    ? path.join(targetPath, 'apps', 'web')
    : targetPath;

  const uiLibraryPath = path.join(templatesDir, 'ui-libraries', uiLibrary);

  switch (uiLibrary) {
    case 'shadcn':
      await setupShadcn(uiLibraryPath, appPath, frontend);
      break;
    case 'chakra':
      await setupChakraUI(uiLibraryPath, appPath, frontend);
      break;
    case 'daisyui':
      await setupDaisyUI(uiLibraryPath, appPath, frontend);
      break;
  }

  // Update package.json with UI library dependencies
  await updatePackageJsonForUILibrary(appPath, uiLibrary, frontend);
}

async function setupShadcn(
  uiLibraryPath: string,
  appPath: string,
  frontendType: string
): Promise<void> {
  const commonPath = path.join(uiLibraryPath, 'common');
  const frameworkPath = path.join(uiLibraryPath, frontendType.startsWith('nextjs') ? 'nextjs' : frontendType);

  // Copy framework-specific components.json
  await copyFile(
    path.join(frameworkPath, 'components.json'),
    path.join(appPath, 'components.json')
  );

  // Copy lib/utils.ts from common - always in src
  const libPath = path.join(appPath, 'src', 'lib');

  await fs.ensureDir(libPath);
  await copyFile(
    path.join(commonPath, 'lib', 'utils.ts'),
    path.join(libPath, 'utils.ts')
  );

  // Copy components/ui directory from common - always in src
  const componentsPath = path.join(appPath, 'src', 'components', 'ui');

  await fs.ensureDir(componentsPath);
  await copyDirectory(
    path.join(commonPath, 'components', 'ui'),
    componentsPath
  );

  // Replace globals.css with shadcn version
  const globalsPath = frontendType.startsWith('nextjs')
    ? path.join(appPath, 'src', 'app', 'globals.css')
    : path.join(appPath, 'src', 'index.css');

  if (await fs.pathExists(globalsPath)) {
    const shadcnStyles = await fs.readFile(
      path.join(commonPath, 'globals.css'),
      'utf-8'
    );
    await fs.writeFile(globalsPath, shadcnStyles);
  }
}

async function setupChakraUI(
  uiLibraryPath: string,
  appPath: string,
  frontendType: string
): Promise<void> {
  const chakraPath = path.join(uiLibraryPath, frontendType.startsWith('nextjs') ? 'nextjs' : frontendType);

  if (frontendType.startsWith('nextjs')) {
    // Create providers directory
    const providersPath = path.join(appPath, 'src', 'providers');
    await fs.ensureDir(providersPath);

    // Copy ChakraProvider.tsx and theme.ts to src/providers
    await copyFile(
      path.join(chakraPath, 'src', 'providers', 'ChakraProvider.tsx'),
      path.join(providersPath, 'ChakraProvider.tsx')
    );
    await copyFile(
      path.join(chakraPath, 'src', 'providers', 'theme.ts'),
      path.join(providersPath, 'theme.ts')
    );

    // Copy Chakra UI specific tsconfig.json
    const tsconfigPath = path.join(appPath, 'tsconfig.json');
    if (await fs.pathExists(path.join(chakraPath, 'tsconfig.json'))) {
      await copyFile(
        path.join(chakraPath, 'tsconfig.json'),
        tsconfigPath
      );
    }

    // Copy Chakra UI specific next.config.ts
    const nextConfigPath = path.join(appPath, 'next.config.ts');
    if (await fs.pathExists(path.join(chakraPath, 'next.config.ts'))) {
      await copyFile(
        path.join(chakraPath, 'next.config.ts'),
        nextConfigPath
      );
    }

    // Copy pre-configured layout.tsx with Provider already included
    const layoutPath = path.join(appPath, 'src', 'app', 'layout.tsx');
    if (await fs.pathExists(path.join(chakraPath, 'src', 'app', 'layout.tsx'))) {
      await copyFile(
        path.join(chakraPath, 'src', 'app', 'layout.tsx'),
        layoutPath
      );
    }
  } else {
    // For Vite
    // Copy theme.ts
    await copyFile(
      path.join(chakraPath, 'src', 'theme.ts'),
      path.join(appPath, 'src', 'theme.ts')
    );

    // Copy main.tsx template and rename
    await copyFile(
      path.join(chakraPath, 'src', 'main.tsx.template'),
      path.join(appPath, 'src', 'main.tsx')
    );

    // Copy Chakra UI specific tsconfig.app.json for Vite
    const tsconfigAppPath = path.join(appPath, 'tsconfig.app.json');
    if (await fs.pathExists(path.join(chakraPath, 'tsconfig.app.json'))) {
      await copyFile(
        path.join(chakraPath, 'tsconfig.app.json'),
        tsconfigAppPath
      );
    }

    // Copy Chakra UI specific vite.config.ts
    const viteConfigPath = path.join(appPath, 'vite.config.ts');
    if (await fs.pathExists(path.join(chakraPath, 'vite.config.ts'))) {
      await copyFile(
        path.join(chakraPath, 'vite.config.ts'),
        viteConfigPath
      );
    }
  }

  // Copy example components - always in src
  const componentsPath = path.join(appPath, 'src', 'components');

  await fs.ensureDir(componentsPath);
  if (await fs.pathExists(path.join(chakraPath, 'components'))) {
    await copyDirectory(
      path.join(chakraPath, 'components'),
      componentsPath
    );
  }
}

async function setupDaisyUI(
  uiLibraryPath: string,
  appPath: string,
  frontendType: string
): Promise<void> {
  // Note: Tailwind CSS 4 uses CSS-based configuration, not JS config files
  // DaisyUI works with Tailwind CSS 4 through CSS imports

  // Replace CSS file with DaisyUI version
  const cssPath = frontendType.startsWith('nextjs')
    ? path.join(appPath, 'src', 'app', 'globals.css')
    : path.join(appPath, 'src', 'index.css');

  if (await fs.pathExists(cssPath)) {
    const daisyStyles = await fs.readFile(
      path.join(uiLibraryPath, 'styles.css'),
      'utf-8'
    );
    await fs.writeFile(cssPath, daisyStyles);
  }

  // Copy example components - always in src
  const componentsPath = path.join(appPath, 'src', 'components');
  await fs.ensureDir(componentsPath);

  if (await fs.pathExists(path.join(uiLibraryPath, 'components'))) {
    await copyDirectory(
      path.join(uiLibraryPath, 'components'),
      componentsPath
    );
  }
}

async function updatePackageJsonForUILibrary(
  appPath: string,
  uiLibrary: string,
  frontendType: string
): Promise<void> {
  const packageJsonPath = path.join(appPath, 'package.json');

  if (!await fs.pathExists(packageJsonPath)) {
    return; // Skip if no package.json exists
  }

  const packageJson = await fs.readJson(packageJsonPath);

  // Initialize dependencies if not present
  if (!packageJson.dependencies) {
    packageJson.dependencies = {};
  }
  if (!packageJson.devDependencies) {
    packageJson.devDependencies = {};
  }

  switch (uiLibrary) {
    case 'shadcn':
      Object.assign(packageJson.dependencies, {
        'clsx': '^2.1.1',
        'tailwind-merge': '^2.6.0',
        '@radix-ui/react-slot': '^1.1.1',
        'class-variance-authority': '^0.7.1',
        'lucide-react': '^0.468.0',
        'tw-animate-css': '^1.0.0',
      });
      break;

    case 'chakra':
      Object.assign(packageJson.dependencies, {
        '@chakra-ui/react': '^3.2.3',
        '@emotion/react': '^11.14.0',
        '@emotion/styled': '^11.14.0',
        'framer-motion': '^11.15.0',
      });

      if (frontendType.startsWith('nextjs')) {
        packageJson.dependencies['@chakra-ui/next-js'] = '^2.4.2';
      }

      if (frontendType === 'vite') {
        packageJson.devDependencies['vite-tsconfig-paths'] = '^5.1.4';
      }
      break;

    case 'daisyui':
      Object.assign(packageJson.devDependencies, {
        'daisyui': '^5',
      });
      break;
  }

  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
}

// Helper functions
function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}
