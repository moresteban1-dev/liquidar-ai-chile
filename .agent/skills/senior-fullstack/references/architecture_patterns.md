# Architecture Patterns

## Monolith vs Microservices

**Default to Monolith.** A generic modular monolith is superior for 95% of projects until scale dictates otherwise.

### Modular Monolith Structure

```
src/
  modules/
    users/
      dto/
      entities/
      services/
      users.controller.ts
      users.module.ts
    orders/
      ...
  shared/
    database/
    utils/
```

## Factory Pattern

Use for creating complex objects or selecting implementations based on config.

```typescript
interface PaymentProvider {
  process(amount: number): Promise<void>;
}

class StripeProvider implements PaymentProvider { ... }
class PayPalProvider implements PaymentProvider { ... }

class PaymentFactory {
  static getProvider(type: 'stripe' | 'paypal'): PaymentProvider {
    if (type === 'stripe') return new StripeProvider();
    return new PayPalProvider();
  }
}
```

## Repository Pattern

Use with ORMs like TypeORM or raw SQL. Less critical with Prisma/Drizzle as they act as repositories, but useful for testing/mocking.

```typescript
interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
}

class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}
  // ... implementation
}
```

## Adapter Pattern

Crucial for external integrations (Email, SMS, Storage) to keep your core logic independent of specific vendors.

## Observer/Pub-Sub

Use for decoupling side effects (e.g., sending welcome email after registration).

```typescript
// Event Emitter in Node.js
userEvents.on('user:registered', async (user) => {
  await emailService.sendWelcome(user);
});
```
