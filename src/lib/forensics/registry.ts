/**
 * Forensic Error Registry
 *
 * Singleton in-memory store that captures, deduplicates, and indexes
 * every Server Component error before Next.js sanitizes it for production.
 *
 * @module lib/forensics/registry
 */

import { ForensicAnalyzer } from './analyzer';
import { logger } from '../../infrastructure/telemetry/StructuredLogger';

// ─── Types ─────────────────────────────────────────────────────

import { ErrorCategory } from './types';

export interface ForensicErrorRecord {
    id: string;
    digest: string;
    timestamp: string;

    errorName: string;
    errorMessage: string;
    stack: string | undefined;
    cause: unknown;

    path: string;
    method: string;
    routePath: string | null;
    routeType: string;
    renderSource: string | undefined;
    routerKind: string;
    headers: Record<string, string>;

    category: ErrorCategory;
    severity: 'low' | 'medium' | 'high' | 'critical';
    suggestedFixes: string[];
    relatedFiles: string[];
    occurrences: number;
    firstSeen: string;
    lastSeen: string;
}

export interface RawErrorCapture {
    error: Error & { digest?: string };
    digest: string;
    path: string;
    method: string;
    routePath: string | null;
    routeType: string;
    renderSource: string | undefined;
    routerKind: string;
    timestamp: string;
    headers: Record<string, string>;
    stack: string | undefined;
    cause: unknown;
}

export interface ForensicStats {
    totalUniqueErrors: number;
    totalOccurrences: number;
    categories: Record<string, number>;
    severities: Record<string, number>;
    mostFrequent: ForensicErrorRecord[];
    mostRecent: ForensicErrorRecord[];
    criticalErrors: ForensicErrorRecord[];
}

// ─── Implementation ────────────────────────────────────────────

class ForensicRegistryImpl {
    private errors: Map<string, ForensicErrorRecord> = new Map();
    private errorLog: RawErrorCapture[] = [];
    private readonly maxLogSize = 1000;
    private initialized = false;

    initialize(): void {
        if (this.initialized) return;
        this.initialized = true;

        // Guard: process.on is not available in Edge Runtime.
        // Turbopack statically analyzes this, so we need to check
        // for process.on existence at runtime to avoid build errors.
        if (typeof globalThis.process !== 'undefined' && typeof globalThis.process.on === 'function') {
            globalThis.process.on('uncaughtException', (error: Error) => {
                this.captureError({
                    error: error as Error & { digest?: string },
                    digest: (error as Error & { digest?: string }).digest ?? `uncaught-${Date.now()}`,
                    path: 'process',
                    method: 'INTERNAL',
                    routePath: null,
                    routeType: 'uncaught',
                    renderSource: undefined,
                    routerKind: 'App Router',
                    timestamp: new Date().toISOString(),
                    headers: {},
                    stack: error.stack,
                    cause: error.cause,
                });
            });

            globalThis.process.on('unhandledRejection', (reason: unknown) => {
                const error = reason instanceof Error ? reason : new Error(String(reason));
                this.captureError({
                    error: error as Error & { digest?: string },
                    digest: `unhandled-rejection-${Date.now()}`,
                    path: 'process',
                    method: 'INTERNAL',
                    routePath: null,
                    routeType: 'unhandled-rejection',
                    renderSource: undefined,
                    routerKind: 'App Router',
                    timestamp: new Date().toISOString(),
                    headers: {},
                    stack: error.stack,
                    cause: error.cause,
                });
            });
        }
    }

