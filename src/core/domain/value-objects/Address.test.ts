import { describe, it, expect } from 'vitest';
import { Address } from './Address';

describe('Address Value Object', () => {
  const validProps = {
    street: 'Av. Reforma 123',
    city: 'Ciudad de México',
    state: 'CDMX',
    zipCode: '06600',
    country: 'México'
  };

  describe('Creation', () => {
    it('should create valid address', () => {
      const result = Address.create(validProps);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().street).toBe('Av. Reforma 123');
      expect(result.getValue().city).toBe('Ciudad de México');
    });

    it('should create address with apartment', () => {
      const result = Address.create({
        ...validProps,
        apartment: '4B'
      });

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().apartment).toBe('4B');
    });

    it('should create address with references', () => {
      const result = Address.create({
        ...validProps,
        references: 'Edificio azul, portón negro'
      });

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().references).toBe('Edificio azul, portón negro');
    });

    it('should trim whitespace', () => {
      const result = Address.create({
        street: '  Av. Reforma 123  ',
        city: '  Ciudad de México  ',
        state: '  CDMX  ',
        zipCode: ' 06600 ',
        country: '  México  '
      });

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().street).toBe('Av. Reforma 123');
      expect(result.getValue().zipCode).toBe('06600');
    });

    it('should reject empty street', () => {
      const result = Address.create({
        ...validProps,
        street: ''
      });

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toContain('empty');
    });

    it('should reject missing city', () => {
      const result = Address.create({
        ...validProps,
        city: null as any
      });

      expect(result.isFailure()).toBe(true);
    });

    it('should reject missing state', () => {
      const result = Address.create({
        ...validProps,
        state: undefined as any
      });

      expect(result.isFailure()).toBe(true);
    });

    it('should reject street too long', () => {
      const result = Address.create({
        ...validProps,
        street: 'a'.repeat(201)
      });

      expect(result.isFailure()).toBe(true);
    });

    it('should reject city too long', () => {
      const result = Address.create({
        ...validProps,
        city: 'a'.repeat(101)
      });

      expect(result.isFailure()).toBe(true);
    });
  });

  describe('Zip Code Validation', () => {
    it('should accept valid México zip code', () => {
      const result = Address.create({
        ...validProps,
        zipCode: '06600',
        country: 'México'
      });

      expect(result.isSuccess()).toBe(true);
    });

    it('should accept valid USA zip code', () => {
      const result = Address.create({
        ...validProps,
        zipCode: '90210',
        country: 'USA'
      });

      expect(result.isSuccess()).toBe(true);
    });

    it('should accept USA zip code with extension', () => {
      const result = Address.create({
        ...validProps,
        zipCode: '90210-1234',
        country: 'USA'
      });

      expect(result.isSuccess()).toBe(true);
    });

    it('should accept valid España zip code', () => {
      const result = Address.create({
        ...validProps,
        zipCode: '28001',
        country: 'España'
      });

      expect(result.isSuccess()).toBe(true);
    });

    it('should reject invalid México zip code', () => {
      const result = Address.create({
        ...validProps,
        zipCode: '1234',
        country: 'México'
      });

      expect(result.isFailure()).toBe(true);
    });

    it('should accept valid zip code for unknown country', () => {
      const result = Address.create({
        ...validProps,
        zipCode: 'ABC123',
        country: 'Unknown Country'
      });

      expect(result.isSuccess()).toBe(true);
    });
  });

  describe('Formatting', () => {
    it('should format to single line', () => {
      const address = Address.create(validProps).getValue();
      const formatted = address.toSingleLine();

      expect(formatted).toBe('Av. Reforma 123, Ciudad de México, CDMX, 06600, México');
    });

    it('should format to single line with apartment', () => {
      const address = Address.create({
        ...validProps,
        apartment: '4B'
      }).getValue();
      const formatted = address.toSingleLine();

      expect(formatted).toContain('Apt 4B');
    });

    it('should format to multi-line', () => {
      const address = Address.create(validProps).getValue();
      const lines = address.toMultiLine();

      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('Av. Reforma 123');
      expect(lines[1]).toBe('Ciudad de México, CDMX 06600');
      expect(lines[2]).toBe('México');
    });

    it('should include apartment in multi-line', () => {
      const address = Address.create({
        ...validProps,
        apartment: '4B'
      }).getValue();
      const lines = address.toMultiLine();

      expect(lines).toHaveLength(4);
      expect(lines[1]).toBe('Apartment 4B');
    });

    it('should include references in multi-line', () => {
      const address = Address.create({
        ...validProps,
        references: 'Edificio azul'
      }).getValue();
      const lines = address.toMultiLine();

      expect(lines[lines.length - 1]).toContain('Referencias: Edificio azul');
    });
  });

  describe('Queries', () => {
    it('should check if in country', () => {
      const address = Address.create(validProps).getValue();

      expect(address.isInCountry('México')).toBe(true);
      expect(address.isInCountry('USA')).toBe(false);
    });

    it('should check country case-insensitively', () => {
      const address = Address.create(validProps).getValue();

      expect(address.isInCountry('MÉXICO')).toBe(true);
      expect(address.isInCountry('méxico')).toBe(true);
    });

    it('should get state', () => {
      const address = Address.create(validProps).getValue();

      expect(address.getState()).toBe('CDMX');
    });

    it('should get city', () => {
      const address = Address.create(validProps).getValue();

      expect(address.getCity()).toBe('Ciudad de México');
    });

    it('should get zip code', () => {
      const address = Address.create(validProps).getValue();

      expect(address.getZipCode()).toBe('06600');
    });

    it('should check if has references', () => {
      const addressWithRefs = Address.create({
        ...validProps,
        references: 'Some reference'
      }).getValue();

      const addressWithoutRefs = Address.create(validProps).getValue();

      expect(addressWithRefs.hasReferences()).toBe(true);
      expect(addressWithoutRefs.hasReferences()).toBe(false);
    });
  });

  describe('Equality', () => {
    it('should be equal for same address', () => {
      const address1 = Address.create(validProps).getValue();
      const address2 = Address.create(validProps).getValue();

      expect(address1.equals(address2)).toBe(true);
    });

    it('should not be equal for different streets', () => {
      const address1 = Address.create(validProps).getValue();
      const address2 = Address.create({
        ...validProps,
        street: 'Calle Otra 456'
      }).getValue();

      expect(address1.equals(address2)).toBe(false);
    });

    it('should not be equal for different apartments', () => {
      const address1 = Address.create({
        ...validProps,
        apartment: '1A'
      }).getValue();
      const address2 = Address.create({
        ...validProps,
        apartment: '2B'
      }).getValue();

      expect(address1.equals(address2)).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should convert to JSON', () => {
      const address = Address.create(validProps).getValue();
      const json = address.toJSON();

      expect(json).toEqual(validProps);
    });

    it('should convert to string', () => {
      const address = Address.create(validProps).getValue();
      const str = address.toString();

      expect(str).toBe('Av. Reforma 123, Ciudad de México, CDMX, 06600, México');
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle Mexican address', () => {
      const result = Address.create({
        street: 'Calle Morelos 45',
        city: 'Guadalajara',
        state: 'Jalisco',
        zipCode: '44100',
        country: 'México',
        apartment: '3',
        references: 'Entre Hidalgo y Juárez'
      });

      expect(result.isSuccess()).toBe(true);
    });

    it('should handle USA address', () => {
      const result = Address.create({
        street: '1600 Pennsylvania Avenue NW',
        city: 'Washington',
        state: 'DC',
        zipCode: '20500',
        country: 'USA'
      });

      expect(result.isSuccess()).toBe(true);
    });

    it('should handle Spanish address', () => {
      const result = Address.create({
        street: 'Calle Mayor 1',
        city: 'Madrid',
        state: 'Madrid',
        zipCode: '28013',
        country: 'España'
      });

      expect(result.isSuccess()).toBe(true);
    });
  });
});
