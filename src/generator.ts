import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ProjectConfig } from "./prompts.js";
import {
	copyDirectory,
	copyFile,
	replaceInDirectory,
	renameDotFiles,
	removeGitkeepFiles,
} from "./utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function generateProject(config: ProjectConfig): Promise<void> {
	const { projectName, projectType, frontend, backend, targetPath } = config;

	// Create project directory
	await fs.ensureDir(targetPath);

	// Get templates directory (from package root, not dist)
	const templatesDir = path.resolve(__dirname, "..", "templates");

	// Copy base files (always included)
	await copyBaseFiles(templatesDir, targetPath, config);

	if (projectType === "monorepo") {
		await generateMonorepo(templatesDir, targetPath, config);
	} else {
		await generateStandalone(templatesDir, targetPath, config);
	}

	// Replace placeholders in all generated files
	const replacements = {
		PROJECT_NAME: projectName,
		PROJECT_NAME_CAMEL: toCamelCase(projectName),
		PROJECT_NAME_PASCAL: toPascalCase(projectName),
	};

	await replaceInDirectory(targetPath, replacements);

	// Rename all .template files to proper dot files (.gitignore, .prettierrc, etc.)
	await renameDotFiles(targetPath);

	// Remove .gitkeep files (they're only needed to preserve empty dirs in npm package)
	await removeGitkeepFiles(targetPath);

	// Generate README
	await generateReadme(targetPath, config);
}

async function copyBaseFiles(
	templatesDir: string,
	targetPath: string,
	config: ProjectConfig
): Promise<void> {
	const baseDir = path.join(templatesDir, "base");

	// Copy template files (will be renamed to dot files later)
	await copyFile(
		path.join(baseDir, "gitignore.template"),
		path.join(targetPath, "gitignore.template")
	);
	// pnpm 10+ reads nodeLinker/settings here; the monorepo branch overwrites
	// this file with its own copy, which carries the same setting.
	await copyFile(
		path.join(baseDir, "pnpm-workspace.yaml.template"),
		path.join(targetPath, "pnpm-workspace.yaml")
	);
	await copyFile(
		path.join(baseDir, "prettierrc.template"),
		path.join(targetPath, "prettierrc.template")
	);
}

/**
 * Give an app directory its own pnpm settings.
 *
 * A CI checkout rule can pull a single app out of the monorepo, and that
 * directory then has no workspace root above it to inherit nodeLinker from.
 * Without this the app installs isolated, where the Prisma client cannot
 * resolve itself. Harmless inside the workspace: pnpm keeps using the root
 * config for workspace installs.
 */
async function writeAppWorkspaceConfig(
	templatesDir: string,
	appDir: string
): Promise<void> {
	await copyFile(
		path.join(templatesDir, "base", "pnpm-workspace.yaml.template"),
		path.join(appDir, "pnpm-workspace.yaml")
	);
}

async function generateMonorepo(
	templatesDir: string,
	targetPath: string,
	config: ProjectConfig
): Promise<void> {
	// Create monorepo structure
	await fs.ensureDir(path.join(targetPath, "apps"));
	await fs.ensureDir(path.join(targetPath, "packages"));

	// Copy turborepo config
	const turboConfig = path.join(templatesDir, "monorepo", "turbo.json");
	await copyFile(turboConfig, path.join(targetPath, "turbo.json"));

	// Copy pnpm workspace config
	const workspaceConfig = path.join(
		templatesDir,
		"monorepo",
		"pnpm-workspace.yaml.template"
	);
	await copyFile(workspaceConfig, path.join(targetPath, "pnpm-workspace.yaml"));

	// Per-app lockfile refresher, for CI that checks out a single app
	await copyDirectory(
		path.join(templatesDir, "monorepo", "scripts"),
		path.join(targetPath, "scripts")
	);

	// Generate root package.json
	await generateRootPackageJson(targetPath, config);

	// Copy frontend if selected
	if (config.frontend !== "none") {
		const frontendTemplate = path.join(
			templatesDir,
			"frontend",
			config.frontend
		);
		const frontendDest = path.join(targetPath, "apps", "web");
		await copyDirectory(frontendTemplate, frontendDest);
		await writeAppWorkspaceConfig(templatesDir, frontendDest);
	}

	// Copy backend if selected
	if (config.backend !== "none") {
		const backendDest = path.join(targetPath, "apps", "backend");
		await generateBackend(templatesDir, backendDest, config);
		await writeAppWorkspaceConfig(templatesDir, backendDest);
	}
}

