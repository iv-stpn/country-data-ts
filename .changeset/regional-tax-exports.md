---
"country-data-ts": minor
---

Export regional-tax helpers from the `tax` module: `REGIONAL_TAX_COUNTRY_CODES`, `REGIONAL_TAX_COUNTRY_REGIONS`, `isRegionalCountryCode`, and the `RegionalTaxCountryCode` type, so consumers can enumerate the countries whose consumption-tax rate varies by state/province and resolve their regions. Also export `COUNTRY_CODE_SET` from the `countries` module. Internal refactors to the GeoNames fetch and coverage-table generation scripts; no change to the generated public data.
