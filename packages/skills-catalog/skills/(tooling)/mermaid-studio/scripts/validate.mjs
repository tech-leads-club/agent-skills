#!/usr/bin/env node

/**
 * mermaid-studio/scripts/validate.mjs
 *
 * Validates Mermaid diagram syntax before rendering.
 * Uses mermaid library's parser for accurate validation.
 *
 * Usage:
 *   node validate.mjs <file.mmd>
 *   node validate.mjs <file1.mmd> <file2.mmd>
 *   echo "graph LR; A-->B" | node validate.mjs --stdin
 *
 * Exit codes:
 *   0 = valid
 *   1 = invalid syntax
 *   2 = file not found or error
 */

import { existsSync, readFileSync } from "fs";
import { basename, dirname, resolve } from "path";
import { createInterface } from "readline";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_DIR = resolve(__dirname, "..");
const DEPS_DIR = process.env.MERMAID_STUDIO_DIR || resolve(SKILL_DIR, ".deps");

// Known diagram type keywords for basic pre-validation
const DIAGRAM_TYPES = [
  "flowchart",
  "graph",
  "sequenceDiagram",
  "classDiagram",
  "stateDiagram",
  "stateDiagram-v2",
  "erDiagram",
  "gantt",
  "pie",
  "mindmap",
  "timeline",
  "gitGraph",
  "C4Context",
  "C4Container",
  "C4Component",
  "C4Dynamic",
  "C4Deployment",
  "sankey-beta",
  "xychart-beta",
  "quadrantChart",
  "block-beta",
  "architecture-beta",
  "packet-beta",
  "kanban",
  "journey",
  "requirementDiagram",
  "zenuml",
];

async function readFromStdin() {
  return new Promise((resolve) => {
    let data = "";
    const rl = createInterface({ input: process.stdin });
    rl.on("line", (line) => (data += line + "\n"));
    rl.on("close", () => resolve(data.trim()));
  });
}

function stripFrontmatter(content) {
  // Remove YAML frontmatter (---...---)
  const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  if (match) return match[1].trim();
  return content.trim();
}

function stripDirectives(content) {
  // Remove %%{init: ...}%% directives
  return content.replace(/%%\{[\s\S]*?\}%%/g, "").trim();
}

function stripComments(content) {
  // Remove %% single-line comments
  return content
    .split("\n")
    .filter((line) => !line.trim().startsWith("%%"))
    .join("\n")
    .trim();
}

function detectDiagramType(content) {
  const cleaned = stripFrontmatter(stripDirectives(stripComments(content)));
  const firstLine = cleaned.split("\n")[0].trim();

  for (const type of DIAGRAM_TYPES) {
    if (firstLine.startsWith(type)) {
      return type;
    }
  }
  return null;
}

