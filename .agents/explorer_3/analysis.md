# Build System & Vercel Investigator Analysis Report

## Executive Summary
This report analyzes the root cause of the **"Missing Supabase environment variables"** error occurring at the **Root Layout level** during Vercel production deployment of Liquidar.cl.

Investigation reveals two primary systemic causes:
1. **`next.config.ts` Duplicate Object Key Bug**: `next.config.ts` defines the `env:` configuration property twice. The second definition (`env: { NEXT_TELEMETRY_DISABLED: '1' }` at line 133) completely overwrites the first `env:` definition (lines 11–15), erasing the fallback environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) intended to be injected into the Next.js bundle during Vercel builds.
2. **Inconsistent Fallback Values & Unhandled Instantiation in Client/Server Supabase Helpers**:
   - `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts` use empty strings (`DEFAULT_SUPABASE_URL = ''` and `DEFAULT_SUPABASE_ANON_KEY = ''`) as fallbacks.
   - `src/infrastructure/persistence/supabase/SupabaseClient.ts` uses non-null assertions (`process.env.NEXT_PUBLIC_SUPABASE_URL!`) without fallback checks.
   - When `createBrowserClient` or `createServerClient` from `@supabase/ssr` receives an empty string or `undefined`, `@supabase/ssr` throws `Error: supabaseUrl is required.`.
   - Since `<Navbar />` and `<NotificationProvider />` (rendered in `RootLayout`, `src/app/layout.tsx`) immediately call `createClient()` on mount/render, any missing environment variable triggers a Root Layout crash ("Error Catastrófico").

---

## 1. Scope & Configuration Audit

### 1.1 `next.config.ts` Audit
- **Location**: `platform/next.config.ts`
- **First Definition (Lines 11–15)**:
  ```typescript
  // Inyectar variables públicas de Supabase en el bundle de Next.js para Vercel
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bxhlusdpmjldqbsdztyg.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3... ',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  },
  ```
- **Second Definition (Lines 133–135)**:
  ```typescript
  // Var de entorno forzadas (Next.js config style)
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
  },
  ```
- **Impact**: In JavaScript/TypeScript object literals, duplicate keys overwrite prior definitions. The NextConfig object evaluated by Next.js only contains `env: { NEXT_TELEMETRY_DISABLED: '1' }`. The Supabase fallback values are **never** injected into the Webpack compilation environment.

### 1.2 `package.json` & Build Pipeline
- **Build Script**: `"build": "next build --webpack"`
- **Vercel Config (`vercel.json`)**:
  ```json
  {
    "buildCommand": "npm run build",
    "outputDirectory": ".next",
    "framework": "nextjs"
  }
  ```
- During Vercel's build step, Next.js compiles client and server assets, then executes static generation / prerendering of pages.

---

## 2. Code Analysis: Environment Variable Propagation & Evaluation

### 2.1 `src/config/env.ts`
- Zod schema marks Supabase variables as `.optional()`:
  ```typescript
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  ```
- `parseEnv()` falls back to empty string `''`:
  ```typescript
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env['supabase_SUPABASE_URL'] || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env['supabase_SUPABASE_ANON_KEY'] || process.env['supabase_SUPABASE_PUBLISHABLE_KEY'] || '',
  ```
- Result: `env.ts` does not crash during import, but exposes empty string `''` to consumers.

### 2.2 Client Supabase Helper (`src/lib/supabase/client.ts`)
```typescript
const DEFAULT_SUPABASE_URL = '';
const DEFAULT_SUPABASE_ANON_KEY = '';

export const createClient = (): SupabaseClient => {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

    if (clientInstance) return clientInstance;

    clientInstance = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, { ... });
    return clientInstance;
};
```
- If `process.env.NEXT_PUBLIC_SUPABASE_URL` is empty or undefined, `createBrowserClient('', '')` is executed.
- `@supabase/ssr` throws an unhandled error: `supabaseUrl is required.`.

### 2.3 Server Supabase Helper (`src/lib/supabase/server.ts`)
```typescript
const DEFAULT_SUPABASE_URL = '';
const DEFAULT_SUPABASE_ANON_KEY = '';

export async function createClient() {
  const cookieStore = await cookies();
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
  
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, { ... });
}
```
- Similar behavior: falls back to `''`, throwing `supabaseUrl is required.` when called on the server side.

