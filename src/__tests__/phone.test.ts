import { describe, expect, it } from 'vitest';
import { COUNTRY_CODES } from '../data/countries';
import { COUNTRY_PHONE_DATA } from '../data/phone-data';
import {
  applyPhoneMask,
  conformToMask,
  countMaskDigitSlots,
  countRequiredMaskDigits,
  getCountryFromLocale,
  getCountryPhoneCatalog,
  getCountryPhoneConfig,
  getDefaultCountryForCallingCode,
  nationalFromE164,
  parseCountryFromE164,
  toE164,
  validateExtractedPhone,
} from '../phone';

const CALLING_CODE_RE = /^\+\d+$/;

/** Looks up a phone config, failing the test if the code is unknown (narrows out `undefined`). */
function requireConfig(code: Parameters<typeof getCountryPhoneConfig>[0]) {
  const config = getCountryPhoneConfig(code);
  if (!config) throw new Error(`no phone config for ${code}`);
  return config;
}

describe('phone data', () => {
  it('covers every supported country exactly once', () => {
    expect(COUNTRY_PHONE_DATA.length).toBe(COUNTRY_CODES.length);
    const seen = new Set(COUNTRY_PHONE_DATA.map((c) => c.code));
    expect(seen.size).toBe(COUNTRY_PHONE_DATA.length);
    for (const code of COUNTRY_CODES) expect(seen.has(code), code).toBe(true);
  });

  it('stores every calling code in +<digits> form', () => {
    for (const config of COUNTRY_PHONE_DATA) expect(config.callingCode, config.code).toMatch(CALLING_CODE_RE);
  });

  it('looks up a config by ISO code', () => {
    expect(getCountryPhoneConfig('US')?.callingCode).toBe('+1');
    expect(getCountryPhoneConfig('FR')?.callingCode).toBe('+33');
  });
});

describe('E.164 round-tripping', () => {
  it('builds E.164 and drops the trunk prefix', () => {
    const fr = requireConfig('FR');
    expect(toE164('0612345678', fr)).toBe('+33612345678');
  });

  it('recovers the national number from an E.164 string', () => {
    const fr = requireConfig('FR');
    expect(nationalFromE164('+33612345678', fr)).toBe('612345678');
  });
});

describe('parseCountryFromE164', () => {
  const catalog = getCountryPhoneCatalog();

  it('defaults +1 to the US and +44 to GB', () => {
    expect(parseCountryFromE164('+12125550123', catalog)?.code).toBe('US');
    expect(parseCountryFromE164('+442071234567', catalog)?.code).toBe('GB');
  });

  it('disambiguates shared codes by area code', () => {
    expect(parseCountryFromE164('+12042345678', catalog)?.code).toBe('CA');
    expect(parseCountryFromE164('+441481234567', catalog)?.code).toBe('GG');
  });

  it('returns null for input without a leading +', () => {
    expect(parseCountryFromE164('2125550123', catalog)).toBeNull();
  });
});

describe('validation', () => {
  it('validates a well-formed national number', () => {
    const us = requireConfig('US');
    expect(validateExtractedPhone('2125550123', us)).toBe(true);
    expect(validateExtractedPhone('12', us)).toBe(false);
  });

  it('accepts a number typed with or without the trunk prefix', () => {
    const au = requireConfig('AU');
    expect(validateExtractedPhone('412345678', au)).toBe(true);
    expect(validateExtractedPhone('0412345678', au)).toBe(true);
  });
});

describe('mask helpers', () => {
  it('formats digits through a mask, emitting leading literals', () => {
    expect(applyPhoneMask('([000]) [000]-[0000]', '2125550123')).toBe('(212) 555-0123');
  });

  it('honors user-typed separators via conformToMask', () => {
    expect(conformToMask('([000]) [000]-[0000]', '(212) 555-0123')).toBe('(212) 555-0123');
  });

  it('counts required and total digit slots', () => {
    expect(countRequiredMaskDigits('([000]) [000]-[0000]')).toBe(10);
    expect(countMaskDigitSlots('[000] [9]')).toBe(4);
  });
});

describe('locale resolution', () => {
  it('extracts the region subtag', () => {
    expect(getCountryFromLocale('en-US')).toBe('US');
    expect(getCountryFromLocale('zh-Hans-CN')).toBe('CN');
    expect(getCountryFromLocale('es')).toBeNull();
  });

  it('exposes the default country for a shared calling code', () => {
    expect(getDefaultCountryForCallingCode('+1')).toBe('US');
    expect(getDefaultCountryForCallingCode('+999')).toBeUndefined();
  });
});
