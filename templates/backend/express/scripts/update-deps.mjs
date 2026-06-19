#!/usr/bin/env node
// Zero-dependency dependency updater for this project.
//
// Scans package.json files (skipping node_modules and build output), checks the
// npm registry for the latest version of each dependency, shows what's outdated,
// and — on confirmation — rewrites the version ranges. Then run `pnpm install`.
//
// Uses only Node built-ins, so it works in any generated project without
// installing anything. Run from the project (or app) root:
//   node scripts/update-deps.mjs

import { execSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  ".next",
  ".nuxt",
  ".output",
  ".turbo",
]);
const DEP_FIELDS = ["dependencies", "devDependencies"];

function findPackageJsons(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        out.push(...findPackageJsons(join(dir, entry.name)));
      }
    } else if (entry.name === "package.json") {
      out.push(join(dir, entry.name));
    }
  }
  return out;
}

function latestVersion(pkg) {
  try {
    return execSync(`npm view ${pkg} version`, {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null; // private/unpublished/unreachable — skip
  }
}

// Strip the range prefix (^ ~ >= …) so we can compare against a bare version.
const bare = (range) => range.replace(/^[\^~><= ]+/, "").trim();

// Skip ranges we must not rewrite (workspace deps, local links, git/url specs).
const isLocked = (range) =>
  /^(workspace:|link:|file:|git\+|https?:)/.test(range);

async function main() {
  const files = findPackageJsons(process.cwd());
  if (files.length === 0) {
    console.log("No package.json found.");
    return;
  }

  const parsed = files.map((file) => ({
    file,
    json: JSON.parse(readFileSync(file, "utf-8")),
  }));

  const names = new Set();
  for (const { json } of parsed) {
    for (const field of DEP_FIELDS) {
      for (const name of Object.keys(json[field] ?? {})) names.add(name);
    }
  }

  console.log(
    `Checking ${names.size} packages across ${files.length} package.json file(s)…\n`
  );

  const latest = new Map();
  for (const name of names) {
    const v = latestVersion(name);
    if (v) latest.set(name, v);
  }

  const updates = [];
  for (const { file, json } of parsed) {
    for (const field of DEP_FIELDS) {
      const deps = json[field];
      if (!deps) continue;
      for (const [name, range] of Object.entries(deps)) {
        const to = latest.get(name);
        if (!to || isLocked(range) || bare(range) === to) continue;
        updates.push({ file, field, name, from: range, to });
      }
    }
  }

  if (updates.length === 0) {
    console.log("Everything is up to date. 🎉");
    return;
  }

  const pad = Math.max(...updates.map((u) => u.name.length));
  updates.forEach((u, i) => {
    const n = String(i + 1).padStart(2);
    console.log(`  ${n}. ${u.name.padEnd(pad)}  ${u.from}  →  ^${u.to}`);
  });
  console.log();

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const input = (
    await rl.question(
      `Select packages — numbers (e.g. 1 3 5), "a" for all, Enter to cancel: `
    )
  )
    .trim()
    .toLowerCase();
  rl.close();

  if (input === "") {
    console.log("Aborted. Nothing changed.");
    return;
  }

  let chosen;
  if (input === "a" || input === "all") {
    chosen = updates;
  } else {
    const picked = new Set(
      input
        .split(/[\s,]+/)
        .map((n) => Number.parseInt(n, 10))
        .filter((n) => n >= 1 && n <= updates.length)
    );
    if (picked.size === 0) {
      console.log("No valid selection. Nothing changed.");
      return;
    }
    chosen = updates.filter((_, i) => picked.has(i + 1));
  }

  for (const { file, json } of parsed) {
    const own = chosen.filter((u) => u.file === file);
    if (own.length === 0) continue;
    for (const u of own) json[u.field][u.name] = `^${u.to}`;
    writeFileSync(file, JSON.stringify(json, null, 2) + "\n", "utf-8");
  }

  console.log(`\nUpdated ${chosen.length} package(s). Run "pnpm install" to apply.`);
}

main();
