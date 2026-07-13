import { describe, expect, it } from 'vitest';
import { isEUCountry } from '../address';
import { COUNTRY_CODES } from '../data/countries';
import {
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
} from '../tax';

describe('TAX_CONFIG coverage', () => {
  it('has an entry for every ISO country code', () => {
    for (const code of COUNTRY_CODES) expect(TAX_CONFIG[code], `missing tax entry for ${code}`).toBeDefined();
  });
});

describe('computeTaxOutcome — OSS (EU) always has nexus', () => {
  it('charges the headline rate for EU consumers even without a passed nexus', () => {
    const outcome = computeConsumerTaxOutcome({ country: 'FR' });
    expect(outcome.taxSystem).toBe('oss');
    expect(outcome.baseTax).toBe(20);
    expect(outcome.effectiveTax).toBe(20);
  });

  it('reverse-charges B2B with a valid tax ID (0%)', () => {
    const outcome = computeTaxOutcome({ country: 'IT', isBusiness: true, hasTaxId: true });
    expect(outcome.baseTax).toBe(0);
    expect(outcome.effectiveTax).toBe(0);
    expect(outcome.flags.buyerSelfAccounts).toBe(true);
  });

  it('still collects B2B without a tax ID at the standard rate', () => {
    const outcome = computeTaxOutcome({ country: 'ES', isBusiness: true, hasTaxId: false });
    expect(outcome.baseTax).toBe(21);
    expect(outcome.effectiveTax).toBe(21);
  });
});

describe('computeTaxOutcome — non-OSS gated by nexus', () => {
  it('resolves baseTax but collects nothing without nexus', () => {
    const outcome = computeConsumerTaxOutcome({ country: 'JP' });
    expect(outcome.taxSystem).toBe('country-specific');
    expect(outcome.baseTax).toBe(10);
    expect(outcome.effectiveTax).toBe(0);
  });

  it('collects once nexus is present', () => {
    const outcome = computeConsumerTaxOutcome({ country: 'JP', hasNexus: true });
    expect(outcome.effectiveTax).toBe(10);
  });

  it('returns an empty outcome for an unknown country', () => {
    const outcome = computeConsumerTaxOutcome({ country: '' });
    expect(outcome.taxSystem).toBeNull();
    expect(outcome.baseTax).toBeNull();
  });
});

describe('regional tax (US / CA)', () => {
  it('exposes region-specific tax system for regional countries', () => {
    const us = computeConsumerTaxOutcome({ country: 'US', hasNexus: true });
    expect(us.taxSystem).toBe('region-specific');
    const ca = computeConsumerTaxOutcome({ country: 'CA', hasNexus: true });
    expect(ca.taxSystem).toBe('region-specific');
  });

  it('flags regional countries and needs a state to resolve baseTax', () => {
    expect(hasRegionalTax('US')).toBe(true);
    const noState = computeConsumerTaxOutcome({ country: 'US', hasNexus: true });
    expect(noState.baseTax).toBeNull();
    expect(noState.flags.regionalRates).toBe(true);
    const withState = computeConsumerTaxOutcome({ country: 'US', state: 'CA', hasNexus: true });
    expect(withState.baseTax).toBe(7.25);
  });

  it('uses per-region tax labels for Canada', () => {
    expect(getTaxLabel('CA', 'QC')).toBe('GST + QST');
    expect(getLocalTaxLabel('CA', 'QC')).toBe('TPS + TVQ');
  });
});

describe('tax labels and identifiers', () => {
  it('returns null labels for countries with no consumption tax', () => {
    expect(getTaxLabel('HK')).toBeNull();
    expect(getBusinessTaxNumberLabel('HK')).toBeNull();
  });

  it('uses jurisdiction-specific identifier names', () => {
    expect(getBusinessTaxNumberLabel('AU')).toBe('ABN');
    expect(getBusinessTaxNumberLabel('US')).toBe('EIN');
    expect(getBusinessTaxNumberLabel('FR')).toBe('VAT Number');
  });

  it('identifies EU (OSS) countries', () => {
    expect(isEUCountry('FR')).toBe(true);
    expect(isEUCountry('de')).toBe(true);
    expect(isEUCountry('US')).toBe(false);
  });
});

describe('validateTax / normalizeTax', () => {
  it('validates a well-formed business tax number, ignoring case and spaces', () => {
    expect(validateTax('de123456789', 'DE')).toBe(true);
    expect(validateTax('DE 123 456 789', 'DE')).toBe(true);
    expect(validateTax('DE12345', 'DE')).toBe(false);
  });

  it('returns false when the country has no tax pattern', () => {
    expect(validateTax('ANYTHING', 'HK')).toBe(false);
  });

  it('normalizes to upper-case without whitespace', () => {
    expect(normalizeTax('  fr xx 123 456 789 ')).toBe('FRXX123456789');
  });

  it('exposes tax-id metadata via getTaxConfig', () => {
    const fr = getTaxConfig('FR');
    expect(fr?.taxPrefix).toBe('FR');
    expect(fr?.taxExample).toBe('FRXX123456789');
  });
});
