// Regenerates the "Country coverage" table in README.md from the project data
// (data/countries.json + COUNTRY_PHONE_DATA + TAX_CONFIG + postal/level-1 metadata).
// Run with:
//
//   bun run gen:coverage
//
// The table lives between the COVERAGE_TABLE_START / COVERAGE_TABLE_END markers
// and is fully owned by this script. Human-entered "Last verified" dates are
// preserved across runs (keyed by row code). When a row's generated data
// differs from what is currently in the table, a ❗ is added next to its code
// to flag that it needs reverification; the ❗ is sticky until a human removes
// it (typically while setting a new "Last verified" date).

import { readFileSync, writeFileSync } from 'node:fs';
import countries from '../data/countries.json';
import { type CountryCode, isCountryCode } from '../src/data/countries';
import { level1Admin_CA, level1Admin_US } from '../src/data/level1-administrative-codes';
import { COUNTRY_PHONE_DATA } from '../src/data/phone-data';
import { POSTAL_CODE_DATA } from '../src/data/postal-codes';
import { getUniqueAreaCode } from '../src/phone';
import { getLocalTaxLabel, getTaxConfig, getTaxLabel, hasRegionalTax, TAX_CONFIG } from '../src/tax';

const README = new URL('../README.md', import.meta.url).pathname;
const START = '<!-- COVERAGE_TABLE_START -->';
const END = '<!-- COVERAGE_TABLE_END -->';

const HEADERS = [
  'Code',
  'Country',
  'Last verified',
  'Calling code',
  'Phone mask',
  'Phone example',
  'Address format',
  'Postal code',
  'Level 1 labels',
  'Level 2 labels',
  'Consumption tax',
  'Nexus minimum',
  'Consumer tax',
] as const;

// Columns that make up a row's data signature (everything a human verifies).
const DATA_COLS = HEADERS.slice(3);

// Fast lookup from alpha-2 code to phone config.
const phoneByCode = new Map(COUNTRY_PHONE_DATA.map((country) => [country.code, country]));

const regionLabel = (countryCode: string, code: string): string => {
  const list = countryCode === 'US' ? level1Admin_US : countryCode === 'CA' ? level1Admin_CA : [];
  return list.find((o) => o.value === code)?.label ?? code;
};

function postalExample(code: string): string {
  return POSTAL_CODE_DATA[code]?.placeholder ?? '?';
}

function taxLabel(code: string, region?: string): string {
  const en = getTaxLabel(code, region);
  const local = getLocalTaxLabel(code, region);

  if (local) {
    if (local === en) return en;
    if (!en) return local;
    return `${en} (${local})`;
  }

  return en ?? '—';
}

function consumerTaxCell(code: string): string {
  const countryTaxConfig = getTaxConfig(code);
  if (!countryTaxConfig?.taxPattern) return '❌';

  const example = countryTaxConfig.taxExample ?? countryTaxConfig.taxPattern.source;
  const label = taxLabel(code);
  return `✅ ${label} (${example})`;
}

// Registration threshold above which a seller must collect consumption tax in
// the country (the "nexus minimum"). collectionThreshold: 0 = always collect on
// nexus; positive = threshold in local currency; null = seller never collects.
function nexusCell(code: string, currencyCode: string | undefined): string {
  const t = getTaxConfig(code)?.collectionThreshold;
  if (t === undefined) return '❌';
  if (t === null) return 'Seller never collects';
  if (t === 0) return 'Always';
  const amount = t.toLocaleString('en-US');
  return currencyCode ? `${currencyCode} ${amount}` : amount;
}

function levelCell(label: { en?: string; local?: string } | null | undefined): string {
  if (!label) return '❌';
  const en = label.en?.trim();
  const local = label.local?.trim();
  if (en && local) return `✅ ${en} / ${local}`;
  if (en) return `❓ ${en} (en only)`;
  if (local) return `❓ ${local} (local only)`;
  return '❓';
}

// Calling code as plain data. For countries pinned by a single area-code prefix
// (e.g. Guernsey +44 (1481), Bahamas +1 (242)), the prefix is shown in
// parentheses. The default country for a shared code (US for +1, GB for +44)
// and multi-prefix countries (CA) show the bare calling code.
function callingCodeCell(code: CountryCode): string {
  const cfg = phoneByCode.get(code);
  if (!cfg) return '❌';
  const area = getUniqueAreaCode(cfg);
  return area ? `${cfg.callingCode} (${area})` : cfg.callingCode;
}

