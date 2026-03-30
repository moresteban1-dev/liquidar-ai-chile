/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import HeroSection from '../components/landing/HeroSection'; // Adjust path if needed

describe('Landing Page Integration', () => {
    it('renders a CTA button pointing to the Quote Wizard', () => {
        render(<HeroSection />);

        // Strategy: Find a link with the correct href
        const ctaLink = screen.getByRole('link', { name: /cotiz/i }); // Regex for "Cotizar", "Cotiza", etc.

        expect(ctaLink).toBeInTheDocument();
        expect(ctaLink).toHaveAttribute('href', '/client/quotations/request');
    });
});
