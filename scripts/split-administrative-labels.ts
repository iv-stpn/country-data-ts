// One-time migration: split the `administrativeLabels` field out of
// data/countries.json into its own file.
//
//   data/administrative-local-labels.json -> per-country division-type labels,
//                                             keyed by ISO 3166-1 alpha-2 code
//
// GeoNames' fetch step no longer emits administrativeLabels (those labels are
// hand-curated, not derivable from the GeoNames dumps), so the labels live in
// their own file and are re-joined onto the countries at generate time by
// gen-countries.ts / gen-coverage-table.ts.
//
// Countries with no labels at all (both level1 and level2 null) are omitted
// from the labels file; downstream defaults them back to { level1, level2 }.
//
// Idempotent: re-running against an already-split countries.json just rewrites
// the same labels file and leaves countries.json unchanged.
//
// Run with: bun run scripts/split-administrative-labels.ts
import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, '../data');
const countriesFile = resolve(dataDir, 'countries.json');
const labelsFile = resolve(dataDir, 'administrative-local-labels.json');

type DivisionLabel = { en: string | null; local: string | null };
type AdministrativeLabels = { level1: DivisionLabel | null; level2: DivisionLabel | null };
type CountryWithLabels = Record<string, unknown> & {
  code: string;
  administrativeLabels?: AdministrativeLabels;
};

const countries: CountryWithLabels[] = JSON.parse(await readFile(countriesFile, 'utf8'));

const labels: Record<string, AdministrativeLabels> = {};
const stripped = countries.map((country) => {
  const { administrativeLabels, ...rest } = country;
  if (administrativeLabels && (administrativeLabels.level1 || administrativeLabels.level2))
    labels[country.code] = administrativeLabels;
  return rest;
});

// Keep the country order untouched (fetch-geonames sorts by code); sort the
// labels map by code so the file diffs cleanly.
const sortedLabels = Object.fromEntries(Object.entries(labels).sort(([a], [b]) => a.localeCompare(b)));

await Promise.all([
  writeFile(countriesFile, `${JSON.stringify(stripped, null, '\t')}\n`),
  writeFile(labelsFile, `${JSON.stringify(sortedLabels, null, '\t')}\n`),
]);

console.log('formatting JSON with biome…');
spawnSync('bunx', ['biome', 'format', '--write', countriesFile, labelsFile], {
  cwd: resolve(__dirname, '..'),
  stdio: 'inherit',
});

console.log(`administrative-local-labels.json: ${Object.keys(sortedLabels).length} countries with labels`);
console.log(`countries.json: administrativeLabels removed from ${countries.length} countries`);

process.exit(0);
