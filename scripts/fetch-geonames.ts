// Pulls raw geo data from GeoNames and writes three JSON files:
//   data/countries.json                    -> country list (ISO alpha-2 + metadata)
//   data/level1-administrative-codes.json  -> level-1 divisions, keyed by country
//   data/level2-administrative-codes.json  -> level-2 divisions, keyed by country
//
// Each division carries the official ISO 3166-2 code where one exists (resolved
// via a single Wikidata SPARQL query that maps GeoNames IDs to P300 codes).
//
// Localized label fetching (alternateNames ZIPs, Wikidata division-type queries)
// is intentionally omitted — the project relies on hand-curated
// administrative-local-names for that data.
//
// Run with: bun run fetch-geonames
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '../data');

const BASE = 'https://download.geonames.org/export/dump';
const WIKIDATA_SPARQL = 'https://query.wikidata.org/sparql';
const USER_AGENT = 'country-data-ts-fetch-geonames/1.0 (data refresh)';

// Defunct ISO 3166-1 alpha-2 codes still present in some GeoNames data.
const DEFUNCT_COUNTRY_CODES = new Set(['AN', 'CS']);

// ---------------------------------------------------------------------------
// GeoNames TSV helpers
// ---------------------------------------------------------------------------

// GeoNames files are tab-separated. countryInfo.txt has leading comment lines
// starting with "#"; the admin code files do not.
async function fetchTsv(file: string): Promise<string[][]> {
  const res = await fetch(`${BASE}/${file}`);
  if (!res.ok) throw new Error(`failed to fetch ${file}: ${res.status} ${res.statusText}`);
  const text = await res.text();
  return text
    .split('\n')
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => line.split('\t'));
}

// ---------------------------------------------------------------------------
// Wikidata SPARQL helper (used only for officialCode lookup — not for labels)
// ---------------------------------------------------------------------------

