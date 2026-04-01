// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');

const f = 'c:/Users/Esteban/.gemini/antigravity/brain/518a021d-e3af-4bf3-9694-600a81e37da5/walkthrough.md';
let c = fs.readFileSync(f, 'utf8');

const s = `
## Sprint H: Security Hardening (All Complete ✅)

### H1: Rate Limiting Middleware
- Implemented \`src/middleware.ts\` for all \`/api/*\` routes.
- Configured 30 req/min globally and 10 req/min for Auth routes.
- Uses \`In-Memory Map\` fallback safely suited for Vercel Edge functions.

### H2: Content Security Policy (CSP)
- Validated existing \`Content-Security-Policy\` headers in \`next.config.ts\`.
- \`X-Frame-Options\`, \`Strict-Transport-Security\`, and domain-restricted fetching are active.

### H3: Audit Logging for Administration
- Integrated \`logSecurityEvent\` into high-risk admin actions.
- Automatically records \`SENSITIVE_DATA_ACCESS\` (Quote approvals/markup) and \`PLATFORM_CONFIG_CHANGED\` (Settings metadata updates).

### H4: Input XSS Sanitization
- Configured and installed \`sanitize-html\` with strict allowed-tags lists (\`src/lib/security/xss.ts\`).
- Added sanitization wrappers to provider bidding endpoints (\`providerNotes\` and \`item.concept\`) prior to processing or validation to prevent stored XSS.

---

### Verification (Sprint H)

| Check | Result |
|---|---|
| TypeScript (\`tsc --noEmit\`) | ✅ 0 errors |
| Dependency check | ✅ \`sanitize-html\` fully typed and isolated in utility library |
`;

fs.writeFileSync(f, c + '\n' + s, 'utf8');
console.log('Appended Sprint H to walkthrough');
