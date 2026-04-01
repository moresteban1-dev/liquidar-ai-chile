import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'Fecha inválida';
    try {
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) return 'Fecha inválida';

        return new Intl.DateTimeFormat('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    } catch (error) {
        console.warn('[Utils/formatDate] Excepción al parsear formato Intl:', error);
        return 'Fecha inválida';
    }
}

export function parseRequirements(text: string | null | undefined): { text: string; tags: string[] } {
    if (!text) return { text: '', tags: [] };

    const tags: string[] = [];
    const cleanText = text.replace(/\[(.*?)\]/g, (_match, content) => {
        tags.push(content);
        return '';
    }).trim();

    return { text: cleanText, tags };
}
