# Domain Model Documentation

## 🏛️ Core Concepts

### Aggregates

#### Order Aggregate
**Root Entity:** `Order`  
**Responsibilities:**
- Manage order lifecycle through FSM.
- Enforce business rules for state transitions.
- Coordinate pricing attachment.

**Invariants:**
1. Event date must be in the future (or today).
2. State transitions must follow FSM rules.
3. Cannot complete without payment.

#### QuotationPricing Aggregate
**Root Entity:** `QuotationPricing`  
**Responsibilities:**
- Calculate multi-tier pricing.
- Validate mathematical invariants.

### 🔄 Domain Events
- **OrderCreated**: When a new order is successfully created.
- **QuotationSent**: When admin sends quotation to client.

### 📏 Design Decisions (ADRs)

#### ADR-001: Why Result Type Pattern?
- Makes errors explicit.
- Forces error handling at compile time.

#### ADR-002: Why Hexagonal Architecture?
- Domain logic independent of infrastructure.
- Better testability.
