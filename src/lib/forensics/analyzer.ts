/**
 * Forensic Analyzer — Pattern-matching engine for RSC errors
 *
 * Contains a knowledge base of 12 error patterns built from
 * real production debugging. Each pattern provides classification,
 * severity, root cause hypothesis, and actionable fix suggestions.
 *
 * @module lib/forensics/analyzer
 */

import type { ErrorCategory } from './types';

// ─── Types ─────────────────────────────────────────────────────

export interface AnalysisResult {
    category: ErrorCategory;
    severity: 'low' | 'medium' | 'high' | 'critical';
    suggestedFixes: string[];
    relatedFiles: string[];
    rootCauseHypothesis: string;
}

interface ErrorPattern {
    test: (error: {
        message: string;
        name: string;
        stack?: string;
        path: string;
        routeType: string;
        renderSource?: string;
    }) => boolean;
    category: ErrorCategory;
    severity: 'low' | 'medium' | 'high' | 'critical';
    hypothesis: string;
    fixes: string[];
    filePatterns: string[];
}

// ═══════════════════════════════════════════════════════════════
// ERROR PATTERN KNOWLEDGE BASE
// ═══════════════════════════════════════════════════════════════

const ERROR_PATTERNS: ErrorPattern[] = [
    // ─── 1. SERIALIZATION ───────────────────────────────────
    {
        test: (e) =>
            e.message.includes('is not serializable') ||
            e.message.includes('cannot be serialized') ||
            e.message.includes('Only plain objects') ||
            e.message.includes('can be passed to Client Components from Server Components') ||
            e.message.includes('Functions cannot be passed directly'),
        category: 'SERIALIZATION',
        severity: 'high',
        hypothesis:
            'A Server Component is passing non-serializable data (functions, classes, Date, Map, Set) as props to a Client Component.',
        fixes: [
            'Convert Date objects to strings: date.toISOString()',
            'Convert Map/Set to Arrays: Array.from(map.entries())',
            'Convert class instances to plain objects: JSON.parse(JSON.stringify(obj))',
            'Move callbacks to Client Components using "use client"',
            'Use .toJSON() on Value Objects (Money, Deadline) before passing as props',
            'DDD Aggregates with methods CANNOT be props of Client Components',
        ],
        filePatterns: ['src/core/domain/aggregates/**/*.ts', 'app/**/page.tsx'],
    },

    // ─── 2. CLIENT BOUNDARY ─────────────────────────────────
    {
        test: (e) =>
            e.message.includes("'use client'") ||
            e.message.includes('use client') ||
            e.message.includes('useState') ||
            e.message.includes('useEffect') ||
            e.message.includes('useContext') ||
            e.message.includes('createContext') ||
            (e.message.includes('is not a function') && (e.stack?.includes('react') ?? false)),
        category: 'CLIENT_BOUNDARY',
        severity: 'high',
        hypothesis:
            'A component uses React hooks without the "use client" directive, or a Server Component imports a module that uses browser APIs.',
        fixes: [
            'Add "use client" at the top of the file that uses hooks',
            'Separate server and client logic into different files',
            'Create wrapper Client Components for interactive elements',
        ],
        filePatterns: ['app/**/page.tsx', 'src/components/**/*.tsx'],
    },

    // ─── 3. IMPORT RESOLUTION ──────────────────────────────
    {
        test: (e) =>
            e.message.includes('Module not found') ||
            e.message.includes('Cannot find module') ||
            e.message.includes("Can't resolve") ||
            e.message.includes('is not exported from') ||
            e.message.includes('does not provide an export named'),
        category: 'IMPORT_RESOLUTION',
        severity: 'critical',
        hypothesis:
            'A module cannot be found. Possible causes: wrong path alias, deleted file, default vs named export mismatch, or circular dependency.',
        fixes: [
            'Verify tsconfig.json paths aliases match next.config.ts',
            'Run: npx madge --circular --extensions ts src/',
            'Switch export default to named exports (Turbopack is strict)',
            'Verify the imported file exists and exports what is expected',
            'Check @/core/domain does not import from @/infrastructure (hexagonal violation)',
        ],
        filePatterns: ['tsconfig.json', 'next.config.ts', 'src/di/container.ts'],
    },

    // ─── 4. SUPABASE ───────────────────────────────────────
    {
        test: (e) =>
            e.message.toLowerCase().includes('supabase') ||
            e.message.includes('PGRST') ||
            e.message.includes('PostgrestError') ||
            e.message.includes('row-level security') ||
            e.message.includes('RLS') ||
            e.message.includes('permission denied') ||
            e.message.includes('violates row-level security'),
        category: 'SUPABASE',
        severity: 'critical',
        hypothesis:
            'Supabase connection or permission error. Common causes: RLS policies blocking access, expired JWT, missing columns, or using anon key where service_role is needed.',
        fixes: [
            'Verify RLS policies on the affected table',
            'Use service_role key in Server Components for RLS bypass when appropriate',
            'Verify session is active: supabase.auth.getUser()',
            'If "column" error: run migration to add the column',
            'Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set',
            'SUPABASE_SERVICE_ROLE_KEY must NEVER be NEXT_PUBLIC_',
        ],
        filePatterns: ['src/infrastructure/persistence/supabase/**/*.ts', '.env.local'],
    },

    // ─── 5. AUTHENTICATION ─────────────────────────────────
    {
        test: (e) =>
            e.message.includes('Unauthorized') ||
            e.message.includes('unauthorized') ||
            e.message.includes('not authenticated') ||
            e.message.includes('NEXT_REDIRECT'),
        category: 'AUTHENTICATION',
        severity: 'high',
        hypothesis:
            'Authentication error. User has no valid session, or auth middleware is redirecting before the Server Component can render.',
        fixes: [
            'NOTE: NEXT_REDIRECT is NOT a real error — it is Next.js redirect() mechanism',
            'Verify middleware.ts is protecting routes correctly',
            'In Server Components use: supabase.auth.getUser() (not getSession)',
            'Ensure auth cookies are passed correctly when creating Supabase client',
        ],
        filePatterns: ['middleware.ts', 'app/(auth)/**/*.tsx'],
    },

    // ─── 6. ENVIRONMENT ────────────────────────────────────
    {
        test: (e) =>
            (e.message.includes('undefined') && e.message.includes('Cannot read properties')) ||
            e.message.includes('NEXT_PUBLIC') ||
            e.message.includes('is not defined') ||
            e.message.includes('API_KEY'),
        category: 'ENVIRONMENT',
        severity: 'critical',
        hypothesis:
            'An environment variable is undefined or inaccessible. In production (Vercel), env vars are configured in the dashboard, not in .env.local.',
        fixes: [
            'Client variables must have NEXT_PUBLIC_ prefix',
            'Server-only variables must NOT have NEXT_PUBLIC_',
            'Verify in Vercel Dashboard → Settings → Environment Variables',
            'In Server Components, process.env.* works directly',
            'In Client Components, only process.env.NEXT_PUBLIC_* is available',
        ],
        filePatterns: ['.env.local', 'next.config.ts'],
    },

    // ─── 7. ASYNC COMPONENT ────────────────────────────────
    {
        test: (e) =>
            e.message.includes('Suspense') ||
            e.message.includes('suspended') ||
            e.message.includes('Loading chunk'),
        category: 'ASYNC_COMPONENT',
        severity: 'medium',
        hypothesis:
            'Error in async server component. Could be a failed fetch, DB timeout, or missing Suspense boundary.',
        fixes: [
            'Wrap async components with <Suspense fallback={...}>',
            'Add error.tsx in the same directory to catch errors',
            'Verify DB/API calls have a timeout',
            'Use Promise.all() for parallel queries instead of waterfall awaits',
        ],
        filePatterns: ['app/**/page.tsx', 'app/**/loading.tsx', 'app/**/error.tsx'],
    },

    // ─── 8. AI / GENKIT ────────────────────────────────────
    {
        test: (e) =>
            e.message.toLowerCase().includes('genkit') ||
            e.message.toLowerCase().includes('gemini') ||
            e.message.includes('GoogleAI') ||
            e.message.includes('LLM'),
        category: 'AI_GENKIT',
        severity: 'high',
        hypothesis:
            'AI pipeline error. Could be invalid API key, unavailable model, unexpected LLM response, or generation timeout.',
        fixes: [
            'Verify GOOGLE_GENAI_API_KEY is configured and valid',
            'Verify model exists: gemini-1.5-flash, gemini-1.5-pro',
            'Add timeout to AI calls (max 30 seconds)',
            'Validate LLM output with Zod schema BEFORE using it',
            'NEVER call Genkit from a Server Component without try/catch',
        ],
        filePatterns: ['src/infrastructure/ai/**/*.ts', '.env.local'],
    },

    // ─── 9. RSC VIOLATION ──────────────────────────────────
    {
        test: (e) =>
            e.message.includes('window') ||
            e.message.includes('document') ||
            e.message.includes('navigator') ||
            e.message.includes('localStorage') ||
            e.message.includes('sessionStorage'),
        category: 'RSC_VIOLATION',
        severity: 'high',
        hypothesis:
            'Browser code (window, document, localStorage) is executing in a Server Component. The server has no DOM.',
        fixes: [
            'Move code using window/document to a Client Component ("use client")',
            'Use dynamic import with ssr: false for browser-only libraries',
            "Example: const Chart = dynamic(() => import('./Chart'), { ssr: false })",
            'For localStorage: create a useLocalStorage hook in a Client Component',
        ],
        filePatterns: ['app/**/page.tsx', 'src/components/**/*.tsx'],
    },

    // ─── 10. CIRCULAR DEPENDENCY ───────────────────────────
    {
        test: (e) =>
            e.message.includes('circular') ||
            e.message.includes('Circular') ||
            e.message.includes('Cannot access') ||
            e.message.includes('before initialization'),
        category: 'CIRCULAR_DEPENDENCY',
        severity: 'critical',
        hypothesis:
            'Circular dependency detected. The DI Container or domain layer modules import each other. Turbopack is VERY strict about this.',
        fixes: [
            'Run: npx madge --circular --extensions ts src/',
            'DI Container is the most common cause: use lazy initialization',
            'Ports (interfaces) must NEVER import implementations',
            'src/core/ must NEVER import from src/infrastructure/',
            'Use dynamic imports: const x = await import("./module")',
        ],
        filePatterns: ['src/di/container.ts', 'src/core/ports/**/*.ts'],
    },

    // ─── 11. HYDRATION ─────────────────────────────────────
    {
        test: (e) =>
            e.message.includes('Hydration') ||
            e.message.includes('hydration') ||
            e.message.includes('server HTML') ||
            e.message.includes('mismatch'),
        category: 'HYDRATION',
        severity: 'medium',
        hypothesis:
            'Server-rendered HTML does not match client-rendered output. Common causes: Date.now(), Math.random(), or localStorage in render.',
        fixes: [
            'Do not use Date.now() or new Date() in component render',
            'Do not use Math.random() in render (use useId() for keys)',
            'Use suppressHydrationWarning for known dynamic content',
            'For timestamps: render in useEffect, not in initial render',
        ],
        filePatterns: ['src/components/**/*.tsx'],
    },

    // ─── 12. TYPE MISMATCH ─────────────────────────────────
    {
        test: (e) =>
            e.message.includes('ZodError') ||
            e.message.includes('validation') ||
            e.message.includes('invalid_type') ||
            (e.message.includes('Expected') && e.message.includes('received')),
        category: 'TYPE_MISMATCH',
        severity: 'medium',
        hypothesis:
            'Type validation error. A Zod schema rejected unexpected data, or env vars failed validation.',
        fixes: [
            'Review the failing Zod schema (error has details)',
            'Verify DB data matches expected schemas',
            'Use .safeParse() instead of .parse() for graceful handling',
            'Verify DB migrations are up to date',
        ],
        filePatterns: ['src/config/env.ts', 'src/core/domain/**/*.ts'],
    },
];

