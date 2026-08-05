# Original User Request

## Initial Request — 2026-08-04T23:41:41Z

<USER_REQUEST>
# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

Diagnose and fix the "Missing Supabase environment variables" error occurring at the Root Layout level in the Vercel production deployment of Liquidar.cl.

Working directory: c:\Users\Esteban\Desktop\Liquidar Platform\platform
Integrity mode: benchmark

## Requirements

### R1. Diagnose the build/runtime environment mismatch
Analyze why `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are triggering a "Missing Supabase environment variables" error in the production build (Vercel) despite being configured in the Vercel dashboard.

### R2. Implement the fix
Modify `src/config/env.ts`, `layout.tsx`, or any related Supabase initialization code (`src/lib/supabase/client.ts`, `server.ts`) to ensure the application builds successfully and does not throw the environment variable error on the client or server.

## Acceptance Criteria

### Verification
- [ ] Running `npm run build` locally with missing or empty `NEXT_PUBLIC_SUPABASE_*` variables in `.env` behaves predictably (either building successfully and throwing handled errors on runtime, or failing the build with a clear, specific message).
- [ ] Code inspection confirms that `process.env.NEXT_PUBLIC_SUPABASE_URL` is correctly exposed and evaluated on both Server Components (like Root Layout) and Client Components.
- [ ] No "Error Catastrófico" (Root Layout crash) occurs when accessing the application.
</USER_REQUEST>
