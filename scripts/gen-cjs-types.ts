/**
 * TypeScript 7 ships only a version stub as its JS API, so tsup's `dts` step
 * (rollup-plugin-dts) cannot run against it. We emit declarations with the
 * bundled compatibility compiler instead (`tsc --emitDeclarationOnly`).
 *
 * Two layout differences vs tsup's `dts` output are reconciled here:
 *  1. tsc emits one `.d.ts` per source file (data modules land in dist/data/),
 *     while the exports map points at per-entry declaration files in dist/.
 *     Entry declarations that tsc emitted under dist/data/ are hoisted to the
 *     root next to their JS bundle.
 *  2. ESM-flavoured `.d.ts` files are duplicated as `.d.cts` so the `require`
 *     conditions in the exports map resolve to CJS-flavoured declarations.
 *     The API surface is identical in both module systems.
 */
import { cpSync, existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dir, '..');
const dist = join(root, 'dist');

/** Copy every `.d.ts` under `dist` to a sibling `.d.cts`. */
function duplicateAsCts(dir: string): number {
  let copied = 0;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      copied += duplicateAsCts(full);
      continue;
    }
    if (!entry.endsWith('.d.ts')) continue;
    cpSync(full, full.replace(/\.d\.ts$/, '.d.cts'));
    copied += 1;
  }
  return copied;
}

/** Hoist entry declarations referenced by package.json exports to dist/ root. */
function hoistEntryDeclarations(): number {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const exportsMap = pkg.exports as Record<string, { import?: { types?: string } }>;
  let hoisted = 0;
  for (const target of Object.values(exportsMap)) {
    const typesPath = target?.import?.types;
    if (!typesPath || !typesPath.startsWith('./dist/')) continue;
    const targetAbs = join(root, typesPath);
    if (existsSync(targetAbs)) continue;
    const fileName = typesPath.split('/').pop();
    if (!fileName) continue;
    const source = join(dist, 'data', fileName);
    if (!existsSync(source)) continue;
    cpSync(source, targetAbs);
    // Also hoist the CJS-flavoured duplicate for the require condition.
    const ctsTarget = targetAbs.replace(/\.d\.ts$/, '.d.cts');
    if (!existsSync(ctsTarget)) cpSync(source.replace(/\.d\.ts$/, '.d.cts'), ctsTarget);
    hoisted += 1;
    console.log(`gen-cjs-types: hoisted ${fileName} → ${typesPath}`);
  }
  return hoisted;
}

const ctsCopies = duplicateAsCts(dist);
const hoisted = hoistEntryDeclarations();
console.log(`gen-cjs-types: copied ${ctsCopies} .d.ts → .d.cts, hoisted ${hoisted} entry declarations`);
