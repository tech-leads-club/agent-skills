#!/usr/bin/env node
// invariant: enforces SKILL.md P1/P3/P8 (module boundaries, entity uniqueness/prefix).
// hazard: alias imports (@scope/...) are not resolved — project path mapping is unknown here.

import { readdirSync, statSync, existsSync, readFileSync } from 'node:fs';
import { join, relative, sep, dirname, resolve } from 'node:path';

const root = resolveRoot(process.argv[2]);
const errors = [];
const warnings = [];
const entityNames = new Map(); // name -> [{ file, mod }]

if (!existsSync(root)) {
  console.log(`validate-boundaries: root '${root}' not found. Pass it explicitly: node scripts/validate-boundaries.mjs <root>`);
  process.exit(0);
}

for (const mod of listDirs(root)) {
  if (mod === 'shared') continue;
  walk(join(root, mod), mod);
}
checkDuplicateEntities();
report();

function resolveRoot(arg) {
  if (arg && existsSync(arg)) return arg;
  for (const candidate of ['libs', 'packages', 'src']) if (existsSync(candidate)) return candidate;
  return '.';
}

function listDirs(p) {
  return readdirSync(p).filter((n) => !n.startsWith('.') && n !== 'node_modules' && statSync(join(p, n)).isDirectory());
}

function walk(dir, mod) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || name === 'node_modules') continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, mod);
      continue;
    }
    if (/\.(ts|tsx)$/.test(name) && !name.endsWith('.d.ts')) {
      const src = readFileSync(full, 'utf8');
      checkImports(full, src, mod);
      if (name.endsWith('.entity.ts')) collect(/export\s+(?:abstract\s+)?class\s+([A-Za-z0-9_]+)/g, src, full, mod);
    } else if (name.endsWith('.prisma')) {
      collect(/^\s*model\s+([A-Za-z0-9_]+)\s*\{/gm, readFileSync(full, 'utf8'), full, mod);
    }
  }
}

function checkImports(file, src, mod) {
  const re = /from\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(src))) {
    const spec = m[1];
    if (!spec.startsWith('.')) continue; // only relative climbs are reliably resolvable without config
    const target = resolve(dirname(file), spec);
    const parts = relative(root, target).split(sep);
    const sibling = parts[0];
    if (sibling && sibling !== mod && sibling !== 'shared' && sibling !== '..' && sibling !== '') {
      const intoBarrel = /(^|\/)index(\.(ts|tsx))?$/.test(spec) || parts.length <= 1;
      if (!intoBarrel) warnings.push(`cross-module deep import: ${rel(file)} -> ${spec}  (P1/P3 — import the sibling's barrel/facade only)`);
    }
  }
}

function collect(re, src, file, mod) {
  let m;
  while ((m = re.exec(src))) add(m[1], file, mod);
}

function add(name, file, mod) {
  if (!entityNames.has(name)) entityNames.set(name, []);
  entityNames.get(name).push({ file, mod });
  const compact = mod.replace(/[-_]/g, '').toLowerCase();
  const pascal = mod.split(/[-_]/).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  if (!name.toLowerCase().startsWith(compact) && !name.startsWith(pascal)) {
    warnings.push(`entity '${name}' lacks module prefix '${pascal}': ${rel(file)}  (P8 naming)`);
  }
}

function checkDuplicateEntities() {
  for (const [name, list] of entityNames) {
    const mods = new Set(list.map((x) => x.mod));
    if (mods.size > 1) errors.push(`duplicate entity name '${name}' across modules [${[...mods].join(', ')}]  (P8 — prefix with module name)`);
  }
}

function rel(p) {
  return relative(root, p).split(sep).join('/');
}

function report() {
  for (const w of warnings) console.log(`  WARN  ${w}`);
  for (const e of errors) console.log(`  ERROR ${e}`);
  console.log(`\nvalidate-boundaries: ${errors.length} error(s), ${warnings.length} warning(s) in '${root}'.`);
  process.exit(errors.length ? 1 : 0);
}
