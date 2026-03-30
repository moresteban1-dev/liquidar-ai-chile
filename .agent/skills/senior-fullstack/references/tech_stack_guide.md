# Tech Stack Guide

## Frontend: Next.js & React

### Best Practices

1. **Server Components by Default**: Use RSC for data fetching and layout. Only use `'use client'` when interactivity (state, effects) is needed.
2. **Component Composition**: Avoid prop drilling. Use composition (`children` prop) to pass down component trees.
3. **Data Fetching**: Use `fetch` in Server Components with automatic caching. Use SWR or TanStack Query for client-side fetching.

### Patterns

**Container/Presentation Pattern** is largely replaced by Server/Client component separation, but the principle applies: separate logic from UI.

```typescript
// UserProfile.tsx (Server Component)
async function UserProfile({ id }: { id: string }) {
  const user = await db.user.findUnique({ where: { id } });
  return <ProfileDisplay user={user} />;
}

// ProfileDisplay.tsx (Client Component - if robust interactivity needed)
'use client';
export function ProfileDisplay({ user }: { user: User }) {
  const [isOpen, setIsOpen] = useState(false);
  // ...
}
```

## Backend: Node.js (Express/NestJS)

### Best Practices

1. **Layered Architecture**: Controller -> Service -> Model/Data Access.
2. **Error Handling**: Use a centralized error handler middleware. Do not return raw DB errors to the client.
3. **Validation**: Validate all inputs at the controller level (e.g., using Zod).

```typescript
// validation.ts
import { z } from 'zod';

export const UserSchema = z.object({
  email: z.string().email(),
  age: z.number().min(18)
});

// controller.ts
app.post('/users', (req, res, next) => {
  try {
    const data = UserSchema.parse(req.body);
    // ... proceed
  } catch (e) {
    next(e);
  }
});
```

## Database: PostgreSQL

### Best Practices

1. **Indexing**: Index foreign keys and frequently queried fields.
2. **Migrations**: Always use migrations (Prisma Migrate) for schema changes. NEVER modify the DB directly in production.
3. **Connection Pooling**: Use connection pooling (like PgBouncer) in serverless environments.

## State Management

- **Global Server State**: Use URL search params or Server Side state.
- **Client Global State**: Zustand or React Context for UI state (theme, sidebar). Avoid Redux unless complex transactional state exists.
- **Server Cache**: TanStack Query / SWR.

## CSS / Styling

- **Tailwind CSS**: Preferred for utility-first rapid development.
- **CSS Modules**: For complex, unique animations or when separation is strictly required.
