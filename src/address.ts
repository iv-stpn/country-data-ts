// Level-1 administrative division option lists, sourced from data/level1-administrative-codes.json
// via codegen (scripts/gen-level1-codes.ts). Each is a separate named export
// so the bundler tree-shakes away every country we don't import below — the
// full set of divisions never reaches the published build.

// Full country reference data (every country), generated from data/countries.json
// by scripts/gen-countries.ts. Source of postal-code patterns and level-1
// division labels below.
import { COUNTRY_CODES, COUNTRY_DATA, type CountryCode, isCountryCode } from "./data/countries";
import type { AdministrativeDivisionOption } from "./data/level1-administrative-codes";
import {
  level1Admin_AD,
  level1Admin_AE,
  level1Admin_AF,
  level1Admin_AG,
  level1Admin_AI,
  level1Admin_AL,
  level1Admin_AM,
  level1Admin_AO,
  level1Admin_AR,
  level1Admin_AS,
  level1Admin_AT,
  level1Admin_AU,
  level1Admin_AX,
  level1Admin_AZ,
  level1Admin_BA,
  level1Admin_BB,
  level1Admin_BD,
  level1Admin_BE,
  level1Admin_BF,
  level1Admin_BG,
  level1Admin_BH,
  level1Admin_BI,
  level1Admin_BJ,
  level1Admin_BM,
  level1Admin_BN,
  level1Admin_BO,
  level1Admin_BQ,
  level1Admin_BR,
  level1Admin_BS,
  level1Admin_BT,
  level1Admin_BW,
  level1Admin_BY,
  level1Admin_BZ,
  level1Admin_CA,
  level1Admin_CD,
  level1Admin_CF,
  level1Admin_CG,
  level1Admin_CH,
  level1Admin_CI,
  level1Admin_CK,
  level1Admin_CL,
  level1Admin_CM,
  level1Admin_CN,
  level1Admin_CO,
  level1Admin_CR,
  level1Admin_CU,
  level1Admin_CV,
  level1Admin_CY,
  level1Admin_CZ,
  level1Admin_DE,
  level1Admin_DJ,
  level1Admin_DK,
  level1Admin_DM,
  level1Admin_DO,
  level1Admin_DZ,
  level1Admin_EC,
  level1Admin_EE,
  level1Admin_EG,
  level1Admin_ER,
  level1Admin_ES,
  level1Admin_ET,
  level1Admin_FI,
  level1Admin_FJ,
  level1Admin_FM,
  level1Admin_FO,
  level1Admin_FR,
  level1Admin_GA,
  level1Admin_GB,
  level1Admin_GD,
  level1Admin_GE,
  level1Admin_GF,
  level1Admin_GG,
  level1Admin_GH,
  level1Admin_GL,
  level1Admin_GM,
  level1Admin_GN,
  level1Admin_GP,
  level1Admin_GQ,
  level1Admin_GR,
  level1Admin_GT,
  level1Admin_GU,
  level1Admin_GW,
  level1Admin_GY,
  level1Admin_HK,
  level1Admin_HN,
  level1Admin_HR,
  level1Admin_HT,
  level1Admin_HU,
  level1Admin_ID,
  level1Admin_IE,
  level1Admin_IL,
  level1Admin_IM,
  level1Admin_IN,
  level1Admin_IQ,
  level1Admin_IR,
  level1Admin_IS,
  level1Admin_IT,
  level1Admin_JE,
  level1Admin_JM,
  level1Admin_JO,
  level1Admin_JP,
  level1Admin_KE,
  level1Admin_KG,
  level1Admin_KH,
  level1Admin_KI,
  level1Admin_KM,
  level1Admin_KN,
  level1Admin_KP,
  level1Admin_KR,
  level1Admin_KW,
  level1Admin_KY,
  level1Admin_KZ,
  level1Admin_LA,
  level1Admin_LB,
  level1Admin_LC,
  level1Admin_LI,
  level1Admin_LK,
  level1Admin_LR,
  level1Admin_LS,
  level1Admin_LT,
  level1Admin_LU,
  level1Admin_LV,
  level1Admin_LY,
  level1Admin_MA,
  level1Admin_MC,
  level1Admin_MD,
  level1Admin_ME,
  level1Admin_MG,
  level1Admin_MH,
  level1Admin_MK,
  level1Admin_ML,
  level1Admin_MM,
  level1Admin_MN,
  level1Admin_MO,
  level1Admin_MP,
  level1Admin_MQ,
  level1Admin_MR,
  level1Admin_MS,
  level1Admin_MT,
  level1Admin_MU,
  level1Admin_MV,
  level1Admin_MW,
  level1Admin_MX,
  level1Admin_MY,
  level1Admin_MZ,
  level1Admin_NA,
  level1Admin_NC,
  level1Admin_NE,
  level1Admin_NG,
  level1Admin_NI,
  level1Admin_NL,
  level1Admin_NO,
  level1Admin_NP,
  level1Admin_NR,
  level1Admin_NZ,
  level1Admin_OM,
  level1Admin_PA,
  level1Admin_PE,
  level1Admin_PF,
  level1Admin_PG,
  level1Admin_PH,
  level1Admin_PK,
  level1Admin_PL,
  level1Admin_PM,
  level1Admin_PR,
  level1Admin_PS,
  level1Admin_PT,
  level1Admin_PW,
  level1Admin_PY,
  level1Admin_QA,
  level1Admin_RE,
  level1Admin_RO,
  level1Admin_RS,
  level1Admin_RU,
  level1Admin_RW,
  level1Admin_SA,
  level1Admin_SB,
  level1Admin_SC,
  level1Admin_SD,
  level1Admin_SE,
  level1Admin_SG,
  level1Admin_SH,
  level1Admin_SI,
  level1Admin_SJ,
  level1Admin_SK,
  level1Admin_SL,
  level1Admin_SM,
  level1Admin_SN,
  level1Admin_SO,
  level1Admin_SR,
  level1Admin_SS,
  level1Admin_ST,
  level1Admin_SV,
  level1Admin_SY,
  level1Admin_SZ,
  level1Admin_TD,
  level1Admin_TF,
  level1Admin_TG,
  level1Admin_TH,
  level1Admin_TJ,
  level1Admin_TK,
  level1Admin_TL,
  level1Admin_TM,
  level1Admin_TN,
  level1Admin_TO,
  level1Admin_TR,
  level1Admin_TT,
  level1Admin_TV,
  level1Admin_TW,
  level1Admin_TZ,
  level1Admin_UA,
  level1Admin_UG,
  level1Admin_UM,
  level1Admin_US,
  level1Admin_UY,
  level1Admin_UZ,
  level1Admin_VC,
  level1Admin_VE,
  level1Admin_VI,
  level1Admin_VN,
  level1Admin_VU,
  level1Admin_WF,
  level1Admin_WS,
  level1Admin_XK,
  level1Admin_YE,
  level1Admin_YT,
  level1Admin_ZA,
  level1Admin_ZM,
  level1Admin_ZW,
} from "./data/level1-administrative-codes";
// Curated level-1 option lists for countries GeoNames has no admin1 data for,
// but which have an officially documented (ISO 3166-2) subdivision scheme.
import { POSTAL_CODE_DATA } from "./data/postal-codes";

