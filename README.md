# country-data-ts

Zero-dependency, tree-shakeable worldwide **country, address, phone and tax** reference data for TypeScript.

One dataset, four domains, all keyed by ISO 3166-1 alpha-2 code:

- **countries** — 250 countries with currency, languages, postal-code regex and administrative-division labels (English + local), sourced from [GeoNames](https://www.geonames.org/) and [Wikidata](https://www.wikidata.org/).
- **address** — per-country address-form field configs (field order, labels, postal patterns, level-1 division `<select>` option lists).
- **phone** — calling codes, input masks, national-number validation regex, and E.164 parsing/formatting helpers with shared-calling-code (NANP `+1`, `+44`, `+7`, …) disambiguation.
- **tax** — per-country consumption-tax config (VAT/GST/sales-tax rates, EU OSS reverse-charge, US/CA regional rates, registration thresholds), tax-ID patterns, and a B2B/B2C outcome calculator.

No runtime dependencies. Ships ESM + CJS with full `.d.ts` types. Every domain is a separate entry point so bundlers tree-shake away what you don't import.

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

// or the barrel (pulls in all four):
import { COUNTRY_DATA, getCountryConfig, toE164, computeTaxOutcome } from "country-data-ts";
```

`CountryCode` — the ISO 3166-1 alpha-2 union of all 250 countries — is shared across every domain.

## countries

```ts
import { COUNTRY_DATA, COUNTRY_CODES, isCountryCode, type CountryCode } from "country-data-ts/countries";

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

| Export | Description |
| --- | --- |
| `COUNTRY_DATA` | `Record<CountryCode, CountryData>` — the full dataset. |
| `COUNTRY_CODES` | Readonly tuple of all 250 alpha-2 codes (source of `CountryCode`). |
| `CountryCode` | Literal union type of every alpha-2 code. |
| `CountryData` | Per-country record shape. |
| `DivisionLabel` | `{ en: string \| null; local: string \| null }`. |
| `isCountryCode(value)` | Type guard narrowing `string` to `CountryCode`. |

## address

```ts
import { getCountryConfig, resolveAddressField, isEUCountry } from "country-data-ts/address";

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

Field order, postal-code patterns and level-1 `<select>` option lists are curated per country; the postal-code pattern is derived from `COUNTRY_DATA` so it always matches GeoNames.

| Export | Description |
| --- | --- |
| `getCountryConfig(code)` | The `CountryAddressConfig` for a country (field order + postal pattern). |
| `COUNTRIES_ADDRESSES` | `Record<CountryCode, CountryAddressConfig>` — every country's config. |
| `COUNTRY_LIST` | All configs sorted by country name. |
| `ALL_COUNTRY_OPTIONS` | `{ code, name }[]` for every country, sorted by name. |
| `resolveAddressField(code, key, mode?)` | Render-ready field metadata (label, required, placeholder, options). |
| `addressFieldLabel(code, key)` | Base label for a field. |
| `isAddressFieldRequired(key, mode?)` | Whether a field is required in a given collection mode. |
| `isEUCountry(code)` | Whether the code is an EU member state. |

Types: `AddressValue`, `AddressValueInput`, `AddressCollectionMode`, `ValidationMode`, `AddressFieldKey`, `CountryAddressConfig`, `ResolvedAddressField`.

## phone

```ts
import { parseCountryFromE164, toE164, validateExtractedPhone, getCountryPhoneConfig, COUNTRY_PHONE_DATA } from "country-data-ts/phone";

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

| Export | Description |
| --- | --- |
| `COUNTRY_PHONE_DATA` | Readonly array of all 250 `CountryPhoneConfig` entries. |
| `getCountryPhoneConfig(code)` | Phone config for a country. |
| `getCountryPhoneCatalog(allowed?)` | The catalog, optionally filtered/ordered. |
| `parseCountryFromE164(value, countries, preferred?)` | Country implied by an E.164 number. |
| `toE164(national, config)` / `nationalFromE164(e164, config)` | Convert between national and E.164 form. |
| `validateExtractedPhone(national, config)` | Validate a national number against the country regex. |
| `applyPhoneMask` / `conformToMask` / `formatAreaCode` | Mask-based display formatting. |
| `getCountryFromLocale(locale)` | Extract the ISO region from a BCP-47 locale. |
| `getDefaultCountryForCallingCode` / `getUniqueAreaCode` / `nationalBelongsToCountry` | Shared-calling-code helpers. |
| `CALLING_CODE_DEFAULTS`, `CALLING_CODE_AREA_PREFIXES`, `NANP_AREA_CODE_TO_COUNTRY` | Disambiguation maps. |

Types: `CountryPhoneConfig`, `ResolvedPaste`.

## tax

Consumption-tax (VAT / GST / sales tax) rates, collection rules and tax-ID validation for every country. Models the EU one-stop-shop (B2B reverse charge), per-region rates (US states, CA provinces), zero-rated exports (UK) and nexus thresholds.

```ts
import { computeTaxOutcome, getTaxConfig, validateTax } from "country-data-ts/tax";

// EU: B2B with a valid VAT ID reverse-charges to 0%
computeTaxOutcome({ country: "IT", isBusiness: true, hasTaxId: true }).baseTax; // 0

// Consumer in an EU country: headline rate (OSS always carries a seller obligation)
computeTaxOutcome({ country: "FR", isBusiness: false, hasTaxId: false }).effectiveTax; // 20

// Per-region rate (US state sales tax)
computeTaxOutcome({ country: "US", isBusiness: false, hasTaxId: false, state: "CA" }).baseTax; // 7.25

getTaxConfig("DE")?.baseConsumerTax; // 19
validateTax("DE123456789", "DE");    // true  (VAT-number format check)
```

| Export | Description |
| --- | --- |
| `computeTaxOutcome(params)` | Full tax outcome (rate, reverse-charge, nexus gating, flags) for a transaction. |
| `computeConsumerTaxOutcome(params)` | B2C convenience wrapper. |
| `getTaxConfig(country)` | Country-level `TaxConfig` (rate, system, threshold, tax-ID metadata). |
| `hasRegionalTax(country)` | Whether the rate varies by state/province. |
| `getTaxLabel` / `getLocalTaxLabel(country, region?)` | English / local tax name (e.g. "VAT" / "TVA"). |
| `getBusinessTaxNumberLabel(country)` | Name of the registration identifier (e.g. "ABN", "EIN", "VAT Number"). |
| `validateTax(taxId, country)` / `normalizeTax(taxId)` | Validate / normalize a tax identifier. |
| `TAX_CONFIG` | `Record<CountryCode, CountryTaxEntry>` — the full table. |
| `isEUCountry(code)` | Whether the code is an EU member state (shared with the address domain). |

Types: `TaxValue`, `TaxType`, `TaxSystem`, `TaxConfig`, `CountryTaxEntry`, `TaxOutcome`, `TaxOutcomeFlags`, `TaxLabels`, `ComputeTaxOutcomeParams`, `ComputeConsumerTaxOutcomeParams`.

> Rates are curated as of 2025 and provided for reference; verify against the current statutory rate before relying on them for billing.

## Data sources & regeneration

The reference data originated from GeoNames (enriched with ISO 3166-2 codes and division-type labels from Wikidata), but the JSON in `data/` is now the **hand-maintained source of truth** — there is no live re-fetch step. Edit the JSON directly and regenerate the TypeScript in `src/data/`:

```sh
bun run gen:countries  # data/countries.json -> src/data/countries.ts
bun run gen:level1     # data/level1-administrative-codes.json (+ inline CURATED) -> src/data/level1-administrative-codes.ts
bun run gen            # gen:countries + gen:level1
```

Files under `data/`:

| File | Contents |
| --- | --- |
| `countries.json` | Per-country metadata (currency, languages, postal regex, division-type labels). |
| `level1-administrative-codes.json` | Level-1 divisions: `{ code, name, officialCode }` per country. |
| `level2-administrative-codes.json` | Level-2 divisions: `{ level1AdminCode, code, name, officialCode }` per country. |
| `administrative-local-names.json` | Global dictionary of localized division names, keyed by geonames path (`US-AL` for level-1, `AE-01.AE-101` = `level1AdminCode.code` for level-2). Value `{ code, localNames }`. Only divisions that actually have localized names appear. |

Localized names are factored out of the division lists into `administrative-local-names.json` so those lists stay lean and hand-editable. `data/` is not published to npm — only `dist/` ships.

`src/data/phone-data.ts` and `src/data/postal-codes.ts`, and the tax tables in `src/tax.ts`, are hand-maintained. Countries with no GeoNames admin1 list but an official ISO 3166-2 scheme (currently Singapore's 5 CDC districts) are added via the inline `CURATED` constant at the top of `scripts/gen-level1-codes.ts`, which `gen:level1` merges into the source per country — a curated division overrides one with the same code, and countries absent from the source are added wholesale. Add future documented subdivisions there and rerun `gen:level1`.

## Development

```sh
bun install
bun run build       # tsup -> dist (ESM + CJS + d.ts)
bun run test        # vitest
bun run typecheck   # tsc across src, scripts, tests
bun run lint        # biome
```

## License

MIT © Ivan Stepanian
