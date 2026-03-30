import { Result, Success, Failure } from '@core/shared/Result';
import { Guard } from '@core/shared/Guard';

/**
 * Address Value Object
 * 
 * Representa una dirección física completa.
 * Validada y estructurada para uso en órdenes y entregas.
 * 
 * @example
 * const result = Address.create({
 *   street: 'Av. Reforma 123',
 *   city: 'Ciudad de México',
 *   state: 'CDMX',
 *   zipCode: '06600',
 *   country: 'México'
 * })
 */

export interface AddressProps {
  readonly street: string;
  readonly city: string;
  readonly state: string;
  readonly zipCode: string;
  readonly country: string;
  readonly apartment?: string;
  readonly references?: string;
}

export class Address {
  private readonly props: AddressProps;

  private constructor(props: AddressProps) {
    this.props = props;
  }

  public static create(props: AddressProps): Result<Address, string> {
    // Validar campos requeridos
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { value: props.street, argumentName: 'street' },
      { value: props.city, argumentName: 'city' },
      { value: props.state, argumentName: 'state' },
      { value: props.zipCode, argumentName: 'zipCode' },
      { value: props.country, argumentName: 'country' }
    ]);

    if (!guardResult.succeeded) {
      return new Failure(guardResult.message!);
    }

    // Normalizar valores
    const normalized: AddressProps = {
      street: props.street.trim(),
      city: props.city.trim(),
      state: props.state.trim(),
      zipCode: props.zipCode.trim().replace(/\s/g, ''),
      country: props.country.trim(),
      apartment: props.apartment?.trim(),
      references: props.references?.trim()
    };

    // Validar que no estén vacíos después del trim
    if (normalized.street.length === 0) {
      return new Failure('Street cannot be empty');
    }

    if (normalized.city.length === 0) {
      return new Failure('City cannot be empty');
    }

    if (normalized.state.length === 0) {
      return new Failure('State cannot be empty');
    }

    // Validar código postal
    if (!Address.isValidZipCode(normalized.zipCode, normalized.country)) {
      return new Failure('Invalid zip code format');
    }

    // Validar longitud de campos
    const streetLengthResult = Guard.maxLength(normalized.street, 200, 'street');
    if (!streetLengthResult.succeeded) {
      return new Failure(streetLengthResult.message!);
    }

    const cityLengthResult = Guard.maxLength(normalized.city, 100, 'city');
    if (!cityLengthResult.succeeded) {
      return new Failure(cityLengthResult.message!);
    }

    return new Success(new Address(normalized));
  }

  /**
   * Retorna la dirección en formato de una línea
   */
  public toSingleLine(): string {
    const parts = [
      this.props.street,
      this.props.apartment ? `Apt ${this.props.apartment}` : null,
      this.props.city,
      this.props.state,
      this.props.zipCode,
      this.props.country
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Retorna la dirección en formato multi-línea
   */
  public toMultiLine(): string[] {
    const lines = [this.props.street];

    if (this.props.apartment) {
      lines.push(`Apartment ${this.props.apartment}`);
    }

    lines.push(`${this.props.city}, ${this.props.state} ${this.props.zipCode}`);
    lines.push(this.props.country);

    if (this.props.references) {
      lines.push(`Referencias: ${this.props.references}`);
    }

    return lines;
  }

  /**
   * Verifica si la dirección está en un país específico
   */
  public isInCountry(country: string): boolean {
    return this.props.country.toLowerCase() === country.toLowerCase();
  }

  /**
   * Obtiene la región/estado
   */
  public getState(): string {
    return this.props.state;
  }

  /**
   * Obtiene la ciudad
   */
  public getCity(): string {
    return this.props.city;
  }

  /**
   * Obtiene el código postal
   */
  public getZipCode(): string {
    return this.props.zipCode;
  }

  /**
   * Verifica si tiene referencias de entrega
   */
  public hasReferences(): boolean {
    return Boolean(this.props.references && this.props.references.length > 0);
  }

  public equals(other: Address): boolean {
    return (
      this.props.street === other.props.street &&
      this.props.apartment === other.props.apartment &&
      this.props.city === other.props.city &&
      this.props.state === other.props.state &&
      this.props.zipCode === other.props.zipCode &&
      this.props.country === other.props.country
    );
  }

  // Helpers privados
  private static isValidZipCode(zipCode: string, country: string): boolean {
    const patterns: Record<string, RegExp> = {
      'México': /^\d{5}$/,
      'USA': /^\d{5}(-\d{4})?$/,
      'United States': /^\d{5}(-\d{4})?$/,
      'España': /^\d{5}$/,
      'Spain': /^\d{5}$/,
      'Colombia': /^\d{6}$/,
      'Argentina': /^[A-Z]\d{4}[A-Z]{3}$/,
      'Chile': /^\d{7}$/,
    };

    const pattern = patterns[country];
    if (!pattern) {
      // Si no hay patrón específico, validar que tenga al menos 3-10 caracteres alfanuméricos
      return /^[A-Z0-9]{3,10}$/i.test(zipCode);
    }

    return pattern.test(zipCode);
  }

  // Getters
  get street(): string {
    return this.props.street;
  }

  get city(): string {
    return this.props.city;
  }

  get state(): string {
    return this.props.state;
  }

  get zipCode(): string {
    return this.props.zipCode;
  }

  get country(): string {
    return this.props.country;
  }

  get apartment(): string | undefined {
    return this.props.apartment;
  }

  get references(): string | undefined {
    return this.props.references;
  }

  // Serialización
  public toJSON(): AddressProps {
    return { ...this.props };
  }

  public toString(): string {
    return this.toSingleLine();
  }
}