export type { CountryCode };
// Re-export the generated country code list and union type so consumers can
// import them from the address utilities alongside the address config helpers.
export { COUNTRY_CODES };

export interface AddressValue {
  line1: string;
  line2?: string;
  city: string;
  level1?: string;
  postalCode: string;
  country: string;
}

/**
 * An {@link AddressValue} where every field is optional and nullable, except
 * `country`, which is strictly required. This is the input shape accepted by
 * {@link validateAddress}: callers may pass a partially-filled address (e.g.
 * straight from a form) without defaulting the missing fields first.
 */
export type AddressValueInput = {
  [K in keyof Omit<AddressValue, "country">]?: AddressValue[K] | null;
} & Pick<AddressValue, "country">;

/** Controls which address fields are collected. */
export type AddressCollectionMode =
  /** Country only; region also for countries with per-region tax rules (US, CA); full address for EU countries. */
  | "minimal"
  /** Country + region always; full address for EU countries. */
  | "regionMinimal"
  /** Country + region only, always. */
  | "region"
  /** Full address, always. */
  | "full"
  /** Full address + region is required. */
  | "fullRegion";

/**
 * Controls *when* field-level validation errors are surfaced in the UI.
 * `onValidationChange` always fires with the true validity regardless of this
 * setting — this only gates when errors become visible to the user.
 * - "onType" (default): a field's error shows as soon as it is edited or blurred.
 * - "onBlur": a field's error shows only once it loses focus.
 * - "onSubmit": errors stay hidden until validation is triggered imperatively
 *   (via the component's ref `validate()` handle).
 */
