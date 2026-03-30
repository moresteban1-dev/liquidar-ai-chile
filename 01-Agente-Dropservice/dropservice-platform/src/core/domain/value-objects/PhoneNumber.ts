import { Result, Success, Failure } from '@core/shared/Result';
import { Guard } from '@core/shared/Guard';

/**
 * PhoneNumber Value Object
 * 
 * Representa un número telefónico válido.
 * Almacena el número en formato E.164 (+[código país][número])
 * 
 * @example
 * const result = PhoneNumber.create('+525512345678')
 * if (result.isSuccess()) {
 *   const phone = result.value
 *   console.log(phone.value) // "+525512345678"
 * }
 */

export class PhoneNumber {
  private readonly _value: string;
  private readonly _countryCode: string;

  private constructor(value: string, countryCode: string) {
    this._value = value;
    this._countryCode = countryCode;
  }

  /**
   * Crea un PhoneNumber desde formato E.164
   * 
   * @param phone - Número en formato +[código][número]
   */
  public static create(phone: string): Result<PhoneNumber, string> {
    // Guard: validar que phone existe
    const guardResult = Guard.againstNullOrUndefined(phone, 'phone');
    if (!guardResult.succeeded) {
      return new Failure(guardResult.message!);
    }

    // Normalizar: eliminar espacios y caracteres especiales
    const normalized = PhoneNumber.normalize(phone);

    // Business rule: debe empezar con +
    if (!normalized.startsWith('+')) {
      return new Failure('Phone number must start with + (E.164 format)');
    }

    // Business rule: solo debe contener + y dígitos
    if (!/^\+\d+$/.test(normalized)) {
      return new Failure('Phone number must contain only digits after +');
    }

    // Business rule: longitud entre 8 y 15 caracteres (RFC 3966)
    if (normalized.length < 8 || normalized.length > 16) {
      return new Failure('Phone number length must be between 8 and 16 characters');
    }

    // Extraer código de país
    const countryCode = PhoneNumber.extractCountryCode(normalized);
    if (!countryCode) {
      return new Failure('Invalid country code');
    }

    return new Success(new PhoneNumber(normalized, countryCode));
  }

  /**
   * Verifica si el número pertenece a un país específico
   */
  public isCountry(countryCode: string): boolean {
    return this._countryCode === countryCode;
  }

  /**
   * Obtiene el código de país
   */
  public getCountryCode(): string {
    return this._countryCode;
  }

  /**
   * Obtiene el número sin código de país
   */
  public getLocalNumber(): string {
    return this._value.substring(this._countryCode.length);
  }

  /**
   * Formatea el número para display
   * 
   * @example
   * phone.format() // "+52 55 1234 5678"
   */
  public format(): string {
    const country = this._countryCode;
    const local = this.getLocalNumber();

    // Formato específico por país
    switch (country) {
      case '+1': // USA/Canada
        return `${country} (${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
      case '+52': // México
        return `${country} ${local.slice(0, 2)} ${local.slice(2, 6)} ${local.slice(6)}`;
      case '+34': // España
        return `${country} ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
      default:
        return this._value;
    }
  }

  get value(): string {
    return this._value;
  }

  public equals(other: PhoneNumber): boolean {
    return this._value === other._value;
  }

  // Helpers privados
  private static normalize(phone: string): string {
    // Eliminar espacios, guiones, paréntesis
    return phone.replace(/[\s\-\(\)]/g, '');
  }

  private static extractCountryCode(phone: string): string | null {
    // Códigos de país más comunes (1-3 dígitos)
    const countryCodes = [
      '+1',   // USA/Canada
      '+52',  // México
      '+34',  // España
      '+44',  // UK
      '+49',  // Alemania
      '+33',  // Francia
      '+39',  // Italia
      '+351', // Portugal
      '+54',  // Argentina
      '+55',  // Brasil
      '+56',  // Chile
      '+57',  // Colombia
      '+58',  // Venezuela
    ];

    for (const code of countryCodes) {
      if (phone.startsWith(code)) {
        return code;
      }
    }

    // Si no está en la lista, asumir 1-3 dígitos
    const match = phone.match(/^\+(\d{1,3})/);
    return match ? `+${match[1]}` : null;
  }

  public toString(): string {
    return this._value;
  }

  public toJSON(): string {
    return this._value;
  }
}
