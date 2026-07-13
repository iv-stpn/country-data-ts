// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

import { type CountryCode, isCountryCode } from './data/countries';

type TaxValue = {
  taxId?: string;
  /** True when the business is presumed to hold a valid consumption tax identifier. */
  hasIdentifier?: boolean;
  /**
   * Consumption tax rate (%) that would apply if the seller had a nexus in the
   * resolved country/region — i.e. the headline rate for the buyer (accounting
   * for B2B reverse charge), ignoring whether the seller actually collects.
   */
  baseTax?: number;
  /**
   * Rate actually collectable: {@link baseTax} when the seller has a nexus in
   * the resolved country, 0 otherwise.
   */
  effectiveTax?: number;
  /** English name of the consumption tax (e.g. "VAT", "GST", "Sales Tax"), or null when the country has no consumption tax. */
  taxLabel?: string | null;
  /** Local name of the tax in the country's own language (e.g. "TVA", "MwSt", "消費税"), or null when the country has no consumption tax. */
  localTaxLabel?: string | null;
};

type TaxType = 'business' | 'individual' | 'either';

/**
 * How a jurisdiction's consumption tax is collected:
 * - "oss": EU one-stop-shop — B2B with a valid tax id reverse-charges to 0%.
 * - "country-specific": a single flat rate applies nationally.
 * - "region-specific": rate varies by state/province. A `state` code is required
 *   to resolve {@link TaxConfig.baseConsumerTax}; without one, `baseTax` is null
 *   and `flags.regionalRates` is set.
 */
type TaxSystem = 'oss' | 'country-specific' | 'region-specific';

type TaxConfig = {
  /** Standard consumer-facing rate; null = no consumption tax in this jurisdiction. */
  baseConsumerTax: number | null;
  taxSystem: TaxSystem;
  /** 0 = no threshold (always collect); positive = registration threshold in local currency; null = seller never collects. */
  collectionThreshold: number | null;
  /** Sales to this country are zero-rated exports (UK): invoice at 0%, buyer self-accounts. */
  zeroRatedExport?: boolean;
  /** Local / municipal rates may stack on top of the headline rate (US sales tax). */
  localSurcharge?: boolean;
  /** Consumption tax identifier metadata (prefix/pattern/example) for supported countries. */
  taxPrefix?: string;
  taxPattern?: RegExp;
  taxExample?: string;
};

/**
 * A country maps either to a single {@link TaxConfig}, or — for countries with
 * regional tax exceptions (US states, CA provinces) — to a record of region
 * code → config. Country-level fields are identical across a record's entries;
 * only `baseConsumerTax` varies by region.
 */
type CountryTaxEntry = TaxConfig | Record<string, TaxConfig>;

type TaxOutcomeFlags = {
  /** Buyer self-accounts via reverse charge or self-assessment. */
  buyerSelfAccounts: boolean;
  /** Rate varies by state / province — needs regional selection. */
  regionalRates: boolean;
  /** Local / municipal rates may stack on top of the state rate (US). */
  localSurcharge: boolean;
};