export type ValidationMode = "onType" | "onBlur" | "onSubmit";

export type AddressFieldKey = "line1" | "line2" | "city" | "level1" | "postalCode" | "country";

export interface CountryAddressConfig {
  code: CountryCode;
  name: string;
  /** Field keys in display order. Labels/required/options are resolved per key. */
  addressFields: AddressFieldKey[];
  /** Postal-code pattern, derived from COUNTRY_DATA (not hand-maintained). */
  postalCodePattern?: RegExp;
  /** When present, the level-1 field renders a <select> with these options. */
  level1Options?: ReadonlyArray<AdministrativeDivisionOption>;
}

// Default field labels and placeholders. Per-country overrides for the postal
// code and city fields live in POSTAL_CODE_DATA; the level-1 label is
// derived from COUNTRY_DATA. line1/line2 use the generic labels/placeholders
// below for every country except those listed in LINE_OVERRIDES.
const LINE1_LABEL_DEFAULT = "Address line 1";
const LINE2_LABEL_DEFAULT = "Address line 2";
const LINE1_PLACEHOLDER_DEFAULT = "Street address";
const LINE2_PLACEHOLDER_DEFAULT = "Apartment, unit number, building, floor, etc.";
const POSTAL_CODE_LABEL_DEFAULT = "Postal code";
const CITY_LABEL_DEFAULT = "City";

// Per-country overrides for the line1/line2 label and placeholder text. The
// label conveys what the field *is* (and often differs by locale convention);
// the placeholder gives an example of what to type (and differs where local
// addressing relies on landmarks, blocks, etc.). Any field left unset falls
// back to the generic default above.
interface LineOverrides {
  line1Label?: string;
  line2Label?: string;
  line1Placeholder?: string;
  line2Placeholder?: string;
}

const LINE_OVERRIDES: Partial<Record<string, LineOverrides>> = {
  FR: { line1Label: "Address", line2Label: "Address details" },
  // Countries where landmark-based addressing is common.
  PH: {
    line1Label: "Address",
    line2Label: "Landmark/Unit details",
    line1Placeholder: "Street, road, block and lot number",
    line2Placeholder: "Near landmark or unit number, building, floor, etc.",
  },
  IN: {
    line1Label: "Address",
    line2Label: "Landmark/Unit details",
    line1Placeholder: "Street, road, block and lot number",
    line2Placeholder: "Near landmark or unit number, building, floor, etc.",
  },
};

// Suffix appended to the label of optional fields in the rendered UI.
const OPTIONAL_SUFFIX = " (optional)";

// ---------------------------------------------------------------------------
// Field metadata resolution
// ---------------------------------------------------------------------------

/**
 * Resolved, render-ready metadata for a single address field. Produced from a
 * {@link CountryAddressConfig} + field key so the config itself only has to
 * declare field order, not per-field labels/required/placeholder/options.
 */
export interface ResolvedAddressField {
  field: AddressFieldKey;
  /** Display label, including the " (optional)" suffix for optional fields. */
  label: string;
  required: boolean;
  placeholder?: string;
  /** When present, the field renders a <select> instead of an <input>. */
  options?: ReadonlyArray<AdministrativeDivisionOption>;
}

