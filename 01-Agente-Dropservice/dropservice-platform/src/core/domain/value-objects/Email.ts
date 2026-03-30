import { Result, Success, Failure } from '@core/shared/Result';
import { Guard } from '@core/shared/Guard';

/**
 * Email Value Object
 * 
 * Representa un email válido.
 * Garantiza formato correcto y normaliza el valor.
 * 
 * @example
 * const result = Email.create('user@example.com')
 * if (result.isSuccess()) {
 *   const email = result.value
 * }
 */

export class Email {
  private readonly _value: string;

  private constructor(email: string) {
    this._value = email;
  }

  public static create(email: string): Result<Email, string> {
    // Guard: validar que email existe
    const guardResult = Guard.againstNullOrUndefined(email, 'email');
    if (!guardResult.succeeded) {
      return new Failure(guardResult.message!);
    }

    // Normalizar: trim y lowercase
    const normalized = email.trim().toLowerCase();

    // Guard: validar que no está vacío después del trim
    if (normalized.length === 0) {
      return new Failure('Email cannot be empty');
    }

    // Business rule: validar formato de email
    const validationResult = Guard.isValidEmail(normalized);
    if (!validationResult.succeeded) {
      return new Failure(validationResult.message!);
    }

    // Business rule: longitud máxima (RFC 5321)
    const maxLength = 254;
    if (normalized.length > maxLength) {
      return new Failure(`Email exceeds maximum length of ${maxLength} characters`);
    }

    // Business rule: validar dominio
    if (!Email.hasValidDomain(normalized)) {
      return new Failure('Email domain is invalid');
    }

    return new Success(new Email(normalized));
  }

  /**
   * Verifica si el email pertenece a un dominio específico
   */
  public isDomain(domain: string): boolean {
    const emailDomain = this._value.split('@')[1];
    return emailDomain?.toLowerCase() === domain.toLowerCase();
  }

  /**
   * Obtiene el dominio del email
   */
  public getDomain(): string {
    return this._value.split('@')[1] || '';
  }

  /**
   * Obtiene la parte local del email (antes del @)
   */
  public getLocalPart(): string {
    return this._value.split('@')[0] || '';
  }

  /**
   * Verifica si es un email corporativo (no free email providers)
   */
  public isCorporate(): boolean {
    const freeProviders = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      'icloud.com',
      'mail.com',
      'aol.com'
    ];

    const domain = this.getDomain();
    return !freeProviders.includes(domain);
  }

  get value(): string {
    return this._value;
  }

  public equals(other: Email): boolean {
    return this._value === other._value;
  }

  // Helpers privados
  private static hasValidDomain(email: string): boolean {
    const domain = email.split('@')[1];
    if (!domain) {
      return false;
    }

    // Debe tener al menos un punto
    if (!domain.includes('.')) {
      return false;
    }

    // No puede empezar o terminar con punto
    if (domain.startsWith('.') || domain.endsWith('.')) {
      return false;
    }

    // No puede tener puntos consecutivos
    if (domain.includes('..')) {
      return false;
    }

    return true;
  }

  public toString(): string {
    return this._value;
  }

  public toJSON(): string {
    return this._value;
  }
}
