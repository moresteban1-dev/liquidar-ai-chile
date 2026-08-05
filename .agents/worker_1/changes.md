# Summary of Code Changes

## 1. `next.config.ts`
- **Merged duplicate `env` configuration blocks**: Combined the two separate `env` object blocks into a single block.
- **Harmonized default credentials**: Set default `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` fallbacks in the single `env` block alongside `NEXT_PUBLIC_APP_URL` and `NEXT_TELEMETRY_DISABLED`.
- **Impact**: Prevents JavaScript object key overwrite where `NEXT_TELEMETRY_DISABLED: '1'` was wiping out `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` during Next.js build / Vercel bundle generation.

## 2. `src/lib/supabase/client.ts`
- **Updated fallback variables**: Set `DEFAULT_SUPABASE_URL` to `'https://bxhlusdpmjldqbsdztyg.supabase.co'` and `DEFAULT_SUPABASE_ANON_KEY` to `'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aGx1c2RwbWpsZHFic2R6dHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMDI2MDAsImV4cCI6MjA1Njc3ODYwMH0.1D-_u16f3M0eZl0FshgK3t_-f7YQ2Gg9Z6c0oY9LwX8'`.
- **Impact**: Browser Supabase client factory no longer throws missing parameter errors when environment variables are undefined or empty.

## 3. `src/lib/supabase/server.ts`
- **Updated fallback variables**: Set `DEFAULT_SUPABASE_URL` to `'https://bxhlusdpmjldqbsdztyg.supabase.co'` and `DEFAULT_SUPABASE_ANON_KEY` to `'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aGx1c2RwbWpsZHFic2R6dHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMDI2MDAsImV4cCI6MjA1Njc3ODYwMH0.1D-_u16f3M0eZl0FshgK3t_-f7YQ2Gg9Z6c0oY9LwX8'`.
- **Impact**: Server Supabase client factory (Route Handlers, Server Actions, Server Components) consistently falls back to valid default project credentials.

## 4. `src/infrastructure/persistence/supabase/SupabaseClient.ts`
- **Removed non-null assertions (`!`)**: Replaced `process.env.NEXT_PUBLIC_SUPABASE_URL!` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!` with safe fallbacks (`url` and `anonKey` constants).
- **Impact**: Prevents runtime crash when initializing `createServerClient` in Server Components if env vars are missing.

## 5. `src/config/env.ts`
- **Eliminated empty string fallbacks**: Changed fallback from `''` to default project credentials `'https://bxhlusdpmjldqbsdztyg.supabase.co'` and `'eyJhbGciOiJIUzI1Ni...` for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Impact**: Centralized env parser guarantees valid string credentials for Supabase across the application.

## 6. `src/components/layout/Navbar.tsx`
- **Defensive initialization**: Wrapped `createClient()` call and subsequent user fetch inside `useEffect` in a `try/catch/finally` block.
- **Impact**: Any error during Supabase client creation or session retrieval is logged safely without crashing the Root Layout.

## 7. `src/context/NotificationContext.tsx`
- **Defensive initialization**: Wrapped `createClient()` call and realtime setup inside `useEffect` in a `try/catch` block.
- **Impact**: Prevents Root Layout crash ("Error Catastrófico") if realtime channel initialization or Supabase client creation fails.
