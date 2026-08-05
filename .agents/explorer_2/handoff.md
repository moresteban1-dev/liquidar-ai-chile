# Handoff Report — Explorer 2 (Root Layout & Supabase Client Investigator)

**Date:** 2026-08-04  
**Working Directory:** `c:\Users\Esteban\Desktop\Liquidar Platform\platform\.agents\explorer_2\`  
**Target:** Root Layout (`src/app/layout.tsx`) & Supabase Client Initializers (`src/lib/supabase/*`)  

---

## 1. Observation

Direct observations from codebase inspection of `c:\Users\Esteban\Desktop\Liquidar Platform\platform`:

1. **Root Layout Provider Structure (`src/app/layout.tsx`, lines 63-76)**:
   ```tsx
   <CSPostHogProvider>
     <CartProvider>
       <PaymentProvider>
         <NotificationProvider>
           <Navbar />
           {children}
           ...
         </NotificationProvider>
       </PaymentProvider>
     </CartProvider>
   </CSPostHogProvider>
   ```
   `NotificationProvider` and `Navbar` are rendered at the root level of the application for all routes.

2. **Client Component Supabase Invocations**:
   - `src/context/NotificationContext.tsx` (lines 18-19):
     ```ts
     useEffect(() => {
         const supabase = createClient();
     ```
   - `src/components/layout/Navbar.tsx` (lines 21-22):
     ```ts
     useEffect(() => {
         const supabase = createClient();
     ```

3. **Supabase Client Initializers with Empty Defaults**:
   - `src/lib/supabase/client.ts` (lines 4-15):
     ```ts
     const DEFAULT_SUPABASE_URL = '';
     const DEFAULT_SUPABASE_ANON_KEY = '';
     ...
     export const createClient = (): SupabaseClient => {
         const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
         const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
         ...
         clientInstance = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, { ... });
     ```
   - `src/lib/supabase/server.ts` (lines 10-18):
     ```ts
     const DEFAULT_SUPABASE_URL = '';
     const DEFAULT_SUPABASE_ANON_KEY = '';
     ...
     export async function createClient() {
         ...
         return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, { ... });
     }
     ```
   - `src/infrastructure/persistence/supabase/SupabaseClient.ts` (lines 10-12):
     ```ts
     return createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       ...
     );
     ```

4. **Inconsistent Fallbacks in Middleware & API**:
   - `src/lib/supabase/middleware.ts` (lines 26-30):
     ```ts
     const DEFAULT_SUPABASE_URL = 'https://bxhlusdpmjldqbsdztyg.supabase.co';
     const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
     ```
   - `src/lib/supabase/api.ts` (lines 41-45):
     ```ts
     const DEFAULT_SUPABASE_URL = 'https://bxhlusdpmjldqbsdztyg.supabase.co';
     const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1...';
     ```
   - `src/config/env.config.ts` (lines 17-18):
     ```ts
     const DEFAULT_SUPABASE_URL = 'https://bxhlusdpmjldqbsdztyg.supabase.co';
     const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1...';
     ```
   - `src/config/env.ts` (lines 46-54):
     ```ts
     NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env['supabase_SUPABASE_URL'] || '',
     ```

---

## 2. Logic Chain

1. **Step 1 (Observation 1 & 2)**: `RootLayout` (`src/app/layout.tsx`) unconditionally renders `NotificationProvider` (`src/context/NotificationContext.tsx`) and `Navbar` (`src/components/layout/Navbar.tsx`). On component mount, both client components invoke `createClient()` from `@/lib/supabase/client`.
2. **Step 2 (Observation 3)**: In `src/lib/supabase/client.ts`, `DEFAULT_SUPABASE_URL` and `DEFAULT_SUPABASE_ANON_KEY` are hardcoded to `''` (empty string). When `process.env.NEXT_PUBLIC_SUPABASE_URL` is missing or undefined (e.g. during Vercel static pre-rendering or when client environment variables are unpopulated in the browser bundle), `createBrowserClient('', '')` is executed.
3. **Step 3 (Observation 3)**: `@supabase/ssr`'s `createBrowserClient` checks if `supabaseUrl` and `supabaseKey` are non-empty strings. When passed `''`, it throws an unhandled exception: `Error: supabaseUrl is required.`.
4. **Step 4 (Observation 1 & 2)**: Because `createClient()` is called during component setup inside `NotificationProvider` and `Navbar` at the top of the React component tree without `try/catch` error boundaries, the exception bubbles up and unmounts/crashes the entire `RootLayout` ("Error Catastrófico").
5. **Step 5 (Observation 3 & 4)**: A similar vulnerability exists on the server side in `src/lib/supabase/server.ts` (which defaults to `''`) and `src/infrastructure/persistence/supabase/SupabaseClient.ts` (which uses non-null assertions `!`). While `middleware.ts`, `api.ts`, and `env.config.ts` contain safe fallback production credentials (`https://bxhlusdpmjldqbsdztyg.supabase.co`), `client.ts`, `server.ts`, and `env.ts` do not.

---

## 3. Caveats

- **Vercel Dashboard Configuration**: Although environment variables are configured in the Vercel dashboard, Next.js requires `NEXT_PUBLIC_*` variables to be present during build time for client-side inlining. If static pages are pre-rendered during build time before environment variable binding, or if client hydration occurs in isolated preview contexts, empty strings `''` lead to immediate crashes unless fallback values or safe checks are implemented.
- **Scope Limit**: Explorer 2 performed a read-only investigation. No source code modifications were made under `src/`.

---

## 4. Conclusion

The "Missing Supabase environment variables" Root Layout crash is caused by **hardcoded empty string fallbacks (`''`) and non-null assertions (`!`) in `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, and `src/infrastructure/persistence/supabase/SupabaseClient.ts`**. When invoked by root client components (`NotificationProvider`, `Navbar`), calling `@supabase/ssr` functions with empty strings throws an unhandled exception that crashes the Root Layout.

### Concrete Fix Plan for Implementer
1. Update `src/lib/supabase/client.ts` to set `DEFAULT_SUPABASE_URL` and `DEFAULT_SUPABASE_ANON_KEY` to the project default values (`https://bxhlusdpmjldqbsdztyg.supabase.co` and valid anon key), matching `middleware.ts` and `env.config.ts`.
2. Update `src/lib/supabase/server.ts` to use the same default fallback values instead of `''`.
3. Update `src/infrastructure/persistence/supabase/SupabaseClient.ts` to remove non-null assertions (`!`) and use safe fallback values.
4. Harmonize `src/config/env.ts` with `src/config/env.config.ts`.
5. Wrap `createClient()` calls in `NotificationContext.tsx` and `Navbar.tsx` inside `try/catch` blocks for defensive initialization.

---

## 5. Verification Method

1. **Code Inspection Verification**:
   - Inspect `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, and `src/infrastructure/persistence/supabase/SupabaseClient.ts` to ensure no empty string defaults `''` or non-null assertions `!` are passed directly to `createBrowserClient` / `createServerClient`.
2. **Build Verification Command**:
   - Run `npm run build` locally without `NEXT_PUBLIC_SUPABASE_URL` in `.env` (or with empty values). Verify that static generation of Root Layout and pages succeeds without throwing `supabaseUrl is required.` / `Missing Supabase environment variables`.
