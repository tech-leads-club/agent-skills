#!/usr/bin/env node

/**
 * mermaid-studio/scripts/render.mjs
 *
 * Dual-engine Mermaid renderer with automatic fallback and icon pack support.
 * Primary: @mermaid-js/mermaid-cli (mmdc) — supports all diagram types, PNG/SVG/PDF
 * Fallback: beautiful-mermaid — better themes, SVG output
 * Icon mode: Puppeteer-based custom renderer — registers icon packs for architecture-beta
 *
 * Usage:
 *   node render.mjs --input diagram.mmd --output diagram.svg [--format svg|png|pdf] [--theme default] [--width 1200] [--config '{}']
 *   node render.mjs --input diagram.mmd --output diagram.svg --icons logos,fa
 *   echo "graph LR; A-->B" | node render.mjs --stdin --output out.svg
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, extname, resolve } from "path";
import { createInterface } from "readline";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_DIR = resolve(__dirname, "..");
const DEPS_DIR = process.env.MERMAID_STUDIO_DIR || resolve(SKILL_DIR, ".deps");

// --- Argument parsing ---

function parseArgs(args) {
  const opts = {
    input: null,
    output: null,
    format: "svg",
    theme: "default",
    width: 1200,
    height: null,
    config: null,
    stdin: false,
    engine: "auto", // auto | mmdc | beautiful-mermaid | puppeteer
    background: "white",
    icons: [], // icon pack names to register (e.g., ['logos', 'fa'])
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
      case "--format":
      case "-f":
        opts.format = args[++i];
        break;
      case "--theme":
      case "-t":
        opts.theme = args[++i];
        break;
      case "--width":
      case "-w":
        opts.width = parseInt(args[++i], 10);
        break;
      case "--height":
        opts.height = parseInt(args[++i], 10);
        break;
      case "--config":
      case "-c":
        opts.config = args[++i];
        break;
      case "--stdin":
        opts.stdin = true;
        break;
      case "--engine":
      case "-e":
        opts.engine = args[++i];
        break;
      case "--background":
      case "--bg":
        opts.background = args[++i];
        break;
      case "--icons":
        opts.icons = args[++i].split(",").map((s) => s.trim()).filter(Boolean);
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }

  return opts;
}

function printHelp() {
  console.log(`
Mermaid Studio — Render Script

Usage:
  node render.mjs --input <file.mmd> --output <file.svg> [options]
  echo "graph LR; A-->B" | node render.mjs --stdin --output out.svg

Options:
  --input, -i     Input .mmd file path
  --output, -o    Output file path (required)
  --format, -f    Output format: svg (default), png, pdf
  --theme, -t     Theme name (see SKILL.md for available themes)
  --width, -w     Width in pixels for PNG (default: 1200)
  --height        Height in pixels for PNG (auto-calculated if omitted)
  --config, -c    JSON string with mermaid config overrides
  --engine, -e    Force engine: auto (default), mmdc, beautiful-mermaid, puppeteer
  --background    Background color (default: white)
  --icons         Comma-separated Iconify pack names to register (e.g., logos,fa)
                  Use 'logos' for AWS/tech icons, 'fa' for Font Awesome
                  When specified, uses Puppeteer-based renderer for proper icon support
  --stdin         Read diagram from stdin
  --help, -h      Show this help
`);
}

// --- Icon pack CDN URLs ---

const ICON_PACK_URLS = {
  logos: "https://unpkg.com/@iconify-json/logos/icons.json",
  fa: "https://unpkg.com/@iconify-json/fa6-regular/icons.json",
  "fa-solid": "https://unpkg.com/@iconify-json/fa6-solid/icons.json",
  "fa-brands": "https://unpkg.com/@iconify-json/fa6-brands/icons.json",
  mdi: "https://unpkg.com/@iconify-json/mdi/icons.json",
  "simple-icons": "https://unpkg.com/@iconify-json/simple-icons/icons.json",
};

// --- Engine detection ---

function shellQuote(p) {
  // Wrap path in single quotes and escape any internal single quotes
  return `'${p.replace(/'/g, "'\\''")}' `;
}

function isMmdcAvailable() {
  try {
    const mmdcPaths = [
      resolve(DEPS_DIR, "node_modules/.bin/mmdc"),
      "mmdc",
    ];
    for (const p of mmdcPaths) {
      try {
        execSync(`${shellQuote(p)} --version`, { stdio: "pipe", timeout: 10000 });
        return p;
      } catch {
        continue;
      }
    }
    // Try npx
    execSync("npx mmdc --version", { stdio: "pipe", timeout: 15000 });
    return "npx mmdc";
  } catch {
    return null;
  }
}

function isBeautifulMermaidAvailable() {
  const paths = [
    resolve(DEPS_DIR, "node_modules/beautiful-mermaid"),
    resolve(process.cwd(), "node_modules/beautiful-mermaid"),
  ];
  for (const p of paths) {
    if (existsSync(p)) return p;
  }
  return null;
}

function isPuppeteerAvailable() {
  const paths = [
    resolve(DEPS_DIR, "node_modules/puppeteer"),
    resolve(DEPS_DIR, "node_modules/puppeteer-core"),
  ];
  for (const p of paths) {
    if (existsSync(p)) return p;
  }
  return null;
}

// --- beautiful-mermaid themes ---

const BEAUTIFUL_MERMAID_THEMES = new Set([
  "zinc-light",
  "zinc-dark",
  "tokyo-night",
  "tokyo-night-storm",
  "tokyo-night-light",
  "catppuccin-mocha",
  "catppuccin-latte",
  "nord",
  "nord-light",
  "dracula",
  "github-dark",
  "github-light",
  "solarized-dark",
  "solarized-light",
  "one-dark",
]);

const MMDC_THEMES = new Set(["default", "forest", "dark", "neutral", "base"]);

// --- Rendering engines ---

async function renderWithMmdc(mmdcPath, inputFile, outputFile, opts) {
  const puppeteerConfig = resolve(DEPS_DIR, "puppeteer-config.json");
  const configFile = resolve(DEPS_DIR, ".mermaid-render-config.json");

  // Build mermaid config — respect %%{init}%% directives in the input file
  const inputContent = readFileSync(inputFile, "utf-8");
  const hasInitDirective = inputContent.includes("%%{init");
  let mermaidConfig = {};
  if (!hasInitDirective) {
    mermaidConfig.theme = opts.theme;
  }
  if (opts.config) {
    try {
      const userConfig = JSON.parse(opts.config);
      mermaidConfig = { ...mermaidConfig, ...userConfig };
    } catch (e) {
      console.warn(`Warning: Could not parse --config JSON: ${e.message}`);
    }
  }

  writeFileSync(configFile, JSON.stringify(mermaidConfig, null, 2));

  let cmd = `${shellQuote(mmdcPath)} -i ${shellQuote(inputFile)} -o ${shellQuote(outputFile)}`;
  cmd += ` -c ${shellQuote(configFile)}`;
  cmd += ` -b ${shellQuote(opts.background)}`;

  if (opts.format === "png") {
    cmd += ` -w ${opts.width}`;
    if (opts.height) cmd += ` -H ${opts.height}`;
    cmd += ` -s 3`; // 3x scale for crisp PNGs
  }

  if (existsSync(puppeteerConfig)) {
    cmd += ` -p ${shellQuote(puppeteerConfig)}`;
  }

  try {
    execSync(cmd, { stdio: "pipe", timeout: 60000 });
    return true;
  } catch (e) {
    const stderr = e.stderr?.toString() || "";
    console.error(`mmdc failed: ${stderr.slice(0, 200)}`);
    return false;
  }
}

async function renderWithBeautifulMermaid(bmPath, inputFile, outputFile, opts) {
  // Dynamic import of beautiful-mermaid
  try {
    const bm = await import(resolve(bmPath, "index.js")).catch(() =>
      import(resolve(bmPath, "dist/index.js")).catch(() =>
        import(resolve(bmPath, "src/index.js"))
      )
    );

    const mmdContent = readFileSync(inputFile, "utf-8");
    const renderFn = bm.renderMermaid || bm.render || bm.default?.renderMermaid || bm.default?.render;

    if (!renderFn) {
      // If no direct function, try renderMermaidSvg
      const renderSvg = bm.renderMermaidSvg || bm.default?.renderMermaidSvg;
      if (renderSvg) {
        const svg = await renderSvg(mmdContent, { theme: opts.theme });
        writeFileSync(outputFile, svg, "utf-8");
        return true;
      }
      console.error("Could not find render function in beautiful-mermaid");
      return false;
    }

    const result = await renderFn(mmdContent, {
      theme: opts.theme,
      format: opts.format === "png" ? "png" : "svg",
    });

    if (typeof result === "string") {
      writeFileSync(outputFile, result, "utf-8");
    } else if (Buffer.isBuffer(result)) {
      writeFileSync(outputFile, result);
    } else if (result?.svg) {
      writeFileSync(outputFile, result.svg, "utf-8");
    } else if (result?.data) {
      writeFileSync(outputFile, result.data);
    }

    return true;
  } catch (e) {
    console.error(`beautiful-mermaid failed: ${e.message}`);
    return false;
  }
}

async function renderWithPuppeteer(inputFile, outputFile, opts) {
  const puppeteerPath = isPuppeteerAvailable();
  if (!puppeteerPath) {
    console.error("Puppeteer not available for icon-enabled rendering. Run setup.sh first.");
    return false;
  }

  try {
    const { createRequire } = await import("module");
    const require = createRequire(import.meta.url);
    const puppeteer = require(puppeteerPath);
    const mmdContent = readFileSync(inputFile, "utf-8");

    // Build icon pack registration code
    const iconRegistrations = opts.icons
      .filter((name) => ICON_PACK_URLS[name])
      .map(
        (name) =>
          `{ name: '${name}', loader: () => fetch('${ICON_PACK_URLS[name]}').then(r => r.json()) }`
      )
      .join(",\n      ");

    // Build mermaid config
    let mermaidConfig = {};
    if (opts.config) {
      try {
        mermaidConfig = JSON.parse(opts.config);
      } catch (e) {
        console.warn(`Warning: Could not parse --config JSON: ${e.message}`);
      }
    }

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 20px; background: ${opts.background}; font-family: 'trebuchet ms', 'verdana', 'arial', sans-serif; }
    #container { display: inline-block; }
    svg { max-width: none !important; }
    .error { color: red; font-family: monospace; }
  </style>
</head>
<body>
  <div id="container"></div>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

    mermaid.initialize({
      startOnLoad: false,
      theme: '${mermaidConfig.theme || opts.theme || "default"}',
      ${mermaidConfig.themeVariables ? `themeVariables: ${JSON.stringify(mermaidConfig.themeVariables)},` : ""}
      securityLevel: 'loose',
      logLevel: 'error',
    });

    ${opts.icons.length > 0
        ? `mermaid.registerIconPacks([
      ${iconRegistrations}
    ]);`
        : ""
      }

    try {
      // Small delay to ensure icon packs are loaded
      await new Promise(resolve => setTimeout(resolve, 500));

      const { svg } = await mermaid.render('mermaid-diagram', ${JSON.stringify(mmdContent)});
      document.getElementById('container').innerHTML = svg;
      window.__mermaidRendered = true;
      window.__mermaidSvg = svg;
    } catch (e) {
      document.getElementById('container').innerHTML = '<pre class="error">' + e.message + '</pre>';
      window.__mermaidRendered = true;
      window.__mermaidError = e.message;
    }
  </script>
</body>
</html>`;

    // Write temp HTML
    const tempHtml = resolve(DEPS_DIR, ".mermaid-icon-render.html");
    mkdirSync(dirname(tempHtml), { recursive: true });
    writeFileSync(tempHtml, htmlContent, "utf-8");

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: opts.width || 1200, height: 800, deviceScaleFactor: 3 });
    await page.goto(`file://${tempHtml}`, { waitUntil: "networkidle0", timeout: 30000 });

    // Wait for render
    await page.waitForFunction("window.__mermaidRendered === true", { timeout: 15000 });

    // Check for errors
    const error = await page.evaluate(() => window.__mermaidError);
    if (error) {
      console.error(`Mermaid render error: ${error}`);
      await browser.close();
      return false;
    }

    if (opts.format === "png") {
      // Screenshot approach for PNG
      await page.screenshot({ path: outputFile, type: "png", fullPage: true, omitBackground: opts.background === "transparent" });
    } else {
      // Extract SVG
      const svg = await page.evaluate(() => window.__mermaidSvg);
      if (svg) {
        writeFileSync(outputFile, svg, "utf-8");
      }
    }

    await browser.close();

    // Clean up temp file
    try {
      const { unlinkSync } = await import("fs");
      unlinkSync(tempHtml);
    } catch {
      // Ignore cleanup errors
    }

    return true;
  } catch (e) {
    console.error(`Puppeteer renderer failed: ${e.message}`);
    return false;
  }
}

// --- Read input ---

async function readFromStdin() {
  return new Promise((resolve) => {
    let data = "";
    const rl = createInterface({ input: process.stdin });
    rl.on("line", (line) => (data += line + "\n"));
    rl.on("close", () => resolve(data.trim()));
  });
}

// --- Auto-detect if diagram needs icon packs ---

function diagramNeedsIcons(content) {
  // Check if the diagram uses external icon references
  const iconPatterns = [
    /logos:\w/,
    /fa:\w/,
    /fa6-\w+:\w/,
    /mdi:\w/,
    /simple-icons:\w/,
    /aws:\w/,
  ];
  return iconPatterns.some((p) => p.test(content));
}

// --- Main ---

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  // Validate args
  if (!opts.output) {
    console.error("Error: --output is required");
    process.exit(1);
  }

  // Determine format from output extension if not explicitly set
  if (!process.argv.includes("--format") && !process.argv.includes("-f")) {
    const ext = extname(opts.output).toLowerCase();
    if (ext === ".png") opts.format = "png";
    else if (ext === ".pdf") opts.format = "pdf";
    else opts.format = "svg";
  }

  // Get input content
  let inputFile;
  if (opts.stdin) {
    const content = await readFromStdin();
    inputFile = resolve(DEPS_DIR, ".mermaid-stdin-temp.mmd");
    mkdirSync(dirname(inputFile), { recursive: true });
    writeFileSync(inputFile, content, "utf-8");
  } else if (opts.input) {
    inputFile = resolve(opts.input);
    if (!existsSync(inputFile)) {
      console.error(`Error: Input file not found: ${inputFile}`);
      process.exit(1);
    }
  } else {
    console.error("Error: --input or --stdin is required");
    process.exit(1);
  }

  // Ensure output directory exists
  mkdirSync(dirname(resolve(opts.output)), { recursive: true });
  const outputFile = resolve(opts.output);

  // Auto-detect icon needs
  const mmdContent = readFileSync(inputFile, "utf-8");
  const needsIcons = opts.icons.length > 0 || diagramNeedsIcons(mmdContent);

  if (needsIcons && opts.icons.length === 0) {
    // Auto-detect which icon packs are needed
    if (/logos:\w/.test(mmdContent)) opts.icons.push("logos");
    if (/fa:\w/.test(mmdContent) || /fa6-\w+:\w/.test(mmdContent)) opts.icons.push("fa");
    if (/mdi:\w/.test(mmdContent)) opts.icons.push("mdi");
    console.log(`Auto-detected icon packs needed: ${opts.icons.join(", ")}`);
  }

  // Detect engines
  const mmdcPath = isMmdcAvailable();
  const bmPath = isBeautifulMermaidAvailable();
  const hasPuppeteer = isPuppeteerAvailable();

  console.log(`Input:  ${inputFile}`);
  console.log(`Output: ${outputFile}`);
  console.log(`Format: ${opts.format}`);
  console.log(`Theme:  ${opts.theme}`);
  console.log(`Icons:  ${opts.icons.length > 0 ? opts.icons.join(", ") : "none"}`);
  console.log(`Engines: mmdc=${mmdcPath ? "yes" : "no"}, beautiful-mermaid=${bmPath ? "yes" : "no"}, puppeteer=${hasPuppeteer ? "yes" : "no"}`);

  let success = false;

  // Determine engine order based on theme, format, and icons
  const isBeautifulTheme = BEAUTIFUL_MERMAID_THEMES.has(opts.theme);
  const needsPng = opts.format === "png" || opts.format === "pdf";

  if (needsIcons) {
    // Icon mode: Use Puppeteer-based renderer
    console.log("Using Puppeteer renderer (icon packs required)...");
    success = await renderWithPuppeteer(inputFile, outputFile, opts);
    if (!success && mmdcPath) {
      console.log("Falling back to mmdc (icons may not render)...");
      success = await renderWithMmdc(mmdcPath, inputFile, outputFile, opts);
    }
  } else if (opts.engine === "mmdc") {
    // Forced mmdc
    if (mmdcPath) {
      success = await renderWithMmdc(mmdcPath, inputFile, outputFile, opts);
    } else {
      console.error("Error: mmdc not available. Run setup.sh first.");
    }
  } else if (opts.engine === "beautiful-mermaid") {
    // Forced beautiful-mermaid
    if (bmPath) {
      success = await renderWithBeautifulMermaid(bmPath, inputFile, outputFile, opts);
    } else {
      console.error("Error: beautiful-mermaid not available. Run setup.sh first.");
    }
  } else if (opts.engine === "puppeteer") {
    // Forced Puppeteer
    success = await renderWithPuppeteer(inputFile, outputFile, opts);
  } else {
    // Auto selection
    if (isBeautifulTheme && bmPath && !needsPng) {
      // beautiful-mermaid theme requested, try it first
      console.log("Using beautiful-mermaid (theme match)...");
      success = await renderWithBeautifulMermaid(bmPath, inputFile, outputFile, opts);
      if (!success && mmdcPath) {
        console.log("Falling back to mmdc...");
        const fallbackOpts = { ...opts, theme: "default" };
        success = await renderWithMmdc(mmdcPath, inputFile, outputFile, fallbackOpts);
      }
    } else if (mmdcPath) {
      // Default: mmdc first (best compatibility)
      console.log("Using mmdc (primary)...");
      success = await renderWithMmdc(mmdcPath, inputFile, outputFile, opts);
      if (!success && bmPath && !needsPng) {
        console.log("Falling back to beautiful-mermaid...");
        success = await renderWithBeautifulMermaid(bmPath, inputFile, outputFile, opts);
      }
    } else if (bmPath && !needsPng) {
      // Only beautiful-mermaid available
      console.log("Using beautiful-mermaid (only engine available)...");
      success = await renderWithBeautifulMermaid(bmPath, inputFile, outputFile, opts);
    } else {
      console.error("Error: No rendering engine available. Run setup.sh first.");
      console.error(`  bash ${resolve(__dirname, "setup.sh")}`);
      process.exit(1);
    }
  }

  if (success && existsSync(outputFile)) {
    const stats = readFileSync(outputFile);
    console.log(`\n✓ Rendered successfully: ${outputFile} (${stats.length} bytes)`);
  } else {
    console.error("\n✗ Rendering failed.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(`Fatal error: ${e.message}`);
  process.exit(1);
});
