# Security Policy

## Supported Versions

Use the latest version of the DropService Platform to ensure you have the latest security patches.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a vulnerability, please follow these steps:

1. **Do NOT create a public GitHub issue.**
2. Email our security team at `security@dropservice.com` (or the generic contact).
3. Include a proof of concept (PoC) if possible.
4. We will respond within 48 hours.

## Secret Rotation Policy

To maintain a secure environment, we rotate critical secrets on a quarterly basis (every 3 months) or immediately upon a suspected compromise.

| Secret Type | Rotation Schedule | Responsible |
| ----------- | ----------------- | ----------- |
| Database Passwords | Quarterly | DevOps |
| Service Role Keys (Supabase) | Quarterly | Backend Lead |
| API Keys (Google, Stripe) | Quarterly | Backend Lead |
| JWT Signing Secrets | Bi-Annually | Architect |

## Incident Response Plan (Basic)

1. **Identify**: Confirm the breach and its scope.
2. **Contain**: Revoke compromised keys, take affected services offline if necessary.
3. **Eradicate**: Patch the vulnerability, sanitize data.
4. **Recover**: Restore services, verify integrity.
5. **Post-Mortem**: Document root cause and prevent recurrence.

## Key Security Controls

- **CSP**: Enforced via `next.config.ts`.
- **HSTS**: Strict Transport Security enabled.
- **Rate Limiting**: Applied to Auth and AI endpoints.
- **Input Validation**: Zod-based validation for all inputs.
- **SQL Injection**: Prevented via ORM/Query Builders (Supabase/Prisma).
