#!/usr/bin/env node

import * as p from "@clack/prompts";
import { setTimeout } from "node:timers/promises";
import pc from "picocolors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runPrompts } from "./prompts.js";
import { generateProject } from "./generator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
	console.clear();

	// ASCII Art Banner
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

	p.intro(pc.bgCyan(pc.black(" create-vandslab-app ")));

	// Get project name from CLI argument if provided
	const cliProjectName = process.argv[2];

	// Get project configuration from prompts
	const config = await runPrompts(cliProjectName);

	// Start project generation
	const s = p.spinner();
	s.start("Creating your project...");

	try {
		await generateProject(config);
		s.stop("Project created successfully!");

		p.note(
			`Next steps:\n\n  cd ${config.projectName}\n  pnpm install\n  pnpm dev\n\n💡 TIP: Update dependencies anytime with:\n  node scripts/update-deps.mjs\n  pnpm install`,
			"Ready to go!"
		);

		p.outro(pc.green("Happy coding! 🚀"));
	} catch (error) {
		s.stop("Failed to create project");
		p.cancel(error instanceof Error ? error.message : "Unknown error occurred");
		process.exit(1);
	}
}

main().catch(console.error);