/** The base label for a field, before the optional suffix is applied. */
export function addressFieldLabel(code: string, key: AddressFieldKey): string {
  switch (key) {
    case "line1":
      return LINE_OVERRIDES[code]?.line1Label ?? LINE1_LABEL_DEFAULT;
    case "line2":
      return LINE_OVERRIDES[code]?.line2Label ?? LINE2_LABEL_DEFAULT;
    case "city":
      return POSTAL_CODE_DATA[code]?.cityLabel ?? CITY_LABEL_DEFAULT;
    case "postalCode":
      return POSTAL_CODE_DATA[code]?.label ?? POSTAL_CODE_LABEL_DEFAULT;
    case "level1":
      const countryCode = isCountryCode(code) ? code : null;
      if (!countryCode) return "Region";
      return COUNTRY_DATA[countryCode]?.administrativeLabels.level1?.en ?? "Region";
    case "country":
      return "Country";
  }
}

/**
 * Whether a field is required. line1/city/postalCode are always required; line2
 * is always optional; the level-1 field is required based on the mode and
 * whether it's included in the effective field list for that mode.
 */
export function isAddressFieldRequired(key: AddressFieldKey, mode: AddressCollectionMode = "full"): boolean {
  // level1 is required for region, regionMinimal, fullRegion, and minimal (when applicable)
  if (key === "level1") return mode === "region" || mode === "regionMinimal" || mode === "fullRegion" || mode === "minimal";
  return key !== "line2";
}

export function resolveAddressField(
  code: string,
  key: AddressFieldKey,
  mode: AddressCollectionMode = "full",
): ResolvedAddressField {
  const required = isAddressFieldRequired(key, mode);
  const baseLabel = addressFieldLabel(code, key);
  const field: ResolvedAddressField = {
    field: key,
    label: required ? baseLabel : `${baseLabel}${OPTIONAL_SUFFIX}`,
    required,
  };

  if (key === "line1") field.placeholder = LINE_OVERRIDES[code]?.line1Placeholder ?? LINE1_PLACEHOLDER_DEFAULT;
  if (key === "line2") field.placeholder = LINE_OVERRIDES[code]?.line2Placeholder ?? LINE2_PLACEHOLDER_DEFAULT;

  if (key === "postalCode") {
    const placeholder = POSTAL_CODE_DATA[code]?.placeholder;
    if (placeholder) field.placeholder = placeholder;
  }

  if (key === "level1") {
    const options = LEVEL1_OPTIONS[code as CountryCode];
    if (options) field.options = options;
  }

  return field;
}

// ---------------------------------------------------------------------------
// Country configs
// ---------------------------------------------------------------------------

// Postal-code pattern, compiled from the GeoNames regex in COUNTRY_DATA.
function postalPattern(code: CountryCode): RegExp | undefined {
  const raw = COUNTRY_DATA[code]?.postalCodeRegex;
  if (!raw) return undefined;
  try {
    // GeoNames patterns are case-sensitive ASCII; alpha postcodes (GB, NL,
    // MT, …) are entered in either case, so match case-insensitively.
    return new RegExp(raw.trim(), "i");
  } catch {
    return undefined;
  }
}

