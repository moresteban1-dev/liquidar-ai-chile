import { describe, it, expect } from 'vitest';
import { PhoneNumber } from './PhoneNumber';

describe('PhoneNumber Value Object', () => {
  describe('Creation', () => {
    it('should create valid phone number', () => {
      const result = PhoneNumber.create('+525512345678');

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().value).toBe('+525512345678');
    });

    it('should normalize spaces and dashes', () => {
      const result = PhoneNumber.create('+52 55 1234 5678');

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().value).toBe('+525512345678');
    });

    it('should normalize parentheses', () => {
      const result = PhoneNumber.create('+1 (555) 123-4567');

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().value).toBe('+15551234567');
    });

    it('should reject phone without +', () => {
      const result = PhoneNumber.create('525512345678');

      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toContain('must start with +');
    });

    it('should reject phone with letters', () => {
      const result = PhoneNumber.create('+52abc123');

      expect(result.isFailure()).toBe(true);
    });

    it('should reject phone too short', () => {
      const result = PhoneNumber.create('+521234');

      expect(result.isFailure()).toBe(true);
    });

    it('should reject phone too long', () => {
      const result = PhoneNumber.create('+5212345678901234567890');

      expect(result.isFailure()).toBe(true);
    });

    it('should accept various country codes', () => {
      const phones = [
        '+15551234567',     // USA
        '+525512345678',    // México
        '+34912345678',     // España
        '+442012345678',    // UK
      ];

      phones.forEach(phone => {
        const result = PhoneNumber.create(phone);
        expect(result.isSuccess()).toBe(true);
      });
    });
  });

  describe('Country operations', () => {
    it('should get country code for México', () => {
      const phone = PhoneNumber.create('+525512345678').getValue();

      expect(phone.getCountryCode()).toBe('+52');
    });

    it('should get country code for USA', () => {
      const phone = PhoneNumber.create('+15551234567').getValue();

      expect(phone.getCountryCode()).toBe('+1');
    });

    it('should check if phone is from specific country', () => {
      const phone = PhoneNumber.create('+525512345678').getValue();

      expect(phone.isCountry('+52')).toBe(true);
      expect(phone.isCountry('+1')).toBe(false);
    });

    it('should get local number', () => {
      const phone = PhoneNumber.create('+525512345678').getValue();

      expect(phone.getLocalNumber()).toBe('5512345678');
    });
  });

  describe('Formatting', () => {
    it('should format USA number', () => {
      const phone = PhoneNumber.create('+15551234567').getValue();
      const formatted = phone.format();

      expect(formatted).toContain('(555)');
      expect(formatted).toContain('123-4567');
    });

    it('should format México number', () => {
      const phone = PhoneNumber.create('+525512345678').getValue();
      const formatted = phone.format();

      expect(formatted).toContain('+52');
      expect(formatted).toContain('55');
    });
  });

  describe('Equality', () => {
    it('should be equal for same number', () => {
      const phone1 = PhoneNumber.create('+525512345678').getValue();
      const phone2 = PhoneNumber.create('+525512345678').getValue();

      expect(phone1.equals(phone2)).toBe(true);
    });

    it('should be equal regardless of formatting', () => {
      const phone1 = PhoneNumber.create('+52 55 1234 5678').getValue();
      const phone2 = PhoneNumber.create('+525512345678').getValue();

      expect(phone1.equals(phone2)).toBe(true);
    });

    it('should not be equal for different numbers', () => {
      const phone1 = PhoneNumber.create('+525512345678').getValue();
      const phone2 = PhoneNumber.create('+525587654321').getValue();

      expect(phone1.equals(phone2)).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should convert to string', () => {
      const phone = PhoneNumber.create('+525512345678').getValue();

      expect(phone.toString()).toBe('+525512345678');
    });

    it('should convert to JSON', () => {
      const phone = PhoneNumber.create('+525512345678').getValue();

      expect(phone.toJSON()).toBe('+525512345678');
    });
  });
});
