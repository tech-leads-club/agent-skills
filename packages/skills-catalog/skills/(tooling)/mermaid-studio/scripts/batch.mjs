#!/usr/bin/env node

/**
 * mermaid-studio/scripts/batch.mjs
 *
 * Batch renders multiple Mermaid diagrams in parallel.
 *
 * Usage:
 *   node batch.mjs --input-dir ./diagrams --output-dir ./rendered [options]
 *
 * Options:
 *   --input-dir     Directory containing .mmd files
 *   --output-dir    Directory for rendered outputs
 *   --format        Output format: svg (default), png, pdf, ascii
 *   --theme         Theme name (default: default)
 *   --workers       Parallel workers (default: 4)
 *   --recursive     Search subdirectories for .mmd files
 *   --timeout       Per-file timeout in ms (default: 30000)
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, readdirSync } from "fs";
import { basename, dirname, extname, join, relative, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function parseArgs(args) {
  const opts = {
    inputDir: null,
    outputDir: null,
    format: "svg",
    theme: "default",
    workers: 4,
    recursive: false,
    timeout: 30000,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--input-dir":
        opts.inputDir = args[++i];
        break;
      case "--output-dir":
        opts.outputDir = args[++i];
        break;
      case "--format":
        opts.format = args[++i];
        break;
      case "--theme":
        opts.theme = args[++i];
        break;
      case "--workers":
        opts.workers = parseInt(args[++i], 10);
        break;
      case "--recursive":
        opts.recursive = true;
        break;
      case "--timeout":
        opts.timeout = parseInt(args[++i], 10);
        break;
      case "--help":
      case "-h":
        console.log(`
Mermaid Studio — Batch Renderer

Usage:
  node batch.mjs --input-dir <dir> --output-dir <dir> [options]

Options:
  --input-dir     Directory containing .mmd/.mermaid files
  --output-dir    Output directory for rendered files
  --format        Output format: svg (default), png, pdf, ascii
  --theme         Theme name (default: default)
  --workers       Parallel render workers (default: 4)
  --recursive     Include subdirectories
  --timeout       Per-file timeout in ms (default: 30000)
  --help, -h      Show this help
`);
        process.exit(0);
    }
  }

  return opts;
}

function findMmdFiles(dir, recursive = false) {
  const files = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isFile() && (entry.name.endsWith(".mmd") || entry.name.endsWith(".mermaid"))) {
      files.push(fullPath);
    } else if (entry.isDirectory() && recursive) {
      files.push(...findMmdFiles(fullPath, true));
    }
  }

  return files.sort();
}

function getOutputPath(inputFile, inputDir, outputDir, format) {
  const rel = relative(inputDir, inputFile);
  const ext = format === "ascii" ? ".txt" : `.${format}`;
  const outputName = basename(rel, extname(rel)) + ext;
  const outputSubdir = dirname(rel);
  return resolve(outputDir, outputSubdir, outputName);
}

async function renderFile(inputFile, outputFile, format, theme, timeout) {
  const renderScript =
    format === "ascii"
      ? resolve(__dirname, "render-ascii.mjs")
      : resolve(__dirname, "render.mjs");

  const args =
    format === "ascii"
      ? ["--input", inputFile, "--output", outputFile]
      : ["--input", inputFile, "--output", outputFile, "--format", format, "--theme", theme];

  return new Promise((resolvePromise) => {
    try {
      const cmd = `node "${renderScript}" ${args.map((a) => `"${a}"`).join(" ")}`;
      execSync(cmd, {
        stdio: "pipe",
        timeout: timeout,
        env: { ...process.env },
      });
      resolvePromise({ success: true, file: basename(inputFile) });
    } catch (e) {
      const stderr = e.stderr?.toString()?.slice(0, 100) || e.message;
      resolvePromise({
        success: false,
        file: basename(inputFile),
        error: stderr,
      });
    }
  });
}

async function runBatch(files, opts) {
  const results = [];
  let completed = 0;
  const total = files.length;

  // Process in chunks of --workers size
  for (let i = 0; i < files.length; i += opts.workers) {
    const chunk = files.slice(i, i + opts.workers);
    const promises = chunk.map((inputFile) => {
      const outputFile = getOutputPath(
        inputFile,
        resolve(opts.inputDir),
        resolve(opts.outputDir),
        opts.format
      );
      mkdirSync(dirname(outputFile), { recursive: true });
      return renderFile(inputFile, outputFile, opts.format, opts.theme, opts.timeout);
    });

    const chunkResults = await Promise.all(promises);
    for (const result of chunkResults) {
      completed++;
      const icon = result.success ? "✓" : "✗";
      console.log(`  ${icon} [${completed}/${total}] ${result.file}${result.error ? ` — ${result.error}` : ""}`);
      results.push(result);
    }
  }

  return results;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (!opts.inputDir || !opts.outputDir) {
    console.error("Error: --input-dir and --output-dir are required");
    console.error('Run with --help for usage info.');
    process.exit(1);
  }

  if (!existsSync(opts.inputDir)) {
    console.error(`Error: Input directory not found: ${opts.inputDir}`);
    process.exit(1);
  }

  mkdirSync(opts.outputDir, { recursive: true });

  const files = findMmdFiles(resolve(opts.inputDir), opts.recursive);

  if (files.length === 0) {
    console.log("No .mmd or .mermaid files found in input directory.");
    process.exit(0);
  }

  console.log(`\n=== Mermaid Studio — Batch Render ===`);
  console.log(`Input:   ${resolve(opts.inputDir)}`);
  console.log(`Output:  ${resolve(opts.outputDir)}`);
  console.log(`Format:  ${opts.format}`);
  console.log(`Theme:   ${opts.theme}`);
  console.log(`Workers: ${opts.workers}`);
  console.log(`Files:   ${files.length}`);
  console.log(`${"─".repeat(40)}`);

  const startTime = Date.now();
  const results = await runBatch(files, opts);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`${"─".repeat(40)}`);
  console.log(`\nCompleted in ${elapsed}s`);
  console.log(`  ✓ ${succeeded} succeeded`);
  if (failed > 0) {
    console.log(`  ✗ ${failed} failed`);
  }
  console.log(`  Total: ${results.length}/${files.length}`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(`Fatal error: ${e.message}`);
  process.exit(2);
});