// Level-1 <select> option lists, one entry per country that has division data.
const LEVEL1_OPTIONS: Partial<Record<CountryCode, ReadonlyArray<AdministrativeDivisionOption>>> = {
  AD: level1Admin_AD,
  AE: level1Admin_AE,
  AF: level1Admin_AF,
  AG: level1Admin_AG,
  AI: level1Admin_AI,
  AL: level1Admin_AL,
  AM: level1Admin_AM,
  AO: level1Admin_AO,
  AR: level1Admin_AR,
  AS: level1Admin_AS,
  AT: level1Admin_AT,
  AU: level1Admin_AU,
  AX: level1Admin_AX,
  AZ: level1Admin_AZ,
  BA: level1Admin_BA,
  BB: level1Admin_BB,
  BD: level1Admin_BD,
  BE: level1Admin_BE,
  BF: level1Admin_BF,
  BG: level1Admin_BG,
  BH: level1Admin_BH,
  BI: level1Admin_BI,
  BJ: level1Admin_BJ,
  BM: level1Admin_BM,
  BN: level1Admin_BN,
  BO: level1Admin_BO,
  BQ: level1Admin_BQ,
  BR: level1Admin_BR,
  BS: level1Admin_BS,
  BT: level1Admin_BT,
  BW: level1Admin_BW,
  BY: level1Admin_BY,
  BZ: level1Admin_BZ,
  CA: level1Admin_CA,
  CD: level1Admin_CD,
  CF: level1Admin_CF,
  CG: level1Admin_CG,
  CH: level1Admin_CH,
  CI: level1Admin_CI,
  CK: level1Admin_CK,
  CL: level1Admin_CL,
  CM: level1Admin_CM,
  CN: level1Admin_CN,
  CO: level1Admin_CO,
  CR: level1Admin_CR,
  CU: level1Admin_CU,
  CV: level1Admin_CV,
  CY: level1Admin_CY,
  CZ: level1Admin_CZ,
  DE: level1Admin_DE,
  DJ: level1Admin_DJ,
  DK: level1Admin_DK,
  DM: level1Admin_DM,
  DO: level1Admin_DO,
  DZ: level1Admin_DZ,
  EC: level1Admin_EC,
  EE: level1Admin_EE,
  EG: level1Admin_EG,
  ER: level1Admin_ER,
  ES: level1Admin_ES,
  ET: level1Admin_ET,
  FI: level1Admin_FI,
  FJ: level1Admin_FJ,
  FM: level1Admin_FM,
  FO: level1Admin_FO,
  FR: level1Admin_FR,
  GA: level1Admin_GA,
  GB: level1Admin_GB,
  GD: level1Admin_GD,
  GE: level1Admin_GE,
  GF: level1Admin_GF,
  GG: level1Admin_GG,
  GH: level1Admin_GH,
  GL: level1Admin_GL,
  GM: level1Admin_GM,
  GN: level1Admin_GN,
  GP: level1Admin_GP,
  GQ: level1Admin_GQ,
  GR: level1Admin_GR,
  GT: level1Admin_GT,
  GU: level1Admin_GU,
  GW: level1Admin_GW,
  GY: level1Admin_GY,
  HK: level1Admin_HK,
  HN: level1Admin_HN,
  HR: level1Admin_HR,
  HT: level1Admin_HT,
  HU: level1Admin_HU,
  ID: level1Admin_ID,
  IE: level1Admin_IE,
  IL: level1Admin_IL,
  IM: level1Admin_IM,
  IN: level1Admin_IN,
  IQ: level1Admin_IQ,
  IR: level1Admin_IR,
  IS: level1Admin_IS,
  IT: level1Admin_IT,
  JE: level1Admin_JE,
  JM: level1Admin_JM,
  JO: level1Admin_JO,
  JP: level1Admin_JP,
  KE: level1Admin_KE,
  KG: level1Admin_KG,
  KH: level1Admin_KH,
  KI: level1Admin_KI,
  KM: level1Admin_KM,
  KN: level1Admin_KN,
  KP: level1Admin_KP,
  KR: level1Admin_KR,
  KW: level1Admin_KW,
  KY: level1Admin_KY,
  KZ: level1Admin_KZ,
  LA: level1Admin_LA,
  LB: level1Admin_LB,
  LC: level1Admin_LC,
  LI: level1Admin_LI,
  LK: level1Admin_LK,
  LR: level1Admin_LR,
  LS: level1Admin_LS,
  LT: level1Admin_LT,
  LU: level1Admin_LU,
  LV: level1Admin_LV,
  LY: level1Admin_LY,
  MA: level1Admin_MA,
  MC: level1Admin_MC,
  MD: level1Admin_MD,
  ME: level1Admin_ME,
  MG: level1Admin_MG,
  MH: level1Admin_MH,
  MK: level1Admin_MK,
  ML: level1Admin_ML,
  MM: level1Admin_MM,
  MN: level1Admin_MN,
  MO: level1Admin_MO,
  MP: level1Admin_MP,
  MQ: level1Admin_MQ,
  MR: level1Admin_MR,
  MS: level1Admin_MS,
  MT: level1Admin_MT,
  MU: level1Admin_MU,
  MV: level1Admin_MV,
  MW: level1Admin_MW,
  MX: level1Admin_MX,
  MY: level1Admin_MY,
  MZ: level1Admin_MZ,
  NA: level1Admin_NA,
  NC: level1Admin_NC,
  NE: level1Admin_NE,
  NG: level1Admin_NG,
  NI: level1Admin_NI,
  NL: level1Admin_NL,
  NO: level1Admin_NO,
  NP: level1Admin_NP,
  NR: level1Admin_NR,
  NZ: level1Admin_NZ,
  OM: level1Admin_OM,
  PA: level1Admin_PA,
  PE: level1Admin_PE,
  PF: level1Admin_PF,
  PG: level1Admin_PG,
  PH: level1Admin_PH,
  PK: level1Admin_PK,
  PL: level1Admin_PL,
  PM: level1Admin_PM,
  PR: level1Admin_PR,
  PS: level1Admin_PS,
  PT: level1Admin_PT,
  PW: level1Admin_PW,
  PY: level1Admin_PY,
  QA: level1Admin_QA,
  RE: level1Admin_RE,
  RO: level1Admin_RO,
  RS: level1Admin_RS,
  RU: level1Admin_RU,
  RW: level1Admin_RW,
  SA: level1Admin_SA,
  SB: level1Admin_SB,
  SC: level1Admin_SC,
  SD: level1Admin_SD,
  SE: level1Admin_SE,
  SG: level1Admin_SG,
  SH: level1Admin_SH,
  SI: level1Admin_SI,
  SJ: level1Admin_SJ,
  SK: level1Admin_SK,
  SL: level1Admin_SL,
  SM: level1Admin_SM,
  SN: level1Admin_SN,
  SO: level1Admin_SO,
  SR: level1Admin_SR,
  SS: level1Admin_SS,
  ST: level1Admin_ST,
  SV: level1Admin_SV,
  SY: level1Admin_SY,
  SZ: level1Admin_SZ,
  TD: level1Admin_TD,
  TF: level1Admin_TF,
  TG: level1Admin_TG,
  TH: level1Admin_TH,
  TJ: level1Admin_TJ,
  TK: level1Admin_TK,
  TL: level1Admin_TL,
  TM: level1Admin_TM,
  TN: level1Admin_TN,
  TO: level1Admin_TO,
  TR: level1Admin_TR,
  TT: level1Admin_TT,
  TV: level1Admin_TV,
  TW: level1Admin_TW,
  TZ: level1Admin_TZ,
  UA: level1Admin_UA,
  UG: level1Admin_UG,
  UM: level1Admin_UM,
  US: level1Admin_US,
  UY: level1Admin_UY,
  UZ: level1Admin_UZ,
  VC: level1Admin_VC,
  VE: level1Admin_VE,
  VI: level1Admin_VI,
  VN: level1Admin_VN,
  VU: level1Admin_VU,
  WF: level1Admin_WF,
  WS: level1Admin_WS,
  XK: level1Admin_XK,
  YE: level1Admin_YE,
  YT: level1Admin_YT,
  ZA: level1Admin_ZA,
  ZM: level1Admin_ZM,
  ZW: level1Admin_ZW,
};

