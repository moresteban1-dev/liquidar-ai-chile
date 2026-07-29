import { Result } from '../shared/Result';

/**
 * Value Object for Chilean RUT (Rol Único Tributario / RUN).
 * Implements strict Modulo 11 validation and standardized formatting.
 */
export class Rut {
  private readonly rawRut: string; // e.g. "12345678K"
  private readonly formattedRut: string; // e.g. "12.345.678-K"

  private constructor(rawRut: string, formattedRut: string) {
    this.rawRut = rawRut;
    this.formattedRut = formattedRut;
  }

  /**
   * Validates and creates a Chilean RUT Value Object.
   */
  public static create(inputRut: string): Result<Rut> {
    if (!inputRut || typeof inputRut !== 'string') {
      return Result.fail<Rut>("RutInvalidInput: RUT input must be a non-empty string.");
    }

    const cleanInput = inputRut.replace(/[^0-9kK]/g, '').toUpperCase();

    if (cleanInput.length < 8 || cleanInput.length > 9) {
      return Result.fail<Rut>("RutInvalidLength: RUT must be between 8 and 9 characters including Verification Digit.");
    }

    const body = cleanInput.slice(0, -1);
    const dv = cleanInput.slice(-1);

    if (!/^\d+$/.test(body)) {
      return Result.fail<Rut>("RutInvalidBody: RUT body must contain numbers only.");
    }

    const calculatedDv = Rut.calculateVerificationDigit(body);

    if (dv !== calculatedDv) {
      return Result.fail<Rut>(`RutInvalidVerificationDigit: Provided DV '${dv}' does not match calculated DV '${calculatedDv}'.`);
    }

    const formatted = Rut.formatBodyAndDv(body, dv);
    return Result.ok<Rut>(new Rut(cleanInput, formatted));
  }

  /**
   * Modulo 11 algorithm for Chilean RUT verification digit calculation.
   */
  private static calculateVerificationDigit(body: string): string {
    let sum = 0;
    let multiplier = 2;

    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body.charAt(i), 10) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const remainder = 11 - (sum % 11);
    if (remainder === 11) return '0';
    if (remainder === 10) return 'K';
    return remainder.toString();
  }

  private static formatBodyAndDv(body: string, dv: string): string {
    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formattedBody}-${dv}`;
  }

  public get value(): string {
    return this.rawRut;
  }

  public get formatted(): string {
    return this.formattedRut;
  }

  public equals(other: Rut): boolean {
    return this.rawRut === other.rawRut;
  }
}
