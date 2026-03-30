# Import Map Canónico

Generado: 2026-03-27T19:11:48.205Z

```typescript
import type { Result } from '@shared/Result';
import { AppError } from '@shared/AppError';
import type { IQuotationRepository } from '@app/ports/IQuotationRepository';
import type { IOrderRepository } from '@app/ports/IOrderRepository';
import type { IProviderRepository } from '@app/ports/IProviderRepository';
// ❌ ICatalogRepository — not found
import type { AIBrokerPort } from '@app/ports/AIBrokerPort';
import { DomainEventBus } from '@infrastructure/events/DomainEventBus';
import type { NotificationPort } from '@app/ports/NotificationPort';
import type { Quotation } from '@/components/admin/quotations/QuotationsTable';
import type { Order } from '@/components/admin/orders/OrdersTable';
import { Money } from '@domain/value-objects/Money';
import { QuotationV2Mapper } from '@infrastructure/persistence/mappers/QuotationV2Mapper';
import { StructuredLogger } from '@infrastructure/telemetry/StructuredLogger';
```
