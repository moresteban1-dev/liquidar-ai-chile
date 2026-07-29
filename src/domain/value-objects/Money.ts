import { Result } from '../shared/Result';

/**
 * Value Object representing Chilean Peso (CLP) Monetary values.
 * Enforces business rules: CLP has 0 decimals, non-negative amounts for prices,
 * and built-in 19% IVA (Chilean Tax) calculations.
 */
export class Money {
  private readonly amountInCLP: number;

  private constructor(amount: number) {
    // CLP amounts are strictly integers
    this.amountInCLP = Math.round(amount);
  }

  /**
   * Factory method to create a Money instance.
   * Ensures amount is integer and non-negative (unless explicitly allowed).
   */
  public static create(amount: number): Result<Money> {
    if (isNaN(amount) || !isFinite(amount)) {
      return Result.fail<Money>("MoneyAmountInvalid: Amount must be a valid finite number.");
    }

    if (amount < 0) {
      return Result.fail<Money>("MoneyAmountNegative: CLP Monetary value cannot be negative.");
    }

    return Result.ok<Money>(new Money(amount));
  }

  public static zero(): Money {
    return new Money(0);
  }

  public get value(): number {
    return this.amountInCLP;
  }

  /**
   * Formats the amount to Chilean standard currency format ($X.XXX.XXX)
   */
  public format(): string {
    const formattedNumber = new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(this.amountInCLP);

    return formattedNumber;
  }

  /**
   * Adds another Money instance.
   */
  public add(other: Money): Money {
    return new Money(this.amountInCLP + other.amountInCLP);
  }

  /**
   * Subtracts another Money instance. Returns Result failure if result < 0.
   */
  public subtract(other: Money): Result<Money> {
    const difference = this.amountInCLP - other.amountInCLP;
    if (difference < 0) {
      return Result.fail<Money>("MoneySubtractionNegative: Resulting amount cannot be negative.");
    }
    return Result.ok<Money>(new Money(difference));
  }

  /**
   * Multiplies money by a factor (e.g. quantity).
   */
  public multiply(factor: number): Result<Money> {
    if (factor < 0) {
      return Result.fail<Money>("MoneyMultiplierNegative: Multiplier cannot be negative.");
    }
    return Result.ok<Money>(new Money(this.amountInCLP * factor));
  }

  /**
   * Calculates 19% Chilean IVA details when this amount represents Net price.
   */
  public calculateIvaFromNet(): { net: Money; iva: Money; total: Money } {
    const ivaValue = Math.round(this.amountInCLP * 0.19);
    const totalValue = this.amountInCLP + ivaValue;
    return {
      net: this,
      iva: new Money(ivaValue),
      total: new Money(totalValue),
    };
  }

  /**
   * Deconstructs a Gross (Total with IVA) price into Net and 19% IVA components.
   */
  public extractIvaFromGross(): { net: Money; iva: Money; total: Money } {
    const netValue = Math.round(this.amountInCLP / 1.19);
    const ivaValue = this.amountInCLP - netValue;
    return {
      net: new Money(netValue),
      iva: new Money(ivaValue),
      total: this,
    };
  }

  public isGreaterThan(other: Money): boolean {
    return this.amountInCLP > other.amountInCLP;
  }

  public isGreaterThanOrEqual(other: Money): boolean {
    return this.amountInCLP >= other.amountInCLP;
  }

  public isLessThan(other: Money): boolean {
    return this.amountInCLP < other.amountInCLP;
  }

  public equals(other: Money): boolean {
    return this.amountInCLP === other.amountInCLP;
  }
}
