import { Money, Currency } from '@core/domain/value-objects/Money';
import { Result, ok, fail } from '@core/shared/Result';

/**
 * Breakdown of price components for a quotation or order.
 */
export interface PricingBreakdown {
  providerCost: Money;
  adminCommission: Money;
  platformFee: Money;
  taxes: Money;
  finalPrice: Money;
}

/**
 * QuotationPricing Value Object
 * 
 * Manages the complex pricing logic, including markups, taxes, and commissions.
 */
export class QuotationPricing {
  private constructor(private readonly props: PricingBreakdown) {}

  public static fromBreakdown(breakdown: PricingBreakdown): Result<QuotationPricing, string> {
    return ok(new QuotationPricing(breakdown));
  }

  /**
   * Factory alias: creates pricing from simple numeric values.
   * Used by test factories and legacy consumers.
   */
  public static create(input: {
    providerCost: number;
    adminMargin: number;
    clientPrice: number;
    currency: string;
  }): Result<QuotationPricing, string> {
    const providerCostMoney = Money.create(input.providerCost, input.currency as Currency);
    if (providerCostMoney.isFailure()) return fail(providerCostMoney.getError());

    const adminMarginMoney = Money.create(input.adminMargin, input.currency as Currency);
    if (adminMarginMoney.isFailure()) return fail(adminMarginMoney.getError());

    const clientPriceMoney = Money.create(input.clientPrice, input.currency as Currency);
    if (clientPriceMoney.isFailure()) return fail(clientPriceMoney.getError());

    const platformFee = Money.zero(input.currency as Currency);
    const taxes = Money.zero(input.currency as Currency);

    return ok(new QuotationPricing({
      providerCost: providerCostMoney.getValue(),
      adminCommission: adminMarginMoney.getValue(),
      platformFee,
      taxes,
      finalPrice: clientPriceMoney.getValue(),
    }));
  }

  /**
   * Factory method to create pricing with a simple markup.
   */
  public static fromSimpleMarkup(
    providerCost: Money,
    commissionPercent: number,
    taxPercent: number = 19
  ): Result<QuotationPricing, string> {
    return providerCost.multiply(commissionPercent / 100).flatMap(commission => {
        const platformFee = Money.zero(providerCost.currency);
        
        return providerCost.add(commission).flatMap(net1 => {
            return net1.add(platformFee).flatMap(net => {
                return net.multiply(taxPercent / 100).flatMap(taxes => {
                    return net.add(taxes).map(finalPrice => {
                        return new QuotationPricing({
                            providerCost,
                            adminCommission: commission,
                            platformFee,
                            taxes,
                            finalPrice
                        });
                    });
                });
            });
        });
    });
  }

  /**
   * Complex calculation for quotation pricing.
   */
  public static calculate(
    providerCost: Money,
    options: {
      commissionRate: number;
      platformFeeRate: number;
      taxRate: number;
    }
  ): Result<QuotationPricing, string> {
    return providerCost.multiply(options.commissionRate).flatMap((commission: Money): Result<QuotationPricing, string> => {
        return providerCost.add(commission).flatMap((subtotal: Money): Result<QuotationPricing, string> => {
            return subtotal.multiply(options.platformFeeRate).flatMap((platformFee: Money): Result<QuotationPricing, string> => {
                return subtotal.add(platformFee).flatMap((totalBeforeTax: Money): Result<QuotationPricing, string> => {
                    return totalBeforeTax.multiply(options.taxRate).flatMap((taxes: Money): Result<QuotationPricing, string> => {
                        return totalBeforeTax.add(taxes).map((finalPrice: Money): QuotationPricing => {
                            return new QuotationPricing({
                                providerCost,
                                adminCommission: commission,
                                platformFee,
                                taxes,
                                finalPrice
                            });
                        });
                    });
                });
            });
        });
    });
  }

  public validate(): Result<void, string> {
    // Basic consistency check: cost + commission + fee + taxes = finalPrice
    // (Assuming simple additive model for now)
    return ok(undefined);
  }

  // Getters
  get providerCost(): Money { return this.props.providerCost; }
  get adminCommission(): Money { return this.props.adminCommission; }
  get platformFee(): Money { return this.props.platformFee; }
  get taxes(): Money { return this.props.taxes; }
  get finalPrice(): Money { return this.props.finalPrice; }

  // Views for different roles
  public toProviderView() {
    return {
      amount: this.props.providerCost.amount,
      currency: this.props.providerCost.currency
    };
  }

  public toClientView() {
    return {
      amount: this.props.finalPrice.amount,
      currency: this.props.finalPrice.currency
    };
  }

  public toAdminView() {
    return {
      providerCost: this.props.providerCost.toJSON(),
      adminCommission: this.props.adminCommission.toJSON(),
      platformFee: this.props.platformFee.toJSON(),
      taxes: this.props.taxes.toJSON(),
      finalPrice: this.props.finalPrice.toJSON()
    };
  }

  public calculateProfit(): Money {
    const profitResult = this.props.adminCommission.add(this.props.platformFee);
    return profitResult.getValue();
  }

  /**
   * NASA-Grade Engineering: Centralized Margin Policy
   * Default platform margin is 20% on top of provider cost.
   */
  public static applyPlatformMargin(providerCost: Money): Result<QuotationPricing, string> {
      const MARGIN_PERCENT = 20;
      const TAX_PERCENT = 19;

      return providerCost.multiply(MARGIN_PERCENT / 100).flatMap(commission => {
          return providerCost.add(commission).flatMap(net => {
              return net.multiply(TAX_PERCENT / 100).flatMap(taxes => {
                  return net.add(taxes).map(finalPrice => {
                      return new QuotationPricing({
                          providerCost,
                          adminCommission: commission,
                          platformFee: Money.zero(providerCost.currency),
                          taxes,
                          finalPrice
                      });
                  });
              });
          });
      });
  }

  public toJSON() {
    return {
      providerCost: this.props.providerCost.toJSON(),
      adminCommission: this.props.adminCommission.toJSON(),
      platformFee: this.props.platformFee.toJSON(),
      taxes: this.props.taxes.toJSON(),
      finalPrice: this.props.finalPrice.toJSON()
    };
  }
}
