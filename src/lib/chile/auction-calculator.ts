/**
 * Auction Calculator & Financial Engine — Liquidar.cl
 * 
 * Implements the dual-sided take rate model (Buyer's Premium + Seller Fee)
 * and Escrow guarantee calculations under Chilean tax regulation (SII 19% IVA).
 */

export interface FeeBreakdown {
  /** Adjudicated auction hammer price (Monto adjudicado en subasta) */
  hammerPrice: number;
  
  /** Buyer's Premium fee amount (11% IVA included) */
  buyerPremium: number;
  /** Net portion of Buyer's Premium (without IVA) */
  buyerPremiumNet: number;
  /** IVA (19%) on Buyer's Premium */
  buyerPremiumIVA: number;
  /** Total amount paid by Buyer (Hammer Price + Buyer Premium) */
  totalPaidByBuyer: number;
  
  /** Seller Fee percentage rate (default 6%) */
  sellerFeeRate: number;
  /** Seller Fee amount (Net + IVA) */
  sellerFeeNet: number;
  /** IVA (19%) on Seller Fee */
  sellerFeeIVA: number;
  /** Total Seller Fee deducted from seller payout */
  sellerFeeTotalDeduction: number;
  /** Total Net Payout transferred to Seller bank account */
  totalPaidToSeller: number;
  
  /** Escrow Guarantee Deposit required (10% of estimated or current bid) */
  escrowGuaranteeDeposit: number;
  
  /** Total Gross Revenue for Liquidar.cl Platform (Buyer Premium + Seller Fee) */
  platformGrossRevenue: number;
  /** Total Net Revenue for Liquidar.cl Platform (excluding IVA) */
  platformNetRevenue: number;
  /** Total IVA collected to be declared to SII */
  platformTotalIVA: number;
  /** Estimated Net Operating Profit Margin (after ~2% payment gateway fee) */
  estimatedNetProfitMarginPercent: number;
}

export const AUCTION_FEE_RATES = {
  BUYER_PREMIUM_RATE_WITH_IVA: 0.11, // 11% (IVA incl.)
  DEFAULT_SELLER_FEE_RATE_NET: 0.06, // 6% (Net)
  ESCROW_GUARANTEE_RATE: 0.10,        // 10% deposit
  IVA_RATE: 0.19,                      // 19% Chilean IVA
  GATEWAY_COST_RATE: 0.02,             // ~2% Webpay/Khipu processing cost
  MAX_ALLOWED_INVENTORY_VARIANCE: 0.08,// ±8% inventory variance limit
};

/**
 * Calculates complete financial breakdown for an auction transaction.
 * 
 * @param hammerPrice Amount adjudicated in CLP
 * @param sellerFeeRate Custom seller fee rate (default 6%)
 */
export function calculateAuctionFees(
  hammerPrice: number,
  sellerFeeRate: number = AUCTION_FEE_RATES.DEFAULT_SELLER_FEE_RATE_NET
): FeeBreakdown {
  const safeHammer = Math.max(0, Math.round(hammerPrice));
  
  // 1. Buyer's Premium (11% Total including 19% IVA)
  const buyerPremium = Math.round(safeHammer * AUCTION_FEE_RATES.BUYER_PREMIUM_RATE_WITH_IVA);
  const buyerPremiumNet = Math.round(buyerPremium / (1 + AUCTION_FEE_RATES.IVA_RATE));
  const buyerPremiumIVA = buyerPremium - buyerPremiumNet;
  const totalPaidByBuyer = safeHammer + buyerPremium;

  // 2. Seller Fee (Default 6% Net + 19% IVA)
  const sellerFeeNet = Math.round(safeHammer * sellerFeeRate);
  const sellerFeeIVA = Math.round(sellerFeeNet * AUCTION_FEE_RATES.IVA_RATE);
  const sellerFeeTotalDeduction = sellerFeeNet + sellerFeeIVA;
  const totalPaidToSeller = Math.max(0, safeHammer - sellerFeeTotalDeduction);

  // 3. Escrow Guarantee (10% deposit)
  const escrowGuaranteeDeposit = Math.round(safeHammer * AUCTION_FEE_RATES.ESCROW_GUARANTEE_RATE);

  // 4. Platform Revenues
  const platformGrossRevenue = buyerPremium + sellerFeeTotalDeduction;
  const platformNetRevenue = buyerPremiumNet + sellerFeeNet;
  const platformTotalIVA = buyerPremiumIVA + sellerFeeIVA;

  // 5. Margin Calculations
  const platformNetTakeRatePercent = safeHammer > 0 ? (platformNetRevenue / safeHammer) * 100 : 0;
  const gatewayCost = Math.round(safeHammer * AUCTION_FEE_RATES.GATEWAY_COST_RATE);
  const estimatedNetProfitMarginPercent = safeHammer > 0 
    ? Math.max(0, ((platformNetRevenue - gatewayCost) / safeHammer) * 100) 
    : 0;

  return {
    hammerPrice: safeHammer,
    buyerPremium,
    buyerPremiumNet,
    buyerPremiumIVA,
    totalPaidByBuyer,
    sellerFeeRate,
    sellerFeeNet,
    sellerFeeIVA,
    sellerFeeTotalDeduction,
    totalPaidToSeller,
    escrowGuaranteeDeposit,
    platformGrossRevenue,
    platformNetRevenue,
    platformTotalIVA,
    estimatedNetProfitMarginPercent: Number(estimatedNetProfitMarginPercent.toFixed(2)),
  };
}
