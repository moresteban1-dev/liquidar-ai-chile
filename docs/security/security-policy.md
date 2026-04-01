# Security Policy: Dropservice Platform

## 🛡️ Security Principles
1. **Zero Trust**: All inputs must be validated at the system boundary (Zod).
2. **Layered Defense**: RLS (Row Level Security) in Supabase is mandatory.
3. **Secret Hygiene**: NEVER commit `.env` files. Use Vercel Environment Variables.
4. **Least Privilege**: API keys must have the minimum required scope.

## 🔐 Authentication & Authorization
- Use Supabase Auth with PKCE flow.
- RBAC is enforced via middleware and database policies.
- Token refresh: Managed by `@supabase/ssr`.

## 📦 Dependency Management
- Weekly `npm audit`.
- High/Critical vulnerabilities must be fixed within 24 hours of detection.
- No legacy libraries (Node 18+ required).

## 📡 Data Protection
- HTTPS/TLS 1.3 enforced.
- Branded Types for sensitive IDs to prevent IDOR vulnerabilities.
- Automatic PII filtering in structural logs.
