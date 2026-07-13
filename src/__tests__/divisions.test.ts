import { describe, expect, it } from 'vitest';
import {
  getLevel1LocalName,
  getLevel1LocalNames,
  getLevel2LocalName,
  getLevel2LocalNames,
  getLevel2Options,
  hasLevel2Options,
  hasLocalNames,
  pickLocalName,
} from '../divisions';

describe('getLevel2Options', () => {
  it('returns all divisions for a country with level-2 data', () => {
    const us = getLevel2Options('US');
    expect(us.length).toBeGreaterThan(0);
    // US has 3143 counties / county-equivalents
    expect(us.length).toBe(3143);
  });

  it('filters by level-1 value', () => {
    const nyCounties = getLevel2Options('US', 'NY');
    expect(nyCounties.length).toBe(62);
    // Every entry must be parented under NY
    expect(nyCounties.every((d) => d.level1Value === 'NY')).toBe(true);
  });

  it('returns a known entry with correct shape', () => {
    const nyCounties = getLevel2Options('US', 'NY');
    const albany = nyCounties.find((d) => d.label === 'Albany County');
    expect(albany).toBeDefined();
    expect(albany).toMatchObject({ value: '001', label: 'Albany County', level1Value: 'NY' });
  });

  it('returns an empty array for a level-1 value that has no children', () => {
    expect(getLevel2Options('US', 'ZZ')).toEqual([]);
  });

  it('returns an empty array for an unrecognised country code', () => {
    expect(getLevel2Options('XX')).toEqual([]);
  });

  it('is case-sensitive for country codes (only uppercase accepted)', () => {
    // CountryCode is uppercase-only; 'us' is not a valid CountryCode
    expect(getLevel2Options('us')).toEqual([]);
  });

  it('returns results as a readonly array (no mutation at runtime)', () => {
    const fr = getLevel2Options('FR');
    expect(Array.isArray(fr)).toBe(true);
    expect(fr.length).toBeGreaterThan(0);
  });

  it('all entries have value, label, and level1Value strings', () => {
    const jp = getLevel2Options('JP');
    for (const entry of jp) {
      expect(typeof entry.value).toBe('string');
      expect(typeof entry.label).toBe('string');
      expect(typeof entry.level1Value).toBe('string');
    }
  });

  it('country prefix is stripped from value and level1Value', () => {
    // AE-101 -> "101", AE-01 -> "01"
    const ae = getLevel2Options('AE');
    const abuDhabi = ae.find((d) => d.label === 'Abu Dhabi Municipality');
    expect(abuDhabi).toBeDefined();
    expect(abuDhabi?.value).toBe('101');
    expect(abuDhabi?.level1Value).toBe('01');
  });
});

describe('hasLevel2Options', () => {
  it('returns true for a country with level-2 data', () => {
    expect(hasLevel2Options('US')).toBe(true);
    expect(hasLevel2Options('FR')).toBe(true);
    expect(hasLevel2Options('JP')).toBe(true);
  });

  it('returns false for an unrecognised country code', () => {
    expect(hasLevel2Options('XX')).toBe(false);
  });
});

describe('getLevel1LocalNames', () => {
  it('returns the language-keyed local names for a level-1 division', () => {
    // AE level-1 value "AZ" (Abu Dhabi) keys off officialCode AE-AZ
    const abuDhabi = getLevel1LocalNames('AE', 'AZ');
    expect(abuDhabi).toBeDefined();
    expect(abuDhabi?.en).toBe('Abu Dhabi');
    expect(abuDhabi?.ar).toBe('أبو ظبي');
  });

  it('joins local names onto the same value the option lists expose', () => {
    // US level-1 value "AL" is what resolveAddressField("US", "level1") yields
    const alabama = getLevel1LocalNames('US', 'AL');
    expect(alabama).toMatchObject({ en: 'Alabama', es: 'Alabama', fr: 'Alabama' });
  });

  it('returns undefined for an unknown division', () => {
    expect(getLevel1LocalNames('US', 'ZZ')).toBeUndefined();
  });

  it('returns undefined for an unrecognised country code', () => {
    expect(getLevel1LocalNames('XX', 'AL')).toBeUndefined();
  });

  it('is case-sensitive for country codes', () => {
    expect(getLevel1LocalNames('us', 'AL')).toBeUndefined();
  });
});

describe('getLevel2LocalNames', () => {
  it('returns local names keyed by parent level-1 and level-2 value', () => {
    // FR: level1Value "84", level2Value "01" -> Ain
    const ain = getLevel2LocalNames('FR', '84', '01');
    expect(ain).toBeDefined();
    expect(ain?.fr).toBe('Ain');
  });

  it('matches the values getLevel2Options exposes', () => {
    const nyCounties = getLevel2Options('US', 'NY');
    const first = nyCounties.find((d) => getLevel2LocalNames('US', d.level1Value, d.value));
    expect(first).toBeDefined();
    // Whatever county resolved, its English local name is a non-empty string
    const names = getLevel2LocalNames('US', first?.level1Value ?? '', first?.value ?? '');
    expect(typeof names?.en).toBe('string');
  });

  it('returns undefined when the parent level-1 has no localized children', () => {
    expect(getLevel2LocalNames('FR', 'ZZ', '01')).toBeUndefined();
  });

  it('returns undefined for an unrecognised country code', () => {
    expect(getLevel2LocalNames('XX', '84', '01')).toBeUndefined();
  });
});

describe('getLevel1LocalName / getLevel2LocalName', () => {
  it('resolves the first matching language', () => {
    expect(getLevel1LocalName('AE', 'AZ', ['en'])).toBe('Abu Dhabi');
    expect(getLevel1LocalName('AE', 'AZ', ['ar'])).toBe('أبو ظبي');
  });

  it('falls back through the preference list', () => {
    // no "zz" name for Abu Dhabi, falls back to "en"
    expect(getLevel1LocalName('AE', 'AZ', ['zz', 'en'])).toBe('Abu Dhabi');
  });

  it('accepts a single language string', () => {
    expect(getLevel1LocalName('US', 'AL', 'es')).toBe('Alabama');
  });

  it('returns undefined when no preferred language matches', () => {
    expect(getLevel1LocalName('US', 'AL', ['zz'])).toBeUndefined();
  });

  it('resolves level-2 names with fallback', () => {
    expect(getLevel2LocalName('FR', '84', '01', ['oc', 'fr'])).toBe('Ain');
    expect(getLevel2LocalName('FR', '84', '01', ['zz', 'fr'])).toBe('Ain');
  });
});

describe('pickLocalName', () => {
  it('picks the first available language', () => {
    expect(pickLocalName({ en: 'Bavaria', de: 'Bayern' }, ['fr', 'de'])).toBe('Bayern');
  });

  it('accepts a single language string', () => {
    expect(pickLocalName({ en: 'Bavaria', de: 'Bayern' }, 'en')).toBe('Bavaria');
  });

  it('returns undefined for undefined names', () => {
    expect(pickLocalName(undefined, ['en'])).toBeUndefined();
  });

  it('returns undefined when no language matches', () => {
    expect(pickLocalName({ en: 'Bavaria' }, ['fr', 'de'])).toBeUndefined();
  });
});

describe('hasLocalNames', () => {
  it('returns true for a country with localized divisions', () => {
    expect(hasLocalNames('FR')).toBe(true);
    expect(hasLocalNames('US')).toBe(true);
    expect(hasLocalNames('AE')).toBe(true);
  });

  it('returns false for an unrecognised country code', () => {
    expect(hasLocalNames('XX')).toBe(false);
  });
});