// ═══════════════════════════════════════════════════════════════
// ANALYZER
// ═══════════════════════════════════════════════════════════════

export class ForensicAnalyzer {
    static analyze(capture: {
        error: Error;
        path: string;
        routeType: string;
        renderSource?: string;
        stack?: string;
    }): AnalysisResult {
        const testInput = {
            message: capture.error.message,
            name: capture.error.name,
            ...(capture.stack ? { stack: capture.stack } : {}),
            path: capture.path,
            routeType: capture.routeType,
            ...(capture.renderSource ? { renderSource: capture.renderSource } : {}),
        };

        for (const pattern of ERROR_PATTERNS) {
            if (pattern.test(testInput)) {
                return {
                    category: pattern.category,
                    severity: pattern.severity,
                    suggestedFixes: pattern.fixes,
                    relatedFiles: this.resolveFilePatterns(pattern.filePatterns, capture),
                    rootCauseHypothesis: pattern.hypothesis,
                };
            }
        }

        return this.heuristicAnalysis(capture);
    }

    private static heuristicAnalysis(capture: {
        error: Error;
        path: string;
        stack?: string;
    }): AnalysisResult {
        const fixes: string[] = [
            'This error does not match any known pattern.',
            `Full error: ${capture.error.name}: ${capture.error.message}`,
            'Manual debug steps:',
            '1. Search the exact error message on Google/Stack Overflow',
            '2. Verify npm run build works locally',
            '3. Compare .env.local with production variables',
            '4. Check server logs in Vercel Dashboard → Deployments → Logs',
            '5. Try: NODE_ENV=production npm run build && npm start',
        ];

        const relatedFiles = this.extractFilesFromStack(capture.stack);

        return {
            category: 'UNKNOWN',
            severity: 'high',
            suggestedFixes: fixes,
            relatedFiles,
            rootCauseHypothesis: 'Unclassified error. Requires manual investigation.',
        };
    }

