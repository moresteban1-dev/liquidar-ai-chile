/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { ClientOrdersClient } from '../app/client/orders/ClientOrdersClient';

// Mocking 'next/link' because it's used in the component
import { vi } from 'vitest';

vi.mock('next/link', () => {
    return {
        _esModule: true,
        default: ({ children, href }: { children: React.ReactNode; href: string }) => {
            return <a href={href}>{children}</a>;
        },
    };
});

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        refresh: vi.fn(),
        back: vi.fn()
    })
}));

// Mocking 'next/navigation' components if used (though Link is the main one here)
// Also mocking fetch since the page fetches orders on mount
global.fetch = vi.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
    })
) as unknown as typeof fetch;

describe('Client Orders Page Integration', () => {
    it('renders a "Nueva Cotización" button pointing to the Quote Wizard', async () => {
        render(<ClientOrdersClient orders={[]} />);

        // Strategy: Find a link/button with the correct text and href
        // Note: The current page has "Ver Cotizaciones" pointing to /client/quotations
        // We want to force a change to "Nueva Cotización" pointing to /client/quotations/request

        const newQuoteButton = await screen.findByRole('link', { name: /nueva cotizaci/i });

        expect(newQuoteButton).toBeInTheDocument();
        expect(newQuoteButton).toHaveAttribute('href', '/client/quotations/request');
    });
});
