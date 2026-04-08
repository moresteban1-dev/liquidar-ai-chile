// src/core/domain/value-objects/Money.ts

import { Result } from '../../shared/Result';

/**
 * Tipos de moneda soportados.
 * Se define como string para extensibilidad pero con sugerencias comunes.
 */
export type Currency = 'CLP' | 'USD' | 'EUR' | string;

/**
 * Value Object que representa un monto monetario.
 * 
 * INMUTABLE — todas las operaciones retornan nuevas instancias.
 * SEGURO — ningún método lanza excepciones, todos retornan Result o boolean.
 * 
 * Soporta operaciones aritméticas, comparaciones y formateo.
 */
export class Money {
  // ═══════════════════════════════════════════
  // Constructor privado — usar factories
  // ═══════════════════════════════════════════
  
  private constructor(
    private readonly _amount: number,
    private readonly _currency: string
  ) {
    // Congelar para garantizar inmutabilidad
    Object.freeze(this);
  }

  // ═══════════════════════════════════════════
  // Factories
  // ═══════════════════════════════════════════

  /**
   * Crea una instancia de Money validada.
   * 
   * @param amount - Monto (debe ser finito y >= 0)
   * @param currency - Código ISO 4217 (3 letras)
   * @returns Result con Money válido o error descriptivo
   * 
   * @example
   * const price = Money.create(1500, 'CLP');
   * if (price.isSuccess()) {
   *   console.log(price.getValue().format()); // "$1.500"
   * }
   */
  static create(amount: number, currency: string = 'CLP'): Result<Money, string> {
    if (amount === null || amount === undefined) {
      return Result.fail('Money: amount is required');
    }

    if (!Number.isFinite(amount)) {
      return Result.fail('Money: amount must be a finite number');
    }

    if (amount < 0) {
      return Result.fail(`Money: amount cannot be negative (received: ${amount})`);
    }

    if (!currency || typeof currency !== 'string') {
      return Result.fail('Money: currency is required');
    }

    if (currency.length !== 3) {
      return Result.fail(`Money: currency must be a 3-letter ISO code (received: "${currency}")`);
    }

    // Redondear a 2 decimales para evitar problemas de punto flotante
    const rounded = Math.round(amount * 100) / 100;
    return Result.ok(new Money(rounded, currency.toUpperCase()));
  }

  /**
   * Crea Money con monto cero.
   * Útil como valor inicial en reducciones.
   */
  static zero(currency: string = 'CLP'): Money {
    return new Money(0, currency.toUpperCase());
  }

  /**
   * Reconstruye Money desde persistencia (sin validación estricta).
   * Usar solo en mappers/hidratación desde DB.
   */
  static reconstitute(amount: number, currency: string): Money {
    return new Money(
      Math.round((amount ?? 0) * 100) / 100, 
      (currency ?? 'CLP').toUpperCase()
    );
  }

  // ═══════════════════════════════════════════
  // Getters (readonly)
  // ═══════════════════════════════════════════

  get amount(): number {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }

  // ═══════════════════════════════════════════
  // Operaciones Aritméticas
  // Todas retornan Result — NUNCA throw
  // ═══════════════════════════════════════════

  /**
   * Suma dos Money del mismo currency.
   * 
   * @example
   * const total = price1.add(price2);
   */
  add(other: Money): Result<Money, string> {
    const currencyCheck = this.ensureSameCurrency(other, 'add');
    if (currencyCheck) return Result.fail(currencyCheck);

    return Result.ok(new Money(
      Math.round((this._amount + other._amount) * 100) / 100,
      this._currency
    ));
  }

  /**
   * Resta otro Money. No permite resultados negativos.
   * 
   * @example
   * const remaining = total.subtract(discount);
   */
  subtract(other: Money): Result<Money, string> {
    const currencyCheck = this.ensureSameCurrency(other, 'subtract');
    if (currencyCheck) return Result.fail(currencyCheck);

    const result = Math.round((this._amount - other._amount) * 100) / 100;

    if (result < 0) {
      return Result.fail(`Money: subtraction would result in negative (${this._amount} - ${other._amount} = ${result})`);
    }

    return Result.ok(new Money(result, this._currency));
  }

