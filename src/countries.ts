// Country reference data for every country GeoNames knows about (250 total),
// keyed by ISO 3166-1 alpha-2 code: currency, languages, postal-code regex, and
// the level-1/level-2 administrative-division labels (English + local).
//
// This is the `country-data-ts/countries` entry point. The underlying data is
// generated from data/countries.json by scripts/gen-countries.ts.
export {
  COUNTRY_CODES,
  COUNTRY_DATA,
  type CountryCode,
  type CountryData,
  type DivisionLabel,
  isCountryCode,
} from "./data/countries";
