# liquidar-auction-rules Skill

This skill provides procedural business rules and Chilean financial norms for AI Agents operating on **Liquidar AI Chile v2.0**.

## 1. Chilean Currency & Taxes (CLP & IVA)
- **Currency**: Chilean Pesos (`CLP`). CLP values are strictly integers with zero decimals.
- **Formatting**: Format currency with thousands separators using standard Chilean format (e.g. `$1.250.000 CLP`).
- **Value Added Tax (IVA)**: Every auction settlement or liquidation sale includes a mandatory **19% Chilean IVA tax**.
  - Net Price calculation: `Net = Gross / 1.19`
  - IVA calculation: `IVA = Gross - Net` (or `Net * 0.19`)

## 2. Chilean Identification Validation (RUT)
- **RUT / RUN**: Every buyer, seller, and business entity must be identified by a valid Chilean RUT (Rol Único Tributario).
- **Algorithmic Validation**: Validate the Verification Digit (DV) using the **Modulo 11** algorithm.
- **Formatting**: Always normalize RUT strings to include points and hyphen (e.g., `12.345.678-K` or `76.543.210-3`).

## 3. Real-Time Auction Rules
- **Minimum Bid Increments**: A bid is valid only if `proposedAmount >= currentPrice + minBidIncrement` (or `>= startingPrice` for the first bid).
- **Seller Bidding Prevention**: A seller is strictly prohibited from placing bids on their own auction lot.
- **Anti-Sniping Extension Rule**: If a valid bid is placed within the final 2 minutes of an active auction, the closing time `endDate` is automatically extended by 3 minutes to prevent last-second sniping bot manipulation.
- **Bid Fraud & Risk Control**: Any bid exceeding $5.000.000 CLP from a new unverified buyer RUT requires automatic QA Sentinel hold for identity & escrow verification.
