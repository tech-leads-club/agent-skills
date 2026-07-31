#!/usr/bin/env node
// invariant: enforces SKILL.md P11–P17 (flat-by-aggregate layout).

import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// invariant: P11/P12 — technical-layer folder names are forbidden as organization.
const FORBIDDEN_DIRS = new Set([
  'core', 'http', 'rest', 'graphql', 'controller', 'controllers', 'service', 'services',
  'entity', 'entities', 'repository', 'repositories', 'use-case', 'use-cases', 'usecase',
  'usecases', 'dto', 'dtos', 'model', 'models', 'mapper', 'mappers', 'interface',
  'interfaces', 'queue', 'consumer', 'consumers', 'producer', 'producers', 'presentation',
  'application', 'domain', 'infrastructure', 'infra', 'types', 'type', 'persistence',
]);
// invariant: semantic folder names stay allowed (not treated as technical layers).
const ALLOWED_DIRS = new Set([
  'shared', '__test__', 'migration', 'migrations', 'contract', 'contracts', 'enum',
  'enums', 'e2e', 'factory', 'factories', 'fixtures', 'assets', 'test',
]);
const MAX_DEPTH = 3; // module=1, aggregate=2, subdomain/aggregate=3
const CODE_EXT = /\.(ts|tsx|js|mjs|prisma)$/;

const root = resolveRoot(process.argv[2]);
const errors = [];
const warnings = [];

if (!existsSync(root)) {
  console.log(`validate-structure: root '${root}' not found. Pass it explicitly: node scripts/validate-structure.mjs <root>`);
  process.exit(0);
}

for (const mod of listDirs(root)) {
  if (mod === 'shared') continue;
  walk(join(root, mod), root);
}
report();

function resolveRoot(arg) {
  if (arg && existsSync(arg)) return arg;
  for (const candidate of ['libs', 'packages', 'src']) if (existsSync(candidate)) return candidate;
  return '.';
}

function listDirs(p) {
  return readdirSync(p).filter((n) => !n.startsWith('.') && n !== 'node_modules' && statSync(join(p, n)).isDirectory());
}

function walk(dir, rootDir) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || name === 'node_modules') continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      const lower = name.toLowerCase();
      const underShared = full.split(sep).includes('shared');
      if (FORBIDDEN_DIRS.has(lower) && !ALLOWED_DIRS.has(lower) && !(lower === 'persistence' && underShared)) {
        errors.push(`technical-layer folder: ${rel(full, rootDir)}/  (P11/P12 — co-locate by aggregate, use file suffixes)`);
      }
      if (!ALLOWED_DIRS.has(lower) && lower !== 'persistence') {
        const entries = readdirSync(full).filter((n) => !n.startsWith('.'));
        const files = entries.filter((n) => statSync(join(full, n)).isFile());
        if (entries.length === 1 && files.length === 1) {
          warnings.push(`single-file folder: ${rel(full, rootDir)}/  (P14 — use a suffix instead of a folder)`);
        }
      }
      walk(full, rootDir);
    } else if (st.isFile()) {
      if (name.toLowerCase() === 'readme.md') {
        const segs = rel(full, rootDir).split('/');
        if (segs.length > 2) errors.push(`README inside aggregate: ${rel(full, rootDir)}  (P17 — README only at package root)`);
      }
      if (CODE_EXT.test(name)) {
        const depth = businessDepth(full, rootDir);
        if (depth > MAX_DEPTH) errors.push(`depth ${depth} > ${MAX_DEPTH}: ${rel(full, rootDir)}  (P13 — flatten the layout)`);
      }
    }
  }
}

function businessDepth(file, rootDir) {
  const segs = rel(file, rootDir).split('/');
  segs.pop(); // drop filename
  if (segs.includes('shared')) return 0; // shared is exempt
  return segs.filter((s) => s !== '__test__').length;
}

function rel(p, rootDir) {
  return relative(rootDir, p).split(sep).join('/');
}

function report() {
  for (const w of warnings) console.log(`  WARN  ${w}`);
  for (const e of errors) console.log(`  ERROR ${e}`);
  console.log(`\nvalidate-structure: ${errors.length} error(s), ${warnings.length} warning(s) in '${root}'.`);
  process.exit(errors.length ? 1 : 0);
}