    private static resolveFilePatterns(
        patterns: string[],
        capture: { path: string; stack?: string },
    ): string[] {
        const files = new Set<string>();
        for (const p of patterns) files.add(p);
        for (const f of this.extractFilesFromStack(capture.stack)) files.add(f);
        return Array.from(files);
    }

    private static extractFilesFromStack(stack?: string): string[] {
        if (!stack) return [];

        const fileRegex = /(?:at\s+)?(?:.*?\s+\()?(?:file:\/\/)?([^:)]+\.(?:ts|tsx|js|jsx)):(\d+)/g;
        const files = new Set<string>();
        let match;

        while ((match = fileRegex.exec(stack)) !== null) {
            const filePath = match[1];
            const line = match[2];
            if (filePath && !filePath.includes('node_modules') && !filePath.includes('.next') && !filePath.includes('webpack')) {
                files.add(`${filePath}:${line}`);
            }
        }

        return Array.from(files);
    }

    /** Analyze aggregated error patterns for systemic recommendations */
    static analyzePatterns(
        errors: Array<{ category: ErrorCategory; path: string; timestamp: string }>,
    ): { patterns: string[]; recommendations: string[] } {
        const patterns: string[] = [];
        const recommendations: string[] = [];

        const categoryCounts: Record<string, number> = {};
        for (const e of errors) {
            categoryCounts[e.category] = (categoryCounts[e.category] ?? 0) + 1;
        }

        if ((categoryCounts['SERIALIZATION'] ?? 0) > 3) {
            patterns.push('PATTERN: Recurring serialization errors');
            recommendations.push(
                'Create a DTO layer between Domain Entities and Client Components. DDD aggregates must NEVER be direct props of Client Components.',
            );
        }

        if ((categoryCounts['CIRCULAR_DEPENDENCY'] ?? 0) > 0) {
            patterns.push('PATTERN: Circular dependency detected');
            recommendations.push(
                'MAX PRIORITY: Resolve circular dependencies. Run npx madge --circular --extensions ts src/ and refactor.',
            );
        }

        if ((categoryCounts['SUPABASE'] ?? 0) > 5) {
            patterns.push('PATTERN: Frequent Supabase errors');
            recommendations.push('Implement connection pooling and retry logic in the repository layer.');
        }

        if ((categoryCounts['ENVIRONMENT'] ?? 0) > 0) {
            patterns.push('PATTERN: Missing environment variables');
            recommendations.push('Implement Zod env validation at startup (src/config/env.ts).');
        }

        return { patterns, recommendations };
    }
}
