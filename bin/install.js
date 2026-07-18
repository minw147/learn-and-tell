#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");

// Files/dirs that ship in the repo (for dev provenance: BRAINSTORM.md, CONTEXT.md, docs/,
// package.json, bin/) but are NOT part of the installed skill — an end user invoking this
// skill only ever needs SKILL.md + references/ + templates/.
const SKILL_FILES = ["SKILL.md", "references", "templates", "README.md", "LICENSE"];

function parseArgs(argv) {
  const args = { local: false, dir: null, force: false };
  for (const raw of argv) {
    if (raw === "--local") args.local = true;
    else if (raw === "--force" || raw === "-f") args.force = true;
    else if (raw.startsWith("--dir=")) args.dir = raw.slice("--dir=".length);
    else if (raw === "--help" || raw === "-h") args.help = true;
  }
  return args;
}

function printHelp() {
  console.log(`
learn-and-tell-skill installer

Usage:
  npx github:minw147/learn-and-tell [options]

Options:
  --local        Install into ./.claude/skills/learn-and-tell (this project only)
                 instead of the default ~/.claude/skills/learn-and-tell (all projects)
  --dir=<path>   Install into a custom directory instead
  --force, -f    Overwrite an existing install without prompting
  --help, -h     Show this help

By default, installs to the user-level Claude Code skills directory so the
skill is available in every project.
`);
}

function copyRecursive(src, dest) {
  fs.cpSync(src, dest, { recursive: true });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const repoRoot = path.resolve(__dirname, "..");
  const targetDir = args.dir
    ? path.resolve(process.cwd(), args.dir)
    : args.local
    ? path.resolve(process.cwd(), ".claude", "skills", "learn-and-tell")
    : path.join(os.homedir(), ".claude", "skills", "learn-and-tell");

  if (fs.existsSync(targetDir) && !args.force) {
    console.log(`⚠️  ${targetDir} already exists.`);
    console.log(`   Re-run with --force to overwrite, or --dir=<path> to install elsewhere.`);
    process.exitCode = 1;
    return;
  }

  fs.mkdirSync(targetDir, { recursive: true });

  for (const name of SKILL_FILES) {
    const src = path.join(repoRoot, name);
    if (!fs.existsSync(src)) continue; // tolerate a trimmed npm-published tarball
    copyRecursive(src, path.join(targetDir, name));
  }

  console.log(`✅ learn-and-tell skill installed to:`);
  console.log(`   ${targetDir}`);
  console.log(``);
  console.log(`Restart Claude Code (or start a new session) and the skill will be available.`);
  console.log(`Source, docs, and design rationale (ADRs): https://github.com/minw147/learn-and-tell`);
}

main();
