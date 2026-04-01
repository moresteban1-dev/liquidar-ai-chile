import { describe, it, expect } from 'vitest';
import { formatDate, parseRequirements } from './utils';

describe('Utility Functions (lib/utils)', () => {

    describe('formatDate', () => {
        it('should format a valid ISO date as DD/MM/YYYY', () => {
            const result = formatDate('2026-03-15T10:00:00Z');
            expect(result).toMatch(/15/);
            expect(result).toMatch(/03/);
            expect(result).toMatch(/2026/);
        });

        it('should return "Fecha inválida" for null', () => {
            expect(formatDate(null)).toBe('Fecha inválida');
        });

        it('should return "Fecha inválida" for undefined', () => {
            expect(formatDate(undefined)).toBe('Fecha inválida');
        });

        it('should return "Fecha inválida" for garbage string', () => {
            expect(formatDate('xyz-not-a-date')).toBe('Fecha inválida');
        });

        it('should return "Fecha inválida" for empty string', () => {
            expect(formatDate('')).toBe('Fecha inválida');
        });
    });

    describe('parseRequirements', () => {
        it('should extract tags from square brackets', () => {
            const result = parseRequirements('Need [Iluminación] and [Audio]');
            expect(result.tags).toEqual(['Iluminación', 'Audio']);
        });

        it('should return clean text without bracket contents', () => {
            const result = parseRequirements('Need [Iluminación] setup');
            expect(result.text).toBe('Need  setup');
        });

        it('should return empty tags for text without brackets', () => {
            const result = parseRequirements('Simple requirement');
            expect(result.tags).toEqual([]);
            expect(result.text).toBe('Simple requirement');
        });

        it('should handle null input', () => {
            const result = parseRequirements(null);
            expect(result).toEqual({ text: '', tags: [] });
        });

        it('should handle undefined input', () => {
            const result = parseRequirements(undefined);
            expect(result).toEqual({ text: '', tags: [] });
        });

        it('should handle empty string', () => {
            const result = parseRequirements('');
            expect(result).toEqual({ text: '', tags: [] });
        });

        it('should handle multiple consecutive tags', () => {
            const result = parseRequirements('[Tag1][Tag2][Tag3]');
            expect(result.tags).toEqual(['Tag1', 'Tag2', 'Tag3']);
        });
    });
});