// Custom field orders for countries whose layout genuinely differs from the
// standard (line1, line2, postalCode, city[, level1]). Countries that simply
// append a level-1 field after the standard sequence are handled automatically
// by standardFieldOrder below and must NOT be listed here.
const FIELD_ORDER_OVERRIDES: Partial<Record<CountryCode, AddressFieldKey[]>> = {
  // Postal code first (JP-style: code → region → city → street lines)
  JP: ["postalCode", "level1", "city", "line1", "line2"],
  KR: ["postalCode", "level1", "city", "line1", "line2"],
  TW: ["postalCode", "level1", "city", "line1", "line2"],

  // City before postal code — with curated level-1 options
  AU: ["line1", "line2", "city", "level1", "postalCode"],
  CA: ["line1", "line2", "city", "level1", "postalCode"],
  GB: ["line1", "line2", "city", "level1", "postalCode"],
  US: ["line1", "line2", "city", "level1", "postalCode"],

  // City before postal code — Americas
  AR: ["line1", "line2", "city", "level1", "postalCode"],
  BR: ["line1", "line2", "city", "level1", "postalCode"],
  CL: ["line1", "line2", "city", "level1", "postalCode"],
  CO: ["line1", "line2", "city", "level1", "postalCode"],
  CR: ["line1", "line2", "city", "level1", "postalCode"],
  DO: ["line1", "line2", "city", "level1", "postalCode"],
  EC: ["line1", "line2", "city", "level1", "postalCode"],
  MX: ["line1", "line2", "city", "level1", "postalCode"],
  PE: ["line1", "line2", "city", "level1", "postalCode"],
  PY: ["line1", "line2", "city", "level1", "postalCode"],
  UY: ["line1", "line2", "city", "level1", "postalCode"],
  VE: ["line1", "line2", "city", "level1", "postalCode"],

  // City before postal code — Europe / Middle East / Africa
  IE: ["line1", "line2", "city", "level1", "postalCode"],
  IL: ["line1", "line2", "city", "level1", "postalCode"],
  NG: ["line1", "line2", "city", "level1", "postalCode"],
  ZA: ["line1", "line2", "city", "level1", "postalCode"],

  // City before postal code — Asia / Oceania
  BD: ["line1", "line2", "city", "level1", "postalCode"],
  CN: ["line1", "line2", "city", "level1", "postalCode"],
  ID: ["line1", "line2", "city", "level1", "postalCode"],
  IN: ["line1", "line2", "city", "level1", "postalCode"],
  NZ: ["line1", "line2", "city", "level1", "postalCode"],
  PH: ["line1", "line2", "city", "level1", "postalCode"],
  PK: ["line1", "line2", "city", "level1", "postalCode"],
  TH: ["line1", "line2", "city", "level1", "postalCode"],
  VN: ["line1", "line2", "city", "level1", "postalCode"],
};

