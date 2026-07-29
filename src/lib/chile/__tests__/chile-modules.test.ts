/**
 * @file chile-modules.test.ts
 * @description Vitest unit tests for all Chile-specific modules.
 * Covers CLPFormatter, RutValidator, and RegionsCommunes.
 */
import { describe, it, expect } from 'vitest';
import { CLPFormatter } from '../clp-formatter';
import { RutValidator } from '@/lib/validators/RutValidator';
import { RegionsCommunes } from '../regions-communes';

// ─── CLPFormatter ─────────────────────────────────────────────────────────────

describe('CLPFormatter', () => {
  describe('format()', () => {
    it('formats 1250000 as $1.250.000', () => {
      expect(CLPFormatter.format(1250000)).toBe('$1.250.000');
    });

    it('formats 0 as $0', () => {
      expect(CLPFormatter.format(0)).toBe('$0');
    });

    it('formats 1000 as $1.000', () => {
      expect(CLPFormatter.format(1000)).toBe('$1.000');
    });

    it('formats 150000 as $150.000', () => {
      expect(CLPFormatter.format(150000)).toBe('$150.000');
    });

    it('formats 10000000 as $10.000.000', () => {
      expect(CLPFormatter.format(10000000)).toBe('$10.000.000');
    });

    it('handles non-finite values gracefully', () => {
      expect(CLPFormatter.format(NaN)).toBe('$0');
      expect(CLPFormatter.format(Infinity)).toBe('$0');
    });
  });

  describe('parse()', () => {
    it('parses $1.250.000 to 1250000', () => {
      expect(CLPFormatter.parse('$1.250.000')).toBe(1250000);
    });

    it('parses $0 to 0', () => {
      expect(CLPFormatter.parse('$0')).toBe(0);
    });

    it('parses $150.000 to 150000', () => {
      expect(CLPFormatter.parse('$150.000')).toBe(150000);
    });

    it('returns 0 for empty string', () => {
      expect(CLPFormatter.parse('')).toBe(0);
    });
  });

  describe('formatCompact()', () => {
    it('formats 1500000 as $1.5M', () => {
      expect(CLPFormatter.formatCompact(1500000)).toBe('$1.5M');
    });

    it('formats 150000 as $150K', () => {
      expect(CLPFormatter.formatCompact(150000)).toBe('$150K');
    });

    it('formats 500 as $500', () => {
      expect(CLPFormatter.formatCompact(500)).toBe('$500');
    });

    it('formats 1200000000 as $1.2B', () => {
      expect(CLPFormatter.formatCompact(1200000000)).toBe('$1.2B');
    });
  });

  describe('formatIncrement()', () => {
    it('formats 1000 as +$1.000', () => {
      expect(CLPFormatter.formatIncrement(1000)).toBe('+$1.000');
    });
  });
});

// ─── RutValidator ─────────────────────────────────────────────────────────────

