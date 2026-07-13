---
"country-data-ts": patch
---

Split hand-curated division-type labels out of `data/countries.json` into `data/administrative-local-labels.json` and re-join them at generate time. GeoNames' fetch step no longer emits `administrativeLabels`, and `gen-countries.ts` / `gen-coverage-table.ts` now source the labels from the dedicated file. No change to the generated public data.
