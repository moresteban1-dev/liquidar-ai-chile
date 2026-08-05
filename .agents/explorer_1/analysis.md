# Detailed Technical Analysis: Environment Variable & Config Investigation

**Agent**: Explorer 1 (Env & Config Investigator)  
**Date**: 2026-08-04  
**Target Project**: Liquidar Platform (`c:\Users\Esteban\Desktop\Liquidar Platform\platform`)

---

## 1. Executive Summary

A critical diagnostic investigation was performed on the Liquidar Platform codebase to isolate the root cause of the `"Missing Supabase environment variables"` error occurring at the Root Layout level in the Vercel production deployment and local build environments.

### Key Findings:
1. **Config File Duplication & Inconsistency**: The project maintains two competing environment configuration modules (`src/config/env.ts` and `src/config/env.config.ts`). `src/config/env.ts` uses Zod `safeParse` but defaults missing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to empty strings (`''`). `src/config/env.config.ts` includes default project fallback URLs, but is not consistently imported across the application.
2. **Fragile Supabase Client Factories**:
   - `src/lib/supabase/client.ts`: Uses `const DEFAULT_SUPABASE_URL = ''`. When `process.env.NEXT_PUBLIC_SUPABASE_URL` is undefined or empty, it passes `''` to `@supabase/ssr`'s `createBrowserClient('', '')`, which throws an unhandled `Error: supabaseUrl is required`.
   - `src/lib/supabase/server.ts`: Uses `const DEFAULT_SUPABASE_URL = ''`. Passes `''` to `createServerClient('', '')`, throwing an error during server-side execution.
   - `src/infrastructure/persistence/supabase/SupabaseClient.ts`: Uses non-null assertion `process.env.NEXT_PUBLIC_SUPABASE_URL!`, throwing immediately if undefined.
   - `src/lib/supabase/api.ts`: `createServiceRoleClient()` relies on `env.NEXT_PUBLIC_SUPABASE_URL` from `src/config/env.ts` which evaluates to `''` when missing, causing Service Role client creation to fail.
3. **Root Layout Crash Loop**: Both `Navbar` (`src/components/layout/Navbar.tsx`) and `NotificationProvider` (`src/context/NotificationContext.tsx`) are mounted directly inside `RootLayout` (`src/app/layout.tsx`). On component mount (`useEffect`), both immediately invoke `createClient()` from `@/lib/supabase/client`. When `NEXT_PUBLIC_SUPABASE_URL` is missing or empty string during build/prerender or runtime, this throws an unhandled exception that crashes the entire React component tree at the Root Layout level ("Error Catastrófico").
4. **Vercel Build-Time Variable Inlining**: In Next.js, `NEXT_PUBLIC_*` variables are statically replaced in client bundles at **build time** (`npm run build`). If variables are missing during Vercel's build step, Next.js inlines `""` into `client.ts`. Setting env vars in Vercel after build without triggering a fresh deployment leaves the client bundle with `""`, triggering the crash on every user request.

---

## 2. Evidence Chain & Observations

### 2.1 Configuration Modules Analysis

#### A. `src/config/env.ts`
- **Location**: `src/config/env.ts:1-73`
- **Mechanism**:
  ```ts
  const envSchema = z.object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
    ...
  });

  const parseEnv = () => {
    const parsed = envSchema.safeParse(process.env);
    ...
    return {
      ...baseEnv,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env['supabase_SUPABASE_URL'] || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env['supabase_SUPABASE_ANON_KEY'] || process.env['supabase_SUPABASE_PUBLISHABLE_KEY'] || '',
    };
  };

  export const env = parseEnv();
  ```
- **Observation**:
  - `parseEnv()` is executed at top-level module import time.
  - Zod validation uses `safeParse`, avoiding a top-level crash on import, but falls back to `''` (empty string) for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - Exporting empty strings causes all downstream callers (like `createServiceRoleClient` in `api.ts`) to receive invalid URLs.

#### B. `src/config/env.config.ts`
- **Location**: `src/config/env.config.ts:1-87`
- **Mechanism**:
  ```ts
  const DEFAULT_SUPABASE_URL = 'https://bxhlusdpmjldqbsdztyg.supabase.co';
  const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1...';

  export const env = {
    NEXT_PUBLIC_SUPABASE_URL: publicData.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: publicData.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY,
    ...
  };
  ```
- **Observation**:
  - Contains hardcoded production fallback credentials for Supabase (`bxhlusdpmjldqbsdztyg.supabase.co`).
  - However, this file is **not used** by `src/lib/supabase/client.ts` or `src/lib/supabase/server.ts`. Those files read directly from `process.env`.

---

### 2.2 Supabase Client Instantiation Analysis

#### A. `src/lib/supabase/client.ts`
- **Location**: `src/lib/supabase/client.ts:1-25`
- **Code Snippet**:
  ```ts
  const DEFAULT_SUPABASE_URL = '';
  const DEFAULT_SUPABASE_ANON_KEY = '';

  let clientInstance: SupabaseClient | null = null;

  export const createClient = (): SupabaseClient => {
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
      const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

      if (clientInstance) return clientInstance;

      clientInstance = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, { ... });
      return clientInstance;
  };
  ```
- **Observation**:
  - `DEFAULT_SUPABASE_URL` is empty string (`''`).
  - `@supabase/ssr`'s `createBrowserClient(url, key)` validates that `url` is a non-empty, valid HTTP/HTTPS URL string. Passing `''` causes `createBrowserClient` to throw an uncaught exception `supabaseUrl is required`.

#### B. `src/lib/supabase/server.ts`
- **Location**: `src/lib/supabase/server.ts:1-38`
- **Code Snippet**:
  ```ts
  const DEFAULT_SUPABASE_URL = '';
  const DEFAULT_SUPABASE_ANON_KEY = '';

  export async function createClient() {
    const cookieStore = await cookies();
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
    return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, ...);
  }
  ```