// National-portion of the input mask (calling-code prefix stripped for brevity).
function phoneMaskCell(code: CountryCode): string {
  const cfg = phoneByCode.get(code);
  if (!cfg) return '❌';
  const prefix = `${cfg.callingCode} `;
  const national = cfg.mask.startsWith(prefix) ? cfg.mask.slice(prefix.length) : cfg.mask;
  return `✅ ${national}`;
}

// Formatted example number (national form as shown to the user).
function phoneExampleCell(code: CountryCode): string {
  const cfg = phoneByCode.get(code);
  if (!cfg) return '❌';
  return `✅ ${cfg.example}`;
}

type Row = {
  code: string; // logical key (e.g. "US" or "US-VA"), no ❗
  cells: Record<(typeof HEADERS)[number], string>;
};

/** Build all rows (countries, plus per-region rows for regional-tax countries). */
function buildRows(): Row[] {
  const rows: Row[] = [];
  for (const country of countries) {
    const code: string = country.code;
    if (!isCountryCode(code)) throw new Error(`unexpected country code ${code} in data/countries.json`);

    const entry = TAX_CONFIG[code];

    const addressFmt = '✅';
    const consumerTax = consumerTaxCell(code);
    const postal = country.postalCodeRegex ? `✅ (${postalExample(code)})` : '❌';
    const level1 = levelCell(country.administrativeLabels?.level1);
    const level2 = levelCell(country.administrativeLabels?.level2);

    let tax: string;
    if (!entry) tax = '❓';
    else if (hasRegionalTax(code)) {
      const rates = Object.values(entry)
        .map((r) => r.baseConsumerTax)
        .filter((r): r is number => r !== null);
      const label = taxLabel(code);
      tax = `${Math.min(...rates)}–${Math.max(...rates)}% ${label} (regional) ✅`;
    } else {
      const base = getTaxConfig(code)?.baseConsumerTax;
      const label = taxLabel(code);
      tax = base === null ? 'None ✅' : `${base}% ${label} ✅`;
    }

    rows.push({
      code,
      cells: {
        Code: code,
        Country: country.name,
        'Last verified': '—',
        'Calling code': callingCodeCell(code),
        'Phone mask': phoneMaskCell(code),
        'Phone example': phoneExampleCell(code),
        'Address format': addressFmt,
        'Postal code': postal,
        'Level 1 labels': level1,
        'Level 2 labels': level2,
        'Consumption tax': tax,
        'Nexus minimum': nexusCell(code, country.currencyCode),
        'Consumer tax': consumerTax,
      },
    });

    // Per-region rows for countries whose rate varies by state/province.
    if (entry && hasRegionalTax(code)) {
      for (const [region, cfg] of Object.entries(entry)) {
        const rate = cfg.baseConsumerTax;
        const label = taxLabel(code, region);
        rows.push({
          code: `${code}-${region}`,
          cells: {
            Code: `${code}-${region}`,
            Country: `${country.name} — ${regionLabel(code, region)}`,
            'Last verified': '—',
            'Calling code': '↳',
            'Phone mask': '↳',
            'Phone example': '↳',
            'Address format': '↳',
            'Postal code': '↳',
            'Level 1 labels': '↳',
            'Level 2 labels': '↳',
            'Consumption tax': rate === null ? 'None ✅' : `${rate}% ${label} ✅`,
            'Nexus minimum': '↳',
            'Consumer tax': '↳',
          },
        });
      }
    }
  }
  return rows;
}

const sigOver = (cells: Record<string, string>, cols: readonly string[]) => cols.map((c) => cells[c] ?? '').join('§');

type PrevRow = {
  lastVerified: string;
  signature: string;
  hadBang: boolean;
};

/**
 * Parse the existing managed table so we can preserve dates and detect diffs.
 * Returns the parsed rows plus the subset of DATA_COLS that were present in the
 * previous table — diffs are computed only over those, so adding a brand-new
 * column never spuriously flags every row.
 */