async function generateStandalone(
	templatesDir: string,
	targetPath: string,
	config: ProjectConfig
): Promise<void> {
	const hasBothFrontendAndBackend =
		config.frontend !== "none" && config.backend !== "none";

	if (hasBothFrontendAndBackend) {
		// Both frontend and backend - use separate folders
		if (config.frontend !== "none") {
			const frontendTemplate = path.join(
				templatesDir,
				"frontend",
				config.frontend
			);
			const frontendDest = path.join(targetPath, "frontend");
			await copyDirectory(frontendTemplate, frontendDest);
			await writeAppWorkspaceConfig(templatesDir, frontendDest);
		}

		if (config.backend !== "none") {
			const backendDest = path.join(targetPath, "backend");
			await generateBackend(templatesDir, backendDest, config);
			await writeAppWorkspaceConfig(templatesDir, backendDest);
		}

		// Create root package.json with scripts for both
		await generateStandaloneRootPackageJson(targetPath, config);
	} else {
		// Only one selected - use root folder
		if (config.frontend !== "none") {
			const frontendTemplate = path.join(
				templatesDir,
				"frontend",
				config.frontend
			);
			await copyDirectory(frontendTemplate, targetPath);
		} else if (config.backend !== "none") {
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
	const backendTemplate = path.join(templatesDir, "backend", config.backend);
	await copyDirectory(backendTemplate, targetPath);

	// Note: Each backend template includes its own setup
	// - express: Prisma, Auth (JWT), Swagger
	// - nestjs: TypeORM, Auth (JWT), Swagger
	// - nestjs-prisma: Prisma, Auth (JWT), Swagger
}

async function generateStandaloneRootPackageJson(
	targetPath: string,
	config: ProjectConfig
): Promise<void> {
	const packageJson = {
		name: config.projectName,
		version: "0.1.0",
		private: true,
		engines: {
			node: ">=20.0.0",
			pnpm: ">=11.0.0",
		},
		scripts: {
			preinstall: "npx only-allow pnpm",
			"install:all": "pnpm install --recursive",
			dev: 'concurrently "pnpm dev:frontend" "pnpm dev:backend"',
			"dev:frontend": "cd frontend && pnpm dev",
			"dev:backend": "cd backend && pnpm dev",
			build: "pnpm build:frontend && pnpm build:backend",
			"build:frontend": "cd frontend && pnpm build",
			"build:backend": "cd backend && pnpm build",
			start: 'concurrently "pnpm start:frontend" "pnpm start:backend"',
			"start:frontend": "cd frontend && pnpm start",
			"start:backend": "cd backend && pnpm start",
			typecheck: "pnpm typecheck:frontend && pnpm typecheck:backend",
			"typecheck:frontend": "cd frontend && pnpm typecheck",
			"typecheck:backend": "cd backend && pnpm typecheck",
		},
		devDependencies: {
			concurrently: "^10.0.5",
			"@types/node": "^26.0.0",
			typescript: "^6.0.3",
		},
	};

	await fs.writeJson(path.join(targetPath, "package.json"), packageJson, {
		spaces: 2,
	});
}

async function generateRootPackageJson(
	targetPath: string,
	config: ProjectConfig
): Promise<void> {
	const packageJson = {
		name: config.projectName,
		version: "0.1.0",
		private: true,
		engines: {
			node: ">=20.0.0",
			pnpm: ">=11.0.0",
		},
		// Turborepo refuses to resolve a workspace without a package manager
		// declaration. A range keeps it unpinned; corepack would demand an exact
		// version, which is why the Dockerfiles install pnpm from npm instead.
		devEngines: {
			packageManager: {
				name: "pnpm",
				version: "^11.0.0",
			},
		},
		scripts: {
			preinstall: "npx only-allow pnpm",
			dev: "turbo dev",
			build: "turbo build",
			start: "turbo start",
			typecheck: "turbo typecheck",
			lint: "turbo lint",
			test: "turbo test",
			clean: "turbo clean",
			lockfiles: "node scripts/update-lockfiles.mjs",
		},
		devDependencies: {
			turbo: "^2.10.12",
			"@types/node": "^26.0.0",
			typescript: "^6.0.3",
			prettier: "^3.8.4",
			eslint: "^10.5.0",
		},
	};

	await fs.writeJson(path.join(targetPath, "package.json"), packageJson, {
		spaces: 2,
	});
}

async function generateReadme(
	targetPath: string,
	config: ProjectConfig
): Promise<void> {
	const { projectName, projectType, frontend, backend } = config;

	let readme = `# ${projectName}\n\n`;
	readme += `Generated with [create-vandslab-app](https://github.com/vandslab/create-vandslab-app)\n\n`;

	// Show structure for projects with both frontend and backend
	if (projectType === "monorepo") {
		readme += `## Project Structure\n\n`;
		readme += `\`\`\`\n`;
		readme += `apps/\n`;
		if (frontend !== "none")
			readme += `├── web/          # Frontend application\n`;
		if (backend !== "none") readme += `├── backend/      # Backend server\n`;
		readme += `packages/         # Shared configurations\n`;
		readme += `turbo.json        # Turborepo config\n`;
		readme += `\`\`\`\n\n`;
	} else if (frontend !== "none" && backend !== "none") {
		readme += `## Project Structure\n\n`;
		readme += `\`\`\`\n`;
		readme += `frontend/         # ${frontend} application\n`;
		readme += `backend/          # ${backend} server\n`;
		readme += `package.json      # Root scripts\n`;
		readme += `\`\`\`\n\n`;
	}

	readme += `## Stack\n\n`;

	if (projectType === "monorepo") {
		readme += `- **Monorepo**: Turborepo\n`;
	}

	if (frontend !== "none") {
		const frontendName =
			frontend === "vite"
				? "Vite + React"
				: frontend === "nuxt"
				? "Nuxt 4 + Vue"
				: `Next.js ${frontend.split("-")[1]}`;
		readme += `- **Frontend**: ${frontendName} + TypeScript + Tailwind CSS\n`;
	}

	if (backend !== "none") {
		if (backend === "express") {
			readme += `- **Backend**: Express + TypeScript\n`;
			readme += `- **Database**: PostgreSQL with Prisma\n`;
			readme += `- **Auth**: JWT Authentication\n`;
			readme += `- **API Docs**: Swagger/OpenAPI\n`;
		} else if (backend === "nestjs") {
			readme += `- **Backend**: NestJS + TypeScript\n`;
			readme += `- **Database**: PostgreSQL with TypeORM\n`;
			readme += `- **API Docs**: Swagger/OpenAPI\n`;
		} else if (backend === "nestjs-prisma") {
			readme += `- **Backend**: NestJS + TypeScript\n`;
			readme += `- **Database**: PostgreSQL with Prisma\n`;
			readme += `- **API Docs**: Swagger/OpenAPI\n`;
		}
	}

	readme += `\n## Getting Started\n\n`;
	readme += `\`\`\`bash\n`;
	readme += `# Install dependencies\n`;
	readme += `pnpm install\n\n`;
	readme += `# Run development servers\n`;
	readme += `pnpm dev\n\n`;

	if (projectType === "monorepo") {
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

	if (projectType === "monorepo") {
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

	await fs.writeFile(path.join(targetPath, "README.md"), readme, "utf-8");
}

async function addUILibrary(
	templatesDir: string,
	targetPath: string,
	config: ProjectConfig
): Promise<void> {
	const { frontend, uiLibrary, projectType } = config;

	// Determine target directory based on project structure
	const appPath =
		projectType === "monorepo"
			? path.join(targetPath, "apps", "web")
			: targetPath;

	const uiLibraryPath = path.join(templatesDir, "ui-libraries", uiLibrary);

	switch (uiLibrary) {
		case "shadcn":
			await setupShadcn(uiLibraryPath, appPath, frontend);
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
	const commonPath = path.join(uiLibraryPath, "common");
	const frameworkPath = path.join(
		uiLibraryPath,
		frontendType.startsWith("nextjs") ? "nextjs" : frontendType
	);

	// Copy framework-specific components.json
	await copyFile(
		path.join(frameworkPath, "components.json"),
		path.join(appPath, "components.json")
	);

	// Copy lib/utils.ts from common - always in src
	const libPath = path.join(appPath, "src", "lib");

	await fs.ensureDir(libPath);
	await copyFile(
		path.join(commonPath, "lib", "utils.ts"),
		path.join(libPath, "utils.ts")
	);

	// Copy components/ui directory from common - always in src
	const componentsPath = path.join(appPath, "src", "components", "ui");

	await fs.ensureDir(componentsPath);
	await copyDirectory(
		path.join(commonPath, "components", "ui"),
		componentsPath
	);

	// Replace globals.css with shadcn version
	const globalsPath = frontendType.startsWith("nextjs")
		? path.join(appPath, "src", "app", "globals.css")
		: path.join(appPath, "src", "index.css");

	if (await fs.pathExists(globalsPath)) {
		const shadcnStyles = await fs.readFile(
			path.join(commonPath, "globals.css"),
			"utf-8"
		);
		await fs.writeFile(globalsPath, shadcnStyles);
	}
}

async function updatePackageJsonForUILibrary(
	appPath: string,
	uiLibrary: string,
	frontendType: string
): Promise<void> {
	const packageJsonPath = path.join(appPath, "package.json");

	if (!(await fs.pathExists(packageJsonPath))) {
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
		case "shadcn":
			Object.assign(packageJson.dependencies, {
				clsx: "^2.1.1",
				"tailwind-merge": "^2.6.0",
				"@radix-ui/react-slot": "^1.1.1",
				"class-variance-authority": "^0.7.1",
				"lucide-react": "^0.468.0",
				"tw-animate-css": "^1.0.0",
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
