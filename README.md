# country-data-ts

Zero-dependency, tree-shakeable worldwide **country, address, phone and tax**
reference data for TypeScript.

One dataset, four domains, all keyed by ISO 3166-1 alpha-2 code:

- **countries** — 250 countries with currency, languages, postal-code regex and
  administrative-division labels (English + local), sourced from
  [GeoNames](https://www.geonames.org/) and
  [Wikidata](https://www.wikidata.org/).
- **address** — per-country address-form field configs (field order, labels,
  postal patterns, level-1 division `<select>` option lists).
- **phone** — calling codes, input masks, national-number validation regex, and
  E.164 parsing/formatting helpers with shared-calling-code (NANP `+1`, `+44`,
  `+7`, …) disambiguation.
- **tax** — per-country consumption-tax config (VAT/GST/sales-tax rates, EU OSS
  reverse-charge, US/CA regional rates, registration thresholds), tax-ID
  patterns, and a B2B/B2C outcome calculator.

No runtime dependencies. Ships ESM + CJS with full `.d.ts` types. Every domain
is a separate entry point so bundlers tree-shake away what you don't import.

## Table of contents

- [Install](#install)
- [Entry points](#entry-points)
- [countries](#countries)
- [address](#address)
- [phone](#phone)
- [tax](#tax)
- [divisions](#divisions)
- [Data sources](#data-sources)
  - [Generated from external sources](#generated-from-external-sources)
  - [Hand-maintained data](#hand-maintained-data)
- [Limitations](#limitations)
- [Potential improvements](#potential-improvements)
- [Coverage table](#coverage-table)
- [Development](#development)
- [License](#license)

## Install

```sh
npm install country-data-ts
# or: bun add country-data-ts / pnpm add country-data-ts / yarn add country-data-ts
```

## Entry points

```ts
import { COUNTRY_DATA, isCountryCode } from "country-data-ts/countries";
import { getCountryConfig, resolveAddressField } from "country-data-ts/address";
import { parseCountryFromE164, toE164 } from "country-data-ts/phone";
import { computeTaxOutcome, getTaxConfig } from "country-data-ts/tax";
import { getLevel2Options, getLevel1LocalNames } from "country-data-ts/divisions";

// or the barrel (pulls in all four core domains — divisions is not included,
// as it carries the full world's level-2 division dataset):
import {
  computeTaxOutcome,
  COUNTRY_DATA,
  getCountryConfig,
  toE164,
} from "country-data-ts";
```

`CountryCode` — the ISO 3166-1 alpha-2 union of all 250 countries — is shared
across every domain.

## countries

```ts
import {
  COUNTRY_CODES,
  COUNTRY_DATA,
  type CountryCode,
  isCountryCode,
} from "country-data-ts/countries";

COUNTRY_DATA.FR;
// {
//   code: "FR", iso3: "FRA", name: "France", continent: "EU",
//   currencyCode: "EUR", currencyName: "Euro",
//   postalCodeRegex: "^(\\d{5})$", languages: ["fr", "br", "co", ...],
//   administrativeLabels: {
//     level1: { en: "Region", local: "Région" },
//     level2: { en: "Department", local: "Département" },
//   },
// }

isCountryCode("FR"); // true  (narrows string -> CountryCode)
isCountryCode("ZZ"); // false
COUNTRY_CODES.length; // 250
```

| Export                 | Description                                                        |
| ---------------------- | ------------------------------------------------------------------ |
| `COUNTRY_DATA`         | `Record<CountryCode, CountryData>` — the full dataset.             |
| `COUNTRY_CODES`        | Readonly tuple of all 250 alpha-2 codes (source of `CountryCode`). |
| `CountryCode`          | Literal union type of every alpha-2 code.                          |
| `CountryData`          | Per-country record shape.                                          |
| `DivisionLabel`        | `{ en: string \| null; local: string \| null }`.                   |
| `isCountryCode(value)` | Type guard narrowing `string` to `CountryCode`.                    |

## address

```ts
import {
  getCountryConfig,
  isEUCountry,
  resolveAddressField,
} from "country-data-ts/address";

const jp = getCountryConfig("JP");
// { code: "JP", name: "Japan",
//   addressFields: ["postalCode", "level1", "city", "line1", "line2"],
//   postalCodePattern: /^\d{3}-\d{4}$/i, ... }

resolveAddressField("US", "level1", "fullRegion");
// { field: "level1", label: "State", required: true,
//   options: [{ value: "AL", label: "Alabama" }, ...] }
// (in "full" mode the same field is optional: label "State (optional)", required false)

isEUCountry("DE"); // true
```

Field order, postal-code patterns and level-1 `<select>` option lists are
curated per country; the postal-code pattern is derived from `COUNTRY_DATA` so
it always matches GeoNames.

| Export                                  | Description                                                              |
| --------------------------------------- | ------------------------------------------------------------------------ |
| `getCountryConfig(code)`                | The `CountryAddressConfig` for a country (field order + postal pattern). |
| `COUNTRIES_ADDRESSES`                   | `Record<CountryCode, CountryAddressConfig>` — every country's config.    |
| `COUNTRY_LIST`                          | All configs sorted by country name.                                      |
| `ALL_COUNTRY_OPTIONS`                   | `{ code, name }[]` for every country, sorted by name.                    |
| `resolveAddressField(code, key, mode?)` | Render-ready field metadata (label, required, placeholder, options).     |
| `addressFieldLabel(code, key)`          | Base label for a field.                                                  |
| `isAddressFieldRequired(key, mode?)`    | Whether a field is required in a given collection mode.                  |
| `isEUCountry(code)`                     | Whether the code is an EU member state.                                  |

Types: `AddressValue`, `AddressValueInput`, `AddressCollectionMode`,
`ValidationMode`, `AddressFieldKey`, `CountryAddressConfig`,
`ResolvedAddressField`.

## phone

```ts
import {
  COUNTRY_PHONE_DATA,
  getCountryPhoneConfig,
  parseCountryFromE164,
  toE164,
  validateExtractedPhone,
} from "country-data-ts/phone";

getCountryPhoneConfig("FR");
// { code: "FR", name: "France", callingCode: "+33",
//   mask: "+33 [0] [00] [00] [00] [00]", example: "6 12 34 56 78",
//   nationalRegex: "...", trunkPrefix: "0" }

// Shared calling codes are disambiguated by area code:
parseCountryFromE164("+1 204 234 2222", COUNTRY_PHONE_DATA)?.code; // "CA"
parseCountryFromE164("+1 212 234 2222", COUNTRY_PHONE_DATA)?.code; // "US"

toE164("0612345678", getCountryPhoneConfig("FR")!); // "+33612345678"  (trunk 0 dropped)
validateExtractedPhone("612345678", getCountryPhoneConfig("FR")!); // true
```

| Export                                                                               | Description                                             |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `COUNTRY_PHONE_DATA`                                                                 | Readonly array of all 250 `CountryPhoneConfig` entries. |
| `getCountryPhoneConfig(code)`                                                        | Phone config for a country.                             |
| `getCountryPhoneCatalog(allowed?)`                                                   | The catalog, optionally filtered/ordered.               |
| `parseCountryFromE164(value, countries, preferred?)`                                 | Country implied by an E.164 number.                     |
| `toE164(national, config)` / `nationalFromE164(e164, config)`                        | Convert between national and E.164 form.                |
| `validateExtractedPhone(national, config)`                                           | Validate a national number against the country regex.   |
| `applyPhoneMask` / `conformToMask` / `formatAreaCode`                                | Mask-based display formatting.                          |
| `getCountryFromLocale(locale)`                                                       | Extract the ISO region from a BCP-47 locale.            |
| `getDefaultCountryForCallingCode` / `getUniqueAreaCode` / `nationalBelongsToCountry` | Shared-calling-code helpers.                            |
| `CALLING_CODE_DEFAULTS`, `CALLING_CODE_AREA_PREFIXES`, `NANP_AREA_CODE_TO_COUNTRY`   | Disambiguation maps.                                    |

Types: `CountryPhoneConfig`, `ResolvedPaste`.

## tax

Consumption-tax (VAT / GST / sales tax) rates, collection rules and tax-ID
validation for every country. Models the EU one-stop-shop (B2B reverse charge),
per-region rates (US states, CA provinces), zero-rated exports (UK) and nexus
thresholds.

```ts
import {
  computeTaxOutcome,
  getTaxConfig,
  validateTax,
} from "country-data-ts/tax";

// EU: B2B with a valid VAT ID reverse-charges to 0%
computeTaxOutcome({ country: "IT", isBusiness: true, hasTaxId: true }).baseTax; // 0

// Consumer in an EU country: headline rate (OSS always carries a seller obligation)
computeTaxOutcome({ country: "FR", isBusiness: false, hasTaxId: false })
  .effectiveTax; // 20

// Per-region rate (US state sales tax)
computeTaxOutcome({
  country: "US",
  isBusiness: false,
  hasTaxId: false,
  state: "CA",
}).baseTax; // 7.25

getTaxConfig("DE")?.baseConsumerTax; // 19
validateTax("DE123456789", "DE"); // true  (VAT-number format check)
```

| Export                                                | Description                                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| `computeTaxOutcome(params)`                           | Full tax outcome (rate, reverse-charge, nexus gating, flags) for a transaction. |
| `computeConsumerTaxOutcome(params)`                   | B2C convenience wrapper.                                                        |
| `getTaxConfig(country)`                               | Country-level `TaxConfig` (rate, system, threshold, tax-ID metadata).           |
| `hasRegionalTax(country)`                             | Whether the rate varies by state/province.                                      |
| `getTaxLabel` / `getLocalTaxLabel(country, region?)`  | English / local tax name (e.g. "VAT" / "TVA").                                  |
| `getBusinessTaxNumberLabel(country)`                  | Name of the registration identifier (e.g. "ABN", "EIN", "VAT Number").          |
| `validateTax(taxId, country)` / `normalizeTax(taxId)` | Validate / normalize a tax identifier.                                          |
| `TAX_CONFIG`                                          | `Record<CountryCode, CountryTaxEntry>` — the full table.                        |
| `isEUCountry(code)`                                   | Whether the code is an EU member state (shared with the address domain).        |

Types: `TaxValue`, `TaxType`, `TaxSystem`, `TaxConfig`, `CountryTaxEntry`,
`TaxOutcome`, `TaxOutcomeFlags`, `TaxLabels`, `ComputeTaxOutcomeParams`,
`ComputeConsumerTaxOutcomeParams`.

> Rates are curated as of 2025 and provided for reference; verify against the
> current statutory rate before relying on them for billing.

## divisions

Level-2 administrative divisions (counties, districts, municipalities, …) and
localized division names, keyed by the same `value`s the `address` level-1
option lists expose. This entry point is **not** part of the barrel — import it
directly so apps that never touch divisions don't pull the (large) dataset.

```ts
import {
  getLevel2Options,
  hasLevel2Options,
  getLevel1LocalNames,
  getLevel2LocalNames,
  getLevel1LocalName,
  getLevel2LocalName,
  hasLocalNames,
  pickLocalName,
} from "country-data-ts/divisions";

// Level-2 option lists for cascading <select>s
getLevel2Options("US", "NY").length; // 62  (counties in New York State)
getLevel2Options("US", "NY")[0]; // { value: "001", label: "Albany County", level1Value: "NY" }
hasLevel2Options("US"); // true
```

Each country is a separate named export under the hood, so a bundler
tree-shakes away every country you don't reference.

### Localized names

`data/administrative-local-names.json` (GeoNames alternate names) is surfaced
here, re-keyed onto the division `value`s so you can join names to the options
you already hold. Names are keyed by language code (`ISO 639` /
`BCP-47`-ish, as GeoNames ships them). Only divisions that actually have a
localized name appear.

```ts
// Full language map for a level-1 division
getLevel1LocalNames("CH", "ZH");
// { it: "Zurigo", fr: "Zurich", de: "Zürich", rm: "Turitg" }

// Level-2 needs both the parent (level1Value) and the division (level2Value),
// because a level-2 value is only unique within its parent.
getLevel2LocalNames("FR", "84", "01");
// { fr: "Ain", oc: "Ain", eu: "Ain", ... }

// Resolve a single name for the first matching language (with fallback):
getLevel1LocalName("CH", "ZH", ["fr", "de"]); // "Zurich"
getLevel1LocalName("CH", "ZH", "rm"); // "Turitg"
getLevel1LocalName("CH", "ZH", ["ja", "de"]); // "Zürich"  (no Japanese, falls back to German)
getLevel2LocalName("FR", "84", "01", ["oc", "fr"]); // "Ain"

hasLocalNames("CH"); // true
hasLocalNames("XX"); // false  (unknown country)
getLevel1LocalNames("XX", "ZZ"); // undefined  (unknown country/division)
```

The `value`s these functions take are exactly what the option lists give you:
`level1Value` is `resolveAddressField(code, "level1").options[n].value` (from the
`address` domain), and for level-2, `level2Value` /`level1Value` are the
`.value` / `.level1Value` of a `getLevel2Options` entry.

| Export                                                | Description                                                                                    |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `getLevel2Options(code, level1?)`                     | Level-2 `<select>` options, optionally narrowed to one level-1 parent.                         |
| `hasLevel2Options(code)`                              | Whether level-2 division data exists for a country.                                            |
| `getLevel1LocalNames(code, level1Value)`              | `{ [lang]: name }` for a level-1 division, or `undefined`.                                     |
| `getLevel2LocalNames(code, level1Value, level2Value)` | `{ [lang]: name }` for a level-2 division, or `undefined`.                                      |
| `getLevel1LocalName(code, level1Value, langs)`        | Single level-1 name for the first matching language (string or ordered list), or `undefined`. |
| `getLevel2LocalName(code, l1Value, l2Value, langs)`   | Single level-2 name for the first matching language, or `undefined`.                           |
| `pickLocalName(names, langs)`                         | Pick from a `{ [lang]: name }` map by language preference.                                      |
| `hasLocalNames(code)`                                 | Whether any localized division names exist for a country.                                      |

Types: `Level2DivisionOption`, `CountryLocalNames`, `DivisionLocalNames`.

## Data sources

### Generated from external sources

The `data/` JSON files were originally derived from two external datasets and
are now the **hand-maintained source of truth** — there is no live re-fetch.
Edit the JSON directly and regenerate the TypeScript:

```sh
bun run gen:countries    # data/countries.json -> src/data/countries.ts
bun run gen:level1       # data/level1-administrative-codes.json (+ inline CURATED) -> src/data/level1-administrative-codes.ts
bun run gen:level2       # data/level2-administrative-codes.json -> src/data/level2-administrative-codes.ts
bun run gen:local-names  # data/administrative-local-names.json (+ level1/level2 codes) -> src/data/administrative-local-names.ts
bun run gen              # all four of the above
```

| File                                    | Original source                                                               | Contents                                                                                                                                         |
| --------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `data/countries.json`                   | [GeoNames](https://www.geonames.org/) + [Wikidata](https://www.wikidata.org/) | Per-country metadata: ISO codes, currency, languages, postal-code regex, administrative-division type labels (English + local).                  |
| `data/level1-administrative-codes.json` | [GeoNames](https://www.geonames.org/) admin1 dump                             | Level-1 divisions: `{ code, name, officialCode }` per country.                                                                                   |
| `data/level2-administrative-codes.json` | [GeoNames](https://www.geonames.org/) admin2 dump                             | Level-2 divisions: `{ level1AdminCode, code, name, officialCode }` per country.                                                                  |
| `data/administrative-local-names.json`  | [GeoNames](https://www.geonames.org/) alternate names                         | Localized division names keyed by GeoNames path (`US-AL` for level-1, `AE-01.AE-101` for level-2), then by language code. Only divisions that have at least one localized name appear. |

`data/` is not published to npm — only `dist/` ships.

### Hand-maintained data

These files have no automated upstream and must be updated by hand:

| File                                                  | Contents                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/phone-data.ts`                              | Calling codes, input masks, national-number validation regex, example numbers, and trunk prefixes. Covers all 250 countries. The masks and regexes are manually curated approximations; libphonenumber is the authoritative reference for edge cases.                                                                                       |
| `src/data/postal-codes.ts`                            | Postal-code field label overrides (e.g. "ZIP code" for US), per-country placeholder examples (capital's postal code), and city label overrides. Postal-code _patterns_ come from `data/countries.json`.                                                                                                                                     |
| `src/tax.ts` (`TAX_CONFIG`)                           | Consumption-tax rates, tax systems (EU OSS vs. country-specific), collection thresholds, zero-rated export flags, local-surcharge flags, and tax-ID patterns for every country. US states and Canadian provinces each have their own rate entry. Rates are a static snapshot; verify against current statutory rates before use in billing. |
| `src/address.ts` (field configs)                      | Address field order, per-field labels and required/optional status per collection mode, and EU membership list. Curated per country.                                                                                                                                                                                                        |
| `scripts/gen-countries.ts` (`LEVEL1_LABEL_OVERRIDES`) | Manual overrides for countries that mix two kinds of level-1 division (e.g. CA "Province/Territory", AU "State/Territory"). Applied before code generation.                                                                                                                                                                                 |
| `scripts/gen-level1-codes.ts` (`CURATED`)             | Supplemental level-1 divisions for countries GeoNames ships no admin1 list for but which have an official ISO 3166-2 scheme (currently SG's 5 CDC districts). A curated division overrides a GeoNames one with the same code; countries absent from GeoNames are added wholesale.                                                           |

## Limitations

- **No automated sync.** All data in `data/` was seeded from GeoNames/Wikidata
  but is now maintained independently. Upstream changes (new countries, renamed
  divisions, updated postal patterns) are not automatically picked up — the JSON
  files must be edited and code regenerated by hand.

- **Tax rates are a static snapshot.** `TAX_CONFIG` reflects rates as of ~2025.
  VAT/GST rates change without notice; registration thresholds, reduced rates,
  and nexus rules are especially volatile. Always verify against the current
  statutory rate before using in billing or compliance logic.

- **Phone masks are approximations.** `src/data/phone-data.ts` is hand-curated.
  The regexes cover the common mobile/geographic formats but are not exhaustive
  — premium-rate, toll-free, and short-code ranges may not validate correctly.
  For strict compliance use
  [libphonenumber](https://github.com/google/libphonenumber) as the
  authoritative reference.

- **Localized division names are sparse and language coverage is uneven.** The
  `divisions` entry point surfaces `data/administrative-local-names.json`, but
  GeoNames only ships alternate names for a subset of divisions, and the set of
  languages per division varies. A division with no localized name (or none in
  the language you ask for) yields `undefined` — fall back to the English label
  from the option list.

- **Shared calling codes require disambiguation.** Countries sharing `+1`
  (NANP), `+44`, `+7`, and others are resolved by area-code prefix; the prefix
  tables in `src/data/phone-data.ts` are manually maintained and may be
  incomplete for new area codes.

- **Tax coverage is uneven.** EU and OECD countries are well-covered. Many
  smaller or non-OECD jurisdictions have a tax entry but lack `taxPattern` for
  tax-ID validation or have a `null` threshold that means "data not available"
  rather than "no threshold".

- **Address field configs are curated, not authoritative.** Field order and
  labels reflect common practice but are not derived from a universal postal
  standard. Some countries have no universally agreed address format.

## Potential improvements

- **libphonenumber-derived phone data** — generate `src/data/phone-data.ts`
  masks and regexes from the libphonenumber metadata XML to reduce manual
  maintenance and improve accuracy.
- **Time zone data** — add `timezone` (IANA key) and `utcOffset` to
  `CountryData`, sourced from GeoNames or the tz database.
- **Currency metadata** — add `currencySymbol` and `currencyMinorUnits` to
  `CountryData` for formatting monetary values.
- **Coverage table CI guard** — run `gen:coverage` in CI and fail when any row
  is flagged ❗ without a "Last verified" date update, enforcing regular data
  review.

## Coverage table

Run `bun run gen:coverage` to regenerate the table below from current data. The
script preserves hand-entered "Last verified" dates and flags rows whose
generated data has changed with ❗.

```sh
bun run gen:coverage
```

## Development

```sh
bun install
bun run build        # tsup -> dist (ESM + CJS + d.ts)
bun run test         # vitest
bun run typecheck    # tsc across src, scripts, tests
bun run lint         # biome
bun run gen          # regenerate src/data from data/*.json
bun run gen:coverage # regenerate the coverage table in README.md
```

<!-- COVERAGE_TABLE_START -->

> ❗ next to a code means its data changed since it was last verified — the country/region should be reverified.

| Code | Country | Last verified | Calling code | Phone mask | Phone example | Address format | Postal code | Level 1 labels | Level 2 labels | Consumption tax | Nexus minimum | Consumer tax |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AD | Andorra | — | +376 | ✅ [000] [000] | ✅ 312 345 | ✅ | ✅ (AD500) | ✅ Parish / Parròquia | ✅ Settlement / Ciutat | 4.5% VAT (IGI) ✅ | EUR 40,000 | ❌ |
| AE | United Arab Emirates | — | +971 | ✅ [00] [000] [0000] | ✅ 50 123 4567 | ✅ | ✅ (00000-00000) | ✅ Emirate / إمارة | ❌ | 5% VAT ✅ | AED 375,000 | ❌ |
| AF | Afghanistan | — | +93 | ✅ [000000000] | ✅ 701234567 | ✅ | ❌ | ✅ Province / ولایت | ✅ District / ولسوالی | None ✅ | Seller never collects | ❌ |
| AG ❗ | Antigua and Barbuda | — | +1 (268) | ✅ ([000]) [000]-[0000] | ✅ (268) 464-1234 | ✅ | ❌ | ✅ Parish / Parish | ❌ | 15% VAT (ABST) ✅ | Always | ❌ |
| AI ❗ | Anguilla | — | +1 (264) | ✅ ([000]) [000]-[0000] | ✅ (264) 235-1234 | ✅ | ✅ (AI-2640) | ❌ | ❌ | 13% GST ✅ | Always | ❌ |
| AL | Albania | — | +355 | ✅ [000000000] | ✅ 672123456 | ✅ | ✅ (1001) | ✅ County / Qarku | ✅ District / Rrethet | 20% VAT (TVSH) ✅ | ALL 10,000,000 | ❌ |
| AM | Armenia | — | +374 | ✅ [00000000] | ✅ 77123456 | ✅ | ✅ (0010) | ✅ Province / Մարզ | ✅ Village / Գյուղ | 20% VAT (ԱԱՀ) ✅ | Always | ❌ |
| AO | Angola | — | +244 | ✅ [000] [000] [000] | ✅ 923 123 456 | ✅ | ❌ | ✅ Province / Província | ✅ Municipality / Município | 14% VAT (IVA) ✅ | Always | ❌ |
| AQ ❗ | Antarctica | — | +672 (1) | ✅ [0] [00] [000] | ✅ 1 23 456 | ✅ | ❌ | ❌ | ❌ | None ✅ | Seller never collects | ❌ |
| AR | Argentina | — | +54 | ✅ [00000000000] | ✅ 91123456789 | ✅ | ✅ (C1000) | ✅ Province / Provincia | ✅ Department / Departamento | 21% VAT (IVA) ✅ | Always | ❌ |
| AS ❗ | American Samoa | — | +1 (684) | ✅ ([000]) [000]-[0000] | ✅ (684) 733-1234 | ✅ | ✅ (96799) | ✅ District / District | ✅ County / County | None ✅ | Seller never collects | ❌ |
| AT | Austria | — | +43 | ✅ [000] [000] [0000] | ✅ 676 123 4567 | ✅ | ✅ (1010) | ✅ Federal state / Bundesland | ✅ District / Bezirk | 20% VAT (MwSt) ✅ | Always | ✅ VAT (MwSt) (ATU12345678) |
| AU | Australia | — | +61 | ✅ [000] [000] [000] | ✅ 412 345 678 | ✅ | ✅ (2600) | ✅ External territory / External territory | ✅ Local government area / Local government area | 10% GST ✅ | AUD 75,000 | ✅ GST (12345678901) |
| AW | Aruba | — | +297 | ✅ [000] [0000] | ✅ 560 1234 | ✅ | ❌ | ❌ | ❌ | None ✅ | Seller never collects | ❌ |
| AX ❗ | Aland Islands | — | +358 (18) | ✅ [000000000] | ✅ 412345678 | ✅ | ✅ (22100) | ❌ | ❌ | 25.5% VAT (ALV) ✅ | Always | ❌ |
| AZ | Azerbaijan | — | +994 | ✅ [000000000] | ✅ 401234567 | ✅ | ✅ (AZ1000) | ✅ District / Rayonu | ❌ | 18% VAT (ƏDV) ✅ | Always | ❌ |
| BA | Bosnia and Herzegovina | — | +387 | ✅ [00000000] | ✅ 61123456 | ✅ | ✅ (71000) | ✅ Political division / Administrativna podjela | ✅ Region / Regije Republike Srpske | 17% VAT (PDV) ✅ | BAM 50,000 | ❌ |
| BB ❗ | Barbados | — | +1 (246) | ✅ ([000]) [000]-[0000] | ✅ (246) 250-1234 | ✅ | ✅ (BB11000) | ✅ Parish / Parish | ❌ | 17.5% VAT ✅ | Always | ❌ |
| BD | Bangladesh | — | +880 | ✅ [0000000000] | ✅ 1812345678 | ✅ | ✅ (1000) | ✅ Division / বিভাগ | ✅ District / জেলা | 15% VAT ✅ | Always | ❌ |
| BE | Belgium | — | +32 | ✅ [000] [00] [00] [00] | ✅ 470 12 34 56 | ✅ | ✅ (1000) | ✅ Region / Gewest | ✅ Province / Provincie | 21% VAT (BTW/TVA) ✅ | Always | ✅ VAT (BTW/TVA) (BE0123456789) |
| BF | Burkina Faso | — | +226 | ✅ [00] [00] [00] [00] | ✅ 70 12 34 56 | ✅ | ❌ | ✅ Region / Région | ✅ Province / Province | 18% VAT (TVA) ✅ | Always | ❌ |
| BG | Bulgaria | — | +359 | ✅ [00] [000] [0000] | ✅ 87 123 4567 | ✅ | ✅ (1000) | ✅ Oblast / Oбласт | ✅ Municipality / Община | 20% VAT (DDS) ✅ | Always | ❌ |
| BH | Bahrain | — | +973 | ✅ [0000] [0000] | ✅ 3600 1234 | ✅ | ✅ (317) | ✅ Governorate / محافظة | ❌ | 10% VAT ✅ | Always | ❌ |
| BI | Burundi | — | +257 | ✅ [00] [00] [00] [00] | ✅ 79 56 12 34 | ✅ | ❌ | ✅ Province / Province | ✅ Commune / Commune | 18% VAT (TVA) ✅ | Always | ❌ |
| BJ | Benin | — | +229 | ✅ [00] [00] [00] [00] [00] | ✅ 01 95 12 34 56 | ✅ | ❌ | ✅ Department / Département | ✅ Commune / Commune | 18% VAT (TVA) ✅ | Always | ❌ |
| BL | Saint Barthelemy | — | +590 | ✅ [000000000] | ✅ 690001234 | ✅ | ✅ (97133) | ❌ | ❌ | None ✅ | Seller never collects | ❌ |
| BM ❗ | Bermuda | — | +1 (441) | ✅ ([000]) [000]-[0000] | ✅ (441) 370-1234 | ✅ | ✅ (HM12) | ✅ Parish / Parish | ❌ | None ✅ | Seller never collects | ❌ |
| BN | Brunei | — | +673 | ✅ [000] [0000] | ✅ 712 3456 | ✅ | ✅ (BS8711) | ✅ District / Daerah | ✅ Mukim / Mukim Negara | None ✅ | Seller never collects | ❌ |
| BO | Bolivia | — | +591 | ✅ [00000000] | ✅ 71234567 | ✅ | ❌ | ✅ Department / Departamento | ✅ Province / Provincia | 13% VAT (IVA) ✅ | Always | ❌ |
| BQ | Bonaire, Saint Eustatius and Saba  | — | +599 | ✅ [000] [0000] | ✅ 318 1234 | ✅ | ❌ | ❌ | ❌ | None ✅ | Seller never collects | ❌ |
| BR | Brazil | — | +55 | ✅ [00] [00000] [0000] | ✅ 11 91234 5678 | ✅ | ✅ (70040-010) | ✅ Federative unit / Unidade federativa | ✅ Municipality / Município | 17% VAT (ICMS) ✅ | Always | ❌ |
| BS ❗ | Bahamas | — | +1 (242) | ✅ ([000]) [000]-[0000] | ✅ (242) 359-1234 | ✅ | ❌ | ✅ District / District | ❌ | 10% VAT ✅ | Always | ❌ |
| BT | Bhutan | — | +975 | ✅ [00] [00] [00] [00] | ✅ 17 12 34 56 | ✅ | ❌ | ✅ District / རྫོང་ཁག | ❓ Gewog (en only) | None ✅ | Seller never collects | ❌ |
| BV | Bouvet Island | — | +47 | ✅ [000] [00] [000] | ✅ 412 34 567 | ✅ | ❌ | ❌ | ❌ | None ✅ | Seller never collects | ❌ |
| BW | Botswana | — | +267 | ✅ [00] [000] [000] | ✅ 71 123 456 | ✅ | ❌ | ✅ District / District | ❌ | 14% VAT ✅ | Always | ❌ |
| BY | Belarus | — | +375 | ✅ [000000000] | ✅ 294911911 | ✅ | ✅ (220000) | ✅ Region / Вобласць | ✅ District / Раён | 20% VAT (PDV) ✅ | Always | ❌ |
| BZ | Belize | — | +501 | ✅ [000]-[0000] | ✅ 622-1234 | ✅ | ❌ | ✅ District / District | ❌ | 12.5% GST ✅ | Always | ❌ |
| CA | Canada | — | +1 | ✅ ([000]) [000]-[0000] | ✅ (204) 234-5678 | ✅ | ✅ (K1A 0B1) | ✅ Province / Province | ✅ Regional district / Regional district | 5–15% GST/HST (regional) ✅ | CAD 30,000 | ✅ GST/HST (123456789RT0001) |
| CA-AB | Canada — Alberta | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 5% GST ✅ | ↳ | ↳ |
| CA-BC | Canada — British Columbia | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 12% GST + PST ✅ | ↳ | ↳ |
| CA-MB | Canada — Manitoba | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 12% GST + PST (GST + RST) ✅ | ↳ | ↳ |
| CA-NB | Canada — New Brunswick | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 15% HST ✅ | ↳ | ↳ |
| CA-NL | Canada — Newfoundland and Labrador | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 15% HST ✅ | ↳ | ↳ |
| CA-NS | Canada — Nova Scotia | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 15% HST ✅ | ↳ | ↳ |
| CA-NT | Canada — Northwest Territories | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 5% GST ✅ | ↳ | ↳ |
| CA-NU | Canada — Nunavut | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 5% GST ✅ | ↳ | ↳ |
| CA-ON | Canada — Ontario | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 13% HST ✅ | ↳ | ↳ |
| CA-PE | Canada — Prince Edward Island | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 15% HST ✅ | ↳ | ↳ |
| CA-QC | Canada — Quebec | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 14.975% GST + QST (TPS + TVQ) ✅ | ↳ | ↳ |
| CA-SK | Canada — Saskatchewan | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 11% GST + PST ✅ | ↳ | ↳ |
| CA-YT | Canada — Yukon | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 5% GST ✅ | ↳ | ↳ |
| CC | Cocos Islands | — | +61 | ✅ [000000000] | ✅ 412345678 | ✅ | ✅ (6799) | ❌ | ❌ | None ✅ | Seller never collects | ❌ |
| CD | Democratic Republic of the Congo | — | +243 | ✅ [000000000] | ✅ 991234567 | ✅ | ❌ | ✅ Province / Provinces | ✅ Commune / Commune | 16% VAT (TVA) ✅ | Always | ❌ |
| CF | Central African Republic | — | +236 | ✅ [00] [00] [00] [00] | ✅ 70 01 23 45 | ✅ | ❌ | ✅ Prefecture / Préfecture | ❌ | 19% VAT (TVA) ✅ | Always | ❌ |
| CG | Republic of the Congo | — | +242 | ✅ [00] [000] [0000] | ✅ 06 123 4567 | ✅ | ❌ | ✅ Department / Département | ❌ | 18% VAT (TVA) ✅ | Always | ❌ |
| CH | Switzerland | — | +41 | ✅ [00] [000] [00] [00] | ✅ 76 123 45 67 | ✅ | ✅ (3000) | ✅ Canton / Kanton | ✅ Municipality / Gemeinde | 8.1% VAT (MWST/TVA/IVA) ✅ | CHF 100,000 | ✅ VAT (MWST/TVA/IVA) (CHE-123.456.789MWST) |
| CI | Ivory Coast | — | +225 | ✅ [00] [00] [00] [0000] | ✅ 01 23 45 6789 | ✅ | ❌ | ✅ Region / Région | ❌ | 18% VAT (TVA) ✅ | Always | ❌ |
| CK | Cook Islands | — | +682 | ✅ [00] [000] | ✅ 71 234 | ✅ | ❌ | ❌ | ❌ | 15% VAT ✅ | Always | ❌ |
| CL | Chile | — | +56 | ✅ ([0]) [0000] [0000] | ✅ (2) 2123 4567 | ✅ | ✅ (8320000) | ✅ Region / Región | ✅ Province / Provincia | 19% VAT (IVA) ✅ | Always | ❌ |
| CM | Cameroon | — | +237 | ✅ [0] [00] [00] [00] [00] | ✅ 6 71 23 45 67 | ✅ | ❌ | ✅ Electoral unit / Electoral unit | ✅ Department / Department | 19.25% VAT (TVA) ✅ | Always | ❌ |
| CN | China | — | +86 | ✅ [000] [0000] [0000] | ✅ 139 1234 5678 | ✅ | ✅ (100000) | ✅ Province / 省 | ✅ Prefecture-level city / 地级市 | 13% VAT (增值税) ✅ | Always | ❌ |
| CO | Colombia | — | +57 | ✅ [000] [0000000] | ✅ 321 1234567 | ✅ | ✅ (110111) | ✅ Department / Departamento | ✅ Municipality / Municipio | 19% VAT (IVA) ✅ | Always | ❌ |
| CR | Costa Rica | — | +506 | ✅ [0000] [0000] | ✅ 8312 3456 | ✅ | ✅ (10101) | ✅ Electoral unit / Circunscripción electoral | ✅ Canton / Cantón | 13% VAT (IVA) ✅ | Always | ❌ |
| CU | Cuba | — | +53 | ✅ [00000000] | ✅ 51234567 | ✅ | ✅ (10400) | ✅ Province / Provincia | ✅ Municipality / Municipio | None ✅ | Seller never collects | ❌ |
| CV | Cabo Verde | — | +238 | ✅ [000] [00] [00] | ✅ 991 12 34 | ✅ | ✅ (7600) | ✅ Concelho / Municipio | ✅ Freguesia / Freguesia | 15% VAT (IVA) ✅ | Always | ❌ |
| CW | Curacao | — | +599 | ✅ [0] [000] [0000] | ✅ 9 518 1234 | ✅ | ❌ | ❌ | ❌ | 6% Sales Tax (OB) ✅ | Always | ❌ |
| CX | Christmas Island | — | +61 | ✅ [000000000] | ✅ 412345678 | ✅ | ✅ (6798) | ❌ | ❌ | None ✅ | Seller never collects | ❌ |
| CY | Cyprus | — | +357 | ✅ [00] [000] [000] | ✅ 96 123 456 | ✅ | ✅ (1010) | ✅ District / Επαρχία | ✅ Community / Κοινότητα | 19% VAT (FPA) ✅ | Always | ❌ |
| CZ | Czechia | — | +420 | ✅ [000] [000] [000] | ✅ 601 123 456 | ✅ | ✅ (110 00) | ✅ Region / Kraj | ✅ Municipal part / Část obce | 21% VAT (DPH) ✅ | Always | ❌ |
| DE | Germany | — | +49 | ✅ [0000] [00000000] | ✅ 0151 23456789 | ✅ | ✅ (10115) | ✅ Federated state / Bundesland | ✅ Urban municipality / Stadt | 19% VAT (MwSt) ✅ | Always | ✅ VAT (MwSt) (DE123456789) |
| DJ | Djibouti | — | +253 | ✅ [00] [00] [00] [00] | ✅ 77 83 10 01 | ✅ | ❌ | ✅ Region / Région | ✅ Sub-prefecture / Sous-préfecture | 10% VAT (TVA) ✅ | Always | ❌ |
| DK | Denmark | — | +45 | ✅ [00] [00] [00] [00] | ✅ 34 41 23 45 | ✅ | ✅ (1050) | ✅ County / Dansk amt | ✅ Municipality / Kommune | 25% VAT (Moms) ✅ | Always | ❌ |
| DM ❗ | Dominica | — | +1 (767) | ✅ ([000]) [000]-[0000] | ✅ (767) 225-1234 | ✅ | ❌ | ✅ Parish / Parish | ❌ | 15% VAT ✅ | Always | ❌ |
| DO | Dominican Republic | — | +1 | ✅ ([000]) [000]-[0000] | ✅ (809) 234-5678 | ✅ | ✅ (10101) | ✅ Province / Provincia | ❌ | 18% VAT (ITBIS) ✅ | Always | ❌ |
| DZ | Algeria | — | +213 | ✅ [000000000] | ✅ 551234567 | ✅ | ✅ (16000) | ✅ Province / ولاية | ✅ District / دائرة | 19% VAT (TVA) ✅ | Always | ❌ |
| EC | Ecuador | — | +593 | ✅ [000000000] | ✅ 991234567 | ✅ | ✅ (170150) | ✅ Province / Provincia | ✅ Canton / Cantón | 15% VAT (IVA) ✅ | Always | ❌ |
| EE | Estonia | — | +372 | ✅ [0000] [0000] | ✅ 5123 4567 | ✅ | ✅ (10111) | ✅ County / Maakond | ❌ | 22% VAT (KM) ✅ | Always | ❌ |
| EG | Egypt | — | +20 | ✅ [0000000000] | ✅ 1001234567 | ✅ | ✅ (11511) | ✅ Governorate / محافظة | ✅ Marka / مركز | 14% VAT ✅ | Always | ❌ |
| EH ❗ | Western Sahara | — | +212 (528) | ✅ [000000000] | ✅ 650123456 | ✅ | ❌ | ❌ | ❌ | None ✅ | Seller never collects | ❌ |
| ER | Eritrea | — | +291 | ✅ [0000000] | ✅ 7123456 | ✅ | ❌ | ❓ Region (en only) | ❌ | None ✅ | Seller never collects | ❌ |
| ES | Spain | — | +34 | ✅ [000] [000] [000] | ✅ 612 345 678 | ✅ | ✅ (28001) | ✅ Autonomous community / Comunidad autónoma | ✅ Province / Provincia | 21% VAT (IVA) ✅ | Always | ✅ VAT (IVA) (ESA12345678) |
| ET | Ethiopia | — | +251 | ✅ [000000000] | ✅ 911234567 | ✅ | ✅ (1000) | ❓ Region (en only) | ❓ District (en only) | 15% VAT ✅ | Always | ❌ |
| FI | Finland | — | +358 | ✅ [00] [000] [0000] | ✅ 50 123 4567 | ✅ | ✅ (00100) | ✅ Region / Maakunta | ✅ Municipality / Kunta | 25.5% VAT (ALV) ✅ | Always | ❌ |
| FJ | Fiji | — | +679 | ✅ [000] [0000] | ✅ 701 2345 | ✅ | ❌ | ✅ Division / Division | ❌ | 15% VAT ✅ | Always | ❌ |
| FK | Falkland Islands | — | +500 | ✅ [00000] | ✅ 51234 | ✅ | ✅ (FIQQ 1ZZ) | ❌ | ❌ | None ✅ | Seller never collects | ❌ |
| FM | Micronesia | — | +691 | ✅ [000] [0000] | ✅ 350 1234 | ✅ | ✅ (96941) | ✅ State / State | ❌ | None ✅ | Seller never collects | ❌ |
| FO | Faroe Islands | — | +298 | ✅ [000000] | ✅ 211234 | ✅ | ✅ (100) | ❌ | ❌ | 25% VAT (MVG) ✅ | Always | ❌ |
| FR | France | — | +33 | ✅ [0] [00] [00] [00] [00] | ✅ 6 12 34 56 78 | ✅ | ✅ (75001) | ✅ Region / Région | ✅ Department / Département | 20% VAT (TVA) ✅ | Always | ✅ VAT (TVA) (FRXX123456789) |
| GA | Gabon | — | +241 | ✅ [00] [00] [00] [00] | ✅ 06 03 12 34 | ✅ | ❌ | ✅ Province / Province | ❌ | 18% VAT (TVA) ✅ | Always | ❌ |
| GB | United Kingdom | — | +44 | ✅ [0000] [0000000] | ✅ 0770 0900123 | ✅ | ✅ (SW1A 1AA) | ✅ Constituent country / Constituent country | ✅ Council area / Council area | 20% VAT ✅ | Seller never collects | ✅ VAT (GB123456789) |
| GD ❗ | Grenada | — | +1 (473) | ✅ ([000]) [000]-[0000] | ✅ (473) 403-1234 | ✅ | ❌ | ✅ Parish / Parish | ❌ | 15% VAT ✅ | Always | ❌ |
| GE | Georgia | — | +995 | ✅ [000] [00] [00] [00] | ✅ 555 12 34 56 | ✅ | ✅ (0100) | ✅ Mkhare / Მხარე | ✅ Municipality / Მუნიციპალიტეტი | 18% VAT (DGhG) ✅ | GEL 100,000 | ❌ |
| GF | French Guiana | — | +594 | ✅ [000000000] | ✅ 694201234 | ✅ | ✅ (97300) | ✅ Arrondissement / Arrondissement | ✅ Canton / Canton | None ✅ | Seller never collects | ❌ |
| GG ❗ | Guernsey | — | +44 (1481) | ✅ [0000000000] | ✅ 7781123456 | ✅ | ✅ (GY1 1AA) | ✅ Island / Island | ✅ Parish / Parish | None ✅ | Seller never collects | ❌ |
| GH | Ghana | — | +233 | ✅ [000000000] | ✅ 231234567 | ✅ | ❌ | ✅ Region / Region | ✅ District / District | 15% VAT ✅ | Always | ❌ |
| GI | Gibraltar | — | +350 | ✅ [00000000] | ✅ 57123456 | ✅ | ✅ (GX11 1AA) | ❌ | ❌ | None ✅ | Seller never collects | ❌ |
| GL | Greenland | — | +299 | ✅ [00] [00] [00] | ✅ 22 12 34 | ✅ | ✅ (3900) | ❓ Municipality (en only) | ❌ | None ✅ | Seller never collects | ❌ |
| GM | Gambia | — | +220 | ✅ [000] [0000] | ✅ 301 2345 | ✅ | ❌ | ✅ Region / Region | ❌ | 15% VAT ✅ | Always | ❌ |
| GN | Guinea | — | +224 | ✅ [000] [00] [00] [00] | ✅ 601 12 34 56 | ✅ | ❌ | ✅ Region / Région | ✅ Prefecture / Préfecture | 18% VAT (TVA) ✅ | Always | ❌ |
| GP | Guadeloupe | — | +590 | ✅ [000000000] | ✅ 690001234 | ✅ | ✅ (97100) | ✅ Commune / Commune | ✅ Canton / Canton | 8.5% VAT (TVA) ✅ | Always | ❌ |
| GQ | Equatorial Guinea | — | +240 | ✅ [000] [000] [000] | ✅ 222 123 456 | ✅ | ❌ | ✅ Province / Provincia | ❌ | 15% VAT (IVA) ✅ | Always | ❌ |
| GR | Greece | — | +30 | ✅ [00] [0000] [0000] | ✅ 69 1234 5678 | ✅ | ✅ (10431) | ✅ Monastic community / Μοναστική κοινότητα | ✅ Regional unit / Περιφερειακή ενότητα | 24% VAT (FPA) ✅ | Always | ❌ |
| GS | South Georgia and the South Sandwich Islands | — | +500 | ✅ [00000] | ✅ 12345 | ✅ | ✅ (SIQQ 1ZZ) | ❌ | ❌ | None ✅ | Seller never collects | ❌ |
| GT | Guatemala | — | +502 | ✅ [0000] [0000] | ✅ 5123 4567 | ✅ | ✅ (01001) | ✅ Department / Departamento | ✅ Municipality / Municipio | 12% VAT (IVA) ✅ | Always | ❌ |
| GU ❗ | Guam | — | +1 (671) | ✅ ([000]) [000]-[0000] | ✅ (671) 300-1234 | ✅ | ✅ (96910) | ✅ Village / Village | ✅ Village / Village | None ✅ | Seller never collects | ❌ |
| GW | Guinea-Bissau | — | +245 | ✅ [000] [000] [000] | ✅ 955 012 345 | ✅ | ✅ (1000) | ✅ Region / Região | ❌ | 17% VAT (IVA) ✅ | Always | ❌ |
| GY | Guyana | — | +592 | ✅ [000] [0000] | ✅ 609 1234 | ✅ | ❌ | ✅ Region / Region | ❌ | 14% VAT ✅ | Always | ❌ |
| HK | Hong Kong | — | +852 | ✅ [0000] [0000] | ✅ 5123 4567 | ✅ | ✅ (999077) | ✅ District / 香港政區 | ❌ | None ✅ | Seller never collects | ❌ |
| HM | Heard Island and McDonald Islands | — | +672 | ✅ [0] [00] [000] | ✅ 1 23 456 | ✅ | ✅ (7151) | ❌ | ❌ | None ✅ | Seller never collects | ❌ |
| HN | Honduras | — | +504 | ✅ [0000]-[0000] | ✅ 9123-4567 | ✅ | ✅ (11101) | ✅ Department / Departamento | ✅ Municipality / Municipio | 15% VAT (ISV) ✅ | Always | ❌ |
| HR | Croatia | — | +385 | ✅ [00] [000] [0000] | ✅ 91 234 5678 | ✅ | ✅ (10000) | ✅ County / Županija | ✅ Municipality / Općina | 25% VAT (PDV) ✅ | Always | ❌ |
| HT | Haiti | — | +509 | ✅ [00] [00] [0000] | ✅ 34 10 1234 | ✅ | ✅ (HT6110) | ✅ Department / Depatman | ✅ Arrondissement / Lis awondisman | 10% VAT (TCA) ✅ | Always | ❌ |
| HU | Hungary | — | +36 | ✅ [000000000] | ✅ 201234567 | ✅ | ✅ (1011) | ✅ County / Vármegye | ✅ District / Járás | 27% VAT (ÁFA) ✅ | Always | ❌ |
| ID | Indonesia | — | +62 | ✅ [000] [0000] [0000] | ✅ 812 3456 7890 | ✅ | ✅ (10110) | ✅ Province / Provinsi | ✅ Regency / Kabupaten | 11% VAT (PPN) ✅ | Always | ❌ |
| IE | Ireland | — | +353 | ✅ [00] [000] [0000] | ✅ 83 123 4567 | ✅ | ✅ (D02 AF30) | ✅ County / County | ✅ Municipal district / Municipal district | 23% VAT ✅ | Always | ❌ |
| IL | Israel | — | +972 | ✅ [000000000] | ✅ 502345678 | ✅ | ✅ (9510001) | ✅ District / מחוז | ✅ Settlement / התנחלות | 18% VAT (מע"מ) ✅ | Always | ❌ |
| IM ❗ | Isle of Man | — | +44 (1624) | ✅ [0000000000] | ✅ 7924123456 | ✅ | ✅ (IM1 1AA) | ❌ | ❌ | 20% VAT ✅ | Always | ❌ |
| IN | India | — | +91 | ✅ [00000] [00000] | ✅ 81234 56789 | ✅ | ✅ (110001) | ✅ State / State | ✅ District / District | 18% GST ✅ | INR 4,000,000 | ❌ |
| IO | British Indian Ocean Territory | — | +246 | ✅ [000] [0000] | ✅ 380 1234 | ✅ | ✅ (BBND 1ZZ) | ❌ | ❌ | None ✅ | Seller never collects | ❌ |
| IQ | Iraq | — | +964 | ✅ [0000000000] | ✅ 7912345678 | ✅ | ✅ (10001) | ✅ Governorate / محافظة | ✅ District / قضاء | None ✅ | Seller never collects | ❌ |
| IR | Iran | — | +98 | ✅ [0000000000] | ✅ 9123456789 | ✅ | ✅ (1418543931) | ✅ Province / استان | ✅ County / شهرستان | 10% VAT ✅ | Always | ❌ |
| IS | Iceland | — | +354 | ✅ [000] [0000] | ✅ 611 1234 | ✅ | ✅ (101) | ✅ Constituency / Kjördæmi | ❌ | 24% VAT (VSK) ✅ | ISK 2,000,000 | ❌ |
| IT | Italy | — | +39 | ✅ [000] [000] [0000] | ✅ 312 123 4567 | ✅ | ✅ (00100) | ✅ Region / Regione | ✅ Province / Provincia | 22% VAT (IVA) ✅ | Always | ✅ VAT (IVA) (IT12345678901) |
| JE ❗ | Jersey | — | +44 (1534) | ✅ [0000000000] | ✅ 7797712345 | ✅ | ✅ (JE1 1AA) | ✅ Parish / Parish | ❌ | 5% GST ✅ | Always | ❌ |
| JM | Jamaica | — | +1 | ✅ ([000]) [000]-[0000] | ✅ (876) 210-1234 | ✅ | ❌ | ✅ County / County | ✅ Parish / Parish | 15% VAT (GCT) ✅ | Always | ❌ |
| JO | Jordan | — | +962 | ✅ [000000000] | ✅ 790123456 | ✅ | ✅ (11118) | ✅ Governorate / محافظة | ❌ | 16% GST ✅ | Always | ❌ |
| JP | Japan | — | +81 | ✅ [00] [0000] [0000] | ✅ 90 1234 5678 | ✅ | ✅ (100-0001) | ✅ Prefecture / 都道府県 | ✅ City / 日本の市 | 10% Consumption Tax (消費税) ✅ | JPY 10,000,000 | ✅ Consumption Tax (消費税) (T1234567890123) |
| KE | Kenya | — | +254 | ✅ [000000000] | ✅ 712123456 | ✅ | ✅ (00100) | ✅ Province / Province | ❌ | 16% VAT ✅ | Always | ❌ |
| KG | Kyrgyzstan | — | +996 | ✅ [000000000] | ✅ 700123456 | ✅ | ✅ (720000) | ❌ | ❌ | 12% VAT (НДС) ✅ | Always | ❌ |
| KH | Cambodia | — | +855 | ✅ [00000000] | ✅ 91234567 | ✅ | ✅ (12000) | ✅ Province / ខេត្តនៃកម្ពុជា | ❓ District (en only) | 10% VAT ✅ | Always | ❌ |
| KI | Kiribati | — | +686 | ✅ [00000000] | ✅ 72001234 | ✅ | ❌ | ❌ | ❌ | 12.5% VAT ✅ | Always | ❌ |
| KM | Comoros | — | +269 | ✅ [000] [00] [00] | ✅ 321 23 45 | ✅ | ❌ | ✅ Volcanic island / جزيرة | ❌ | None ✅ | Seller never collects | ❌ |
| KN ❗ | Saint Kitts and Nevis | — | +1 (869) | ✅ ([000]) [000]-[0000] | ✅ (869) 765-2917 | ✅ | ❌ | ✅ Parish / Parish | ❌ | 17% VAT ✅ | Always | ❌ |
| KP | North Korea | — | +850 | ✅ [0000000000] | ✅ 1921234567 | ✅ | ✅ (950003) | ✅ Province / 도 | ✅ County / 군 | None ✅ | Seller never collects | ❌ |
| KR | South Korea | — | +82 | ✅ [0000000000] | ✅ 1020000000 | ✅ | ✅ (04524) | ✅ Metropolitan city / 광역시 | ✅ County / 군 | 10% VAT (부가세) ✅ | Always | ❌ |
| KW | Kuwait | — | +965 | ✅ [000] [00000] | ✅ 500 12345 | ✅ | ✅ (13001) | ✅ Governorate / محافظة | ❌ | None ✅ | Seller never collects | ❌ |
| KY ❗ | Cayman Islands | — | +1 (345) | ✅ ([000]) [000]-[0000] | ✅ (345) 323-1234 | ✅ | ❌ | ❌ | ❌ | None ✅ | Seller never collects | ❌ |
| KZ | Kazakhstan | — | +7 | ✅ [000] [000] [0000] | ✅ 771 000 9998 | ✅ | ✅ (010000) | ✅ Region / Облыс | ❌ | 12% VAT (ҚҚС) ✅ | Always | ❌ |
| LA | Laos | — | +856 | ✅ [0000000000] | ✅ 2023123456 | ✅ | ✅ (01000) | ✅ Province / ແຂວງຂອງປະເທດລາວ | ✅ District / ເມືອງ | 10% VAT ✅ | Always | ❌ |
| LB | Lebanon | — | +961 | ✅ [00] [000] [000] | ✅ 71 123 456 | ✅ | ✅ (11072020) | ✅ Governorate / محافظة | ❌ | 11% VAT ✅ | Always | ❌ |
| LC ❗ | Saint Lucia | — | +1 (758) | ✅ ([000]) [000]-[0000] | ✅ (758) 284-5678 | ✅ | ❌ | ✅ Quarter / Quarter | ❌ | 12.5% VAT ✅ | Always | ❌ |
| LI | Liechtenstein | — | +423 | ✅ [000] [000] [000] | ✅ 660 234 567 | ✅ | ✅ (9490) | ✅ Municipality / Gemeinde | ❌ | 8.1% VAT (MWST) ✅ | CHF 100,000 | ❌ |
| LK | Sri Lanka | — | +94 | ✅ [000000000] | ✅ 712345678 | ✅ | ✅ (00100) | ✅ Province / පළාත | ✅ District / පරිපාලන දිස්ත්රික්කය | 18% VAT ✅ | Always | ❌ |
| LR | Liberia | — | +231 | ✅ [000000000] | ✅ 770123456 | ✅ | ✅ (1000) | ✅ County / County | ❌ | 10% GST ✅ | Always | ❌ |
| LS | Lesotho | — | +266 | ✅ [0000] [0000] | ✅ 5012 3456 | ✅ | ✅ (100) | ✅ District / District | ❌ | 15% VAT ✅ | Always | ❌ |
| LT | Lithuania | — | +370 | ✅ [000] [00] [000] | ✅ 612 34 567 | ✅ | ✅ (01001) | ✅ District municipality / Rajono savivaldybė | ✅ Eldership / Seniūnija | 21% VAT (PVM) ✅ | Always | ❌ |
| LU | Luxembourg | — | +352 | ✅ [000] [000] [000] | ✅ 621 123 456 | ✅ | ✅ (1009) | ✅ Canton / Kanton | ✅ Municipality / Gemeng | 17% VAT (TVA) ✅ | Always | ❌ |
| LV | Latvia | — | +371 | ✅ [00] [000] [000] | ✅ 21 234 567 | ✅ | ✅ (1010) | ✅ Municipality / Novads | ✅ Parish / Pagasts | 21% VAT (PVN) ✅ | Always | ❌ |
| LY | Libya | — | +218 | ✅ [000000000] | ✅ 912345678 | ✅ | ❌ | ✅ District / شعبية | ❌ | None ✅ | Seller never collects | ❌ |
| MA | Morocco | — | +212 | ✅ [000000000] | ✅ 650123456 | ✅ | ✅ (10000) | ✅ Region / جهة | ✅ Province / إقليم | 20% VAT (TVA) ✅ | Always | ❌ |
| MC | Monaco | — | +377 | ✅ [000000000] | ✅ 612345678 | ✅ | ✅ (98000) | ✅ Commune / Commune | ❌ | 20% VAT (TVA) ✅ | Always | ❌ |
| MD | Moldova | — | +373 | ✅ [00000000] | ✅ 62112345 | ✅ | ✅ (MD-2001) | ✅ District / Raion | ✅ Village / Sat | 20% VAT (TVA) ✅ | MDL 1,200,000 | ❌ |
| ME | Montenegro | — | +382 | ✅ [00] [000] [000] | ✅ 67 123 456 | ✅ | ✅ (81000) | ✅ Municipality / Општина | ❌ | 21% VAT (PDV) ✅ | EUR 30,000 | ❌ |
| MF | Saint Martin | — | +590 | ✅ [000000000] | ✅ 690001234 | ✅ | ✅ (97150) | ❌ | ❌ | None ✅ | Seller never collects | ❌ |
| MG | Madagascar | — | +261 | ✅ [000000000] | ✅ 321234567 | ✅ | ✅ (101) | ✅ Province / Province | ✅ District / District | 20% VAT (TVA) ✅ | Always | ❌ |
| MH | Marshall Islands | — | +692 | ✅ [000]-[0000] | ✅ 235-1234 | ✅ | ✅ (96960-0001) | ❓ Reef island (en only) | ❌ | None ✅ | Seller never collects | ❌ |
| MK | North Macedonia | — | +389 | ✅ [00000000] | ✅ 72345678 | ✅ | ✅ (1000) | ✅ Municipality / Општина | ✅ Municipality / Општина | 18% VAT (DDV) ✅ | MKD 2,000,000 | ❌ |
| ML | Mali | — | +223 | ✅ [00] [00] [00] [00] | ✅ 65 01 23 45 | ✅ | ❌ | ✅ Region / Régions | ✅ Human settlement / Établissement humain | 18% VAT (TVA) ✅ | Always | ❌ |
| MM | Myanmar | — | +95 | ✅ [00000000] | ✅ 92123456 | ✅ | ✅ (11181) | ✅ Region / တိုင်းဒေသကြီး | ❌ | 5% Sales Tax (CT) ✅ | Always | ❌ |
| MN | Mongolia | — | +976 | ✅ [0000] [0000] | ✅ 8812 3456 | ✅ | ✅ (15160) | ✅ Province / Аймаг | ✅ District / Сум | 10% VAT (НӨАТ) ✅ | Always | ❌ |
| MO | Macao | — | +853 | ✅ [0000] [0000] | ✅ 6612 3456 | ✅ | ✅ (999078) | ❌ | ❌ | None ✅ | Seller never collects | ❌ |
| MP ❗ | Northern Mariana Islands | — | +1 (670) | ✅ ([000]) [000]-[0000] | ✅ (670) 234-5678 | ✅ | ✅ (96950) | ❓ Municipality (en only) | ❌ | None ✅ | Seller never collects | ❌ |
| MQ | Martinique | — | +596 | ✅ [000000000] | ✅ 696201234 | ✅ | ✅ (97200) | ✅ Commune / Commune | ✅ Canton / Canton | 8.5% VAT (TVA) ✅ | Always | ❌ |
| MR | Mauritania | — | +222 | ✅ [00] [00] [00] [00] | ✅ 22 12 34 56 | ✅ | ❌ | ✅ Region / ولاية | ✅ Department / مقاطعة | 16% VAT (TVA) ✅ | Always | ❌ |
| MS ❗ | Montserrat | — | +1 (664) | ✅ ([000]) [000]-[0000] | ✅ (664) 492-3456 | ✅ | ❌ | ❌ | ❌ | None ✅ | Seller never collects | ❌ |
| MT | Malta | — | +356 | ✅ [0000] [0000] | ✅ 9912 3456 | ✅ | ✅ (VLT 1117) | ✅ Region / Reġjuni ta | ✅ Town / Raħal | 18% VAT ✅ | Always | ❌ |
| MU | Mauritius | — | +230 | ✅ [0000] [0000] | ✅ 5251 2345 | ✅ | ❌ | ✅ District / District | ❌ | 15% VAT ✅ | Always | ❌ |
| MV | Maldives | — | +960 | ✅ [000]-[0000] | ✅ 771-2345 | ✅ | ✅ (20026) | ✅ Atoll / އަތޮޅުތައް | ❌ | 8% GST ✅ | Always | ❌ |
| MW | Malawi | — | +265 | ✅ [000000000] | ✅ 991234567 | ✅ | ✅ (207401) | ❓ Region (en only) | ✅ District / Madera | 16.5% VAT ✅ | Always | ❌ |
| MX | Mexico | — | +52 | ✅ [000] [000] [0000] | ✅ 222 123 4567 | ✅ | ✅ (06000) | ✅ State / Estado | ✅ Municipality / Municipio | 16% VAT (IVA) ✅ | Always | ❌ |
| MY | Malaysia | — | +60 | ✅ [000000000] | ✅ 123456789 | ✅ | ✅ (50000) | ✅ State / Negeri | ✅ Division / Bahagian | 8% SST ✅ | Always | ❌ |
| MZ | Mozambique | — | +258 | ✅ [00] [000] [0000] | ✅ 82 123 4567 | ✅ | ✅ (1100) | ✅ Province / Província | ✅ District / Distritos | 16% VAT (IVA) ✅ | Always | ❌ |
| NA | Namibia | — | +264 | ✅ [000000000] | ✅ 811234567 | ✅ | ❌ | ✅ Region / Region | ✅ Constituency / Constituency | 15% VAT ✅ | Always | ❌ |
| NC | New Caledonia | — | +687 | ✅ [00].[00].[00] | ✅ 75.12.34 | ✅ | ✅ (98800) | ✅ Commune / Commune | ❌ | 11% VAT (TGC) ✅ | Always | ❌ |
| NE | Niger | — | +227 | ✅ [00] [00] [00] [00] | ✅ 93 12 34 56 | ✅ | ✅ (8000) | ✅ Region / Région | ✅ Department / Département | 19% VAT (TVA) ✅ | Always | ❌ |
| NF | Norfolk Island | — | +672 | ✅ [0] [00000] | ✅ 3 81234 | ✅ | ✅ (2899) | ❌ | ❌ | None ✅ | Seller never collects | ❌ |
| NG | Nigeria | — | +234 | ✅ [0000000000] | ✅ 8021234567 | ✅ | ✅ (900001) | ✅ State / State | ✅ Local government area / Local government area | 7.5% VAT ✅ | Always | ❌ |
| NI | Nicaragua | — | +505 | ✅ [0000] [0000] | ✅ 8123 4567 | ✅ | ✅ (11001) | ✅ Department / Departamento | ✅ Municipality / Municipio | 15% VAT (IVA) ✅ | Always | ❌ |
| NL | The Netherlands | — | +31 | ✅ [0] [0000] [0000] | ✅ 6 1234 5678 | ✅ | ✅ (1234 AB) | ✅ Country / Land | ✅ Province / Provincie | 21% VAT (BTW) ✅ | Always | ✅ VAT (BTW) (NL123456789B01) |
| NO | Norway | — | +47 | ✅ [000] [00] [000] | ✅ 912 34 567 | ✅ | ✅ (0010) | ❓ County (en only) | ❓ Municipality (en only) | 25% VAT (MVA) ✅ | NOK 50,000 | ❌ |
| NP | Nepal | — | +977 | ✅ [000]-[0000000] | ✅ 984-1234567 | ✅ | ✅ (44600) | ✅ Province / प्रदेश | ❌ | 13% VAT ✅ | Always | ❌ |
| NR | Nauru | — | +674 | ✅ [000] [0000] | ✅ 555 1234 | ✅ | ✅ (NRU68) | ❓ District (en only) | ❌ | None ✅ | Seller never collects | ❌ |
| NU | Niue | — | +683 | ✅ [000] [0000] | ✅ 888 4012 | ✅ | ✅ (9974) | ❌ | ❌ | None ✅ | Seller never collects | ❌ |
| NZ | New Zealand | — | +64 | ✅ [00] [000] [0000] | ✅ 21 123 4567 | ✅ | ✅ (6011) | ✅ Region / Region | ✅ District / District | 15% GST ✅ | NZD 60,000 | ❌ |
| OM | Oman | — | +968 | ✅ [0000] [0000] | ✅ 9212 3456 | ✅ | ✅ (100) | ✅ Governorate / محافظة | ❌ | 5% VAT ✅ | Always | ❌ |
| PA | Panama | — | +507 | ✅ [0000]-[0000] | ✅ 6123-4567 | ✅ | ✅ (0801) | ✅ Province / Provincia | ✅ District / Distrito | 7% VAT (ITBMS) ✅ | Always | ❌ |
| PE | Peru | — | +51 | ✅ [000] [000] [000] | ✅ 912 345 678 | ✅ | ✅ (15001) | ✅ Department / Departmento | ✅ Province / Provincia | 18% VAT (IGV) ✅ | Always | ❌ |
| PF | French Polynesia | — | +689 | ✅ [00] [00] [00] [00] | ✅ 87 12 34 56 | ✅ | ✅ (98714) | ✅ Commune / Commune | ✅ Commune / Commune | 16% VAT (TVA) ✅ | Always | ❌ |
| PG | Papua New Guinea | — | +675 | ✅ [0000] [0000] | ✅ 7012 3456 | ✅ | ✅ (111) | ✅ Province / Province | ✅ District / District | 10% GST ✅ | Always | ❌ |
| PH | Philippines | — | +63 | ✅ [000] [000] [0000] | ✅ 917 123 4567 | ✅ | ✅ (1000) | ✅ Region / Rehiyon | ✅ Province / Lalawigan | 12% VAT ✅ | PHP 3,000,000 | ❌ |
| PK | Pakistan | — | +92 | ✅ [0000000000] | ✅ 3012345678 | ✅ | ✅ (44000) | ✅ Province / صوبہ | ✅ Division / ڈویژن | 18% GST ✅ | Always | ❌ |
| PL | Poland | — | +48 | ✅ [000] [000] [000] | ✅ 512 345 678 | ✅ | ✅ (00-001) | ✅ Voivodeship / Województwo | ✅ Powiat / Powiat | 23% VAT ✅ | Always | ✅ VAT (PL1234567890) |
| PM | Saint Pierre and Miquelon | — | +508 | ✅ [000000] | ✅ 551234 | ✅ | ✅ (97500) | ✅ Commune / Commune | ✅ Island / Île | None ✅ | Seller never collects | ❌ |
| PN | Pitcairn | — | +64 | ✅ [00] [000] [0000] | ✅ 21 234 5678 | ✅ | ✅ (PCRN 1ZZ) | ❌ | ❌ | None ✅ | Seller never collects | ❌ |
| PR | Puerto Rico | — | +1 | ✅ ([000]) [000]-[0000] | ✅ (787) 234-5678 | ✅ | ✅ (00901) | ✅ Municipality / Municipality | ❌ | 11.5% Sales Tax (IVU) ✅ | Always | ❌ |
| PS | Palestinian Territory | — | +970 | ✅ [000000000] | ✅ 599123456 | ✅ | ❌ | ✅ Governorate / محافظة | ✅ Governorate / محافظة | 16% VAT ✅ | Always | ❌ |
| PT | Portugal | — | +351 | ✅ [000] [000] [000] | ✅ 912 345 678 | ✅ | ✅ (1000-001) | ✅ District / Distrito | ✅ Municipality / Município | 23% VAT (IVA) ✅ | Always | ❌ |
| PW | Palau | — | +680 | ✅ [000] [0000] | ✅ 620 1234 | ✅ | ✅ (96940) | ❓ State (en only) | ❌ | 10% GST (PGST) ✅ | Always | ❌ |
| PY | Paraguay | — | +595 | ✅ [0000] [000] [00] | ✅ 9614 567 89 | ✅ | ✅ (1101) | ✅ Department / Departamento | ✅ Municipality / Municipio | 10% VAT (IVA) ✅ | Always | ❌ |
| QA | Qatar | — | +974 | ✅ [0000] [0000] | ✅ 3312 3456 | ✅ | ❌ | ✅ Municipality / بلدية | ✅ Village / قرية | None ✅ | Seller never collects | ❌ |
| RE | Reunion | — | +262 | ✅ [000000000] | ✅ 692123456 | ✅ | ✅ (97400) | ✅ Arrondissement / Arrondissement | ✅ Canton / Canton | 8.5% VAT (TVA) ✅ | Always | ❌ |
| RO | Romania | — | +40 | ✅ [000] [000] [000] | ✅ 712 345 678 | ✅ | ✅ (010011) | ✅ County / Județ | ✅ Commune / Comună | 19% VAT (TVA) ✅ | Always | ❌ |
| RS | Serbia | — | +381 | ✅ [000000000] | ✅ 601234567 | ✅ | ✅ (11000) | ✅ District / Округ | ✅ Municipality / city / Општина / град | 20% VAT (PDV) ✅ | RSD 8,000,000 | ❌ |
| RU | Russia | — | +7 | ✅ [000] [000]-[00]-[00] | ✅ 912 345-67-89 | ✅ | ✅ (101000) | ✅ Federal subject / Субъект | ✅ Municipal district / Муниципальный район | 20% VAT (НДС) ✅ | Always | ❌ |
| RW | Rwanda | — | +250 | ✅ [000000000] | ✅ 720123456 | ✅ | ❌ | ✅ Province / Intara | ✅ District / Uturere tw | 18% VAT ✅ | Always | ❌ |
| SA | Saudi Arabia | — | +966 | ✅ [000000000] | ✅ 512345678 | ✅ | ✅ (11564) | ✅ Province / منطقة | ❌ | 15% VAT ✅ | Always | ❌ |
| SB | Solomon Islands | — | +677 | ✅ [00] [00000] | ✅ 74 21234 | ✅ | ❌ | ✅ Province / Province | ❌ | 10% GST ✅ | Always | ❌ |
| SC | Seychelles | — | +248 | ✅ [0] [000] [000] | ✅ 2 510 123 | ✅ | ❌ | ✅ District / District | ❌ | 15% VAT ✅ | Always | ❌ |
| SD | Sudan | — | +249 | ✅ [000000000] | ✅ 911231234 | ✅ | ✅ (11111) | ✅ State / ولاية | ❌ | 17% VAT ✅ | Always | ❌ |
| SE | Sweden | — | +46 | ✅ [000000000] | ✅ 701234567 | ✅ | ✅ (100 05) | ✅ County / Län | ✅ Municipality / Kommun | 25% VAT (Moms) ✅ | Always | ❌ |
| SG | Singapore | — | +65 | ✅ [0000] [0000] | ✅ 8123 4567 | ✅ | ✅ (238801) | ❌ | ❌ | 9% GST ✅ | SGD 1,000,000 | ❌ |
| SH | Saint Helena | — | +290 | ✅ [00000] | ✅ 51234 | ✅ | ✅ (STHL1ZZ) | ✅ Island / Island | ❌ | None ✅ | Seller never collects | ❌ |
| SI | Slovenia | — | +386 | ✅ [00] [000] [000] | ✅ 31 234 567 | ✅ | ✅ (1000) | ✅ Municipality / Občina | ❌ | 22% VAT (DDV) ✅ | Always | ❌ |
| SJ ❗ | Svalbard and Jan Mayen | — | +47 (79) | ✅ [00] [00] [00] [00] | ✅ 41 23 45 67 | ✅ | ✅ (9170) | ❌ | ❌ | None ✅ | Seller never collects | ❌ |
| SK | Slovakia | — | +421 | ✅ [000] [000] [000] | ✅ 912 345 678 | ✅ | ✅ (811 01) | ✅ Region / Kraje | ✅ District / Okres | 23% VAT (DPH) ✅ | Always | ❌ |
| SL | Sierra Leone | — | +232 | ✅ [00000000] | ✅ 25123456 | ✅ | ❌ | ✅ Province / Province | ❌ | 15% GST ✅ | Always | ❌ |
| SM | San Marino | — | +378 | ✅ [00] [00] [00] [00] | ✅ 66 66 12 12 | ✅ | ✅ (47890) | ✅ Municipality / Castelli | ❌ | 17% VAT (Imposta) ✅ | Always | ❌ |
| SN | Senegal | — | +221 | ✅ [00] [000] [00] [00] | ✅ 70 123 45 67 | ✅ | ✅ (10000) | ✅ Region / Région | ✅ Department / Département | 18% VAT (TVA) ✅ | Always | ❌ |
| SO | Somalia | — | +252 | ✅ [0] [0000000] | ✅ 7 1123456 | ✅ | ✅ (JH09010) | ✅ Region / Gobolada | ❓ District (en only) | None ✅ | Seller never collects | ❌ |
| SR | Suriname | — | +597 | ✅ [000]-[0000] | ✅ 741-2345 | ✅ | ❌ | ✅ District / District | ✅ Ressort / Ressort | 10% VAT ✅ | Always | ❌ |
| SS | South Sudan | — | +211 | ✅ [000000000] | ✅ 977123456 | ✅ | ❌ | ✅ State / State | ❌ | 18% VAT ✅ | Always | ❌ |
| ST | Sao Tome and Principe | — | +239 | ✅ [000] [0000] | ✅ 981 2345 | ✅ | ❌ | ✅ Electoral unit / Círculo eleitoral | ✅ District / Distritos | 15% VAT (IVA) ✅ | Always | ❌ |
| SV | El Salvador | — | +503 | ✅ [0000] [0000] | ✅ 7012 3456 | ✅ | ✅ (1101) | ✅ Department / Departamento | ✅ Municipality / Municipio | 13% VAT (IVA) ✅ | Always | ❌ |
| SX ❗ | Sint Maarten | — | +1 (721) | ✅ ([000]) [000]-[0000] | ✅ (721) 520-5678 | ✅ | ❌ | ❌ | ❌ | 5% Sales Tax (TOT) ✅ | Always | ❌ |
| SY | Syria | — | +963 | ✅ [000] [000] [000] | ✅ 944 567 890 | ✅ | ❌ | ✅ Governorate / محافظة | ✅ District / منطقة | None ✅ | Seller never collects | ❌ |
| SZ | Eswatini | — | +268 | ✅ [0000] [0000] | ✅ 7612 3456 | ✅ | ✅ (H100) | ✅ Region / Region | ❌ | 15% VAT ✅ | Always | ❌ |
| TC ❗ | Turks and Caicos Islands | — | +1 (649) | ✅ ([000]) [000]-[0000] | ✅ (649) 231-1234 | ✅ | ✅ (TKCA 1ZZ) | ❌ | ❌ | None ✅ | Seller never collects | ❌ |
| TD | Chad | — | +235 | ✅ [00] [00] [00] [00] | ✅ 63 01 23 45 | ✅ | ✅ (TKCA 1ZZ) | ✅ Province / Région | ✅ Department / Départements | 18% VAT (TVA) ✅ | Always | ❌ |
| TF | French Southern Territories | — | +262 | ✅ [000] [00] [00] [00] | ✅ 639 12 34 56 | ✅ | ❌ | ✅ District / District | ✅ Island / Île | None ✅ | Seller never collects | ❌ |
| TG | Togo | — | +228 | ✅ [00] [00] [00] [00] | ✅ 90 11 23 45 | ✅ | ❌ | ✅ Region / Région | ✅ Prefecture / Préfecture | 18% VAT (TVA) ✅ | Always | ❌ |
| TH | Thailand | — | +66 | ✅ [00] [000] [0000] | ✅ 81 234 5678 | ✅ | ✅ (10200) | ✅ Province / จังหวัด | ✅ Amphoe / อำเภอ | 7% VAT ✅ | Always | ❌ |
| TJ | Tajikistan | — | +992 | ✅ [00] [000] [0000] | ✅ 91 712 3456 | ✅ | ✅ (734000) | ✅ Region / Вилоят | ✅ District / Ноҳия | 14% VAT ✅ | Always | ❌ |
| TK | Tokelau | — | +690 | ✅ [0000] | ✅ 7290 | ✅ | ❌ | ❌ | ❌ | None ✅ | Seller never collects | ❌ |
| TL | Timor Leste | — | +670 | ✅ [0000] [0000] | ✅ 7721 2345 | ✅ | ❌ | ✅ Municipality / Munisipiu | ❌ | None ✅ | Seller never collects | ❌ |
| TM | Turkmenistan | — | +993 | ✅ [00000000] | ✅ 66123456 | ✅ | ✅ (744000) | ✅ Region / Welaýatlary | ✅ District / Etraplar we şäherler | 15% VAT ✅ | Always | ❌ |
| TN | Tunisia | — | +216 | ✅ [00] [000] [000] | ✅ 20 123 456 | ✅ | ✅ (1000) | ✅ Governorate / ولاية | ✅ Delegation / معتمدية | 19% VAT (TVA) ✅ | Always | ❌ |
| TO | Tonga | — | +676 | ✅ [000] [0000] | ✅ 771 5123 | ✅ | ❌ | ❓ Division (en only) | ❌ | 15% Consumption Tax (CT) ✅ | Always | ❌ |
| TR | Turkey | — | +90 | ✅ [000] [000] [00] [00] | ✅ 501 234 56 78 | ✅ | ✅ (06010) | ✅ Province / Il | ✅ District / Ilçe | 20% VAT (KDV) ✅ | Always | ❌ |
| TT ❗ | Trinidad and Tobago | — | +1 (868) | ✅ ([000]) [000]-[0000] | ✅ (868) 291-1234 | ✅ | ❌ | ✅ Regional corporation / Regional corporation | ❌ | 12.5% VAT ✅ | Always | ❌ |
| TV | Tuvalu | — | +688 | ✅ [00] [0000] | ✅ 90 1234 | ✅ | ❌ | ❌ | ❌ | None ✅ | Seller never collects | ❌ |
| TW | Taiwan | — | +886 | ✅ [000000000] | ✅ 912345678 | ✅ | ✅ (10001) | ✅ City / 城市 | ✅ District / 區 | 5% Business Tax (營業稅) ✅ | TWD 480,000 | ❌ |
| TZ | Tanzania | — | +255 | ✅ [000000000] | ✅ 621234567 | ✅ | ❌ | ✅ Region / Mikoa | ✅ District / Wilaya za | 18% VAT ✅ | Always | ❌ |
| UA | Ukraine | — | +380 | ✅ [00] [000] [00] [00] | ✅ 67 123 45 67 | ✅ | ✅ (01001) | ✅ Oblast / Область | ✅ Raion / Район | 20% VAT (PDV) ✅ | UAH 1,000,000 | ❌ |
| UG | Uganda | — | +256 | ✅ [000000000] | ✅ 712345678 | ✅ | ❌ | ✅ District / District | ❌ | 18% VAT ✅ | Always | ❌ |
| UM | United States Minor Outlying Islands | — | +1 | ✅ ([000]) [000]-[0000] | ✅ (201) 555-0123 | ✅ | ❌ | ✅ Insular area / Insular area | ❌ | None ✅ | Seller never collects | ❌ |
| US | United States | — | +1 | ✅ ([000]) [000]-[0000] | ✅ (201) 555-0123 | ✅ | ✅ (10001) | ✅ State / State | ✅ County / County | 2.9–7.25% Sales Tax (regional) ✅ | Seller never collects | ✅ Sales Tax (12-3456789) |
| US-AL | United States — Alabama | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 4% Sales Tax ✅ | ↳ | ↳ |
| US-AK | United States — Alaska | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | None ✅ | ↳ | ↳ |
| US-AZ | United States — Arizona | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 5.6% Sales Tax ✅ | ↳ | ↳ |
| US-AR | United States — Arkansas | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 6.5% Sales Tax ✅ | ↳ | ↳ |
| US-CA | United States — California | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 7.25% Sales Tax ✅ | ↳ | ↳ |
| US-CO | United States — Colorado | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 2.9% Sales Tax ✅ | ↳ | ↳ |
| US-CT | United States — Connecticut | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 6.35% Sales Tax ✅ | ↳ | ↳ |
| US-DC | United States — District of Columbia | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 6% Sales Tax ✅ | ↳ | ↳ |
| US-DE | United States — Delaware | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | None ✅ | ↳ | ↳ |
| US-FL | United States — Florida | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 6% Sales Tax ✅ | ↳ | ↳ |
| US-GA | United States — Georgia | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 4% Sales Tax ✅ | ↳ | ↳ |
| US-HI | United States — Hawaii | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 4% Sales Tax ✅ | ↳ | ↳ |
| US-ID | United States — Idaho | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 6% Sales Tax ✅ | ↳ | ↳ |
| US-IL | United States — Illinois | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 6.25% Sales Tax ✅ | ↳ | ↳ |
| US-IN | United States — Indiana | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 7% Sales Tax ✅ | ↳ | ↳ |
| US-IA | United States — Iowa | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 6% Sales Tax ✅ | ↳ | ↳ |
| US-KS | United States — Kansas | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 6.5% Sales Tax ✅ | ↳ | ↳ |
| US-KY | United States — Kentucky | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 6% Sales Tax ✅ | ↳ | ↳ |
| US-LA | United States — Louisiana | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 4.45% Sales Tax ✅ | ↳ | ↳ |
| US-ME | United States — Maine | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 5.5% Sales Tax ✅ | ↳ | ↳ |
| US-MD | United States — Maryland | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 6% Sales Tax ✅ | ↳ | ↳ |
| US-MA | United States — Massachusetts | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 6.25% Sales Tax ✅ | ↳ | ↳ |
| US-MI | United States — Michigan | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 6% Sales Tax ✅ | ↳ | ↳ |
| US-MN | United States — Minnesota | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 6.875% Sales Tax ✅ | ↳ | ↳ |
| US-MS | United States — Mississippi | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 7% Sales Tax ✅ | ↳ | ↳ |
| US-MO | United States — Missouri | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 4.225% Sales Tax ✅ | ↳ | ↳ |
| US-MT | United States — Montana | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | None ✅ | ↳ | ↳ |
| US-NE | United States — Nebraska | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 5.5% Sales Tax ✅ | ↳ | ↳ |
| US-NV | United States — Nevada | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 6.85% Sales Tax ✅ | ↳ | ↳ |
| US-NH | United States — New Hampshire | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | None ✅ | ↳ | ↳ |
| US-NJ | United States — New Jersey | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 6.625% Sales Tax ✅ | ↳ | ↳ |
| US-NM | United States — New Mexico | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 5% Sales Tax ✅ | ↳ | ↳ |
| US-NY | United States — New York | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 4% Sales Tax ✅ | ↳ | ↳ |
| US-NC | United States — North Carolina | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 4.75% Sales Tax ✅ | ↳ | ↳ |
| US-ND | United States — North Dakota | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 5% Sales Tax ✅ | ↳ | ↳ |
| US-OH | United States — Ohio | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 5.75% Sales Tax ✅ | ↳ | ↳ |
| US-OK | United States — Oklahoma | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 4.5% Sales Tax ✅ | ↳ | ↳ |
| US-OR | United States — Oregon | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | None ✅ | ↳ | ↳ |
| US-PA | United States — Pennsylvania | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 6% Sales Tax ✅ | ↳ | ↳ |
| US-RI | United States — Rhode Island | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 7% Sales Tax ✅ | ↳ | ↳ |
| US-SC | United States — South Carolina | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 6% Sales Tax ✅ | ↳ | ↳ |
| US-SD | United States — South Dakota | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 4.5% Sales Tax ✅ | ↳ | ↳ |
| US-TN | United States — Tennessee | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 7% Sales Tax ✅ | ↳ | ↳ |
| US-TX | United States — Texas | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 6.25% Sales Tax ✅ | ↳ | ↳ |
| US-UT | United States — Utah | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 4.85% Sales Tax ✅ | ↳ | ↳ |
| US-VT | United States — Vermont | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 6% Sales Tax ✅ | ↳ | ↳ |
| US-VA | United States — Virginia | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 5.3% Sales Tax ✅ | ↳ | ↳ |
| US-WA | United States — Washington | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 6.5% Sales Tax ✅ | ↳ | ↳ |
| US-WV | United States — West Virginia | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 6% Sales Tax ✅ | ↳ | ↳ |
| US-WI | United States — Wisconsin | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 5% Sales Tax ✅ | ↳ | ↳ |
| US-WY | United States — Wyoming | — | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | ↳ | 4% Sales Tax ✅ | ↳ | ↳ |
| UY | Uruguay | — | +598 | ✅ [00000000] | ✅ 94231234 | ✅ | ✅ (11000) | ✅ Department / Departamento | ✅ Municipality / Municipio | 22% VAT (IVA) ✅ | Always | ❌ |
| UZ | Uzbekistan | — | +998 | ✅ [00] [000] [00] [00] | ✅ 91 234 56 78 | ✅ | ✅ (100000) | ✅ Region / Viloyatlari | ✅ District / Tuman | 12% VAT (QQS) ✅ | Always | ❌ |
| VA ❗ | Vatican | — | +39 (06698) | ✅ [000] [000] [0000] | ✅ 312 345 6789 | ✅ | ✅ (00120) | ❌ | ❌ | None ✅ | Seller never collects | ❌ |
| VC ❗ | Saint Vincent and the Grenadines | — | +1 (784) | ✅ ([000]) [000]-[0000] | ✅ (784) 430-1234 | ✅ | ❌ | ✅ Parish / Parish | ❌ | 16% VAT ✅ | Always | ❌ |
| VE | Venezuela | — | +58 | ✅ [0000000000] | ✅ 4121234567 | ✅ | ✅ (1010) | ✅ State / Estado | ✅ Municipality / Municipio | 16% VAT (IVA) ✅ | Always | ❌ |
| VG ❗ | British Virgin Islands | — | +1 (284) | ✅ ([000]) [000]-[0000] | ✅ (284) 300-1234 | ✅ | ❌ | ❌ | ❌ | None ✅ | Seller never collects | ❌ |
| VI ❗ | U.S. Virgin Islands | — | +1 (340) | ✅ ([000]) [000]-[0000] | ✅ (340) 642-1234 | ✅ | ✅ (00802) | ❌ | ❌ | None ✅ | Seller never collects | ❌ |
| VN | Vietnam | — | +84 | ✅ [00] [000] [0000] | ✅ 91 234 5678 | ✅ | ✅ (100000) | ✅ Province / Tỉnh | ✅ Rural district / Huyện | 10% VAT ✅ | Always | ❌ |
| VU | Vanuatu | — | +678 | ✅ [000] [0000] | ✅ 591 2345 | ✅ | ❌ | ✅ Province / Provens | ❌ | 15% VAT ✅ | Always | ❌ |
| WF | Wallis and Futuna | — | +681 | ✅ [00] [00] [00] | ✅ 82 12 34 | ✅ | ✅ (98600) | ❓ Customary kingdom (en only) | ❌ | None ✅ | Seller never collects | ❌ |
| WS | Samoa | — | +685 | ✅ [00] [00000] | ✅ 72 12345 | ✅ | ✅ (AS 96799) | ❓ District (en only) | ❌ | 15% VAT (VAGST) ✅ | Always | ❌ |
| XK | Kosovo | — | +383 | ✅ [00000000] | ✅ 43201234 | ✅ | ❌ | ✅ Municipality / Komunat | ❌ | 18% VAT (TVSH) ✅ | EUR 30,000 | ❌ |
| YE | Yemen | — | +967 | ✅ [000000000] | ✅ 712345678 | ✅ | ❌ | ✅ Governorate / محافظة | ✅ District / مديرية | 5% GST ✅ | Always | ❌ |
| YT ❗ | Mayotte | — | +262 (639) | ✅ [000000000] | ✅ 639012345 | ✅ | ✅ (97600) | ✅ Canton / Canton | ✅ Commune / Commune | None ✅ | Seller never collects | ❌ |
| ZA | South Africa | — | +27 | ✅ [000000000] | ✅ 711234567 | ✅ | ✅ (0001) | ✅ Province / Izifundazwe zaseNingizimu | ❓ District municipality (en only) | 15% VAT ✅ | Always | ❌ |
| ZM | Zambia | — | +260 | ✅ [000000000] | ✅ 955123456 | ✅ | ✅ (10101) | ✅ Province / Province | ❌ | 16% VAT ✅ | Always | ❌ |
| ZW | Zimbabwe | — | +263 | ✅ [000000000] | ✅ 712345678 | ✅ | ❌ | ✅ Province / Province | ❌ | 15% VAT ✅ | Always | ❌ |

<!-- COVERAGE_TABLE_END -->

## License

MIT © Ivan Stepanian
