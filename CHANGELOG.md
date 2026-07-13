# country-data-ts

## 0.2.0

### Minor Changes

- 289041b: Add level-2 administrative divisions and localized division names: new `divisions` module with `getLevel2Options`, `getLevel1/Level2LocalName(s)`, `hasLevel2Options`, `hasLocalNames`, and `pickLocalName` helpers. Data is tree-shakeable per-country. Sources: GeoNames (level-2 codes) and ISO 3166-2 (local names).
- 8b3aa72: Initial release: zero-dependency, tree-shakeable worldwide country, address and phone reference data for TypeScript (ISO 3166 countries, administrative divisions, postal-code patterns, calling codes and phone masks).
- 2bfc9ad: Export regional-tax helpers from the `tax` module: `REGIONAL_TAX_COUNTRY_CODES`, `REGIONAL_TAX_COUNTRY_REGIONS`, `isRegionalCountryCode`, and the `RegionalTaxCountryCode` type, so consumers can enumerate the countries whose consumption-tax rate varies by state/province and resolve their regions. Also export `COUNTRY_CODE_SET` from the `countries` module. Internal refactors to the GeoNames fetch and coverage-table generation scripts; no change to the generated public data.

### Patch Changes

- 1b8a10b: Split hand-curated division-type labels out of `data/countries.json` into `data/administrative-local-labels.json` and re-join them at generate time. GeoNames' fetch step no longer emits `administrativeLabels`, and `gen-countries.ts` / `gen-coverage-table.ts` now source the labels from the dedicated file. No change to the generated public data.
