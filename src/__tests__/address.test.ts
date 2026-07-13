import { describe, expect, it } from "vitest";
import {
  ALL_COUNTRY_OPTIONS,
  addressFieldLabel,
  COUNTRIES_ADDRESSES,
  COUNTRY_LIST,
  getCountryConfig,
  isAddressFieldRequired,
  isEUCountry,
  resolveAddressField,
} from "../address";
import { COUNTRY_CODES } from "../countries";

describe("address configs", () => {
  it("has a config for every supported country", () => {
    for (const code of COUNTRY_CODES) {
      const config = COUNTRIES_ADDRESSES[code];
      expect(config, code).toBeDefined();
      expect(config.code).toBe(code);
      expect(config.addressFields.length).toBeGreaterThan(0);
    }
  });

  it("always includes line1 and city in the field order", () => {
    for (const code of COUNTRY_CODES) {
      const { addressFields } = COUNTRIES_ADDRESSES[code];
      expect(addressFields, code).toContain("line1");
      expect(addressFields, code).toContain("city");
    }
  });

  it("compiles a case-insensitive postal pattern when one exists", () => {
    const fr = COUNTRIES_ADDRESSES.FR;
    expect(fr.postalCodePattern).toBeInstanceOf(RegExp);
    expect(fr.postalCodePattern?.test("75001")).toBe(true);
    expect(fr.postalCodePattern?.flags).toContain("i");
  });

  it("uses a curated field order for the US (city before postal, level1 select)", () => {
    const us = COUNTRIES_ADDRESSES.US;
    expect(us.addressFields).toEqual(["line1", "line2", "city", "level1", "postalCode"]);
    expect(getCountryConfig("US")).toBe(us);
  });

  it("exposes hand-curated level-1 options for countries GeoNames omits (SG)", () => {
    // Singapore has no admin1 list in GeoNames; the 5 CDC districts are curated
    // in level1-administrative-codes.curated.ts and merged into LEVEL1_OPTIONS.
    const sg = resolveAddressField("SG", "level1", "fullRegion");
    expect(sg.options).toBeDefined();
    expect(sg.options?.map((o) => o.value)).toEqual(["01", "02", "03", "04", "05"]);
    expect(sg.options?.[0]).toEqual({ value: "01", label: "Central Singapore" });
    expect(COUNTRIES_ADDRESSES.SG.addressFields).toContain("level1");
  });

  it("puts the postal code first for JP-style layouts", () => {
    expect(COUNTRIES_ADDRESSES.JP.addressFields[0]).toBe("postalCode");
    expect(COUNTRIES_ADDRESSES.KR.addressFields[0]).toBe("postalCode");
  });

  describe("resolveAddressField", () => {
    it("appends an optional suffix only to optional fields", () => {
      const line2 = resolveAddressField("US", "line2");
      expect(line2.required).toBe(false);
      expect(line2.label).toContain("(optional)");

      const line1 = resolveAddressField("US", "line1");
      expect(line1.required).toBe(true);
      expect(line1.label).not.toContain("(optional)");
    });

    it("exposes level1 options for countries with division data", () => {
      const level1 = resolveAddressField("US", "level1");
      expect(level1.options?.length).toBeGreaterThan(0);
    });

    it("localizes the level1 label from country data", () => {
      expect(addressFieldLabel("CA", "level1")).toBe("Province/Territory");
    });
  });

  describe("isAddressFieldRequired", () => {
    it("treats level1 as required only in region-collecting modes", () => {
      expect(isAddressFieldRequired("level1", "region")).toBe(true);
      expect(isAddressFieldRequired("level1", "full")).toBe(false);
    });

    it("treats line2 as always optional", () => {
      expect(isAddressFieldRequired("line2", "full")).toBe(false);
    });
  });

  it("sorts COUNTRY_LIST and ALL_COUNTRY_OPTIONS by name", () => {
    for (let i = 1; i < COUNTRY_LIST.length; i += 1) {
      expect(COUNTRY_LIST[i - 1]!.name.localeCompare(COUNTRY_LIST[i]!.name)).toBeLessThanOrEqual(0);
    }
    expect(ALL_COUNTRY_OPTIONS.length).toBe(COUNTRY_CODES.length);
  });

  it("recognizes EU member states", () => {
    expect(isEUCountry("FR")).toBe(true);
    expect(isEUCountry("de")).toBe(true);
    expect(isEUCountry("US")).toBe(false);
    expect(isEUCountry("GB")).toBe(false);
  });
});
