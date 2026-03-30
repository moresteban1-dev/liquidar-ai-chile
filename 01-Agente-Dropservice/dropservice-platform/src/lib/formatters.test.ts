import { describe, it, expect } from 'vitest';
import { formatCLP, formatDateShort, formatDateReadable, formatBytes } from './formatters';

describe('Formatting Utilities (lib/formatters)', () => {

    describe('formatCLP', () => {
        it('should format a standard amount as CLP currency', () => {
            const result = formatCLP(150000);
            // Should contain the numeric part with Chilean formatting (dot separator)
            expect(result).toContain('150.000');
        });

        it('should format zero correctly', () => {
            const result = formatCLP(0);
            expect(result).toContain('0');
        });

        it('should handle large amounts', () => {
            const result = formatCLP(1500000);
            expect(result).toContain('1.500.000');
        });

        it('should handle negative amounts', () => {
            const result = formatCLP(-50000);
            expect(result).toContain('50.000');
        });
    });

    describe('formatDateShort', () => {
        it('should format a valid ISO date as DD/MM/YYYY', () => {
            const result = formatDateShort('2026-03-15T10:00:00Z');
            // Chilean format: day/month/year
            expect(result).toMatch(/15/);
            expect(result).toMatch(/03/);
            expect(result).toMatch(/2026/);
        });

        it('should return "-" for null input', () => {
            expect(formatDateShort(null)).toBe('-');
        });

        it('should return "-" for undefined input', () => {
            expect(formatDateShort(undefined)).toBe('-');
        });

        it('should return "-" for empty string', () => {
            expect(formatDateShort('')).toBe('-');
        });

        it('should return "Fecha inválida" for garbage input', () => {
            expect(formatDateShort('not-a-date')).toBe('Fecha inválida');
        });
    });

    describe('formatDateReadable', () => {
        it('should format a valid ISO date in readable format', () => {
            const result = formatDateReadable('2026-03-15T10:00:00Z');
            // Should contain day, abbreviated month, and year
            expect(result).toMatch(/15/);
            expect(result).toMatch(/2026/);
        });

        it('should return "-" for null input', () => {
            expect(formatDateReadable(null)).toBe('-');
        });

        it('should return "-" for undefined input', () => {
            expect(formatDateReadable(undefined)).toBe('-');
        });

        it('should return "-" for invalid date string', () => {
            expect(formatDateReadable('not-a-date')).toBe('-');
        });
    });

    describe('formatBytes', () => {
        it('should format bytes under 1KB', () => {
            expect(formatBytes(500)).toBe('500 B');
        });

        it('should format bytes as KB', () => {
            expect(formatBytes(1536)).toBe('1.5 KB');
        });

        it('should format bytes as MB', () => {
            expect(formatBytes(1048576)).toBe('1.0 MB');
        });

        it('should format 0 bytes', () => {
            expect(formatBytes(0)).toBe('0 B');
        });

        it('should handle exact 1KB boundary', () => {
            expect(formatBytes(1024)).toBe('1.0 KB');
        });

        it('should handle large MB values', () => {
            expect(formatBytes(5242880)).toBe('5.0 MB');
        });
    });
});
