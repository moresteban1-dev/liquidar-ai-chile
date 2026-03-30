import { describe, it, expect } from 'vitest';
import { Email } from './Email';

describe('Email Value Object', () => {
  describe('Creation', () => {
    it('should create valid email', () => {
      const result = Email.create('user@example.com');

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().value).toBe('user@example.com');
    });

    it('should normalize to lowercase', () => {
      const result = Email.create('USER@EXAMPLE.COM');

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().value).toBe('user@example.com');
    });

    it('should trim whitespace', () => {
      const result = Email.create('  user@example.com  ');

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue().value).toBe('user@example.com');
    });

    it('should reject empty email', () => {
      const result = Email.create('');

      expect(result.isFailure()).toBe(true);
    });

    it('should reject email without @', () => {
      const result = Email.create('userexample.com');

      expect(result.isFailure()).toBe(true);
    });

    it('should reject email without domain', () => {
      const result = Email.create('user@');

      expect(result.isFailure()).toBe(true);
    });

    it('should reject email without local part', () => {
      const result = Email.create('@example.com');

      expect(result.isFailure()).toBe(true);
    });

    it('should reject email with multiple @', () => {
      const result = Email.create('user@@example.com');

      expect(result.isFailure()).toBe(true);
    });

    it('should reject email without TLD', () => {
      const result = Email.create('user@example');

      expect(result.isFailure()).toBe(true);
    });

    it('should reject email with consecutive dots in domain', () => {
      const result = Email.create('user@example..com');

      expect(result.isFailure()).toBe(true);
    });

    it('should accept email with subdomain', () => {
      const result = Email.create('user@mail.example.com');

      expect(result.isSuccess()).toBe(true);
    });

    it('should accept email with plus sign', () => {
      const result = Email.create('user+tag@example.com');

      expect(result.isSuccess()).toBe(true);
    });

    it('should accept email with numbers', () => {
      const result = Email.create('user123@example456.com');

      expect(result.isSuccess()).toBe(true);
    });
  });

  describe('Domain operations', () => {
    it('should get domain', () => {
      const email = Email.create('user@example.com').getValue();

      expect(email.getDomain()).toBe('example.com');
    });

    it('should get local part', () => {
      const email = Email.create('user@example.com').getValue();

      expect(email.getLocalPart()).toBe('user');
    });

    it('should check if email is from specific domain', () => {
      const email = Email.create('user@example.com').getValue();

      expect(email.isDomain('example.com')).toBe(true);
      expect(email.isDomain('other.com')).toBe(false);
    });

    it('should check domain case-insensitively', () => {
      const email = Email.create('user@example.com').getValue();

      expect(email.isDomain('EXAMPLE.COM')).toBe(true);
    });
  });

  describe('Corporate email detection', () => {
    it('should identify corporate email', () => {
      const email = Email.create('user@company.com').getValue();

      expect(email.isCorporate()).toBe(true);
    });

    it('should identify Gmail as non-corporate', () => {
      const email = Email.create('user@gmail.com').getValue();

      expect(email.isCorporate()).toBe(false);
    });

    it('should identify Yahoo as non-corporate', () => {
      const email = Email.create('user@yahoo.com').getValue();

      expect(email.isCorporate()).toBe(false);
    });

    it('should identify Outlook as non-corporate', () => {
      const email = Email.create('user@outlook.com').getValue();

      expect(email.isCorporate()).toBe(false);
    });
  });

  describe('Equality', () => {
    it('should be equal for same email', () => {
      const email1 = Email.create('user@example.com').getValue();
      const email2 = Email.create('user@example.com').getValue();

      expect(email1.equals(email2)).toBe(true);
    });

    it('should be equal regardless of original case', () => {
      const email1 = Email.create('USER@EXAMPLE.COM').getValue();
      const email2 = Email.create('user@example.com').getValue();

      expect(email1.equals(email2)).toBe(true);
    });

    it('should not be equal for different emails', () => {
      const email1 = Email.create('user1@example.com').getValue();
      const email2 = Email.create('user2@example.com').getValue();

      expect(email1.equals(email2)).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should convert to string', () => {
      const email = Email.create('user@example.com').getValue();

      expect(email.toString()).toBe('user@example.com');
    });

    it('should convert to JSON', () => {
      const email = Email.create('user@example.com').getValue();

      expect(email.toJSON()).toBe('user@example.com');
    });
  });
});
