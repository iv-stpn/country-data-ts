---
"country-data-ts": minor
---

Add level-2 administrative divisions and localized division names: new `divisions` module with `getLevel2Options`, `getLevel1/Level2LocalName(s)`, `hasLevel2Options`, `hasLocalNames`, and `pickLocalName` helpers. Data is tree-shakeable per-country. Sources: GeoNames (level-2 codes) and ISO 3166-2 (local names).
