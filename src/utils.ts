import fs from 'fs-extra';
import path from 'node:path';

/**
 * Copy a directory recursively
 */
export async function copyDirectory(src: string, dest: string): Promise<void> {
  await fs.copy(src, dest, {
    overwrite: true,
    errorOnExist: false,
    filter: (src) => {
      // Skip node_modules and pnpm-lock.yaml
      if (src.includes('node_modules') || src.includes('pnpm-lock.yaml')) {
        return false;
      }
      // Copy everything else including dot files
      return true;
    },
  });
}

/**
 * Copy a single file
 */
export async function copyFile(src: string, dest: string): Promise<void> {
  await fs.copy(src, dest);
}

/**
 * Replace placeholders in a file
 */
export async function replaceInFile(
  filePath: string,
  replacements: Record<string, string>
): Promise<void> {
  try {
    let content = await fs.readFile(filePath, 'utf-8');

    for (const [key, value] of Object.entries(replacements)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
    }

    await fs.writeFile(filePath, content, 'utf-8');
  } catch (error) {
    // Log the error for debugging and re-throw
    console.error(`Error processing file: ${filePath}`);
    throw error;
  }
}

/**
 * Replace placeholders in all files within a directory
 */
export async function replaceInDirectory(
  dirPath: string,
  replacements: Record<string, string>
): Promise<void> {
  // Binary file extensions to skip
  const binaryExtensions = [
    '.ico', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
    '.woff', '.woff2', '.ttf', '.eot', '.otf',
    '.mp3', '.mp4', '.avi', '.mov', '.webm',
    '.zip', '.tar', '.gz', '.rar',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx',
    '.exe', '.dll', '.so', '.dylib'
  ];

  // Use recursive walk to get all files
  async function walkDir(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await walkDir(fullPath));
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }

    return files;
  }

  const allFiles = await walkDir(dirPath);

  for (const filePath of allFiles) {
    // Skip binary files
    const ext = path.extname(filePath).toLowerCase();
    if (binaryExtensions.includes(ext)) {
      continue;
    }

    await replaceInFile(filePath, replacements);
  }
}

/**
 * Create a package.json file
 */
export async function createPackageJson(
  targetPath: string,
  projectName: string,
  config: any
): Promise<void> {
  const packageJson = {
    name: projectName,
    version: '0.1.0',
    private: true,
    scripts: {},
    dependencies: {},
    devDependencies: {},
  };

  await fs.writeJson(path.join(targetPath, 'package.json'), packageJson, { spaces: 2 });
}

/**
 * Get the templates directory path
 */
export function getTemplatesDir(): string {
  // When running from dist, go up one level to find templates
  return path.join(process.cwd(), 'templates');
}
