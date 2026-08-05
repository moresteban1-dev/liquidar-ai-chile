# Technical Analysis: Root Layout & Supabase Client Investigation — Liquidar.cl

**Author:** Explorer 2 (Root Layout & Supabase Client Investigator)  
**Date:** 2026-08-04  
**Target Project:** `c:\Users\Esteban\Desktop\Liquidar Platform\platform`  

---

## 1. Executive Summary

This report provides a comprehensive architectural diagnosis of the **"Missing Supabase environment variables"** error occurring at the Root Layout level in the Vercel production deployment of Liquidar.cl.

### Core Discovery
The error originates from **unhandled empty fallback strings (`''`) and non-null assertions (`!`) passed to `@supabase/ssr` functions (`createBrowserClient` and `createServerClient`)** within Supabase client initializers (`src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, and `src/infrastructure/persistence/supabase/SupabaseClient.ts`). 

When Next.js performs static site generation / pre-rendering at build time on Vercel, or when client components hydrate without pre-configured public environment variables, `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` evaluate to `undefined` or `''`. Callers inside the Root Layout component tree—specifically `NotificationProvider` (`src/context/NotificationContext.tsx`) and `Navbar` (`src/components/layout/Navbar.tsx`)—invoke `createClient()` on mount. `@supabase/ssr` immediately throws an unhandled exception (`supabaseUrl is required.`), causing the entire React root component tree to crash ("Error Catastrófico").

---

## 2. Root Layout Component Architecture & Provider Inspection

### 2.1 Root Layout Hierarchy (`src/app/layout.tsx`)
```tsx
// src/app/layout.tsx (Lines 47-79)
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <CSPostHogProvider>
            <CartProvider>
              <PaymentProvider>
                <NotificationProvider> {/* <-- CRITICAL: Client component calling createClient() */}
                  <Navbar />               {/* <-- CRITICAL: Client component calling createClient() */}
                  {children}
                  <FloatingQuoteCartWidget />
                  <WhatsAppButton />
                  <Toaster />
                  <CommandMenu />
                </NotificationProvider>
              </PaymentProvider>
            </CartProvider>
          </CSPostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 2.2 Root Client Component Invocation Flow

1. **`NotificationProvider` (`src/context/NotificationContext.tsx`, lines 18-20)**:
   ```ts
   useEffect(() => {
       const supabase = createClient();
       const setupRealtime = async () => {
           const { data: { session } } = await supabase.auth.getSession();
           ...
   ```
   - Component is rendered unconditionally inside `RootLayout`.
   - On mount, `useEffect` invokes `createClient()` from `@/lib/supabase/client`.

2. **`Navbar` (`src/components/layout/Navbar.tsx`, lines 21-24)**:
   ```ts
   useEffect(() => {
       const supabase = createClient();
       const checkUser = async () => {
           const { data: { user } } = await supabase.auth.getUser();
           ...
   ```
   - Component is rendered unconditionally inside `RootLayout`.
   - On mount, `useEffect` invokes `createClient()` from `@/lib/supabase/client`.

---

## 3. Supabase Client Factories & Env Variable Mismatch Analysis

An inspection of all Supabase creation entry points reveals a significant inconsistency in how environment variables and fallbacks are handled:

| File Path | Function / Method | Fallback Behavior when `NEXT_PUBLIC_SUPABASE_*` is missing | Crash Risk |
|---|---|---|---|
| `src/lib/supabase/client.ts` | `createClient()` | `DEFAULT_SUPABASE_URL = ''`<br>`DEFAULT_SUPABASE_ANON_KEY = ''` | **CRITICAL**: Calls `createBrowserClient('', '')`. Throws `supabaseUrl is required.` |
| `src/lib/supabase/server.ts` | `createClient()` | `DEFAULT_SUPABASE_URL = ''`<br>`DEFAULT_SUPABASE_ANON_KEY = ''` | **CRITICAL**: Calls `createServerClient('', '')`. Throws `supabaseUrl is required.` |
| `src/infrastructure/persistence/supabase/SupabaseClient.ts` | `getSupabaseServerClient()` | `process.env.NEXT_PUBLIC_SUPABASE_URL!` (non-null assertion) | **HIGH**: Passes `undefined` to `createServerClient`. Throws exception. |
| `src/lib/supabase/middleware.ts` | `updateSession()` | Hardcoded fallback URL & JWT Anon Key (`https://bxhlusdpmjldqbsdztyg.supabase.co`) | **LOW**: Safe fallback prevents crash in middleware. |
| `src/lib/supabase/api.ts` | `createApiClient()` | Hardcoded fallback URL & JWT Anon Key (`https://bxhlusdpmjldqbsdztyg.supabase.co`) | **LOW**: Safe fallback prevents crash in API routes. |
| `src/config/env.config.ts` | `env` getter | Hardcoded fallback URL & JWT Anon Key | **LOW**: Safe fallback. |
| `src/config/env.ts` | `env` export | Returns `''` (empty string) | **MEDIUM**: Inconsistent with `env.config.ts`. |

### Detailed Inspection of Vulnerable Files

#### 1. `src/lib/supabase/client.ts`
```ts
1: import { createBrowserClient } from '@supabase/ssr'
2: import type { SupabaseClient } from '@supabase/supabase-js'
3: 
4: const DEFAULT_SUPABASE_URL = '';
5: const DEFAULT_SUPABASE_ANON_KEY = '';
6: 
7: let clientInstance: SupabaseClient | null = null;
8: 
9: export const createClient = (): SupabaseClient => {
10:     const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
11:     const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
12: 
13:     if (clientInstance) return clientInstance;
14: 
15:     clientInstance = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
16:         realtime: {
17:             params: {
18:                 eventsPerSecond: 10,
19:             },
20:         },
21:     });
22: 
23:     return clientInstance;
24: };
```
**Vulnerability**: Lines 4-5 set defaults to `''`. When `process.env.NEXT_PUBLIC_SUPABASE_URL` is empty or undefined, line 15 passes `''` to `createBrowserClient`, which immediately throws `Error: supabaseUrl is required.`.

#### 2. `src/lib/supabase/server.ts`
```ts
10: const DEFAULT_SUPABASE_URL = '';
11: const DEFAULT_SUPABASE_ANON_KEY = '';
12: 
13: export async function createClient() {
14:   const cookieStore = await cookies();
15:   const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
16:   const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
17:   
18:   return createServerClient(
19:     SUPABASE_URL,
20:     SUPABASE_ANON_KEY,
21:     ...
```
**Vulnerability**: Lines 10-11 set defaults to `''`. During server rendering / static page compilation, `createServerClient('', '')` fails and throws.

#### 3. `src/infrastructure/persistence/supabase/SupabaseClient.ts`
```ts
7: export async function getSupabaseServerClient() {
8:   const cookieStore = await cookies();
9:   
10:  return createServerClient(
11:    process.env.NEXT_PUBLIC_SUPABASE_URL!,
12:    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
```
**Vulnerability**: Lines 11-12 use non-null assertion `!`. If `process.env.NEXT_PUBLIC_SUPABASE_URL` is undefined, `undefined` is passed into `createServerClient`.

---

## 4. Next.js Static Generation & Vercel Environment Ingestion Dynamics

1. **Build-Time Variable Inlining**: Next.js compiles `NEXT_PUBLIC_*` references into static literals at build time. During static page generation (SSG/ISR) or PR preview builds on Vercel where environment secrets might not be attached to build workers, `process.env.NEXT_PUBLIC_SUPABASE_URL` evaluates to `undefined` or `""`.
2. **Execution Flow during Pre-rendering**: When Next.js attempts to compile/render pages that include `RootLayout` (`src/app/layout.tsx`), client components (`NotificationProvider`, `Navbar`) or server components invoking `createClient()` trigger `createBrowserClient('', '')` or `createServerClient('', '')`.
3. **Uncaught Crash Propagation**: Because neither `client.ts` nor `server.ts` handles invalid/empty URLs, `@supabase/ssr` throws `Error: supabaseUrl is required.`. Since this error occurs inside root providers rendered at the top level of the app, Next.js aborts page rendering with a Root Layout crash ("Error Catastrófico").

---

## 5. Architectural Recommendations & Remediation Plan

To permanently resolve the error and meet all Acceptance Criteria:

1. **Unify Environment Configuration (`src/config/env.ts` & `src/config/env.config.ts`)**:
   - Consolidate environment variable resolution to use consistent, valid fallback defaults (`https://bxhlusdpmjldqbsdztyg.supabase.co` and valid anon key) across the application, matching `middleware.ts` and `api.ts`.

2. **Harden Client Supabase Factory (`src/lib/supabase/client.ts`)**:
   - Provide valid default fallbacks for `DEFAULT_SUPABASE_URL` and `DEFAULT_SUPABASE_ANON_KEY` or return a dummy/safe client instance if environment variables are missing during static generation.

3. **Harden Server Supabase Factory (`src/lib/supabase/server.ts` & `SupabaseClient.ts`)**:
   - Remove non-null assertions `!` in `SupabaseClient.ts`.
   - Provide safe fallback values in `server.ts` and `SupabaseClient.ts` to prevent build-time SSG/SSR failure.

4. **Defensive Checks in Root Providers (`NotificationContext.tsx`, `Navbar.tsx`)**:
   - Wrap `createClient()` calls inside `try/catch` blocks in `useEffect` to gracefully handle any network or configuration initialization issues without crashing the Root Layout.
