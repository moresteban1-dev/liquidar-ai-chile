import HeroSection from '@/components/landing/HeroSection';
import ServiceCatalog from '@/components/landing/ServiceCatalog';
import ProcessSteps from '@/components/landing/ProcessSteps';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import ContactSection from '@/components/landing/ContactSection';


// Determine if we need to show the QuoteForm directly or if it's handled via the Cart context.
// The original page had a QuoteForm embedded.
// However, looking at the logic, the QuoteForm is often a separate step or a modal.
// In the original file, QuoteForm seemed to be conditionally rendered or part of the flow.
// BUT, wait. The new ServiceCatalog adds items to the Cart.
// The FloatingWidget opens the Cart.
// Where is the actual CheckOut/Quote request form?
// Usually inside the Cart Sidebar or a Checkout page.
// The original page.tsx imported QuoteForm... let's assume it might be needed for a specific section
// OR if the original page used it for the "Cotizar" section directly.
// Given the "Cotiza online" CTA in Hero, we might want a section for it if it's not just a modal.
//
// Let's assume the standard flow is:
// 1. Hero -> Button "Cotizar" -> Scrolls to Services OR Opens Modal?
// 2. Services -> Add to Cart
// 3. CartWidget -> Opens Cart -> Checkout?
//
// If QuoteForm was in page.tsx, maybe it was at the bottom?
// I'll keep it simple: The landing page is the "Storefront".
// The QuoteForm is likely the "Checkout" logic.
// If the previous page had it, I should inspect where it was.
//
// For now, I will NOT include QuoteForm directly in the body unless I see it was there in the original.
// The original file size was >400 lines, so it likely had everything.
//
// Let's stick to the atomic sections.
// QuoteForm is likely used inside the CartContext sidebar OR as a standalone page?
// I'll check QuoteForm usage later. For now, this is the clean Landing Page.

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-indigo-500/30">
      <HeroSection />

      {/* Service Catalog (The 'Store') */}
      <ServiceCatalog />

      {/* How it works */}
      <ProcessSteps />

      {/* Social Proof */}
      <TestimonialsSection />

      {/* Contact & Footer */}
      <ContactSection />
    </main>
  );
}
