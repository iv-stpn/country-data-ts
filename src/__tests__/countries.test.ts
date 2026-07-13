import { describe, expect, it } from "vitest";
import { COUNTRY_CODES, COUNTRY_DATA, type CountryCode, isCountryCode } from "../countries";

describe("countries data", () => {
  it("covers 250 ISO 3166-1 alpha-2 countries", () => {
    expect(COUNTRY_CODES.length).toBe(250);
    expect(Object.keys(COUNTRY_DATA).length).toBe(250);
  });

  it("has a fully-populated record for every code", () => {
    for (const code of COUNTRY_CODES) {
      const entry = COUNTRY_DATA[code];
      expect(entry, code).toBeDefined();
      expect(entry.code).toBe(code);
      expect(entry.name.length).toBeGreaterThan(0);
      expect(entry.iso3).toMatch(/^[A-Z]{3}$/);
    }
  });

  it("keeps COUNTRY_CODES and COUNTRY_DATA keys in sync", () => {
    expect(new Set(COUNTRY_CODES)).toEqual(new Set(Object.keys(COUNTRY_DATA)));
  });

  it("has unique, well-formed codes", () => {
    expect(new Set(COUNTRY_CODES).size).toBe(COUNTRY_CODES.length);
    for (const code of COUNTRY_CODES) expect(code).toMatch(/^[A-Z]{2}$/);
  });

  it("compiles every non-null postal-code regex", () => {
    for (const code of COUNTRY_CODES) {
      const raw = COUNTRY_DATA[code].postalCodeRegex;
      if (raw) expect(() => new RegExp(raw), code).not.toThrow();
    }
  });

  describe("isCountryCode", () => {
    it("narrows known codes", () => {
      expect(isCountryCode("FR")).toBe(true);
      expect(isCountryCode("US")).toBe(true);
    });

    it("rejects unknown codes", () => {
      expect(isCountryCode("XX")).toBe(false);
      expect(isCountryCode("fr")).toBe(false);
      expect(isCountryCode("")).toBe(false);
    });

    it("acts as a type guard", () => {
      const value: string = "DE";
      if (isCountryCode(value)) {
        const code: CountryCode = value;
        expect(COUNTRY_DATA[code].name).toBe("Germany");
      }
    });
  });
});
