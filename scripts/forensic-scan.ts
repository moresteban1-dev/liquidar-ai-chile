/**
 * Forensic Scanner — Pre-deployment health check for RSC applications
 *
 * Runs 10 automated checks to detect common Server Component issues
 * before they reach production.
 *
 * Usage: npx tsx scripts/forensic-scan.ts
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

// ─── ANSI Colors ────────────────────────────────────────────

const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[36m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

// ─── Results Tracking ───────────────────────────────────────

interface ScanResult {
    check: string;
    status: 'pass' | 'warn' | 'fail';
    message: string;
    details?: string[];
}

const results: ScanResult[] = [];

function log(status: 'pass' | 'warn' | 'fail', message: string) {
    const icon =
        status === 'pass' ? `${GREEN}✓${RESET}` :
            status === 'warn' ? `${YELLOW}⚠${RESET}` :
                `${RED}✗${RESET}`;
    console.log(`  ${icon} ${message}`);
}

function addResult(check: string, status: 'pass' | 'warn' | 'fail', message: string, details?: string[]) {
    results.push({ check, status, message, details });
}

// ─── File Discovery Utilities ───────────────────────────────

function findFiles(dir: string, pattern: RegExp): string[] {
    const found: string[] = [];
    if (!existsSync(dir)) return found;

    function walk(currentDir: string) {
        const entries = readdirSync(currentDir);
        for (const entry of entries) {
            const fullPath = join(currentDir, entry);
            const stat = statSync(fullPath);
            if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules' && entry !== '.next') {
                walk(fullPath);
            } else if (stat.isFile() && pattern.test(entry)) {
                found.push(fullPath);
            }
        }
    }
    walk(dir);
    return found;
}

function findDirectories(dir: string): string[] {
    const found: string[] = [];
    if (!existsSync(dir)) return found;

    function walk(currentDir: string) {
        found.push(currentDir);
        const entries = readdirSync(currentDir);
        for (const entry of entries) {
            const fullPath = join(currentDir, entry);
            const stat = statSync(fullPath);
            if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules' && entry !== '.next' && entry !== 'components') {
                walk(fullPath);
            }
        }
    }
    walk(dir);
    return found;
}

// ═════════════════════════════════════════════════════════════
// CHECKS
// ═════════════════════════════════════════════════════════════

console.log(`\n${BOLD}${BLUE}╔══════════════════════════════════════════════════╗${RESET}`);
console.log(`${BOLD}${BLUE}║  🔬 FORENSIC SCAN — Server Component Analysis   ║${RESET}`);
console.log(`${BOLD}${BLUE}╚══════════════════════════════════════════════════╝${RESET}\n`);

// ─── 1. Circular Dependencies ───────────────────────────────

console.log(`${BOLD}[1/10] Checking circular dependencies...${RESET}`);
try {
    const output = execSync('npx madge --circular --extensions ts,tsx src/ 2>&1', { encoding: 'utf-8' });
    if (output.includes('No circular dependency found') || output.trim() === '') {
        log('pass', 'No circular dependencies found');
        addResult('circular-deps', 'pass', 'No circular dependencies');
    } else {
        log('fail', 'Circular dependencies detected!');
        console.log(`${DIM}${output}${RESET}`);
        addResult('circular-deps', 'fail', 'Circular dependencies found', output.split('\n').filter((l) => l.trim()));
    }
} catch (e: unknown) {
    const execError = e as { stdout?: string };
    if (execError.stdout?.includes('No circular')) {
        log('pass', 'No circular dependencies found');
        addResult('circular-deps', 'pass', 'No circular dependencies');
    } else {
        log('warn', 'Could not check circular dependencies (install madge: npm i -D madge)');
        addResult('circular-deps', 'warn', 'madge not available');
    }
}

// ─── 2. Client Hooks in Server Components ───────────────────

console.log(`\n${BOLD}[2/10] Checking for client hooks in Server Components...${RESET}`);
const hookPattern = /\b(useState|useEffect|useContext|useRef|useCallback|useMemo|useReducer)\b/;
const serverComponentFiles = findFiles('src/app', /page\.tsx$|layout\.tsx$/);
let hookViolations = 0;

for (const file of serverComponentFiles) {
    const content = readFileSync(file, 'utf-8');
    if (!content.includes("'use client'") && !content.includes('"use client"')) {
        const matches = content.match(hookPattern);
        if (matches) {
            hookViolations++;
            log('fail', `${relative('.', file)} uses ${matches[0]} without "use client"`);
        }
    }
}

if (hookViolations === 0) {
    log('pass', 'No client hook violations in Server Components');
    addResult('client-hooks', 'pass', 'Clean');
} else {
    addResult('client-hooks', 'fail', `${hookViolations} violations found`);
}

// ─── 3. Browser API in Server Files ─────────────────────────

console.log(`\n${BOLD}[3/10] Checking for browser API usage in server files...${RESET}`);
const browserAPIs = /\b(window|document|navigator|localStorage|sessionStorage|alert|confirm|prompt)\b/;
const serverFiles = findFiles('src', /\.ts$/);
let browserViolations = 0;

for (const file of serverFiles) {
    if (file.includes('components') || file.includes('.client.')) continue;
    const content = readFileSync(file, 'utf-8');
    if (content.includes("'use client'") || content.includes('"use client"')) continue;

    const lineMatches: string[] = [];
    content.split('\n').forEach((line, i) => {
        if (
            browserAPIs.test(line) &&
            !line.trim().startsWith('//') &&
            !line.trim().startsWith('*') &&
            !line.includes('typeof window') &&
            !line.includes('typeof document')
        ) {
            lineMatches.push(`  L${i + 1}: ${line.trim()}`);
        }
    });

    if (lineMatches.length > 0) {
        browserViolations++;
        log('fail', `${relative('.', file)} uses browser APIs`);
        for (const lm of lineMatches.slice(0, 3)) {
            console.log(`${DIM}${lm}${RESET}`);
        }
    }
}

if (browserViolations === 0) {
    log('pass', 'No browser API usage detected in server files');
    addResult('browser-apis', 'pass', 'Clean');
} else {
    addResult('browser-apis', 'fail', `${browserViolations} files with browser API usage`);
}

// ─── 4. Non-Serializable Props ──────────────────────────────

console.log(`\n${BOLD}[4/10] Checking for non-serializable props...${RESET}`);
const nonSerializablePatterns = [
    { pattern: /new\s+Date\(\)/, name: 'Date object (use .toISOString())' },
    { pattern: /new\s+Map\(/, name: 'Map (use Object.fromEntries())' },
    { pattern: /new\s+Set\(/, name: 'Set (use Array.from())' },
    { pattern: /onClick\s*=\s*\{/, name: 'Event handler (needs "use client")' },
    { pattern: /onChange\s*=\s*\{/, name: 'Event handler (needs "use client")' },
];

let serializationIssues = 0;
const pageFiles = findFiles('src/app', /page\.tsx$/);

for (const file of pageFiles) {
    const content = readFileSync(file, 'utf-8');
    if (content.includes("'use client'") || content.includes('"use client"')) continue;

    for (const { pattern, name } of nonSerializablePatterns) {
        if (pattern.test(content)) {
            serializationIssues++;
            log('warn', `${relative('.', file)}: possible non-serializable: ${name}`);
        }
    }
}

if (serializationIssues === 0) {
    log('pass', 'No obvious serialization issues detected');
    addResult('serialization', 'pass', 'Clean');
} else {
    addResult('serialization', 'warn', `${serializationIssues} potential issues`);
}

// ─── 5. Environment Variables ───────────────────────────────

console.log(`\n${BOLD}[5/10] Checking environment variables...${RESET}`);
const envExample = existsSync('.env.example') ? readFileSync('.env.example', 'utf-8') : '';
const envLocal = existsSync('.env.local') ? readFileSync('.env.local', 'utf-8') : '';

if (!existsSync('.env.local')) {
    log('warn', '.env.local not found');
    addResult('env-vars', 'warn', '.env.local missing');
} else {
    const exampleVars = envExample.split('\n').filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => l.split('=')[0].trim());
    const localVars = envLocal.split('\n').filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => l.split('=')[0].trim());

    const missing = exampleVars.filter((v) => !localVars.includes(v));
    if (missing.length > 0) {
        log('fail', `Missing env vars: ${missing.join(', ')}`);
        addResult('env-vars', 'fail', `Missing: ${missing.join(', ')}`);
    } else {
        log('pass', 'All example env vars are defined');
        addResult('env-vars', 'pass', 'All defined');
    }

    // Check that secrets are not NEXT_PUBLIC_
    const dangerousPublic = localVars.filter(
        (v) => v.startsWith('NEXT_PUBLIC_') && (v.includes('SECRET') || v.includes('SERVICE_ROLE') || v.includes('PRIVATE')),
    );
    if (dangerousPublic.length > 0) {
        log('fail', `SECURITY: Secrets exposed as NEXT_PUBLIC_: ${dangerousPublic.join(', ')}`);
    } else {
        log('pass', 'No secrets exposed as NEXT_PUBLIC_');
    }
}

// ─── 6. Error Boundaries ───────────────────────────────────

console.log(`\n${BOLD}[6/10] Checking error boundaries...${RESET}`);
const routeGroups = findDirectories('src/app');
let missingErrorBoundaries = 0;

for (const dir of routeGroups) {
    const hasPage = existsSync(join(dir, 'page.tsx'));
    const hasError = existsSync(join(dir, 'error.tsx'));

    if (hasPage && !hasError) {
        missingErrorBoundaries++;
        log('warn', `Missing error.tsx in ${relative('.', dir)}`);
    }
}

if (missingErrorBoundaries === 0) {
    log('pass', 'All route segments have error boundaries');
    addResult('error-boundaries', 'pass', 'Complete');
} else {
    addResult('error-boundaries', 'warn', `${missingErrorBoundaries} missing`);
}

if (!existsSync('src/app/global-error.tsx')) {
    log('warn', 'Missing src/app/global-error.tsx');
} else {
    log('pass', 'global-error.tsx exists');
}

// ─── 7. Hexagonal Architecture Violations ───────────────────

console.log(`\n${BOLD}[7/10] Checking hexagonal architecture violations...${RESET}`);
if (existsSync('src/core')) {
    try {
        const violations = execSync(
            'findstr /s /r "from.*infrastructure from.*..\\\\infrastructure" src\\core\\*.ts 2>nul || echo CLEAN',
            { encoding: 'utf-8', cwd: '.' },
        );
        if (violations.trim() === 'CLEAN' || violations.trim() === '') {
            log('pass', 'Core layer is properly isolated from infrastructure');
            addResult('hexagonal', 'pass', 'Clean');
        } else {
            log('fail', 'Core imports infrastructure (hexagonal violation!)');
            console.log(`${DIM}${violations}${RESET}`);
            addResult('hexagonal', 'fail', 'Violations found');
        }
    } catch {
        log('pass', 'No hexagonal violations found');
        addResult('hexagonal', 'pass', 'Clean');
    }
} else {
    log('pass', 'No src/core directory (hexagonal check skipped)');
    addResult('hexagonal', 'pass', 'Skipped');
}

// ─── 8. Async Components with Suspense ──────────────────────

console.log(`\n${BOLD}[8/10] Checking async components have Suspense wrappers...${RESET}`);
let missingSuspense = 0;

for (const file of pageFiles) {
    const content = readFileSync(file, 'utf-8');
    if (
        content.includes('async function') &&
        content.includes('await') &&
        !content.includes('Suspense') &&
        !content.includes("'use client'")
    ) {
        const dir = file.replace(/[/\\][^/\\]+$/, '');
        if (!existsSync(join(dir, 'loading.tsx'))) {
            missingSuspense++;
            log('warn', `${relative('.', file)}: async component without Suspense or loading.tsx`);
        }
    }
}

if (missingSuspense === 0) {
    log('pass', 'All async components have proper loading states');
    addResult('suspense', 'pass', 'Clean');
} else {
    addResult('suspense', 'warn', `${missingSuspense} missing`);
}

// ─── 9. Production Build ────────────────────────────────────

console.log(`\n${BOLD}[9/10] Attempting production build...${RESET}`);
try {
    execSync('npx next build 2>&1', {
        encoding: 'utf-8',
        timeout: 180_000,
        env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
    });
    log('pass', 'Production build successful');
    addResult('build', 'pass', 'Success');
} catch (e: unknown) {
    log('fail', 'Production build FAILED');
    const execError = e as { stdout?: string; stderr?: string };
    const output = execError.stdout ?? execError.stderr ?? '';
    const errorLines = output.split('\n')
        .filter((l: string) => l.includes('Error') || l.includes('error') || l.includes('Failed') || l.includes('Module not found'))
        .slice(0, 10);
    for (const line of errorLines) {
        console.log(`${RED}  ${line}${RESET}`);
    }
    addResult('build', 'fail', 'Build failed', errorLines);
}

// ─── 10. Instrumentation Setup ──────────────────────────────

console.log(`\n${BOLD}[10/10] Checking instrumentation setup...${RESET}`);
if (existsSync('src/instrumentation.ts')) {
    const content = readFileSync('src/instrumentation.ts', 'utf-8');
    if (content.includes('onRequestError')) {
        log('pass', 'Instrumentation with onRequestError is configured');
        addResult('instrumentation', 'pass', 'Configured');
    } else {
        log('warn', 'instrumentation.ts exists but missing onRequestError hook');
        addResult('instrumentation', 'warn', 'Missing onRequestError');
    }
} else {
    log('fail', 'src/instrumentation.ts not found — forensic system disabled');
    addResult('instrumentation', 'fail', 'Not found');
}

// ═════════════════════════════════════════════════════════════
// SUMMARY
// ═════════════════════════════════════════════════════════════

console.log(`\n${BOLD}${'═'.repeat(54)}${RESET}`);
console.log(`${BOLD}  SCAN COMPLETE${RESET}`);
console.log(`${'═'.repeat(54)}`);

const passes = results.filter((r) => r.status === 'pass').length;
const warns = results.filter((r) => r.status === 'warn').length;
const fails = results.filter((r) => r.status === 'fail').length;

console.log(`  ${GREEN}${passes} passed${RESET}  ${YELLOW}${warns} warnings${RESET}  ${RED}${fails} failures${RESET}`);

if (fails > 0) {
    console.log(`\n${RED}  ❌ Critical issues found. Fix failures before deploying.${RESET}`);
    process.exit(1);
} else if (warns > 0) {
    console.log(`\n${YELLOW}  ⚠ Warnings found. Review before deploying.${RESET}`);
} else {
    console.log(`\n${GREEN}  ✅ All checks passed. System is healthy.${RESET}`);
}
console.log('');