type TaxOutcome = {
  /** Collection system of the resolved country, or null when no country applies. */
  taxSystem: TaxSystem | null;
  /** English name of the consumption tax (e.g. "VAT", "GST", "Sales Tax"), or null when the country has no consumption tax. */
  taxLabel: string | null;
  /** Local name of the tax in the country's own language (e.g. "TVA", "MwSt", "消費税"), or null when the country has no consumption tax. */
  localTaxLabel: string | null;
  /**
   * Consumption tax rate (%) that would apply if the seller had a nexus in the
   * resolved jurisdiction — the headline rate for this transaction, reverse-
   * charge aware (B2B with a valid ID, or a zero-rated export → 0) but NOT
   * gated by nexus. null when the rate can't be resolved: no/unknown country,
   * a regional country with no state selected, or a jurisdiction with no
   * consumption tax.
   */
  baseTax: number | null;
  /**
   * Rate the seller actually charges: {@link baseTax} when the seller has nexus, 0
   * otherwise. null only when the seller has nexus and {@link baseTax}
   * itself can't be resolved.
   */
  effectiveTax: number | null;
  flags: TaxOutcomeFlags;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** EU member state on the one-stop-shop system (standard VAT, B2B reverse charge). */
function eu(rate: number): TaxConfig {
  return {
    baseConsumerTax: rate,
    taxSystem: 'oss',
    collectionThreshold: 0,
  };
}

/**
 * Flat-rate consumption tax outside the EU VAT area (a single rate applies to
 * everyone). Used for non-EU European countries and other developed economies.
 * `rate: null` models jurisdictions with no consumption tax at all.
 */
function flat(rate: number | null, collectionThreshold: number | null): TaxConfig {
  return {
    baseConsumerTax: rate,
    taxSystem: 'country-specific',
    collectionThreshold,
  };
}

/**
 * Build a region record for a country whose rate varies by state/province.
 * Country-level fields come from `base`; each region's `baseConsumerTax` comes
 * from `rates` (null = no tax in that region).
 */
function regional(base: Omit<TaxConfig, 'baseConsumerTax'> & { taxSystem: 'region-specific' }, rates: Record<string, number | null>): Record<string, TaxConfig> {
  const out: Record<string, TaxConfig> = {};
  for (const [code, rate] of Object.entries(rates)) out[code] = { ...base, baseConsumerTax: rate };
  return out;
}

// ---------------------------------------------------------------------------
// Main tax config table
// ---------------------------------------------------------------------------

const TAX_CONFIG: Record<CountryCode, CountryTaxEntry> = {
  // ---- EU member states (all 27, standard VAT rates as of 2025) -----------
  AT: {
    ...eu(20),
    taxPrefix: 'ATU',
    taxPattern: /^ATU\d{8}$/,
    taxExample: 'ATU12345678',
  },
  BE: {
    ...eu(21),
    taxPrefix: 'BE',
    taxPattern: /^BE0\d{9}$/,
    taxExample: 'BE0123456789',
  },
  BG: eu(20),
  CY: eu(19),
  CZ: eu(21),
  DE: {
    ...eu(19),
    taxPrefix: 'DE',
    taxPattern: /^DE\d{9}$/,
    taxExample: 'DE123456789',
  },
  DK: eu(25),
  EE: eu(22),
  ES: {
    ...eu(21),
    taxPrefix: 'ES',
    taxPattern: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/,
    taxExample: 'ESA12345678',
  },
  FI: eu(25.5),
  FR: {
    ...eu(20),
    taxPrefix: 'FR',
    taxPattern: /^FR[A-Z0-9]{2}\d{9}$/,
    taxExample: 'FRXX123456789',
  },
  GR: eu(24),
  HR: eu(25),
  HU: eu(27),
  IE: eu(23),
  IT: {
    ...eu(22),
    taxPrefix: 'IT',
    taxPattern: /^IT\d{11}$/,
    taxExample: 'IT12345678901',
  },
  LT: eu(21),
  LU: eu(17),
  LV: eu(21),
  MT: eu(18),
  NL: {
    ...eu(21),
    taxPrefix: 'NL',
    taxPattern: /^NL\d{9}B\d{2}$/,
    taxExample: 'NL123456789B01',
  },
  PL: {
    ...eu(23),
    taxPrefix: 'PL',
    taxPattern: /^PL\d{10}$/,
    taxExample: 'PL1234567890',
  },
  PT: eu(23),
  RO: eu(19),
  SE: eu(25),
  SI: eu(22),
  SK: eu(23),

  // ---- United Kingdom -------------------------------------------------------
  // Post-Brexit: outside EU VAT area. B2B with a UK VAT number → zero-rated
  // export (reverse charge on buyer); B2C → also zero-rated (UK VAT buyer-side).
  GB: {
    baseConsumerTax: 20,
    taxSystem: 'country-specific',
    collectionThreshold: null,
    zeroRatedExport: true,
    taxPrefix: 'GB',
    taxPattern: /^GB(\d{9}|\d{12}|(GD|HA)\d{3})$/,
    taxExample: 'GB123456789',
  },

  // ---- Switzerland ----------------------------------------------------------
  // Outside EU VAT area. Swiss MWST/TVA/IVA may apply on buyer's side.
  CH: {
    ...flat(8.1, 100_000),
    taxPrefix: 'CHE',
    taxPattern: /^CHE-\d{3}\.\d{3}\.\d{3}(MWST|TVA|IVA)?$/,
    taxExample: 'CHE-123.456.789MWST',
  },

  // ---- United States --------------------------------------------------------
  // No federal sales tax. Rate varies by state; null = no state sales tax.
  US: regional(
    {
      taxSystem: 'region-specific',
      collectionThreshold: null,
      localSurcharge: true,
      taxPrefix: '',
      taxPattern: /^\d{2}-\d{7}$/,
      taxExample: '12-3456789',
    },
    {
      AL: 4,
      AK: null, // No state sales tax (local may apply)
      AZ: 5.6,
      AR: 6.5,
      CA: 7.25,
      CO: 2.9,
      CT: 6.35,
      DC: 6,
      DE: null, // No sales tax
      FL: 6,
      GA: 4,
      HI: 4, // General Excise Tax (GET), not a traditional sales tax
      ID: 6,
      IL: 6.25,
      IN: 7,
      IA: 6,
      KS: 6.5,
      KY: 6,
      LA: 4.45,
      ME: 5.5,
      MD: 6,
      MA: 6.25,
      MI: 6,
      MN: 6.875,
      MS: 7,
      MO: 4.225,
      MT: null, // No sales tax
      NE: 5.5,
      NV: 6.85,
      NH: null, // No sales tax
      NJ: 6.625,
      NM: 5,
      NY: 4,
      NC: 4.75,
      ND: 5,
      OH: 5.75,
      OK: 4.5,
      OR: null, // No sales tax
      PA: 6,
      RI: 7,
      SC: 6,
      SD: 4.5,
      TN: 7,
      TX: 6.25,
      UT: 4.85,
      VT: 6,
      VA: 5.3,
      WA: 6.5,
      WV: 6,
      WI: 5,
      WY: 4,
    },
  ),

  // ---- Canada ---------------------------------------------------------------
  // GST (5%) + provincial HST or PST. Rate given is the combined effective rate.
  CA: regional(
    {
      taxSystem: 'region-specific',
      collectionThreshold: 30_000,
      taxPrefix: '',
      taxPattern: /^\d{9}RT\d{4}$/,
      taxExample: '123456789RT0001',
    },
    {
      AB: 5, // GST only
      BC: 12, // 5% GST + 7% PST
      MB: 12, // 5% GST + 7% PST
      NB: 15, // 15% HST
      NL: 15, // 15% HST
      NS: 15, // 15% HST
      NT: 5, // GST only
      NU: 5, // GST only
      ON: 13, // 13% HST
      PE: 15, // 15% HST
      QC: 14.975, // 5% GST + 9.975% QST
      SK: 11, // 5% GST + 6% PST
      YT: 5, // GST only
    },
  ),

  // ---- Australia ------------------------------------------------------------
  AU: {
    ...flat(10, 75_000),
    taxPrefix: '',
    taxPattern: /^\d{11}$/,
    taxExample: '12345678901',
  },

  // ---- Japan ----------------------------------------------------------------
  JP: {
    ...flat(10, 10_000_000),
    taxPrefix: 'T',
    taxPattern: /^T\d{13}$/,
    taxExample: 'T1234567890123',
  },

  // ---- Other European countries (non-EU) ------------------------------------
  NO: flat(25, 50_000), // Norway
  IS: flat(24, 2_000_000), // Iceland
  LI: flat(8.1, 100_000), // Liechtenstein (Swiss VAT union)
  AD: flat(4.5, 40_000), // Andorra
  MC: flat(20, 0), // Monaco (French VAT)
  SM: flat(17, 0), // San Marino
  AL: flat(20, 10_000_000), // Albania
  BA: flat(17, 50_000), // Bosnia and Herzegovina
  GE: flat(18, 100_000), // Georgia
  MD: flat(20, 1_200_000), // Moldova
  ME: flat(21, 30_000), // Montenegro
  MK: flat(18, 2_000_000), // North Macedonia
  RS: flat(20, 8_000_000), // Serbia
  TR: flat(20, 0), // Turkey (transcontinental)
  UA: flat(20, 1_000_000), // Ukraine
  XK: flat(18, 30_000), // Kosovo

  // ---- Other developed economies --------------------------------------------
  NZ: flat(15, 60_000), // New Zealand
  KR: flat(10, 0), // South Korea
  SG: flat(9, 1_000_000), // Singapore
  IL: flat(18, 0), // Israel
  TW: flat(5, 480_000), // Taiwan
  AE: flat(5, 375_000), // United Arab Emirates
  HK: flat(null, null), // Hong Kong (no consumption tax)
  MO: flat(null, null), // Macao (no consumption tax)
  PH: flat(12, 3_000_000), // Philippines
  IN: flat(18, 4_000_000), // India (standard GST rate)

  // ---- Rest of Europe (non-EU) ----------------------------------------------
  // Standard VAT/GST rates; jurisdictions with no consumption tax use a null
  // rate. Registration thresholds default to 0 (always collect on nexus) where
  // a reliable figure isn't curated.
  AX: flat(25.5, 0), // Åland (Finnish VAT applies locally)
  BY: flat(20, 0), // Belarus
  FO: flat(25, 0), // Faroe Islands
  GG: flat(null, null), // Guernsey
  GI: flat(null, null), // Gibraltar
  IM: flat(20, 0), // Isle of Man (UK VAT system)
  JE: flat(5, 0), // Jersey
  RU: flat(20, 0), // Russia
  SJ: flat(null, null), // Svalbard and Jan Mayen
  VA: flat(null, null), // Vatican City
  // ---- Africa ---------------------------------------------------------------
  AO: flat(14, 0), // Angola
  BF: flat(18, 0), // Burkina Faso
  BI: flat(18, 0), // Burundi
  BJ: flat(18, 0), // Benin
  BW: flat(14, 0), // Botswana
  CD: flat(16, 0), // DR Congo
  CF: flat(19, 0), // Central African Republic
  CG: flat(18, 0), // Republic of the Congo
  CI: flat(18, 0), // Ivory Coast
  CM: flat(19.25, 0), // Cameroon
  CV: flat(15, 0), // Cabo Verde
  DJ: flat(10, 0), // Djibouti
  DZ: flat(19, 0), // Algeria
  EG: flat(14, 0), // Egypt
  EH: flat(null, null), // Western Sahara
  ER: flat(null, null), // Eritrea
  ET: flat(15, 0), // Ethiopia
  GA: flat(18, 0), // Gabon
  GH: flat(15, 0), // Ghana
  GM: flat(15, 0), // Gambia
  GN: flat(18, 0), // Guinea
  GQ: flat(15, 0), // Equatorial Guinea
  GW: flat(17, 0), // Guinea-Bissau
  KE: flat(16, 0), // Kenya
  KM: flat(null, null), // Comoros
  LR: flat(10, 0), // Liberia
  LS: flat(15, 0), // Lesotho
  LY: flat(null, null), // Libya
  MA: flat(20, 0), // Morocco
  MG: flat(20, 0), // Madagascar
  ML: flat(18, 0), // Mali
  MR: flat(16, 0), // Mauritania
  MU: flat(15, 0), // Mauritius
  MW: flat(16.5, 0), // Malawi
  MZ: flat(16, 0), // Mozambique
  NA: flat(15, 0), // Namibia
  NE: flat(19, 0), // Niger
  NG: flat(7.5, 0), // Nigeria
  RE: flat(8.5, 0), // Reunion (French overseas reduced rate)
  RW: flat(18, 0), // Rwanda
  SC: flat(15, 0), // Seychelles
  SD: flat(17, 0), // Sudan
  SH: flat(null, null), // Saint Helena
  SL: flat(15, 0), // Sierra Leone
  SN: flat(18, 0), // Senegal
  SO: flat(null, null), // Somalia
  SS: flat(18, 0), // South Sudan
  ST: flat(15, 0), // Sao Tome and Principe
  SZ: flat(15, 0), // Eswatini
  TD: flat(18, 0), // Chad
  TG: flat(18, 0), // Togo
  TN: flat(19, 0), // Tunisia
  TZ: flat(18, 0), // Tanzania
  UG: flat(18, 0), // Uganda
  YT: flat(null, null), // Mayotte (VAT not applicable)
  ZA: flat(15, 0), // South Africa
  ZM: flat(16, 0), // Zambia
  ZW: flat(15, 0), // Zimbabwe

  // ---- Antarctica & uninhabited territories (no consumption tax) ------------
  AQ: flat(null, null), // Antarctica
  BV: flat(null, null), // Bouvet Island
  GS: flat(null, null), // South Georgia and the South Sandwich Islands
  HM: flat(null, null), // Heard Island and McDonald Islands
  TF: flat(null, null), // French Southern Territories
  // ---- Rest of Asia ---------------------------------------------------------
  AF: flat(null, null), // Afghanistan
  AM: flat(20, 0), // Armenia
  AZ: flat(18, 0), // Azerbaijan
  BD: flat(15, 0), // Bangladesh
  BH: flat(10, 0), // Bahrain
  BN: flat(null, null), // Brunei
  BT: flat(null, null), // Bhutan
  CC: flat(null, null), // Cocos Islands
  CN: flat(13, 0), // China
  ID: flat(11, 0), // Indonesia
  IO: flat(null, null), // British Indian Ocean Territory
  IQ: flat(null, null), // Iraq
  IR: flat(10, 0), // Iran
  JO: flat(16, 0), // Jordan
  KG: flat(12, 0), // Kyrgyzstan
  KH: flat(10, 0), // Cambodia
  KP: flat(null, null), // North Korea
  KW: flat(null, null), // Kuwait
  KZ: flat(12, 0), // Kazakhstan
  LA: flat(10, 0), // Laos
  LB: flat(11, 0), // Lebanon
  LK: flat(18, 0), // Sri Lanka
  MM: flat(5, 0), // Myanmar (commercial tax)
  MN: flat(10, 0), // Mongolia
  MV: flat(8, 0), // Maldives
  MY: flat(8, 0), // Malaysia (sales & service tax)
  NP: flat(13, 0), // Nepal
  OM: flat(5, 0), // Oman
  PK: flat(18, 0), // Pakistan
  PS: flat(16, 0), // Palestinian Territory
  QA: flat(null, null), // Qatar
  SA: flat(15, 0), // Saudi Arabia
  SY: flat(null, null), // Syria
  TH: flat(7, 0), // Thailand
  TJ: flat(14, 0), // Tajikistan
  TM: flat(15, 0), // Turkmenistan
  UZ: flat(12, 0), // Uzbekistan
  VN: flat(10, 0), // Vietnam
  YE: flat(5, 0), // Yemen
  // ---- Rest of North America & Caribbean ------------------------------------
  AG: flat(15, 0), // Antigua and Barbuda
  AI: flat(13, 0), // Anguilla
  AW: flat(null, null), // Aruba (turnover tax, no VAT)
  BB: flat(17.5, 0), // Barbados
  BL: flat(null, null), // Saint Barthelemy
  BM: flat(null, null), // Bermuda
  BQ: flat(null, null), // Bonaire, Saint Eustatius and Saba
  BS: flat(10, 0), // Bahamas
  BZ: flat(12.5, 0), // Belize
  CR: flat(13, 0), // Costa Rica
  CU: flat(null, null), // Cuba
  CW: flat(6, 0), // Curacao (turnover tax)
  DM: flat(15, 0), // Dominica
  DO: flat(18, 0), // Dominican Republic
  GD: flat(15, 0), // Grenada
  GL: flat(null, null), // Greenland
  GP: flat(8.5, 0), // Guadeloupe (French overseas reduced rate)
  GT: flat(12, 0), // Guatemala
  HN: flat(15, 0), // Honduras
  HT: flat(10, 0), // Haiti
  JM: flat(15, 0), // Jamaica
  KN: flat(17, 0), // Saint Kitts and Nevis
  KY: flat(null, null), // Cayman Islands
  LC: flat(12.5, 0), // Saint Lucia
  MF: flat(null, null), // Saint Martin
  MQ: flat(8.5, 0), // Martinique (French overseas reduced rate)
  MS: flat(null, null), // Montserrat
  MX: flat(16, 0), // Mexico
  NI: flat(15, 0), // Nicaragua
  PA: flat(7, 0), // Panama
  PM: flat(null, null), // Saint Pierre and Miquelon
  PR: flat(11.5, 0), // Puerto Rico
  SV: flat(13, 0), // El Salvador
  SX: flat(5, 0), // Sint Maarten (turnover tax)
  TC: flat(null, null), // Turks and Caicos Islands
  TT: flat(12.5, 0), // Trinidad and Tobago
  VC: flat(16, 0), // Saint Vincent and the Grenadines
  VG: flat(null, null), // British Virgin Islands
  VI: flat(null, null), // U.S. Virgin Islands
  // ---- Rest of Oceania ------------------------------------------------------
  AS: flat(null, null), // American Samoa
  CK: flat(15, 0), // Cook Islands
  CX: flat(null, null), // Christmas Island
  FJ: flat(15, 0), // Fiji
  FM: flat(null, null), // Micronesia
  GU: flat(null, null), // Guam
  KI: flat(12.5, 0), // Kiribati
  MH: flat(null, null), // Marshall Islands
  MP: flat(null, null), // Northern Mariana Islands
  NC: flat(11, 0), // New Caledonia
  NF: flat(null, null), // Norfolk Island
  NR: flat(null, null), // Nauru
  NU: flat(null, null), // Niue
  PF: flat(16, 0), // French Polynesia
  PG: flat(10, 0), // Papua New Guinea
  PN: flat(null, null), // Pitcairn
  PW: flat(10, 0), // Palau
  SB: flat(10, 0), // Solomon Islands
  TK: flat(null, null), // Tokelau
  TL: flat(null, null), // Timor-Leste
  TO: flat(15, 0), // Tonga
  TV: flat(null, null), // Tuvalu
  UM: flat(null, null), // United States Minor Outlying Islands
  VU: flat(15, 0), // Vanuatu
  WF: flat(null, null), // Wallis and Futuna
  WS: flat(15, 0), // Samoa

  // ---- South America --------------------------------------------------------
  AR: flat(21, 0), // Argentina
  BO: flat(13, 0), // Bolivia
  BR: flat(17, 0), // Brazil (representative state ICMS rate)
  CL: flat(19, 0), // Chile
  CO: flat(19, 0), // Colombia
  EC: flat(15, 0), // Ecuador
  FK: flat(null, null), // Falkland Islands
  GF: flat(null, null), // French Guiana (VAT not applicable)
  GY: flat(14, 0), // Guyana
  PE: flat(18, 0), // Peru
  PY: flat(10, 0), // Paraguay
  SR: flat(10, 0), // Suriname
  UY: flat(22, 0), // Uruguay
  VE: flat(16, 0), // Venezuela
};

// ---------------------------------------------------------------------------
// Tax labels
// ---------------------------------------------------------------------------

type TaxLabels = {
  /** English name of the tax (e.g. "VAT", "GST", "Sales Tax"). */
  en: string;
  /** Local name of the tax as used in that jurisdiction (e.g. "TVA", "MwSt", "消費税"). */
  local: string;
};

type CountryLabelEntry = TaxLabels & {
  /** Per-region label overrides (used when the tax name differs by province/state). */
  byRegion?: Record<string, TaxLabels>;
};

/**
 * Consumption tax labels for every country that has a consumption tax.
 * Countries absent from this map have no consumption tax (getters return null).
 * Canada has per-province byRegion entries because the tax name varies
 * (GST, HST, GST+PST, GST+QST).
 */
const TAX_LABELS: Partial<Record<CountryCode, CountryLabelEntry>> = {
  // ---- EU member states -------------------------------------------------------
  AT: { en: 'VAT', local: 'MwSt' },
  BE: { en: 'VAT', local: 'BTW/TVA' },
  BG: { en: 'VAT', local: 'DDS' },
  CY: { en: 'VAT', local: 'FPA' },
  CZ: { en: 'VAT', local: 'DPH' },
  DE: { en: 'VAT', local: 'MwSt' },
  DK: { en: 'VAT', local: 'Moms' },
  EE: { en: 'VAT', local: 'KM' },
  ES: { en: 'VAT', local: 'IVA' },
  FI: { en: 'VAT', local: 'ALV' },
  FR: { en: 'VAT', local: 'TVA' },
  GR: { en: 'VAT', local: 'FPA' },
  HR: { en: 'VAT', local: 'PDV' },
  HU: { en: 'VAT', local: 'ÁFA' },
  IE: { en: 'VAT', local: 'VAT' },
  IT: { en: 'VAT', local: 'IVA' },
  LT: { en: 'VAT', local: 'PVM' },
  LU: { en: 'VAT', local: 'TVA' },
  LV: { en: 'VAT', local: 'PVN' },
  MT: { en: 'VAT', local: 'VAT' },
  NL: { en: 'VAT', local: 'BTW' },
  PL: { en: 'VAT', local: 'VAT' },
  PT: { en: 'VAT', local: 'IVA' },
  RO: { en: 'VAT', local: 'TVA' },
  SE: { en: 'VAT', local: 'Moms' },
  SI: { en: 'VAT', local: 'DDV' },
  SK: { en: 'VAT', local: 'DPH' },
  // ---- United Kingdom ---------------------------------------------------------
  GB: { en: 'VAT', local: 'VAT' },
  // ---- Switzerland ------------------------------------------------------------
  CH: { en: 'VAT', local: 'MWST/TVA/IVA' },
  // ---- United States ----------------------------------------------------------
  US: { en: 'Sales Tax', local: 'Sales Tax' },
  // ---- Canada (region-specific) -----------------------------------------------
  CA: {
    en: 'GST/HST',
    local: 'GST/HST',
    byRegion: {
      AB: { en: 'GST', local: 'GST' },
      BC: { en: 'GST + PST', local: 'GST + PST' },
      MB: { en: 'GST + PST', local: 'GST + RST' },
      NB: { en: 'HST', local: 'HST' },
      NL: { en: 'HST', local: 'HST' },
      NS: { en: 'HST', local: 'HST' },
      NT: { en: 'GST', local: 'GST' },
      NU: { en: 'GST', local: 'GST' },
      ON: { en: 'HST', local: 'HST' },
      PE: { en: 'HST', local: 'HST' },
      QC: { en: 'GST + QST', local: 'TPS + TVQ' },
      SK: { en: 'GST + PST', local: 'GST + PST' },
      YT: { en: 'GST', local: 'GST' },
    },
  },
  // ---- Australia --------------------------------------------------------------
  AU: { en: 'GST', local: 'GST' },
  // ---- Japan ------------------------------------------------------------------
  JP: { en: 'Consumption Tax', local: '消費税' },
  // ---- Other European (non-EU) ------------------------------------------------
  NO: { en: 'VAT', local: 'MVA' },
  IS: { en: 'VAT', local: 'VSK' },
  LI: { en: 'VAT', local: 'MWST' },
  AD: { en: 'VAT', local: 'IGI' },
  MC: { en: 'VAT', local: 'TVA' },
  SM: { en: 'VAT', local: 'Imposta' },
  AL: { en: 'VAT', local: 'TVSH' },
  BA: { en: 'VAT', local: 'PDV' },
  GE: { en: 'VAT', local: 'DGhG' },
  MD: { en: 'VAT', local: 'TVA' },
  ME: { en: 'VAT', local: 'PDV' },
  MK: { en: 'VAT', local: 'DDV' },
  RS: { en: 'VAT', local: 'PDV' },
  TR: { en: 'VAT', local: 'KDV' },
  UA: { en: 'VAT', local: 'PDV' },
  XK: { en: 'VAT', local: 'TVSH' },
  AX: { en: 'VAT', local: 'ALV' },
  BY: { en: 'VAT', local: 'PDV' },
  FO: { en: 'VAT', local: 'MVG' },
  IM: { en: 'VAT', local: 'VAT' },
  JE: { en: 'GST', local: 'GST' },
  RU: { en: 'VAT', local: 'НДС' },
  // ---- Other developed economies ----------------------------------------------
  NZ: { en: 'GST', local: 'GST' },
  KR: { en: 'VAT', local: '부가세' },
  SG: { en: 'GST', local: 'GST' },
  IL: { en: 'VAT', local: 'מע"מ' },
  TW: { en: 'Business Tax', local: '營業稅' },
  AE: { en: 'VAT', local: 'VAT' },
  PH: { en: 'VAT', local: 'VAT' },
  IN: { en: 'GST', local: 'GST' },
  // ---- Africa -----------------------------------------------------------------
  AO: { en: 'VAT', local: 'IVA' },
  BF: { en: 'VAT', local: 'TVA' },
  BI: { en: 'VAT', local: 'TVA' },
  BJ: { en: 'VAT', local: 'TVA' },
  BW: { en: 'VAT', local: 'VAT' },
  CD: { en: 'VAT', local: 'TVA' },
  CF: { en: 'VAT', local: 'TVA' },
  CG: { en: 'VAT', local: 'TVA' },
  CI: { en: 'VAT', local: 'TVA' },
  CM: { en: 'VAT', local: 'TVA' },
  CV: { en: 'VAT', local: 'IVA' },
  DJ: { en: 'VAT', local: 'TVA' },
  DZ: { en: 'VAT', local: 'TVA' },
  EG: { en: 'VAT', local: 'VAT' },
  ET: { en: 'VAT', local: 'VAT' },
  GA: { en: 'VAT', local: 'TVA' },
  GH: { en: 'VAT', local: 'VAT' },
  GM: { en: 'VAT', local: 'VAT' },
  GN: { en: 'VAT', local: 'TVA' },
  GQ: { en: 'VAT', local: 'IVA' },
  GW: { en: 'VAT', local: 'IVA' },
  KE: { en: 'VAT', local: 'VAT' },
  LR: { en: 'GST', local: 'GST' },
  LS: { en: 'VAT', local: 'VAT' },
  MA: { en: 'VAT', local: 'TVA' },
  MG: { en: 'VAT', local: 'TVA' },
  ML: { en: 'VAT', local: 'TVA' },
  MR: { en: 'VAT', local: 'TVA' },
  MU: { en: 'VAT', local: 'VAT' },
  MW: { en: 'VAT', local: 'VAT' },
  MZ: { en: 'VAT', local: 'IVA' },
  NA: { en: 'VAT', local: 'VAT' },
  NE: { en: 'VAT', local: 'TVA' },
  NG: { en: 'VAT', local: 'VAT' },
  RE: { en: 'VAT', local: 'TVA' },
  RW: { en: 'VAT', local: 'VAT' },
  SC: { en: 'VAT', local: 'VAT' },
  SD: { en: 'VAT', local: 'VAT' },
  SL: { en: 'GST', local: 'GST' },
  SN: { en: 'VAT', local: 'TVA' },
  SS: { en: 'VAT', local: 'VAT' },
  ST: { en: 'VAT', local: 'IVA' },
  SZ: { en: 'VAT', local: 'VAT' },
  TD: { en: 'VAT', local: 'TVA' },
  TG: { en: 'VAT', local: 'TVA' },
  TN: { en: 'VAT', local: 'TVA' },
  TZ: { en: 'VAT', local: 'VAT' },
  UG: { en: 'VAT', local: 'VAT' },
  ZA: { en: 'VAT', local: 'VAT' },
  ZM: { en: 'VAT', local: 'VAT' },
  ZW: { en: 'VAT', local: 'VAT' },
  // ---- Asia -------------------------------------------------------------------
  AM: { en: 'VAT', local: 'ԱԱՀ' },
  AZ: { en: 'VAT', local: 'ƏDV' },
  BD: { en: 'VAT', local: 'VAT' },
  BH: { en: 'VAT', local: 'VAT' },
  CN: { en: 'VAT', local: '增值税' },
  ID: { en: 'VAT', local: 'PPN' },
  IR: { en: 'VAT', local: 'VAT' },
  JO: { en: 'GST', local: 'GST' },
  KG: { en: 'VAT', local: 'НДС' },
  KH: { en: 'VAT', local: 'VAT' },
  KZ: { en: 'VAT', local: 'ҚҚС' },
  LA: { en: 'VAT', local: 'VAT' },
  LB: { en: 'VAT', local: 'VAT' },
  LK: { en: 'VAT', local: 'VAT' },
  MM: { en: 'Sales Tax', local: 'CT' },
  MN: { en: 'VAT', local: 'НӨАТ' },
  MV: { en: 'GST', local: 'GST' },
  MY: { en: 'SST', local: 'SST' },
  NP: { en: 'VAT', local: 'VAT' },
  OM: { en: 'VAT', local: 'VAT' },
  PK: { en: 'GST', local: 'GST' },
  PS: { en: 'VAT', local: 'VAT' },
  SA: { en: 'VAT', local: 'VAT' },
  TH: { en: 'VAT', local: 'VAT' },
  TJ: { en: 'VAT', local: 'VAT' },
  TM: { en: 'VAT', local: 'VAT' },
  UZ: { en: 'VAT', local: 'QQS' },
  VN: { en: 'VAT', local: 'VAT' },
  YE: { en: 'GST', local: 'GST' },
  // ---- Americas (non-US/CA) ---------------------------------------------------
  AG: { en: 'VAT', local: 'ABST' },
  AI: { en: 'GST', local: 'GST' },
  BB: { en: 'VAT', local: 'VAT' },
  BS: { en: 'VAT', local: 'VAT' },
  BZ: { en: 'GST', local: 'GST' },
  CR: { en: 'VAT', local: 'IVA' },
  CW: { en: 'Sales Tax', local: 'OB' },
  DM: { en: 'VAT', local: 'VAT' },
  DO: { en: 'VAT', local: 'ITBIS' },
  GD: { en: 'VAT', local: 'VAT' },
  GP: { en: 'VAT', local: 'TVA' },
  GT: { en: 'VAT', local: 'IVA' },
  HN: { en: 'VAT', local: 'ISV' },
  HT: { en: 'VAT', local: 'TCA' },
  JM: { en: 'VAT', local: 'GCT' },
  KN: { en: 'VAT', local: 'VAT' },
  LC: { en: 'VAT', local: 'VAT' },
  MQ: { en: 'VAT', local: 'TVA' },
  MX: { en: 'VAT', local: 'IVA' },
  NI: { en: 'VAT', local: 'IVA' },
  PA: { en: 'VAT', local: 'ITBMS' },
  PR: { en: 'Sales Tax', local: 'IVU' },
  SV: { en: 'VAT', local: 'IVA' },
  SX: { en: 'Sales Tax', local: 'TOT' },
  TT: { en: 'VAT', local: 'VAT' },
  VC: { en: 'VAT', local: 'VAT' },
  // ---- South America ----------------------------------------------------------
  AR: { en: 'VAT', local: 'IVA' },
  BO: { en: 'VAT', local: 'IVA' },
  BR: { en: 'VAT', local: 'ICMS' },
  CL: { en: 'VAT', local: 'IVA' },
  CO: { en: 'VAT', local: 'IVA' },
  EC: { en: 'VAT', local: 'IVA' },
  GY: { en: 'VAT', local: 'VAT' },
  PE: { en: 'VAT', local: 'IGV' },
  PY: { en: 'VAT', local: 'IVA' },
  SR: { en: 'VAT', local: 'VAT' },
  UY: { en: 'VAT', local: 'IVA' },
  VE: { en: 'VAT', local: 'IVA' },
  // ---- Oceania ----------------------------------------------------------------
  CK: { en: 'VAT', local: 'VAT' },
  FJ: { en: 'VAT', local: 'VAT' },
  KI: { en: 'VAT', local: 'VAT' },
  NC: { en: 'VAT', local: 'TGC' },
  PF: { en: 'VAT', local: 'TVA' },
  PG: { en: 'GST', local: 'GST' },
  PW: { en: 'GST', local: 'PGST' },
  SB: { en: 'GST', local: 'GST' },
  TO: { en: 'Consumption Tax', local: 'CT' },
  VU: { en: 'VAT', local: 'VAT' },
  WS: { en: 'VAT', local: 'VAGST' },
};

/** English name of the consumption tax for a country (and optional region). Returns null for countries with no consumption tax. */
function getTaxLabel(countryCode: string, region?: string): string | null {
  const code = countryCode.toUpperCase();
  const entry = isCountryCode(code) ? TAX_LABELS[code] : undefined;
  if (!entry) return null;
  if (region) {
    const regionEntry = entry.byRegion?.[region.toUpperCase()];
    if (regionEntry) return regionEntry.en;
  }
  return entry.en;
}

/** Local name of the consumption tax for a country (and optional region). Returns null for countries with no consumption tax. */
function getLocalTaxLabel(countryCode: string, region?: string): string | null {
  const code = countryCode.toUpperCase();
  const entry = isCountryCode(code) ? TAX_LABELS[code] : undefined;
  if (!entry) return null;
  if (region) {
    const regionEntry = entry.byRegion?.[region.toUpperCase()];
    if (regionEntry) return regionEntry.local;
  }
  return entry.local;
}

/**
 * Name of the business identifier used to register for the country's tax system.
 * Examples: "VAT Number", "ABN", "EIN".
 * Returns null for countries with no consumption tax.
 */
const BUSINESS_TAX_NUMBER_LABELS: Partial<Record<CountryCode, string>> = {
  // Jurisdiction-specific identifiers
  AU: 'ABN',
  CA: 'Business Number',
  GB: 'VAT Number',
  JP: 'Qualified Invoice Issuer Number',
  US: 'EIN',
  CH: 'UID',
  NZ: 'GST Number',
  SG: 'GST Registration Number',
  IN: 'GSTIN',
  KR: 'Business Registration Number',
  CN: 'Unified Social Credit Code',
  MY: 'SST Number',
  // EU countries use "VAT Number" (fall through to default below)
};

function getBusinessTaxNumberLabel(countryCode: string): string | null {
  const code = countryCode.toUpperCase();
  if (!isCountryCode(code)) return null;
  const specific = BUSINESS_TAX_NUMBER_LABELS[code];
  if (specific !== undefined) return specific;
  // Countries with no consumption tax have no registration number
  if (!TAX_LABELS[code]) return null;
  return 'VAT Number';
}

// ---------------------------------------------------------------------------
// Entry resolution
// ---------------------------------------------------------------------------

/** A region record has no own `taxSystem` field; a plain TaxConfig does. */
function isRegional(entry: CountryTaxEntry): entry is Record<string, TaxConfig> {
  return !Object.hasOwn(entry, 'taxSystem');
}

/** Looks up a country's tax entry by (case-insensitive) code, or `undefined` when unknown. */
function taxEntryFor(country: string): CountryTaxEntry | undefined {
  const code = country.toUpperCase();
  return isCountryCode(code) ? TAX_CONFIG[code] : undefined;
}

/** True when a country's tax rate varies by state/province. */
function hasRegionalTax(country: string): boolean {
  const entry = taxEntryFor(country);
  return entry !== undefined && isRegional(entry);
}

/**
 * Resolve a country to its (country-level) {@link TaxConfig}, exposing the
 * consumption-tax identifier metadata (prefix/pattern/example). For regional
 * countries these fields are identical across regions, so any entry serves.
 */
function getTaxConfig(country: string): TaxConfig | undefined {
  const entry = taxEntryFor(country);
  if (!entry) return;
  return isRegional(entry) ? Object.values(entry)[0] : entry;
}

/** Normalizes a consumption-tax identifier: trims, uppercases, strips spaces. */
function normalizeTax(taxId: string): string {
  return taxId.trim().toUpperCase().replace(/\s/g, '');
}

/**
 * Validates a consumption-tax identifier against the country's pattern. Returns
 * false for countries with no known tax-id pattern (see {@link TaxConfig.taxPattern}).
 * The id is normalized (trim/uppercase/strip spaces) before matching.
 */
function validateTax(taxId: string, countryCode: string): boolean {
  const config = getTaxConfig(countryCode);
  if (!config?.taxPattern) return false;
  return config.taxPattern.test(normalizeTax(taxId));
}

type ResolvedTaxConfig = { config: TaxConfig; regionResolved: boolean };

// Neutral no-tax config. Only reached if a region record were empty, which the
// `regional()` builder never produces — it exists purely to keep `resolveConfig`
// total without a type assertion.
const EMPTY_REGION_CONFIG: TaxConfig = {
  baseConsumerTax: null,
  taxSystem: 'country-specific',
  collectionThreshold: null,
};

/**
 * Resolve a country (and optional region) to a single {@link TaxConfig}.
 * For regional countries, returns the matching region's config, or any entry
 * (for country-level fields) when no/unknown region is supplied.
 */
function resolveConfig(entry: CountryTaxEntry, state: string | undefined): ResolvedTaxConfig {
  if (!isRegional(entry)) return { config: entry, regionResolved: false };

  if (state) {
    const match = entry[state.toUpperCase()];
    if (match) return { config: match, regionResolved: true };
  }
  // No region selected (or unknown): fall back to the first entry for
  // country-level fields. Its `baseConsumerTax` is not authoritative.
  // Region records are always non-empty (built via `regional`), so the first
  // value is always present.
  const [fallback] = Object.values(entry);
  if (!fallback) return { config: EMPTY_REGION_CONFIG, regionResolved: false };
  return { config: fallback, regionResolved: false };
}

// ---------------------------------------------------------------------------
// Outcome builder
// ---------------------------------------------------------------------------

const NO_FLAGS: TaxOutcomeFlags = {
  buyerSelfAccounts: false,
  regionalRates: false,
  localSurcharge: false,
};

function makeFlags(partial: Partial<TaxOutcomeFlags>): TaxOutcomeFlags {
  return { ...NO_FLAGS, ...partial };
}

const EMPTY_OUTCOME: TaxOutcome = {
  taxSystem: null,
  taxLabel: null,
  localTaxLabel: null,
  baseTax: null,
  effectiveTax: 0,
  flags: NO_FLAGS,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

type ComputeTaxOutcomeParams = {
  country: string;
  isBusiness: boolean;
  hasTaxId: boolean;
  hasNexus?: boolean;
  state?: string;
};

function computeTaxOutcome({ country, isBusiness, hasTaxId, hasNexus = false, state }: ComputeTaxOutcomeParams): TaxOutcome {
  if (!country) return EMPTY_OUTCOME;

  const entry = taxEntryFor(country);
  if (!entry) return EMPTY_OUTCOME;

  const { config, regionResolved } = resolveConfig(entry, state);
  const resolvedState = state ? state.toUpperCase() : undefined;
  const isRegionalCountry = isRegional(entry);

  const base = {
    taxSystem: config.taxSystem,
    taxLabel: getTaxLabel(country, resolvedState),
    localTaxLabel: getLocalTaxLabel(country, resolvedState),
  } as const;

  // OSS (EU) jurisdictions always carry a seller obligation, so they count as
  // in-nexus regardless of the supplied `hasNexus` flag.
  const sellerHasNexus = hasNexus || config.taxSystem === 'oss';

  // `effectiveTax` is `baseTax` when the seller has nexus, else 0
  const effective = (rate: number | null): number | null => (sellerHasNexus ? rate : 0);

  // If NOT a business (consumer), apply standard rates with exceptions
  if (!isBusiness) {
    // Zero-rated exports (UK): invoice at 0%, buyer self-accounts
    if (config.zeroRatedExport) {
      const baseTax = 0;
      return {
        ...base,
        baseTax,
        effectiveTax: effective(baseTax),
        flags: makeFlags({ buyerSelfAccounts: true }),
      };
    }

    // Standard consumer rate
    const baseTax = regionResolved || !isRegionalCountry ? config.baseConsumerTax : null;
    return {
      ...base,
      baseTax,
      effectiveTax: effective(baseTax),
      flags: makeFlags({
        regionalRates: isRegionalCountry,
        localSurcharge: Boolean(config.localSurcharge),
      }),
    };
  }

  // Business transactions
  // OSS countries: B2B with valid tax ID → reverse charge (0%)
  if (config.taxSystem === 'oss' && hasTaxId) {
    const baseTax = 0;
    return {
      ...base,
      baseTax,
      effectiveTax: effective(baseTax),
      flags: makeFlags({ buyerSelfAccounts: true }),
    };
  }

  // Zero-rated exports (UK): B2B → 0%, buyer self-accounts
  if (config.zeroRatedExport) {
    const baseTax = 0;
    return {
      ...base,
      baseTax,
      effectiveTax: effective(baseTax),
      flags: makeFlags({ buyerSelfAccounts: true }),
    };
  }

  // Business without valid tax ID or non-OSS: standard rate
  const baseTax = regionResolved || !isRegionalCountry ? config.baseConsumerTax : null;
  return {
    ...base,
    baseTax,
    effectiveTax: effective(baseTax),
    flags: makeFlags({
      regionalRates: isRegionalCountry,
      localSurcharge: Boolean(config.localSurcharge),
    }),
  };
}

type ComputeConsumerTaxOutcomeParams = {
  country: string;
  hasNexus?: boolean;
  state?: string;
};

/**
 * Compute consumption tax outcome for consumer (B2C) transactions.
 * Convenience wrapper around {@link computeTaxOutcome} with `isBusiness: false`.
 *
 * @param params.country - Two-letter country code (ISO 3166-1 alpha-2)
 * @param params.hasNexus - Whether the seller has a tax nexus in the country (defaults to false)
 * @param params.state - Optional state/province code for regional tax countries (US, CA)
 * @returns The computed tax outcome for a consumer transaction
 */
function computeConsumerTaxOutcome({ country, hasNexus = false, state }: ComputeConsumerTaxOutcomeParams): TaxOutcome {
  return computeTaxOutcome({ country, isBusiness: false, hasTaxId: false, hasNexus, state });
}

export type {
  ComputeConsumerTaxOutcomeParams,
  ComputeTaxOutcomeParams,
  CountryTaxEntry,
  TaxConfig,
  TaxLabels,
  TaxOutcome,
  TaxOutcomeFlags,
  TaxSystem,
  TaxType,
  TaxValue,
};
export {
  computeConsumerTaxOutcome,
  computeTaxOutcome,
  getBusinessTaxNumberLabel,
  getLocalTaxLabel,
  getTaxConfig,
  getTaxLabel,
  hasRegionalTax,
  normalizeTax,
  TAX_CONFIG,
  validateTax,
};