- **Observation**:
  - Identical defect: `DEFAULT_SUPABASE_URL` is `''`. Server-side execution fails immediately if `process.env.NEXT_PUBLIC_SUPABASE_URL` is missing or empty.

#### C. `src/infrastructure/persistence/supabase/SupabaseClient.ts`
- **Location**: `src/infrastructure/persistence/supabase/SupabaseClient.ts:7-30`
- **Code Snippet**:
  ```ts
  export async function getSupabaseServerClient() {
    const cookieStore = await cookies();
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ...
    );
  }
  ```
- **Observation**:
  - Uses non-null assertion `!`. Unhandled exception if environment variable is not defined.

---

### 2.3 Root Layout Crash Mechanics

- **Location**: `src/app/layout.tsx:47-81`
- **Execution Flow**:
  1. `RootLayout` renders `<CSPostHogProvider>`, `<CartProvider>`, `<PaymentProvider>`, `<NotificationProvider>`, `<Navbar />`.
  2. `<Navbar />` (`src/components/layout/Navbar.tsx:21-23`) executes `useEffect`:
     ```ts
     useEffect(() => {
         const supabase = createClient();
         ...
     }, []);
     ```
  3. `<NotificationProvider />` (`src/context/NotificationContext.tsx:18-20`) executes `useEffect`:
     ```ts
     useEffect(() => {
         const supabase = createClient();
         ...
     }, []);
     ```
  4. Both call `createClient()` from `@/lib/supabase/client`.
  5. `createClient()` runs `createBrowserClient('', '')` because `process.env.NEXT_PUBLIC_SUPABASE_URL` is missing or `''`.
  6. `@supabase/ssr` throws an unhandled error. Because this happens at the root provider / navigation level inside `RootLayout`, the entire React component tree crashes, resulting in the production error screen ("Error Catastrófico").

---

## 3. Logic Chain & Root Cause Conclusion

```
[Observation 1]: process.env.NEXT_PUBLIC_SUPABASE_URL is undefined or empty string on Vercel or local builds when env vars are missing/misconfigured.
       │
       ▼
[Observation 2]: src/lib/supabase/client.ts & server.ts define DEFAULT_SUPABASE_URL = '' and DEFAULT_SUPABASE_ANON_KEY = ''.
       │
       ▼
[Logic Step 1]: SUPABASE_URL resolves to '' (empty string).
       │
       ▼
[Observation 3]: @supabase/ssr createBrowserClient('', '') and createServerClient('', '') throw an unhandled exception ("supabaseUrl is required").
       │
       ▼
[Observation 4]: Navbar.tsx and NotificationContext.tsx mount inside RootLayout (src/app/layout.tsx) and call createClient() on initial load.
       │
       ▼
[Conclusion]: When NEXT_PUBLIC_SUPABASE_URL is missing or empty, RootLayout components invoke createClient(), which passes '' to createBrowserClient, throwing an uncaught exception that crashes the application at the Root Layout level.
```

---

## 4. Caveats & Assumptions

1. **Vercel Environment Injection**: On Vercel, `NEXT_PUBLIC_*` variables must be available during the `npm run build` step. If they are added in Vercel dashboard after build, a new deployment must be triggered.
2. **Fallback Credentials**: `src/config/env.config.ts` already contains valid fallback Supabase credentials (`https://bxhlusdpmjldqbsdztyg.supabase.co`). Using a centralized fallback mechanism ensures the app degrades gracefully or renders statically without throwing uncaught exceptions.
3. **Read-Only Investigation Scope**: Per agent identity, no source files were altered in `src/`. All proposals are provided as recommendations for the implementer.

---

## 5. Proposed Remediation Plan (For Implementer)

### Step 1: Consolidate Environment Resolver in `src/config/env.ts`
Unify `env.ts` and `env.config.ts` so that `env` provides safe, fallback values for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` whenever `process.env` values are missing or empty:

```ts
const DEFAULT_SUPABASE_URL = 'https://bxhlusdpmjldqbsdztyg.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aGx1c2RwbWpsZHFic2R6dHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzc0NzQsImV4cCI6MjA4NTYxMzQ3NH0.v9MrG2kIDmQ_Kf3NJ-1l2Em99u2NrsOb8_fBh18eIgA';
```

### Step 2: Update `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts`
Update `DEFAULT_SUPABASE_URL` and `DEFAULT_SUPABASE_ANON_KEY` in `client.ts` and `server.ts` to use fallback values or import `env` from `@/config/env`.

### Step 3: Add Guard Checks in `client.ts`
In `src/lib/supabase/client.ts`, add a safety check so `createBrowserClient` is only instantiated with a valid URL, returning a mock or handling invalid URLs gracefully without throwing uncaught exceptions.

### Step 4: Update `src/infrastructure/persistence/supabase/SupabaseClient.ts`
Replace non-null assertions `process.env.NEXT_PUBLIC_SUPABASE_URL!` with fallback expressions:
```ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
```

---

## 6. Verification Method

1. **Local Build Verification**:
   - Clear `.env` and `.env.local` or set `NEXT_PUBLIC_SUPABASE_URL=""` and `NEXT_PUBLIC_SUPABASE_ANON_KEY=""`.
   - Execute `npm run build` in PowerShell / terminal.
   - Verify that the build succeeds without unhandled module import crashes or static rendering exceptions.
2. **Runtime Resilience Verification**:
   - Run `npm run start` without Supabase environment variables set.
   - Access `http://localhost:3000/`.
   - Confirm that the Root Layout renders without "Error Catastrófico" (handled fallbacks or explicit user-facing error UI instead of full layout crash).
