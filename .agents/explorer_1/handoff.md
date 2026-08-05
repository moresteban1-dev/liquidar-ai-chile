# Handoff Report — Explorer 1 (Env & Config Investigator)

**Agent ID**: explorer_1  
**Working Directory**: `c:\Users\Esteban\Desktop\Liquidar Platform\platform\.agents\explorer_1\`  
**Target Project**: Liquidar Platform (`c:\Users\Esteban\Desktop\Liquidar Platform\platform`)  
**Date**: 2026-08-04  
**Handoff Type**: Hard (Task Complete)

---

## 1. Observation

### Observation 1: Environment Configuration Duplication
- **File**: `src/config/env.ts:6-72`
  - Defines Zod schema for environment variables (`NEXT_PUBLIC_SUPABASE_URL: z.string().optional()`).
  - Calls `parseEnv()` at top-level import time: `export const env = parseEnv();`.
  - Fallback logic:
    ```ts
    NEXT_PUBLIC_SUPABASE_URL: 
      process.env.NEXT_PUBLIC_SUPABASE_URL || 
      process.env['supabase_SUPABASE_URL'] || 
      '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
      process.env['supabase_SUPABASE_ANON_KEY'] || 
      process.env['supabase_SUPABASE_PUBLISHABLE_KEY'] || 
      '',
    ```
  - When environment variables are missing or empty strings in `process.env`, `env.NEXT_PUBLIC_SUPABASE_URL` evaluates to `''` (empty string).
- **File**: `src/config/env.config.ts:17-72`
  - A secondary config file defining:
    ```ts
    const DEFAULT_SUPABASE_URL = 'https://bxhlusdpmjldqbsdztyg.supabase.co';
    const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1...';
    ```
  - Contains full fallback default URLs, but is not imported by standard Supabase client factories (`src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`).

### Observation 2: Unsafe Supabase Browser Client Factory
- **File**: `src/lib/supabase/client.ts:4-23`
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
- `DEFAULT_SUPABASE_URL` is `''`. When `process.env.NEXT_PUBLIC_SUPABASE_URL` is undefined or empty string, `SUPABASE_URL` evaluates to `''`. `@supabase/ssr` `createBrowserClient('', '')` throws an unhandled exception `Error: supabaseUrl is required`.

### Observation 3: Unsafe Supabase Server Client Factories
- **File**: `src/lib/supabase/server.ts:10-20`
  - Sets `DEFAULT_SUPABASE_URL = ''`. `createServerClient('', '')` throws an unhandled exception.
- **File**: `src/infrastructure/persistence/supabase/SupabaseClient.ts:10-13`
  - Uses non-null assertion: `process.env.NEXT_PUBLIC_SUPABASE_URL!`. Throws unhandled error when `process.env.NEXT_PUBLIC_SUPABASE_URL` is missing.
- **File**: `src/lib/supabase/api.ts:73-83`
  - `createServiceRoleClient()` accesses `env.NEXT_PUBLIC_SUPABASE_URL` directly without default URL fallback. Evaluates to `''` when missing, throwing an error when called.

### Observation 4: Immediate Invocation in Root Layout
- **File**: `src/app/layout.tsx:47-81`
  - Renders `<Navbar />` (`src/components/layout/Navbar.tsx`) and `<NotificationProvider>` (`src/context/NotificationContext.tsx`).
- **File**: `src/components/layout/Navbar.tsx:21-23`
  - Runs `useEffect` on mount: `const supabase = createClient();`.
- **File**: `src/context/NotificationContext.tsx:18-20`
  - Runs `useEffect` on mount: `const supabase = createClient();`.
- When `NEXT_PUBLIC_SUPABASE_URL` is missing or empty, rendering `RootLayout` immediately triggers `createClient()`, throwing `Error: supabaseUrl is required` uncaught, crashing the whole layout.

---

## 2. Logic Chain

1. **Premise 1 (Observation 1 & 2)**: `src/lib/supabase/client.ts` sets `DEFAULT_SUPABASE_URL = ''` and `DEFAULT_SUPABASE_ANON_KEY = ''`.
2. **Premise 2 (Observation 1 & 2)**: When `process.env.NEXT_PUBLIC_SUPABASE_URL` is missing or empty string (e.g. during build/static generation or if Vercel env vars are not loaded), `createClient()` passes `''` to `createBrowserClient('', '')`.
3. **Premise 3 (Observation 2)**: `@supabase/ssr` `createBrowserClient` rejects empty string URL arguments and throws an immediate runtime exception (`supabaseUrl is required`).
4. **Premise 4 (Observation 4)**: `RootLayout` (`src/app/layout.tsx`) renders `<Navbar />` and `<NotificationProvider />`, both of which invoke `createClient()` in `useEffect` on component mount.
5. **Deduction (Conclusion)**: Any missing or empty `NEXT_PUBLIC_SUPABASE_URL` directly causes `createClient()` to throw an uncaught error upon rendering `RootLayout`, crashing the application ("Error Catastrófico").

---

## 3. Caveats

- **Vercel Build-Time Env Replacement**: Next.js replaces `process.env.NEXT_PUBLIC_*` references in client bundles at build time (`npm run build`). Setting env vars in Vercel settings without triggering a rebuild leaves old bundles with `""` inlined.
- **Scope Limit**: As an Explorer agent, no changes to source code (`src/*`) were executed. Full findings and proposed fixes are documented in `analysis.md`.

---

## 4. Conclusion

The "Missing Supabase environment variables" error crashing the Root Layout is caused by `src/lib/supabase/client.ts`, `server.ts`, and `SupabaseClient.ts` defaulting missing URL/key environment variables to empty strings (`''`) or non-null assertions (`!`), combined with `Navbar` and `NotificationProvider` inside `RootLayout` executing `createClient()` on mount.

### Actionable Remediation Summary:
1. Update `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts` to use valid fallback Supabase credentials (`https://bxhlusdpmjldqbsdztyg.supabase.co` and anon key) or import centralized fallback config.
2. Add guard checks in `client.ts` so `createClient()` fails safely or uses fallback URL instead of passing `''` to `createBrowserClient`.
3. Remove non-null assertion `!` in `src/infrastructure/persistence/supabase/SupabaseClient.ts`.
4. Ensure `src/config/env.ts` provides default URL fallback values instead of `''`.

---

## 5. Verification Method

1. **Inspect Analysis Report**:
   - View `c:\Users\Esteban\Desktop\Liquidar Platform\platform\.agents\explorer_1\analysis.md`.
2. **Local Missing Env Test**:
   - In `c:\Users\Esteban\Desktop\Liquidar Platform\platform`, run `npm run build` without `NEXT_PUBLIC_SUPABASE_URL` set in `.env.local`.
   - Verify if build completes or fails with explicit env error message.
3. **Runtime Crash Verification**:
   - Run `npm run dev` or `npm run start` without env vars.
   - Access `http://localhost:3000/`.
   - Verify layout loads gracefully without crashing.