function basicValidation(content, filename) {
  const errors = [];
  const warnings = [];

  // Empty check
  if (!content.trim()) {
    errors.push("File is empty");
    return { errors, warnings };
  }

  // Detect diagram type
  const cleaned = stripFrontmatter(stripDirectives(content));
  const diagramType = detectDiagramType(content);
  if (!diagramType) {
    const firstLine = stripComments(stripFrontmatter(stripDirectives(content)))
      .split("\n")[0]
      .trim();
    errors.push(
      `Unknown diagram type. First content line: "${firstLine.slice(0, 50)}". ` +
      `Expected one of: flowchart, graph, sequenceDiagram, classDiagram, etc.`
    );
  }

  // Bracket matching
  const lines = cleaned.split("\n");
  let braces = 0;
  let brackets = 0;
  let parens = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip comments
    if (line.trim().startsWith("%%")) continue;

    for (const char of line) {
      if (char === "{") braces++;
      if (char === "}") braces--;
      if (char === "[") brackets++;
      if (char === "]") brackets--;
      if (char === "(") parens++;
      if (char === ")") parens--;

      if (braces < 0)
        errors.push(`Unmatched '}' at line ${i + 1}`);
      if (brackets < 0)
        errors.push(`Unmatched ']' at line ${i + 1}`);
      if (parens < 0)
        errors.push(`Unmatched ')' at line ${i + 1}`);
    }
  }

  if (braces > 0) errors.push(`Unclosed '{' — missing ${braces} closing brace(s)`);
  if (brackets > 0) errors.push(`Unclosed '[' — missing ${brackets} closing bracket(s)`);
  if (parens > 0) errors.push(`Unclosed '(' — missing ${parens} closing paren(s)`);

  // Common reserved words used as bare node IDs
  const reservedWords = [
    "end",
    "graph",
    "subgraph",
    "style",
    "class",
    "click",
    "linkStyle",
    "default",
  ];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith("%%")) continue;

    for (const word of reservedWords) {
      // Check if reserved word is used as a bare node ID (without brackets)
      const pattern = new RegExp(
        `(?:^|-->|---|-\\.->|==>|\\s)${word}(?:\\s|-->|---|-\\.->|==>|$)`,
        "i"
      );
      if (pattern.test(trimmed) && !trimmed.includes(`${word}[`) && !trimmed.includes(`${word}(`)) {
        warnings.push(
          `Line ${i + 1}: "${word}" is a reserved keyword. Use "${word}Node" or "${word}State" instead.`
        );
      }
    }
  }

  // Check for common syntax mistakes
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith("%%")) continue;

    // Unescaped special characters in labels
    if (trimmed.includes('[') && trimmed.includes(']')) {
      const labelMatch = trimmed.match(/\[([^\]]*)\]/g);
      if (labelMatch) {
        for (const label of labelMatch) {
          if (label.includes('"') && !label.startsWith('["')) {
            warnings.push(
              `Line ${i + 1}: Unquoted label with double quotes. Wrap in ["..."]: ${label.slice(0, 30)}`
            );
          }
        }
      }
    }
  }

  // Node count warning
  const nodePattern = /\b\w+[\[({]/g;
  const nodeMatches = cleaned.match(nodePattern) || [];
  if (nodeMatches.length > 25) {
    warnings.push(
      `High node count (~${nodeMatches.length}). Consider splitting into multiple diagrams for readability.`
    );
  }

  return { errors, warnings };
}

async function mermaidParserValidation(content) {
  // Try to use the mermaid library parser for deep validation
  try {
    const mermaidPath = resolve(DEPS_DIR, "node_modules/mermaid");
    if (!existsSync(mermaidPath)) {
      return { available: false };
    }

    const mermaid = await import(resolve(mermaidPath, "dist/mermaid.js")).catch(
      () => import(resolve(mermaidPath, "dist/mermaid.esm.mjs")).catch(
        () => null
      )
    );

    if (!mermaid) return { available: false };

    const m = mermaid.default || mermaid;
    if (m.parse) {
      await m.parse(stripFrontmatter(stripDirectives(content)));
      return { available: true, valid: true };
    }

    return { available: false };
  } catch (e) {
    return {
      available: true,
      valid: false,
      error: e.message || String(e),
    };
  }
}

function printResult(filename, basicResult, parserResult) {
  const hasErrors = basicResult.errors.length > 0 || (parserResult?.available && !parserResult?.valid);
  const hasWarnings = basicResult.warnings.length > 0;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`File: ${filename}`);
  console.log(`${"=".repeat(60)}`);

  if (basicResult.errors.length > 0) {
    console.log("\n❌ ERRORS:");
    for (const err of basicResult.errors) {
      console.log(`  • ${err}`);
    }
  }

  if (parserResult?.available && !parserResult?.valid) {
    console.log("\n❌ PARSER ERROR:");
    console.log(`  • ${parserResult.error}`);
  }

  if (hasWarnings) {
    console.log("\n⚠️  WARNINGS:");
    for (const warn of basicResult.warnings) {
      console.log(`  • ${warn}`);
    }
  }

  if (!hasErrors) {
    const diagramType = detectDiagramType(
      readFileSync ? "" : ""
    );
    console.log(`\n✅ Valid${parserResult?.available ? " (parser verified)" : " (basic checks only)"}`);
    if (hasWarnings) {
      console.log("   (warnings above are non-blocking suggestions)");
    }
  }

  return !hasErrors;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`
Mermaid Studio — Syntax Validator

Usage:
  node validate.mjs <file.mmd> [<file2.mmd> ...]
  echo "graph LR; A-->B" | node validate.mjs --stdin

Exit codes:
  0 = all files valid
  1 = syntax errors found
  2 = file not found or runtime error
`);
    process.exit(0);
  }

  let allValid = true;

  if (args.includes("--stdin")) {
    const content = await readFromStdin();
    const basicResult = basicValidation(content, "stdin");
    const parserResult = await mermaidParserValidation(content);
    if (!printResult("stdin", basicResult, parserResult)) {
      allValid = false;
    }
  } else {
    for (const arg of args) {
      if (arg.startsWith("--")) continue;

      const filepath = resolve(arg);
      if (!existsSync(filepath)) {
        console.error(`Error: File not found: ${filepath}`);
        allValid = false;
        continue;
      }

      const content = readFileSync(filepath, "utf-8");
      const basicResult = basicValidation(content, filepath);
      const parserResult = await mermaidParserValidation(content);
      if (!printResult(basename(filepath), basicResult, parserResult)) {
        allValid = false;
      }
    }
  }

  process.exit(allValid ? 0 : 1);
}

main().catch((e) => {
  console.error(`Fatal error: ${e.message}`);
  process.exit(2);
});