type ParseResult = { map: Map<string, PrevRow>; dataCols: string[] };
function parsePrevious(block: string): ParseResult {
  const map = new Map<string, PrevRow>();
  const lines = block.split('\n').filter((l) => l.trim().startsWith('|'));

  const [headerLine] = lines;
  if (!headerLine || lines.length < 2) return { map, dataCols: [...DATA_COLS] };
  const cols = headerLine
    .split('|')
    .slice(1, -1)
    .map((s) => s.trim());
  const idx = (name: string) => cols.indexOf(name);
  const codeI = idx('Code');
  const dateI = idx('Last verified');
  const dataCols = DATA_COLS.filter((c) => idx(c) >= 0);
  if (codeI < 0) return { map, dataCols };
  for (const line of lines.slice(2)) {
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((s) => s.trim());

    if (cells.length === cols.length) {
      const rawCode = cells[codeI] ?? '';
      const hadBang = rawCode.includes('❗');
      const code = rawCode.replace('❗', '').trim();
      const signature = dataCols.map((c) => cells[idx(c)]).join('§');
      map.set(code, { lastVerified: dateI >= 0 ? (cells[dateI] ?? '—') : '—', signature, hadBang });
    }
  }
  return { map, dataCols };
}

function renderTable(rows: Row[], prev: Map<string, PrevRow>, dataCols: string[], bootstrap: boolean): string {
  const header = `| ${HEADERS.join(' | ')} |`;
  const divider = `| ${HEADERS.map(() => '---').join(' | ')} |`;
  const body = rows.map((r) => {
    const before = prev.get(r.code);
    if (before) r.cells['Last verified'] = before.lastVerified;
    const changed = !before || before.signature !== sigOver(r.cells, dataCols);
    // ❗ is sticky: keep an existing flag, and raise a new one when data changed
    // (but never on the initial bootstrap run — there is nothing to diff against).
    const bang = bootstrap ? false : (before?.hadBang ?? false) || changed;
    const codeCell = bang ? `${r.cells.Code} ❗` : r.cells.Code;
    const ordered = HEADERS.map((h) => (h === 'Code' ? codeCell : r.cells[h]));
    return `| ${ordered.join(' | ')} |`;
  });
  return [header, divider, ...body].join('\n');
}

const NOTE = '> ❗ next to a code means its data changed since it was last verified — the country/region should be reverified.';
const TRAILING_LINE_BREAK_REGEX = /\n+$/;
const VERIFIED_BULLET_REGEX = /^- \*\*Verified\*\* —.*\n/m;
const HEADER_REGEX = /^\| Code \| Country \|.*$/m;

function main() {
  let md = readFileSync(README, 'utf8');
  const rows = buildRows();

  let previousBlock = '';
  let bootstrap = false;
  const startsAt = md.indexOf(START);
  const endsAt = md.indexOf(END);
  if (startsAt >= 0 && endsAt > startsAt) previousBlock = md.slice(startsAt + START.length, endsAt);
  else {
    // Bootstrap: no markers yet. Capture any legacy table (by its header row)
    // to preserve dates, strip it, and drop the obsolete "Verified" bullet.
    bootstrap = true;
    const headerMatch = md.match(HEADER_REGEX);
    if (headerMatch) {
      const headerStart = md.indexOf(headerMatch[0]);
      const tail = md.slice(headerStart);
      const tableLines = tail.split('\n');

      let last = 0;
      while (last < tableLines.length && (tableLines[last] ?? '').trim().startsWith('|')) last += 1;

      previousBlock = tableLines.slice(0, last).join('\n');
      md = md.slice(0, headerStart).replace(VERIFIED_BULLET_REGEX, '') + tableLines.slice(last).join('\n');
    }
    md = md.replace(TRAILING_LINE_BREAK_REGEX, '\n');
  }

  const { map: prev, dataCols } = parsePrevious(previousBlock);
  const table = renderTable(rows, prev, dataCols, bootstrap);
  const block = `${START}\n\n${NOTE}\n\n${table}\n\n${END}`;

  if (startsAt >= 0 && endsAt > startsAt) md = md.slice(0, startsAt) + block + md.slice(endsAt + END.length);
  else md = `${md.replace(TRAILING_LINE_BREAK_REGEX, '\n')}\n${block}\n`;

  writeFileSync(README, md);
  const flagged = rows.filter(
    (r) => prev.get(r.code)?.hadBang || (!bootstrap && prev.get(r.code)?.signature !== sigOver(r.cells, dataCols)),
  );
  console.log(`Wrote ${rows.length} rows${bootstrap ? ' (bootstrap, no flags)' : `, ${flagged.length} flagged ❗`}.`);
}

main();
