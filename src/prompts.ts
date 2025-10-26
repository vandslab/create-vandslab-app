import * as p from '@clack/prompts';
import pc from 'picocolors';
import path from 'node:path';
import fs from 'fs-extra';

export interface ProjectConfig {
  projectName: string;
  projectType: 'monorepo' | 'standalone';
  frontend: 'vite' | 'nextjs-15' | 'nextjs-16' | 'none';
  backend: 'express' | 'nestjs' | 'nestjs-prisma' | 'none';
  uiLibrary: 'none' | 'shadcn' | 'chakra' | 'daisyui';
  targetPath: string;
}

export async function runPrompts(initialProjectName?: string): Promise<ProjectConfig> {
  // Handle "." to mean current directory
  let projectNameFromCli: string | undefined = undefined;
  let useCurrentDir = false;

  if (initialProjectName === '.') {
    // Use current directory, but still ask for project name
    useCurrentDir = true;

    // Check if current directory is empty
    const files = await fs.readdir(process.cwd());
    if (files.length > 0) {
      p.cancel('Current directory is not empty. Please use an empty directory or specify a new project name.');
      process.exit(1);
    }
    // Don't set projectNameFromCli - let it ask the user
  } else if (initialProjectName) {
    // CLI-provided project name - use it without asking
    projectNameFromCli = initialProjectName;

    // Validate CLI-provided project name
    if (!/^[a-z0-9-]+$/.test(initialProjectName)) {
      p.cancel('Project name can only contain lowercase letters, numbers, and hyphens');
      process.exit(1);
    }
    const targetPath = path.resolve(process.cwd(), initialProjectName);
    if (fs.existsSync(targetPath)) {
      p.cancel(`Directory "${initialProjectName}" already exists`);
      process.exit(1);
    }
  }

  const options = await p.group(
    {
      projectName: () =>
        projectNameFromCli
          ? Promise.resolve(projectNameFromCli)
          : p.text({
              message: 'What is your project named?',
              placeholder: useCurrentDir ? path.basename(process.cwd()) : 'my-vandslab-app',
              validate: (value) => {
                if (!value) return 'Project name is required';
                if (!/^[a-z0-9-]+$/.test(value)) {
                  return 'Project name can only contain lowercase letters, numbers, and hyphens';
                }
                // Skip directory check if using current directory
                if (!useCurrentDir) {
                  const targetPath = path.resolve(process.cwd(), value);
                  if (fs.existsSync(targetPath)) {
                    return `Directory "${value}" already exists`;
                  }
                }
              },
            }),

      projectType: () =>
        p.select({
          message: 'What type of project do you want to create?',
          options: [
            { value: 'monorepo', label: 'Monorepo (Turborepo)', hint: 'Frontend + Backend together' },
            { value: 'standalone', label: 'Standalone', hint: 'Single app (Frontend or Backend)' },
          ],
        }),

      frontend: ({ results }) =>
        p.select({
          message: 'Which frontend framework?',
          options: [
            { value: 'nextjs-15', label: 'Next.js 15', hint: 'React framework (stable)' },
            { value: 'nextjs-16', label: 'Next.js 16', hint: 'React framework (latest)' },
            { value: 'vite', label: 'Vite + React', hint: 'Fast, lightweight' },
            ...(results.projectType === 'standalone' ? [{ value: 'none' as const, label: 'None', hint: 'Backend only' }] : []),
          ],
          initialValue: 'nextjs-16',
        }),

      backend: ({ results }) =>
        results.projectType === 'monorepo' || results.frontend === 'none'
          ? p.select({
              message: 'Which backend framework?',
              options: [
                { value: 'express', label: 'Express + Prisma', hint: 'Node.js + TypeScript + Prisma ORM' },
                { value: 'nestjs', label: 'NestJS + TypeORM', hint: 'Enterprise Node.js + TypeORM' },
                { value: 'nestjs-prisma', label: 'NestJS + Prisma', hint: 'Enterprise Node.js + Prisma ORM' },
              ],
              initialValue: 'express',
            })
          : p.select({
              message: 'Which backend framework?',
              options: [
                { value: 'express', label: 'Express + Prisma', hint: 'Node.js + TypeScript + Prisma ORM' },
                { value: 'nestjs', label: 'NestJS + TypeORM', hint: 'Enterprise Node.js + TypeORM' },
                { value: 'nestjs-prisma', label: 'NestJS + Prisma', hint: 'Enterprise Node.js + Prisma ORM' },
                { value: 'none', label: 'No backend' },
              ],
              initialValue: 'none',
            }),

      uiLibrary: ({ results }) =>
        results.frontend !== 'none'
          ? p.select({
              message: 'Would you like to add a UI component library?',
              options: [
                { value: 'none', label: 'None', hint: 'Just Tailwind CSS' },
                { value: 'shadcn', label: 'shadcn/ui', hint: 'Copy-paste components with Radix UI' },
                { value: 'chakra', label: 'Chakra UI', hint: 'Modular and accessible component library' },
                { value: 'daisyui', label: 'DaisyUI', hint: 'Tailwind CSS components plugin' },
              ],
              initialValue: 'shadcn',
            })
          : Promise.resolve('none'),
    },
    {
      onCancel: () => {
        p.cancel('Operation cancelled.');
        process.exit(0);
      },
    }
  );

  // If using current directory, don't create a new subdirectory
  const targetPath = useCurrentDir
    ? process.cwd()
    : path.resolve(process.cwd(), options.projectName as string);

  return {
    ...options,
    targetPath,
  } as ProjectConfig;
}