  /**
   * Multiplica por un factor escalar.
   * 
   * @param factor - Multiplicador (debe ser >= 0 y finito)
   * 
   * @example
   * const doubled = price.multiply(2);
   * const withQuantity = unitPrice.multiply(quantity);
   */
  multiply(factor: number): Result<Money, string> {
    if (!Number.isFinite(factor)) {
      return Result.fail('Money.multiply: factor must be a finite number');
    }

    if (factor < 0) {
      return Result.fail('Money.multiply: factor cannot be negative');
    }

    return Result.ok(new Money(
      Math.round(this._amount * factor * 100) / 100,
      this._currency
    ));
  }

  /**
   * Divide por un divisor. No permite división por cero.
   * 
   * @example
   * const unitPrice = totalPrice.divide(quantity);
   */
  divide(divisor: number): Result<Money, string> {
    if (!Number.isFinite(divisor)) {
      return Result.fail('Money.divide: divisor must be a finite number');
    }

    if (divisor === 0) {
      return Result.fail('Money.divide: cannot divide by zero');
    }

    if (divisor < 0) {
      return Result.fail('Money.divide: divisor cannot be negative');
    }

    return Result.ok(new Money(
      Math.round((this._amount / divisor) * 100) / 100,
      this._currency
    ));
  }

  /**
   * Calcula un porcentaje de este monto.
   * 
   * @param percent - Porcentaje (ej: 19 para 19%)
   * 
   * @example
   * const tax = subtotal.percentage(19);     // 19% del subtotal
   * const discount = price.percentage(10);   // 10% de descuento
   */
  percentage(percent: number): Result<Money, string> {
    if (!Number.isFinite(percent)) {
      return Result.fail('Money.percentage: percent must be a finite number');
    }
    if (percent < 0 || percent > 100) {
      return Result.fail('Money.percentage: percent must be between 0 and 100');
    }
    return this.multiply(percent / 100);
  }

  /**
   * Aplica un markup porcentual sobre este monto.
   * 
   * @param markupPercent - Porcentaje de markup (ej: 25 para 25%)
   * @returns Monto con markup aplicado
   * 
   * @example
   * const providerPrice = Money.create(1000, 'CLP').getValue();
   * const clientPrice = providerPrice.applyMarkup(25);
   * // clientPrice = 1250
   */
  applyMarkup(markupPercent: number): Result<Money, string> {
    if (!Number.isFinite(markupPercent)) {
      return Result.fail('Money.applyMarkup: percent must be finite');
    }

    if (markupPercent < 0) {
      return Result.fail('Money.applyMarkup: percent cannot be negative');
    }

    return this.multiply(1 + (markupPercent / 100));
  }

  /**
   * Aplica un descuento porcentual sobre este monto.
   * 
   * @param discountPercent - Porcentaje de descuento (ej: 20 para 20%)
   * @returns Monto con descuento aplicado
   */
  applyDiscount(discountPercent: number): Result<Money, string> {
    if (!Number.isFinite(discountPercent)) {
      return Result.fail('Money.applyDiscount: percent must be finite');
    }
    if (discountPercent < 0 || discountPercent > 100) {
      return Result.fail('Money.applyDiscount: percent must be between 0 and 100');
    }

    return this.multiply(1 - (discountPercent / 100));
  }

  // ═══════════════════════════════════════════
  // Comparaciones
  // Retornan boolean — NUNCA throw
  // En caso de currencies diferentes → false
  // ═══════════════════════════════════════════

  /**
   * ¿Este monto es mayor que otro?
   * Retorna false si las currencies no coinciden.
   */
  isGreaterThan(other: Money): boolean {
    if (this._currency !== other._currency) return false;
    return this._amount > other._amount;
  }

