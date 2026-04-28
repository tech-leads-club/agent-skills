#!/usr/bin/env node

/**
 * mermaid-studio/scripts/render-ascii.mjs
 *
 * Renders Mermaid diagrams as ASCII/Unicode art for terminal display.
 * Uses beautiful-mermaid library for ASCII output.
 *
 * Usage:
 *   node render-ascii.mjs --input diagram.mmd
 *   node render-ascii.mjs --input diagram.mmd --output diagram.txt
 *   echo "graph LR; A-->B" | node render-ascii.mjs --stdin
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { createInterface } from "readline";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_DIR = resolve(__dirname, "..");
const DEPS_DIR = process.env.MERMAID_STUDIO_DIR || resolve(SKILL_DIR, ".deps");

function parseArgs(args) {
  const opts = {
    input: null,
    output: null, // null = stdout
    stdin: false,
    width: null,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--input":
      case "-i":
        opts.input = args[++i];
        break;
      case "--output":
      case "-o":
        opts.output = args[++i];
        break;
      case "--stdin":
        opts.stdin = true;
        break;
      case "--width":
      case "-w":
        opts.width = parseInt(args[++i], 10);
        break;
      case "--help":
      case "-h":
        console.log(`
Mermaid Studio — ASCII Renderer

Usage:
  node render-ascii.mjs --input <file.mmd> [--output <file.txt>]
  echo "graph LR; A-->B" | node render-ascii.mjs --stdin

Options:
  --input, -i     Input .mmd file path
  --output, -o    Output file (default: print to stdout)
  --stdin         Read diagram from stdin
  --width, -w     Max width in characters
  --help, -h      Show this help
`);
        process.exit(0);
    }
  }

  return opts;
}

async function readFromStdin() {
  return new Promise((resolve) => {
    let data = "";
    const rl = createInterface({ input: process.stdin });
    rl.on("line", (line) => (data += line + "\n"));
    rl.on("close", () => resolve(data.trim()));
  });
}

function findBeautifulMermaid() {
  const paths = [
    resolve(DEPS_DIR, "node_modules/beautiful-mermaid"),
    resolve(process.cwd(), "node_modules/beautiful-mermaid"),
  ];
  for (const p of paths) {
    if (existsSync(p)) return p;
  }
  return null;
}

async function renderAscii(mmdContent, bmPath, opts) {
  try {
    const bm = await import(resolve(bmPath, "index.js")).catch(() =>
      import(resolve(bmPath, "dist/index.js")).catch(() =>
        import(resolve(bmPath, "src/index.js"))
      )
    );

    // Try various function names the library might expose
    const renderFn =
      bm.renderMermaidAscii ||
      bm.renderAscii ||
      bm.default?.renderMermaidAscii ||
      bm.default?.renderAscii;

    if (renderFn) {
      const asciiOpts = {};
      if (opts.width) asciiOpts.maxWidth = opts.width;

      const result = await renderFn(mmdContent, asciiOpts);
      return typeof result === "string" ? result : result?.ascii || result?.text || String(result);
    }

    // If no dedicated ASCII function, try the general render with ascii format
    const generalRender =
      bm.renderMermaid ||
      bm.render ||
      bm.default?.renderMermaid ||
      bm.default?.render;

    if (generalRender) {
      const renderOpts = { format: "ascii" };
      if (opts.width) renderOpts.maxWidth = opts.width;

      const result = await generalRender(mmdContent, renderOpts);
      if (typeof result === "string") return result;
      if (result?.ascii) return result.ascii;
      if (result?.text) return result.text;
      return String(result);
    }

    throw new Error("No suitable render function found in beautiful-mermaid");
  } catch (e) {
    throw new Error(`beautiful-mermaid ASCII rendering failed: ${e.message}`);
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  // Get input
  let mmdContent;
  if (opts.stdin) {
    mmdContent = await readFromStdin();
  } else if (opts.input) {
    const inputFile = resolve(opts.input);
    if (!existsSync(inputFile)) {
      console.error(`Error: Input file not found: ${inputFile}`);
      process.exit(1);
    }
    mmdContent = readFileSync(inputFile, "utf-8");
  } else {
    console.error("Error: --input or --stdin is required");
    process.exit(1);
  }

  if (!mmdContent.trim()) {
    console.error("Error: Empty input");
    process.exit(1);
  }

  // Find engine
  const bmPath = findBeautifulMermaid();
  if (!bmPath) {
    console.error("Error: beautiful-mermaid not found.");
    console.error(`Run: bash ${resolve(__dirname, "setup.sh")}`);
    process.exit(1);
  }

  try {
    const ascii = await renderAscii(mmdContent, bmPath, opts);

    if (opts.output) {
      mkdirSync(dirname(resolve(opts.output)), { recursive: true });
      writeFileSync(resolve(opts.output), ascii, "utf-8");
      console.error(`✓ ASCII output saved to: ${resolve(opts.output)}`);
    } else {
      // Print to stdout
      console.log(ascii);
    }
  } catch (e) {
    console.error(`Error: ${e.message}`);
    console.error("");
    console.error("Tip: ASCII rendering requires beautiful-mermaid.");
    console.error("Supported diagram types: flowchart, sequence, state, class, ER.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(`Fatal error: ${e.message}`);
  process.exit(1);
});