const wait = async (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

const sparqlHeaders = {
  Accept: 'text/tab-separated-values',
  'User-Agent': USER_AGENT,
};

const LANGUAGE_TAG_REGEX = /@[\w-]+$/;
const QUOTE_REGEX = /^"|"$/g;

// Run a SPARQL query against WDQS, returning data rows (TSV, header dropped).
// WDQS is flaky under load (502s / timeouts), so retry with exponential backoff.
async function sparql(query: string): Promise<string[][]> {
  const url = `${WIKIDATA_SPARQL}?query=${encodeURIComponent(query)}`;
  for (let attempt = 1; ; attempt += 1)
    try {
      // biome-ignore lint/performance/noAwaitInLoops: retry loop
      const res = await fetch(url, { headers: sparqlHeaders });
      const text = await res.text();
      if (!res.ok || text.startsWith('<')) throw new Error(`status ${res.status}`);
      return text
        .split('\n')
        .slice(1)
        .filter((line) => line.length > 0)
        .map((line) => line.split('\t').map((v) => v.replace(LANGUAGE_TAG_REGEX, '').replace(QUOTE_REGEX, '')));
    } catch (err) {
      if (attempt >= 3) throw err;
      await wait(500 * 2 ** attempt);
    }
}

// One Wikidata query maps every GeoNames ID that has an ISO 3166-2 code:
//   P1566 = GeoNames ID, P300 = ISO 3166-2 code.
async function fetchOfficialCodes(): Promise<Map<string, string>> {
  const rows = await sparql('SELECT ?gnid ?iso WHERE { ?item wdt:P300 ?iso ; wdt:P1566 ?gnid . }');
  const map = new Map<string, string>();
  for (const [gnid, iso] of rows) {
    if (gnid && iso) map.set(gnid, iso);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Country = {
  code: string;
  iso3: string;
  name: string;
  continent: string;
  currencyCode: string;
  currencyName: string;
  postalCodeRegex: string | null;
  languages: string[];
};

type AdministrativeDivision = {
  code: string;
  name: string;
  officialCode: string | null;
};

type Level2AdministrativeDivision = AdministrativeDivision & {
  level1AdminCode: string;
};

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

function sortKeys<T>(obj: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
}

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

// countryInfo.txt columns:
// 0 ISO  1 ISO3  2 ISO-Numeric  3 fips  4 Country  5 Capital  6 Area
// 7 Population  8 Continent  9 tld  10 CurrencyCode  11 CurrencyName
// 12 Phone  13 Postal Code Format  14 Postal Code Regex  15 Languages
// 16 geonameid  17 neighbours  18 EquivalentFipsCode
function parseCountries(rows: string[][]): Country[] {
  return (
    rows
      .map((c) => ({
        code: c[0] ?? '',
        iso3: c[1] ?? '',
        name: c[4] ?? '',
        continent: c[8] ?? '',
        currencyCode: c[10] ?? '',
        currencyName: c[11] ?? '',
        postalCodeRegex: c[14] ? c[14] : null,
        languages: c[15] ? c[15].split(',') : [],
      }))
      .filter((c) => c.code.length === 2)
      // Drop defunct ISO 3166-1 codes: AN (Netherlands Antilles), CS (Serbia and Montenegro).
      .filter((c) => !DEFUNCT_COUNTRY_CODES.has(c.code))
      .sort((a, b) => a.code.localeCompare(b.code))
  );
}

// admin1CodesASCII.txt columns: "CC.A1" \t name \t asciiName \t geonameid
// Codes are country-prefixed in the output (e.g. "US-NY").
// officialCode comes from the Wikidata GeoNames-ID → P300 join.
function buildLevel1Divisions(rows: string[][], officialCodes: Map<string, string>): Record<string, AdministrativeDivision[]> {
  const result: Record<string, AdministrativeDivision[]> = {};
  for (const [fullCode, name, , geonameId] of rows) {
    if (fullCode && geonameId) {
      const [country, code] = fullCode.split('.');
      if (country && code) {
        result[country] ??= [];
        result[country].push({
          code: `${country}-${code}`,
          name: name ?? '',
          officialCode: officialCodes.get(geonameId) ?? null,
        });
      }
    }
  }
  return result;
}

// admin2Codes.txt columns: "CC.A1.A2" \t name \t asciiName \t geonameid
function buildLevel2Divisions(
  rows: string[][],
  officialCodes: Map<string, string>,
): Record<string, Level2AdministrativeDivision[]> {
  const result: Record<string, Level2AdministrativeDivision[]> = {};
  for (const [fullCode, name, , geonameId] of rows) {
    if (fullCode && geonameId) {
      const [country, level1AdminCode, code] = fullCode.split('.');
      if (country && level1AdminCode && code) {
        result[country] ??= [];
        result[country].push({
          level1AdminCode: `${country}-${level1AdminCode}`,
          code: `${country}-${code}`,
          name: name ?? '',
          officialCode: officialCodes.get(geonameId) ?? null,
        });
      }
    }
  }
  return result;
}

// Sort each country's division list alphabetically by name, then sort the country keys.
function sortDivisionsByName<T extends { name: string }>(record: Record<string, T[]>): Record<string, T[]> {
  return sortKeys(
    Object.fromEntries(Object.entries(record).map(([k, list]) => [k, [...list].sort((a, b) => a.name.localeCompare(b.name))])),
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('fetching GeoNames TSV files and Wikidata official codes…');
  const [countryRows, level1AdminRows, level2AdminCodeRows, officialCodes] = await Promise.all([
    fetchTsv('countryInfo.txt'),
    fetchTsv('admin1CodesASCII.txt'),
    fetchTsv('admin2Codes.txt'),
    fetchOfficialCodes(),
  ]);
  console.log(`wikidata: ${officialCodes.size} ISO 3166-2 codes fetched`);

  const countries = parseCountries(countryRows);
  const level1Out = sortDivisionsByName(buildLevel1Divisions(level1AdminRows, officialCodes));
  const level2Out = sortDivisionsByName(buildLevel2Divisions(level2AdminCodeRows, officialCodes));

  const outFiles = [
    resolve(outDir, 'countries.json'),
    resolve(outDir, 'level1-administrative-codes.json'),
    resolve(outDir, 'level2-administrative-codes.json'),
  ] as const;

  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(outFiles[0], `${JSON.stringify(countries, null, '\t')}\n`),
    writeFile(outFiles[1], `${JSON.stringify(sortKeys(level1Out), null, '\t')}\n`),
    writeFile(outFiles[2], `${JSON.stringify(sortKeys(level2Out), null, '\t')}\n`),
  ]);

  const l1Total = Object.values(level1Out).reduce((n, l) => n + l.length, 0);
  const l2Total = Object.values(level2Out).reduce((n, l) => n + l.length, 0);
  console.log(`countries.json: ${countries.length} countries`);
  console.log(`level1-administrative-codes.json: ${l1Total} divisions across ${Object.keys(level1Out).length} countries`);
  console.log(`level2-administrative-codes.json: ${l2Total} divisions across ${Object.keys(level2Out).length} countries`);
  console.log('done. Re-run gen:level1 + gen:level2 + gen:countries to regenerate the TypeScript source files.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