  /**
   * ¿Este monto es mayor o igual que otro?
   */
  isGreaterThanOrEqual(other: Money): boolean {
    if (this._currency !== other._currency) return false;
    return this._amount >= other._amount;
  }

  /**
   * ¿Este monto es menor que otro?
   */
  isLessThan(other: Money): boolean {
    if (this._currency !== other._currency) return false;
    return this._amount < other._amount;
  }

  /**
   * ¿Este monto es menor o igual que otro?
   */
  isLessThanOrEqual(other: Money): boolean {
    if (this._currency !== other._currency) return false;
    return this._amount <= other._amount;
  }

  /**
   * ¿Son iguales en monto Y currency?
   */
  equals(other: Money): boolean {
    return (
      this._amount === other._amount && 
      this._currency === other._currency
    );
  }

  /**
   * ¿Tienen la misma currency?
   */
  isSameCurrency(other: Money): boolean {
    return this._currency === other._currency;
  }

  // ═══════════════════════════════════════════
  // Predicados
  // ═══════════════════════════════════════════

  isZero(): boolean {
    return this._amount === 0;
  }

  isPositive(): boolean {
    return this._amount > 0;
  }

  // ═══════════════════════════════════════════
  // Formateo y Serialización
  // ═══════════════════════════════════════════

  /**
   * Formatea el monto según locale.
   * 
   * @example
   * money.format()          // "$1.500" (es-CL por defecto)
   * money.format('en-US')   // "$1,500.00"
   */
  format(locale: string = 'es-CL'): string {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: this._currency,
        minimumFractionDigits: this._currency === 'CLP' ? 0 : 2,
        maximumFractionDigits: this._currency === 'CLP' ? 0 : 2,
      }).format(this._amount);
    } catch {
      // Fallback si Intl no soporta el locale/currency
      return `${this._currency} ${this._amount.toFixed(2)}`;
    }
  }

  /**
   * Formatea como string simple (sin símbolo de moneda).
   * 
   * @example
   * money.formatPlain() // "1500.00"
   */
  formatPlain(): string {
    return this._amount.toFixed(2);
  }

  /**
   * Serialización para JSON/DB.
   */
  toJSON(): { amount: number; currency: string } {
    return {
      amount: this._amount,
      currency: this._currency,
    };
  }

  /**
   * Representación legible para logging.
   */
  toString(): string {
    return `${this._currency} ${this._amount}`;
  }

  // ═══════════════════════════════════════════
  // Utilidades Estáticas
  // ═══════════════════════════════════════════

  /**
   * Suma un array de Money.
   * 
   * @example
   * const total = Money.sum([price1, price2, price3], 'CLP');
   */
  static sum(moneys: Money[], currency: string = 'CLP'): Result<Money, string> {
    if (!moneys || moneys.length === 0) {
      return Result.ok(Money.zero(currency));
    }

    let total = Money.zero(currency);

    for (const money of moneys) {
      if (!money) continue;
      const addResult = total.add(money);
      if (addResult.isFailure()) {
        return Result.fail(addResult.getError());
      }
      total = addResult.getValue();
    }

    return Result.ok(total);
  }

  /**
   * Encuentra el mínimo de un array de Money.
   */
  static min(moneys: Money[]): Money | null {
    if (moneys.length === 0) return null;

    return moneys.reduce((min, current) => 
      current.isLessThan(min) ? current : min
    );
  }

  /**
   * Encuentra el máximo de un array de Money.
   */
  static max(moneys: Money[]): Money | null {
    if (moneys.length === 0) return null;

    return moneys.reduce((max, current) => 
      current.isGreaterThan(max) ? current : max
    );
  }

  // ═══════════════════════════════════════════
  // Helpers Privados
  // ═══════════════════════════════════════════

  private ensureSameCurrency(other: Money, operation: string): string | null {
    if (this._currency !== other._currency) {
      return `Money.${operation}: cannot ${operation} ${this._currency} and ${other._currency}`;
    }
    return null;
  }
}