    captureError(capture: RawErrorCapture): void {
        const analysis = ForensicAnalyzer.analyze(capture as any);
        const existingKey = this.findExistingError(capture);

        if (existingKey && this.errors.has(existingKey)) {
            const existing = this.errors.get(existingKey)!;
            existing.occurrences += 1;
            existing.lastSeen = capture.timestamp;
            this.errors.set(existingKey, existing);
        } else {
            const record: ForensicErrorRecord = {
                id: `forensic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                digest: capture.digest,
                timestamp: capture.timestamp,
                errorName: capture.error.name,
                errorMessage: capture.error.message,
                stack: capture.stack,
                cause: this.serializeCause(capture.cause),
                path: capture.path,
                method: capture.method,
                routePath: capture.routePath,
                routeType: capture.routeType,
                renderSource: capture.renderSource,
                routerKind: capture.routerKind,
                headers: capture.headers,
                category: analysis.category,
                severity: analysis.severity,
                suggestedFixes: analysis.suggestedFixes,
                relatedFiles: analysis.relatedFiles,
                occurrences: 1,
                firstSeen: capture.timestamp,
                lastSeen: capture.timestamp,
            };
            this.errors.set(record.id, record);
        }

        this.errorLog.push(capture);
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(-this.maxLogSize);
        }

        this.printForensicReport(capture, analysis);
    }

    // ─── Queries ─────────────────────────────────────────────

    getByDigest(digest: string): ForensicErrorRecord | undefined {
        for (const record of this.errors.values()) {
            if (record.digest === digest) return record;
        }
        return undefined;
    }

    getAll(): ForensicErrorRecord[] {
        return Array.from(this.errors.values())
            .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
    }

    getByCategory(category: ErrorCategory): ForensicErrorRecord[] {
        return this.getAll().filter((r) => r.category === category);
    }

    getBySeverity(severity: string): ForensicErrorRecord[] {
        return this.getAll().filter((r) => r.severity === severity);
    }

    getStats(): ForensicStats {
        const all = this.getAll();
        const categories: Record<string, number> = {};
        const severities: Record<string, number> = {};
        let totalOccurrences = 0;

        for (const record of all) {
            categories[record.category] = (categories[record.category] ?? 0) + record.occurrences;
            severities[record.severity] = (severities[record.severity] ?? 0) + record.occurrences;
            totalOccurrences += record.occurrences;
        }

        return {
            totalUniqueErrors: all.length,
            totalOccurrences,
            categories,
            severities,
            mostFrequent: all.sort((a, b) => b.occurrences - a.occurrences).slice(0, 5),
            mostRecent: all.slice(0, 5),
            criticalErrors: all.filter((r) => r.severity === 'critical'),
        };
    }

    clear(): void {
        this.errors.clear();
        this.errorLog = [];
    }

    // ─── Internal ────────────────────────────────────────────

    private findExistingError(capture: RawErrorCapture): string | undefined {
        for (const [key, record] of this.errors) {
            if (
                record.errorMessage === capture.error.message &&
                record.path === capture.path &&
                record.routeType === capture.routeType
            ) {
                return key;
            }
        }
        return undefined;
    }

    private serializeCause(cause: unknown): unknown {
        if (!cause) return undefined;
        if (cause instanceof Error) {
            return {
                name: cause.name,
                message: cause.message,
                stack: cause.stack?.split('\n').slice(0, 5).join('\n'),
            };
        }
        try {
            return JSON.parse(JSON.stringify(cause));
        } catch {
            return String(cause);
        }
    }

    private printForensicReport(
        capture: RawErrorCapture,
        analysis: ReturnType<typeof ForensicAnalyzer.analyze>,
    ): void {
        const severityColors: Record<string, string> = {
            low: '\x1b[36m',
            medium: '\x1b[33m',
            high: '\x1b[31m',
            critical: '\x1b[35m',
        };

        const color = severityColors[analysis.severity] ?? '\x1b[37m';
        const reset = '\x1b[0m';
        const bold = '\x1b[1m';
        const dim = '\x1b[2m';

        logger.info('\n');
        logger.info(`${color}╔══════════════════════════════════════════════════════════════╗${reset}`);
        logger.info(`${color}║  🔬 FORENSIC ERROR CAPTURE                                  ║${reset}`);
        logger.info(`${color}╠══════════════════════════════════════════════════════════════╣${reset}`);
        logger.info(`${color}║${reset}  ${bold}Digest:${reset}     ${capture.digest}`);
        logger.info(`${color}║${reset}  ${bold}Category:${reset}   ${analysis.category}`);
        logger.info(`${color}║${reset}  ${bold}Severity:${reset}   ${color}${analysis.severity.toUpperCase()}${reset}`);
        logger.info(`${color}║${reset}  ${bold}Path:${reset}       ${capture.path}`);
        logger.info(`${color}║${reset}  ${bold}Route:${reset}      ${capture.routePath ?? 'unknown'}`);
        logger.info(`${color}║${reset}  ${bold}Type:${reset}       ${capture.routeType}`);
        logger.info(`${color}║${reset}  ${bold}Source:${reset}      ${capture.renderSource ?? 'unknown'}`);
        logger.info(`${color}╠══════════════════════════════════════════════════════════════╣${reset}`);
        logger.info(`${color}║${reset}  ${bold}Error:${reset}      ${capture.error.name}: ${capture.error.message.slice(0, 80)}`);

        if (capture.stack) {
            const stackLines = capture.stack.split('\n').slice(1, 6);
            logger.info(`${color}║${reset}  ${bold}Stack:${reset}`);
            for (const line of stackLines) {
                logger.info(`${color}║${reset}  ${dim}${line.trim()}${reset}`);
            }
        }

        logger.info(`${color}╠══════════════════════════════════════════════════════════════╣${reset}`);
        logger.info(`${color}║${reset}  ${bold}🔧 SUGGESTED FIXES:${reset}`);
        for (const fix of analysis.suggestedFixes) {
            logger.info(`${color}║${reset}    → ${fix}`);
        }

        if (analysis.relatedFiles.length > 0) {
            logger.info(`${color}║${reset}  ${bold}📁 RELATED FILES:${reset}`);
            for (const file of analysis.relatedFiles) {
                logger.info(`${color}║${reset}    → ${file}`);
            }
        }

        logger.info(`${color}╚══════════════════════════════════════════════════════════════╝${reset}`);
        logger.info('\n');
    }
}

/** Singleton Forensic Registry */
export const ForensicRegistry = new ForensicRegistryImpl();