### 2.4 Persistence Supabase Helper (`src/infrastructure/persistence/supabase/SupabaseClient.ts`)
```typescript
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { ... }
  );
}
```
- Uses non-null assertions (`!`). If env vars are undefined, passes `undefined` directly to `createServerClient`, throwing `supabaseUrl is required.`.

### 2.5 DI Factory (`src/infrastructure/di/SupabaseFactory.ts`)
```typescript
getPublicClient(): SupabaseClient {
  if (!this.publicClient) {
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('[SupabaseFactory] Missing Supabase URL or Anon Key in env');
    }
    this.publicClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }
  return this.publicClient;
}
```
- Throws an explicit `[SupabaseFactory] Missing Supabase URL or Anon Key in env` error if `env` values are empty strings.

### 2.6 Discrepancy with `middleware.ts` and `api.ts`
- `src/lib/supabase/middleware.ts` (lines 26-27) and `src/lib/supabase/api.ts` (lines 41-42) DO contain valid default fallback credentials:
  ```typescript
  const DEFAULT_SUPABASE_URL = 'https://bxhlusdpmjldqbsdztyg.supabase.co';
  const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3...';
  ```
- `client.ts` and `server.ts` were NOT updated with these fallbacks, creating inconsistency across the codebase.

---

## 3. Root Layout Error Trigger Execution Flow

1. User or Vercel build accesses page tree rooted at `src/app/layout.tsx`.
2. `RootLayout` renders `<Navbar />` (`src/components/layout/Navbar.tsx`) and `<NotificationProvider />` (`src/context/NotificationContext.tsx`).
3. `<Navbar />` has `useEffect(() => { const supabase = createClient(); ... })`.
4. `<NotificationProvider />` has `useEffect(() => { const supabase = createClient(); ... })`.
5. When `createClient()` runs, it reads `process.env.NEXT_PUBLIC_SUPABASE_URL`.
6. Because `next.config.ts` wiped the fallback `env` block, and if Vercel build environment or runtime lacks `NEXT_PUBLIC_SUPABASE_URL`, `process.env.NEXT_PUBLIC_SUPABASE_URL` resolves to `""` / `undefined`.
7. `createBrowserClient('', '')` is executed, throwing `Error: supabaseUrl is required.`.
8. The error occurs inside client/server component lifecycle, unhandled at Root Layout level.
9. Next.js displays the Root Layout Error Boundary ("Error Catastrófico") or crashes the Vercel build step during page prerendering.

---

## 4. Comparison Table: Behavior Matrix

| Scenario | `next.config.ts` `env` Injection | `client.ts` / `server.ts` Fallback | Result during Build / Prerender | Result at Runtime (Root Layout) |
|---|---|---|---|---|
| **Env vars missing + Current Code** | Broken (overwritten by telemetry line) | `''` (empty string) | Prerender error / `@supabase/ssr` throw | **Root Layout Crash** (`supabaseUrl is required.`) |
| **Env vars missing + Merged `next.config.ts` `env`** | Active (injects fallback URL/Key) | `''` (empty string) | Build succeeds | App renders with fallback client |
| **Env vars missing + Fallbacks in `client.ts`/`server.ts`** | N/A | Valid fallback URL & Key | Build succeeds | App renders safely without crash |
| **Env vars provided in Vercel Dashboard** | Active | Provided values | Build succeeds | App runs normally |

---

## 5. Recommended Remediation Plan (For Implementer Agent)

1. **Fix `next.config.ts`**:
   Merge duplicate `env` blocks into a single property:
   ```typescript
   env: {
     NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bxhlusdpmjldqbsdztyg.supabase.co',
     NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1...',
     NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
     NEXT_TELEMETRY_DISABLED: '1',
   },
   ```

2. **Standardize Fallback Credentials in `client.ts` and `server.ts`**:
   Replace empty strings `''` with the project's default fallback URL & Anon Key (matching `middleware.ts` and `api.ts`).

3. **Safe Initialization in `SupabaseFactory.ts` & `SupabaseClient.ts`**:
   Add resilient fallback or safe check before calling `createClient` / `createServerClient` to prevent throwing unhandled exceptions.
