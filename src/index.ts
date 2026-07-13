// country-data-ts — zero-dependency worldwide country, address, phone and tax
// reference data for TypeScript.
//
// This barrel re-exports all four domains. For smaller imports, use the
// per-domain entry points instead:
//   import { COUNTRY_DATA } from "country-data-ts/countries";
//   import { getCountryConfig } from "country-data-ts/address";
//   import { parseCountryFromE164 } from "country-data-ts/phone";
//   import { computeTaxOutcome } from "country-data-ts/tax";
//
// COUNTRY_CODES / CountryCode / isCountryCode originate in ./data/countries and
// are re-exported by every domain, so the star re-exports below resolve them to
// the same symbol (no ambiguity). isEUCountry originates in ./address and is
// re-exported by ./tax, so it too resolves to a single symbol. Ordering is
// alphabetical (biome-enforced).
export * from "./address";
export * from "./countries";
export * from "./phone";
export * from "./tax";