function standardFieldOrder(code: CountryCode): AddressFieldKey[] {
  // Standard layout: street lines, postal code (when present), city.
  // Appends level1 at the end for countries with a curated division list that
  // follow the default postalCode→city ordering (e.g. ES, IT).
  const fields: AddressFieldKey[] = ["line1", "line2"];
  if (postalPattern(code)) fields.push("postalCode");
  fields.push("city");
  if (LEVEL1_OPTIONS[code]) fields.push("level1");
  return fields;
}

function buildConfig(code: CountryCode): CountryAddressConfig {
  const data = COUNTRY_DATA[code];
  const pattern = postalPattern(code);
  const addressFields = FIELD_ORDER_OVERRIDES[code] ?? standardFieldOrder(code);
  return {
    code,
    name: data?.name ?? code,
    addressFields,
    ...(pattern && { postalCodePattern: pattern }),
  };
}

// Every supported country gets a concrete config. Field order is curated where
// a bespoke layout is needed, otherwise generated from COUNTRY_DATA"; the
// postal-code pattern always comes from COUNTRY_DATA. Built as a typed Record
// so callers never have to handle a missing config for a supported code.
export const COUNTRIES_ADDRESSES = Object.fromEntries(COUNTRY_CODES.map((code) => [code, buildConfig(code)])) as Record<
  CountryCode,
  CountryAddressConfig
>;

export const COUNTRY_LIST = Object.values(COUNTRIES_ADDRESSES).sort((a, b) => a.name.localeCompare(b.name));

// Simple { code, name } list of every country GeoNames knows about, derived
// from the generated COUNTRY_DATA. Used to populate the country selector so
// users can pick any country, not just the curated subset that has a full
// address-field config.
export const ALL_COUNTRY_OPTIONS = Object.values(COUNTRY_DATA)
  .map((country) => ({ code: country.code, name: country.name }))
  .sort((country1, country2) => country1.name.localeCompare(country2.name));

export function getCountryConfig(code: string): CountryAddressConfig | undefined {
  const countryCode = isCountryCode(code) ? code : null;
  if (!countryCode) return;
  return COUNTRIES_ADDRESSES[countryCode];
}

// All 27 EU member states as of 2024.
const EU_COUNTRY_CODES = new Set([
  "AT",
  "BE",
  "BG",
  "CY",
  "CZ",
  "DE",
  "DK",
  "EE",
  "ES",
  "FI",
  "FR",
  "GR",
  "HR",
  "HU",
  "IE",
  "IT",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SE",
  "SI",
  "SK",
]);

export function isEUCountry(code: string): boolean {
  return EU_COUNTRY_CODES.has(code.toUpperCase());
}