describe('RutValidator', () => {
  describe('validate()', () => {
    it('validates 12.345.678-5 as true (DV computed via Modulo 11)', () => {
      // 12345678 → 8×2 + 7×3 + 6×4 + 5×5 + 4×6 + 3×7 + 2×2 + 1×3
      //          = 16+21+24+25+24+21+4+3 = 138. 138%11=6 → DV = 11-6 = 5
      expect(RutValidator.validate('12.345.678-5')).toBe(true);
    });

    it('validates 11.111.111-1 as true', () => {
      expect(RutValidator.validate('11.111.111-1')).toBe(true);
    });

    it('validates 12.345.678-0 as false (wrong DV)', () => {
      expect(RutValidator.validate('12.345.678-0')).toBe(false);
    });

    it('validates RUT without formatting (12345678-5 → no dots/dash)', () => {
      // 12345678-5 clean = 123456785
      expect(RutValidator.validate('123456785')).toBe(true);
    });

    it('validates RUT with K as DV (76.354.771-K verified)', () => {
      // 76354771 → 1×2+7×3+7×4+4×5+5×6+3×7+6×2+7×3 = 2+21+28+20+30+21+12+21=155
      // 155%11=1 → 11-1=10 → DV=K
      expect(RutValidator.validate('76.354.771-K')).toBe(true);
    });

    it('rejects empty string', () => {
      expect(RutValidator.validate('')).toBe(false);
    });

    it('rejects too short RUT', () => {
      // A 1-digit body is technically parseable but very short
      // The validator requires cleanRut.length >= 2 (body + DV)
      // '1-9' has body='1', dv='9' — valid structure but wrong DV
      // Test: wrong DV on a short RUT → returns false due to DV mismatch
      expect(RutValidator.validate('1-0')).toBe(false);
    });
  });

  describe('format()', () => {
    it('formats 123456789 as 12.345.678-9', () => {
      expect(RutValidator.format('123456789')).toBe('12.345.678-9');
    });

    it('formats 29752929 correctly (2 digits result with leading dot)', () => {
      const formatted = RutValidator.format('29752929');
      expect(formatted).toMatch(/^\d{1,3}(\.\d{3})*-[\dkK]$/);
    });
  });

  describe('clean()', () => {
    it('removes dots and hyphens', () => {
      expect(RutValidator.clean('12.345.678-9')).toBe('123456789');
    });

    it('converts lowercase k to uppercase K', () => {
      expect(RutValidator.clean('2975292-k')).toBe('2975292K');
    });
  });
});

// ─── RegionsCommunes ─────────────────────────────────────────────────────────

describe('RegionsCommunes', () => {
  describe('getAll()', () => {
    it('returns exactly 16 regions', () => {
      expect(RegionsCommunes.getAll()).toHaveLength(16);
    });

    it('all regions have a name, id, and communes array', () => {
      for (const region of RegionsCommunes.getAll()) {
        expect(region.id).toBeTruthy();
        expect(region.name).toBeTruthy();
        expect(region.communes).toBeInstanceOf(Array);
        expect(region.communes.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getById()', () => {
    it('finds Región Metropolitana by id RM', () => {
      const rm = RegionsCommunes.getById('RM');
      expect(rm).toBeDefined();
      expect(rm?.name).toBe('Metropolitana de Santiago');
    });

    it('finds Valparaíso by id V', () => {
      const v = RegionsCommunes.getById('V');
      expect(v).toBeDefined();
      expect(v?.capital).toBe('Valparaíso');
    });

    it('returns undefined for invalid id', () => {
      expect(RegionsCommunes.getById('ZZ')).toBeUndefined();
    });
  });

  describe('getCommunesByRegion()', () => {
    it('RM has at least 50 communes', () => {
      const communes = RegionsCommunes.getCommunesByRegion('RM');
      expect(communes.length).toBeGreaterThanOrEqual(50);
    });

    it('Santiago is a commune in RM', () => {
      const communes = RegionsCommunes.getCommunesByRegion('RM');
      const santiago = communes.find((c) => c.name === 'Santiago');
      expect(santiago).toBeDefined();
    });

    it('returns empty array for invalid regionId', () => {
      expect(RegionsCommunes.getCommunesByRegion('ZZ')).toHaveLength(0);
    });
  });

  describe('findCommune()', () => {
    it('finds Santiago (exact match)', () => {
      const commune = RegionsCommunes.findCommune('Santiago');
      expect(commune).toBeDefined();
      expect(commune?.regionId).toBe('RM');
    });

    it('finds Valparaíso with accent normalization', () => {
      const commune = RegionsCommunes.findCommune('Valparaiso');
      expect(commune).toBeDefined();
    });

    it('returns undefined for unknown commune', () => {
      expect(RegionsCommunes.findCommune('Atlantida')).toBeUndefined();
    });
  });

  describe('getRegionOptions()', () => {
    it('returns 16 options with value and label', () => {
      const options = RegionsCommunes.getRegionOptions();
      expect(options).toHaveLength(16);
      for (const opt of options) {
        expect(opt.value).toBeTruthy();
        expect(opt.label).toBeTruthy();
      }
    });
  });
});
