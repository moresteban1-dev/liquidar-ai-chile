import { describe, it, expect } from 'vitest';
import { calculateAuctionFees, AUCTION_FEE_RATES } from '../auction-calculator';

describe('Auction Calculator Financial Engine', () => {
  it('calculates buyer premium, seller fee, and net take rate for a $1,000,000 CLP auction', () => {
    const hammerPrice = 1000000;
    const fees = calculateAuctionFees(hammerPrice, 0.06);

    // Hammer Price
    expect(fees.hammerPrice).toBe(1000000);

    // Buyer Premium = 11% = $110,000
    expect(fees.buyerPremium).toBe(110000);
    expect(fees.totalPaidByBuyer).toBe(1110000);

    // Buyer Premium Net (110000 / 1.19) = $92,437
    expect(fees.buyerPremiumNet).toBe(92437);
    expect(fees.buyerPremiumIVA).toBe(17563);

    // Seller Fee = 6% Net = $60,000 + 19% IVA ($11,400) = $71,400
    expect(fees.sellerFeeNet).toBe(60000);
    expect(fees.sellerFeeIVA).toBe(11400);
    expect(fees.sellerFeeTotalDeduction).toBe(71400);

    // Seller Payout = $1,000,000 - $71,400 = $928,600
    expect(fees.totalPaidToSeller).toBe(928600);

    // Escrow Guarantee (10%) = $100,000
    expect(fees.escrowGuaranteeDeposit).toBe(100000);

    // Platform Net Revenue = $92,437 + $60,000 = $152,437 (15.24% Net Take Rate)
    expect(fees.platformNetRevenue).toBe(152437);

    // Estimated Net Profit Margin % (after ~2% gateway cost) ~13.24%
    expect(fees.estimatedNetProfitMarginPercent).toBe(13.24);
  });

  it('handles zero or negative hammer prices gracefully', () => {
    const fees = calculateAuctionFees(0);
    expect(fees.hammerPrice).toBe(0);
    expect(fees.totalPaidByBuyer).toBe(0);
    expect(fees.totalPaidToSeller).toBe(0);
    expect(fees.platformGrossRevenue).toBe(0);
  });
});
